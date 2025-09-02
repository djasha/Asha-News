// Browser-compatible caching service using localStorage and memory
class BrowserCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheExpiry = {
      'rss': 30 * 60 * 1000, // 30 minutes
      'newsapi': 2 * 60 * 60 * 1000, // 2 hours
      'newsapi-ai': 2 * 60 * 60 * 1000, // 2 hours
      'mediastack': 4 * 60 * 60 * 1000 // 4 hours
    };
  }

  // Generate cache key
  generateCacheKey(apiSource, params = {}) {
    const keyParams = {
      apiSource,
      category: params.category || 'general',
      query: params.query || '',
      country: params.country || ''
    };
    return `cache_${JSON.stringify(keyParams)}`;
  }

  // Check if cache is expired
  isCacheExpired(cacheData, apiSource) {
    if (!cacheData || !cacheData.timestamp) return true;
    
    const maxAge = this.cacheExpiry[apiSource] || 60 * 60 * 1000; // Default 1 hour
    const age = Date.now() - cacheData.timestamp;
    return age > maxAge;
  }

  // Get cached articles
  getCachedArticles(apiSource, params = {}) {
    try {
      const cacheKey = this.generateCacheKey(apiSource, params);
      
      // Check memory cache first
      if (this.memoryCache.has(cacheKey)) {
        const cacheData = this.memoryCache.get(cacheKey);
        if (!this.isCacheExpired(cacheData, apiSource)) {
          console.log(`Retrieved ${cacheData.articles.length} articles from memory cache for ${apiSource}`);
          return cacheData.articles;
        }
      }

      // Check localStorage (browser only)
      if (typeof localStorage !== 'undefined') {
        try {
          const localStorageData = localStorage.getItem(cacheKey);
          if (localStorageData) {
            const cacheData = JSON.parse(localStorageData);
            if (!this.isCacheExpired(cacheData, apiSource)) {
              // Update memory cache
              this.memoryCache.set(cacheKey, cacheData);
              console.log(`Retrieved ${cacheData.articles.length} articles from localStorage cache for ${apiSource}`);
              return cacheData.articles;
            }
          }
        } catch (e) {
          // localStorage error, continue with memory cache only
        }
      }

      return null; // No valid cache found
    } catch (error) {
      console.error('Error retrieving cached articles:', error);
      return null;
    }
  }

  // Cache articles
  cacheArticles(apiSource, articles, params = {}) {
    try {
      const cacheKey = this.generateCacheKey(apiSource, params);
      const cacheData = {
        articles: this.deduplicateArticles(articles),
        timestamp: Date.now(),
        apiSource,
        params
      };

      // Store in memory cache
      this.memoryCache.set(cacheKey, cacheData);

      // Store in localStorage (browser only, with size limit check)
      if (typeof localStorage !== 'undefined') {
        try {
          const dataString = JSON.stringify(cacheData);
          if (dataString.length < 5 * 1024 * 1024) { // 5MB limit
            localStorage.setItem(cacheKey, dataString);
          }
        } catch (storageError) {
          console.warn('localStorage full, using memory cache only:', storageError);
        }
      }

      console.log(`Cached ${articles.length} articles for ${apiSource}`);
      return cacheData.articles;
    } catch (error) {
      console.error('Error caching articles:', error);
      return articles;
    }
  }

  // Simple deduplication by URL and title
  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = `${article.url}_${article.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Clear cache for specific API or all
  clearCache(apiSource = null) {
    if (apiSource) {
      // Clear specific API cache
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.apiSource === apiSource) {
          this.memoryCache.delete(key);
        }
      }
      
      // Clear from localStorage (browser only)
      if (typeof localStorage !== 'undefined') {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.includes(`"apiSource":"${apiSource}"`)) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // localStorage error, ignore
        }
      }
    } else {
      // Clear all cache
      this.memoryCache.clear();
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.clear();
        } catch (e) {
          // localStorage error, ignore
        }
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    const memorySize = this.memoryCache.size;
    let localStorageSize = 0;
    
    // Check if localStorage is available (browser environment)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorageSize = Object.keys(localStorage).filter(key => 
          key.startsWith('cache_')
        ).length;
      }
    } catch (e) {
      // localStorage not available (Node.js environment)
    }
    
    return {
      memoryEntries: memorySize,
      localStorageEntries: localStorageSize,
      totalArticles: Array.from(this.memoryCache.values()).reduce(
        (total, cache) => total + (cache.articles?.length || 0), 0
      )
    };
  }
}

export default new BrowserCacheService();
