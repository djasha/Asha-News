const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const RSSProcessingService = require('../services/rssProcessingService');
const DirectusService = require('../services/directusService');

const rssService = new RSSProcessingService();
const directusService = new DirectusService();

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

    const results = await rssService.processAllFeeds(rss_sources);
    
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
 * POST /api/rss/ingest-from-directus
 * Load enabled RSS sources from Directus, fetch latest items, ensure at least N per category,
 * and upsert selected articles into Directus `articles` collection.
 */
router.post('/ingest-from-directus', async (req, res) => {
  try {
    const { hours_back = 36, min_per_category = 10, max_feeds = 50 } = req.body || {};

    // Load enabled RSS sources from Directus CMS
    const sources = await directusService.getItems('RSS_Sources', {
      filter: { enabled: { _eq: true } },
      limit: max_feeds
    });
    if (!sources || sources.length === 0) {
      return res.status(400).json({ success: false, error: 'No enabled RSS sources found in Directus' });
    }

    // Process feeds
    const rssSources = sources
      .map(s => ({
        id: s.source_id || s.id || (s.name ? s.name.toLowerCase().replace(/\s+/g, '-') : undefined),
        name: s.name,
        rss_url: s.rss_url,
        enabled: true,
        domain: s.domain || null,
        credibility_score: s.credibility_score || 0.8,
        default_category: s.category || 'General'
      }))
      .filter(s => s.rss_url);

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

    // Select latest N per category and upsert into Directus
    const trackedCats = ['Politics','Technology','Business','Health','Science','Sports','Entertainment','International'];
    const summary = {};
    for (const cat of trackedCats) {
      const list = (byCat.get(cat) || []).sort((x, y) => new Date(y.published_at || 0) - new Date(x.published_at || 0));
      const selected = list.slice(0, min_per_category);
      summary[cat] = { available: list.length, upserted: 0 };
      for (const art of selected) {
        try {
          await directusService.upsertArticleBySourceUrl({ ...art, category: cat });
          summary[cat].upserted++;
        } catch (e) {
          // continue on errors for individual articles
        }
      }
    }

    return res.json({ success: true, processed_feeds: results.processed_feeds, summary });
  } catch (error) {
    logger.error({ err: error }, 'ingest-from-directus error');
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/process-single-feed
 * Process a single RSS feed
 */
router.post('/process-single-feed', async (req, res) => {
  try {
    const { source } = req.body;
    
    if (!source || !source.rss_url) {
      return res.status(400).json({
        error: 'RSS source with rss_url is required',
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

    const result = await rssService.processSingleFeed(source);
    
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
 * Process RSS feeds using sources from CMS
 */
router.post('/process-from-cms', async (req, res) => {
  try {
    const cmsSources = await directusService.getRSSSources({ enabled: true });
    const rssSources = (cmsSources || []).filter((source) => source?.rss_url && source?.enabled !== false);

    if (rssSources.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No enabled RSS sources found in CMS'
      });
    }

    const results = await rssService.processAllFeeds(rssSources);
    
    res.json({
      success: true,
      results,
      sources_processed: rssSources.length,
      message: `Processed ${results.processed_feeds} CMS RSS sources`
    });
    
  } catch (error) {
    logger.error({ err: error }, 'CMS RSS processing error');
    res.status(500).json({
      error: 'Failed to process CMS RSS feeds',
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
