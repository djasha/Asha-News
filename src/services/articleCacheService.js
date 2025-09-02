// Article Cache Service - Integrates database caching with news APIs
import databaseService from './databaseService.js';
import newsApiService from './newsApiService.js';

class ArticleCacheService {
  constructor() {
    this.cacheExpiryHours = {
      'rss': 0.5,        // RSS feeds refresh every 30 minutes
      'newsapi': 2,      // NewsAPI.org refresh every 2 hours
      'newsapi-ai': 2,   // NewsAPI.ai refresh every 2 hours
      'mediastack': 4    // MediaStack refresh every 4 hours
    };
  }

  // Get articles with intelligent caching
  async getArticles(params = {}) {
    const { forceRefresh = false, apiSources = ['rss', 'newsapi', 'newsapi-ai'] } = params;
    
    // Check if we have fresh cached data
    if (!forceRefresh) {
      const cachedArticles = this.getCachedArticles(params);
      if (cachedArticles.length > 0) {
        console.log(`Returning ${cachedArticles.length} cached articles`);
        return cachedArticles;
      }
    }

    // Fetch fresh data from APIs
    console.log('Fetching fresh articles from APIs...');
    const freshArticles = await this.fetchAndCacheArticles(apiSources, params);
    
    return freshArticles;
  }

  // Get cached articles with filtering
  getCachedArticles(params = {}) {
    try {
      // Check if any API needs refresh
      const needsRefresh = this.checkIfRefreshNeeded(params.apiSources || ['rss', 'newsapi', 'newsapi-ai']);
      
      if (needsRefresh && !params.allowStale) {
        return [];
      }

      // Get cached articles
      const cacheParams = {
        ...params,
        dateFrom: params.dateFrom || this.getDefaultDateFrom(),
        limit: params.limit || 50
      };

      return databaseService.getCachedArticles(cacheParams);
    } catch (error) {
      console.error('Error getting cached articles:', error);
      return [];
    }
  }

  // Check if any API source needs refresh
  checkIfRefreshNeeded(apiSources) {
    return apiSources.some(apiSource => {
      const maxAge = this.cacheExpiryHours[apiSource] || 1;
      return databaseService.needsRefresh(apiSource, maxAge);
    });
  }

  // Fetch fresh articles and cache them
  async fetchAndCacheArticles(apiSources, params = {}) {
    const allFreshArticles = [];
    const cacheResults = {
      totalFetched: 0,
      totalSaved: 0,
      totalDuplicates: 0,
      apiResults: {}
    };

    for (const apiSource of apiSources) {
      try {
        console.log(`Fetching from ${apiSource}...`);
        
        // Fetch from API
        const apiArticles = await newsApiService.fetchFromApi(apiSource, {
          ...params,
          limit: params.limit || 50
        });

        console.log(`${apiSource}: fetched ${apiArticles.length} articles`);
        cacheResults.totalFetched += apiArticles.length;

        // Cache articles with deduplication
        const saveResults = await databaseService.saveArticles(apiArticles);
        cacheResults.totalSaved += saveResults.saved;
        cacheResults.totalDuplicates += saveResults.duplicates;
        cacheResults.apiResults[apiSource] = saveResults;

        allFreshArticles.push(...apiArticles);

        // Rate limiting between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching from ${apiSource}:`, error);
        cacheResults.apiResults[apiSource] = { error: error.message };
      }
    }

    console.log('Cache results:', cacheResults);
    
    // Return deduplicated articles
    return this.deduplicateArticles(allFreshArticles);
  }

  // Get default date range (last 7 days)
  getDefaultDateFrom() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString();
  }

  // Remove duplicates from article array
  deduplicateArticles(articles) {
    const seen = new Map();
    const deduplicated = [];

    for (const article of articles) {
      const titleHash = databaseService.generateHash(article.title);
      const urlHash = databaseService.generateHash(article.url);
      
      // Create composite key for deduplication
      const compositeKey = `${titleHash}-${urlHash}`;
      
      if (!seen.has(compositeKey)) {
        seen.set(compositeKey, true);
        deduplicated.push(article);
      }
    }

    return deduplicated;
  }

  // Search articles (cached + fresh if needed)
  async searchArticles(searchTerm, params = {}) {
    // First try cached search
    const cachedResults = databaseService.searchArticles(searchTerm, params);
    
    if (cachedResults.length > 0 && !params.forceRefresh) {
      console.log(`Found ${cachedResults.length} cached search results for "${searchTerm}"`);
      return cachedResults;
    }

    // If no cached results or force refresh, fetch fresh data
    console.log(`Fetching fresh search results for "${searchTerm}"`);
    const freshArticles = await this.fetchAndCacheArticles(
      params.apiSources || ['rss', 'newsapi', 'newsapi-ai'],
      { ...params, keywords: searchTerm }
    );

    return freshArticles.filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Get articles by category with caching
  async getArticlesByCategory(category, params = {}) {
    return this.getArticles({
      ...params,
      category
    });
  }

  // Get articles by source with caching
  async getArticlesBySource(sourceName, params = {}) {
    return this.getArticles({
      ...params,
      source: sourceName
    });
  }

  // Force refresh all APIs and update cache
  async refreshAllApis(params = {}) {
    console.log('Force refreshing all APIs...');
    return this.fetchAndCacheArticles(
      ['rss', 'newsapi', 'newsapi-ai'],
      { ...params, forceRefresh: true }
    );
  }

  // Get cache statistics
  getCacheStats() {
    return databaseService.getStats();
  }

  // Clean old cached articles
  cleanOldCache(daysToKeep = 30) {
    return databaseService.cleanOldArticles(daysToKeep);
  }

  // Get sources with statistics
  getSources() {
    return databaseService.getSources();
  }

  // Update article with AI analysis
  async updateArticleAnalysis(articleId, aiAnalysis) {
    return databaseService.updateArticleAnalysis(articleId, aiAnalysis);
  }

  // Get trending articles (most social shares)
  getTrendingArticles(params = {}) {
    const query = `
      SELECT * FROM articles 
      WHERE is_duplicate = 0 
      AND published_at > datetime('now', '-24 hours')
      ORDER BY social_score DESC, published_at DESC
      LIMIT ?
    `;
    
    const stmt = databaseService.db.prepare(query);
    const rows = stmt.all(params.limit || 20);

    return rows.map(row => ({
      ...row,
      ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null
    }));
  }

  // Get articles by bias range
  getArticlesByBias(minBias = -1, maxBias = 1, params = {}) {
    const query = `
      SELECT * FROM articles 
      WHERE is_duplicate = 0 
      AND bias_score IS NOT NULL
      AND bias_score >= ? AND bias_score <= ?
      ORDER BY published_at DESC
      LIMIT ?
    `;
    
    const stmt = databaseService.db.prepare(query);
    const rows = stmt.all(minBias, maxBias, params.limit || 50);

    return rows.map(row => ({
      ...row,
      ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null
    }));
  }
}

// Create singleton instance
export const articleCacheService = new ArticleCacheService();
export default articleCacheService;
