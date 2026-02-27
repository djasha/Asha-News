const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const DirectusService = require('../services/directusService');
const Parser = require('rss-parser');

const directusService = new DirectusService();
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AshaNews/1.0; +https://asha.news)'
  }
});

/**
 * GET /api/rss/sources
 * Get all RSS sources
 */
router.get('/sources', async (req, res) => {
  try {
    const { enabled, category, bias } = req.query;
    
    // Build filter
    const filter = {};
    if (enabled !== undefined) {
      filter.enabled = enabled === 'true';
    }
    if (category) {
      filter.category = category;
    }
    if (bias) {
      filter.political_bias = bias;
    }

    const sources = await directusService.getRSSSources(filter);
    
    res.json({
      success: true,
      data: sources,
      count: sources.length
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching RSS sources');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RSS sources',
      message: error.message
    });
  }
});

/**
 * GET /api/rss/sources/:id
 * Get specific RSS source by ID
 */
router.get('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const source = await directusService.getRSSSourceById(id);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'RSS source not found'
      });
    }
    
    res.json({
      success: true,
      data: source
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching RSS source');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RSS source',
      message: error.message
    });
  }
});

/**
 * POST /api/rss/sources
 * Create new RSS source
 */
router.post('/sources', async (req, res) => {
  try {
    const sourceData = req.body;
    
    // Validate required fields
    if (!sourceData.name || !sourceData.rss_url) {
      return res.status(400).json({
        success: false,
        error: 'Name and RSS URL are required'
      });
    }

    // Validate URL format
    try {
      new URL(sourceData.rss_url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid RSS URL format'
      });
    }

    // Set defaults
    const newSource = {
      name: sourceData.name,
      rss_url: sourceData.rss_url,
      category: sourceData.category || 'general',
      political_bias: sourceData.political_bias || 'center',
      credibility_score: sourceData.credibility_score || 7,
      region: sourceData.region || 'global',
      enabled: sourceData.enabled !== undefined ? sourceData.enabled : true,
      fetch_frequency: sourceData.fetch_frequency || 30,
      description: sourceData.description || '',
      status: 'active'
    };

    const created = await directusService.createRSSSource(newSource);
    
    res.status(201).json({
      success: true,
      data: created,
      message: 'RSS source created successfully'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating RSS source');
    res.status(500).json({
      success: false,
      error: 'Failed to create RSS source',
      message: error.message
    });
  }
});

/**
 * PUT /api/rss/sources/:id
 * Update RSS source
 */
router.put('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate URL if provided
    if (updates.rss_url) {
      try {
        new URL(updates.rss_url);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'Invalid RSS URL format'
        });
      }
    }

    const updated = await directusService.updateRSSSource(id, updates);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'RSS source not found'
      });
    }
    
    res.json({
      success: true,
      data: updated,
      message: 'RSS source updated successfully'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating RSS source');
    res.status(500).json({
      success: false,
      error: 'Failed to update RSS source',
      message: error.message
    });
  }
});

/**
 * DELETE /api/rss/sources/:id
 * Delete RSS source
 */
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await directusService.deleteRSSSource(id);
    
    res.json({
      success: true,
      message: 'RSS source deleted successfully'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting RSS source');
    res.status(500).json({
      success: false,
      error: 'Failed to delete RSS source',
      message: error.message
    });
  }
});

/**
 * POST /api/rss/test
 * Test RSS feed connectivity and validity
 */
router.post('/test', async (req, res) => {
  try {
    const { rss_url } = req.body;

    if (!rss_url) {
      return res.status(400).json({
        success: false,
        error: 'RSS URL is required'
      });
    }

    // Validate URL format
    try {
      new URL(rss_url);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    logger.info(`[RSS Test] Testing feed: ${rss_url}`);

    // Try to parse the RSS feed
    const feed = await parser.parseURL(rss_url);

    if (!feed || !feed.items || feed.items.length === 0) {
      return res.json({
        success: false,
        error: 'No articles found in RSS feed'
      });
    }

    res.json({
      success: true,
      message: 'RSS feed is valid and accessible',
      articleCount: feed.items.length,
      feedTitle: feed.title,
      feedDescription: feed.description,
      sampleArticles: feed.items.slice(0, 3).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate
      }))
    });
  } catch (error) {
    logger.error({ err: error }, 'Error testing RSS feed');
    res.status(500).json({
      success: false,
      error: 'Failed to test RSS feed',
      message: error.message,
      details: error.code === 'ENOTFOUND' ? 'URL not found or inaccessible' :
               error.code === 'ETIMEDOUT' ? 'Connection timeout' :
               'Unknown error'
    });
  }
});

/**
 * POST /api/rss/sources/:id/fetch
 * Manually trigger fetch for specific source
 */
router.post('/sources/:id/fetch', async (req, res) => {
  try {
    const { id } = req.params;
    const source = await directusService.getRSSSourceById(id);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'RSS source not found'
      });
    }

    if (!source.enabled) {
      return res.status(400).json({
        success: false,
        error: 'RSS source is disabled'
      });
    }

    // Fetch articles from the RSS feed
    const feed = await parser.parseURL(source.rss_url);
    const articleCount = feed.items.length;

    // TODO: Process and save articles to Directus
    // This would be handled by your RSS processing service

    res.json({
      success: true,
      message: `Found ${articleCount} articles from ${source.name}`,
      articleCount,
      source: {
        id: source.id,
        name: source.name,
        rss_url: source.rss_url
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching from RSS source');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch from RSS source',
      message: error.message
    });
  }
});

/**
 * GET /api/rss/sources/stats
 * Get RSS sources statistics
 */
router.get('/sources/stats', async (req, res) => {
  try {
    const sources = await directusService.getRSSSources();
    
    const stats = {
      total: sources.length,
      enabled: sources.filter(s => s.enabled).length,
      disabled: sources.filter(s => !s.enabled).length,
      byBias: {
        left: sources.filter(s => s.political_bias === 'left').length,
        center: sources.filter(s => s.political_bias === 'center').length,
        right: sources.filter(s => s.political_bias === 'right').length
      },
      byCategory: sources.reduce((acc, source) => {
        acc[source.category] = (acc[source.category] || 0) + 1;
        return acc;
      }, {}),
      avgCredibility: sources.length > 0
        ? (sources.reduce((sum, s) => sum + (s.credibility_score || 0), 0) / sources.length).toFixed(2)
        : 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching RSS stats');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RSS statistics',
      message: error.message
    });
  }
});

module.exports = router;
