const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const contentRepository = require('../services/contentRepository');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';


if (strictAuth) {
  router.use(authenticateToken, requireAdmin);
}

/**
 * POST /api/cleanup/old-articles
 * Delete articles older than the latest X articles
 */
router.post('/old-articles', async (req, res) => {
  try {
    const { keepLatest = 300 } = req.body;
    
    logger.info(`Starting cleanup: keeping latest ${keepLatest} articles`);
    
    // Get all articles sorted by date (newest first)
    const allArticles = await contentRepository.getArticles({
      sortBy: 'date',
      limit: -1 // Get all
    });
    
    const articles = allArticles.articles || [];
    logger.info(`Found ${articles.length} total articles`);
    
    if (articles.length <= keepLatest) {
      return res.json({
        success: true,
        message: `No cleanup needed. Article count (${articles.length}) is within limit (${keepLatest})`,
        deleted: 0,
        remaining: articles.length
      });
    }
    
    // Get articles to delete (everything after the first keepLatest articles)
    const articlesToDelete = articles.slice(keepLatest);
    logger.info(`Will delete ${articlesToDelete.length} old articles`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Delete one by one (safer)
    for (const article of articlesToDelete) {
      try {
        await contentRepository.deleteArticle(article.id);
        deletedCount++;
        
        // Log progress every 50 articles
        if (deletedCount % 50 === 0) {
          logger.info(`Progress: ${deletedCount}/${articlesToDelete.length} deleted`);
        }
      } catch (error) {
        errorCount++;
        logger.error({ err: error }, `Error deleting article ${article.id}`);
      }
    }
    
    logger.info(`Cleanup complete: deleted ${deletedCount}, errors ${errorCount}`);
    
    res.json({
      success: true,
      message: `Cleanup complete`,
      deleted: deletedCount,
      errors: errorCount,
      remaining: keepLatest
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error in cleanup');
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old articles',
      message: error.message
    });
  }
});

/**
 * GET /api/cleanup/stats
 * Get cleanup statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const allArticles = await contentRepository.getArticles({
      limit: -1
    });
    
    const articles = allArticles.articles || [];
    const keepLatest = 300;
    const toDelete = Math.max(0, articles.length - keepLatest);
    
    res.json({
      success: true,
      data: {
        total: articles.length,
        keepLatest: keepLatest,
        toDelete: toDelete,
        needsCleanup: articles.length > keepLatest
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting cleanup stats');
    res.status(500).json({
      success: false,
      error: 'Failed to get cleanup stats',
      message: error.message
    });
  }
});

module.exports = router;
