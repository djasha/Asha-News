const queryBridge = require('../db/queryBridge');
const logger = require('../utils/logger');

class ApiConfigService {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.configCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async directusFetch(endpoint, options = {}) {
    return queryBridge(endpoint, options);
  }

  async getApiConfig(serviceName, environment = null) {
    const env = environment || this.environment;
    const cacheKey = `${serviceName}_${env}`;
    
    // Check cache first
    const cached = this.configCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const response = await this.directusFetch(
        `/items/api_configurations?filter[service_name][_eq]=${encodeURIComponent(serviceName)}&filter[environment][_eq]=${env}&filter[status][_eq]=active`
      );

      if (response.data.length === 0) {
        throw new Error(`No active configuration found for ${serviceName} in ${env} environment`);
      }

      const config = response.data[0];
      
      // Cache the result
      this.configCache.set(cacheKey, {
        data: config,
        timestamp: Date.now()
      });

      return config;
    } catch (error) {
      logger.error(`Error fetching API config for ${serviceName}:`, error);
      throw error;
    }
  }

  async getAllApiConfigs(environment = null) {
    const env = environment || this.environment;
    
    try {
      const response = await this.directusFetch(
        `/items/api_configurations?filter[environment][_eq]=${env}&filter[status][_eq]=active`
      );

      return response.data;
    } catch (error) {
      logger.error('Error fetching all API configs:', error);
      throw error;
    }
  }

  async getDefaultAIProvider(environment = null) {
    const env = environment || this.environment;
    const configs = await this.getAllApiConfigs(env);
    // Look for configuration.default === true
    const defaultCfg = configs.find(c => c.configuration && (c.configuration.default === true));
    if (defaultCfg) {
      return defaultCfg.service_name;
    }
    // Otherwise prefer Groq if present
    const hasGroq = configs.find(c => c.service_name?.toLowerCase() === 'groq');
    if (hasGroq) return 'Groq';
    const hasOpenAI = configs.find(c => c.service_name?.toLowerCase() === 'openai');
    if (hasOpenAI) return 'OpenAI';
    const hasGoogle = configs.find(c => c.service_name?.toLowerCase().includes('gemini'));
    if (hasGoogle) return 'Google Gemini';
    const hasPerplexity = configs.find(c => c.service_name?.toLowerCase() === 'perplexity');
    if (hasPerplexity) return 'Perplexity';
    return null;
  }

  async updateApiConfig(serviceName, updates, environment = null) {
    const env = environment || this.environment;
    
    try {
      // First get the existing config
      const existing = await this.getApiConfig(serviceName, env);
      
      // Update the config
      const response = await this.directusFetch(`/items/api_configurations/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });

      // Clear cache
      const cacheKey = `${serviceName}_${env}`;
      this.configCache.delete(cacheKey);

      return response.data;
    } catch (error) {
      logger.error(`Error updating API config for ${serviceName}:`, error);
      throw error;
    }
  }

  async createApiConfig(configData) {
    try {
      const response = await this.directusFetch('/items/api_configurations', {
        method: 'POST',
        body: JSON.stringify({
          environment: this.environment,
          ...configData
        })
      });

      return response.data;
    } catch (error) {
      logger.error('Error creating API config:', error);
      throw error;
    }
  }

  // Helper methods for specific API configurations
  async getGoogleOAuthConfig() {
    const config = await this.getApiConfig('Google OAuth');
    return {
      clientId: config.client_id,
      clientSecret: config.client_secret,
      redirectUri: config.configuration?.redirect_uri || 'http://localhost:3001/api/auth/google/callback',
      scope: config.configuration?.scope || ['profile', 'email']
    };
  }

  async getOpenAIConfig() {
    const config = await this.getApiConfig('OpenAI');
    return {
      apiKey: config.api_key,
      baseUrl: config.base_url,
      model: config.configuration?.model || 'gpt-4',
      maxTokens: config.configuration?.max_tokens || 2000,
      temperature: config.configuration?.temperature || 0.7
    };
  }

  async getGroqConfig() {
    const config = await this.getApiConfig('Groq');
    return {
      apiKey: config.api_key,
      baseUrl: config.base_url,
      model: config.configuration?.model || 'llama-3.1-8b-instant',
      maxTokens: config.configuration?.max_tokens || 2000,
      temperature: config.configuration?.temperature || 0.3,
      isDefault: !!(config.configuration?.default)
    };
  }

  async getNewsApiConfig() {
    const config = await this.getApiConfig('News API');
    return {
      apiKey: config.api_key,
      baseUrl: config.base_url,
      country: config.configuration?.country || 'us',
      pageSize: config.configuration?.pageSize || 100,
      sortBy: config.configuration?.sortBy || 'publishedAt'
    };
  }

  async getMediaStackConfig() {
    const config = await this.getApiConfig('MediaStack');
    return {
      apiKey: config.api_key,
      baseUrl: config.base_url,
      countries: config.configuration?.countries || 'us,gb,ca',
      limit: config.configuration?.limit || 100,
      sort: config.configuration?.sort || 'published_desc'
    };
  }

  async getFactCheckConfig() {
    const config = await this.getApiConfig('Fact Check API');
    return {
      apiKey: config.api_key,
      baseUrl: config.base_url,
      languageCode: config.configuration?.languageCode || 'en-US',
      maxAgeDays: config.configuration?.maxAgeDays || 7
    };
  }

  // Clear cache method
  clearCache() {
    this.configCache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.configCache.size,
      keys: Array.from(this.configCache.keys())
    };
  }
}

module.exports = ApiConfigService;
