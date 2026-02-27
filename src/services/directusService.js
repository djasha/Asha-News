// CMS Service for Asha.News
// Handles fetching content from backend CMS API
import { CMS_BASE } from '../config/api';
import logger from '../utils/logger';

class DirectusService {
  constructor() {
    this.baseUrl = CMS_BASE;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async fetchWithCache(endpoint, options = {}) {
    const cacheKey = `${endpoint}?${new URLSearchParams(options).toString()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}${endpoint}?${new URLSearchParams(options).toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      logger.error(`DirectusService fetch error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Palestine Articles - Load from CMS API
  async getPalestineArticles(options = {}) {
    try {
      let endpoint = '/articles?category=palestine';
      if (options.featured !== undefined) endpoint += `&featured=${options.featured}`;
      if (options.limit) endpoint += `&limit=${options.limit}`;

      const data = await this.fetchWithCache(endpoint);
      const articles = data?.data || [];

      return {
        articles,
        total: articles.length,
      };
    } catch (error) {
      logger.error('Error loading Palestine articles:', error);
      return { articles: [], total: 0 };
    }
  }

  // Articles
  async getArticles(options = {}) {
    try {
      // If requesting Palestine articles, load from local file
      if (options.category === 'Palestine' || options.topic === 'Palestine') {
        return await this.getPalestineArticles(options);
      }

      const {
        limit = 50,
        offset = 0,
        category,
        featured,
        breaking,
        article_type,
        sortBy = 'date'
      } = options;

      const params = { limit, offset };
      if (category) params.category = category;
      if (featured) params.featured = 'true';
      if (breaking) params.breaking = 'true';
      if (article_type) params.article_type = article_type;

      const result = await this.fetchWithCache('/articles', params);
      let articles = result.articles || result.data || [];

      // Normalize article data to match expected frontend format with enhanced fields
      articles = articles.map(article => ({
        id: `cms-${article.id}`,
        title: article.title || 'Untitled',
        summary: article.summary || '',
        content: article.content || '',
        url: article.source_url || '',
        slug: article.slug || '',
        publication_date: article.published_at || article.date_created,
        source_id: article.source_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
        source_name: article.source_name || 'Unknown Source',
        political_bias: this.mapBiasScore(article.bias_score),
        topic: article.category || 'General',
        section: article.featured ? 'featured' : 'general',
        author: article.author_name || 'Asha News',
        author_bio: article.author_bio || '',
        author_avatar: article.author_avatar || null,
        author_social: article.author_social || {},
        image_url: article.image_url || null,
        factual_quality: article.source_credibility || 0.8,
        confidence_score: article.source_credibility || 0.8,
        ai_analysis: article.bias_analysis || null,
        bias_score: article.bias_score || 0.5,
        fact_check_status: article.fact_check_status || 'unverified',
        editorial_status: article.editorial_status || 'published',
        view_count: article.view_count || 0,
        share_count: article.share_count || 0,
        word_count: article.word_count || 0,
        reading_time: article.reading_time || 1,
        difficulty_score: article.difficulty_score || 0.5,
        breaking_news: article.breaking_news || false,
        featured: article.featured || false,
        status: article.status || 'published',
        seo_title: article.seo_title || article.title,
        seo_description: article.seo_description || article.summary,
        seo_keywords: article.seo_keywords || [],
        geographic_tags: article.geographic_tags || [],
        social_shares: article.social_shares || {}
      }));

      // Apply client-side sorting if needed
      if (sortBy === 'date') {
        articles.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));
      } else if (sortBy === 'title') {
        articles.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'source') {
        articles.sort((a, b) => a.source_name.localeCompare(b.source_name));
      }

      return {
        articles,
        total: articles.length,
        fetched_at: new Date().toISOString(),
        processed_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to fetch articles from Directus:', error);
      // Return empty structure on error
      return {
        articles: [],
        total: 0,
        fetched_at: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Map numeric bias score to text categories
  mapBiasScore(score) {
    if (typeof score !== 'number') return 'center';
    if (score < 0.3) return 'left';
    if (score > 0.7) return 'right';
    return 'center';
  }

  // Breaking News
  async getBreakingNews() {
    try {
      const result = await this.fetchWithCache('/breaking-news');
      return result.breaking_news || result.data || [];
    } catch (error) {
      logger.error('Failed to fetch breaking news:', error);
      return [];
    }
  }

  // Daily Briefs
  async getDailyBriefs(options = {}) {
    try {
      const result = await this.fetchWithCache('/daily-briefs', options);
      return result.daily_briefs || result.data || [];
    } catch (error) {
      logger.error('Failed to fetch daily briefs:', error);
      return [];
    }
  }

  // Trending Topics
  async getTrendingTopics() {
    try {
      const result = await this.fetchWithCache('/trending-topics');
      return result.trending_topics || result.data || [];
    } catch (error) {
      logger.error('Failed to fetch trending topics:', error);
      return [];
    }
  }

  // Topic Categories
  async getTopics() {
    try {
      const result = await this.fetchWithCache('/topics');
      return result.data || [];
    } catch (error) {
      logger.error('Failed to fetch topics:', error);
      return [];
    }
  }

  // News Sources
  async getSources() {
    try {
      const result = await this.fetchWithCache('/news-sources');
      const sources = result.news_sources || result.data || [];
      
      // Transform to match expected format
      return sources.map(source => ({
        id: source.domain || source.name?.toLowerCase().replace(/\s+/g, '_'),
        name: source.name,
        bias: source.bias_rating || 'center',
        credibility_score: source.credibility_score || 0.8,
        article_count: 0 // This would need to be calculated separately
      }));
    } catch (error) {
      logger.error('Failed to fetch sources:', error);
      return [];
    }
  }

  // Site Configuration
  async getSiteConfig() {
    try {
      const result = await this.fetchWithCache('/site-config');
      return result.data || {};
    } catch (error) {
      logger.error('Failed to fetch site config:', error);
      return {};
    }
  }

  // Navigation
  async getNavigation(location = 'header') {
    try {
      const result = await this.fetchWithCache('/navigation', { location });
      return result.data || [];
    } catch (error) {
      logger.error('Failed to fetch navigation:', error);
      return [];
    }
  }

  // Homepage Sections
  async getHomepageSections() {
    try {
      const result = await this.fetchWithCache('/homepage-sections');
      return result.data || [];
    } catch (error) {
      logger.error('Failed to fetch homepage sections:', error);
      return [];
    }
  }

  // Feature Flags
  async getFeatureFlags(asMap = false) {
    try {
      const result = await this.fetchWithCache('/feature-flags', { map: asMap });
      return result.data || (asMap ? {} : []);
    } catch (error) {
      logger.error('Failed to fetch feature flags:', error);
      return asMap ? {} : [];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache status
  getCacheStatus() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const directusService = new DirectusService();

export default directusService;
