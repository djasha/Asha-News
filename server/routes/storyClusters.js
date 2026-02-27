const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../utils/logger');
const StoryClusteringService = require('../services/storyClusteringService');
const adminSettingsService = require('../services/adminSettingsService');
const DirectusService = require('../services/directusService');
const EventRegistryService = require('../services/eventRegistryService');
const ClusterCacheService = require('../services/clusterCacheService');
const { clusterLimiter, validateClusterInput } = require('../middleware/securityMiddleware');

const clusteringService = new StoryClusteringService();
const directusService = new DirectusService();
const clusterCache = new ClusterCacheService();

function computeContentHash(articles = []) {
  try {
    const canonical = (articles || [])
      .map(a => ({ id: a.id ?? '', title: a.title ?? '' }))
      .sort((x, y) => String(x.id).localeCompare(String(y.id)) || x.title.localeCompare(y.title));
    return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
  } catch (_) {
    return null;
  }
}

// Apply rate limiting to clustering endpoints
router.use(clusterLimiter);

/**
 * GET /api/clusters
 * Get all story clusters with pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status = 'active', topic } = req.query;
    
    // Get clusters from Directus CMS
    let clusters = await directusService.getClusters({
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      status,
      category
    });

    // If no clusters exist, create some from recent RSS articles
    if (clusters.length === 0) {
      logger.info('No clusters found, generating from recent RSS articles...');
      
      // Get recent RSS articles from the processing service cache
      const RSSProcessingService = require('../services/rssProcessingService');
      const rssService = new RSSProcessingService();
      
      // Get processed articles from cache or fetch fresh RSS data
      let articles = [];
      if (rssService.processedArticles.size > 0) {
        articles = Array.from(rssService.processedArticles.values()).slice(0, 50);
      } else {
        // Fallback: get RSS sources and process them
        const rssSources = await directusService.getRSSSources({ enabled: true });
        if (rssSources.length > 0) {
          const rssResults = await rssService.processAllFeeds(rssSources.slice(0, 10)); // Process first 10 sources
          articles = rssResults.articles.slice(0, 50);
        }
      }
      
      if (articles.length > 1) {
        logger.info(`Clustering ${articles.length} RSS articles...`);
        // Generate clusters from RSS articles
        // Use admin-configured similarityThreshold by default
        let thr;
        try {
          const cs = await adminSettingsService.getClusterSettings();
          if (cs && typeof cs.similarityThreshold === 'number') thr = cs.similarityThreshold;
        } catch (_) {}
        const generatedClusters = await clusteringService.clusterArticles(articles, thr);
        
        // Filter to only multi-article clusters
        const validClusters = generatedClusters.filter(cluster => cluster.articles.length > 1);
        
        logger.info(`Generated ${validClusters.length} valid clusters from RSS articles`);
        
        // Save clusters to Directus (optional - can be done in background)
        for (const cluster of validClusters.slice(0, 10)) { // Save first 10 clusters
          try {
            const saved = await directusService.saveCluster({
              cluster_title: cluster.cluster_title,
              cluster_summary: cluster.cluster_summary,
              bias_distribution: cluster.bias_distribution,
              source_diversity: cluster.source_diversity,
              key_facts: cluster.key_facts,
              timeline_events: cluster.timeline_events,
              x_posts: cluster.x_posts,
              trending_hashtags: cluster.trending_hashtags,
              fact_check_notes: cluster.fact_check_notes,
              suggested_questions: cluster.suggested_questions,
              suggested_answers: cluster.suggested_answers,
              article_count: cluster.article_count,
              status: 'active'
            });
            if (cluster.articles && saved?.id) {
              const articleIds = cluster.articles.map(a => a.id || a.guid).filter(Boolean);
              if (articleIds.length > 0) {
                await directusService.saveClusterArticles(saved.id, articleIds);
              }
            }
          } catch (error) {
            logger.error({ err: error }, 'Error saving cluster');
          }
        }
        
        return res.json({
          success: true,
          data: validClusters.slice(0, parseInt(limit)),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: validClusters.length
          }
        });
      }
      
      // No RSS articles available - return empty result
      logger.info('No RSS articles available for clustering');
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0
        },
        message: 'No articles available for clustering. RSS processing may be in progress.'
      });
    }

    // Transform articles_story_clusters to articles array for each cluster
    clusters = clusters.map(cluster => {
      if (cluster.articles_story_clusters && cluster.articles_story_clusters.length > 0) {
        cluster.articles = cluster.articles_story_clusters.map(junction => {
          const article = junction.articles_id || {};
          return {
            id: article.id,
            title: article.title || 'Untitled',
            source_name: article.source_name || 'Unknown Source',
            political_bias: article.political_bias || 'center',
            similarity_score: 0.85,
            is_primary_source: false,
            image_url: article.featured_image_alt || article.image_url,
            published_at: article.date_created || article.published_at,
            excerpt: article.summary || (article.content || '').substring(0, 200),
            url: article.source_url || article.url,
            source_url: article.source_url || article.url
          };
        });
      } else {
        cluster.articles = [];
      }
      return cluster;
    });

    // Optional topic filtering (case-insensitive) across cluster title/summary and related article titles/summaries
    let filtered = clusters;
    if (topic && String(topic).trim().length > 0) {
      const t = String(topic).toLowerCase();
      filtered = clusters.filter(c => {
        const inTitle = (c.cluster_title || '').toLowerCase().includes(t);
        const inSummary = (c.cluster_summary || '').toLowerCase().includes(t);
        const inArticles = Array.isArray(c.articles) && c.articles.some(a => {
          return ((a.title || '').toLowerCase().includes(t) || (a.excerpt || '').toLowerCase().includes(t));
        });
        return inTitle || inSummary || inArticles;
      });
    }

    // Return clusters with pagination metadata
    const totalClusters = filtered.length || await directusService.getClusterCount({ status, category });
    res.json({
      success: true,
      data: filtered,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalClusters || filtered.length,
        has_more: (parseInt(page) * parseInt(limit)) < (totalClusters || filtered.length)
      }
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching clusters');
    // Return safe empty response to avoid breaking frontend
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '20');
    return res.json({
      success: true,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        has_more: false
      },
      message: 'Clusters temporarily unavailable'
    });
  }
});

/**
 * POST /api/clusters/seed-from-event-registry
 * Conservatively ingest 1 event and up to N (<=5) articles for a topic using newsapi.ai (Event Registry),
 * upsert articles to Directus, and create a single cluster linking them. Supports dry_run.
 * Uses at most ~3 API calls (suggestConcept, getEvents, getEventArticles) with a keyword-search fallback.
 */
router.post('/seed-from-event-registry', async (req, res) => {
  try {
    const {
      topic,
      apiKey, // optional override for testing; otherwise use env
      events = 1,
      articles_per_event = 3,
      dry_run = false
    } = req.body || {};

    if (!topic || String(topic).trim().length === 0) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const er = new EventRegistryService({ apiKey });
    if (!er.apiKey) {
      return res.status(400).json({ error: 'Event Registry API key not configured. Provide in env or body.apiKey for dev testing.' });
    }

    // 1) Concept (1 call)
    const concept = await er.suggestConcept(String(topic));

    // 2) Events (1 call)
    let eventsList = [];
    if (concept) {
      eventsList = await er.getEventsForSuggestion(concept, { eventsCount: Math.min(1, parseInt(events) || 1), sortBy: 'date' });
    }

    let event = null;
    let eventUri = null;
    if (Array.isArray(eventsList) && eventsList.length > 0) {
      event = eventsList[0];
      eventUri = event?.uri || event?.id;
    }

    // 3) Event articles (1 call) or keyword fallback (≤2 calls)
    const maxArticles = Math.min(5, Math.max(1, parseInt(articles_per_event) || 3));
    let articles = [];
    if (eventUri) {
      articles = await er.getEventArticles(eventUri, { articlesCount: maxArticles });
    } else {
      const searched = await er.searchArticles(String(topic), { articlesCount: maxArticles });
      const first = Array.isArray(searched) && searched.length > 0 ? searched[0] : null;
      const artEventUri = first?.eventUri || first?.event?.uri || null;
      if (artEventUri) {
        eventUri = artEventUri;
        event = event || { uri: artEventUri, title: first?.title };
        articles = await er.getEventArticles(artEventUri, { articlesCount: maxArticles });
      } else {
        // Last resort: use searched articles directly for a tiny cluster
        articles = searched;
      }
    }

    // Normalize article fields we need
    const normalized = (articles || []).map(a => ({
      title: a?.title || a?.titleEng || 'Untitled',
      summary: a?.body || a?.summary || '',
      content: a?.body || '',
      source_url: a?.url || a?.uri || '',
      source_name: a?.source?.title || a?.source?.uri || 'Unknown',
      image_url: a?.image || null,
      published_at: a?.dateTimePub || a?.date || new Date().toISOString(),
      category: 'International'
    }));

    if (dry_run) {
      return res.json({ success: true, message: 'Dry run: fetched data from Event Registry', sample: { concept, event: { uri: eventUri, title: event?.title }, articles: normalized.slice(0, 3) } });
    }

    // Persist and create a single cluster
    const savedIds = [];
    for (const art of normalized) {
      try {
        const saved = await directusService.upsertArticleBySourceUrl(art);
        if (saved?.id) savedIds.push(saved.id);
      } catch (e) {
        logger.error({ err: error }, 'Seed ER upsert article failed');

      }
    }

    if (savedIds.length === 0) {
      return res.json({ success: true, message: 'No articles saved from event', clusters_created: 0 });
    }

    let clusterId = null;
    try {
      const savedCluster = await directusService.saveCluster({
        cluster_title: event?.title || `Topic: ${topic}`,
        cluster_summary: `Seeded from Event Registry for topic '${topic}'.`,
        article_count: savedIds.length,
        status: 'active'
      });
      clusterId = savedCluster?.id;
    } catch (e) {
      logger.error({ err: error }, 'Seed ER saveCluster failed');

    }

    if (clusterId) {
      try {
        await directusService.saveClusterArticles(clusterId, savedIds);
      } catch (e) {
        logger.error({ err: error }, 'Seed ER saveClusterArticles failed');

      }
    }

    return res.json({ success: true, message: 'Seeded one cluster from Event Registry', clusters_created: clusterId ? 1 : 0, articles_saved: savedIds.length, cluster_id: clusterId });
  } catch (error) {
    logger.error({ err: error }, 'Error in seed-from-event-registry');
    return res.status(500).json({ error: 'Seed from Event Registry failed', details: error.message });
  }
});

/**
 * GET /api/clusters/:id
 * Get specific story cluster with all articles
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get cluster from Directus CMS
    const cluster = await directusService.getClusterById(id);

    if (!cluster) {
      return res.status(404).json({ error: 'Story cluster not found' });
    }

    // Transform articles_story_clusters to articles array for frontend
    if (cluster.articles_story_clusters && cluster.articles_story_clusters.length > 0) {
      cluster.articles = cluster.articles_story_clusters.map(junction => {
        const article = junction.articles_id || {};
        return {
          id: article.id,
          title: article.title || 'Untitled',
          source_name: article.source_name || 'Unknown Source',
          political_bias: article.political_bias || 'center',
          similarity_score: 0.85,
          is_primary_source: false,
          image_url: article.featured_image_alt || article.image_url,
          published_at: article.date_created || article.published_at,
          excerpt: article.summary || (article.content || '').substring(0, 200),
          url: article.source_url || article.url,
          source_url: article.source_url || article.url,
          content: article.content || ''
        };
      });
    } else {
      cluster.articles = [];
    }
    
    // Ensure cluster has required fields for frontend
    if (!cluster.articles || cluster.articles.length === 0) {
      // Return empty array if no articles found - frontend will handle appropriately
      cluster.articles = [];
    }

    // Only set expanded_summary if missing (keep real data intact)
    cluster.expanded_summary = cluster.expanded_summary || cluster.cluster_summary;
    
    // Return real cluster from Directus
    res.json({
      success: true,
      data: cluster
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching cluster');
    res.status(500).json({ error: 'Failed to fetch story cluster' });
  }
});

/**
 * POST /api/clusters/:id/qa
 * Generate Q&A for a specific cluster on-demand
 * Persists the result to avoid regenerating
 */
router.post('/:id/qa', async (req, res) => {
  try {
    const { id } = req.params;
    const { regenerate = false } = req.body;

    // Fetch cluster from Directus
    const cluster = await directusService.getClusterById(id);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Check if Q&A already exists and regeneration not requested
    if (!regenerate && cluster.suggested_questions && cluster.suggested_answers) {
      return res.json({
        success: true,
        data: {
          suggested_questions: cluster.suggested_questions,
          suggested_answers: cluster.suggested_answers,
          cached: true
        }
      });
    }

    // Get articles - handle both junction table formats
    let articles = [];
    if (cluster.articles_story_clusters && Array.isArray(cluster.articles_story_clusters)) {
      // Directus junction format: articles_story_clusters contains {id, articles_id: {full article object}}
      articles = cluster.articles_story_clusters
        .map(j => j.articles_id)
        .filter(a => a && typeof a === 'object' && a.id); // Keep full article objects
    } else if (cluster.articles && Array.isArray(cluster.articles)) {
      // Direct articles array
      articles = cluster.articles.filter(a => a && typeof a === 'object' && a.id);
    }
    
    // Content-hash caching (skip regeneration when unchanged)
    let enableCache = true;
    try {
      const cs = await adminSettingsService.getClusterSettings();
      if (cs && cs.enableContentHashCache === false) enableCache = false;
    } catch {}
    const contentHash = computeContentHash(articles);
    if (enableCache && !regenerate && contentHash) {
      const cachedObj = clusterCache.get(id);
      const hasDirectusQA = cluster.suggested_questions && cluster.suggested_answers;
      const hasCachedQA = cachedObj && cachedObj.suggested_questions && cachedObj.suggested_answers;
      if ((clusterCache.getHash(id) === contentHash) && (hasDirectusQA || hasCachedQA)) {
        return res.json({
          success: true,
          data: {
            suggested_questions: hasDirectusQA ? cluster.suggested_questions : cachedObj.suggested_questions,
            suggested_answers: hasDirectusQA ? cluster.suggested_answers : cachedObj.suggested_answers,
            cached: true,
            content_hash: contentHash
          }
        });
      }
    }
    
    logger.info(`Q&A for cluster ${id}: found ${articles.length} articles, type: ${Array.isArray(articles)}`);
    
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'No articles in cluster to generate Q&A' });
    }

    // Use the clustering service's analysis function
    const articlesForAnalysis = articles.slice(0, 6); // Limit to 6 for context
    logger.info(`Passing ${articlesForAnalysis.length} articles to analysis`);
    
    const analysis = await clusteringService.generateClusterAnalysis(
      articlesForAnalysis,
      cluster.cluster_title
    );

    // Update cluster in Directus with generated Q&A
    const updatePayload = {
      suggested_questions: analysis.suggested_questions || [],
      suggested_answers: analysis.suggested_answers || []
    };

    // Ensure content_hash field before updating and persist hash accordingly
    try {
      await directusService.ensureStoryClustersContentHashField();
    } catch (error) {
      logger.error({ err: error }, 'Error ensuring content_hash field');
    }

    await directusService.updateItem('story_clusters', id, updatePayload);

    if (contentHash) {
      try { clusterCache.set(id, { content_hash: contentHash, ...updatePayload }); } catch {}
      try { await directusService.updateItem('story_clusters', id, { content_hash: contentHash }); } catch {}
    }

    logger.info(`Generated Q&A for cluster ${id}: ${analysis.suggested_questions?.length || 0} questions`);

    res.json({
      success: true,
      data: {
        suggested_questions: analysis.suggested_questions,
        suggested_answers: analysis.suggested_answers,
        cached: false,
        content_hash: contentHash || null
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Error generating Q&A for cluster');
    logger.error({ err: error }, 'Stack');

    res.status(500).json({ error: 'Failed to generate Q&A', details: error.message });
  }
});

/**
 * POST /api/clusters/:id/fact-check
 * Generate fact-check analysis for a specific cluster on-demand
 */
router.post('/:id/fact-check', async (req, res) => {
  try {
    const { id } = req.params;
    const { regenerate = false } = req.body;

    // Fetch cluster from Directus
    const cluster = await directusService.getClusterById(id);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Check if fact-check already exists
    if (!regenerate && cluster.fact_check_notes) {
      return res.json({
        success: true,
        data: { fact_check_notes: cluster.fact_check_notes, cached: true }
      });
    }

    // Get articles - handle both junction table formats
    let articles = [];
    if (cluster.articles_story_clusters && Array.isArray(cluster.articles_story_clusters)) {
      articles = cluster.articles_story_clusters
        .map(j => j.articles_id)
        .filter(a => a && typeof a === 'object' && a.id);
    } else if (cluster.articles && Array.isArray(cluster.articles)) {
      articles = cluster.articles.filter(a => a && typeof a === 'object' && a.id);
    }
    
    // Content-hash caching
    let enableCache = true;
    try {
      const cs = await adminSettingsService.getClusterSettings();
      if (cs && cs.enableContentHashCache === false) enableCache = false;
    } catch {}
    const contentHash = computeContentHash(articles);
    if (enableCache && !regenerate && contentHash) {
      const cachedObj = clusterCache.get(id);
      if (clusterCache.getHash(id) === contentHash && (cluster.fact_check_notes || (cachedObj && cachedObj.fact_check_notes))) {
        return res.json({ success: true, data: { fact_check_notes: cluster.fact_check_notes || cachedObj.fact_check_notes, cached: true, content_hash: contentHash } });
      }
    }
    
    logger.info(`Fact-check for cluster ${id}: found ${articles.length} articles`);
    
    // Generate fact-check (simplified for now - enhance later)
    const fact_check_notes = `Fact-check generated for "${cluster.cluster_title}". Analysis based on ${articles.length} sources.`;

    // Update cluster in Directus
    await directusService.updateItem('story_clusters', id, { fact_check_notes });

    // Cache content hash and payload
    if (contentHash) {
      try { clusterCache.set(id, { content_hash: contentHash, fact_check_notes }); } catch {}
      try { await directusService.ensureStoryClustersContentHashField(); await directusService.updateItem('story_clusters', id, { content_hash: contentHash }); } catch {}
    }

    res.json({
      success: true,
      data: { fact_check_notes, cached: false, content_hash: contentHash || null }
    });

  } catch (error) {
    logger.error({ err: error }, 'Error generating fact-check');
    res.status(500).json({ error: 'Failed to generate fact-check' });
  }
});

/**
 * POST /api/clusters/:id/analysis
 * Generate key facts/analysis for a specific cluster on-demand
 */
router.post('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const { regenerate = false } = req.body;

    // Fetch cluster from Directus
    const cluster = await directusService.getClusterById(id);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Check if analysis already exists
    if (!regenerate && cluster.key_facts && cluster.key_facts.length > 0) {
      return res.json({
        success: true,
        data: { key_facts: cluster.key_facts, cached: true }
      });
    }

    // Get articles - handle both junction table formats
    let articles = [];
    if (cluster.articles_story_clusters && Array.isArray(cluster.articles_story_clusters)) {
      articles = cluster.articles_story_clusters
        .map(j => j.articles_id)
        .filter(a => a && typeof a === 'object' && a.id);
    } else if (cluster.articles && Array.isArray(cluster.articles)) {
      articles = cluster.articles.filter(a => a && typeof a === 'object' && a.id);
    }
    
    // Content-hash caching
    let enableCache = true;
    try {
      const cs = await adminSettingsService.getClusterSettings();
      if (cs && cs.enableContentHashCache === false) enableCache = false;
    } catch {}
    const contentHash = computeContentHash(articles);
    if (enableCache && !regenerate && contentHash) {
      const cachedObj = clusterCache.get(id);
      if (clusterCache.getHash(id) === contentHash && ((cluster.key_facts && cluster.key_facts.length > 0) || (cachedObj && Array.isArray(cachedObj.key_facts) && cachedObj.key_facts.length > 0))) {
        return res.json({ success: true, data: { key_facts: cluster.key_facts || cachedObj.key_facts, cached: true, content_hash: contentHash } });
      }
    }
    
    logger.info(`Analysis for cluster ${id}: found ${articles.length} articles`);
    
    // Generate analysis
    const analysis = await clusteringService.generateClusterAnalysis(
      articles.slice(0, 6),
      cluster.cluster_title
    );

    // Update cluster in Directus
    const updatePayload = {
      key_facts: analysis.key_facts || []
    };

    await directusService.updateItem('story_clusters', id, updatePayload);

    if (contentHash) {
      try { clusterCache.set(id, { content_hash: contentHash, ...updatePayload }); } catch {}
      try { await directusService.ensureStoryClustersContentHashField(); await directusService.updateItem('story_clusters', id, { content_hash: contentHash }); } catch {}
    }

    res.json({
      success: true,
      data: { key_facts: analysis.key_facts, cached: false, content_hash: contentHash || null }
    });

  } catch (error) {
    logger.error({ err: error }, 'Error generating analysis');
    logger.error({ err: error }, 'Stack');

    res.status(500).json({ error: 'Failed to generate analysis', details: error.message });
  }
});

/**
 * POST /api/clusters/:id/social
 * Generate X/Twitter social content for a specific cluster using X.AI Grok
 * On-demand only to save tokens
 */
router.post('/:id/social', async (req, res) => {
  try {
    const { id } = req.params;
    const { regenerate = false } = req.body;

    // Check if X.AI is available
    const XAISocialService = require('../services/xaiSocialService');
    const xaiService = new XAISocialService();
    
    if (!xaiService.isAvailable()) {
      return res.status(503).json({ 
        error: 'X.AI service not configured',
        message: 'Add XAI_API_KEY to environment variables to enable social features'
      });
    }

    // Fetch cluster from Directus
    const cluster = await directusService.getClusterById(id);
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    // Check if social content already exists and regeneration not requested
    if (!regenerate && cluster.x_posts && cluster.x_posts.length > 0) {
      return res.json({
        success: true,
        data: {
          x_posts: cluster.x_posts,
          trending_hashtags: cluster.trending_hashtags || [],
          cached: true
        }
      });
    }

    // Get articles - handle both junction table formats
    let articles = [];
    if (cluster.articles_story_clusters && Array.isArray(cluster.articles_story_clusters)) {
      articles = cluster.articles_story_clusters
        .map(j => j.articles_id)
        .filter(a => a && typeof a === 'object' && a.id);
    } else if (cluster.articles && Array.isArray(cluster.articles)) {
      articles = cluster.articles.filter(a => a && typeof a === 'object' && a.id);
    }
    
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'No articles in cluster to generate social content' });
    }

    logger.info(`🐦 Generating social content for cluster ${id}: ${cluster.cluster_title?.substring(0, 60)}...`);

    // Generate social content using X.AI Grok
    const socialContent = await xaiService.generateSocialContent({
      cluster_title: cluster.cluster_title,
      cluster_summary: cluster.cluster_summary,
      articles: articles.slice(0, 5) // Limit to 5 articles for context
    });

    // Update cluster in Directus
    const updatePayload = {
      x_posts: socialContent.x_posts || [],
      trending_hashtags: socialContent.trending_hashtags || []
    };

    await directusService.updateItem('story_clusters', id, updatePayload);

    logger.info(`✅ Generated ${socialContent.x_posts.length} tweets, ${socialContent.trending_hashtags.length} hashtags for cluster ${id}`);

    res.json({
      success: true,
      data: {
        x_posts: socialContent.x_posts,
        trending_hashtags: socialContent.trending_hashtags,
        cached: false
      }
    });

  } catch (error) {
    logger.error({ err: error }, 'Error generating social content');
    logger.error({ err: error }, 'Stack');

    res.status(500).json({ error: 'Failed to generate social content', details: error.message });
  }
});

/**
 * POST /api/clusters/create
 * Create new story cluster from articles
 */
router.post('/create', validateClusterInput, async (req, res) => {
  try {
    const { articles, threshold, manual_title } = req.body;
    
    if (!Array.isArray(articles) || articles.length < 2) {
      return res.status(400).json({ 
        error: 'At least 2 articles required for clustering' 
      });
    }
    
    logger.info(`Creating cluster from ${articles.length} articles`);
    
    // Use clustering service to create cluster
    let effThreshold = threshold;
    if (typeof effThreshold !== 'number') {
      try {
        const cs = await adminSettingsService.getClusterSettings();
        if (cs && typeof cs.similarityThreshold === 'number') effThreshold = cs.similarityThreshold;
      } catch (_) {}
    }
    const clusters = await clusteringService.clusterArticles(articles, effThreshold);
    
    if (clusters.length === 0) {
      return res.status(400).json({ 
        error: 'No clusters could be formed with the given threshold' 
      });
    }
    
    // Take the first cluster (or merge if needed)
    let cluster = clusters[0];
    
    // Override title if manually provided
    if (manual_title) {
      cluster.cluster_title = manual_title;
    }
    
    // Generate slug from title
    cluster.slug = cluster.cluster_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Here you would save to database
    // For now, return the cluster data
    
    res.json({
      success: true,
      message: 'Story cluster created successfully',
      data: cluster
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error creating cluster');
    res.status(500).json({ 
      error: 'Failed to create story cluster',
      details: error.message 
    });
  }
});

/**
 * POST /api/clusters/auto-cluster
 * Automatically cluster all eligible articles
 */
router.post('/auto-cluster', async (req, res) => {
  try {
    const { 
      threshold = 0.75, 
      max_articles = 100,
      category,
      hours_back = 24 
    } = req.body;
    
    logger.info('Starting automatic clustering process...');
    
    // Fetch latest articles from Directus CMS
    const sinceDate = new Date(Date.now() - hours_back * 60 * 60 * 1000).toISOString();
    let articles = await directusService.getArticles({
      limit: Math.min(parseInt(max_articles), 500),
      status: 'published'
    });
    
    // Filter by category if provided
    if (category) {
      articles = articles.filter(a => (a.category || '').toLowerCase().includes(String(category).toLowerCase()));
    }
    
    // Filter by recency window
    articles = articles.filter(a => {
      const d = new Date(a.published_at || a.date_created || 0);
      return d.toISOString() >= sinceDate;
    });

    // If still not enough articles, try fetching ALL recent ones (remove date filter)
    if (articles.length < 2) {
      logger.info('Not enough recent articles, fetching more...');
      articles = await directusService.getArticles({
        limit: Math.min(parseInt(max_articles), 500),
        status: 'published'
      });
      if (category) {
        articles = articles.filter(a => (a.category || '').toLowerCase().includes(String(category).toLowerCase()));
      }
    }

    if (articles.length < 2) {
      return res.json({
        success: true,
        message: 'Not enough eligible recent articles for clustering',
        clusters_created: 0
      });
    }
    
    // Perform clustering
    const clusters = await clusteringService.clusterArticles(articles, threshold);
    
    // Filter out single-article clusters unless they're breaking news
    const validClusters = clusters.filter(cluster => 
      cluster.articles.length > 1 || 
      cluster.articles.some(a => a.breaking_news)
    );
    
    logger.info(`Created ${validClusters.length} valid clusters from ${articles.length} articles`);
    
    // Persist first N clusters into Directus and link their articles
    let persisted = 0;
    for (const cluster of validClusters.slice(0, 10)) {
      try {
        const saved = await directusService.saveCluster({
          cluster_title: cluster.cluster_title,
          cluster_summary: cluster.cluster_summary,
          bias_distribution: cluster.bias_distribution,
          source_diversity: cluster.source_diversity,
          key_facts: cluster.key_facts,
          timeline_events: cluster.timeline_events,
          x_posts: cluster.x_posts,
          trending_hashtags: cluster.trending_hashtags,
          fact_check_notes: cluster.fact_check_notes,
          suggested_questions: cluster.suggested_questions,
          suggested_answers: cluster.suggested_answers,
          article_count: cluster.article_count,
          status: 'active'
        });
        const articleIds = (cluster.articles || []).map(a => a.id).filter(Boolean);
        logger.info(`Cluster ${saved?.id}: ${cluster.articles?.length || 0} total articles, ${articleIds.length} with IDs`);
        if (cluster.articles?.length > 0 && articleIds.length === 0) {
          logger.info('Sample article:', JSON.stringify(cluster.articles[0], null, 2).substring(0, 200));
        }
        if (articleIds.length > 0 && saved?.id) {
          await directusService.saveClusterArticles(saved.id, articleIds);
          logger.info(`✓ Linked ${articleIds.length} articles to cluster ${saved.id}`);
        }
        persisted++;
      } catch (e) {
        logger.error({ err: error }, 'Failed to persist cluster');

      }
    }

    res.json({
      success: true,
      message: `Created ${persisted} clusters (valid: ${validClusters.length}) from ${articles.length} recent articles`,
      clusters_created: persisted,
      articles_processed: articles.length
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error in auto-clustering');
    res.status(500).json({ 
      error: 'Auto-clustering failed',
      details: error.message 
    });
  }
});

/**
 * POST /api/clusters/rebuild
 * Optionally re-ingest recent articles from Directus RSS_Sources, then rebuild clusters and persist
 */
router.post('/rebuild', async (req, res) => {
  try {
    const {
      ingest_first = false,
      hours_back = 24,
      min_per_category = 10,
      threshold = 0.75,
      max_articles = 500
    } = req.body || {};

    if (ingest_first) {
      try {
        const RSSProcessingService = require('../services/rssProcessingService');
        const rssService = new RSSProcessingService();
        const sources = await directusService.getItems('RSS_Sources', {
          filter: { enabled: { _eq: true } },
          limit: 100
        });
        const mapped = (sources || []).map(s => ({
          id: s.source_id || s.id,
          name: s.name,
          rss_url: s.rss_url,
          enabled: true,
          domain: s.domain || null,
          credibility_score: s.credibility_score || 0.8,
          default_category: s.category || 'General'
        })).filter(s => s.rss_url);

        const results = await rssService.processAllFeeds(mapped);
        const cutoff = new Date(Date.now() - hours_back * 60 * 60 * 1000);
        const recent = (results.articles || []).filter(a => new Date(a.published_at || a.processed_at || 0) >= cutoff);

        // Group by category and upsert at least N per tracked category
        const trackedCats = ['Politics','Technology','Business','Health','Science','Sports','Entertainment','International'];
        const byCat = new Map();
        const normalize = (c) => {
          const v = String((Array.isArray(c) ? c[0] : (c && typeof c === 'object' ? (c.name||c.label||c.value||c.title||c.category||'General') : c)) || 'General').toLowerCase();
          if (v.includes('politic')) return 'Politics';
          if (v.includes('tech') || v.includes('ai')) return 'Technology';
          if (v.includes('business') || v.includes('market') || v.includes('econom')) return 'Business';
          if (v.includes('health') || v.includes('covid') || v.includes('medical')) return 'Health';
          if (v.includes('science') || v.includes('space') || v.includes('climate')) return 'Science';
          if (v.includes('sport')) return 'Sports';
          if (v.includes('entertain') || v.includes('culture')) return 'Entertainment';
          if (v.includes('world') || v.includes('international') || v.includes('israel') || v.includes('gaza') || v.includes('palestin') || v.includes('ukraine') || v.includes('china') || v.includes('russia')) return 'International';
          return 'General';
        };
        for (const a of recent) {
          const cat = normalize(a.category);
          if (!byCat.has(cat)) byCat.set(cat, []);
          byCat.get(cat).push(a);
        }
        for (const cat of trackedCats) {
          const list = (byCat.get(cat) || []).sort((x,y) => new Date(y.published_at||0) - new Date(x.published_at||0));
          const selected = list.slice(0, min_per_category);
          for (const art of selected) {
            try { await directusService.upsertArticleBySourceUrl({ ...art, category: cat }); } catch {}
          }
        }
      } catch (e) {
        logger.error({ err: error }, 'Rebuild ingestion step failed');

      }
    }

    // After ingestion (optional), cluster recent CMS articles (auto-cluster logic)
    const sinceDate = new Date(Date.now() - hours_back * 60 * 60 * 1000).toISOString();
    let articles = await directusService.getArticles({
      limit: Math.min(parseInt(max_articles), 600)
    });
    articles = articles.filter(a => new Date(a.published_at || a.date_created || 0).toISOString() >= sinceDate);
    if (articles.length < 2) {
      return res.json({ success: true, message: 'Not enough recent articles to rebuild clusters', clusters_created: 0 });
    }

    // Use DBSCAN or cosine similarity based on admin settings
    const clusterSettings = await adminSettingsService.getClusterSettings();
    const algorithm = clusterSettings.clusteringAlgorithm || 'dbscan';
    
    logger.info('🔍 CLUSTERING DEBUG:', {
      algorithm,
      dbscanEps: clusterSettings.dbscanEps,
      dbscanMinSamples: clusterSettings.dbscanMinSamples,
      similarityThreshold: clusterSettings.similarityThreshold,
      articleCount: articles.length
    });
    
    let clusters;
    if (algorithm === 'dbscan') {
      logger.info('✅ Using DBSCAN algorithm');
      clusters = await clusteringService.clusterArticlesDBSCAN(articles);
    } else {
      logger.info('⚠️ Using COSINE algorithm (legacy)');
      clusters = await clusteringService.clusterArticles(articles, { threshold });
    }
    
    const validClusters = clusters.filter(c => c.articles.length > 1 || c.articles.some(a => a.breaking_news));

    let persisted = 0;
    for (const cluster of validClusters.slice(0, 10)) {
      try {
        const saved = await directusService.saveCluster({
          cluster_title: cluster.cluster_title,
          cluster_summary: cluster.cluster_summary,
          bias_distribution: cluster.bias_distribution,
          source_diversity: cluster.source_diversity,
          key_facts: cluster.key_facts,
          timeline_events: cluster.timeline_events,
          x_posts: cluster.x_posts,
          trending_hashtags: cluster.trending_hashtags,
          fact_check_notes: cluster.fact_check_notes,
          suggested_questions: cluster.suggested_questions,
          suggested_answers: cluster.suggested_answers,
          article_count: cluster.article_count,
          status: 'active'
        });
        const articleIds = (cluster.articles || []).map(a => a.id).filter(Boolean);
        if (articleIds.length > 0 && saved?.id) {
          await directusService.saveClusterArticles(saved.id, articleIds);
        }
        persisted++;
      } catch (e) {
        logger.error({ err: error }, 'Persist cluster failed (rebuild)');

      }
    }

    return res.json({ success: true, message: `Rebuilt ${persisted} clusters`, clusters_created: persisted, articles_processed: articles.length });
  } catch (error) {
    logger.error({ err: error }, 'Error in rebuild');
    return res.status(500).json({ error: 'Cluster rebuild failed', details: error.message });
  }
});

/**
 * PUT /api/clusters/:id
 * Update story cluster
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate allowed updates
    const allowedFields = [
      'cluster_title', 'cluster_summary', 'topic_category', 
      'status', 'fact_check_notes'
    ];
    
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Add updated timestamp
    filteredUpdates.updated_at = new Date().toISOString();
    
    const updated = await directusService.updateItem('story_clusters', id, filteredUpdates);
    if (!updated) {
      return res.status(404).json({ error: 'Story cluster not found' });
    }
    
    res.json({
      success: true,
      message: 'Story cluster updated successfully',
      data: updated
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error updating cluster');
    res.status(500).json({ error: 'Failed to update story cluster' });
  }
});

/**
 * DELETE /api/clusters/:id
 * Delete story cluster (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const archived = await directusService.updateItem('story_clusters', id, {
      status: 'archived',
      updated_at: new Date().toISOString()
    });

    if (!archived) {
      return res.status(404).json({ error: 'Story cluster not found' });
    }
    
    res.json({
      success: true,
      message: 'Story cluster archived successfully',
      data: archived
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error deleting cluster');
    res.status(500).json({ error: 'Failed to delete story cluster' });
  }
});

/**
 * GET /api/clusters/:id/articles
 * Get all articles in a specific cluster
 */
router.get('/:id/articles', async (req, res) => {
  try {
    const { id } = req.params;

    const cluster = await directusService.getClusterById(id);
    if (!cluster) {
      return res.status(404).json({ error: 'Story cluster not found' });
    }

    const articles = Array.isArray(cluster.articles_story_clusters)
      ? cluster.articles_story_clusters
          .map((junction) => junction.articles_id)
          .filter((article) => article && typeof article === 'object' && article.id)
          .map((article) => ({
            id: article.id,
            title: article.title || 'Untitled',
            source_name: article.source_name || 'Unknown Source',
            political_bias: article.political_bias || 'center',
            similarity_score: 0.85,
            is_primary_source: false,
            url: article.source_url || article.url,
            source_url: article.source_url || article.url,
            published_date: article.published_at || article.date_created,
            excerpt: article.summary || ''
          }))
      : [];

    res.json({
      success: true,
      data: articles
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching cluster articles');
    res.status(500).json({ error: 'Failed to fetch cluster articles', details: error.message });
  }
});

/**
 * POST /api/clusters/archive-all
 * Soft-delete (archive) all story clusters. Supports dry run with ?dry_run=true
 */
router.post('/archive-all', async (req, res) => {
  try {
    const dryRun = String(req.query.dry_run || 'false').toLowerCase() === 'true';

    // Fetch all clusters in batches
    const batchSize = 200;
    let offset = 0;
    let total = 0;
    const ids = [];
    while (true) {
      const batch = await directusService.getItems('story_clusters', {
        limit: batchSize,
        offset,
        fields: 'id,status'
      });
      if (!Array.isArray(batch) || batch.length === 0) break;
      ids.push(...batch.map(c => c.id).filter(Boolean));
      total += batch.length;
      offset += batch.length;
      if (batch.length < batchSize) break;
    }

    if (dryRun) {
      return res.json({ success: true, dry_run: true, total_clusters_found: total, ids_preview: ids.slice(0, 10) });
    }

    // Archive all clusters
    let archived = 0;
    for (const id of ids) {
      try {
        await directusService.updateItem('story_clusters', id, { status: 'archived' });
        archived++;
      } catch (e) {
        logger.error({ err: e }, `Failed to archive cluster ${id}`);
      }
    }

    return res.json({ success: true, archived, total });
  } catch (error) {
    logger.error({ err: error }, 'Error archiving all clusters');
    return res.status(500).json({ success: false, error: 'Failed to archive clusters', details: error.message });
  }
});

module.exports = router;
