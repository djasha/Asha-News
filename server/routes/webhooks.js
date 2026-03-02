/**
 * Webhook Routes for Directus Automation
 * Handles automated workflows triggered by Directus webhooks
 */

const express = require('express');
const AIAnalysisService = require('../services/aiAnalysisService');
const queryBridge = require('../db/queryBridge');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const logger = require('../utils/logger');
const aiService = new AIAnalysisService();
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

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
 * Article Created/Updated Webhook
 * Triggers fact-checking and categorization
 * POST /api/webhooks/article-automation
 */
router.post('/article-automation', async (req, res) => {
  try {
    const { event, payload, key } = req.body;
    
    logger.info(`[Webhook] Article webhook triggered: ${event} for article ${key}`);
    
    // Only process published articles
    if (!payload || payload.status !== 'published') {
      return res.json({ 
        success: true, 
        message: 'Article not published, skipping automation',
        article_id: key 
      });
    }
    const article = payload;
    const results = {
      article_id: key,
      fact_check: null,
      categorization: null,
      breaking_news: null,
      errors: []
    };

    // 1. Fact-checking automation
    try {
      logger.info('🔍 Running fact-check analysis...');
      const factCheckResult = await aiService.analyzeArticle({
        title: article.title || '',
        content: article.content || '',
        summary: article.summary || ''
      });

      // Update article with fact-check results
      await updateDirectusArticle(key, {
        fact_check_status: factCheckResult.bias_analysis?.verdict || 'analyzed',
        credibility_score: factCheckResult.quality_assessment?.credibility_score || 0.8,
        bias_score: factCheckResult.bias_analysis?.bias_score || 0.5,
        emotional_tone: factCheckResult.emotional_analysis?.dominant_emotion || 'neutral',
        last_fact_checked: new Date().toISOString()
      });

      results.fact_check = {
        status: 'completed',
        verdict: factCheckResult.bias_analysis?.verdict,
        confidence: factCheckResult.quality_assessment?.credibility_score,
        bias_score: factCheckResult.bias_analysis?.bias_score,
        emotional_tone: factCheckResult.emotional_analysis?.dominant_emotion
      };

    } catch (error) {
      logger.error({ err: error }, '[Webhook] Fact-check automation failed');
      results.errors.push(`Fact-check: ${error.message}`);
    }

    // 2. AI Categorization
    try {
      logger.info('[Webhook] Running AI categorization...');
      const analysisResult = await aiService.analyzeArticle({
        title: article.title || '',
        content: article.content || '',
        summary: article.summary || ''
      });

      // Extract category from analysis
      const categoryMap = {
        'politics': 'Politics',
        'business': 'Business', 
        'technology': 'Technology',
        'health': 'Health',
        'sports': 'Sports',
        'entertainment': 'Entertainment',
        'science': 'Science',
        'world': 'World News'
      };

      // Extract category from analysis
      const category = categoryMap[analysisResult.bias_analysis?.category?.toLowerCase()] || 'General';
      const tags = analysisResult.bias_analysis?.keywords?.slice(0, 5) || [];

      // Update article with categorization
      await updateDirectusArticle(key, {
        category: category,
        tags: tags.join(', '),
        ai_processed: true,
        ai_processed_at: new Date().toISOString()
      });

      results.categorization = {
        status: 'completed',
        category: category,
        tags: tags
      };

    } catch (error) {
      logger.error({ err: error }, '[Webhook] Categorization automation failed');
      results.errors.push(`Categorization: ${error.message}`);
    }

    // 3. Breaking News Detection
    try {
      logger.info('[Webhook] Checking for breaking news...');
      const breakingResult = await detectBreakingNews(article);
      
      if (breakingResult.is_breaking) {
        // Create breaking news entry
        await createBreakingNewsEntry(key, article, breakingResult);
        
        // Update article as breaking
        await updateDirectusArticle(key, {
          breaking: true,
          featured: true,
          breaking_score: breakingResult.breaking_score
        });

        results.breaking_news = {
          status: 'detected',
          breaking_score: breakingResult.breaking_score,
          keywords_matched: breakingResult.keywords_matched
        };
      } else {
        results.breaking_news = {
          status: 'not_breaking',
          breaking_score: breakingResult.breaking_score
        };
      }

    } catch (error) {
      logger.error({ err: error }, '[Webhook] Breaking news detection failed');
      results.errors.push(`Breaking news: ${error.message}`);
    }

    logger.info('[Webhook] Article automation completed:', results);
    
    res.json({
      success: true,
      message: 'Article automation completed',
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error({ err: error }, '[Webhook] Webhook automation failed');
    res.status(500).json({
      success: false,
      error: 'Webhook automation failed',
      details: error.message
    });
  }
});

/**
 * Daily Briefs Generation Webhook (Manual Trigger)
 * POST /api/webhooks/generate-daily-brief
 */
router.post('/generate-daily-brief', async (req, res) => {
  try {
    logger.info('[Webhook] Generating daily brief...');
    
    // Get articles from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const articles = await getRecentArticles(yesterday.toISOString());
    const trendingTopics = await getTrendingTopics();
    
    if (articles.length === 0) {
      return res.json({
        success: true,
        message: 'No articles found for daily brief',
        brief_id: null
      });
    }

    // Generate AI summary
    const summaryPrompt = `Create a concise daily news brief from these ${articles.length} articles:\n\n` +
      articles.map(a => `• ${a.title}: ${a.summary || 'No summary'}`).join('\n') +
      `\n\nTop topics: ${trendingTopics.map(t => t.name).join(', ')}\n\n` +
      'Generate a professional daily brief with key highlights and trends.';

    const briefContent = await aiService.generateSummary(summaryPrompt);
    
    // Create daily brief entry
    const briefData = {
      title: `Daily Brief - ${new Date().toLocaleDateString()}`,
      content: briefContent,
      brief_date: new Date().toISOString().split('T')[0],
      article_count: articles.length,
      top_topics: trendingTopics.map(t => t.name).join(', '),
      status: 'ready_for_review',
      generated_by: 'AI System',
      generated_at: new Date().toISOString()
    };

    const briefId = await createDailyBrief(briefData);
    
    res.json({
      success: true,
      message: 'Daily brief generated successfully',
      brief_id: briefId,
      article_count: articles.length,
      topics_count: trendingTopics.length
    });

  } catch (error) {
    logger.error({ err: error }, '[Webhook] Daily brief generation failed');
    res.status(500).json({
      success: false,
      error: 'Daily brief generation failed',
      details: error.message
    });
  }
});

/**
 * Test webhook endpoint
 * POST /api/webhooks/test
 */
router.post('/test', (req, res) => {
  logger.info('🧪 Test webhook received:', req.body);
  res.json({
    success: true,
    message: 'Webhook test successful',
    received_data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Helper Functions

// Helper function to update article in Directus
async function updateDirectusArticle(articleId, updateData) {
  try {
    // Ensure JSON fields are properly formatted
    const formattedData = { ...updateData };
    
    // Format bias_analysis as proper JSON object if it's a string
    if (formattedData.bias_analysis && typeof formattedData.bias_analysis === 'string') {
      try {
        formattedData.bias_analysis = JSON.parse(formattedData.bias_analysis);
      } catch (e) {
        // If it's not valid JSON, wrap it in an object
        formattedData.bias_analysis = { analysis: formattedData.bias_analysis };
      }
    }
    
    const response = await queryBridge(`/items/articles/${articleId}`, {
      method: 'PATCH',
      body: JSON.stringify(formattedData)
    });
    return response;
  } catch (error) {
    logger.error({ err: error }, 'Failed to update Directus article');
    throw error;
  }
}

/**
 * Detect breaking news from article content
 */
async function detectBreakingNews(article) {
  const title = (article.title || '').toLowerCase();
  const content = (article.content || '').toLowerCase();
  const source = article.source_name || '';
  
  // Breaking news keywords
  const breakingKeywords = [
    'breaking', 'urgent', 'alert', 'just in', 'developing',
    'emergency', 'crisis', 'attack', 'explosion', 'earthquake',
    'election', 'resign', 'died', 'killed', 'arrest', 'shooting'
  ];
  
  // High credibility sources
  const credibleSources = [
    'Reuters', 'Associated Press', 'BBC', 'CNN', 'NPR',
    'The Guardian', 'The New York Times', 'Washington Post'
  ];
  
  let breakingScore = 0;
  const matchedKeywords = [];
  
  breakingKeywords.forEach(keyword => {
    if (title.includes(keyword)) {
      breakingScore += 3;
      matchedKeywords.push(keyword);
    }
    if (content.includes(keyword)) {
      breakingScore += 1;
    }
  });
  
  // Boost score for credible sources
  if (credibleSources.some(s => source.includes(s))) {
    breakingScore += 2;
  }
  
  // Check recency (within last hour)
  const articleTime = new Date(article.date_created || Date.now());
  const hourAgo = new Date(Date.now() - 60*60*1000);
  if (articleTime > hourAgo) {
    breakingScore += 2;
  }
  
  return {
    breaking_score: breakingScore,
    is_breaking: breakingScore >= 5,
    keywords_matched: matchedKeywords,
    credible_source: credibleSources.some(s => source.includes(s))
  };
}

/**
 * Create breaking news entry
 */
async function createBreakingNewsEntry(articleId, article, breakingResult) {
  const breakingData = {
    article_id: articleId,
    headline: article.title,
    summary: article.summary,
    source_name: article.source_name,
    breaking_score: breakingResult.breaking_score,
    expires_at: new Date(Date.now() + 4*60*60*1000).toISOString(),
    status: 'active',
    priority: 'high'
  };

  try {
    const response = await queryBridge('/items/breaking_news', {
      method: 'POST',
      body: JSON.stringify(breakingData)
    });
    logger.info('Created breaking news entry:', response.data?.id);
    return response.data?.id;
  } catch (error) {
    logger.error({ err: error }, 'Failed to create breaking news entry');
    throw error;
  }
}

/**
 * Get recent articles from Directus
 */
async function getRecentArticles(since) {
  try {
    const response = await queryBridge(`/items/articles?filter[date_created][_gte]=${since}&filter[status][_eq]=published&sort=-view_count&limit=20`);
    return response.data || [];
  } catch (error) {
    logger.error({ err: error }, 'Failed to get recent articles');
    return [];
  }
}

/**
 * Get trending topics from Directus
 */
async function getTrendingTopics() {
  try {
    const response = await queryBridge('/items/trending_topics?filter[status][_eq]=active&sort=-trending_score&limit=5');
    return response.data || [];
  } catch (error) {
    logger.error({ err: error }, 'Failed to get trending topics');
    return [];
  }
}

/**
 * Create daily brief in Directus
 */
async function createDailyBrief(briefData) {
  try {
    const response = await queryBridge('/items/daily_briefs', {
      method: 'POST',
      body: JSON.stringify(briefData)
    });
    logger.info('Created daily brief:', response.data?.id);
    return response.data?.id;
  } catch (error) {
    logger.error({ err: error }, 'Failed to create daily brief');
    throw error;
  }
}

module.exports = router;
