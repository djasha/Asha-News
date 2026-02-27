const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const AdvancedFactCheckService = require('../services/advancedFactCheckService');
const { authenticateToken } = require('../middleware/authMiddleware');

const advancedFactCheckService = new AdvancedFactCheckService();

// Enhanced claim analysis with confidence scoring
router.post('/analyze-claim', async (req, res) => {
  try {
    const { claim, context } = req.body;
    
    if (!claim) {
      return res.status(400).json({
        success: false,
        error: 'Claim text is required'
      });
    }

    const analysis = await advancedFactCheckService.analyzeClaimWithConfidence(claim, context);
    
    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    logger.error({ err: error }, 'Advanced claim analysis error');
    res.status(500).json({
      success: false,
      error: 'Failed to analyze claim'
    });
  }
});

// Real-time article fact-checking
router.post('/check-article', authenticateToken, async (req, res) => {
  try {
    const { articleText, title } = req.body;
    
    if (!articleText) {
      return res.status(400).json({
        success: false,
        error: 'Article text is required'
      });
    }

    const analysis = await advancedFactCheckService.factCheckArticle(articleText, title);
    
    // Track usage for subscription limits
    if (req.user) {
      // TODO: Implement usage tracking
    }
    
    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    logger.error({ err: error }, 'Article fact-check error');
    res.status(500).json({
      success: false,
      error: 'Failed to fact-check article'
    });
  }
});

// Social media post fact-checking
router.post('/check-social-post', async (req, res) => {
  try {
    const { postText, platform, metadata } = req.body;
    
    if (!postText) {
      return res.status(400).json({
        success: false,
        error: 'Post text is required'
      });
    }

    const analysis = await advancedFactCheckService.factCheckSocialPost(postText, platform, metadata);
    
    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    logger.error({ err: error }, 'Social media fact-check error');
    res.status(500).json({
      success: false,
      error: 'Failed to fact-check social media post'
    });
  }
});

// Batch fact-checking
router.post('/batch-check', authenticateToken, async (req, res) => {
  try {
    const { claims } = req.body;
    
    if (!claims || !Array.isArray(claims)) {
      return res.status(400).json({
        success: false,
        error: 'Claims array is required'
      });
    }

    if (claims.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 claims per batch'
      });
    }

    const results = await advancedFactCheckService.batchFactCheck(claims);
    const report = await advancedFactCheckService.generateReport(results);
    const reliabilityScore = advancedFactCheckService.calculateReliabilityScore(results);
    
    res.json({
      success: true,
      results,
      report,
      reliability_score: reliabilityScore
    });

  } catch (error) {
    logger.error({ err: error }, 'Batch fact-check error');
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch fact-check'
    });
  }
});

// Get fact-check history for authenticated users
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const history = [];
    
    res.json({
      success: true,
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length
      },
      message: 'Fact-check history persistence is not yet enabled'
    });

  } catch (error) {
    logger.error({ err: error }, 'History retrieval error');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve fact-check history'
    });
  }
});

// Save fact-check result
router.post('/save-result', authenticateToken, async (req, res) => {
  try {
    return res.status(501).json({
      success: false,
      error: 'Fact-check result persistence is not yet enabled'
    });

  } catch (error) {
    logger.error({ err: error }, 'Save result error');
    res.status(500).json({
      success: false,
      error: 'Failed to save fact-check result'
    });
  }
});

// Get trending misinformation topics
router.get('/trending-misinformation', async (req, res) => {
  try {
    res.json({
      success: true,
      trending_topics: [],
      message: 'Trending misinformation analytics is not yet enabled'
    });

  } catch (error) {
    logger.error({ err: error }, 'Trending misinformation error');
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve trending misinformation'
    });
  }
});

// Generate fact-check report
router.post('/generate-report', authenticateToken, async (req, res) => {
  try {
    const { factCheckResults, reportType = 'standard' } = req.body;
    
    if (!factCheckResults) {
      return res.status(400).json({
        success: false,
        error: 'Fact-check results are required'
      });
    }

    const report = await advancedFactCheckService.generateReport(factCheckResults);
    
    res.json({
      success: true,
      report,
      generated_at: new Date().toISOString(),
      report_type: reportType
    });

  } catch (error) {
    logger.error({ err: error }, 'Report generation error');
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

module.exports = router;
