const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const contentRepository = require('../services/contentRepository');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';

const requireAdminIfStrict = (req, res, next) => {
  if (!strictAuth) return next();
  return authenticateToken(req, res, () => requireAdmin(req, res, next));
};

/**
 * Get site settings
 * Phase 1: Read-only - Returns fallback data if collection doesn't exist
 */
router.get('/', async (req, res) => {
  try {
    // Try to fetch from site_settings collection
    let settings;
    try {
      const result = await contentRepository.getItems('site_settings', { limit: 1 });
      settings = result && result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.info('site_settings collection not yet created, using defaults');
      settings = null;
    }
    
    // Fallback defaults if collection doesn't exist
    const defaults = {
      site_name: 'Asha.News',
      site_tagline: 'Unbiased News Aggregation',
      site_description: 'AI-powered news aggregation with bias analysis',
      primary_color: '#1a56db',
      secondary_color: '#9061f9',
      logo_url: '/logo.png',
      favicon_url: '/favicon.ico',
      timezone: 'UTC',
      language: 'en',
      date_format: 'MMM DD, YYYY',
      time_format: '12h',
      // SEO
      meta_title: 'Asha.News - Unbiased News Aggregation',
      meta_description: 'Get news from multiple sources with AI-powered bias analysis',
      meta_keywords: ['news', 'unbiased', 'AI', 'aggregation', 'bias analysis'],
      og_image: '/og-image.png',
      twitter_card: 'summary_large_image',
      twitter_site: '@ashanews',
      // Social
      twitter_url: '',
      facebook_url: '',
      instagram_url: '',
      linkedin_url: '',
      // Contact
      contact_email: 'contact@asha.news',
      support_email: 'support@asha.news',
      press_email: 'press@asha.news'
    };
    
    const data = settings || defaults;
    
    res.json({ 
      success: true, 
      data,
      source: settings ? 'repository' : 'defaults'
    });
  } catch (error) {
    logger.error({ err: error }, 'Get site settings error');
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update site settings
 * Phase 1: Creates collection if needed, then saves
 */
router.put('/', requireAdminIfStrict, async (req, res) => {
  try {
    // Check if collection exists by trying to fetch
    let collectionExists = true;
    try {
      await contentRepository.getItems('site_settings', { limit: 1 });
    } catch (error) {
      collectionExists = false;
    }
    
    // If collection doesn't exist, create it first
    if (!collectionExists) {
      logger.info('Creating site_settings collection...');
      // Note: Collection creation should be done via separate setup script
      // For now, return error asking admin to run setup
      return res.status(400).json({
        error: 'site_settings collection not created yet',
        message: 'Please run setup script first: node server/scripts/createSiteSettingsCollection.js'
      });
    }
    
    // Check if settings exist
    const existing = await contentRepository.getItems('site_settings', { limit: 1 });
    
    if (existing && existing.length > 0) {
      // Update existing
      const updated = await contentRepository.updateItem('site_settings', existing[0].id, req.body);
      res.json({ success: true, data: updated, action: 'updated' });
    } else {
      // Create new
      const created = await contentRepository.createItem('site_settings', req.body);
      res.json({ success: true, data: created, action: 'created' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Update site settings error');
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
