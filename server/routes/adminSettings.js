const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { simpleCache } = require('../services/simpleCache');
const adminSettingsService = require('../services/adminSettingsService');
const DirectusService = require('../services/directusService');
const router = express.Router();
const logger = require('../utils/logger');

// Path to store admin settings
const SETTINGS_FILE = path.join(__dirname, '../data/admin-settings.json');

// Default settings structure
const DEFAULT_SETTINGS = {
  aiProviders: {
    groq: {
      enabled: true,
      apiKey: process.env.GROQ_API_KEY || '',
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      maxTokens: 1000
    },
    openrouter: {
      enabled: true,
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: 'meta-llama/llama-3-8b-instruct:free',
      temperature: 0.3,
      maxTokens: 100000
    },
    perplexity: {
      enabled: true,
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      model: 'llama-3.1-sonar-small-128k-online',
      temperature: 0.3,
      maxTokens: 1000
    },
    openai: {
      enabled: false,
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1000
    },
    google: {
      enabled: false,
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      model: 'gemini-pro',
      temperature: 0.3,
      maxTokens: 1000
    },
    litellm: {
      enabled: false,
      apiKey: process.env.LITELLM_API_KEY || '',
      baseUrl: process.env.LITELLM_BASE_URL || '',
      model: 'openai/gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 1000
    }
  },
  prompts: {
    factCheckPrompt: `You are a professional fact-checker. Analyze the following claim and provide:

1. **Verdict**: TRUE, FALSE, PARTIALLY TRUE, or UNVERIFIED
2. **Confidence**: Rate your confidence from 0-100%
3. **Evidence**: List key evidence supporting your verdict
4. **Sources**: Cite reliable sources used in your analysis
5. **Context**: Provide important context or nuances

Claim to analyze: {claim}

Be objective, thorough, and cite credible sources.`,
    
    searchPrompt: `Search for factual information about: {query}

Provide comprehensive, accurate information from reliable sources. Focus on:
- Verified facts and data
- Multiple perspectives when relevant
- Source credibility and recency
- Clear, objective presentation

Query: {query}`,
    
    analysisRules: [
      'Prioritize peer-reviewed sources and established news organizations',
      'Cross-reference information across multiple reliable sources',
      'Consider the publication date and relevance of sources',
      'Distinguish between opinion and factual reporting',
      'Note any conflicts of interest or bias in sources',
      'Provide confidence levels for all claims'
    ]
  },
  aiUsage: {
    default: {
      provider: 'openrouter',
      model: '@preset/asha-news',
      temperature: 0.3,
      maxTokens: 800
    },
    clustering: {
      provider: 'openrouter',
      model: '@preset/asha-news',
      temperature: 0.3,
      maxTokens: 80000
    },
    summarization: {
      provider: 'openrouter',
      model: '@preset/asha-news',
      temperature: 0.4,
      maxTokens: 1200
    },
    factCheck: {
      provider: 'openrouter',
      model: '@preset/asha-news',
      temperature: 0.2,
      maxTokens: 1000
    }
  },
  factCheckSettings: {
    requireMultipleSources: true,
    minimumConfidenceThreshold: 70,
    enableImageFactCheck: true,
    enablePerplexityFallback: true,
    maxSearchResults: 10,
    cacheResults: true,
    cacheExpiryHours: 24
  },
  clusterSettings: {
    enabled: true,
    similarityThreshold: 0.75,
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
    // Algorithm
    clusteringAlgorithm: 'dbscan',
    dbscanEps: 1.05,
    dbscanMinSamples: 3,
    // Event-only and topics allowlist
    eventOnlyEnabled: true,
    allowedTopics: [
      'Palestine', 'Israel', 'Gaza', 'Middle East', 'Ukraine', 'Russia',
      'United States', 'US', 'War', 'Conflict'
    ],
    topicAliases: { 'USA': 'United States', 'IDF': 'Israel', 'U.S.': 'United States' },
    topicMatchStrategy: 'keywords',
    // Coherence guard
    coherenceGuardEnabled: true,
    coherenceGuardShadowMode: true,
    coherenceMinScore: 0.65,
    // Time coherence
    maxTimeSpanDays: 14,
    // Web search fallback (config only, logic optional)
    webSearch: {
      enabled: false,
      provider: 'perplexity',
      maxQueriesPerCluster: 2,
      maxTokensPerCluster: 500,
      cacheTtlHours: 24
    }
  }
};

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(SETTINGS_FILE);
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// GET /admin-settings/stats - High level system stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    let articlesCount = null;
    let clustersCount = null;
    let apiUsageCount = null;
    let queriesCount = null;
    let latestApiUsage = [];
    let latestAnalysis = [];
    let tokensTotal = 0;

    try {
      const ds = new DirectusService();
      // Counts via service
      articlesCount = await ds.getArticleCount({});
      clustersCount = await ds.getClusterCount({});

      // Query analytics tables via queryBridge (graceful if tables don't exist)
      const queryBridge = require('../db/queryBridge');

      // API usage logs (latest 10)
      try {
        const apiUsageResp = await queryBridge('/items/api_usage_logs?limit=10&sort=-date_created');
        latestApiUsage = apiUsageResp?.data || [];
      } catch (_) { latestApiUsage = []; }

      // Attempt to get total count for api_usage_logs
      try {
        const apiUsageCountResp = await queryBridge('/items/api_usage_logs?limit=0&meta=filter_count');
        apiUsageCount = apiUsageCountResp?.meta?.filter_count ?? null;
      } catch (_) { apiUsageCount = null; }

      // AI analysis logs (latest 10)
      try {
        const analysisResp = await queryBridge('/items/ai_analysis_logs?limit=10&sort=-date_created');
        latestAnalysis = analysisResp?.data || [];
      } catch (_) { latestAnalysis = []; }

      // Queries count (search_analytics)
      try {
        const queriesCountResp = await queryBridge('/items/search_analytics?limit=0&meta=filter_count');
        queriesCount = queriesCountResp?.meta?.filter_count ?? null;
      } catch (_) { queriesCount = null; }

      // Aggregate token usage across latestApiUsage
      tokensTotal = (latestApiUsage || []).reduce((sum, row) => {
        const t = row.total_tokens ?? row.totalTokens ?? row.usage_total_tokens ?? 0;
        return sum + (Number(t) || 0);
      }, 0);
    } catch (e) {
      // If Directus misconfigured, return partial info
      return res.json({
        success: false,
        error: e.message,
        articlesCount,
        clustersCount,
        apiUsageCount,
        queriesCount,
        tokensTotal,
        latestApiUsage,
        latestAnalysis
      });
    }

    return res.json({
      success: true,
      articlesCount,
      clustersCount,
      apiUsageCount,
      queriesCount,
      tokensTotal,
      latestApiUsage,
      latestAnalysis
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching stats');
    return res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// GET /admin-settings/models - List models for a provider
router.get('/models', async (req, res) => {
  try {
    const provider = (req.query.provider || '').toLowerCase();
    const apiKey = req.query.apiKey || undefined;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider is required' });
    }

    switch (provider) {
      case 'openrouter': {
        try {
          const headers = { 'Content-Type': 'application/json', 'X-Title': 'Asha News' };
          const key = apiKey || process.env.OPENROUTER_API_KEY || undefined;
          if (key) headers['Authorization'] = `Bearer ${key}`;
          const response = await fetch('https://openrouter.ai/api/v1/models', { headers });
          const json = await response.json().catch(() => ({}));
          if (!response.ok) {
            return res.status(response.status).json({ success: false, error: json?.error?.message || 'Failed to fetch models' });
          }
          const list = Array.isArray(json?.data) ? json.data.map(m => ({ id: m.id, name: m.name || m.id })) : [];
          return res.json({ success: true, provider: 'openrouter', models: list });
        } catch (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
      }
      default:
        return res.status(400).json({ success: false, error: 'Unsupported provider' });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error listing models');
    res.status(500).json({ success: false, error: 'Failed to list models' });
  }
});

// POST /admin-settings/clear-cache - Clear server-side caches (CMS, etc.)
router.post('/clear-cache', async (req, res) => {
  try {
    simpleCache.clear();
    res.json({ success: true, message: 'Server cache cleared' });
  } catch (error) {
    logger.error({ err: error }, 'Error clearing cache');
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
});

// GET /admin-settings/test-db - Verify database connectivity
router.get('/test-directus', async (req, res) => {
  try {
    const { testConnection } = require('../db/index');
    const dbOk = await testConnection();
    if (!dbOk) {
      return res.status(500).json({ success: false, error: 'Database connection failed' });
    }
    res.json({ success: true, database: 'connected' });
  } catch (error) {
    logger.error({ err: error }, 'Database connectivity test failed');
    res.status(500).json({ success: false, error: error.message });
  }
});


  // Load settings from file or return defaults
  async function loadSettings() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    // Merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      aiProviders: {
        ...DEFAULT_SETTINGS.aiProviders,
        ...settings.aiProviders
      },
      aiUsage: {
        ...DEFAULT_SETTINGS.aiUsage,
        ...settings.aiUsage
      },
      prompts: {
        ...DEFAULT_SETTINGS.prompts,
        ...settings.prompts
      },
      factCheckSettings: {
        ...DEFAULT_SETTINGS.factCheckSettings,
        ...settings.factCheckSettings
      },
      clusterSettings: {
        ...DEFAULT_SETTINGS.clusterSettings,
        ...settings.clusterSettings
      }
    };
  } catch (error) {
    logger.info('Loading default settings, file not found or invalid');
    return DEFAULT_SETTINGS;
  }
}

// Save settings to file
async function saveSettings(settings) {
  try {
    await ensureDataDirectory();
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Error saving settings');
    return false;
  }
}

  // GET /admin-settings - Load current settings
  router.get('/', async (req, res) => {
    try {
      const settings = await loadSettings();
      
      // Don't expose API keys in the response for security
      const safeSettings = {
        ...settings,
        aiProviders: Object.keys(settings.aiProviders).reduce((acc, provider) => {
          acc[provider] = {
            ...settings.aiProviders[provider],
            apiKey: settings.aiProviders[provider].apiKey ? '***HIDDEN***' : ''
          };
          return acc;
        }, {})
      };
      // Mirror providers to top-level for frontend compatibility
      Object.keys(safeSettings.aiProviders || {}).forEach((provider) => {
        safeSettings[provider] = { ...safeSettings.aiProviders[provider] };
      });
      
      res.json({
        success: true,
        settings: safeSettings
      });
    } catch (error) {
      logger.error({ err: error }, 'Error loading admin settings');
      res.status(500).json({
        success: false,
        error: 'Failed to load admin settings'
      });
    }
  });

  // POST /admin-settings - Save settings
  router.post('/', async (req, res) => {
    try {
      const { settings } = req.body;
      
      if (!settings) {
        return res.status(400).json({
          success: false,
          error: 'Settings data is required'
        });
      }
      
      // Load current settings to preserve API keys if they're marked as hidden
      const currentSettings = await loadSettings();
      const updatedSettings = { ...settings };
      
      // Ensure aiProviders exists
      updatedSettings.aiProviders = {
        ...currentSettings.aiProviders,
        ...(updatedSettings.aiProviders || {})
      };

      // Merge legacy top-level provider blocks into aiProviders
      const PROVIDERS = ['groq', 'openrouter', 'perplexity', 'openai', 'google', 'litellm'];
      PROVIDERS.forEach((provider) => {
        if (updatedSettings[provider]) {
          updatedSettings.aiProviders[provider] = {
            ...updatedSettings.aiProviders[provider],
            ...updatedSettings[provider]
          };
        }
      });

      // Preserve existing API keys if they're marked as hidden for aiProviders
      Object.keys(updatedSettings.aiProviders || {}).forEach(provider => {
        if (updatedSettings.aiProviders[provider]?.apiKey === '***HIDDEN***') {
          updatedSettings.aiProviders[provider].apiKey = currentSettings.aiProviders?.[provider]?.apiKey || '';
        }
      });
      
      const saved = await saveSettings(updatedSettings);
      
      if (saved) {
        try { adminSettingsService.invalidateCache(); } catch (_) {}
        res.json({
          success: true,
          message: 'Settings saved successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to save settings'
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Error saving admin settings');
      res.status(500).json({
        success: false,
        error: 'Failed to save settings'
      });
    }
});

// POST /admin-settings/test-api - Test API connection
router.post('/test-api', async (req, res) => {
  try {
    const { provider, apiKey, model, baseUrl } = req.body || {};
    
    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider is required' });
    }
    if (provider !== 'litellm' && !apiKey) {
      return res.status(400).json({ success: false, error: 'API key is required' });
    }
    
    let testResult = { success: false, error: 'Unknown provider' };
    
    switch (provider) {
    case 'groq':
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model || 'llama-3.1-8b-instant',
              messages: [{ role: 'user', content: 'Test connection' }],
              max_tokens: 10
            })
          });
          
          if (response.ok) {
            testResult = { success: true, message: 'Groq API connection successful' };
          } else {
            const errorData = await response.json();
            testResult = { success: false, error: errorData.error?.message || 'API test failed' };
          }
        } catch (error) {
          testResult = { success: false, error: error.message };
        }
        break;
      case 'openrouter':
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'X-Title': 'Asha News'
            },
            body: JSON.stringify({
              model: model || 'meta-llama/llama-3-8b-instruct:free',
              messages: [{ role: 'user', content: 'Test connection' }],
              max_tokens: 10,
              temperature: 0
            })
          });
          if (response.ok) {
            testResult = { success: true, message: 'OpenRouter API connection successful' };
          } else {
            const errorData = await response.json().catch(() => ({}));
            testResult = { success: false, error: errorData?.error?.message || `HTTP ${response.status}` };
          }
        } catch (error) {
          testResult = { success: false, error: error.message };
        }
        break;
      case 'perplexity':
        try {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model || 'llama-3.1-sonar-small-128k-online',
              messages: [{ role: 'user', content: 'Test connection' }],
              max_tokens: 10
            })
          });
          
          if (response.ok) {
            testResult = { success: true, message: 'Perplexity API connection successful' };
          } else {
            const errorData = await response.json();
            testResult = { success: false, error: errorData.error?.message || 'API test failed' };
          }
        } catch (error) {
          testResult = { success: false, error: error.message };
        }
        break;
        
      case 'openai':
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model || 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'Test' }],
              max_tokens: 5
            })
          });
          
          if (response.ok) {
            testResult = { success: true, message: 'OpenAI API connection successful' };
          } else {
            const errorData = await response.json();
            testResult = { success: false, error: errorData.error?.message || 'API test failed' };
          }
        } catch (error) {
          testResult = { success: false, error: error.message };
        }
        break;
      case 'litellm':
        try {
          const base = (baseUrl || req.body?.baseUrl || '').replace(/\/$/, '');
          if (!base) {
            testResult = { success: false, error: 'Base URL is required for LiteLLM' };
            break;
          }
          const url = `${base}/chat/completions`;
          const headers = { 'Content-Type': 'application/json' };
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: model || 'openai/gpt-3.5-turbo',
              messages: [{ role: 'user', content: 'Test connection' }],
              max_tokens: 10,
              temperature: 0
            })
          });
          if (response.ok) {
            testResult = { success: true, message: 'LiteLLM API connection successful' };
          } else {
            const errorData = await response.json().catch(() => ({}));
            testResult = { success: false, error: errorData?.error?.message || `HTTP ${response.status}` };
          }
        } catch (error) {
          testResult = { success: false, error: error.message };
        }
        break;
      default:
        testResult = { success: false, error: 'Unsupported provider' };
    }
    
    res.json(testResult);
  } catch (error) {
    logger.error({ err: error }, 'Error testing API');
    res.status(500).json({
      success: false,
      error: 'Failed to test API connection'
    });
  }
});

// GET /admin-settings/reset - Reset to default settings
router.post('/reset', async (req, res) => {
  try {
    const saved = await saveSettings(DEFAULT_SETTINGS);
    
    if (saved) {
      try { adminSettingsService.invalidateCache(); } catch (_) {}
      res.json({
        success: true,
        message: 'Settings reset to defaults',
        settings: DEFAULT_SETTINGS
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to reset settings'
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'Error resetting admin settings');
    res.status(500).json({
      success: false,
      error: 'Failed to reset settings'
    });
  }
});

module.exports = router;
