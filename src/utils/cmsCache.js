// CMS Data Caching Utility
class CMSCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    
    // Different TTL for different types of content
    this.ttlConfig = {
      '/api/cms/site-config': 30 * 60 * 1000, // 30 minutes - rarely changes
      '/api/cms/navigation': 15 * 60 * 1000, // 15 minutes - changes occasionally
      '/api/cms/topics': 10 * 60 * 1000, // 10 minutes - moderate changes
      '/api/cms/news-sources': 30 * 60 * 1000, // 30 minutes - rarely changes
      '/api/cms/breaking-news': 1 * 60 * 1000, // 1 minute - needs to be fresh
      '/api/cms/trending-topics': 5 * 60 * 1000, // 5 minutes - changes regularly
      '/api/cms/homepage-sections': 15 * 60 * 1000, // 15 minutes - moderate changes
      '/api/cms/daily-briefs': 60 * 60 * 1000, // 1 hour - daily content
      '/api/cms/page-content': 60 * 60 * 1000, // 1 hour - static content
    };
  }

  // Get TTL for specific endpoint
  getTTL(endpoint) {
    // Extract base endpoint without query params
    const baseEndpoint = endpoint.split('?')[0];
    return this.ttlConfig[baseEndpoint] || this.defaultTTL;
  }

  // Check if cached data is still valid
  isValid(key) {
    if (!this.cache.has(key) || !this.timestamps.has(key)) {
      return false;
    }
    
    const timestamp = this.timestamps.get(key);
    const ttl = this.getTTL(key);
    const now = Date.now();
    
    return (now - timestamp) < ttl;
  }

  // Get cached data if valid
  get(key) {
    if (this.isValid(key)) {
      return this.cache.get(key);
    }
    
    // Clean up expired entry
    this.delete(key);
    return null;
  }

  // Set cached data with timestamp
  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
    
    // Prevent memory leaks by limiting cache size
    if (this.cache.size > 100) {
      this.cleanup();
    }
  }

  // Delete cached entry
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      const ttl = this.getTTL(key);
      if ((now - timestamp) >= ttl) {
        this.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      timestamps: Array.from(this.timestamps.entries()).map(([key, timestamp]) => ({
        key,
        age: Date.now() - timestamp,
        ttl: this.getTTL(key),
        valid: this.isValid(key)
      }))
    };
  }

  // Preload critical data
  async preloadCritical() {
    const criticalEndpoints = [
      '/api/cms/site-config',
      '/api/cms/navigation?location=header',
      '/api/cms/topics'
    ];

    const promises = criticalEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        this.set(endpoint, data);
      } catch (error) {
        console.warn(`Failed to preload ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const cmsCache = new CMSCache();

// Enhanced fetch function with caching
export const cachedFetch = async (endpoint) => {
  // Check cache first
  const cached = cmsCache.get(endpoint);
  if (cached) {
    return cached;
  }

  // Fetch from server
  const response = await fetch(endpoint);
  const data = await response.json();

  // Cache successful responses
  if (response.ok) {
    cmsCache.set(endpoint, data);
  }

  return data;
};

// Batch fetch multiple endpoints efficiently
export const batchFetch = async (endpoints) => {
  const results = {};
  const toFetch = [];

  // Check cache for each endpoint
  for (const endpoint of endpoints) {
    const cached = cmsCache.get(endpoint);
    if (cached) {
      results[endpoint] = cached;
    } else {
      toFetch.push(endpoint);
    }
  }

  // Fetch uncached endpoints in parallel
  if (toFetch.length > 0) {
    const promises = toFetch.map(async (endpoint) => {
      try {
        const data = await cachedFetch(endpoint);
        return { endpoint, data };
      } catch (error) {
        console.error(`Batch fetch failed for ${endpoint}:`, error);
        return { endpoint, error };
      }
    });

    const fetchResults = await Promise.allSettled(promises);
    
    fetchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data) {
        results[result.value.endpoint] = result.value.data;
      }
    });
  }

  return results;
};

// Initialize cache cleanup interval
setInterval(() => {
  cmsCache.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes

export default cmsCache;
