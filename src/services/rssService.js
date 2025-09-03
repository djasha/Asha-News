// RSS Data Service for Asha.News
// Handles fetching and managing RSS article data

class RSSService {
  constructor() {
    this.articlesUrl = '/data/articles.json';
    this.cache = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async fetchArticles(forceRefresh = false) {
    // Return cached data if available and not expired
    if (!forceRefresh && this.cache && this.lastFetch && 
        (Date.now() - this.lastFetch < this.cacheTimeout)) {
      return this.cache;
    }

    try {
      const response = await fetch(this.articlesUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!data.articles || !Array.isArray(data.articles)) {
        throw new Error('Invalid articles data structure');
      }

      // Process and normalize articles
      const articles = data.articles.map(article => ({
        id: article.id,
        title: article.title || 'Untitled',
        summary: article.summary || '',
        url: article.url || '',
        publication_date: article.publication_date || new Date().toISOString(),
        source_id: article.source_id || 'unknown',
        source_name: article.source_name || 'Unknown Source',
        political_bias: article.political_bias || 'center',
        topic: article.topic || 'General',
        section: article.section || 'featured',
        author: article.author || article.source_name || 'Unknown',
        image_url: article.image_url || null,
        factual_quality: article.factual_quality || 0.8,
        confidence_score: article.confidence_score || 0.8,
        ai_analysis: article.ai_analysis || null
      }));

      // Cache the processed data
      this.cache = {
        ...data,
        articles,
        processed_at: new Date().toISOString()
      };
      this.lastFetch = Date.now();

      return this.cache;
    } catch (error) {
      console.error('Failed to fetch RSS articles:', error);
      
      // Return cached data if available, otherwise return empty structure
      if (this.cache) {
        console.warn('Using cached RSS data due to fetch error');
        return this.cache;
      }
      
      return {
        fetched_at: new Date().toISOString(),
        count: 0,
        articles: [],
        error: error.message
      };
    }
  }

  async getArticles(options = {}) {
    const data = await this.fetchArticles(options.forceRefresh);
    let articles = data.articles || [];

    // Apply filters
    if (options.bias) {
      articles = articles.filter(article => 
        article.political_bias === options.bias
      );
    }

    if (options.source) {
      articles = articles.filter(article => 
        article.source_id === options.source
      );
    }

    if (options.topic) {
      articles = articles.filter(article => 
        article.topic === options.topic
      );
    }

    if (options.section) {
      articles = articles.filter(article => 
        article.section === options.section
      );
    }

    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.summary.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (options.sortBy === 'date') {
      articles.sort((a, b) => 
        new Date(b.publication_date) - new Date(a.publication_date)
      );
    } else if (options.sortBy === 'title') {
      articles.sort((a, b) => a.title.localeCompare(b.title));
    } else if (options.sortBy === 'source') {
      articles.sort((a, b) => a.source_name.localeCompare(b.source_name));
    }

    // Apply pagination
    if (options.limit) {
      articles = articles.slice(0, options.limit);
    }

    return {
      articles,
      total: articles.length,
      fetched_at: data.fetched_at,
      processed_at: data.processed_at
    };
  }

  async getSources() {
    const data = await this.fetchArticles();
    const articles = data.articles || [];
    
    // Extract unique sources
    const sourcesMap = new Map();
    articles.forEach(article => {
      if (!sourcesMap.has(article.source_id)) {
        sourcesMap.set(article.source_id, {
          id: article.source_id,
          name: article.source_name,
          bias: article.political_bias,
          article_count: 0
        });
      }
      sourcesMap.get(article.source_id).article_count++;
    });

    return Array.from(sourcesMap.values())
      .sort((a, b) => b.article_count - a.article_count);
  }

  async getBiasDistribution() {
    const data = await this.fetchArticles();
    const articles = data.articles || [];
    
    const distribution = {
      left: 0,
      center: 0,
      right: 0
    };

    articles.forEach(article => {
      const bias = article.political_bias;
      if (distribution.hasOwnProperty(bias)) {
        distribution[bias]++;
      }
    });

    return distribution;
  }

  // Clear cache (useful for development/testing)
  clearCache() {
    this.cache = null;
    this.lastFetch = null;
  }

  // Get cache status
  getCacheStatus() {
    return {
      cached: !!this.cache,
      lastFetch: this.lastFetch,
      cacheAge: this.lastFetch ? Date.now() - this.lastFetch : null,
      expired: this.lastFetch ? (Date.now() - this.lastFetch > this.cacheTimeout) : true
    };
  }
}

// Create singleton instance
const rssService = new RSSService();

export default rssService;
