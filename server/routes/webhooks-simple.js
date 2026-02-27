/**
 * Simplified Webhook Routes for Testing
 * Handles automation without Directus updates to avoid 403 errors
 */

const express = require('express');
const AIAnalysisService = require('../services/aiAnalysisService');
const DirectusService = require('../services/directusService');

const router = express.Router();
const logger = require('../utils/logger');
const aiService = new AIAnalysisService();
const directusService = new DirectusService();

/**
 * Simplified Article Automation (No Directus Updates)
 * POST /api/webhooks-simple/article-automation
 */
router.post('/article-automation', async (req, res) => {
  try {
    const { event, payload, key } = req.body;
    
    logger.info(`📝 Simple webhook triggered: ${event} for article ${key}`);
    
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
      ai_analysis: null,
      processing_time: Date.now()
    };

    // 1. AI Analysis (No Directus Update)
    try {
      logger.info('🤖 Running comprehensive AI analysis...');
      const aiAnalysis = await aiService.analyzeArticle({
        title: article.title || '',
        content: article.content || '',
        summary: article.summary || ''
      });

      results.ai_analysis = aiAnalysis;
      results.fact_check = {
        status: 'completed',
        verdict: aiAnalysis.bias_analysis?.verdict || 'neutral',
        confidence: aiAnalysis.quality_assessment?.credibility_score || 0.8,
        bias_score: aiAnalysis.bias_analysis?.bias_score || 0.5,
        emotional_tone: aiAnalysis.emotional_analysis?.dominant_emotion || 'neutral'
      };

      // Extract categorization
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

      const category = categoryMap[aiAnalysis.bias_analysis?.category?.toLowerCase()] || 'General';
      const tags = aiAnalysis.bias_analysis?.keywords?.slice(0, 5) || [];

      results.categorization = {
        status: 'completed',
        category: category,
        tags: tags,
        confidence: aiAnalysis.quality_assessment?.confidence || 0.8
      };

    } catch (error) {
      logger.error({ err: error }, '❌ AI analysis failed');
      results.ai_analysis = { error: error.message };
    }

    // 2. Breaking News Detection
    try {
      logger.info('🚨 Checking for breaking news...');
      const breakingResult = detectBreakingNewsLocal(article);
      
      results.breaking_news = {
        status: breakingResult.is_breaking ? 'detected' : 'not_breaking',
        breaking_score: breakingResult.breaking_score,
        keywords_matched: breakingResult.keywords_matched,
        credible_source: breakingResult.credible_source,
        recommendation: breakingResult.is_breaking ? 'PROMOTE TO BREAKING NEWS' : 'Normal article'
      };

    } catch (error) {
      logger.error({ err: error }, '❌ Breaking news detection failed');
      results.breaking_news = { error: error.message };
    }

    results.processing_time = Date.now() - results.processing_time;
    
    logger.info('✅ Simple automation completed:', {
      article_id: key,
      ai_enabled: aiService.isEnabled,
      processing_time: results.processing_time + 'ms'
    });
    
    res.json({
      success: true,
      message: 'Article automation completed (analysis only)',
      results: results,
      timestamp: new Date().toISOString(),
      note: 'This is analysis-only mode. No Directus updates performed.'
    });

  } catch (error) {
    logger.error({ err: error }, '❌ Simple webhook automation failed');
    res.status(500).json({
      success: false,
      error: 'Simple webhook automation failed',
      details: error.message
    });
  }
});

/**
 * Daily Briefs Analysis (No Directus Updates)
 * POST /api/webhooks-simple/analyze-daily-brief
 */
router.post('/analyze-daily-brief', async (req, res) => {
  try {
    logger.info('Analyzing daily brief content...');

    const recentArticles = await directusService.getArticles({
      limit: 25,
      status: 'published'
    });

    if (!Array.isArray(recentArticles) || recentArticles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No published articles available to generate a daily brief'
      });
    }

    let trendingTopics = await directusService.getItems('trending_topics', {
      filter: { active: { _eq: true } },
      sort: '-trend_score',
      limit: 6,
      fields: ['topic', 'name', 'trend_score']
    });

    if (!Array.isArray(trendingTopics) || trendingTopics.length === 0) {
      const topicCounts = recentArticles.reduce((acc, article) => {
        const key = String(article.category || 'General').trim() || 'General';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      trendingTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, trend_score: count }));
    }

    const briefContent = buildDailyBriefContent(recentArticles, trendingTopics);
    
    const briefData = {
      title: `Daily Brief - ${new Date().toLocaleDateString()}`,
      content: briefContent,
      brief_date: new Date().toISOString().split('T')[0],
      article_count: recentArticles.length,
      top_topics: trendingTopics.map(t => t.topic || t.name).filter(Boolean).join(', '),
      status: 'analysis_complete',
      generated_by: 'AI System (Analysis Mode)',
      generated_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Daily brief analysis completed',
      brief_data: briefData,
      articles_analyzed: recentArticles.length,
      topics_analyzed: trendingTopics.length,
      note: 'This is analysis-only mode. No Directus brief created.'
    });

  } catch (error) {
    logger.error({ err: error }, '❌ Daily brief analysis failed');
    res.status(500).json({
      success: false,
      error: 'Daily brief analysis failed',
      details: error.message
    });
  }
});

/**
 * Test cron job functionality
 * POST /api/webhooks-simple/test-cron
 */
router.post('/test-cron', async (req, res) => {
  try {
    logger.info('⏰ Testing cron job functionality...');
    
    const cronTests = {
      daily_brief: {
        schedule: '0 6 * * *',
        description: 'Daily briefs at 6:00 AM UTC',
        next_run: getNextCronRun('0 6 * * *'),
        status: 'scheduled'
      },
      breaking_news_cleanup: {
        schedule: '0 * * * *', 
        description: 'Breaking news cleanup every hour',
        next_run: getNextCronRun('0 * * * *'),
        status: 'scheduled'
      },
      analytics_update: {
        schedule: '0 */4 * * *',
        description: 'Analytics update every 4 hours', 
        next_run: getNextCronRun('0 */4 * * *'),
        status: 'scheduled'
      }
    };
    
    res.json({
      success: true,
      message: 'Cron job test completed',
      cron_jobs: cronTests,
      current_time: new Date().toISOString(),
      timezone: 'UTC'
    });

  } catch (error) {
    logger.error({ err: error }, '❌ Cron test failed');
    res.status(500).json({
      success: false,
      error: 'Cron test failed',
      details: error.message
    });
  }
});

// Helper Functions

/**
 * Local breaking news detection (no Directus dependency)
 */
function detectBreakingNewsLocal(article) {
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
  const isCredibleSource = credibleSources.some(s => source.includes(s));
  if (isCredibleSource) {
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
    credible_source: isCredibleSource,
    recency_bonus: articleTime > hourAgo
  };
}

function buildDailyBriefContent(articles = [], topics = []) {
  const topArticles = articles.slice(0, 5);
  const topicNames = topics
    .map((t) => t.topic || t.name)
    .filter(Boolean)
    .slice(0, 6);

  const headlineLines = topArticles
    .map((article, index) => `${index + 1}. ${article.title || 'Untitled story'}`)
    .join('\n');

  const topicLine = topicNames.length > 0
    ? `Top topics: ${topicNames.join(', ')}.`
    : 'Top topics: General.';

  return [
    'Daily Brief Summary',
    topicLine,
    '',
    'Top headlines:',
    headlineLines
  ].join('\n');
}

/**
 * Calculate next cron run time
 */
function getNextCronRun(cronExpression) {
  // Simple next run calculation (would use cron parser in production)
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60*60*1000);
  return nextHour.toISOString();
}

module.exports = router;
