const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const RSSProcessingService = require('../services/rssProcessingService');
const contentRepository = require('../services/contentRepository');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const rssService = new RSSProcessingService();
const getSourceUrl = (source) => source?.rss_url || source?.url || null;

const requireOpsAccess = (req, res, next) => {
  if (!strictAuth) return next();

  const providedInternal = req.header('X-Internal-Key') || req.header('x-internal-key');
  if (INTERNAL_API_KEY && providedInternal && providedInternal === INTERNAL_API_KEY) {
    return next();
  }

  return authenticateToken(req, res, () => requireAdmin(req, res, next));
};

if (strictAuth) {
  router.use(requireOpsAccess);
}

/**
 * POST /api/rss/process-feeds
 * Process all enabled RSS feeds
 */
router.post('/process-feeds', async (req, res) => {
  try {
    const { rss_sources } = req.body;
    
    if (!Array.isArray(rss_sources)) {
      return res.status(400).json({
        error: 'rss_sources array is required',
        example: {
          rss_sources: [
            {
              id: 1,
              name: "BBC News",
              rss_url: "http://feeds.bbci.co.uk/news/rss.xml",
              enabled: true,
              domain: "bbc.com",
              credibility_score: 0.9
            }
          ]
        }
      });
    }

    const normalizedSources = rss_sources.map((source) => {
      const sourceUrl = getSourceUrl(source);
      if (!sourceUrl) return source;
      return {
        ...source,
        url: sourceUrl,
        rss_url: sourceUrl,
      };
    });

    const results = await rssService.processAllFeeds(normalizedSources);
    
    res.json({
      success: true,
      results,
      message: `Processed ${results.processed_feeds} feeds, found ${results.new_articles} new articles`
    });
    
  } catch (error) {
    logger.error({ err: error }, 'RSS processing error');
    res.status(500).json({
      error: 'Failed to process RSS feeds',
      message: error.message
    });
  }
});

/**
 * Ingest from enabled RSS sources stored in the content repository and upsert
 * normalized recent articles by category.
 */
const ingestFromContentSources = async (req, res) => {
  try {
    const { hours_back = 36, min_per_category = 10, max_feeds = 50 } = req.body || {};

    // Load enabled RSS sources from content repository
    const sources = await contentRepository.getItems('RSS_Sources', {
      filter: { enabled: { _eq: true } },
      limit: max_feeds
    });
    if (!sources || sources.length === 0) {
      return res.status(400).json({ success: false, error: 'No enabled RSS sources found' });
    }

    // Process feeds
    const rssSources = sources
      .map(s => ({
        id: s.source_id || s.id || (s.name ? s.name.toLowerCase().replace(/\s+/g, '-') : undefined),
        name: s.name,
        url: getSourceUrl(s),
        rss_url: getSourceUrl(s),
        enabled: true,
        domain: s.domain || null,
        credibility_score: s.credibility_score || 0.8,
        default_category: s.category || 'General'
      }))
      .filter((s) => Boolean(getSourceUrl(s)));

    const results = await rssService.processAllFeeds(rssSources);
    const allArticles = results.articles || [];

    // Filter to recent window
    const cutoff = new Date(Date.now() - hours_back * 60 * 60 * 1000);
    const recent = allArticles.filter(a => new Date(a.published_at || a.processed_at || Date.now()) >= cutoff);

    // Normalize category labels and group
    const normalizeCategory = (c) => {
      let v = c;
      if (Array.isArray(v)) v = v[0];
      if (v && typeof v === 'object') {
        v = v.name || v.label || v.value || v.title || v.category || JSON.stringify(v);
      }
      const t = String(v || 'General').toLowerCase();
      if (t.includes('politic')) return 'Politics';
      if (t.includes('tech') || t.includes('ai') || t.includes('science & technology')) return 'Technology';
      if (t.includes('business') || t.includes('market') || t.includes('econom')) return 'Business';
      if (t.includes('health') || t.includes('covid') || t.includes('medical')) return 'Health';
      if (t.includes('science') || t.includes('space') || t.includes('climate')) return 'Science';
      if (t.includes('sport')) return 'Sports';
      if (t.includes('entertain') || t.includes('culture')) return 'Entertainment';
      if (t.includes('world') || t.includes('international') || t.includes('israel') || t.includes('gaza') || t.includes('palestin') || t.includes('ukraine') || t.includes('china') || t.includes('russia')) return 'International';
      return 'General';
    };

    const byCat = new Map();
    recent.forEach(a => {
      const cat = normalizeCategory(a.category);
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(a);
    });

    // Select latest N per category and upsert into content repository
    const trackedCats = ['Politics','Technology','Business','Health','Science','Sports','Entertainment','International'];
    const summary = {};
    for (const cat of trackedCats) {
      const list = (byCat.get(cat) || []).sort((x, y) => new Date(y.published_at || 0) - new Date(x.published_at || 0));
      const selected = list.slice(0, min_per_category);
      summary[cat] = { available: list.length, upserted: 0 };
      for (const art of selected) {
        try {
          await contentRepository.upsertArticleBySourceUrl({ ...art, category: cat });
          summary[cat].upserted++;
        } catch (e) {
          // continue on errors for individual articles
        }
      }
    }

    return res.json({ success: true, processed_feeds: results.processed_feeds, summary });
  } catch (error) {
    logger.error({ err: error }, 'ingest-from-content error');
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/rss/ingest-from-content
 * Canonical ingestion endpoint.
 */
router.post('/ingest-from-content', ingestFromContentSources);

/**
 * POST /api/rss/ingest-from-directus
 * Deprecated compatibility endpoint for older automations.
 */
router.post('/ingest-from-directus', (req, res) => {
  res.set('Deprecation', 'true');
  res.set('Sunset', '2026-06-30');
  return ingestFromContentSources(req, res);
});

/**
 * POST /api/rss/process-single-feed
 * Process a single RSS feed
 */
router.post('/process-single-feed', async (req, res) => {
  try {
    const { source } = req.body;
    
    const sourceUrl = getSourceUrl(source);
    if (!source || !sourceUrl) {
      return res.status(400).json({
        error: 'RSS source with rss_url or url is required',
        example: {
          source: {
            name: "BBC News",
            rss_url: "http://feeds.bbci.co.uk/news/rss.xml",
            enabled: true,
            domain: "bbc.com"
          }
        }
      });
    }

    const result = await rssService.processSingleFeed({
      ...source,
      url: sourceUrl,
      rss_url: sourceUrl,
    });
    
    res.json({
      success: true,
      result,
      message: `Processed ${result.source_name}: ${result.new_articles} new, ${result.updated_articles} updated`
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Single feed processing error');
    res.status(500).json({
      error: 'Failed to process RSS feed',
      message: error.message
    });
  }
});

/**
 * GET /api/rss/stats
 * Get RSS processing statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = rssService.getProcessingStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'RSS stats error');
    res.status(500).json({
      error: 'Failed to get RSS statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/rss/clear-cache
 * Clear processed articles cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    const result = rssService.clearCache();
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'RSS cache clear error');
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * POST /api/rss/process-from-cms
 * Process RSS feeds using sources from the content repository
 */
router.post('/process-from-cms', async (req, res) => {
  try {
    const cmsSources = await contentRepository.getRSSSources({ enabled: true });
    const rssSources = (cmsSources || [])
      .map((source) => {
        const sourceUrl = getSourceUrl(source);
        if (!sourceUrl) return source;
        return {
          ...source,
          url: sourceUrl,
          rss_url: sourceUrl,
        };
      })
      .filter((source) => Boolean(getSourceUrl(source)) && source?.enabled !== false);

    if (rssSources.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No enabled RSS sources found in content repository'
      });
    }

    const results = await rssService.processAllFeeds(rssSources);
    
    res.json({
      success: true,
      results,
      sources_processed: rssSources.length,
      message: `Processed ${results.processed_feeds} configured RSS sources`
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Content repository RSS processing error');
    res.status(500).json({
      error: 'Failed to process configured RSS feeds',
      message: error.message
    });
  }
});

/**
 * GET /api/rss/test-feed
 * Test RSS feed parsing without processing
 */
router.get('/test-feed', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        error: 'url parameter is required',
        example: '/api/rss/test-feed?url=http://feeds.bbci.co.uk/news/rss.xml'
      });
    }

    const Parser = require('rss-parser');
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    
    res.json({
      success: true,
      feed_info: {
        title: feed.title,
        description: feed.description,
        link: feed.link,
        language: feed.language,
        items_count: feed.items.length,
        last_build_date: feed.lastBuildDate
      },
      sample_items: feed.items.slice(0, 3).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        author: item.creator || item.author,
        categories: item.categories
      })),
      tested_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'RSS feed test error');
    res.status(500).json({
      error: 'Failed to test RSS feed',
      message: error.message,
      url: req.query.url
    });
  }
});

module.exports = router;
