/**
 * Content Enhancement API Routes
 * Endpoints for AI-powered article enhancement and metadata generation
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const ContentEnhancementService = require('../services/contentEnhancementService');

const contentService = new ContentEnhancementService();

/**
 * POST /api/content/enhance
 * Enhance a single article with AI-powered metadata
 */
router.post('/enhance', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.content) {
      return res.status(400).json({
        error: 'Article with content is required'
      });
    }

    const enhancedArticle = await contentService.enhanceArticle(article);
    
    res.json({
      success: true,
      data: enhancedArticle
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enhancing article');
    res.status(500).json({
      error: 'Failed to enhance article',
      details: error.message
    });
  }
});

/**
 * POST /api/content/enhance-batch
 * Enhance multiple articles in batch
 */
router.post('/enhance-batch', async (req, res) => {
  try {
    const { articles, batchSize = 3 } = req.body;
    
    if (!articles || !Array.isArray(articles)) {
      return res.status(400).json({
        error: 'Articles array is required'
      });
    }

    const enhancedArticles = await contentService.enhanceArticles(articles, batchSize);
    
    res.json({
      success: true,
      data: enhancedArticles,
      count: enhancedArticles.length
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enhancing articles batch');
    res.status(500).json({
      error: 'Failed to enhance articles batch',
      details: error.message
    });
  }
});

/**
 * POST /api/content/calculate-metrics
 * Calculate basic content metrics (word count, reading time, difficulty)
 */
router.post('/calculate-metrics', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const wordCount = contentService.calculateWordCount(content);
    const readingTime = contentService.calculateReadingTime(wordCount);
    const difficultyScore = contentService.calculateDifficultyScore(content);
    
    res.json({
      success: true,
      data: {
        word_count: wordCount,
        reading_time: readingTime,
        difficulty_score: difficultyScore
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error calculating metrics');
    res.status(500).json({
      error: 'Failed to calculate metrics',
      details: error.message
    });
  }
});

/**
 * POST /api/content/generate-seo
 * Generate SEO metadata for an article
 */
router.post('/generate-seo', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }

    const [seoTitle, seoDescription, keywords] = await Promise.all([
      contentService.generateSEOTitle(title, content, category),
      contentService.generateSEODescription(title, content, category),
      contentService.extractKeywords(title, content, category)
    ]);
    
    res.json({
      success: true,
      data: {
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: keywords
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error generating SEO metadata');
    res.status(500).json({
      error: 'Failed to generate SEO metadata',
      details: error.message
    });
  }
});

/**
 * POST /api/content/generate-summary
 * Generate article summary
 */
router.post('/generate-summary', async (req, res) => {
  try {
    const { content, maxLength = 200 } = req.body;
    
    if (!content) {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const summary = await contentService.generateSummary(content, maxLength);
    
    res.json({
      success: true,
      data: {
        summary: summary
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error generating summary');
    res.status(500).json({
      error: 'Failed to generate summary',
      details: error.message
    });
  }
});

module.exports = router;
