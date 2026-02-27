const Parser = require('rss-parser');
const logger = require('../utils/logger');
const crypto = require('crypto');
const AIAnalysisService = require('./aiAnalysisService');
const ArticleContentScraperService = require('./articleContentScraper');

class RSSProcessingService {
  constructor() {
    this.parser = new Parser({
      customFields: {
        feed: ['language', 'ttl', 'skipHours', 'skipDays'],
        item: ['author', 'creator', 'content', 'contentSnippet', 'dc:creator', 'media:content']
      }
    });
    this.aiService = new AIAnalysisService();
    this.scraper = new ArticleContentScraperService();
    this.processedArticles = new Map(); // In-memory cache for processed articles
    this.isProcessing = false;
    this.enableScraping = process.env.RSS_ENABLE_CONTENT_SCRAPING !== 'false'; // default true
  }

  /**
   * Process RSS feeds from enabled sources
   * @param {Array} rssSources - Array of RSS source objects from CMS
   * @returns {Object} Processing results
   */
  async processAllFeeds(rssSources = []) {
    if (this.isProcessing) {
      return { error: 'RSS processing already in progress' };
    }

    this.isProcessing = true;
    const results = {
      processed_feeds: 0,
      new_articles: 0,
      updated_articles: 0,
      errors: [],
      articles: [],
      started_at: new Date().toISOString()
    };

    try {
      for (const source of rssSources) {
        if (!source.enabled || !source.rss_url) continue;

        try {
          const feedResult = await this.processSingleFeed(source);
          results.processed_feeds++;
          results.new_articles += feedResult.new_articles;
          results.updated_articles += feedResult.updated_articles;
          results.articles.push(...feedResult.articles);
        } catch (error) {
          logger.error(`Failed to process feed ${source.name}:`, error);
          results.errors.push({
            source: source.name,
            url: source.rss_url,
            error: error.message
          });
        }
      }
    } finally {
      this.isProcessing = false;
      results.completed_at = new Date().toISOString();
    }

    return results;
  }

  /**
   * Process a single RSS feed
   * @param {Object} source - RSS source configuration
   * @returns {Object} Processing results for this feed
   */
  async processSingleFeed(source) {
    const feed = await this.parser.parseURL(source.rss_url);
    const results = {
      source_name: source.name,
      new_articles: 0,
      updated_articles: 0,
      articles: [],
      processed_at: new Date().toISOString()
    };

    for (const item of feed.items) {
      try {
        const article = await this.processArticleItem(item, source, feed);
        const articleId = this.generateArticleId(article);

        if (this.processedArticles.has(articleId)) {
          // Article already processed, check if update needed
          const existing = this.processedArticles.get(articleId);
          if (this.shouldUpdateArticle(existing, article)) {
            this.processedArticles.set(articleId, article);
            results.updated_articles++;
            results.articles.push({ ...article, status: 'updated' });
          }
        } else {
          // New article
          this.processedArticles.set(articleId, article);
          results.new_articles++;
          results.articles.push({ ...article, status: 'new' });
        }
      } catch (error) {
        logger.error(`Failed to process article from ${source.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Process individual RSS item into article format
   * @param {Object} item - RSS item
   * @param {Object} source - RSS source configuration
   * @param {Object} feed - RSS feed metadata
   * @returns {Object} Processed article
   */
  async processArticleItem(item, source, feed) {
    // Extract and clean content
    let content = this.extractContent(item);
    let summary = this.extractSummary(item, content);
    let imageUrl = this.extractImageUrl(item);
    let author = this.extractAuthor(item);
    
    // Scrape full content if RSS content is missing or too short (< 200 chars)
    if (this.enableScraping && item.link && (!content || content.length < 200)) {
      try {
        logger.info(`📰 Scraping full content for: ${item.title?.substring(0, 60)}...`);
        const scraped = await this.scraper.scrapeArticle(item.link);
        
        if (scraped && scraped.content && scraped.content.length > content.length) {
          content = scraped.content;
          summary = scraped.summary || summary;
          imageUrl = scraped.imageUrl || imageUrl;
          author = scraped.author || author;
          logger.info(`✅ Scraped ${scraped.content.length} chars of content`);
        }
      } catch (error) {
        logger.warn(`⚠️ Content scraping failed for ${item.link}:`, error.message);
      }
    }
    
    // Create base article object
    const article = {
      title: this.cleanText(item.title),
      summary: summary,
      content: content,
      source_url: item.link,
      source_name: source.name,
      source_domain: source.domain || this.extractDomain(item.link),
      published_at: this.parseDate(item.pubDate || item.isoDate),
      author: author,
      category: this.extractCategory(item, source),
      tags: this.extractTags(item),
      image_url: imageUrl,
      guid: item.guid || item.link,
      language: feed.language || source.language || 'en',
      
      // RSS-specific metadata
      rss_source_id: source.id,
      feed_title: feed.title,
      feed_description: feed.description,
      
      // Processing metadata
      processed_at: new Date().toISOString(),
      processing_version: '1.0',
      
      // Default values for required fields
      bias_score: 0.5,
      credibility_score: source.credibility_score || 0.8,
      fact_check_status: 'pending',
      status: 'published',
      featured: false,
      breaking: this.detectBreakingNews(item.title, content),
      view_count: 0,
      share_count: 0
    };

    // Add AI analysis if enabled
    if (this.aiService.isEnabled) {
      try {
        const aiAnalysis = await this.aiService.analyzeArticle(article);
        article.ai_analysis = aiAnalysis;
        article.bias_score = aiAnalysis.bias_analysis?.bias_score || 0.5;
        article.bias_analysis = aiAnalysis.bias_analysis?.reasoning || null;
        article.emotional_tone = aiAnalysis.emotional_analysis?.primary_emotion || 'neutral';
        article.credibility_score = aiAnalysis.quality_assessment?.credibility_score || article.credibility_score;
      } catch (error) {
        logger.error('AI analysis failed for article:', error);
      }
    }

    return article;
  }

  /**
   * Extract and clean article content from RSS item
   */
  extractContent(item) {
    let content = '';
    
    if (item['content:encoded']) {
      content = item['content:encoded'];
    } else if (item.content) {
      content = item.content;
    } else if (item.contentSnippet) {
      content = item.contentSnippet;
    } else if (item.description) {
      content = item.description;
    }

    return this.cleanHtml(content);
  }

  /**
   * Extract summary from RSS item
   */
  extractSummary(item, content) {
    let summary = '';
    
    if (item.contentSnippet && item.contentSnippet !== content) {
      summary = item.contentSnippet;
    } else if (item.description && item.description !== content) {
      summary = item.description;
    } else if (content.length > 300) {
      summary = content.substring(0, 300) + '...';
    } else {
      summary = content;
    }

    return this.cleanHtml(summary);
  }

  /**
   * Extract author information
   */
  extractAuthor(item) {
    return item.creator || item['dc:creator'] || item.author || 'Unknown Author';
  }

  /**
   * Extract category/topic from RSS item
   */
  extractCategory(item, source) {
    // Prefer explicit RSS categories
    if (item.categories && item.categories.length > 0) {
      return item.categories[0];
    }

    // Fallback: keyword-based categorization using title + description
    const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();

    const tests = [
      { cat: 'Politics', re: /(\bpolitics|election|vote|congress|senate|president|government|policy|democrat|republican|campaign|legislation|parliament|minister|prime minister)\b/ },
      { cat: 'Technology', re: /(\btechnology|tech|ai|artificial intelligence|software|hardware|startup|silicon valley|apple|google|microsoft|meta|tesla|crypto|blockchain|semiconductor|chip)\b/ },
      { cat: 'Business', re: /(\bbusiness|economy|economic|finance|financial|stock|market|trade|company|corporate|earnings|revenue|investment|banking|merger|acquisition|ipo)\b/ },
      { cat: 'Health', re: /(\bhealth|medical|medicine|hospital|doctor|disease|covid|pandemic|vaccine|healthcare|pharmaceutical|fda|who)\b/ },
      { cat: 'Science', re: /(\bscience|research|study|climate|environment|space|nasa|discovery|breakthrough|experiment|scientific)\b/ },
      { cat: 'Sports', re: /(\bsports|football|basketball|baseball|soccer|olympics|nfl|nba|mlb|fifa|championship|tournament|athlete|tennis|golf)\b/ },
      { cat: 'Entertainment', re: /(\bentertainment|celebrity|movie|film|tv|television|music|hollywood|netflix|disney|streaming|concert|festival)\b/ },
      { cat: 'International', re: /(\binternational|world|global|china|russia|europe|ukraine|israel|gaza|palestine|nato|united nations|un\b|middle east)\b/ }
    ];

    for (const t of tests) {
      if (t.re.test(text)) return t.cat;
    }

    // Source hint or default
    return source.default_category || 'General';
  }

  /**
   * Extract tags from RSS item
   */
  extractTags(item) {
    const tags = [];
    
    if (item.categories) {
      tags.push(...item.categories);
    }
    
    // Extract hashtags from title and content
    const text = `${item.title} ${item.description || ''}`;
    const hashtags = text.match(/#\w+/g) || [];
    tags.push(...hashtags.map(tag => tag.substring(1)));
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract image URL from RSS item
   */
  extractImageUrl(item) {
    if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
      return item.enclosure.url;
    }
    
    if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
      return item['media:content'].$.url;
    }
    
    // Try to extract image from content
    const content = item.content || item.description || '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) {
      return imgMatch[1];
    }
    
    return null;
  }

  /**
   * Parse date from various RSS date formats
   */
  parseDate(dateString) {
    if (!dateString) return new Date().toISOString();
    
    try {
      const date = new Date(dateString);
      return date.toISOString();
    } catch (error) {
      logger.error('Failed to parse date:', dateString);
      return new Date().toISOString();
    }
  }

  /**
   * Detect breaking news based on title and content
   */
  detectBreakingNews(title, content) {
    const breakingKeywords = [
      'breaking', 'urgent', 'alert', 'developing', 'just in',
      'live', 'update', 'emergency', 'crisis', 'major'
    ];
    
    const text = `${title} ${content}`.toLowerCase();
    return breakingKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Generate unique article ID based on content
   */
  generateArticleId(article) {
    const content = `${article.title}${article.source_url}${article.published_at}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Check if article should be updated
   */
  shouldUpdateArticle(existing, updated) {
    // Update if content has changed significantly
    const existingHash = crypto.createHash('md5').update(existing.content || '').digest('hex');
    const updatedHash = crypto.createHash('md5').update(updated.content || '').digest('hex');
    
    return existingHash !== updatedHash;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Clean HTML tags and entities from text
   */
  cleanHtml(html) {
    if (!html) return '';
    
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    return {
      total_articles: this.processedArticles.size,
      is_processing: this.isProcessing,
      last_processed: new Date().toISOString(),
      memory_usage: process.memoryUsage()
    };
  }

  /**
   * Clear processed articles cache
   */
  clearCache() {
    this.processedArticles.clear();
    return { success: true, message: 'Cache cleared' };
  }
}

module.exports = RSSProcessingService;
