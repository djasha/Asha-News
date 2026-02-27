const fs = require('fs');
const path = require('path');

const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const DEFAULT_OPENROUTER_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

const DEFAULT_AI_PROVIDERS = {
  groq: {
    enabled: true,
    apiKey: process.env.GROQ_API_KEY || '',
    model: DEFAULT_GROQ_MODEL,
    temperature: 0.3,
    maxTokens: 1000
  },
  openrouter: {
    enabled: true,
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    temperature: 0.3,
    maxTokens: 8000
  },
  perplexity: {
    enabled: !!process.env.PERPLEXITY_API_KEY,
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    model: 'llama-3.1-sonar-small-128k-online',
    temperature: 0.3,
    maxTokens: 1000
  },
  openai: {
    enabled: !!process.env.OPENAI_API_KEY,
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1000
  },
  google: {
    enabled: !!process.env.GOOGLE_AI_API_KEY,
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
    model: 'gemini-pro',
    temperature: 0.3,
    maxTokens: 1000
  },
  litellm: {
    enabled: !!process.env.LITELLM_BASE_URL,
    apiKey: process.env.LITELLM_API_KEY || '',
    baseUrl: process.env.LITELLM_BASE_URL || '',
    model: 'openai/gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 1000
  }
};

const DEFAULT_CLUSTER_SETTINGS = {
  enabled: true,
  similarityThreshold: 0.88, // Raised for better coherence
  maxClusterSize: 20,
  minArticlesToPublish: 2,
  minUniqueSources: 2,
  saveToDirectus: true,
  keepIndividualArticles: true,
  showBiasCharts: true,
  showPerspectives: true,
  showQA: true,
  showKeyFacts: true,
  sourcesPerCluster: 6,
  summaryMaxChars: 500,
  enableContentHashCache: true,
  // DBSCAN algorithm settings
  clusteringAlgorithm: 'dbscan', // 'cosine' or 'dbscan'
  dbscanEps: 1.05, // Distance threshold for DBSCAN
  dbscanMinSamples: 3, // Minimum points to form a cluster
  // Event and topic filtering
  eventOnlyEnabled: true,
  allowedTopics: [
    'Palestine', 'Israel', 'Gaza', 'Middle East', 'Ukraine', 'Russia',
    'United States', 'US', 'War', 'Conflict'
  ],
  topicAliases: {
    'USA': 'United States',
    'IDF': 'Israel',
    'U.S.': 'United States'
  },
  topicMatchStrategy: 'keywords', // 'keywords' | 'entities' | 'hybrid'
  // Coherence guard
  coherenceGuardEnabled: true,
  coherenceGuardShadowMode: false, // ACTIVE MODE - remove unrelated articles
  coherenceMinScore: 0.70, // 0..1 centroid similarity threshold (raised from 0.65)
  // Time coherence
  maxTimeSpanDays: 14,
  // Optional web search fallback
  webSearch: {
    enabled: false,
    provider: 'perplexity',
    maxQueriesPerCluster: 2,
    maxTokensPerCluster: 500,
    cacheTtlHours: 24
  }
};

const DEFAULT_ARTICLE_CARD_SETTINGS = {
  // Display options
  showBiasIndicator: true,
  showReadingTime: true,
  showSaveButton: true,
  showSourceLogo: true,
  showPublishedDate: true,
  showCategoryBadge: true,
  showBreakingBadge: true,
  
  // Layout options
  defaultSize: 'standard', // 'compact' | 'standard' | 'large'
  imageAspectRatio: '16:9',
  showImages: true,
  
  // Pagination
  articlesPerPage: 20,
  articlesPerPageMobile: 10,
  
  // Interaction
  enableBookmark: true,
  enableShare: false, // Share moved to article detail only
  enableFollow: false, // Follow moved to article detail only
  
  // Content truncation
  titleMaxLines: 2,
  summaryMaxLines: 2,
  summaryMaxChars: 200,
  
  // Performance
  lazyLoadImages: true,
  preloadImages: false
};

const DEFAULT_AI_USAGE = {
  default: {
    provider: 'openrouter',
    model: DEFAULT_OPENROUTER_MODEL,
    temperature: 0.3,
    maxTokens: 800
  },
  clustering: {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    temperature: 0.3,
    maxTokens: 2000
  },
  summarization: {
    provider: 'openrouter',
    model: DEFAULT_OPENROUTER_MODEL,
    temperature: 0.4,
    maxTokens: 1200
  },
  factCheck: {
    provider: 'openrouter',
    model: DEFAULT_OPENROUTER_MODEL,
    temperature: 0.2,
    maxTokens: 1000
  }
};

function cloneProviders(overrides = {}) {
  const merged = {};
  Object.keys(DEFAULT_AI_PROVIDERS).forEach((provider) => {
    merged[provider] = {
      ...DEFAULT_AI_PROVIDERS[provider],
      ...(overrides[provider] || {})
    };
  });
  return merged;
}

function cloneUsage(overrides = {}) {
  const merged = {};
  Object.keys(DEFAULT_AI_USAGE).forEach((usageKey) => {
    merged[usageKey] = {
      ...DEFAULT_AI_USAGE[usageKey],
      ...(overrides[usageKey] || {})
    };
  });
  // Preserve any additional usage keys supplied
  Object.keys(overrides).forEach((usageKey) => {
    if (!merged[usageKey]) {
      merged[usageKey] = { ...DEFAULT_AI_USAGE.default, ...overrides[usageKey] };
    }
  });
  return merged;
}

class AdminSettingsService {
  constructor() {
    this.SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');
    this.cache = null;
    this.cacheTime = 0;
    this.cacheTtlMs = 60 * 1000; // 60s cache
  }

  async ensureDataDirectory() {
    const dir = path.dirname(this.SETTINGS_FILE);
    try {
      await fs.promises.access(dir);
    } catch (err) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }

  normalizeSettings(settings = {}) {
    const aiProviders = cloneProviders(settings.aiProviders || {});

    // Support legacy top-level provider blocks (groq, openrouter, etc.)
    Object.keys(DEFAULT_AI_PROVIDERS).forEach((provider) => {
      if (settings[provider]) {
        aiProviders[provider] = {
          ...aiProviders[provider],
          ...settings[provider]
        };
      }
    });

    const aiUsage = cloneUsage(settings.aiUsage || {});
    const clusterSettings = {
      ...DEFAULT_CLUSTER_SETTINGS,
      ...(settings.clusterSettings || {})
    };
    const articleCardSettings = {
      ...DEFAULT_ARTICLE_CARD_SETTINGS,
      ...(settings.articleCardSettings || {})
    };

    const normalized = {
      ...settings,
      aiProviders,
      aiUsage,
      clusterSettings,
      articleCardSettings,
      factCheck: {
        defaultProvider: settings.factCheck?.defaultProvider || aiUsage.factCheck?.provider || 'openrouter',
        ...settings.factCheck
      }
    };

    // Keep legacy top-level accessors in sync for compatibility
    Object.keys(aiProviders).forEach((provider) => {
      normalized[provider] = { ...aiProviders[provider] };
    });

    return normalized;
  }

  async getSettings() {
    const now = Date.now();
    if (this.cache && (now - this.cacheTime) < this.cacheTtlMs) {
      return this.cache;
    }

    try {
      await this.ensureDataDirectory();
      const data = await fs.promises.readFile(this.SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const normalized = this.normalizeSettings(parsed);
      this.cache = normalized;
      this.cacheTime = now;
      return normalized;
    } catch (err) {
      const fallback = this.normalizeSettings({});
      this.cache = fallback;
      this.cacheTime = now;
      return fallback;
    }
  }

  invalidateCache() {
    this.cache = null;
    this.cacheTime = 0;
  }

  async getDefaultProvider() {
    const settings = await this.getSettings();
    return settings.aiUsage?.default?.provider
      || settings.factCheck?.defaultProvider
      || 'openrouter';
  }

  async getProviderConfig(providerId) {
    const settings = await this.getSettings();
    if (settings.aiProviders?.[providerId]) {
      return settings.aiProviders[providerId];
    }
    return settings[providerId] || null;
  }

  async getUsageConfig(usage = 'default') {
    const settings = await this.getSettings();
    const usageKey = usage || 'default';
    return settings.aiUsage?.[usageKey]
      || settings.aiUsage?.default
      || { provider: 'openrouter', model: DEFAULT_OPENROUTER_MODEL };
  }

  async getClusterSettings() {
    const settings = await this.getSettings();
    return settings.clusterSettings || { ...DEFAULT_CLUSTER_SETTINGS };
  }

  async getArticleCardSettings() {
    const settings = await this.getSettings();
    return settings.articleCardSettings || { ...DEFAULT_ARTICLE_CARD_SETTINGS };
  }

  maskSettings(settings = {}) {
    const normalized = this.normalizeSettings(settings);
    const masked = JSON.parse(JSON.stringify(normalized));

    if (masked.aiProviders) {
      Object.entries(masked.aiProviders).forEach(([provider, cfg]) => {
        const hasKey = !!cfg.apiKey;
        masked.aiProviders[provider] = {
          ...cfg,
          apiKey: hasKey ? '***HIDDEN***' : ''
        };
        masked[provider] = {
          ...masked.aiProviders[provider]
        };
      });
    }

    return masked;
  }

  async prepareSettingsForSave(settings = {}) {
    const current = await this.getSettings();
    const merged = {
      ...settings,
      aiProviders: {
        ...(settings.aiProviders || {})
      }
    };

    const providers = merged.aiProviders;
    Object.keys(providers).forEach((provider) => {
      if (providers[provider]?.apiKey === '***HIDDEN***') {
        providers[provider].apiKey = current.aiProviders?.[provider]?.apiKey || '';
      }
    });

    // Legacy support: top-level provider blocks may still exist
    Object.keys(DEFAULT_AI_PROVIDERS).forEach((provider) => {
      if (merged[provider]?.apiKey === '***HIDDEN***') {
        merged[provider].apiKey = current.aiProviders?.[provider]?.apiKey || '';
      }
    });

    return this.normalizeSettings(merged);
  }

  async saveSettings(settings = {}) {
    const normalized = await this.prepareSettingsForSave(settings);
    await this.ensureDataDirectory();
    await fs.promises.writeFile(this.SETTINGS_FILE, JSON.stringify(normalized, null, 2));
    this.invalidateCache();
    return normalized;
  }
}

module.exports = new AdminSettingsService();
