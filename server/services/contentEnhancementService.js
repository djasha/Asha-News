/**
 * Content Enhancement Service
 * AI-powered auto-population of article metadata, SEO, and analytics
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');
const Groq = require('groq-sdk');
const adminSettingsService = require('./adminSettingsService');

class ContentEnhancementService {
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
    // Try admin default first
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

  /**
   * Calculate word count from article content
   */
  calculateWordCount(content) {
    if (!content) return 0;
    
    // Remove HTML tags and count words
    const textContent = content.replace(/<[^>]*>/g, ' ');
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Calculate reading time based on word count
   * Average reading speed: 200-250 words per minute
   */
  calculateReadingTime(wordCount) {
    const wordsPerMinute = 225; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return Math.max(1, minutes); // Minimum 1 minute
  }

  /**
   * Calculate content difficulty score using various metrics
   */
  calculateDifficultyScore(content) {
    if (!content) return 0.5;

    const textContent = content.replace(/<[^>]*>/g, ' ');
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0.5;

    // Average sentence length
    const avgSentenceLength = words.length / sentences.length;
    
    // Average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Complex word count (words with 3+ syllables)
    const complexWords = words.filter(word => this.countSyllables(word) >= 3).length;
    const complexWordRatio = complexWords / words.length;
    
    // Flesch Reading Ease approximation
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgWordLength / 4.7);
    
    // Convert to 0-1 scale (higher = more difficult)
    let difficulty = Math.max(0, Math.min(1, (100 - fleschScore) / 100));
    
    // Adjust based on complex word ratio
    difficulty = (difficulty + complexWordRatio) / 2;
    
    return Math.round(difficulty * 100) / 100;
  }

  /**
   * Simple syllable counter
   */
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let syllables = 0;
    let prevWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !prevWasVowel) {
        syllables++;
      }
      prevWasVowel = isVowel;
    }
    
    // Handle silent 'e'
    if (word.endsWith('e')) {
      syllables--;
    }
    
    return Math.max(1, syllables);
  }

  /**
   * Generate SEO-optimized title using AI
   */
  async generateSEOTitle(title, content, category) {
    await this.ensureClient('groq');
    await this.ensureClient('openai');
    if (!this.openai && !this.groq) {
      // Fallback: optimize existing title
      return title.length <= 60 ? title : title.substring(0, 57) + '...';
    }
    
    try {
      const prompt = `
Create an SEO-optimized title (max 60 characters) for this news article:

Original Title: ${title}
Category: ${category}
Content Preview: ${content.substring(0, 500)}...

Requirements:
- Maximum 60 characters
- Include relevant keywords
- Compelling and clickable
- News-appropriate tone
- Avoid clickbait

Return only the optimized title, nothing else.
`;

      let seoTitle;
      const provider = await this.pickProvider();
      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.7
        });
        seoTitle = resp.choices[0].message.content.trim();
      } else if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.7
        });
        seoTitle = response.choices[0].message.content.trim();
      } else {
        // Fallback if no provider selected
        return title.length <= 60 ? title : title.substring(0, 57) + '...';
      }

      return seoTitle.length <= 60 ? seoTitle : seoTitle.substring(0, 57) + '...';
    } catch (error) {
      logger.error('Error generating SEO title:', error);
      return title.length <= 60 ? title : title.substring(0, 57) + '...';
    }
  }

  /**
   * Generate SEO meta description using AI
   */
  async generateSEODescription(title, content, category) {
    const provider = await this.pickProvider();
    if (!provider) {
      // Fallback: create description from content
      const textContent = content.replace(/<[^>]*>/g, ' ').trim();
      const fallback = textContent.substring(0, 152) + '...';
      return fallback;
    }
    
    try {
      const prompt = `
Create an SEO meta description (max 155 characters) for this news article:

Title: ${title}
Category: ${category}
Content Preview: ${content.substring(0, 800)}...

Requirements:
- Maximum 155 characters
- Compelling and informative
- Include key information
- Call-to-action if appropriate
- News-appropriate tone

Return only the meta description, nothing else.
`;

      let description;
      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7
        });
        description = resp.choices[0].message.content.trim();
      } else if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.7
        });
        description = response.choices[0].message.content.trim();
      } else {
        // Fallback
        const textContent = content.replace(/<[^>]*>/g, ' ').trim();
        return textContent.substring(0, 152) + '...';
      }

      return description.length <= 155 ? description : description.substring(0, 152) + '...';
    } catch (error) {
      logger.error('Error generating SEO description:', error);
      // Fallback: create description from content
      const textContent = content.replace(/<[^>]*>/g, ' ').trim();
      const fallback = textContent.substring(0, 152) + '...';
      return fallback;
    }
  }

  /**
   * Extract keywords using AI
   */
  async extractKeywords(title, content, category) {
    const provider = await this.pickProvider();
    if (!provider) {
      // Fallback: extract from title and category
      const fallbackKeywords = [category.toLowerCase()];
      const titleWords = title.toLowerCase().split(' ').filter(w => w.length > 3);
      fallbackKeywords.push(...titleWords.slice(0, 4));
      return fallbackKeywords;
    }
    
    try {
      const prompt = `
Extract 5-8 relevant SEO keywords from this news article:

Title: ${title}
Category: ${category}
Content: ${content.substring(0, 1000)}...

Requirements:
- Focus on main topics and entities
- Include category-relevant terms
- Mix of broad and specific keywords
- Avoid overly generic terms
- Return as comma-separated list

Return only the keywords, nothing else.
`;

      let keywordsText;
      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.5
        });
        keywordsText = resp.choices[0].message.content.trim();
      } else if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100,
          temperature: 0.5
        });
        keywordsText = response.choices[0].message.content.trim();
      } else {
        // Fallback heuristic
        const fallbackKeywords = [category.toLowerCase()];
        const titleWords = title.toLowerCase().split(' ').filter(w => w.length > 3);
        fallbackKeywords.push(...titleWords.slice(0, 4));
        return fallbackKeywords;
      }

      const keywords = keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0);
      return keywords.slice(0, 8); // Limit to 8 keywords
    } catch (error) {
      logger.error('Error extracting keywords:', error);
      // Fallback: extract from title and category
      const fallbackKeywords = [category.toLowerCase()];
      const titleWords = title.toLowerCase().split(' ').filter(w => w.length > 3);
      fallbackKeywords.push(...titleWords.slice(0, 4));
      return fallbackKeywords;
    }
  }

  /**
   * Generate article summary using AI
   */
  async generateSummary(content, maxLength = 200) {
    const provider = await this.pickProvider();
    if (!provider) {
      // Fallback: extract first paragraph
      const textContent = content.replace(/<[^>]*>/g, ' ').trim();
      const firstParagraph = textContent.split('\n')[0] || textContent.substring(0, maxLength);
      return firstParagraph.length <= maxLength ? firstParagraph : firstParagraph.substring(0, maxLength - 3) + '...';
    }
    
    try {
      const prompt = `
Create a concise summary of this news article (max ${maxLength} characters):

Content: ${content.substring(0, 2000)}...

Requirements:
- Maximum ${maxLength} characters
- Capture key facts and main points
- Neutral, journalistic tone
- Include important details
- Clear and readable

Return only the summary, nothing else.
`;

      let summary;
      const provider = await this.pickProvider();
      if (provider === 'groq' && this.groq) {
        const resp = await this.groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: Math.ceil(maxLength / 3),
          temperature: 0.5
        });
        summary = resp.choices[0].message.content.trim();
      } else if (provider === 'openai' && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: Math.ceil(maxLength / 3),
          temperature: 0.5
        });
        summary = response.choices[0].message.content.trim();
      } else {
        // Fallback
        const textContent = content.replace(/<[^>]*>/g, ' ').trim();
        const firstParagraph = textContent.split('\n')[0] || textContent.substring(0, maxLength);
        return firstParagraph.length <= maxLength ? firstParagraph : firstParagraph.substring(0, maxLength - 3) + '...';
      }

      return summary.length <= maxLength ? summary : summary.substring(0, maxLength - 3) + '...';
    } catch (error) {
      logger.error('Error generating summary:', error);
      // Fallback: extract first paragraph
      const textContent = content.replace(/<[^>]*>/g, ' ').trim();
      const firstParagraph = textContent.split('\n')[0] || textContent.substring(0, maxLength);
      return firstParagraph.length <= maxLength ? firstParagraph : firstParagraph.substring(0, maxLength - 3) + '...';
    }
  }

  /**
   * Enhance article with all AI-powered features
   */
  async enhanceArticle(article) {
    const { title, content, category } = article;
    
    if (!content) {
      logger.warn('No content provided for article enhancement');
      return article;
    }

    logger.info(`Enhancing article: ${title}`);

    try {
      // Calculate basic metrics
      const wordCount = this.calculateWordCount(content);
      const readingTime = this.calculateReadingTime(wordCount);
      const difficultyScore = this.calculateDifficultyScore(content);

      // Generate AI-powered content (run in parallel)
      const [seoTitle, seoDescription, keywords, summary] = await Promise.all([
        this.generateSEOTitle(title, content, category),
        this.generateSEODescription(title, content, category),
        this.extractKeywords(title, content, category),
        this.generateSummary(content)
      ]);

      // Return enhanced article data
      return {
        ...article,
        word_count: wordCount,
        reading_time: readingTime,
        difficulty_score: difficultyScore,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: keywords,
        summary: summary,
        enhanced_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error enhancing article:', error);
      
      // Return with basic enhancements only
      const wordCount = this.calculateWordCount(content);
      return {
        ...article,
        word_count: wordCount,
        reading_time: this.calculateReadingTime(wordCount),
        difficulty_score: this.calculateDifficultyScore(content)
      };
    }
  }

  /**
   * Batch enhance multiple articles
   */
  async enhanceArticles(articles, batchSize = 3) {
    const enhanced = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}`);
      
      const batchPromises = batch.map(article => this.enhanceArticle(article));
      const batchResults = await Promise.all(batchPromises);
      
      enhanced.push(...batchResults);
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return enhanced;
  }
}

module.exports = ContentEnhancementService;
