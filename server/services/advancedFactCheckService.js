const OpenAI = require('openai');
const logger = require('../utils/logger');
const Groq = require('groq-sdk');
const adminSettingsService = require('./adminSettingsService');

class AdvancedFactCheckService {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
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

  async pickProvider() {
    let prefer = 'groq';
    try {
      const def = await adminSettingsService.getDefaultProvider();
      if (def && typeof def === 'string') prefer = def.toLowerCase();
    } catch {}
    const order = prefer === 'openai' ? ['openai', 'groq'] : ['groq', 'openai'];
    for (const p of order) {
      if (!(await this.isProviderEnabled(p))) continue;
      await this.ensureClient(p);
      if (p === 'groq' && this.groq) return 'groq';
      if (p === 'openai' && this.openai) return 'openai';
    }
    return null;
  }

  // Enhanced fact-checking with confidence scoring
  async analyzeClaimWithConfidence(claim, context = '') {
    try {
      const prompt = `
You are an expert fact-checker. Analyze the following claim and provide a comprehensive assessment.

CLAIM: "${claim}"
CONTEXT: "${context}"

Provide your analysis in the following JSON format:
{
  "verdict": "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "UNVERIFIED" | "MISLEADING",
  "confidence_score": 0-100,
  "explanation": "Detailed explanation of your assessment",
  "key_facts": ["fact1", "fact2", "fact3"],
  "sources_needed": ["type of sources that would verify this"],
  "red_flags": ["potential issues or concerns"],
  "context_importance": "How important is context for this claim",
  "verification_difficulty": "EASY" | "MODERATE" | "DIFFICULT" | "IMPOSSIBLE",
  "claim_type": "FACTUAL" | "OPINION" | "PREDICTION" | "STATISTICAL" | "QUOTE",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}

Be thorough but concise. Focus on factual accuracy and logical reasoning.
`;

      await this.ensureClient('groq');
      await this.ensureClient('openai');
      const provider = await this.pickProvider();
      if (!provider) throw new Error('No AI provider configured');

      let content;
      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        });
        content = resp.choices[0].message.content;
      } else if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        });
        content = response.choices[0].message.content;
      } else {
        throw new Error('No AI provider configured');
      }

      const analysis = JSON.parse(content);
      
      // Add timestamp and metadata
      return {
        ...analysis,
        timestamp: new Date().toISOString(),
        claim_text: claim,
        context_provided: context,
        analysis_version: '2.0'
      };

    } catch (error) {
      logger.error('Advanced fact-check analysis error:', error);
      return {
        verdict: 'UNVERIFIED',
        confidence_score: 0,
        explanation: 'Unable to analyze claim due to technical error',
        error: error.message
      };
    }
  }

  // Real-time article fact-checking
  async factCheckArticle(articleText, title = '') {
    try {
      const prompt = `
Analyze this news article for factual accuracy and potential misinformation.

TITLE: "${title}"
ARTICLE: "${articleText}"

Identify and fact-check key claims. Return JSON:
{
  "overall_reliability": 0-100,
  "key_claims": [
    {
      "claim": "extracted claim",
      "verdict": "TRUE|FALSE|PARTIALLY_TRUE|UNVERIFIED",
      "confidence": 0-100,
      "explanation": "brief explanation",
      "line_number": "approximate location in text"
    }
  ],
  "red_flags": ["potential issues"],
  "verification_needed": ["claims requiring external verification"],
  "bias_indicators": ["signs of bias or agenda"],
  "source_quality": "Assessment of sources cited",
  "recommendations": ["suggestions for readers"]
}

Focus on verifiable facts, not opinions or analysis.
`;
      await this.ensureClient('groq');
      await this.ensureClient('openai');
      const provider = await this.pickProvider();
      if (!provider) throw new Error('No AI provider configured');

      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1500
        });
        return JSON.parse(resp.choices[0].message.content);
      }
      if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1500
        });
        return JSON.parse(response.choices[0].message.content);
      }
      throw new Error('No AI provider configured');

    } catch (error) {
      logger.error('Article fact-check error:', error);
      return {
        overall_reliability: 0,
        key_claims: [],
        error: error.message
      };
    }
  }

  // Social media post fact-checking
  async factCheckSocialPost(postText, platform = 'unknown', metadata = {}) {
    try {
      const prompt = `
Fact-check this social media post for misinformation.

PLATFORM: ${platform}
POST: "${postText}"
METADATA: ${JSON.stringify(metadata)}

Return JSON:
{
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "misinformation_likelihood": 0-100,
  "claims_found": [
    {
      "claim": "extracted claim",
      "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED",
      "confidence": 0-100,
      "explanation": "brief explanation"
    }
  ],
  "warning_signs": ["red flags for misinformation"],
  "context_needed": ["additional context that would help"],
  "viral_potential": "LOW|MEDIUM|HIGH",
  "action_recommended": "NONE|VERIFY|FLAG|REMOVE"
}

Consider the platform's typical misinformation patterns.
`;
      await this.ensureClient('groq');
      await this.ensureClient('openai');
      const provider = await this.pickProvider();
      if (!provider) throw new Error('No AI provider configured');

      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1000
        });
        return JSON.parse(resp.choices[0].message.content);
      }
      if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1000
        });
        return JSON.parse(response.choices[0].message.content);
      }
      throw new Error('No AI provider configured');

    } catch (error) {
      logger.error('Social media fact-check error:', error);
      return {
        risk_level: 'MEDIUM',
        misinformation_likelihood: 50,
        error: error.message
      };
    }
  }

  // Batch fact-checking for multiple claims
  async batchFactCheck(claims) {
    const results = [];
    
    for (const claim of claims) {
      try {
        const result = await this.analyzeClaimWithConfidence(claim.text, claim.context);
        results.push({
          id: claim.id || Date.now() + Math.random(),
          original_claim: claim,
          analysis: result
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          id: claim.id || Date.now() + Math.random(),
          original_claim: claim,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Generate fact-check report
  async generateReport(factCheckResults) {
    try {
      const prompt = `
Generate a comprehensive fact-check report based on these results:

${JSON.stringify(factCheckResults, null, 2)}

Create a summary report in JSON format:
{
  "executive_summary": "Brief overview of findings",
  "overall_credibility": 0-100,
  "total_claims_checked": number,
  "verdicts_breakdown": {
    "true": number,
    "false": number,
    "partially_true": number,
    "unverified": number,
    "misleading": number
  },
  "high_confidence_findings": ["findings with >80% confidence"],
  "areas_of_concern": ["potential issues identified"],
  "recommendations": ["actionable recommendations"],
  "methodology_notes": "How the analysis was conducted"
}
`;
      await this.ensureClient('groq');
      await this.ensureClient('openai');
      const provider = await this.pickProvider();
      if (!provider) throw new Error('No AI provider configured');

      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        });
        return JSON.parse(resp.choices[0].message.content);
      }
      if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        });
        return JSON.parse(response.choices[0].message.content);
      }
      throw new Error('No AI provider configured');

    } catch (error) {
      logger.error('Report generation error:', error);
      return {
        executive_summary: 'Error generating report',
        error: error.message
      };
    }
  }

  // Calculate reliability score based on multiple factors
  calculateReliabilityScore(factCheckResults) {
    if (!factCheckResults || factCheckResults.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let weightedCount = 0;

    factCheckResults.forEach(result => {
      if (result.analysis && result.analysis.confidence_score) {
        const confidence = result.analysis.confidence_score;
        const verdict = result.analysis.verdict;
        
        let verdictWeight = 1;
        switch (verdict) {
          case 'TRUE':
            verdictWeight = 1;
            break;
          case 'PARTIALLY_TRUE':
            verdictWeight = 0.7;
            break;
          case 'MISLEADING':
            verdictWeight = 0.3;
            break;
          case 'FALSE':
            verdictWeight = 0;
            break;
          case 'UNVERIFIED':
            verdictWeight = 0.5;
            break;
          default:
            verdictWeight = 0.5;
        }

        totalScore += (confidence * verdictWeight);
        weightedCount += confidence;
      }
    });

    return weightedCount > 0 ? Math.round(totalScore / weightedCount) : 0;
  }
}

module.exports = AdvancedFactCheckService;
