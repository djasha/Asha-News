/**
 * Story Clustering Service
 * Groups related articles from different sources using AI-based similarity detection
 */

class StoryClusteringService {
  constructor() {
    this.clusters = new Map();
    this.similarityThreshold = 0.6; // Lower threshold to find more matches
  }

  /**
   * Calculate similarity between two articles using multiple factors
   */
  calculateSimilarity(article1, article2) {
    // Title similarity (most important factor)
    const titleSimilarity = this.calculateTextSimilarity(
      this.normalizeText(article1.title),
      this.normalizeText(article2.title)
    );

    // Description similarity
    const descSimilarity = this.calculateTextSimilarity(
      this.normalizeText(article1.description || ''),
      this.normalizeText(article2.description || '')
    );

    // Time proximity (articles about same event should be published around same time)
    const timeSimilarity = this.calculateTimeSimilarity(
      article1.published_at,
      article2.published_at
    );

    // Entity extraction similarity (names, places, organizations)
    const entitySimilarity = this.calculateEntitySimilarity(article1, article2);

    // Weighted combination
    const similarity = (
      titleSimilarity * 0.4 +
      descSimilarity * 0.3 +
      timeSimilarity * 0.2 +
      entitySimilarity * 0.1
    );

    return similarity;
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate text similarity using Jaccard similarity with n-grams
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;

    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));

    // Jaccard similarity
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const jaccardSimilarity = intersection.size / union.size;

    // Also check for substring matches and key phrases
    const substringBonus = this.calculateSubstringBonus(text1, text2);

    return Math.min(1, jaccardSimilarity + substringBonus);
  }

  /**
   * Calculate bonus for important substring matches
   */
  calculateSubstringBonus(text1, text2) {
    const importantPhrases = this.extractImportantPhrases(text1);
    let bonus = 0;

    importantPhrases.forEach(phrase => {
      if (text2.includes(phrase) && phrase.length > 10) {
        bonus += 0.1;
      }
    });

    return Math.min(0.3, bonus);
  }

  /**
   * Extract important phrases (proper nouns, quoted text, etc.)
   */
  extractImportantPhrases(text) {
    const phrases = [];
    
    // Extract quoted text
    const quotes = text.match(/"[^"]+"/g) || [];
    phrases.push(...quotes.map(q => q.replace(/"/g, '')));

    // Extract capitalized phrases (likely proper nouns)
    const capitalizedPhrases = text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
    phrases.push(...capitalizedPhrases);

    return phrases;
  }

  /**
   * Calculate time similarity between articles
   */
  calculateTimeSimilarity(time1, time2) {
    if (!time1 || !time2) return 0;

    const date1 = new Date(time1);
    const date2 = new Date(time2);
    const timeDiff = Math.abs(date1 - date2);
    
    // Articles within 24 hours get high similarity
    const hoursApart = timeDiff / (1000 * 60 * 60);
    
    if (hoursApart <= 24) return 1;
    if (hoursApart <= 48) return 0.8;
    if (hoursApart <= 72) return 0.6;
    if (hoursApart <= 168) return 0.4; // 1 week
    
    return 0.1;
  }

  /**
   * Calculate entity similarity (names, places, organizations)
   */
  calculateEntitySimilarity(article1, article2) {
    const entities1 = this.extractEntities(article1.title + ' ' + (article1.description || ''));
    const entities2 = this.extractEntities(article2.title + ' ' + (article2.description || ''));

    if (entities1.length === 0 && entities2.length === 0) return 0;

    const commonEntities = entities1.filter(entity => 
      entities2.some(e2 => e2.toLowerCase() === entity.toLowerCase())
    );

    return commonEntities.length / Math.max(entities1.length, entities2.length);
  }

  /**
   * Simple entity extraction (proper nouns, organizations, etc.)
   */
  extractEntities(text) {
    const entities = [];
    
    // Extract capitalized words/phrases
    const capitalizedMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    entities.push(...capitalizedMatches);

    // Extract common organization patterns
    const orgPatterns = [
      /\b[A-Z][a-z]+\s+(?:Inc|Corp|LLC|Ltd|Company|Organization|Agency|Department)\b/g,
      /\b(?:President|CEO|Prime Minister|Senator|Representative)\s+[A-Z][a-z]+/g
    ];

    orgPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      entities.push(...matches);
    });

    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Cluster articles into related stories
   */
  clusterArticles(articles) {
    const clusters = [];
    const processed = new Set();

    articles.forEach((article, index) => {
      if (processed.has(index)) return;

      const cluster = {
        id: `story_${Date.now()}_${index}`,
        mainArticle: article,
        articles: [article],
        sources: new Set([article.source_name]),
        biasDistribution: { left: 0, center: 0, right: 0 },
        publishedRange: {
          earliest: new Date(article.published_at),
          latest: new Date(article.published_at)
        },
        topics: new Set([article.topic]),
        isBlindspot: false
      };

      processed.add(index);

      // Find similar articles
      articles.forEach((otherArticle, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return;

        const similarity = this.calculateSimilarity(article, otherArticle);
        
        if (similarity >= this.similarityThreshold) {
          cluster.articles.push(otherArticle);
          cluster.sources.add(otherArticle.source_name);
          cluster.topics.add(otherArticle.topic);
          
          const publishedDate = new Date(otherArticle.published_at);
          if (publishedDate < cluster.publishedRange.earliest) {
            cluster.publishedRange.earliest = publishedDate;
          }
          if (publishedDate > cluster.publishedRange.latest) {
            cluster.publishedRange.latest = publishedDate;
          }
          
          processed.add(otherIndex);
        }
      });

      // Only include clusters with multiple sources
      if (cluster.sources.size >= 2) {
        // Calculate bias distribution
        cluster.biasDistribution = this.calculateBiasDistribution(cluster.articles);
        
        // Detect blindspots (stories covered by only one bias perspective)
        cluster.isBlindspot = this.detectBlindspot(cluster.biasDistribution);

        // Choose best main article (most recent from most credible source)
        cluster.mainArticle = this.selectMainArticle(cluster.articles);

        clusters.push(cluster);
      }
    });

    // Sort clusters by relevance (source count, recency, etc.)
    return clusters.sort((a, b) => {
      const scoreA = this.calculateClusterScore(a);
      const scoreB = this.calculateClusterScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate bias distribution for a cluster
   */
  calculateBiasDistribution(articles) {
    const distribution = { left: 0, center: 0, right: 0 };
    
    articles.forEach(article => {
      const bias = this.getSourceBias(article.source_name);
      distribution[bias]++;
    });

    const total = articles.length;
    return {
      left: Math.round((distribution.left / total) * 100),
      center: Math.round((distribution.center / total) * 100),
      right: Math.round((distribution.right / total) * 100)
    };
  }

  /**
   * Get bias classification for a source
   */
  getSourceBias(sourceName) {
    const leftSources = ['CNN', 'MSNBC', 'The Guardian', 'NPR', 'BBC', 'Reuters'];
    const rightSources = ['Fox News', 'Wall Street Journal', 'New York Post', 'Daily Mail'];
    
    const lowerSource = sourceName.toLowerCase();
    
    if (leftSources.some(source => lowerSource.includes(source.toLowerCase()))) {
      return 'left';
    }
    if (rightSources.some(source => lowerSource.includes(source.toLowerCase()))) {
      return 'right';
    }
    
    return 'center';
  }

  /**
   * Detect if a story is a blindspot (covered by only one perspective)
   */
  detectBlindspot(biasDistribution) {
    const nonZeroCount = Object.values(biasDistribution).filter(count => count > 0).length;
    return nonZeroCount === 1;
  }

  /**
   * Select the best main article for a cluster
   */
  selectMainArticle(articles) {
    // Prefer more recent articles from credible sources
    return articles.sort((a, b) => {
      const dateA = new Date(a.published_at);
      const dateB = new Date(b.published_at);
      
      // First sort by recency
      if (dateB - dateA !== 0) {
        return dateB - dateA;
      }
      
      // Then by source credibility (simple heuristic)
      const credibilityA = this.getSourceCredibility(a.source_name);
      const credibilityB = this.getSourceCredibility(b.source_name);
      
      return credibilityB - credibilityA;
    })[0];
  }

  /**
   * Get source credibility score
   */
  getSourceCredibility(sourceName) {
    const highCredibility = ['Reuters', 'Associated Press', 'BBC', 'NPR'];
    const mediumCredibility = ['CNN', 'Fox News', 'The Guardian', 'Wall Street Journal'];
    
    const lowerSource = sourceName.toLowerCase();
    
    if (highCredibility.some(source => lowerSource.includes(source.toLowerCase()))) {
      return 3;
    }
    if (mediumCredibility.some(source => lowerSource.includes(source.toLowerCase()))) {
      return 2;
    }
    
    return 1;
  }

  /**
   * Calculate relevance score for a cluster
   */
  calculateClusterScore(cluster) {
    const sourceCount = cluster.sources.size;
    const recencyScore = this.calculateRecencyScore(cluster.publishedRange.latest);
    const diversityScore = this.calculateDiversityScore(cluster.biasDistribution);
    
    return sourceCount * 0.4 + recencyScore * 0.4 + diversityScore * 0.2;
  }

  /**
   * Calculate recency score
   */
  calculateRecencyScore(publishedDate) {
    const now = new Date();
    const hoursAgo = (now - publishedDate) / (1000 * 60 * 60);
    
    if (hoursAgo <= 6) return 1;
    if (hoursAgo <= 24) return 0.8;
    if (hoursAgo <= 48) return 0.6;
    if (hoursAgo <= 168) return 0.4;
    
    return 0.2;
  }

  /**
   * Calculate diversity score based on bias distribution
   */
  calculateDiversityScore(biasDistribution) {
    const nonZeroCount = Object.values(biasDistribution).filter(count => count > 0).length;
    return nonZeroCount / 3; // Max diversity is all 3 perspectives
  }
}

export default new StoryClusteringService();
