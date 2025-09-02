// News API Service - Unified interface for multiple news aggregators
import MediaStackAdapter from '../adapters/mediastackAdapter.js';
import RSSAdapter from '../adapters/rssAdapter.js';
import NewsAPIAdapter from '../adapters/newsApiAdapter.js';
import NewsApiAiAdapter from '../adapters/newsApiAiAdapter.js';
import browserCacheService from './browserCacheService.js';

class NewsApiService {
  constructor() {
    this.apis = new Map();
    this.rateLimits = new Map();
    this.lastRequestTime = new Map();
    
    // Auto-register adapters
    this.registerApi('rss', new RSSAdapter());
    this.registerApi('newsapi', new NewsAPIAdapter());
    this.registerApi('newsapi-ai', new NewsApiAiAdapter());
  }

  // Register a new API adapter
  registerApi(name, adapter) {
    this.apis.set(name, adapter);
    this.rateLimits.set(name, adapter.rateLimit || 1000); // Default 1 request per second
    this.lastRequestTime.set(name, 0);
  }

  // Rate limiting helper
  async enforceRateLimit(apiName) {
    const rateLimit = this.rateLimits.get(apiName);
    const lastRequest = this.lastRequestTime.get(apiName);
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < rateLimit) {
      const waitTime = rateLimit - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime.set(apiName, Date.now());
  }

  // Fetch articles from a specific API with caching
  async fetchFromApi(apiName, params = {}) {
    const adapter = this.apis.get(apiName);
    if (!adapter) {
      throw new Error(`API adapter '${apiName}' not found`);
    }

    await this.enforceRateLimit(apiName);

    try {
      // Map parameters correctly for different adapters
      const mappedParams = { ...params };
      if (params.categories && !params.category) {
        mappedParams.category = params.categories; // RSS adapter expects 'category'
      }
      
      const articles = await adapter.fetchArticles(mappedParams);
      const normalizedArticles = this.normalizeArticles(articles, apiName);
      
      // Cache articles in database with deduplication
      if (normalizedArticles.length > 0) {
        try {
          browserCacheService.cacheArticles(apiName, normalizedArticles, params);
          console.log(`${apiName}: Cached ${normalizedArticles.length} articles`);
        } catch (cacheError) {
          console.warn(`Failed to cache articles from ${apiName}:`, cacheError);
        }
      }
      
      return normalizedArticles;
    } catch (error) {
      console.error(`Error fetching from ${apiName}:`, error);
      throw error;
    }
  }

  // Fetch articles from multiple APIs and combine
  async fetchFromMultipleApis(apiNames, params = {}) {
    const promises = apiNames.map(apiName => 
      this.fetchFromApi(apiName, params).catch(error => {
        console.warn(`Failed to fetch from ${apiName}:`, error);
        return [];
      })
    );

    const results = await Promise.all(promises);
    const allArticles = results.flat();
    
    // Remove duplicates based on title similarity
    return this.deduplicateArticles(allArticles);
  }

  // Normalize articles to consistent format
  normalizeArticles(articles, source) {
    return articles.map(article => ({
      id: article.id || this.generateId(article),
      title: article.title,
      summary: article.summary || article.description || '',
      content: article.content || '',
      url: article.url,
      source_id: article.source_id || source,
      source_name: article.source_name || article.source?.name || source,
      author: article.author || 'Unknown',
      published_at: this.normalizeDate(article.published_at || article.publishedAt),
      image_url: article.image_url || article.urlToImage,
      category: article.category || 'general',
      bias_score: article.bias_score || null,
      credibility_score: article.credibility_score || null,
      ai_analysis: article.ai_analysis || null,
      api_source: source,
      fetched_at: new Date().toISOString()
    }));
  }

  // Remove duplicate articles based on title similarity
  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      if (seen.has(normalizedTitle)) {
        return false;
      }
      seen.add(normalizedTitle);
      return true;
    });
  }

  // Generate unique ID for articles
  generateId(article) {
    const str = `${article.title}-${article.url}-${article.published_at}`;
    return btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  // Normalize date formats
  normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  // Get cached articles with intelligent refresh
  async getCachedArticles(params = {}) {
    try {
      const apiSources = params.apiSources || ['rss', 'newsapi', 'newsapi-ai'];
      let allCachedArticles = [];
      let needsFresh = false;

      // Check cache for each API source
      for (const apiSource of apiSources) {
        const cachedArticles = browserCacheService.getCachedArticles(apiSource, params);
        if (cachedArticles) {
          allCachedArticles.push(...cachedArticles);
        } else {
          needsFresh = true;
        }
      }

      if (allCachedArticles.length > 0 && !needsFresh && !params.forceRefresh) {
        console.log(`Returning ${allCachedArticles.length} cached articles`);
        return browserCacheService.deduplicateArticles(allCachedArticles).slice(0, params.limit || 50);
      }

      console.log('Fetching fresh articles and updating cache...');
      const freshArticles = await this.fetchFromMultipleApis(apiSources, params);
      
      return freshArticles.slice(0, params.limit || 50);
    } catch (error) {
      console.error('Error getting cached articles:', error);
      return this.fetchFromMultipleApis(['rss'], params);
    }
  }

  getCacheExpiryHours(apiSource) {
    const expiryMap = {
      'rss': 0.5,        // 30 minutes
      'newsapi': 2,      // 2 hours  
      'newsapi-ai': 2,   // 2 hours
      'mediastack': 4    // 4 hours
    };
    return expiryMap[apiSource] || 1;
  }

  getDefaultDateFrom() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString();
  }

  // Get database statistics
  getCacheStats() {
    return browserCacheService.getCacheStats();
  }

  async cleanOldArticles(daysOld = 7) {
    // Clear all cache for cleanup
    browserCacheService.clearCache();
    console.log('Browser cache cleared');
    return { deleted: 0 }; // Browser cache doesn't track deletions
  }

  // Search cached articles
  async searchCachedArticles(query, params = {}) {
    try {
      // Simple search across all cached articles
      const apiSources = params.apiSources || ['rss', 'newsapi', 'newsapi-ai'];
      let allArticles = [];
      
      for (const apiSource of apiSources) {
        const cached = browserCacheService.getCachedArticles(apiSource, params);
        if (cached) allArticles.push(...cached);
      }
      
      if (!query) return allArticles;
      
      const searchLower = query.toLowerCase();
      return allArticles.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.source_name.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching cached articles:', error);
      return [];
    }
  }

  // Get API performance metrics
  getApiMetrics() {
    const metrics = {};
    for (const [name, adapter] of this.apis) {
      metrics[name] = {
        name,
        rateLimit: this.rateLimits.get(name),
        lastRequest: this.lastRequestTime.get(name),
        isAvailable: adapter.isAvailable ? adapter.isAvailable() : true,
        features: adapter.features || []
      };
    }
    return metrics;
  }

  // Test API connectivity and performance
  async testApi(apiName, testParams = {}) {
    const startTime = Date.now();
    try {
      // Map categories parameter correctly for RSS adapter
      const params = { ...testParams, limit: 5 };
      if (testParams.categories) {
        params.category = testParams.categories; // RSS adapter expects 'category', not 'categories'
      }
      
      const articles = await this.fetchFromApi(apiName, params);
      const endTime = Date.now();
      
      return {
        apiName,
        success: true,
        responseTime: endTime - startTime,
        articleCount: articles.length,
        sampleArticle: articles[0] || null,
        error: null
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        apiName,
        success: false,
        responseTime: endTime - startTime,
        articleCount: 0,
        sampleArticle: null,
        error: error.message
      };
    }
  }

  // Test all registered APIs
  async testAllApis(testParams = {}) {
    const apiNames = Array.from(this.apis.keys());
    const promises = apiNames.map(name => this.testApi(name, testParams));
    return Promise.all(promises);
  }
}

// Create singleton instance
export const newsApiService = new NewsApiService();
export default newsApiService;
