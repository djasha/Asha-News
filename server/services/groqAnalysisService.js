const Groq = require('groq-sdk');
const logger = require('../utils/logger');
const adminSettingsService = require('./adminSettingsService');
const aiJson = require('../utils/aiJson');
const AI_DEBUG = process.env.AI_DEBUG === 'true';

class GroqAnalysisService {
  constructor() {
    this.groq = null;
    // Global AI switch - provider availability checked dynamically via admin settings
    this.isEnabled = process.env.ENABLE_AI_ANALYSIS === 'true';
  }

  async ensureGroq() {
    if (this.groq) return true;
    // Try env first
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      if (AI_DEBUG) console.debug('[GroqAnalysisService] ensureGroq: using env key');
      return true;
    }
    // Try admin settings
    try {
      const cfg = await adminSettingsService.getProviderConfig('groq');
      const enabled = cfg?.enabled !== false;
      const key = (cfg?.apiKey || '').split(',')[0]?.trim();
      if (enabled && key) {
        this.groq = new Groq({ apiKey: key });
        if (AI_DEBUG) console.debug('[GroqAnalysisService] ensureGroq: using admin settings key');
        return true;
      }
    } catch {}
    return false;
  }

  async isGroqAvailable() {
    if (!this.isEnabled) return false;
    if (process.env.GROQ_API_KEY) return true;
    try {
      const cfg = await adminSettingsService.getProviderConfig('groq');
      return (cfg?.enabled !== false) && !!(cfg?.apiKey);
    } catch {
      return false;
    }
  }

  /**
   * Analyze article with Palestine/Israel focused bias detection
   * @param {Object} article - Article object with title, content, summary
   * @returns {Object} Enhanced analysis results
   */
  async analyzeArticle(article) {
    if (!(await this.isGroqAvailable())) {
      return this.getFallbackAnalysis();
    }

    try {
      await this.ensureGroq();
      const prompt = this.createPalestineAnalysisPrompt(article);
      if (AI_DEBUG) console.debug('[GroqAnalysisService] analyzeArticle request', { model: 'llama-3.1-8b-instant', temperature: 0.3, promptLength: prompt.length });
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert analyst specializing in Palestine/Israel conflict reporting. Analyze articles for bias, factuality, and provide context with a focus on Palestinian perspectives and rights. You understand the historical context of Israeli occupation and Palestinian resistance. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 2000
      });
      const raw = completion.choices[0].message.content || '';
      if (AI_DEBUG) console.debug('[GroqAnalysisService] analyzeArticle response', { length: raw.length });
      const parsed = aiJson.tryParseJson(raw);
      if (!parsed) throw new Error('Invalid JSON from Groq analyzeArticle');
      const analysis = parsed;
      return this.validateAndEnhanceAnalysis(analysis);
      
    } catch (error) {
      logger.error('Groq analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Generate article summary with Palestinian context
   * @param {Object} article - Article object
   * @returns {Object} Summary with context
   */
  async generateSummary(article) {
    if (!(await this.isGroqAvailable())) {
      return this.getFallbackSummary(article);
    }

    try {
      await this.ensureGroq();
      const prompt = `Summarize this article with Palestinian context and historical background:

Title: ${article.title}
Content: ${article.content ? article.content.substring(0, 3000) : ''}
Source: ${article.source_name || 'Unknown'}

Provide a summary that:
1. Highlights key facts and developments
2. Provides historical context when relevant
3. Notes any omissions or one-sided reporting
4. Explains significance for Palestinian people
5. Identifies any propaganda or misleading framing

Respond in this JSON format:
{
  "summary": "Comprehensive summary with context",
  "key_points": ["point1", "point2", "point3"],
  "historical_context": "Relevant background information",
  "palestinian_impact": "How this affects Palestinian people",
  "missing_context": "What important information is omitted",
  "significance": "Why this story matters"
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a Palestinian rights advocate and journalist providing context-rich summaries that center Palestinian experiences and rights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.4,
        max_tokens: 1500
      });
      const raw = completion.choices[0].message.content || '';
      if (AI_DEBUG) console.debug('[GroqAnalysisService] generateSummary response', { length: raw.length });
      const parsed = aiJson.tryParseJson(raw);
      if (!parsed) throw new Error('Invalid JSON from Groq generateSummary');
      return parsed;
      
    } catch (error) {
      logger.error('Groq summary generation failed:', error);
      return this.getFallbackSummary(article);
    }
  }

  /**
   * Fact-check claims with Palestine/Israel context
   * @param {string} claim - Claim to fact-check
   * @returns {Object} Fact-check results
   */
  async factCheckClaim(claim) {
    if (!(await this.isGroqAvailable())) {
      return this.getFallbackFactCheck();
    }

    try {
      await this.ensureGroq();
      const prompt = `Fact-check this claim about Palestine/Israel with comprehensive context:

Claim: "${claim}"

Provide detailed fact-checking that includes:
1. Factual accuracy assessment
2. Historical context and background
3. Sources and evidence
4. Common misconceptions addressed
5. Palestinian perspective and rights context
6. Any propaganda or misleading framing

Respond in this JSON format:
{
  "verdict": "TRUE|FALSE|PARTIALLY_TRUE|MISLEADING|LACKS_CONTEXT",
  "confidence": 0.9,
  "explanation": "Detailed explanation of the verdict",
  "historical_context": "Relevant historical background",
  "evidence": ["source1", "source2", "source3"],
  "palestinian_context": "How this relates to Palestinian rights/experiences",
  "common_misconceptions": ["misconception1", "misconception2"],
  "additional_context": "Important context often omitted from mainstream coverage"
}`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert fact-checker specializing in Palestine/Israel issues with deep knowledge of historical context, international law, and Palestinian rights. You provide thorough, evidence-based analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        max_tokens: 2000
      });
      const raw = completion.choices[0].message.content || '';
      if (AI_DEBUG) console.debug('[GroqAnalysisService] factCheckClaim response', { length: raw.length });
      const parsed = aiJson.tryParseJson(raw);
      if (!parsed) throw new Error('Invalid JSON from Groq factCheckClaim');
      return parsed;
      
    } catch (error) {
      logger.error('Groq fact-check failed:', error);
      return this.getFallbackFactCheck();
    }
  }

  createPalestineAnalysisPrompt(article) {
    return `Analyze this article about Palestine/Israel with sophisticated bias detection:

Title: ${article.title}
Summary: ${article.summary || ''}
Content: ${article.content ? article.content.substring(0, 2500) : ''}
Source: ${article.source_name || 'Unknown'}

Provide comprehensive analysis in this exact JSON format:
{
  "bias_analysis": {
    "geographic_bias": {
      "score": 0.7,
      "direction": "pro-israel",
      "explanation": "Detailed explanation of geographic bias"
    },
    "institutional_bias": {
      "score": 0.6,
      "type": "western_media",
      "explanation": "Analysis of institutional perspective"
    },
    "language_bias": {
      "loaded_terms": ["terrorist", "conflict", "disputed"],
      "framing": "How the story is framed",
      "omissions": ["key context omitted"]
    },
    "overall_bias_score": 0.65,
    "bias_explanation": "Comprehensive bias assessment"
  },
  "factuality_analysis": {
    "accuracy_score": 0.8,
    "verification_status": "VERIFIED|UNVERIFIED|DISPUTED|FALSE",
    "sources_quality": 0.7,
    "evidence_strength": 0.6,
    "fact_check_notes": "Detailed factual assessment",
    "missing_context": ["important context not mentioned"],
    "historical_accuracy": 0.8
  },
  "palestinian_context": {
    "impact_on_palestinians": "How this affects Palestinian people",
    "rights_implications": "Human rights and legal implications",
    "historical_context": "Relevant historical background",
    "resistance_context": "Context of Palestinian resistance",
    "occupation_context": "How this relates to Israeli occupation"
  },
  "credibility_assessment": {
    "source_credibility": 0.7,
    "track_record_palestine": "Source's history on Palestine coverage",
    "independence_score": 0.6,
    "transparency": 0.8
  },
  "recommendations": {
    "additional_sources": ["recommended sources for full context"],
    "key_questions": ["questions this article doesn't address"],
    "further_reading": ["resources for deeper understanding"]
  }
}

Scoring: 0.0 to 1.0 where:
- geographic_bias: 0.0 = strongly pro-Palestine, 0.5 = neutral, 1.0 = strongly pro-Israel
- All other scores: 0.0 = very poor, 1.0 = excellent`;
  }

  validateAndEnhanceAnalysis(analysis) {
    return {
      bias_analysis: {
        geographic_bias: {
          score: Math.max(0, Math.min(1, analysis.bias_analysis?.geographic_bias?.score || 0.5)),
          direction: analysis.bias_analysis?.geographic_bias?.direction || 'neutral',
          explanation: analysis.bias_analysis?.geographic_bias?.explanation || 'No bias analysis available'
        },
        institutional_bias: {
          score: Math.max(0, Math.min(1, analysis.bias_analysis?.institutional_bias?.score || 0.5)),
          type: analysis.bias_analysis?.institutional_bias?.type || 'unknown',
          explanation: analysis.bias_analysis?.institutional_bias?.explanation || 'No institutional bias analysis'
        },
        language_bias: {
          loaded_terms: Array.isArray(analysis.bias_analysis?.language_bias?.loaded_terms) ? 
            analysis.bias_analysis.language_bias.loaded_terms : [],
          framing: analysis.bias_analysis?.language_bias?.framing || 'No framing analysis',
          omissions: Array.isArray(analysis.bias_analysis?.language_bias?.omissions) ? 
            analysis.bias_analysis.language_bias.omissions : []
        },
        overall_bias_score: Math.max(0, Math.min(1, analysis.bias_analysis?.overall_bias_score || 0.5)),
        bias_explanation: analysis.bias_analysis?.bias_explanation || 'No bias explanation available'
      },
      factuality_analysis: {
        accuracy_score: Math.max(0, Math.min(1, analysis.factuality_analysis?.accuracy_score || 0.5)),
        verification_status: analysis.factuality_analysis?.verification_status || 'UNVERIFIED',
        sources_quality: Math.max(0, Math.min(1, analysis.factuality_analysis?.sources_quality || 0.5)),
        evidence_strength: Math.max(0, Math.min(1, analysis.factuality_analysis?.evidence_strength || 0.5)),
        fact_check_notes: analysis.factuality_analysis?.fact_check_notes || 'No fact-check notes available',
        missing_context: Array.isArray(analysis.factuality_analysis?.missing_context) ? 
          analysis.factuality_analysis.missing_context : [],
        historical_accuracy: Math.max(0, Math.min(1, analysis.factuality_analysis?.historical_accuracy || 0.5))
      },
      palestinian_context: {
        impact_on_palestinians: analysis.palestinian_context?.impact_on_palestinians || 'Impact not analyzed',
        rights_implications: analysis.palestinian_context?.rights_implications || 'Rights implications not analyzed',
        historical_context: analysis.palestinian_context?.historical_context || 'Historical context not provided',
        resistance_context: analysis.palestinian_context?.resistance_context || 'Resistance context not provided',
        occupation_context: analysis.palestinian_context?.occupation_context || 'Occupation context not provided'
      },
      credibility_assessment: {
        source_credibility: Math.max(0, Math.min(1, analysis.credibility_assessment?.source_credibility || 0.5)),
        track_record_palestine: analysis.credibility_assessment?.track_record_palestine || 'Track record not assessed',
        independence_score: Math.max(0, Math.min(1, analysis.credibility_assessment?.independence_score || 0.5)),
        transparency: Math.max(0, Math.min(1, analysis.credibility_assessment?.transparency || 0.5))
      },
      recommendations: {
        additional_sources: Array.isArray(analysis.recommendations?.additional_sources) ? 
          analysis.recommendations.additional_sources : [],
        key_questions: Array.isArray(analysis.recommendations?.key_questions) ? 
          analysis.recommendations.key_questions : [],
        further_reading: Array.isArray(analysis.recommendations?.further_reading) ? 
          analysis.recommendations.further_reading : []
      },
      analyzed_at: new Date().toISOString(),
      ai_provider: 'groq',
      model: 'llama-3.1-8b-instant'
    };
  }

  getFallbackAnalysis() {
    return {
      bias_analysis: {
        geographic_bias: {
          score: 0.5,
          direction: 'neutral',
          explanation: 'AI analysis not available - using default values'
        },
        institutional_bias: {
          score: 0.5,
          type: 'unknown',
          explanation: 'AI analysis not available'
        },
        language_bias: {
          loaded_terms: [],
          framing: 'No framing analysis available',
          omissions: []
        },
        overall_bias_score: 0.5,
        bias_explanation: 'AI analysis not available'
      },
      factuality_analysis: {
        accuracy_score: 0.5,
        verification_status: 'UNVERIFIED',
        sources_quality: 0.5,
        evidence_strength: 0.5,
        fact_check_notes: 'AI analysis not available',
        missing_context: [],
        historical_accuracy: 0.5
      },
      palestinian_context: {
        impact_on_palestinians: 'Analysis not available',
        rights_implications: 'Analysis not available',
        historical_context: 'Analysis not available',
        resistance_context: 'Analysis not available',
        occupation_context: 'Analysis not available'
      },
      credibility_assessment: {
        source_credibility: 0.5,
        track_record_palestine: 'Not assessed',
        independence_score: 0.5,
        transparency: 0.5
      },
      recommendations: {
        additional_sources: [],
        key_questions: [],
        further_reading: []
      },
      analyzed_at: new Date().toISOString(),
      ai_provider: 'fallback',
      model: 'none'
    };
  }

  getFallbackSummary(article) {
    return {
      summary: article.summary || article.title || 'No summary available',
      key_points: [],
      historical_context: 'AI analysis not available',
      palestinian_impact: 'Impact analysis not available',
      missing_context: 'Context analysis not available',
      significance: 'Significance analysis not available'
    };
  }

  getFallbackFactCheck() {
    return {
      verdict: 'UNVERIFIED',
      confidence: 0.0,
      explanation: 'AI fact-checking not available',
      historical_context: 'Context not available',
      evidence: [],
      palestinian_context: 'Palestinian context not available',
      common_misconceptions: [],
      additional_context: 'Additional context not available'
    };
  }
}

module.exports = GroqAnalysisService;
