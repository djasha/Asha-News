/**
 * RSS Automation API Routes
 * Provides endpoints to control RSS automation from admin panel
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const RSSAutomationService = require('../services/rssAutomationService');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Initialize RSS automation service
const rssAutomation = new RSSAutomationService();

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
 * GET /api/rss-automation/status
 * Get current automation status
 */
router.get('/status', async (req, res) => {
  try {
    const status = rssAutomation.getStatus();
    const settings = await rssAutomation.getAutomationSettings();
    // Surface env override for visibility in status response
    const envAuto = process.env.RSS_AUTO_IMPORT_TO_CMS && ['true','1','yes'].includes(String(process.env.RSS_AUTO_IMPORT_TO_CMS).trim().toLowerCase());
    const effectiveSettings = { ...settings };
    if (envAuto) {
      effectiveSettings.auto_import_to_cms = true;
    }
    effectiveSettings.auto_import_effective = Boolean(effectiveSettings.auto_import_to_cms);
    const sources = await rssAutomation.getEnabledSources();
    
    return res.json({
      success: true,
      data: {
        ...status,
        settings: effectiveSettings,
        enabledSources: sources.length,
        totalSources: sources.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting RSS automation status');
    res.status(500).json({
      success: false,
      message: 'Failed to get automation status',
      error: error.message
    });
  }
});

/**
 * POST /api/rss-automation/import
 * Import latest generated output (articles.json) into Directus with tags
 */
router.post('/import', async (req, res) => {
  try {
    if (typeof rssAutomation.importLatestOutputToDirectus !== 'function') {
      return res.status(501).json({ success: false, message: 'Import not available' });
    }
    const result = await rssAutomation.importLatestOutputToDirectus();
    return res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ err: error }, 'Error importing latest output');
    return res.status(500).json({ success: false, message: 'Failed to import', error: error.message });
  }
});

/**
 * POST /api/rss-automation/start
 * Start automated RSS fetching
 */
router.post('/start', async (req, res) => {
  try {
    await rssAutomation.start();
    
    res.json({
      success: true,
      message: 'RSS automation started successfully',
      data: rssAutomation.getStatus()
    });
  } catch (error) {
    logger.error({ err: error }, 'Error starting RSS automation');
    res.status(500).json({
      success: false,
      message: 'Failed to start RSS automation',
      error: error.message
    });
  }
});

/**
 * POST /api/rss-automation/stop
 * Stop automated RSS fetching
 */
router.post('/stop', async (req, res) => {
  try {
    rssAutomation.stop();
    
    res.json({
      success: true,
      message: 'RSS automation stopped successfully',
      data: rssAutomation.getStatus()
    });
  } catch (error) {
    logger.error({ err: error }, 'Error stopping RSS automation');
    res.status(500).json({
      success: false,
      message: 'Failed to stop RSS automation',
      error: error.message
    });
  }
});

/**
 * POST /api/rss-automation/fetch
 * Trigger manual RSS fetch
 */
router.post('/fetch', async (req, res) => {
  try {
    const result = await rssAutomation.triggerFetch();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          lastFetch: result.lastFetch,
          status: rssAutomation.getStatus()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error triggering RSS fetch');
    res.status(500).json({
      success: false,
      message: 'Failed to trigger RSS fetch',
      error: error.message
    });
  }
});

/**
 * GET /api/rss-automation/sources
 * Get RSS sources with statistics
 */
router.get('/sources', async (req, res) => {
  try {
    const sources = await rssAutomation.getEnabledSources();
    
    res.json({
      success: true,
      data: sources,
      total: sources.length
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting RSS sources');
    res.status(500).json({
      success: false,
      message: 'Failed to get RSS sources',
      error: error.message
    });
  }
});

/**
 * GET /api/rss-automation/settings
 * Get automation settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await rssAutomation.getAutomationSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting RSS automation settings');
    res.status(500).json({
      success: false,
      message: 'Failed to get automation settings',
      error: error.message
    });
  }
});

module.exports = router;
