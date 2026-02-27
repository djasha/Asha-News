// NewsAPI.ai (Event Registry) Adapter
// Documentation: https://newsapi.ai/documentation
// API Base: http://eventregistry.org/api/v1/

class NewsApiAiAdapter {
  constructor() {
    this.name = 'NewsAPI.ai';
    this.baseUrl = 'http://eventregistry.org/api/v1';
    this.apiKey = 'c079d443-1c27-4b5e-95fe-dac1902bccf5';
    this.lastRequestTime = 0;
    this.rateLimitDelay = 1000; // 1 second between requests for free tier
    
    // Source bias and credibility mappings
    this.sourceBiasMap = {
      'BBC': { bias: 0.1, credibility: 0.9 },
      'Reuters': { bias: 0.0, credibility: 0.95 },
      'Associated Press': { bias: 0.0, credibility: 0.9 },
      'CNN': { bias: -0.3, credibility: 0.7 },
      'Fox News': { bias: 0.4, credibility: 0.6 },
      'The Guardian': { bias: -0.2, credibility: 0.8 },
      'The New York Times': { bias: -0.2, credibility: 0.85 },
      'The Washington Post': { bias: -0.2, credibility: 0.8 },
      'Wall Street Journal': { bias: 0.1, credibility: 0.85 },
      'Financial Times': { bias: 0.0, credibility: 0.9 },
      'Al Jazeera': { bias: -0.1, credibility: 0.75 },
      'Haaretz': { bias: -0.1, credibility: 0.8 },
      'Times of Israel': { bias: 0.1, credibility: 0.75 }
    };
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

  async fetchArticles(params = {}) {
    console.log('NewsAPI.ai fetchArticles called with params:', params);
    
    await this.enforceRateLimit();
    
    try {
      const endpoint = `${this.baseUrl}/article/getArticles`;
      const requestBody = this.buildRequestBody(params);
      
      console.log('NewsAPI.ai request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`NewsAPI.ai HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`NewsAPI.ai returned ${data.articles?.results?.length || 0} articles`);
      
      if (data.error) {
        throw new Error(`NewsAPI.ai API error: ${data.error.message}`);
      }

      return this.normalizeArticles(data.articles?.results || []);
    } catch (error) {
      console.error('NewsAPI.ai fetch error:', error);
      throw error;
    }
  }

  buildRequestBody(params) {
    const body = {
      apiKey: this.apiKey,
      action: 'getArticles',
      resultType: 'articles',
      articlesPage: 1,
      articlesCount: Math.min(params.limit || 50, 100),
      articlesSortBy: 'date',
      articlesIncludeArticleTitle: true,
      articlesIncludeArticleBody: true,
      articlesIncludeArticleUrl: true,
      articlesIncludeArticleImage: true,
      articlesIncludeArticleDate: true,
      articlesIncludeArticleSource: true,
      articlesIncludeArticleSocialScore: true,
      articlesIncludeArticleSentiment: true
    };

    // Add keyword search
    if (params.keywords) {
      body.keyword = params.keywords;
      body.keywordLoc = 'body'; // Search in article body
    }

    // Add category filtering
    if (params.category || params.categories) {
      const category = params.category || params.categories;
      body.categoryUri = this.mapCategoryToUri(category);
    }

    // Add language filtering
    body.lang = ['eng']; // Default to English

    // Add date filtering (last 7 days by default)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    body.dateStart = startDate.toISOString().split('T')[0];
    body.dateEnd = endDate.toISOString().split('T')[0];

    // Add source location filtering (country exclusion)
    if (params.countries) {
      // For NewsAPI.ai, we'll focus on non-US sources when US is excluded
      if (params.countries.toLowerCase() === 'us') {
        body.sourceLocationUri = this.getInternationalSourceLocations();
      }
    }

    return body;
  }

  mapCategoryToUri(category) {
    const categoryMap = {
      'business': 'news/Business',
      'entertainment': 'news/Entertainment',
      'general': 'news/Politics',
      'health': 'news/Health',
      'science': 'news/Science_and_Technology',
      'sports': 'news/Sports',
      'technology': 'news/Science_and_Technology'
    };
    
    return categoryMap[category.toLowerCase()] || 'news/Politics';
  }

  getInternationalSourceLocations() {
    // Return URIs for international locations (excluding US)
    return [
      'http://en.wikipedia.org/wiki/United_Kingdom',
      'http://en.wikipedia.org/wiki/Germany',
      'http://en.wikipedia.org/wiki/France',
      'http://en.wikipedia.org/wiki/Canada',
      'http://en.wikipedia.org/wiki/Australia',
      'http://en.wikipedia.org/wiki/Israel'
    ];
  }

  normalizeArticles(articles) {
    return articles.map(article => {
      const sourceName = article.source?.title || 'Unknown Source';
      const biasData = this.sourceBiasMap[sourceName] || { bias: 0, credibility: 0.5 };
      
      return {
        id: this.generateSafeId(article.uri || article.url),
        title: article.title || 'No Title',
        summary: article.body?.substring(0, 200) + '...' || 'No summary available',
        url: article.url || '',
        published_at: article.dateTime || article.date || new Date().toISOString(),
        source_name: sourceName,
        source_url: article.source?.uri || '',
        image_url: article.image || null,
        category: this.extractCategory(article),
        bias_score: biasData.bias,
        credibility_score: biasData.credibility,
        social_score: article.socialScore || 0,
        sentiment: article.sentiment || 0,
        api_source: 'NewsAPI.ai'
      };
    });
  }

  generateSafeId(input) {
    if (!input) return Math.random().toString(36).substr(2, 9);
    
    // Create a simple hash to avoid special characters
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  extractCategory(article) {
    if (article.categories && article.categories.length > 0) {
      const category = article.categories[0].label || article.categories[0].uri;
      return category.replace('news/', '').toLowerCase();
    }
    return 'general';
  }

  async testConnection() {
    try {
      const testArticles = await this.fetchArticles({ 
        keywords: 'test',
        limit: 1 
      });
      
      return {
        success: true,
        message: `NewsAPI.ai connected successfully. Found ${testArticles.length} test articles.`,
        sampleArticle: testArticles[0] || null
      };
    } catch (error) {
      return {
        success: false,
        message: `NewsAPI.ai connection failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async fetchSources() {
    try {
      await this.enforceRateLimit();
      
      const endpoint = `${this.baseUrl}/source/getSources`;
      const requestBody = {
        apiKey: this.apiKey,
        action: 'getSources',
        sourceType: 'news',
        resultType: 'sources',
        sourcesCount: 100
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.sources?.results || [];
    } catch (error) {
      console.error('NewsAPI.ai sources fetch error:', error);
      return [];
    }
  }

  getName() {
    return this.name;
  }

  getDescription() {
    return 'NewsAPI.ai (Event Registry) - AI-powered news analysis with 30,000+ sources worldwide';
  }

  getFeatures() {
    return [
      'Keyword search with semantic understanding',
      'Category and concept filtering',
      'Source location filtering',
      'Sentiment analysis',
      'Social media sharing scores',
      'Multi-language support',
      'Event clustering',
      'Real-time news monitoring'
    ];
  }
}

export default NewsApiAiAdapter;
