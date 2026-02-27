const express = require('express');
const GroqAnalysisService = require('../services/groqAnalysisService');

const router = express.Router();
const logger = require('../utils/logger');
const groqService = new GroqAnalysisService();

/**
 * POST /api/palestine-analysis/article
 * Analyze article with Palestine/Israel focused bias detection
 */
router.post('/article', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article object with title is required'
      });
    }

    const analysis = await groqService.analyzeArticle(article);
    
    res.json({
      success: true,
      analysis,
      message: 'Article analyzed successfully with Palestine context'
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Palestine analysis error');
    res.status(500).json({
      error: 'Failed to analyze article',
      message: error.message
    });
  }
});

/**
 * POST /api/palestine-analysis/summary
 * Generate article summary with Palestinian context
 */
router.post('/summary', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article object with title is required'
      });
    }

    const summary = await groqService.generateSummary(article);
    
    res.json({
      success: true,
      summary,
      message: 'Summary generated with Palestinian context'
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Summary generation error');
    res.status(500).json({
      error: 'Failed to generate summary',
      message: error.message
    });
  }
});

/**
 * POST /api/palestine-analysis/fact-check
 * Fact-check claims with Palestine/Israel context
 */
router.post('/fact-check', async (req, res) => {
  try {
    const { claim } = req.body;
    
    if (!claim || typeof claim !== 'string') {
      return res.status(400).json({
        error: 'Claim string is required'
      });
    }

    const factCheck = await groqService.factCheckClaim(claim);
    
    res.json({
      success: true,
      fact_check: factCheck,
      message: 'Claim fact-checked with Palestinian context'
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Fact-check error');
    res.status(500).json({
      error: 'Failed to fact-check claim',
      message: error.message
    });
  }
});

/**
 * POST /api/palestine-analysis/batch
 * Analyze multiple articles in batch
 */
router.post('/batch', async (req, res) => {
  try {
    const { articles } = req.body;
    
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        error: 'Array of articles is required'
      });
    }

    if (articles.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 articles allowed per batch'
      });
    }

    const analyses = await Promise.all(
      articles.map(async (article, index) => {
        try {
          const analysis = await groqService.analyzeArticle(article);
          return {
            index,
            article_title: article.title,
            analysis,
            success: true
          };
        } catch (error) {
          return {
            index,
            article_title: article.title || 'Unknown',
            error: error.message,
            success: false
          };
        }
      })
    );
    
    res.json({
      success: true,
      analyses,
      total_processed: analyses.length,
      successful: analyses.filter(a => a.success).length,
      failed: analyses.filter(a => !a.success).length,
      message: 'Batch analysis completed'
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Batch analysis error');
    res.status(500).json({
      error: 'Failed to process batch analysis',
      message: error.message
    });
  }
});

/**
 * GET /api/palestine-analysis/status
 * Get service status and configuration
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: {
      groq_enabled: groqService.isEnabled,
      ai_provider: 'groq',
      model: 'llama-3.1-8b-instant',
      focus: 'Palestine/Israel analysis',
      features: [
        'Geographic bias detection (pro-Palestine/pro-Israel)',
        'Institutional bias analysis',
        'Palestinian context and impact assessment',
        'Historical accuracy verification',
        'Source credibility for Middle East reporting',
        'Fact-checking with Palestinian perspective',
        'Enhanced summary with context'
      ]
    },
    message: 'Palestine Analysis Service operational'
  });
});

module.exports = router;
