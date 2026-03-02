const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const RSSProcessingService = require('../services/rssProcessingService');
const contentRepository = require('../services/contentRepository');
const ArticleContentScraper = require('../services/articleContentScraper');
const { calculateReadingTime, calculateWordCount } = require('../utils/readingTimeCalculator');
const { checkReadLimit, trackRead, getReadStats } = require('../middleware/readCountGating');
const { optionalAuth } = require('../middleware/authMiddleware');

const rssService = new RSSProcessingService();
const contentScraper = new ArticleContentScraper();

/**
 * GET /api/articles
 * Get articles with pagination
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      source, 
      bias,
      sort = 'published_at',
      order = 'desc'
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Always fetch from the canonical content repository for consistent data.
    let articles = [];
    let totalCount = 0;
    
    try {
      const cmsArticles = await contentRepository.getArticles({
        limit: parseInt(limit),
        offset,
        category,
        source,
        status: 'published'
      });
      articles = cmsArticles;
      totalCount = await contentRepository.getArticleCount({ category, source, status: 'published' });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching from content repository');
      articles = [];
      totalCount = 0;
    }
    
    // Format articles for frontend
    const formattedArticles = articles.map(article => {
      const contentForReading = article.content || article.summary || '';
      const readingTime = calculateReadingTime(contentForReading);
      const wordCount = calculateWordCount(article.content || '');
      
      return {
        id: article.id || article.guid,
        title: article.title,
        summary: article.summary,
        content: article.content,
        source_name: article.source_name || 'Unknown Source',
        source_id: article.source_id,
        source_url: article.source_url,
        url: article.source_url || article.url,
        author: article.author || article.author_name,
        author_name: article.author || article.author_name,
        published_at: article.published_at || article.publication_date,
        publication_date: article.published_at || article.publication_date,
        image_url: article.image_url,
        category: article.category,
        topic: article.category,
        tags: article.tags || [],
        political_bias: article.political_bias || 'center',
        bias_score: article.bias_score || 0.5,
        confidence_score: Math.abs(article.bias_score || 0) * 100,
        credibility_score: article.credibility_score || 0.85,
        factual_quality: article.credibility_score || article.factual_quality || 0.85,
        reading_time: readingTime,
        word_count: wordCount,
        view_count: article.view_count || 0,
        breaking: article.breaking || false,
        breaking_news: article.breaking || false,
        fact_check_status: article.fact_check_status || 'unverified'
      };
    });
    
    res.json({
      success: true,
      data: formattedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
        has_more: offset + parseInt(limit) < totalCount,
        has_previous: parseInt(page) > 1
      },
      filters: {
        category,
        source,
        bias,
        sort,
        order
      }
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching articles');
    res.status(500).json({ 
      error: 'Failed to fetch articles',
      message: error.message 
    });
  }
});

/**
 * GET /api/articles/read-stats
 * Get current user's daily read count and limit
 */
router.get('/read-stats', optionalAuth, (req, res) => {
  const stats = getReadStats(req);
  res.json({ success: true, ...stats });
});

/**
 * GET /api/articles/:id
 * Get specific article by ID
 */
router.get('/:id((?!trending$|read-stats$|category$|source$|debug$).+)', optionalAuth, checkReadLimit, trackRead, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find in RSS cache first
    let article = null;
    
    if (rssService.processedArticles.size > 0) {
      const articles = Array.from(rssService.processedArticles.values());
      article = articles.find(a => a.id === id || a.guid === id);
    }
    
    // Fallback to content repository
    if (!article) {
      try {
        article = await contentRepository.getArticleById(id);
      } catch (error) {
        logger.error({ err: error }, 'Error fetching from content repository');
      }
    }
    
    if (!article) {
      return res.status(404).json({
        error: 'Article not found',
        id
      });
    }
    
    // Calculate reading time and word count
    const contentForReading = article.content || article.summary || '';
    const readingTime = calculateReadingTime(contentForReading);
    const wordCount = calculateWordCount(article.content || '');
    
    // Format article for frontend
    const formattedArticle = {
      id: article.id || article.guid,
      title: article.title,
      summary: article.summary,
      content: article.content,
      source_name: article.source_name || 'Unknown Source',
      source_id: article.source_id,
      source_url: article.source_url,
      url: article.source_url || article.url,
      author: article.author || article.author_name,
      author_name: article.author || article.author_name,
      published_at: article.published_at || article.publication_date,
      publication_date: article.published_at || article.publication_date,
      image_url: article.image_url,
      category: article.category,
      topic: article.category,
      tags: article.tags || [],
      political_bias: article.political_bias || 'center',
      bias_score: article.bias_score || 0.5,
      confidence_score: Math.abs(article.bias_score || 0) * 100,
      credibility_score: article.credibility_score || 0.85,
      factual_quality: article.credibility_score || article.factual_quality || 0.85,
      reading_time: readingTime,
      word_count: wordCount,
      view_count: article.view_count || 0,
      breaking: article.breaking || false,
      breaking_news: article.breaking || false,
      ai_analysis: article.ai_analysis || null,
      fact_check_status: article.fact_check_status || 'unverified'
    };
    
    res.json({
      success: true,
      data: formattedArticle
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching article');
    res.status(500).json({ 
      error: 'Failed to fetch article',
      message: error.message 
    });
  }
});

/**
 * GET /api/articles/category/:category
 * Get articles by category with pagination
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Redirect to main articles endpoint with category filter
    req.query.category = category;
    return router.get('/', req, res);
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching articles by category');
    res.status(500).json({ 
      error: 'Failed to fetch articles by category',
      message: error.message 
    });
  }
});

/**
 * GET /api/articles/source/:source
 * Get articles by source with pagination
 */
router.get('/source/:source', async (req, res) => {
  try {
    const { source } = req.params;
    
    // Redirect to main articles endpoint with source filter
    req.query.source = source;
    return router.get('/', req, res);
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching articles by source');
    res.status(500).json({ 
      error: 'Failed to fetch articles by source',
      message: error.message 
    });
  }
});

/**
 * GET /api/articles/trending
 * Get trending articles
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    let articles = [];
    
    if (rssService.processedArticles.size > 0) {
      const allArticles = Array.from(rssService.processedArticles.values());
      
      // Sort by view count, breaking news, and recency
      articles = allArticles
        .sort((a, b) => {
          // Breaking news first
          if (a.breaking && !b.breaking) return -1;
          if (!a.breaking && b.breaking) return 1;
          
          // Then by view count
          const aViews = a.view_count || 0;
          const bViews = b.view_count || 0;
          if (aViews !== bViews) return bViews - aViews;
          
          // Finally by recency
          return new Date(b.published_at || 0) - new Date(a.published_at || 0);
        })
        .slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: articles,
      count: articles.length
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching trending articles');
    res.status(500).json({ 
      error: 'Failed to fetch trending articles',
      message: error.message 
    });
  }
});

/**
 * GET /api/articles/:id/full-content
 * Get full article content by scraping the source URL
 */
router.get('/:id/full-content', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, get the article to retrieve its URL
    let article = null;
    
    // Try RSS cache first
    if (rssService.processedArticles.size > 0) {
      const articles = Array.from(rssService.processedArticles.values());
      article = articles.find(a => a.id === id || a.guid === id);
    }
    
    // Fallback to content repository
    if (!article) {
      try {
        article = await contentRepository.getArticleById(id);
      } catch (error) {
        logger.error({ err: error }, 'Error fetching article from content repository');
      }
    }
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found',
        id
      });
    }
    
    // Check if article has a URL to scrape
    const articleUrl = article.url || article.source_url;
    if (!articleUrl) {
      return res.status(400).json({
        success: false,
        error: 'Article has no source URL to scrape',
        article: {
          id: article.id,
          title: article.title
        }
      });
    }
    
    // Scrape the full content
    logger.info(`[Articles API] Scraping full content for article ${id} from ${articleUrl}`);
    const scrapedContent = await contentScraper.scrapeArticle(articleUrl);
    
    // Return the scraped content
    res.json({
      success: true,
      data: {
        articleId: id,
        url: articleUrl,
        scrapedContent: {
          title: scrapedContent.title || article.title,
          content: scrapedContent.content,
          summary: scrapedContent.summary || article.summary,
          author: scrapedContent.author || article.author || article.author_name,
          publishedAt: scrapedContent.publishedAt || article.published_at || article.publication_date,
          imageUrl: scrapedContent.imageUrl || article.image_url,
          source: scrapedContent.source,
          scrapedAt: scrapedContent.scrapedAt,
          metadata: scrapedContent.metadata
        },
        originalArticle: {
          id: article.id,
          title: article.title,
          summary: article.summary,
          category: article.category,
          political_bias: article.political_bias
        }
      }
    });
    
  } catch (error) {
    logger.error({ err: error }, 'Error fetching full article content');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch full article content',
      message: error.message 
    });
  }
});

/**
 * GET /api/articles/debug/categories
 * Get all unique categories from articles (for debugging)
 */
router.get('/debug/categories', async (req, res) => {
  try {
    // Fetch all articles from content repository
    const allArticles = await contentRepository.getArticles({ limit: 1000, status: 'published' });
    
    // Extract unique categories
    const categories = [...new Set(allArticles.map(a => a.category).filter(Boolean))];
    const categoryCounts = {};
    
    allArticles.forEach(article => {
      if (article.category) {
        categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: {
        totalArticles: allArticles.length,
        uniqueCategories: categories.sort(),
        categoryCounts: Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([category, count]) => ({ category, count }))
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching categories');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch categories',
      message: error.message 
    });
  }
});

/**
 * GET /api/articles/scraper/stats
 * Get content scraper statistics
 */
router.get('/scraper/stats', (req, res) => {
  try {
    const stats = contentScraper.getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching scraper stats');
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch scraper stats',
      message: error.message 
    });
  }
});

module.exports = router;
