const GroqAnalysisService = require('./groqAnalysisService');
const logger = require('../utils/logger');
const adminSettingsService = require('./adminSettingsService');
const aiJson = require('../utils/aiJson');
const clustering = require('density-clustering');
const aiProviderService = require('./aiProviderService');
const { withCache } = require('./simpleCache');
const AI_DEBUG = process.env.AI_DEBUG === 'true';

class StoryClusteringService extends GroqAnalysisService {
  constructor() {
    super();
    // Only keep cache - all other settings loaded dynamically from admin settings
    this.embeddingCache = new Map();
  }

  /**
   * Apply topic allowlist, event-only filter and coherence guard
   * @param {Object} cluster
   * @param {Object} ctx { settings, minArticlesToPublish, minUniqueSources }
   * @returns {Object|null} pruned cluster or null if dropped
   */
  async applyGuardsToCluster(cluster, ctx) {
    const { settings } = ctx || {};
    const cs = settings || (await adminSettingsService.getClusterSettings());

    let articles = (cluster.articles || []).slice();
    const startCount = articles.length;
    let removedByTopics = 0;
    let removedByEvent = 0;
    let removedByTime = 0;
    let removedByCoherence = 0;

    // 1) Topic allowlist and event-only filtering (cheap heuristics)
    const beforeTopics = articles.length;
    articles = articles.filter(a => this.isArticleAllowedByTopic(a, cs));
    removedByTopics = beforeTopics - articles.length;
    if (cs.eventOnlyEnabled) {
      const beforeEvent = articles.length;
      articles = articles.filter(a => this.isLikelyEvent(a));
      removedByEvent = beforeEvent - articles.length;
    }

    // 2) Time coherence: restrict to newest N days
    if (Number(cs.maxTimeSpanDays) > 0) {
      const beforeTime = articles.length;
      articles = this.filterByTimeSpan(articles, Number(cs.maxTimeSpanDays));
      removedByTime = beforeTime - articles.length;
    }

    // If too few remain, drop early (or keep cluster shell for shadow logging)
    if ((articles?.length || 0) < 1) {
      return null;
    }

    // 3) Coherence guard using centroid similarity over embeddings
    if (cs.coherenceGuardEnabled) {
      const toScore = articles.slice(0);
      const embeddings = await Promise.all(toScore.map(a => this.generateEmbedding(a)));
      const centroid = this.computeCentroid(embeddings);
      const scored = toScore.map((a, i) => ({
        article: a,
        score: this.calculateCosineSimilarity(embeddings[i], centroid)
      }));

      const threshold = Number(cs.coherenceMinScore ?? 0.65);
      const kept = scored.filter(s => s.score >= threshold).map(s => s.article);
      const removed = scored.filter(s => s.score < threshold).map(s => ({
        title: (s.article?.title || '').slice(0, 120),
        score: Number(s.score?.toFixed(3) || 0)
      }));
      removedByCoherence = removed.length;

      if (cs.coherenceGuardShadowMode) {
        if (removed.length > 0) {
          logger.info(`[CoherenceGuard:shadow] cluster ${cluster.id} would remove ${removed.length} articles below ${threshold}:`, removed);
        }
      } else {
        articles = kept;
      }
    }

    // Log concise metrics when removals occurred
    const totalRemoved = removedByTopics + removedByEvent + removedByTime + removedByCoherence;
    if (AI_DEBUG || totalRemoved > 0) {
      logger.info(`[Guards] cluster ${cluster.id || 'n/a'}: start=${startCount} -> end=${articles?.length || 0} | topics=${removedByTopics} event=${removedByEvent} time=${removedByTime} coherence=${removedByCoherence}`);
    }

    // Return pruned cluster
    if (!articles || articles.length === 0) return null;
    return {
      ...cluster,
      articles,
      article_count: articles.length
    };
  }

  /**
   * Heuristic topic allowlist check against title/summary/content
   */
  isArticleAllowedByTopic(article, cs) {
    const allowed = Array.isArray(cs?.allowedTopics) ? cs.allowedTopics : [];
    if (allowed.length === 0) return true;
    const aliases = cs?.topicAliases || {};
    const hay = `${article.title || ''} ${article.summary || ''} ${article.content || ''}`.toLowerCase();
    // Build candidate keywords: allowed + alias keys + values
    const aliasKeys = Object.keys(aliases || {});
    const aliasVals = Object.values(aliases || {});
    const terms = new Set([
      ...allowed.map(t => String(t).toLowerCase()),
      ...aliasKeys.map(t => String(t).toLowerCase()),
      ...aliasVals.map(t => String(t).toLowerCase())
    ]);
    for (const term of terms) {
      if (term && hay.includes(term)) return true;
    }
    return false;
  }

  /**
   * Simple event detector using keywords
   */
  isLikelyEvent(article) {
    const text = `${article.title || ''} ${article.summary || ''} ${article.content || ''}`.toLowerCase();
    const keywords = [
      'attack', 'strike', 'airstrike', 'rocket', 'missile', 'explosion', 'blast', 'protest', 'clashes', 'clash',
      'killed', 'dead', 'wounded', 'injured', 'ceasefire', 'truce', 'sanction', 'sanctions', 'arrest', 'raid',
      'shooting', 'offensive', 'offensive launched', 'incursion', 'evacuation', 'bombing', 'shelling', 'escalation'
    ];
    return keywords.some(k => text.includes(k));
  }

  /**
   * Filter articles to within N days of the newest
   */
  filterByTimeSpan(articles, days) {
    const withDates = (articles || []).map(a => ({
      a,
      d: a?.published_at || a?.date_created || null
    })).filter(x => !!x.d);
    if (withDates.length < 2) return articles;
    const newest = new Date(Math.max(...withDates.map(x => new Date(x.d).getTime())));
    const cutoff = new Date(newest.getTime() - (days * 24 * 60 * 60 * 1000));
    return articles.filter(a => {
      const ds = a?.published_at || a?.date_created || null;
      if (!ds) return true; // keep if no date
      const d = new Date(ds);
      return d >= cutoff;
    });
  }

  /**
   * Compute centroid (mean) vector of embeddings
   */
  computeCentroid(embeddings) {
    if (!embeddings || embeddings.length === 0) return [];
    const dim = embeddings[0]?.length || 0;
    const centroid = new Array(dim).fill(0);
    for (const vec of embeddings) {
      for (let i = 0; i < dim; i++) centroid[i] += (vec?.[i] || 0);
    }
    for (let i = 0; i < dim; i++) centroid[i] /= embeddings.length;
    return centroid;
  }

  /**
   * Generate embedding for article content using Groq
   * @param {Object} article - Article object with title, content, summary
   * @returns {Array} Embedding vector
   */
  async generateEmbedding(article) {
    if (!(await this.isGroqAvailable())) {
      return this.getFallbackEmbedding();
    }

    const cacheKey = `${article.id || article.title}_${article.date_created || Date.now()}`;
    
    // Check cache first
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    try {
      await this.ensureGroq();
      const text = this.prepareTextForEmbedding(article);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a text analysis system. Convert the given text into a numerical representation that captures its semantic meaning. Focus on the main topics, entities, and key concepts."
          },
          {
            role: "user",
            content: `Generate a semantic embedding for this news article. Return only a JSON array of 384 numbers between -1 and 1:

Title: ${article.title}
Summary: ${article.summary || ''}
Content: ${text}

Respond with only the embedding array in this format: [0.1, -0.2, 0.3, ...]`
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content.trim();
      let embedding;
      
      try {
        embedding = JSON.parse(response);
        if (!Array.isArray(embedding) || embedding.length === 0) {
          throw new Error('Invalid embedding format');
        }
      } catch (parseError) {
        // Fallback: create embedding from text hash
        embedding = this.createHashBasedEmbedding(text);
      }

      // Cache the embedding
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
      
    } catch (error) {
      logger.error('Groq embedding generation failed:', error);
      return this.createHashBasedEmbedding(this.prepareTextForEmbedding(article));
    }
  }

  /**
   * Prepare article text for embedding generation
   * @param {Object} article - Article object
   * @returns {string} Prepared text
   */
  prepareTextForEmbedding(article) {
    const title = article.title || '';
    const summary = article.summary || '';
    const content = article.content ? article.content.substring(0, 2000) : '';
    
    // Remove HTML tags and clean text
    const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return `${title} ${summary} ${cleanContent}`.trim();
  }

  /**
   * Create hash-based embedding as fallback
   * @param {string} text - Text to create embedding for
   * @returns {Array} Fallback embedding vector
   */
  createHashBasedEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    // Simple hash-based embedding
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const position = Math.abs(hash) % 384;
      embedding[position] += 1 / (index + 1); // Weight by position
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Simple hash function for strings
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array} embedding1 - First embedding vector
   * @param {Array} embedding2 - Second embedding vector
   * @returns {number} Similarity score (0-1)
   */
  calculateCosineSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    const similarity = dotProduct / (magnitude1 * magnitude2);
    return Math.max(0, Math.min(1, (similarity + 1) / 2)); // Normalize to 0-1
  }

  /**
   * Cluster articles based on similarity
   * @param {Array} articles - Array of article objects
   * @param {number} threshold - Similarity threshold (0-1)
   * @returns {Array} Array of clusters
   */
  async clusterArticles(articles, options = {}) {
    // Load cluster settings from admin settings FIRST - hot-reload without restart
    const settings = await adminSettingsService.getClusterSettings();
    
    // Use local variables with fresh values from admin settings
    const threshold = options.threshold 
      ?? settings.similarityThreshold 
      ?? 0.88; // Default if admin settings missing
    
    const maxClusterSize = options.maxClusterSize 
      ?? settings.maxClusterSize 
      ?? 20;
    
    const minArticlesToPublish = options.minArticlesToPublish 
      ?? settings.minArticlesToPublish 
      ?? 2;
    
    const minUniqueSources = options.minUniqueSources 
      ?? settings.minUniqueSources 
      ?? 2;
    if (!articles || articles.length < 2) {
      return articles.map(article => ({ 
        id: this.generateClusterId(),
        articles: [article],
        similarity_scores: [1.0],
        cluster_title: article.title,
        article_count: 1
      }));
    }

    logger.info(`Clustering ${articles.length} articles with threshold ${threshold}`);

    // Generate embeddings for all articles
    const embeddings = await Promise.all(
      articles.map(article => this.generateEmbedding(article))
    );

    // Calculate similarity matrix
    const similarities = this.calculateSimilarityMatrix(embeddings);

    // Form clusters using similarity threshold
    const clusters = this.formClusters(articles, similarities, threshold)
      .map(cluster => {
        // Enforce max cluster size by trimming
        if (maxClusterSize && cluster.articles.length > maxClusterSize) {
          return {
            ...cluster,
            articles: cluster.articles.slice(0, maxClusterSize),
            similarity_scores: cluster.similarity_scores.slice(0, maxClusterSize),
            article_indices: (cluster.article_indices || []).slice(0, maxClusterSize)
          };
        }
        return cluster;
      })
      // Enforce minimum articles to publish
      .filter(c => (c.articles?.length || 0) >= minArticlesToPublish)
      // Enforce minimum unique sources for quality
      .filter(c => {
        const sources = new Set();
        (c.articles || []).forEach(a => {
          const source = a.source_name || a.author_name || 'unknown';
          sources.add(source.toLowerCase().trim());
        });
        return sources.size >= minUniqueSources;
      });

    // Apply topic/event filtering and coherence guard before enhancement
    const guardedClusters = (await Promise.all(
      clusters.map(c => this.applyGuardsToCluster(c, {
        settings,
        minArticlesToPublish,
        minUniqueSources
      }))
    ))
      .filter(Boolean)
      // Re-validate after pruning
      .filter(c => (c.articles?.length || 0) >= minArticlesToPublish)
      .filter(c => {
        const sources = new Set();
        (c.articles || []).forEach(a => {
          const source = a.source_name || a.author_name || 'unknown';
          sources.add((source || 'unknown').toLowerCase().trim());
        });
        return sources.size >= minUniqueSources;
      });

    // Enhance clusters with analysis
    const enhancedClusters = await Promise.all(
      guardedClusters.map(cluster => this.enhanceCluster(cluster))
    );

    logger.info(`Created ${enhancedClusters.length} clusters from ${articles.length} articles`);

    return enhancedClusters;
  }

  /**
   * Cluster articles using DBSCAN algorithm (density-based clustering)
   * Better than cosine similarity for handling outliers and varying cluster densities
   * @param {Array} articles - Array of article objects
   * @param {Object} options - Clustering options
   * @returns {Array} Array of clusters
   */
  async clusterArticlesDBSCAN(articles, options = {}) {
    // Load cluster settings from admin settings
    const settings = await adminSettingsService.getClusterSettings();
    
    // DBSCAN parameters
    const eps = options.eps ?? settings.dbscanEps ?? 1.05;
    const minSamples = options.minSamples ?? settings.dbscanMinSamples ?? 3;
    
    // Other settings
    const maxClusterSize = options.maxClusterSize ?? settings.maxClusterSize ?? 20;
    const minArticlesToPublish = options.minArticlesToPublish ?? settings.minArticlesToPublish ?? 2;
    const minUniqueSources = options.minUniqueSources ?? settings.minUniqueSources ?? 2;
    
    if (!articles || articles.length < 2) {
      return articles.map(article => ({
        id: this.generateClusterId(),
        articles: [article],
        similarity_scores: [1.0],
        cluster_title: article.title,
        article_count: 1,
        algorithm: 'dbscan'
      }));
    }
    
    logger.info(`Clustering ${articles.length} articles with DBSCAN (eps=${eps}, minSamples=${minSamples})`);
    
    // Generate embeddings for all articles
    const embeddings = await Promise.all(
      articles.map(article => this.generateEmbedding(article))
    );
    
    // Run DBSCAN clustering
    const dbscan = new clustering.DBSCAN();
    
    // DBSCAN returns array of clusters: [[0, 2, 5], [1, 3], ...]
    // Each sub-array contains indices of articles in that cluster
    // Articles not in any cluster are considered outliers (noise)
    const clusterIndices = dbscan.run(
      embeddings,
      eps,
      minSamples,
      (a, b) => this.euclideanDistance(a, b)
    );
    
    logger.info(`DBSCAN found ${clusterIndices.length} clusters (excluding outliers)`);
    
    // Convert cluster indices to our cluster format
    const clusters = clusterIndices
      .map(indices => {
        const clusterArticles = indices.map(i => articles[i]);
        return {
          id: this.generateClusterId(),
          articles: clusterArticles,
          article_indices: indices,
          article_count: indices.length,
          algorithm: 'dbscan'
        };
      })
      // Filter clusters by time coherence - articles should be within reasonable timeframe
      .map(cluster => {
        // Get all valid dates
        const articleDates = cluster.articles
          .map(a => {
            const dateStr = a.published_at || a.date_created;
            return dateStr ? new Date(dateStr) : null;
          })
          .filter(d => d && !isNaN(d.getTime()))
          .sort((a, b) => a - b);
        
        if (articleDates.length < 2) return cluster; // Not enough dates to filter
        
        const oldestDate = articleDates[0];
        const newestDate = articleDates[articleDates.length - 1];
        const daysDiff = (newestDate - oldestDate) / (1000 * 60 * 60 * 24);
        
        // If span > 30 days, filter to most recent articles only (within 14 days of newest)
        if (daysDiff > 30) {
          const cutoffDate = new Date(newestDate.getTime() - (14 * 24 * 60 * 60 * 1000));
          const recentArticles = cluster.articles.filter(a => {
            const articleDate = new Date(a.published_at || a.date_created);
            return articleDate >= cutoffDate;
          });
          
          if (recentArticles.length >= 2) {
            logger.info(`Filtered cluster from ${cluster.articles.length} to ${recentArticles.length} articles (removed old articles beyond 14 days)`);
            return {
              ...cluster,
              articles: recentArticles,
              article_count: recentArticles.length
            };
          }
        }
        
        return cluster;
      })
      // Enforce max cluster size
      .map(cluster => {
        if (maxClusterSize && cluster.articles.length > maxClusterSize) {
          return {
            ...cluster,
            articles: cluster.articles.slice(0, maxClusterSize),
            article_indices: cluster.article_indices.slice(0, maxClusterSize),
            article_count: maxClusterSize
          };
        }
        return cluster;
      })
      // Enforce minimum articles to publish
      .filter(c => c.articles.length >= minArticlesToPublish)
      // Enforce minimum unique sources for quality
      .filter(c => {
        const sources = new Set();
        c.articles.forEach(a => {
          const source = a.source_name || a.author_name || 'unknown';
          sources.add(source.toLowerCase().trim());
        });
        return sources.size >= minUniqueSources;
      });
    
    // Apply topic/event filtering and coherence guard before enhancement
    const guardedClusters = (await Promise.all(
      clusters.map(c => this.applyGuardsToCluster(c, {
        settings,
        minArticlesToPublish,
        minUniqueSources
      }))
    ))
      .filter(Boolean)
      .filter(c => (c.articles?.length || 0) >= minArticlesToPublish)
      .filter(c => {
        const sources = new Set();
        (c.articles || []).forEach(a => {
          const source = a.source_name || a.author_name || 'unknown';
          sources.add((source || 'unknown').toLowerCase().trim());
        });
        return sources.size >= minUniqueSources;
      });

    // Enhance clusters with AI analysis
    const enhancedClusters = await Promise.all(
      guardedClusters.map(cluster => this.enhanceCluster(cluster))
    );
    
    logger.info(`Created ${enhancedClusters.length} valid clusters from ${articles.length} articles`);
    
    return enhancedClusters;
  }

  /**
   * Calculate Euclidean distance between two embedding vectors
   * Used by DBSCAN for distance-based clustering
   * @param {Array} a - First embedding vector
   * @param {Array} b - Second embedding vector
   * @returns {number} Euclidean distance
   */
  euclideanDistance(a, b) {
    if (!a || !b || a.length !== b.length) {
      return Infinity;
    }
    
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    
    return Math.sqrt(sum);
  }

  /**
   * Calculate similarity matrix for all article pairs
   * @param {Array} embeddings - Array of embedding vectors
   * @returns {Array} 2D similarity matrix
   */
  calculateSimilarityMatrix(embeddings) {
    const matrix = [];
    
    for (let i = 0; i < embeddings.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < embeddings.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.calculateCosineSimilarity(embeddings[i], embeddings[j]);
        }
      }
    }
    
    return matrix;
  }

  /**
   * Form clusters from similarity matrix
   * @param {Array} articles - Array of articles
   * @param {Array} similarities - Similarity matrix
   * @param {number} threshold - Clustering threshold
   * @returns {Array} Array of clusters
   */
  formClusters(articles, similarities, threshold) {
    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < articles.length; i++) {
      if (assigned.has(i)) continue;

      const cluster = {
        id: this.generateClusterId(),
        articles: [articles[i]],
        similarity_scores: [1.0],
        article_indices: [i]
      };

      assigned.add(i);

      // Find similar articles
      for (let j = i + 1; j < articles.length; j++) {
        if (assigned.has(j)) continue;

        if (similarities[i][j] >= threshold) {
          cluster.articles.push(articles[j]);
          cluster.similarity_scores.push(similarities[i][j]);
          cluster.article_indices.push(j);
          assigned.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Enhance cluster with additional analysis
   * @param {Object} cluster - Cluster object
   * @returns {Object} Enhanced cluster
   */
  async enhanceCluster(cluster) {
    const articles = cluster.articles;
    
    // Generate cluster title
    const clusterTitle = await this.generateClusterTitle(articles);
    
    // Calculate bias distribution
    const biasDistribution = this.calculateBiasDistribution(articles);
    
    // Generate cluster summary and Q&A
    const clusterAnalysis = await this.generateClusterAnalysis(articles, clusterTitle);
    
    // Calculate source diversity
    const sourceDiversity = this.calculateSourceDiversity(articles);

    const base = {
      ...cluster,
      cluster_title: clusterTitle,
      article_count: articles.length,
      bias_distribution: biasDistribution,
      source_diversity: sourceDiversity,
      cluster_summary: clusterAnalysis.summary,
      key_facts: clusterAnalysis.key_facts,
      timeline_events: clusterAnalysis.timeline_events || [],
      x_posts: clusterAnalysis.x_posts || [],
      trending_hashtags: clusterAnalysis.trending_hashtags || [],
      fact_check_notes: clusterAnalysis.fact_check_notes,
      suggested_questions: clusterAnalysis.suggested_questions,
      suggested_answers: clusterAnalysis.suggested_answers,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const augmented = await this.maybeAugmentWithWebSearch(base);
    return augmented;
  }

  async maybeAugmentWithWebSearch(cluster) {
    try {
      const settings = await adminSettingsService.getClusterSettings();
      const ws = settings?.webSearch || {};
      if (!ws.enabled) return cluster;
      const needs = ((cluster.timeline_events || []).length < 1) || ((cluster.cluster_summary || '').length < 180);
      if (!needs) return cluster;
      const providerEnabled = await adminSettingsService.getProviderConfig('perplexity').catch(() => ({}));
      const hasKey = !!(providerEnabled?.apiKey || process.env.PERPLEXITY_API_KEY);
      if (!hasKey) return cluster;
      const query = `${cluster.cluster_title || 'current event'} latest updates`;
      const ttlMs = Math.max(1, Number(ws.cacheTtlHours || 24)) * 60 * 60 * 1000;
      const cacheKey = `ws:${query}`;
      const result = await withCache(cacheKey, ttlMs, async () => {
        try {
          const resp = await aiProviderService.searchWithPerplexity(query, 'llama-3.1-sonar-small-128k-online');
          return resp || null;
        } catch (_) {
          return null;
        }
      });
      if (!result || !Array.isArray(result.results) || result.results.length === 0) return cluster;
      const top = result.results[0];
      const externalFacts = [
        {
          title: top.title || query,
          content: top.content || '',
          citations: top.citations || [],
          provider: 'perplexity'
        }
      ];
      const mergedKeyFacts = Array.isArray(cluster.key_facts)
        ? cluster.key_facts.slice(0, 5)
        : [];
      const appendedFacts = mergedKeyFacts.concat(
        (top.citations || []).slice(0, 2).map((c, i) => `External source ${i + 1}: ${c?.url || c}`)
      ).slice(0, 8);
      return {
        ...cluster,
        external_facts: externalFacts,
        key_facts: appendedFacts
      };
    } catch (_) {
      return cluster;
    }
  }

  /**
   * Generate cluster title from articles
   * @param {Array} articles - Articles in cluster
   * @returns {string} Generated title
   */
  async generateClusterTitle(articles) {
    if (articles.length === 1) {
      return articles[0].title;
    }

    const titles = articles.map(a => a.title).join(' | ');

    // Determine provider availability
    let openrouterAvailable = false;
    try {
      const orCfg = await adminSettingsService.getProviderConfig('openrouter');
      openrouterAvailable = (orCfg?.enabled !== false) && !!(orCfg?.apiKey || process.env.OPENROUTER_API_KEY);
    } catch (_) {
      openrouterAvailable = !!process.env.OPENROUTER_API_KEY;
    }
    const groqAvailable = await this.isGroqAvailable();

    if (!openrouterAvailable && !groqAvailable) {
      // Simple fallback: find common words
      const words = titles.toLowerCase().split(/\s+/);
      const wordCount = {};
      words.forEach(word => {
        if (word.length > 3) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      const commonWords = Object.entries(wordCount)
        .filter(([word, count]) => count > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);
      return commonWords.length > 0
        ? commonWords.join(' ').replace(/\b\w/g, l => l.toUpperCase())
        : articles[0].title;
    }

    try {
      // Prefer OpenRouter if configured via admin settings or env
      const messages = [
        {
          role: "system",
          content: "You are a news editor who creates concise, informative headlines for story clusters. Create a single headline that captures the main story from multiple articles."
        },
        {
          role: "user",
          content: `Create a concise headline for this story cluster based on these article titles:

${articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n')}

Respond with only the headline, no explanation.`
        }
      ];
      // Prefer OpenRouter
      try {
        const usageCfg = await adminSettingsService.getUsageConfig('clustering');
        const orCfg = await adminSettingsService.getProviderConfig('openrouter').catch(() => null);
        const apiKey = (orCfg?.enabled !== false && orCfg?.apiKey)
          ? orCfg.apiKey
          : (process.env.OPENROUTER_API_KEY || '');
        const model = usageCfg?.model || orCfg?.model || '@preset/asha-news';
        const temperature = (usageCfg?.temperature ?? orCfg?.temperature ?? 0.3);
        const maxTokens = 120;

        if (apiKey) {
          try {
            logger.info('🔷 Using OpenRouter for cluster title', { model, temperature, maxTokens });
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-Title': 'Asha News'
              },
              body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens
              })
            });
            const json = await resp.json().catch(() => ({}));
            if (resp.ok) {
              const orContent = (json?.choices?.[0]?.message?.content || '').trim();
              if (AI_DEBUG) {
                console.debug('[StoryClusteringService] generateClusterTitle', { provider: 'openrouter', model, temperature, length: orContent.length });
              }
              if (orContent) return orContent;
            }
          } catch (_) {
            // fall back to Groq below
          }
        }
      } catch (_) {}

      if (groqAvailable) {
        await this.ensureGroq();
        const completion = await this.groq.chat.completions.create({
          messages,
          model: "llama-3.1-8b-instant",
          temperature: 0.3,
          max_tokens: 100
        });
        if (AI_DEBUG) {
          const content = completion.choices[0].message.content || '';
          console.debug('[StoryClusteringService] generateClusterTitle', { provider: 'groq', model: 'llama-3.1-8b-instant', length: content.length });
        }
        return completion.choices[0].message.content.trim();
      }
      // Final fallback if OR and Groq both fail
      return articles[0].title;
    } catch (error) {
      logger.error('Cluster title generation failed:', error);
      return articles[0].title;
    }
  }

  /**
   * Generate comprehensive cluster analysis
   * @param {Array} articles - Articles in cluster
   * @param {string} clusterTitle - Cluster title
   * @returns {Object} Analysis results
   */
  async generateClusterAnalysis(articles, clusterTitle) {
    // If neither Groq nor OpenRouter configured, fallback immediately
    const groqConfigured = await this.isGroqAvailable();
    const openrouterConfigured = !!process.env.OPENROUTER_API_KEY;
    if (!groqConfigured && !openrouterConfigured) {
      return this.getFallbackClusterAnalysis(articles);
    }

    try {
      // Extract meaningful content from each article (send MORE content to AI)
      const articlesData = articles.map(a => {
        // Get both content and summary - AI needs as much context as possible
        const mainContent = a.content || '';
        const summary = a.summary || '';
        
        // Combine content + summary for maximum context (up to 2000 chars)
        let fullText = '';
        if (mainContent && summary && mainContent !== summary) {
          fullText = `${summary}\n\n${mainContent}`;
        } else {
          fullText = mainContent || summary || a.title;
        }
        
        // Send up to 2000 chars per article (was only 800!)
        const contentForAI = fullText.length > 2000 
          ? fullText.substring(0, 2000) + '...'
          : fullText;
        
        logger.info(`📰 Article for AI: "${a.title.substring(0, 50)}..." | Content length: ${contentForAI.length} chars`);
        
        return {
          title: a.title,
          summary: summary || 'No summary available',
          content: contentForAI,
          published_date: a.published_at || a.date_created || 'Unknown',
          source: a.source_name || a.author_name || 'Unknown',
          bias: a.political_bias || 'unknown'
        };
      });
      
      logger.info(`🤖 Sending ${articlesData.length} articles to AI with avg ${Math.round(articlesData.reduce((sum, a) => sum + a.content.length, 0) / articlesData.length)} chars each`);

      const messages = [
        {
          role: "system",
          content: "You are an expert investigative journalist. Your job is to READ the full article content provided and extract specific, meaningful information. You must NEVER just repeat article titles or write generic statements. Every fact, quote, and detail you provide MUST come directly from reading the article content fields."
        },
        {
          role: "user",
          content: `TASK: Analyze these ${articlesData.length} articles about "${clusterTitle}"

ARTICLES WITH FULL TEXT CONTENT:
${JSON.stringify(articlesData, null, 2)}

⚠️ CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. The "content" field contains the ACTUAL ARTICLE TEXT - READ IT!
2. DO NOT just copy titles or write generic summaries
3. Extract SPECIFIC details from the content:
   - Names of people involved
   - Exact numbers, statistics, dates
   - Direct quotes from sources
   - Locations, organizations mentioned
   - What actually happened (actions, events)
4. If the content field says "No summary available" or is too short, acknowledge the limitation

EXAMPLE OF GOOD vs BAD OUTPUT:
❌ BAD: "Two killed in attack at Manchester synagogue"
✅ GOOD: "Two victims, identified as [names if available], were killed in an attack at [specific synagogue name] on [date/time from article]. Police arrested [suspect details from content]. Witnesses reported [specific details from content]."

Generate JSON with REAL INFORMATION FROM THE CONTENT:
{
  "summary": "200-400 character narrative synthesizing the ACTUAL CONTENT you read, not just titles. Include specific details like numbers, names, locations from the articles.",
  "key_facts": [
    "[Source]: Specific fact with actual numbers/data from content",
    "[Source]: Direct quote from article content",
    "[Source]: Concrete detail with names/locations from content",
    "[Source]: Statistical data or findings from content",
    "[Source]: Additional verifiable information from content"
  ],
  "timeline_events": [
    {"date": "Extract actual date from content (e.g. 'October 2, 2025' or 'Tuesday morning')", "event": "What happened based on content", "source": "Source name"},
    {"date": "Another date from content", "event": "Event description from content", "source": "Source name"}
  ],
  "fact_check_notes": "Based on reading the content: note any conflicting information, verify claims across sources, highlight agreements/disagreements",
  "suggested_questions": [
    "Question about specific details from the content",
    "Question about implications mentioned in articles",
    "Question comparing different source perspectives"
  ],
  "suggested_answers": [
    "Answer with specific info from content, cite sources",
    "Answer referencing actual details from articles",
    "Answer comparing perspectives from different sources"
  ]
}

REMEMBER: Use the CONTENT field, not just titles!`
        }
      ];

      // OpenRouter PRIMARY - always try first
      const usageCfg = await adminSettingsService.getUsageConfig('clustering').catch(() => ({}));
      const orCfg = await adminSettingsService.getProviderConfig('openrouter').catch(() => null);
      const apiKey = (orCfg?.enabled !== false && orCfg?.apiKey)
        ? orCfg.apiKey
        : (process.env.OPENROUTER_API_KEY || '');
      
      if (apiKey) {
        logger.info('🔷 Using OpenRouter as PRIMARY AI provider for clustering');
        
        // Use the Asha News preset (has multiple models with fallback)
        const model = usageCfg?.model || orCfg?.model || '@preset/asha-news';
        const temperature = (usageCfg?.temperature ?? orCfg?.temperature ?? 0.4);
        const maxTokens = usageCfg?.maxTokens || orCfg?.maxTokens || 2500;
        
        try {
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://asha.news',
              'X-Title': 'Asha News'
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: maxTokens
            })
          });
          const json = await resp.json().catch(() => ({}));
          
          logger.info(`📥 OpenRouter Response:`, {
            status: resp.status,
            ok: resp.ok,
            model,
            hasContent: !!json?.choices?.[0]?.message?.content,
            error: json?.error?.message || 'none'
          });
          
          if (resp.ok) {
            const content = json?.choices?.[0]?.message?.content || '';
            const parsed = aiJson.tryParseJson(content);
            if (parsed) {
              // Validate AI output quality
              const summaryLength = (parsed.summary || '').length;
              const hasKeyFacts = Array.isArray(parsed.key_facts) && parsed.key_facts.length > 0;
              const firstFact = parsed.key_facts?.[0] || '';
              
              logger.info(`✅ AI Analysis Generated (OpenRouter):`, {
                model,
                summary_length: summaryLength,
                key_facts_count: parsed.key_facts?.length || 0,
                timeline_events: parsed.timeline_events?.length || 0,
                first_fact_preview: firstFact.substring(0, 80) + '...'
              });
              
              // Warn if quality is poor
              if (summaryLength < 100) {
                logger.warn('⚠️ AI summary too short!', summaryLength, 'chars');
              }
              if (!hasKeyFacts || firstFact.length < 30) {
                logger.warn('⚠️ AI key facts are poor quality!');
              }
              
              if (AI_DEBUG) {
                console.debug('[StoryClusteringService] generateClusterAnalysis', { provider: 'openrouter', model, temperature, length: content.length });
              }
              return parsed;
            } else {
              logger.warn('⚠️ OpenRouter returned content but failed to parse JSON');
              logger.info('Content preview:', content.substring(0, 200));
            }
          } else {
            // OpenRouter request failed
            logger.error('❌ OpenRouter request failed:', resp.status);
            if (json?.error) {
              logger.error('Error details:', {
                message: json.error.message,
                type: json.error.type,
                code: json.error.code
              });
            }
          }
        } catch (err) {
          logger.error('❌ OpenRouter API error:', err.message);
        }
      }

      // Groq fallback (only if OpenRouter unavailable or failed)
      logger.info('⚠️ Falling back to Groq for AI analysis');
      if (groqConfigured) {
        await this.ensureGroq();
        const completion = await this.groq.chat.completions.create({
          messages,
          model: "llama-3.1-8b-instant",
          temperature: 0.4,
          max_tokens: 1500
        });
        const content = completion.choices[0].message.content || '';
        const parsed = aiJson.tryParseJson(content);
        if (parsed) {
          // Validate AI output quality
          const summaryLength = (parsed.summary || '').length;
          const hasKeyFacts = Array.isArray(parsed.key_facts) && parsed.key_facts.length > 0;
          const firstFact = parsed.key_facts?.[0] || '';
          
          logger.info(`✅ AI Analysis Generated (Groq):`, {
            summary_length: summaryLength,
            key_facts_count: parsed.key_facts?.length || 0,
            timeline_events: parsed.timeline_events?.length || 0,
            first_fact_preview: firstFact.substring(0, 80) + '...'
          });
          
          // Warn if quality is poor
          if (summaryLength < 100) {
            logger.warn('⚠️ AI summary too short!', summaryLength, 'chars');
          }
          if (!hasKeyFacts || firstFact.length < 30) {
            logger.warn('⚠️ AI key facts are poor quality!');
          }
          
          if (AI_DEBUG) {
            console.debug('[StoryClusteringService] generateClusterAnalysis', { provider: 'groq', model: 'llama-3.1-8b-instant', length: content.length });
          }
          return parsed;
        }
        // If parsing fails, fallback
        return this.getFallbackClusterAnalysis(articles);
      }

      return this.getFallbackClusterAnalysis(articles);
    } catch (error) {
      logger.error('Cluster analysis generation failed:', error);
      return this.getFallbackClusterAnalysis(articles);
    }
  }

  /**
   * Calculate bias distribution across cluster articles
   * @param {Array} articles - Articles in cluster
   * @returns {Object} Bias distribution
   */
  calculateBiasDistribution(articles) {
    const biasCount = {
      left: 0,
      lean_left: 0,
      center: 0,
      lean_right: 0,
      right: 0,
      mixed: 0,
      unknown: 0
    };

    articles.forEach(article => {
      const bias = article.political_bias || 'unknown';
      biasCount[bias] = (biasCount[bias] || 0) + 1;
    });

    const total = articles.length;
    const distribution = {};
    
    Object.keys(biasCount).forEach(bias => {
      if (biasCount[bias] > 0) {
        distribution[bias] = {
          count: biasCount[bias],
          percentage: Math.round((biasCount[bias] / total) * 100)
        };
      }
    });

    return distribution;
  }

  /**
   * Calculate source diversity metrics
   * @param {Array} articles - Articles in cluster
   * @returns {Object} Source diversity metrics
   */
  calculateSourceDiversity(articles) {
    const sources = new Set();
    const countries = new Set();
    const biases = new Set();

    articles.forEach(article => {
      if (article.source_name) sources.add(article.source_name);
      if (article.author_name) sources.add(article.author_name);
      if (article.country) countries.add(article.country);
      if (article.political_bias) biases.add(article.political_bias);
    });

    return {
      unique_sources: sources.size,
      unique_countries: countries.size,
      unique_biases: biases.size,
      diversity_score: Math.min(1.0, (sources.size + countries.size + biases.size) / (articles.length * 3))
    };
  }

  /**
   * Generate unique cluster ID
   * @returns {string} Cluster ID
   */
  generateClusterId() {
    return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Fallback embedding for when AI is not available
   * @returns {Array} Fallback embedding
   */
  getFallbackEmbedding() {
    return new Array(384).fill(0).map(() => Math.random() * 2 - 1);
  }

  /**
   * Fallback cluster analysis
   * @param {Array} articles - Articles in cluster
   * @returns {Object} Fallback analysis
   */
  getFallbackClusterAnalysis(articles) {
    // Create a more intelligent summary from article titles and summaries
    const sources = [...new Set(articles.map(a => a.source_name).filter(Boolean))];
    const sourcesText = sources.length > 0 
      ? sources.slice(0, 3).join(', ') + (sources.length > 3 ? ' and others' : '')
      : 'multiple outlets';
    
    // Extract key themes from titles
    const allWords = articles.map(a => a.title.toLowerCase()).join(' ').split(/\s+/);
    const wordFreq = {};
    allWords.forEach(word => {
      if (word.length > 4 && !['their', 'about', 'after', 'before', 'could', 'would', 'should'].includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    const topWords = Object.entries(wordFreq)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
    
    const themeText = topWords.length > 0 ? topWords.join(', ') : 'this developing story';
    
    // Create a narrative summary (200-400 chars)
    const narrativeSummary = `Multiple sources including ${sourcesText} are covering developments related to ${themeText}. The story has generated ${articles.length} ${articles.length === 1 ? 'article' : 'articles'} from ${sources.length} ${sources.length === 1 ? 'outlet' : 'different outlets'}, indicating significant news interest. Coverage varies across sources, offering different perspectives on the situation.`;
    
    // Ensure summary is 200-400 chars
    const trimmedSummary = narrativeSummary.length > 400 
      ? narrativeSummary.substring(0, 397) + '...' 
      : narrativeSummary.length < 200 
        ? narrativeSummary + ` This ongoing story continues to develop with new information emerging from various sources.`
        : narrativeSummary;
    
    return {
      summary: trimmedSummary,
      key_facts: articles.slice(0, 5).map(a => `${a.source_name || 'Source'}: ${a.title}`),
      fact_check_notes: 'Automated aggregation - AI analysis unavailable for detailed verification',
      suggested_questions: [
        `What are the main developments in ${themeText}?`,
        'How are different sources covering this story?',
        'What are the key facts and perspectives?'
      ],
      suggested_answers: [
        `Multiple sources including ${sourcesText} are reporting on this story with varying perspectives.`,
        'Different outlets may emphasize different aspects based on their editorial focus.',
        'This is an aggregated view - check individual articles for detailed analysis.'
      ]
    };
  }
}

module.exports = StoryClusteringService;
