// Ensure clean env per test
const ORIGINAL_ENV = { ...process.env };

// Mock admin settings to avoid filesystem access and ensure Groq appears enabled when needed
jest.mock('../services/adminSettingsService', () => ({
  getProviderConfig: jest.fn(async (p) => {
    // default values; individual tests will override via mockImplementation
    if (p === 'groq') return { enabled: true, apiKey: 'gk' };
    if (p === 'openrouter') return { enabled: true, apiKey: 'ok', model: '@preset/asha-news', temperature: 0.3, maxTokens: 1200 };
    return { enabled: false, apiKey: '' };
  }),
  getUsageConfig: jest.fn(async (usage) => ({
    provider: 'openrouter',
    model: '@preset/asha-news',
    temperature: 0.3,
    maxTokens: 1500
  })),
  getClusterSettings: jest.fn(async () => ({
    enabled: true,
    similarityThreshold: 0.75,
    maxClusterSize: 20,
    minArticlesToPublish: 2
  })),
}));

// Default Groq SDK mock; specific tests can override return payloads via mockImplementationOnce
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Groq Headline Fallback' } }]
        })
      }
    }
  }));
});

// Helper to fresh-require the service after mocks
const loadService = () => {
  jest.resetModules();
  return require('../services/storyClusteringService');
};

beforeEach(() => {
  // Reset env and set AI enabled
  for (const k of Object.keys(process.env)) delete process.env[k];
  Object.assign(process.env, ORIGINAL_ENV);
  process.env.ENABLE_AI_ANALYSIS = 'true';
  // Reset fetch
  global.fetch = undefined;
});

afterAll(() => {
  // Restore env
  for (const k of Object.keys(process.env)) delete process.env[k];
  Object.assign(process.env, ORIGINAL_ENV);
});

const sampleArticles = [
  { id: 'a1', title: 'Title One', summary: 'Sum 1', content: 'Text 1', source_name: 'Src1' },
  { id: 'a2', title: 'Title Two', summary: 'Sum 2', content: 'Text 2', source_name: 'Src2' },
];

describe('StoryClusteringService OpenRouter preference', () => {
  test('generateClusterTitle prefers OpenRouter when OPENROUTER_API_KEY is set', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const admin = require('../services/adminSettingsService');
    admin.getProviderConfig.mockImplementation(async (p) => {
      if (p === 'openrouter') return { enabled: true, apiKey: 'ok', model: '@preset/asha-news' };
      if (p === 'groq') return { enabled: false, apiKey: '' };
      return { enabled: false, apiKey: '' };
    });
    const StoryClusteringService = loadService();
    const svc = new StoryClusteringService();

    // Mock OpenRouter fetch success
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'OpenRouter Title' } }] }),
    });

    const title = await svc.generateClusterTitle(sampleArticles);
    expect(title).toBe('OpenRouter Title');
  });

  test('generateClusterTitle falls back to Groq when OpenRouter fails', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const admin = require('../services/adminSettingsService');
    admin.getProviderConfig.mockImplementation(async (p) => {
      if (p === 'openrouter') return { enabled: true, apiKey: 'ok', model: '@preset/asha-news' };
      if (p === 'groq') return { enabled: true, apiKey: 'gk' };
      return { enabled: false, apiKey: '' };
    });
    const StoryClusteringService = loadService();
    const svc = new StoryClusteringService();

    // Mock OpenRouter fetch failure
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });

    const title = await svc.generateClusterTitle(sampleArticles);
    // Groq fallback value from mock
    expect(title).toBe('Groq Headline Fallback');
  });

  test('generateClusterAnalysis uses OpenRouter and parses fenced JSON', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const admin = require('../services/adminSettingsService');
    admin.getProviderConfig.mockImplementation(async (p) => {
      if (p === 'openrouter') return { enabled: true, apiKey: 'ok', model: '@preset/asha-news' };
      if (p === 'groq') return { enabled: false, apiKey: '' };
      return { enabled: false, apiKey: '' };
    });
    const StoryClusteringService = loadService();
    const svc = new StoryClusteringService();

    // Mock OpenRouter response with fenced JSON
    const fenced = '```json\n{"summary":"OK","key_facts":["a"],"fact_check_notes":"","suggested_questions":[],"suggested_answers":[]}\n```';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: fenced } }] }),
    });

    const res = await svc.generateClusterAnalysis(sampleArticles, 'ClusterTitle');
    expect(res).toBeTruthy();
    expect(res.summary).toBe('OK');
    expect(Array.isArray(res.key_facts)).toBe(true);
    expect(res.key_facts.length).toBe(1);
  });
});
