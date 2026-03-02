/**
 * AI Provider Service
 * Manages multiple AI providers (OpenAI and Google AI) for fact-checking analysis
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const adminSettingsService = require('./adminSettingsService');

class AIProviderService {
  constructor() {
    // Initialize OpenAI client if API key is available
    this.openai = null;
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Initialize Google AI client if API key is available
    this.googleAI = null;
    if (process.env.GOOGLE_AI_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }

    // Initialize Perplexity AI client if API key is available
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;

    // Initialize Groq client if API key is available (preferred for cost)
    this.groq = null;
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    this.availableProviders = this.getAvailableProviders();
  }

  /**
   * Get list of available AI providers based on configured API keys
   */
  getAvailableProviders() {
    const providers = [];
    // Prefer Groq first when available
    if (this.groq) {
      providers.push({
        id: 'groq',
        name: 'Groq Llama 3.1',
        description: 'Fast, lower-cost reasoning',
        status: 'available'
      });
    }

    if (this.openai) {
      providers.push({
        id: 'openai',
        name: 'OpenAI GPT-4',
        description: 'Advanced reasoning and analysis',
        status: 'available'
      });
    }

    if (this.googleAI) {
      providers.push({
        id: 'google',
        name: 'Google Gemini',
        description: 'Fast and efficient analysis',
        status: 'available'
      });
    }

    if (this.perplexityApiKey) {
      providers.push({
        id: 'perplexity',
        name: 'Perplexity AI',
        description: 'Real-time web search and fact-checking',
        status: 'available'
      });
    }

    return providers;
  }

  /**
   * Resolve API key from env or admin settings (supports comma-separated list). Returns first non-empty key.
   */
  async getApiKey(providerId) {
    const envMap = {
      groq: process.env.GROQ_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      google: process.env.GOOGLE_AI_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY,
    };
    if (envMap[providerId]) return envMap[providerId];
    const cfg = await adminSettingsService.getProviderConfig(providerId);
    const raw = cfg?.apiKey || '';
    if (!raw) return '';
    // Support comma-separated list
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    return parts[0] || '';
  }

  async ensureClient(providerId) {
    if (providerId === 'groq') {
      if (!this.groq) {
        const key = await this.getApiKey('groq');
        if (key) this.groq = new Groq({ apiKey: key });
      }
    }
    if (providerId === 'openai') {
      if (!this.openai) {
        const key = await this.getApiKey('openai');
        if (key) this.openai = new OpenAI({ apiKey: key });
      }
    }
    if (providerId === 'google') {
      if (!this.googleAI) {
        const key = await this.getApiKey('google');
        if (key) this.googleAI = new GoogleGenerativeAI(key);
      }
    }
    // Perplexity uses fetch with header, set key from admin if needed
    if (providerId === 'perplexity') {
      if (!this.perplexityApiKey) {
        const key = await this.getApiKey('perplexity');
        if (key) this.perplexityApiKey = key;
      }
    }
  }

  async isProviderEnabled(providerId) {
    try {
      const cfg = await adminSettingsService.getProviderConfig(providerId);
      // Default to true when not specified
      return cfg?.enabled !== false;
    } catch {
      return true;
    }
  }

  /**
   * Analyze a claim using the specified AI provider with evidence integration
   */
  async analyzeClaim(claimText, provider = 'auto', evidence = []) {
    // Auto-select provider if not specified
    if (provider === 'auto') {
      try {
        const def = (await adminSettingsService.getDefaultProvider()) || 'groq';
        const map = { Groq: 'groq', OpenAI: 'openai', 'Google AI': 'google', Google: 'google', Perplexity: 'perplexity', perplexity: 'perplexity', groq: 'groq', openai: 'openai', google: 'google', auto: 'auto' };
        let desired = map[def] || 'groq';
        // Ensure desired is enabled; otherwise pick next
        const order = ['groq', 'openai', 'google', 'perplexity'];
        const enabledDesired = await this.isProviderEnabled(desired);
        if (!enabledDesired) {
          for (const p of order) {
            if (await this.isProviderEnabled(p)) { desired = p; break; }
          }
        }
        provider = desired;
      } catch {
        provider = this.groq
          ? 'groq'
          : (this.openai
            ? 'openai'
            : (this.googleAI
              ? 'google'
              : (this.perplexityApiKey ? 'perplexity' : null)));
      }
    }

    if (!provider) {
      return this.getMockClaimAnalysis(claimText, 'No AI provider configured');
    }

    // Ensure client exists based on admin settings if needed
    await this.ensureClient(provider);
    // If provider disabled, perform explicit fallback (no throw)
    if (!(await this.isProviderEnabled(provider))) {
      const order = ['groq', 'openai', 'google', 'perplexity'];
      for (const p of order) {
        if (p === provider) continue;
        if (!(await this.isProviderEnabled(p))) continue;
        await this.ensureClient(p);
        if ((p === 'groq' && this.groq) || (p === 'openai' && this.openai) || (p === 'google' && this.googleAI) || (p === 'perplexity' && this.perplexityApiKey)) {
          return await this.analyzeClaim(claimText, p, evidence);
        }
      }
      return this.getMockClaimAnalysis(claimText, 'Selected provider disabled and no fallback available');
    }

    let systemPrompt = `You are a fact-checking AI assistant. Analyze the given claim and provide:
    
    1. Initial assessment (likely_true, likely_false, mixed, insufficient_data)
    2. Confidence score (0-1)
    3. Key points that support or contradict the claim
    4. Suggested search terms for finding evidence
    5. Potential sources to check
    6. Context and background information
    
    Respond in JSON format with these fields: assessment, confidence_score, key_points, search_terms, suggested_sources, context.`;

    // If evidence is provided, enhance the prompt with evidence-based analysis
    if (evidence && evidence.length > 0) {
      const evidenceText = evidence.map(item => 
        `Source: ${item.source_name || item.source}\nTitle: ${item.title}\nContent: ${item.description || item.extract || 'No description'}\nURL: ${item.url || 'No URL'}`
      ).join('\n\n---\n\n');

      systemPrompt = `You are a fact-checking AI assistant. You will be provided with a claim and relevant evidence from multiple sources. 

Analyze the claim using the provided evidence and your knowledge to provide:

1. Assessment based on evidence (supported, contradicted, mixed, insufficient_evidence)
2. Confidence score (0-1) based on evidence quality and consistency
3. Key points from the evidence that support or contradict the claim
4. Analysis of source credibility and potential bias
5. Additional search terms if more evidence is needed
6. Context and background information

EVIDENCE PROVIDED:
${evidenceText}

Respond in JSON format with these fields: assessment, confidence_score, key_points, source_analysis, search_terms, context.`;
    }

    try {
      switch (provider) {
        case 'groq':
          return await this.analyzeWithGroq(claimText, systemPrompt);
        case 'openai':
          return await this.analyzeWithOpenAI(claimText, systemPrompt);
        case 'google':
          return await this.analyzeWithGoogle(claimText, systemPrompt);
        case 'perplexity':
          return await this.analyzeWithPerplexity(claimText, 'llama-3.1-sonar-small-128k-online', evidence);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`Error with ${provider} provider:`, error);
      
      // Fallback to next available provider (Groq > OpenAI > Google > Perplexity)
      const order = ['groq', 'openai', 'google', 'perplexity'];
      let next;
      for (const p of order) {
        if (p === provider) continue;
        if (!(await this.isProviderEnabled(p))) continue;
        await this.ensureClient(p);
        if ((p === 'groq' && this.groq) || (p === 'openai' && this.openai) || (p === 'google' && this.googleAI) || (p === 'perplexity' && this.perplexityApiKey)) {
          next = p; break;
        }
      }
      const fallbackProvider = next ? { id: next } : null;
      if (fallbackProvider) {
        logger.info(`Falling back to ${fallbackProvider.id}`);
        await this.ensureClient(fallbackProvider.id);
        return await this.analyzeClaim(claimText, fallbackProvider.id, evidence);
      }
      
      return this.getMockClaimAnalysis(claimText, 'All AI providers are unavailable');
    }
  }

  getMockClaimAnalysis(claimText, reason = 'AI provider unavailable') {
    return {
      assessment: 'insufficient_data',
      confidence_score: 0.1,
      key_points: [reason],
      search_terms: this.extractSearchTerms(claimText),
      suggested_sources: ['reuters.com', 'apnews.com', 'factcheck.org'],
      context: `Fallback response generated because: ${reason}.`,
      provider: 'mock',
      provider_name: 'Mock Fallback'
    };
  }

  /**
   * Analyze claim using Groq Llama 3.1 (preferred for cost)
   */
  async analyzeWithGroq(claimText, systemPrompt) {
    if (!this.groq) {
      throw new Error('Groq not configured');
    }

    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this claim: "${claimText}"` }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });

    const content = completion.choices[0].message.content;
    try {
      const analysis = JSON.parse(content);
      return { ...analysis, provider: 'groq', provider_name: 'Groq Llama 3.1' };
    } catch (parseError) {
      return {
        assessment: 'unverifiable',
        confidence_score: 0.6,
        key_points: [content],
        search_terms: this.extractSearchTerms(claimText),
        suggested_sources: ['reuters.com', 'apnews.com', 'factcheck.org'],
        context: content,
        provider: 'groq',
        provider_name: 'Groq Llama 3.1'
      };
    }
  }

  /**
   * Analyze claim using OpenAI GPT-4
   */
  async analyzeWithOpenAI(claimText, systemPrompt) {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this claim: "${claimText}"` }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = completion.choices[0].message.content;
    
    try {
      const analysis = JSON.parse(content);
      return {
        ...analysis,
        provider: 'openai',
        provider_name: 'OpenAI GPT-4'
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        assessment: 'unverifiable',
        confidence_score: 0.5,
        key_points: [content],
        search_terms: this.extractSearchTerms(claimText),
        suggested_sources: ['reuters.com', 'apnews.com', 'factcheck.org'],
        context: content,
        provider: 'openai',
        provider_name: 'OpenAI GPT-4'
      };
    }
  }

  /**
   * Analyze claim using Google Gemini
   */
  async analyzeWithGoogle(claimText, systemPrompt) {
    if (!this.googleAI) {
      throw new Error('Google AI not configured');
    }

    const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `${systemPrompt}\n\nAnalyze this claim: "${claimText}"`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    try {
      const analysis = JSON.parse(content);
      return {
        ...analysis,
        provider: 'google',
        provider_name: 'Google Gemini'
      };
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        assessment: 'unverifiable',
        confidence_score: 0.5,
        key_points: [content],
        search_terms: this.extractSearchTerms(claimText),
        suggested_sources: ['reuters.com', 'apnews.com', 'factcheck.org'],
        context: content,
        provider: 'google',
        provider_name: 'Google Gemini'
      };
    }
  }

  /**
   * Extract potential search terms from claim text
   */
  extractSearchTerms(claimText) {
    // Simple keyword extraction - remove common words and extract meaningful terms
    const commonWords = ['the', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'would', 'could', 'should', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    
    const words = claimText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));

    // Return up to 5 most relevant terms
    return words.slice(0, 5);
  }

  /**
   * Analyze claim using Perplexity AI
   */
  async analyzeWithPerplexity(claimText, model = 'llama-3.1-sonar-small-128k-online', evidence = []) {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API not configured');
    }

    const prompt = `You are a fact-checking AI assistant. Analyze this claim and provide a comprehensive fact-check analysis:

CLAIM: "${claimText}"

Please provide:
1. Fact-check verdict (TRUE, FALSE, MIXED, UNVERIFIABLE)
2. Confidence level (0-100%)
3. Key evidence supporting or contradicting the claim
4. Reliable sources and citations
5. Context and background information
6. Any important caveats or nuances

Format your response as clear, structured analysis with proper citations.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional fact-checker with access to real-time information. Provide accurate, well-sourced analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No analysis available';

      return {
        content: content,
        message: content,
        citations: data.citations || [],
        confidence: 0.8,
        provider: 'perplexity',
        provider_name: 'Perplexity AI'
      };
    } catch (error) {
      logger.error('Perplexity API error:', error);
      throw error;
    }
  }

  /**
   * Search using Perplexity AI
   */
  async searchWithPerplexity(query, model = 'llama-3.1-sonar-small-128k-online') {
    if (!this.perplexityApiKey) {
      throw new Error('Perplexity API not configured');
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a research assistant. Provide comprehensive, well-sourced information about the query.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No results available';

      return {
        results: [{
          title: `Search Results for: ${query}`,
          content: content,
          citations: data.citations || [],
          timestamp: new Date().toISOString()
        }],
        provider: 'perplexity'
      };
    } catch (error) {
      logger.error('Perplexity search error:', error);
      throw error;
    }
  }

  /**
   * Get provider status and information
   */
  getProviderInfo() {
    return {
      available_providers: this.availableProviders,
      default_provider: this.availableProviders[0]?.id || null,
      total_providers: this.availableProviders.length
    };
  }
}

module.exports = new AIProviderService();
