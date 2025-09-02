class NewsAPIAdapter {
  constructor() {
    this.name = 'NewsAPI';
    this.baseUrl = 'https://newsapi.org/v2';
    this.apiKey = '47479e22211e4151afc8ca10b78c2f25';
    this.rateLimitDelay = 1000; // 1 second between requests for free tier
    this.lastRequestTime = 0;
  }

  getName() {
    return this.name;
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async fetchArticles(params = {}) {
    await this.enforceRateLimit();
    
    const {
      keywords = '',
      category = '',
      countries = '',
      sources = '',
      language = 'en',
      sortBy = 'publishedAt',
      limit = 25
    } = params;

    console.log('NewsAPI fetchArticles called with params:', params);

    try {
      let endpoint = '/everything';
      const queryParams = new URLSearchParams({
        apiKey: this.apiKey,
        language,
        sortBy,
        pageSize: Math.min(limit, 100) // NewsAPI max is 100
      });

      // Handle keywords (required for /everything endpoint)
      if (keywords && keywords.trim()) {
        queryParams.append('q', keywords);
      } else {
        // If no keywords, use /top-headlines instead
        endpoint = '/top-headlines';
        queryParams.delete('q');
      }

      // Handle category filtering
      if (category && category !== 'general' && endpoint === '/top-headlines') {
        queryParams.append('category', category);
      }

      // Handle country filtering (exclude countries)
      if (countries && endpoint === '/top-headlines') {
        // For NewsAPI, we need to specify which countries to include
        // Since user wants to exclude US, we'll include other major countries
        const excludeList = countries.split(',').map(c => c.trim().toLowerCase());
        if (excludeList.includes('us')) {
          queryParams.append('country', 'gb'); // Focus on UK for Palestine coverage
        }
      }

      // Handle source filtering
      if (sources) {
        queryParams.append('sources', sources);
      }

      const url = `${this.baseUrl}${endpoint}?${queryParams}`;
      console.log('NewsAPI request URL:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`NewsAPI Error: ${data.message || response.statusText}`);
      }

      console.log(`NewsAPI returned ${data.articles?.length || 0} articles`);

      return this.normalizeArticles(data.articles || []);
    } catch (error) {
      console.error('NewsAPI Adapter Error:', error);
      throw error;
    }
  }

  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  normalizeArticles(articles) {
    return articles.map(article => this.normalizeArticle(article)).filter(Boolean);
  }

  normalizeArticle(article) {
    try {
      return {
        id: this.generateId(article),
        title: article.title || '',
        summary: article.description || '',
        content: article.content || article.description || '',
        url: article.url || '',
        source_id: this.generateSourceId(article.source?.name),
        source_name: article.source?.name || 'Unknown',
        author: article.author || article.source?.name || 'Unknown',
        published_at: article.publishedAt || new Date().toISOString(),
        image_url: article.urlToImage || null,
        category: this.inferCategory(article),
        bias_score: this.getSourceBias(article.source?.name),
        credibility_score: this.getSourceCredibility(article.source?.name),
        ai_analysis: null,
        api_source: 'newsapi',
        fetched_at: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Error normalizing NewsAPI article:', error);
      return null;
    }
  }

  generateId(article) {
    const str = `${article.title || ''}-${article.url || ''}-${article.publishedAt || ''}`;
    const hash = str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString(36).substring(0, 16);
  }

  generateSourceId(sourceName) {
    if (!sourceName) return 'unknown';
    return sourceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  inferCategory(article) {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const text = `${title} ${description}`;

    if (text.includes('business') || text.includes('economy') || text.includes('market')) return 'business';
    if (text.includes('tech') || text.includes('technology') || text.includes('ai')) return 'technology';
    if (text.includes('sport') || text.includes('football') || text.includes('basketball')) return 'sports';
    if (text.includes('health') || text.includes('medical') || text.includes('covid')) return 'health';
    if (text.includes('science') || text.includes('research') || text.includes('study')) return 'science';
    if (text.includes('entertainment') || text.includes('movie') || text.includes('music')) return 'entertainment';
    
    return 'general';
  }

  getSourceBias(sourceName) {
    const biasMap = {
      'CNN': -0.2,
      'BBC News': 0.0,
      'Reuters': 0.0,
      'Associated Press': 0.0,
      'NPR': -0.1,
      'Fox News': 0.4,
      'The Guardian': -0.3,
      'New York Times': -0.2,
      'Washington Post': -0.2,
      'Wall Street Journal': 0.2,
      'Bloomberg': 0.1,
      'Al Jazeera English': -0.1,
      'Haaretz': -0.2,
      'Times of Israel': 0.1,
      'Middle East Eye': -0.2
    };
    
    return biasMap[sourceName] || 0.0;
  }

  getSourceCredibility(sourceName) {
    const credibilityMap = {
      'CNN': 0.8,
      'BBC News': 0.9,
      'Reuters': 0.9,
      'Associated Press': 0.9,
      'NPR': 0.85,
      'Fox News': 0.6,
      'The Guardian': 0.8,
      'New York Times': 0.85,
      'Washington Post': 0.8,
      'Wall Street Journal': 0.85,
      'Bloomberg': 0.85,
      'Al Jazeera English': 0.75,
      'Haaretz': 0.8,
      'Times of Israel': 0.75,
      'Middle East Eye': 0.7
    };
    
    return credibilityMap[sourceName] || 0.7;
  }

  async fetchSources(params = {}) {
    await this.enforceRateLimit();
    
    try {
      const queryParams = new URLSearchParams({
        apiKey: this.apiKey,
        language: params.language || 'en'
      });

      if (params.category) {
        queryParams.append('category', params.category);
      }

      if (params.country) {
        queryParams.append('country', params.country);
      }

      const url = `${this.baseUrl}/sources?${queryParams}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`NewsAPI Sources Error: ${data.message || response.statusText}`);
      }

      return data.sources || [];
    } catch (error) {
      console.error('NewsAPI Sources Error:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const testResult = await this.fetchArticles({ 
        keywords: 'test',
        limit: 1 
      });
      
      return {
        success: true,
        message: 'NewsAPI connection successful',
        sampleArticle: testResult[0] || null,
        responseTime: Date.now() - this.lastRequestTime
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        sampleArticle: null,
        responseTime: null
      };
    }
  }
}

export default NewsAPIAdapter;
