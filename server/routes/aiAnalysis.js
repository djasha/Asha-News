const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const AIAnalysisService = require('../services/aiAnalysisService');
const adminSettingsService = require('../services/adminSettingsService');

const aiService = new AIAnalysisService();

/**
 * POST /api/ai/analyze-article
 * Analyze a single article for bias, emotion, and quality
 */
router.post('/analyze-article', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article object with title is required',
        required_fields: ['title', 'content', 'summary', 'source_name']
      });
    }

    const analysis = await aiService.analyzeArticle(article);
    
    res.json({
      success: true,
      analysis,
      article_id: article.id,
      processed_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Article analysis error');
    res.status(500).json({
      error: 'Failed to analyze article',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/analyze-bias
 * Analyze article specifically for political bias
 */
router.post('/analyze-bias', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article object with title is required'
      });
    }

    const biasAnalysis = await aiService.analyzeBias(article);
    
    res.json({
      success: true,
      bias_analysis: biasAnalysis,
      article_id: article.id,
      analyzed_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Bias analysis error');
    res.status(500).json({
      error: 'Failed to analyze bias',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/analyze-emotion
 * Analyze article for emotional tone and sentiment
 */
router.post('/analyze-emotion', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article object with title is required'
      });
    }

    const emotionalAnalysis = await aiService.analyzeEmotionalTone(article);
    
    res.json({
      success: true,
      emotional_analysis: emotionalAnalysis,
      article_id: article.id,
      analyzed_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Emotional analysis error');
    res.status(500).json({
      error: 'Failed to analyze emotion',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/assess-quality
 * Assess article quality and credibility
 */
router.post('/assess-quality', async (req, res) => {
  try {
    const { article } = req.body;
    
    if (!article || !article.title) {
      return res.status(400).json({
        error: 'Article object with title is required'
      });
    }

    const qualityAssessment = await aiService.assessQuality(article);
    
    res.json({
      success: true,
      quality_assessment: qualityAssessment,
      article_id: article.id,
      assessed_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Quality assessment error');
    res.status(500).json({
      error: 'Failed to assess quality',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/batch-analyze
 * Analyze multiple articles in batch
 */
router.post('/batch-analyze', async (req, res) => {
  try {
    const { articles, analysis_types = ['bias', 'emotion', 'quality'] } = req.body;
    
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        error: 'Array of articles is required'
      });
    }

    if (articles.length > 10) {
      return res.status(400).json({
        error: 'Maximum 10 articles per batch request'
      });
    }

    const results = [];
    
    for (const article of articles) {
      try {
        let analysis = {};
        
        if (analysis_types.includes('bias')) {
          analysis.bias_analysis = await aiService.analyzeBias(article);
        }
        
        if (analysis_types.includes('emotion')) {
          analysis.emotional_analysis = await aiService.analyzeEmotionalTone(article);
        }
        
        if (analysis_types.includes('quality')) {
          analysis.quality_assessment = await aiService.assessQuality(article);
        }

        results.push({
          article_id: article.id,
          title: article.title,
          analysis,
          success: true
        });
        
      } catch (error) {
        results.push({
          article_id: article.id,
          title: article.title,
          error: error.message,
          success: false
        });
      }
    }
    
    res.json({
      success: true,
      results,
      processed_count: results.length,
      successful_count: results.filter(r => r.success).length,
      processed_at: new Date().toISOString()
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
 * GET /api/ai/status
 * Get AI service status and configuration
 */
router.get('/status', async (req, res) => {
  try {
    const defaultProviderRaw = await adminSettingsService.getDefaultProvider();
    const map = { Groq: 'groq', OpenAI: 'openai', 'Google AI': 'google', Google: 'google', Perplexity: 'perplexity' };
    const default_provider = map[defaultProviderRaw] || (typeof defaultProviderRaw === 'string' ? defaultProviderRaw.toLowerCase() : 'groq');

    const getCfg = async (p) => {
      try { return await adminSettingsService.getProviderConfig(p); } catch { return null; }
    };

    const groqCfg = await getCfg('groq');
    const openaiCfg = await getCfg('openai');
    const googleCfg = await getCfg('google');
    const perplexityCfg = await getCfg('perplexity');

    const providers = {
      groq: {
        enabled: groqCfg?.enabled !== false,
        configured: !!process.env.GROQ_API_KEY || !!(groqCfg?.apiKey)
      },
      openai: {
        enabled: openaiCfg?.enabled !== false,
        configured: !!process.env.OPENAI_API_KEY || !!(openaiCfg?.apiKey)
      },
      google: {
        enabled: googleCfg?.enabled !== false,
        configured: !!process.env.GOOGLE_AI_API_KEY || !!(googleCfg?.apiKey)
      },
      perplexity: {
        enabled: perplexityCfg?.enabled !== false,
        configured: !!process.env.PERPLEXITY_API_KEY || !!(perplexityCfg?.apiKey)
      }
    };

    res.json({
      ai_enabled: aiService.isEnabled,
      default_provider,
      providers,
      available_analyses: ['bias', 'emotion', 'quality'],
      max_batch_size: 10,
      supported_models: ['llama-3.1-8b-instant', 'gpt-4'],
      status: aiService.isEnabled ? 'active' : 'disabled'
    });
  } catch (err) {
    res.json({
      ai_enabled: aiService.isEnabled,
      default_provider: 'groq',
      error: 'Failed to read admin settings',
      available_analyses: ['bias', 'emotion', 'quality'],
      status: aiService.isEnabled ? 'active' : 'disabled'
    });
  }
});

/**
 * POST /api/ai/update-article-analysis
 * Update existing article with AI analysis results
 */
router.post('/update-article-analysis', async (req, res) => {
  try {
    const { article_id, directus_id } = req.body;
    
    if (!article_id && !directus_id) {
      return res.status(400).json({
        error: 'Either article_id or directus_id is required'
      });
    }

    // This would integrate with Directus to update the article
    // For now, return success response
    res.json({
      success: true,
      message: 'Article analysis update endpoint ready',
      article_id: article_id || directus_id,
      updated_at: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Article update error');
    res.status(500).json({
      error: 'Failed to update article analysis',
      message: error.message
    });
  }
});

module.exports = router;
