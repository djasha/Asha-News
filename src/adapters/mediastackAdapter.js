// MediaStack API Adapter
// Documentation: https://mediastack.com/documentation

class MediaStackAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://api.mediastack.com/v1';
    this.rateLimit = 1000; // 1 second between requests (free plan limitation)
    this.features = [
      'live_news',
      'historical_news', // Standard plan and higher
      'news_sources',
      'keyword_search',
      'category_filtering',
      'country_filtering',
      'language_filtering',
      'source_filtering',
      'date_filtering',
      'sorting',
      'pagination'
    ];
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async fetchArticles(params = {}) {
    const queryParams = this.buildQueryParams(params);
    const url = `${this.baseUrl}/news?${queryParams}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`MediaStack API Error: ${data.error?.info || response.statusText}`);
      }

      return this.normalizeArticles(data.data || [], data.pagination);
    } catch (error) {
      console.error('MediaStack API Error:', error);
      throw error;
    }
  }

  async fetchSources(params = {}) {
    const queryParams = this.buildSourcesQueryParams(params);
    const url = `${this.baseUrl}/sources?${queryParams}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(`MediaStack Sources API Error: ${data.error?.info || response.statusText}`);
      }

      return data.data || [];
    } catch (error) {
      console.error('MediaStack Sources API Error:', error);
      throw error;
    }
  }

  buildQueryParams(params) {
    const queryParams = new URLSearchParams();
    
    // Required API key
    queryParams.append('access_key', this.apiKey);

    // Optional parameters
    if (params.keywords) {
      queryParams.append('keywords', params.keywords);
    }

    if (params.sources) {
      // Support both array and string formats
      const sources = Array.isArray(params.sources) ? params.sources.join(',') : params.sources;
      queryParams.append('sources', sources);
    }

    if (params.categories) {
      const categories = Array.isArray(params.categories) ? params.categories.join(',') : params.categories;
      queryParams.append('categories', categories);
    }

    if (params.countries) {
      const countries = Array.isArray(params.countries) ? params.countries.join(',') : params.countries;
      queryParams.append('countries', countries);
    }

    if (params.languages) {
      const languages = Array.isArray(params.languages) ? params.languages.join(',') : params.languages;
      queryParams.append('languages', languages);
    }

    if (params.date) {
      // Support single date or date range
      queryParams.append('date', params.date);
    }

    if (params.sort) {
      // published_desc (default) or popularity
      queryParams.append('sort', params.sort);
    }

    if (params.limit) {
      // Default: 25, Max: 100
      queryParams.append('limit', Math.min(params.limit, 100));
    }

    if (params.offset) {
      queryParams.append('offset', params.offset);
    }

    return queryParams.toString();
  }

  buildSourcesQueryParams(params) {
    const queryParams = new URLSearchParams();
    
    // Required API key
    queryParams.append('access_key', this.apiKey);

    // Optional parameters for sources endpoint
    if (params.search) {
      queryParams.append('search', params.search);
    }

    if (params.countries) {
      const countries = Array.isArray(params.countries) ? params.countries.join(',') : params.countries;
      queryParams.append('countries', countries);
    }

    if (params.languages) {
      const languages = Array.isArray(params.languages) ? params.languages.join(',') : params.languages;
      queryParams.append('languages', languages);
    }

    if (params.categories) {
      const categories = Array.isArray(params.categories) ? params.categories.join(',') : params.categories;
      queryParams.append('categories', categories);
    }

    if (params.limit) {
      queryParams.append('limit', Math.min(params.limit, 100));
    }

    if (params.offset) {
      queryParams.append('offset', params.offset);
    }

    return queryParams.toString();
  }

  normalizeArticles(articles, pagination) {
    return articles.map(article => ({
      id: this.generateId(article),
      title: article.title || '',
      summary: article.description || '',
      content: '', // MediaStack doesn't provide full content
      url: article.url || '',
      source_id: article.source || 'unknown',
      source_name: article.source || 'Unknown Source',
      author: article.author || 'Unknown',
      published_at: article.published_at || new Date().toISOString(),
      image_url: article.image || null,
      category: article.category || 'general',
      language: article.language || 'en',
      country: article.country || 'unknown',
      bias_score: null, // Will be populated by AI analysis
      credibility_score: null, // Will be populated by AI analysis
      ai_analysis: null,
      api_source: 'mediastack',
      fetched_at: new Date().toISOString(),
      pagination: pagination
    }));
  }

  generateId(article) {
    const str = `${article.title}-${article.url}-${article.published_at}`;
    return btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  // Get supported categories
  getSupportedCategories() {
    return [
      'general',
      'business',
      'entertainment',
      'health',
      'science',
      'sports',
      'technology'
    ];
  }

  // Get supported countries (sample - full list available in API docs)
  getSupportedCountries() {
    return [
      'us', 'gb', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be',
      'ch', 'at', 'ie', 'pt', 'dk', 'se', 'no', 'fi', 'pl', 'cz',
      'hu', 'ro', 'bg', 'hr', 'si', 'sk', 'lt', 'lv', 'ee', 'gr',
      'cy', 'mt', 'lu', 'is', 'li', 'mc', 'sm', 'va', 'ad', 'ru',
      'ua', 'by', 'md', 'rs', 'me', 'mk', 'al', 'ba', 'xk', 'tr',
      'il', 'ae', 'sa', 'eg', 'ma', 'tn', 'dz', 'ly', 'sd', 'et',
      'ke', 'tz', 'ug', 'rw', 'bi', 'dj', 'so', 'er', 'ss', 'cf',
      'td', 'cm', 'gq', 'ga', 'cg', 'cd', 'ao', 'zm', 'zw', 'bw',
      'na', 'sz', 'ls', 'za', 'mg', 'mu', 'sc', 'km', 'mv', 'in',
      'pk', 'bd', 'lk', 'np', 'bt', 'af', 'ir', 'iq', 'sy', 'lb',
      'jo', 'ps', 'kw', 'qa', 'bh', 'om', 'ye', 'cn', 'jp', 'kr',
      'kp', 'mn', 'tw', 'hk', 'mo', 'th', 'vn', 'la', 'kh', 'mm',
      'my', 'sg', 'bn', 'id', 'tl', 'ph', 'au', 'nz', 'pg', 'fj',
      'sb', 'vu', 'nc', 'pf', 'ws', 'ki', 'to', 'tv', 'nr', 'pw',
      'fm', 'mh', 'mx', 'gt', 'bz', 'sv', 'hn', 'ni', 'cr', 'pa',
      'cu', 'jm', 'ht', 'do', 'pr', 'tt', 'bb', 'gd', 'lc', 'vc',
      'ag', 'dm', 'kn', 'bs', 'co', 've', 'gy', 'sr', 'br', 'pe',
      'ec', 'bo', 'py', 'uy', 'ar', 'cl', 'fk'
    ];
  }

  // Get supported languages
  getSupportedLanguages() {
    return [
      'ar', 'de', 'en', 'es', 'fr', 'he', 'it', 'nl', 'no', 'pt',
      'ru', 'se', 'ud', 'zh'
    ];
  }

  // Get API plan limitations and features
  getPlanInfo() {
    return {
      free: {
        requests_per_month: 500,
        delay: '30 minutes',
        historical_news: false,
        https: false,
        features: ['live_news', 'news_sources', 'basic_filtering']
      },
      standard: {
        requests_per_month: 5000,
        delay: 'real-time',
        historical_news: true,
        https: true,
        features: ['live_news', 'historical_news', 'news_sources', 'advanced_filtering']
      },
      professional: {
        requests_per_month: 50000,
        delay: 'real-time',
        historical_news: true,
        https: true,
        features: ['live_news', 'historical_news', 'news_sources', 'advanced_filtering', 'priority_support']
      },
      business: {
        requests_per_month: 200000,
        delay: 'real-time',
        historical_news: true,
        https: true,
        features: ['live_news', 'historical_news', 'news_sources', 'advanced_filtering', 'priority_support', 'commercial_use']
      }
    };
  }
}

export default MediaStackAdapter;
