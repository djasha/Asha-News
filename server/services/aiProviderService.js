/**
 * AI Provider Service
 * Manages multiple AI providers (OpenAI and Google AI) for fact-checking analysis
 */

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

    this.availableProviders = this.getAvailableProviders();
  }

  /**
   * Get list of available AI providers based on configured API keys
   */
  getAvailableProviders() {
    const providers = [];
    
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

    if (providers.length === 0) {
      providers.push({
        id: 'mock',
        name: 'Mock Provider',
        description: 'Demo responses (no API key required)',
        status: 'available'
      });
    }

    return providers;
  }

  /**
   * Analyze a claim using the specified AI provider with evidence integration
   */
  async analyzeClaim(claimText, provider = 'auto', evidence = []) {
    // Auto-select provider if not specified
    if (provider === 'auto') {
      provider = this.availableProviders.length > 0 ? this.availableProviders[0].id : 'mock';
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
        case 'openai':
          return await this.analyzeWithOpenAI(claimText, systemPrompt);
        case 'google':
          return await this.analyzeWithGoogle(claimText, systemPrompt);
        case 'mock':
        default:
          return this.getMockAnalysis(claimText);
      }
    } catch (error) {
      console.error(`Error with ${provider} provider:`, error);
      
      // Fallback to next available provider
      const fallbackProvider = this.availableProviders.find(p => p.id !== provider);
      if (fallbackProvider) {
        console.log(`Falling back to ${fallbackProvider.id}`);
        return await this.analyzeClaim(claimText, fallbackProvider.id, evidence);
      }
      
      // Final fallback to mock
      return this.getMockAnalysis(claimText);
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
   * Generate mock analysis for testing without API keys
   */
  getMockAnalysis(claimText) {
    const searchTerms = this.extractSearchTerms(claimText);
    
    return {
      assessment: 'unverifiable',
      confidence_score: 0.6,
      key_points: [
        'This claim requires verification from multiple sources',
        'Statistical data and expert opinions needed',
        'Timeline and context are important factors'
      ],
      search_terms: searchTerms,
      suggested_sources: [
        'reuters.com',
        'apnews.com',
        'factcheck.org',
        'snopes.com'
      ],
      context: `Mock analysis for claim: "${claimText}". This is a demonstration response. For actual fact-checking, please configure OpenAI or Google AI API keys.`,
      provider: 'mock',
      provider_name: 'Mock Provider (Demo)'
    };
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
   * Get provider status and information
   */
  getProviderInfo() {
    return {
      available_providers: this.availableProviders,
      default_provider: this.availableProviders[0]?.id || 'mock',
      total_providers: this.availableProviders.length
    };
  }
}

module.exports = new AIProviderService();
