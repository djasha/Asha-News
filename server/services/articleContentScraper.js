/**
 * Article Content Scraper Service
 * Hybrid approach: API Ninja Article Extractor (primary) + Jina Reader (fallback)
 * Provides high-quality full article content extraction with caching
 */

class ArticleContentScraperService {
  constructor() {
    // API Ninja configuration
    this.apiNinjaUrl = 'https://api.api-ninjas.com/v1/article';
    this.apiNinjaKey = process.env.API_NINJA_KEY || 'O/YtHZJo/Hf7uRkpvnxspg==EIqshcukCwyEg0LT';
    
    // Jina Reader configuration (fallback)
    this.jinaReaderUrl = 'https://r.jina.ai';
    
    this.timeout = 15000; // 15 seconds
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
    
    // Statistics
    this.stats = {
      apiNinjaSuccess: 0,
      apiNinjaFailed: 0,
      jinaSuccess: 0,
      jinaFailed: 0,
      cacheHits: 0
    };
  }

  /**
   * Scrape full article content from URL (Hybrid approach)
   * @param {string} url - Article URL
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Article content
   */
  async scrapeArticle(url, options = {}) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    // Check cache
    const cached = this.cache.get(url);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      this.stats.cacheHits++;
      logger.info(`[ArticleScraper] Cache hit for ${url}`);
      return cached.data;
    }

    logger.info(`[ArticleScraper] Scraping ${url}`);

    // Try API Ninja first (best quality)
    try {
      const result = await this.scrapeWithApiNinja(url);
      if (result && result.content && result.content.length > 100) {
        this.stats.apiNinjaSuccess++;
        
        // Cache the result
        this.cache.set(url, {
          data: result,
          timestamp: Date.now()
        });
        
        logger.info(`[ArticleScraper] ✓ API Ninja success for ${url}`);
        return result;
      }
    } catch (error) {
      this.stats.apiNinjaFailed++;
      logger.warn(`[ArticleScraper] API Ninja failed, trying Jina fallback:`, error.message);
    }

    // Fallback to Jina Reader
    try {
      const result = await this.scrapeWithJina(url);
      if (result && result.content && result.content.length > 100) {
        this.stats.jinaSuccess++;
        
        // Cache the result
        this.cache.set(url, {
          data: result,
          timestamp: Date.now()
        });
        
        logger.info(`[ArticleScraper] ✓ Jina Reader success for ${url}`);
        return result;
      }
    } catch (error) {
      this.stats.jinaFailed++;
      logger.error(`[ArticleScraper] Both scrapers failed for ${url}`);
    }

    // Return minimal fallback
    return {
      url,
      title: '',
      content: '',
      summary: '',
      author: null,
      publishedAt: null,
      imageUrl: null,
      scrapedAt: new Date().toISOString(),
      source: 'fallback',
      error: 'All scraping methods failed'
    };
  }

  /**
   * Scrape using API Ninja Article Extractor
   * @param {string} url - Article URL
   * @returns {Promise<Object>} Article content
   */
  async scrapeWithApiNinja(url) {
    const apiUrl = `${this.apiNinjaUrl}?url=${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiNinjaKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Ninja returned ${response.status}`);
      }

      const data = await response.json();
      
      // Transform API Ninja response to our format
      return {
        url,
        title: data.title || '',
        content: data.text || '',
        summary: this.generateSummary(data.text || ''),
        author: Array.isArray(data.authors) && data.authors.length > 0 ? data.authors.join(', ') : null,
        publishedAt: data.publish_date ? new Date(data.publish_date).toISOString() : null,
        imageUrl: Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : null,
        scrapedAt: new Date().toISOString(),
        source: 'api-ninja',
        metadata: {
          videos: data.videos || [],
          allImages: data.images || []
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Scrape using Jina Reader (fallback)
   * @param {string} url - Article URL
   * @returns {Promise<Object>} Article content
   */
  async scrapeWithJina(url) {
    const jinaUrl = `${this.jinaReaderUrl}/${encodeURIComponent(url)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(jinaUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'markdown'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Jina Reader returned ${response.status}`);
      }

      const markdown = await response.text();
      
      // Parse markdown into structured content
      const parsed = this.parseMarkdown(markdown);
      
      return {
        url,
        title: parsed.title || '',
        content: parsed.content || markdown,
        summary: parsed.summary || this.generateSummary(parsed.content || markdown),
        author: parsed.author || null,
        publishedAt: parsed.publishedAt || null,
        imageUrl: parsed.imageUrl || null,
        scrapedAt: new Date().toISOString(),
        source: 'jina-reader'
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parse markdown content into structured data
   * @param {string} markdown - Markdown content from Jina
   * @returns {Object} Parsed content
   */
  parseMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return { content: '' };
    }

    const lines = markdown.split('\n');
    const result = {
      title: '',
      author: null,
      publishedAt: null,
      imageUrl: null,
      content: ''
    };

    // Extract title (first # heading)
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract author metadata
    const authorMatch = markdown.match(/Author[:\s]+([^\n]+)/i);
    if (authorMatch) {
      result.author = authorMatch[1].trim();
    }

    // Extract date
    const dateMatch = markdown.match(/Published[:\s]+([^\n]+)/i);
    if (dateMatch) {
      try {
        result.publishedAt = new Date(dateMatch[1].trim()).toISOString();
      } catch (_) {}
    }

    // Extract first image
    const imgMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
    if (imgMatch) {
      result.imageUrl = imgMatch[1];
    }

    // Clean content: remove metadata, keep paragraphs
    const contentLines = lines.filter(line => {
      // Skip metadata lines
      if (/^(Author|Published|Updated|Tags|Category)[:\s]/i.test(line)) {
        return false;
      }
      // Skip excessive whitespace
      if (/^\s*$/.test(line) && result.content.endsWith('\n\n')) {
        return false;
      }
      return true;
    });

    result.content = contentLines.join('\n').trim();

    return result;
  }

  /**
   * Generate summary from content (first 300 chars)
   * @param {string} content - Full content
   * @returns {string} Summary
   */
  generateSummary(content) {
    if (!content) return '';
    
    // Remove markdown formatting
    const plain = content
      .replace(/!\[.*?\]\(.*?\)/g, '') // images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/[#*_`]/g, '') // formatting
      .replace(/\n+/g, ' ') // newlines
      .trim();

    if (plain.length <= 300) {
      return plain;
    }

    // Find last sentence boundary within 300 chars
    const truncated = plain.substring(0, 300);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclaim = truncated.lastIndexOf('!');
    
    const boundary = Math.max(lastPeriod, lastQuestion, lastExclaim);
    
    if (boundary > 150) {
      return plain.substring(0, boundary + 1);
    }

    return truncated + '...';
  }

  /**
   * Batch scrape multiple articles
   * @param {Array<string>} urls - Article URLs
   * @param {Object} options - Scraping options
   * @returns {Promise<Array<Object>>} Scraped articles
   */
  async scrapeMultiple(urls, options = {}) {
    const { concurrency = 3 } = options;
    const results = [];

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(url => this.scrapeArticle(url, options))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + concurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cache: {
        size: this.cache.size,
        ttl: this.cacheTTL,
        urls: Array.from(this.cache.keys())
      },
      stats: this.stats,
      successRate: {
        apiNinja: this.stats.apiNinjaSuccess + this.stats.apiNinjaFailed > 0
          ? (this.stats.apiNinjaSuccess / (this.stats.apiNinjaSuccess + this.stats.apiNinjaFailed) * 100).toFixed(2) + '%'
          : 'N/A',
        jina: this.stats.jinaSuccess + this.stats.jinaFailed > 0
          ? (this.stats.jinaSuccess / (this.stats.jinaSuccess + this.stats.jinaFailed) * 100).toFixed(2) + '%'
          : 'N/A'
      }
    };
  }
}

module.exports = ArticleContentScraperService;
