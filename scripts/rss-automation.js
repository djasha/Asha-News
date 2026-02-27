#!/usr/bin/env node

/**
 * RSS Feed Automation System
 * Fetches articles from all enabled RSS sources in Directus and stores them
 */

const RSSParser = require('rss-parser');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

// Import AI Analysis Service
const AIAnalysisService = require('../server/services/aiAnalysisService');

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN must be set before running rss-automation.js');
}

class RSSAutomationService {
  constructor() {
    this.parser = new RSSParser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Asha.News RSS Fetcher 1.0'
      }
    });
    this.aiAnalysis = new AIAnalysisService();
    this.processedCount = 0;
    this.errorCount = 0;
    this.duplicateCount = 0;
  }

  async makeDirectusRequest(endpoint, method = 'GET', data = null) {
    const fetch = (await import('node-fetch')).default;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async getEnabledRSSSources() {
    try {
      const response = await this.makeDirectusRequest('/items/rss_sources?filter[enabled][_eq]=true');
      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching RSS sources:', error.message);
      return [];
    }
  }

  async checkArticleExists(url, title) {
    try {
      // Check by URL first (most reliable)
      const urlCheck = await this.makeDirectusRequest(
        `/items/articles?filter[url][_eq]=${encodeURIComponent(url)}&limit=1`
      );
      
      if (urlCheck.data && urlCheck.data.length > 0) {
        return true;
      }

      // Check by title as fallback
      const titleCheck = await this.makeDirectusRequest(
        `/items/articles?filter[title][_eq]=${encodeURIComponent(title)}&limit=1`
      );
      
      return titleCheck.data && titleCheck.data.length > 0;
    } catch (error) {
      console.error('Error checking article existence:', error.message);
      return false;
    }
  }

  async saveArticleToDirectus(article, source) {
    try {
      // Check if article already exists
      const exists = await this.checkArticleExists(article.link, article.title);
      if (exists) {
        this.duplicateCount++;
        return null;
      }

      // Safely extract and clean data
      const title = String(article.title || 'Untitled').substring(0, 255);
      const content = String(article.content || article.contentSnippet || article.summary || '');
      const url = String(article.link || '');
      const author = article.creator || article.author;
      const excerpt = String(article.contentSnippet || '').substring(0, 500);

      // Perform AI bias analysis on the article
      console.log(`   🤖 Analyzing bias for: ${title.substring(0, 50)}...`);
      const aiAnalysis = await this.aiAnalysis.analyzeArticle({
        title,
        content,
        summary: excerpt,
        source_name: source.name
      });

      const directusArticle = {
        title,
        content,
        url,
        published: true,
        author_name: author ? String(author) : String(source.name || 'Unknown'),
        political_bias: aiAnalysis.bias_analysis.bias_direction || String(source.bias_rating || 'center'),
        credibility_score: Math.round(aiAnalysis.quality_assessment.credibility_score * 10) || Number(source.credibility_score || 7),
        seo_description: excerpt,
        byline: String(source.name || ''),
        language: 'en',
        article_type: String(source.category || 'general'),
        fact_check_status: 'unverified',
        editorial_status: 'published',
        // Store AI analysis results
        ai_bias_score: aiAnalysis.bias_analysis.bias_score,
        ai_confidence: aiAnalysis.bias_analysis.confidence,
        ai_objectivity_score: aiAnalysis.bias_analysis.objectivity_score,
        ai_emotional_tone: aiAnalysis.emotional_analysis.primary_emotion,
        ai_sentiment_score: aiAnalysis.emotional_analysis.sentiment_score,
        ai_overall_score: aiAnalysis.overall_score,
        ai_analysis_summary: aiAnalysis.bias_analysis.reasoning
      };

      const result = await this.makeDirectusRequest('/items/articles', 'POST', directusArticle);
      this.processedCount++;
      
      console.log(`   ✅ AI Analysis: ${aiAnalysis.bias_analysis.bias_direction} (${Math.round(aiAnalysis.bias_analysis.confidence * 100)}% confidence)`);
      
      return result.data;
    } catch (error) {
      console.error(`❌ Error saving article "${article.title}":`, error.message);
      this.errorCount++;
      return null;
    }
  }

  async fetchRSSFeed(source) {
    try {
      console.log(`📡 Fetching: ${source.name} (${source.bias_rating})`);
      
      const feed = await this.parser.parseURL(source.url);
      
      if (!feed.items || feed.items.length === 0) {
        console.log(`   ⚠️  No items found in feed`);
        return { success: 0, errors: 0, duplicates: 0 };
      }

      let sourceSuccess = 0;
      let sourceErrors = 0;
      let sourceDuplicates = 0;

      // Process each article in the feed
      for (const item of feed.items.slice(0, 10)) { // Limit to 10 most recent articles
        const initialProcessed = this.processedCount;
        const initialDuplicates = this.duplicateCount;
        const initialErrors = this.errorCount;

        await this.saveArticleToDirectus(item, source);

        // Track source-specific stats
        if (this.processedCount > initialProcessed) sourceSuccess++;
        if (this.duplicateCount > initialDuplicates) sourceDuplicates++;
        if (this.errorCount > initialErrors) sourceErrors++;

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Update source last_fetched timestamp
      await this.makeDirectusRequest(`/items/rss_sources/${source.id}`, 'PATCH', {
        last_fetched: new Date().toISOString(),
        error_count: 0,
        status: 'active'
      });

      console.log(`   ✅ ${sourceSuccess} new, ${sourceDuplicates} duplicates, ${sourceErrors} errors`);
      
      return { success: sourceSuccess, errors: sourceErrors, duplicates: sourceDuplicates };

    } catch (error) {
      console.error(`   ❌ Failed to fetch ${source.name}:`, error.message);
      
      // Update source error count
      try {
        await this.makeDirectusRequest(`/items/rss_sources/${source.id}`, 'PATCH', {
          error_count: (source.error_count || 0) + 1,
          status: source.error_count > 5 ? 'error' : 'active'
        });
      } catch (updateError) {
        console.error('Error updating source status:', updateError.message);
      }

      return { success: 0, errors: 1, duplicates: 0 };
    }
  }

  async runAutomation() {
    try {
      console.log('🚀 Starting RSS Feed Automation');
      console.log('================================');
      
      const startTime = Date.now();
      
      // Get all enabled RSS sources
      const sources = await this.getEnabledRSSSources();
      
      if (sources.length === 0) {
        console.log('⚠️  No enabled RSS sources found');
        return;
      }

      console.log(`📊 Found ${sources.length} enabled RSS sources`);
      
      // Reset counters
      this.processedCount = 0;
      this.errorCount = 0;
      this.duplicateCount = 0;

      let totalSuccess = 0;
      let totalErrors = 0;
      let totalDuplicates = 0;

      // Process each source
      for (const source of sources) {
        const result = await this.fetchRSSFeed(source);
        totalSuccess += result.success;
        totalErrors += result.errors;
        totalDuplicates += result.duplicates;
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log('\n📊 RSS Automation Summary');
      console.log('=========================');
      console.log(`⏱️  Duration: ${duration} seconds`);
      console.log(`📰 Sources processed: ${sources.length}`);
      console.log(`✅ New articles: ${totalSuccess}`);
      console.log(`🔄 Duplicates skipped: ${totalDuplicates}`);
      console.log(`❌ Errors: ${totalErrors}`);
      
      // Display bias distribution of new articles
      if (totalSuccess > 0) {
        console.log('\n🎯 New Articles by Bias:');
        const biasStats = {};
        for (const source of sources) {
          const bias = source.bias_rating || 'center';
          biasStats[bias] = (biasStats[bias] || 0) + 1;
        }
        Object.entries(biasStats).forEach(([bias, count]) => {
          console.log(`   ${bias.toUpperCase()}: ~${Math.round(count * totalSuccess / sources.length)} articles`);
        });
      }

      return {
        duration,
        sourcesProcessed: sources.length,
        newArticles: totalSuccess,
        duplicates: totalDuplicates,
        errors: totalErrors
      };

    } catch (error) {
      console.error('💥 RSS Automation failed:', error.message);
      throw error;
    }
  }
}

async function main() {
  const automation = new RSSAutomationService();
  
  try {
    const result = await automation.runAutomation();
    
    if (result.newArticles > 0) {
      console.log('\n🔗 Next Steps:');
      console.log('1. Check articles in Directus: http://168.231.111.192:8055/admin/content/articles');
      console.log('2. View articles on frontend: http://localhost:3000');
      console.log('3. Set up cron job for regular automation');
    }
    
  } catch (error) {
    console.error('Automation failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = RSSAutomationService;

// Run if called directly
if (require.main === module) {
  main();
}
