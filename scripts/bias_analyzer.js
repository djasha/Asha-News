/*
  AI Bias Analyzer for Asha.News
  - Prefers Groq Llama 3.1 to analyze article bias, tone, and factual content
  - Falls back to OpenAI GPT-4 if Groq is not configured
  - Returns structured analysis data
*/

const OpenAI = require('openai');
const Groq = require('groq-sdk');

class BiasAnalyzer {
  constructor(apiKey) {
    this.groq = null;
    this.openai = null;
    this.provider = 'none';

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
      this.provider = 'groq';
      return;
    }

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.provider = 'openai';
      return;
    }

    throw new Error('No AI provider configured. Set GROQ_API_KEY or provide OpenAI API key.');
  }

  async analyzeArticle(title, summary, sourceId = '') {
    const prompt = this.createAnalysisPrompt(title, summary, sourceId);
    
    try {
      let response;
      if (this.groq) {
        const completion = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an expert media bias analyst. Analyze news articles objectively and return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 700
        });
        response = completion.choices[0].message.content.trim();
      } else if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an expert media bias analyst. Analyze news articles objectively and return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 500
        });
        response = completion.choices[0].message.content.trim();
      } else {
        throw new Error('No AI client available');
      }
      
      // Parse JSON response
      let analysis;
      try {
        analysis = JSON.parse(response);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        console.warn('Failed to parse OpenAI response as JSON:', response);
        return this.createFallbackAnalysis();
      }

      // Validate and normalize the response
      return this.validateAnalysis(analysis);
      
    } catch (error) {
      console.error('AI API error:', error.message);
      return this.createFallbackAnalysis();
    }
  }

  createAnalysisPrompt(title, summary, sourceId) {
    return `Analyze this news article for political bias and content characteristics:

Title: "${title}"
Summary: "${summary}"
Source: ${sourceId}

Return a JSON object with exactly these fields:
{
  "political_bias": "left|center|right",
  "confidence": 0.85,
  "emotional_tone": "neutral|positive|negative",
  "factual_ratio": 0.75,
  "explanation": "Brief explanation of the analysis (max 100 words)"
}

Guidelines:
- political_bias: Determine if content leans left, right, or is center/neutral
- confidence: How confident you are in the bias assessment (0.0-1.0)
- emotional_tone: Overall emotional framing of the content
- factual_ratio: Ratio of factual reporting vs opinion/speculation (0.0-1.0)
- explanation: Concise reasoning for your assessment

Return only the JSON object, no other text.`;
  }

  validateAnalysis(analysis) {
    const defaults = this.createFallbackAnalysis();
    
    return {
      political_bias: ['left', 'center', 'right'].includes(analysis.political_bias) 
        ? analysis.political_bias : defaults.political_bias,
      confidence: this.clamp(analysis.confidence, 0, 1) || defaults.confidence,
      emotional_tone: ['neutral', 'positive', 'negative'].includes(analysis.emotional_tone)
        ? analysis.emotional_tone : defaults.emotional_tone,
      factual_ratio: this.clamp(analysis.factual_ratio, 0, 1) || defaults.factual_ratio,
      explanation: typeof analysis.explanation === 'string' && analysis.explanation.length > 0
        ? analysis.explanation.substring(0, 200) : defaults.explanation
    };
  }

  createFallbackAnalysis() {
    return {
      political_bias: 'center',
      confidence: 0.5,
      emotional_tone: 'neutral',
      factual_ratio: 0.7,
      explanation: 'AI analysis unavailable - using default neutral assessment.'
    };
  }

  clamp(value, min, max) {
    if (typeof value !== 'number' || isNaN(value)) return null;
    return Math.max(min, Math.min(max, value));
  }
}

module.exports = BiasAnalyzer;
