/**
 * Tests for AI provider selection and admin toggles.
 */

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"assessment":"supported","confidence_score":0.9}' } }]
        })
      }
    }
  }));
});

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '{"assessment":"openai","confidence_score":0.5}' } }]
        })
      }
    }
  }));
});

// Dynamic admin settings mock
let mockAdminConfig = {
  defaultProvider: 'groq',
  providers: {
    groq: { enabled: true, apiKey: 'gk' },
    openai: { enabled: false, apiKey: 'ok' },
    google: { enabled: false, apiKey: '' },
    perplexity: { enabled: false, apiKey: '' },
  }
};

jest.mock('../services/adminSettingsService', () => ({
  getDefaultProvider: jest.fn(async () => mockAdminConfig.defaultProvider),
  getProviderConfig: jest.fn(async (p) => {
    return mockAdminConfig.providers[p] || { enabled: false, apiKey: '' };
  })
}));

// Clear module cache between tests to re-read config
const resetModules = async () => {
  jest.resetModules();
};

describe('AI Provider selection respects Admin default and enabled toggles', () => {
  test('uses Groq when default is groq and groq enabled', async () => {
    await resetModules();
    const aiProviderService = require('../services/aiProviderService');
    const res = await aiProviderService.analyzeClaim('Test claim');
    expect(res).toBeTruthy();
    expect(res.provider).toBe('groq');
  });

  test('falls back to OpenAI when Groq disabled and OpenAI enabled', async () => {
    mockAdminConfig = {
      defaultProvider: 'groq',
      providers: {
        groq: { enabled: false, apiKey: 'gk' },
        openai: { enabled: true, apiKey: 'ok' },
        google: { enabled: false, apiKey: '' },
        perplexity: { enabled: false, apiKey: '' },
      }
    };

    await resetModules();
    const aiProviderService = require('../services/aiProviderService');
    const res = await aiProviderService.analyzeClaim('Test claim');
    expect(res).toBeTruthy();
    expect(res.provider).toBe('openai');
  });

  test('returns mock when all providers disabled', async () => {
    mockAdminConfig = {
      defaultProvider: 'groq',
      providers: {
        groq: { enabled: false, apiKey: '' },
        openai: { enabled: false, apiKey: '' },
        google: { enabled: false, apiKey: '' },
        perplexity: { enabled: false, apiKey: '' },
      }
    };

    await resetModules();
    const aiProviderService = require('../services/aiProviderService');
    const res = await aiProviderService.analyzeClaim('Test claim');
    expect(res).toBeTruthy();
    expect(res.provider).toBe('mock');
  });
});
