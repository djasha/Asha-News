const OpenAI = require('openai');
const logger = require('../utils/logger');
const Groq = require('groq-sdk');
const adminSettingsService = require('./adminSettingsService');

class AIAnalysisService {
  constructor() {
    this.openai = null;
    this.groq = null;
    this.isEnabled = process.env.ENABLE_AI_ANALYSIS === 'true';

    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async ensureClient(provider) {
    try {
      const cfg = await adminSettingsService.getProviderConfig(provider);
      if (!cfg || cfg.enabled === false) return false;
      const key = (cfg.apiKey || '').split(',')[0]?.trim();
      if (!key) return false;
      if (provider === 'groq' && !this.groq) this.groq = new Groq({ apiKey: key });
      if (provider === 'openai' && !this.openai) this.openai = new OpenAI({ apiKey: key });
      return true;
    } catch {
      return false;
    }
  }

  async isProviderEnabled(provider) {
    try {
      const cfg = await adminSettingsService.getProviderConfig(provider);
      return cfg?.enabled !== false;
    } catch {
      return true;
    }
  }

  /**
   * Analyze article for political bias
   * @param {Object} article - Article object with title, content, summary
   * @returns {Object} Bias analysis results
   */
  async analyzeBias(article) {
    if (!this.isEnabled) {
      return this.getFallbackBiasAnalysis();
    }

    try {
      // Initialize clients from admin settings if needed
      await this.ensureClient('groq');
      await this.ensureClient('openai');

      const prompt = this.createBiasAnalysisPrompt(article);

      let content;
      // Respect admin default provider when both are configured
      let preferOpenAI = false;
      try {
        const def = await adminSettingsService.getDefaultProvider();
        preferOpenAI = def && (def.toLowerCase() === 'openai');
      } catch {}

      const openaiEnabled = await this.isProviderEnabled('openai');
      const groqEnabled = await this.isProviderEnabled('groq');

      if (preferOpenAI && this.openai && openaiEnabled) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert media bias analyst. Analyze news articles for political bias, emotional tone, and factual quality. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });
        content = completion.choices[0].message.content;
      } else if (this.groq && groqEnabled) {
        const completion = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an expert media bias analyst. Analyze news articles for political bias, emotional tone, and factual quality. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });
        content = completion.choices[0].message.content;
      } else if (this.openai && openaiEnabled) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert media bias analyst. Analyze news articles for political bias, emotional tone, and factual quality. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });
        content = completion.choices[0].message.content;
      } else {
        return this.getFallbackBiasAnalysis();
      }

      const analysis = JSON.parse(content);
      return this.validateAndNormalizeAnalysis(analysis);
      
    } catch (error) {
      logger.error('AI bias analysis failed:', error);
      return this.getFallbackBiasAnalysis();
    }
  }

  /**
   * Analyze article for emotional tone and sentiment
   * @param {Object} article - Article object
   * @returns {Object} Emotional analysis results
   */
  async analyzeEmotionalTone(article) {
    if (!this.isEnabled) {
      return this.getFallbackEmotionalAnalysis();
    }

    try {
      await this.ensureClient('groq');
      await this.ensureClient('openai');
      const prompt = this.createEmotionalAnalysisPrompt(article);

      let content;
      let preferOpenAI = false;
      try {
        const def = await adminSettingsService.getDefaultProvider();
        preferOpenAI = def && (def.toLowerCase() === 'openai');
      } catch {}

      const openaiEnabled = await this.isProviderEnabled('openai');
      const groqEnabled = await this.isProviderEnabled('groq');

      if (preferOpenAI && this.openai && openaiEnabled) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert in emotional analysis of news content. Analyze the emotional tone, sentiment, and psychological impact. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800
        });
        content = completion.choices[0].message.content;
      } else if (this.groq && groqEnabled) {
        const completion = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an expert in emotional analysis of news content. Analyze the emotional tone, sentiment, and psychological impact. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800
        });
        content = completion.choices[0].message.content;
      } else if (this.openai && openaiEnabled) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert in emotional analysis of news content. Analyze the emotional tone, sentiment, and psychological impact. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800
        });
        content = completion.choices[0].message.content;
      } else {
        return this.getFallbackEmotionalAnalysis();
      }

      const analysis = JSON.parse(content);
      return this.validateEmotionalAnalysis(analysis);
      
    } catch (error) {
      logger.error('AI emotional analysis failed:', error);
      return this.getFallbackEmotionalAnalysis();
    }
  }

  /**
   * Assess article quality and credibility
   * @param {Object} article - Article object
   * @returns {Object} Quality assessment results
   */
  async assessQuality(article) {
    if (!this.isEnabled) {
      return this.getFallbackQualityAssessment();
    }

    try {
      await this.ensureClient('groq');
      await this.ensureClient('openai');
      const prompt = this.createQualityAssessmentPrompt(article);

      let content;
      let preferOpenAI = false;
      try {
        const def = await adminSettingsService.getDefaultProvider();
        preferOpenAI = def && (def.toLowerCase() === 'openai');
      } catch {}

      const openaiEnabled = await this.isProviderEnabled('openai');
      const groqEnabled = await this.isProviderEnabled('groq');

      if (preferOpenAI && this.openai && openaiEnabled) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert journalism quality assessor. Evaluate articles for factual accuracy, source credibility, and journalistic standards. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 800
        });
        content = completion.choices[0].message.content;
      } else if (this.groq && groqEnabled) {
        const completion = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an expert journalism quality assessor. Evaluate articles for factual accuracy, source credibility, and journalistic standards. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 800
        });
        content = completion.choices[0].message.content;
      } else if (this.openai && openaiEnabled) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert journalism quality assessor. Evaluate articles for factual accuracy, source credibility, and journalistic standards. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 800
        });
        content = completion.choices[0].message.content;
      } else {
        return this.getFallbackQualityAssessment();
      }

      const analysis = JSON.parse(content);
      return this.validateQualityAssessment(analysis);
      
    } catch (error) {
      logger.error('AI quality assessment failed:', error);
      return this.getFallbackQualityAssessment();
    }
  }

  /**
   * Comprehensive article analysis combining all AI features
   * @param {Object} article - Article object
   * @returns {Object} Complete analysis results
   */
  async analyzeArticle(article) {
    const [biasAnalysis, emotionalAnalysis, qualityAssessment] = await Promise.all([
      this.analyzeBias(article),
      this.analyzeEmotionalTone(article),
      this.assessQuality(article)
    ]);

    return {
      bias_analysis: biasAnalysis,
      emotional_analysis: emotionalAnalysis,
      quality_assessment: qualityAssessment,
      overall_score: this.calculateOverallScore(biasAnalysis, emotionalAnalysis, qualityAssessment),
      analyzed_at: new Date().toISOString(),
      ai_enabled: this.isEnabled
    };
  }

  // Private helper methods

  createBiasAnalysisPrompt(article) {
    return `Analyze this news article for political bias:

Title: ${article.title}
Summary: ${article.summary || ''}
Content: ${article.content ? article.content.substring(0, 2000) : ''}
Source: ${article.source_name || 'Unknown'}

Provide analysis in this exact JSON format:
{
  "bias_score": 0.5,
  "bias_direction": "center",
  "confidence": 0.8,
  "reasoning": "Brief explanation of bias assessment",
  "key_indicators": ["indicator1", "indicator2"],
  "political_leaning": "center",
  "objectivity_score": 0.7,
  "loaded_language": ["example1", "example2"]
}

bias_score: 0.0 (far-left) to 1.0 (far-right), 0.5 = center
bias_direction: "left", "center-left", "center", "center-right", "right"
confidence: 0.0 to 1.0
objectivity_score: 0.0 (highly subjective) to 1.0 (highly objective)`;
  }

  createEmotionalAnalysisPrompt(article) {
    return `Analyze the emotional tone of this news article:

Title: ${article.title}
Summary: ${article.summary || ''}
Content: ${article.content ? article.content.substring(0, 2000) : ''}

Provide analysis in this exact JSON format:
{
  "primary_emotion": "neutral",
  "emotional_intensity": 0.5,
  "sentiment_score": 0.0,
  "emotional_triggers": ["trigger1", "trigger2"],
  "tone_descriptors": ["professional", "urgent"],
  "psychological_impact": "low",
  "emotional_balance": 0.7
}

primary_emotion: "anger", "fear", "joy", "sadness", "neutral", "outrage", "hope"
emotional_intensity: 0.0 (very calm) to 1.0 (highly emotional)
sentiment_score: -1.0 (very negative) to 1.0 (very positive)
psychological_impact: "low", "medium", "high"
emotional_balance: 0.0 (very unbalanced) to 1.0 (well balanced)`;
  }

  createQualityAssessmentPrompt(article) {
    return `Assess the journalistic quality of this article:

Title: ${article.title}
Summary: ${article.summary || ''}
Content: ${article.content ? article.content.substring(0, 2000) : ''}
Source: ${article.source_name || 'Unknown'}

Provide assessment in this exact JSON format:
{
  "credibility_score": 0.8,
  "factual_accuracy": 0.9,
  "source_quality": 0.7,
  "evidence_strength": 0.6,
  "journalistic_standards": 0.8,
  "completeness": 0.7,
  "transparency": 0.8,
  "quality_indicators": ["well-sourced", "balanced"],
  "quality_concerns": ["concern1", "concern2"]
}

All scores: 0.0 (very poor) to 1.0 (excellent)`;
  }

  validateAndNormalizeAnalysis(analysis) {
    return {
      bias_score: Math.max(0, Math.min(1, analysis.bias_score || 0.5)),
      bias_direction: analysis.bias_direction || 'center',
      confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
      reasoning: analysis.reasoning || 'No analysis available',
      key_indicators: Array.isArray(analysis.key_indicators) ? analysis.key_indicators : [],
      political_leaning: analysis.political_leaning || 'center',
      objectivity_score: Math.max(0, Math.min(1, analysis.objectivity_score || 0.5)),
      loaded_language: Array.isArray(analysis.loaded_language) ? analysis.loaded_language : []
    };
  }

  validateEmotionalAnalysis(analysis) {
    return {
      primary_emotion: analysis.primary_emotion || 'neutral',
      emotional_intensity: Math.max(0, Math.min(1, analysis.emotional_intensity || 0.5)),
      sentiment_score: Math.max(-1, Math.min(1, analysis.sentiment_score || 0)),
      emotional_triggers: Array.isArray(analysis.emotional_triggers) ? analysis.emotional_triggers : [],
      tone_descriptors: Array.isArray(analysis.tone_descriptors) ? analysis.tone_descriptors : [],
      psychological_impact: analysis.psychological_impact || 'low',
      emotional_balance: Math.max(0, Math.min(1, analysis.emotional_balance || 0.5))
    };
  }

  validateQualityAssessment(analysis) {
    return {
      credibility_score: Math.max(0, Math.min(1, analysis.credibility_score || 0.5)),
      factual_accuracy: Math.max(0, Math.min(1, analysis.factual_accuracy || 0.5)),
      source_quality: Math.max(0, Math.min(1, analysis.source_quality || 0.5)),
      evidence_strength: Math.max(0, Math.min(1, analysis.evidence_strength || 0.5)),
      journalistic_standards: Math.max(0, Math.min(1, analysis.journalistic_standards || 0.5)),
      completeness: Math.max(0, Math.min(1, analysis.completeness || 0.5)),
      transparency: Math.max(0, Math.min(1, analysis.transparency || 0.5)),
      quality_indicators: Array.isArray(analysis.quality_indicators) ? analysis.quality_indicators : [],
      quality_concerns: Array.isArray(analysis.quality_concerns) ? analysis.quality_concerns : []
    };
  }

  calculateOverallScore(biasAnalysis, emotionalAnalysis, qualityAssessment) {
    const objectivityWeight = 0.3;
    const qualityWeight = 0.4;
    const emotionalBalanceWeight = 0.3;

    return Math.round((
      (biasAnalysis.objectivity_score * objectivityWeight) +
      (qualityAssessment.credibility_score * qualityWeight) +
      (emotionalAnalysis.emotional_balance * emotionalBalanceWeight)
    ) * 100) / 100;
  }

  // Fallback methods for when AI is disabled

  getFallbackBiasAnalysis() {
    return {
      bias_score: 0.5,
      bias_direction: 'center',
      confidence: 0.3,
      reasoning: 'AI analysis not available - using default values',
      key_indicators: [],
      political_leaning: 'center',
      objectivity_score: 0.5,
      loaded_language: []
    };
  }

  getFallbackEmotionalAnalysis() {
    return {
      primary_emotion: 'neutral',
      emotional_intensity: 0.3,
      sentiment_score: 0.0,
      emotional_triggers: [],
      tone_descriptors: ['neutral'],
      psychological_impact: 'low',
      emotional_balance: 0.5
    };
  }

  getFallbackQualityAssessment() {
    return {
      credibility_score: 0.5,
      factual_accuracy: 0.5,
      source_quality: 0.5,
      evidence_strength: 0.5,
      journalistic_standards: 0.5,
      completeness: 0.5,
      transparency: 0.5,
      quality_indicators: [],
      quality_concerns: []
    };
  }
}

module.exports = AIAnalysisService;
