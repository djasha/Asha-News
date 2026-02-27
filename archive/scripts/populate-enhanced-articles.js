#!/usr/bin/env node

/**
 * Populate Enhanced Article Fields
 * Updates existing articles with AI-generated SEO, author info, and content analytics
 */

const ContentEnhancementService = require('./server/services/contentEnhancementService');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

const contentService = new ContentEnhancementService();

async function fetchArticles() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/articles?limit=100`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

async function updateArticle(articleId, updateData) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/articles/${articleId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to update article ${articleId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating article ${articleId}:`, error);
    return false;
  }
}

async function populateEnhancedFields() {
  console.log('🚀 Starting Enhanced Article Population...\n');

  // Fetch existing articles
  const articles = await fetchArticles();
  
  if (articles.length === 0) {
    console.log('❌ No articles found to enhance');
    return;
  }

  console.log(`📰 Found ${articles.length} articles to enhance\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] Processing: ${article.title}`);

    try {
      // Skip if article doesn't have content
      if (!article.content) {
        console.log('⚠️  Skipping - no content');
        continue;
      }

      // Prepare update data with default values
      const updateData = {
        // Set default author if missing
        author_name: article.author_name || 'Asha News',
        
        // Set default editorial status
        editorial_status: article.editorial_status || 'published',
        
        // Set default fact check status
        fact_check_status: article.fact_check_status || 'unverified',
        
        // Set default source credibility
        source_credibility: article.source_credibility || 0.8,
        
        // Set breaking news flag
        breaking_news: article.breaking_news || false
      };

      // Calculate content metrics
      if (article.content) {
        updateData.word_count = contentService.calculateWordCount(article.content);
        updateData.reading_time = contentService.calculateReadingTime(updateData.word_count);
        updateData.difficulty_score = contentService.calculateDifficultyScore(article.content);
      }

      // Generate AI-powered enhancements if OpenAI is available
      if (process.env.OPENAI_API_KEY) {
        console.log('🤖 Generating AI enhancements...');
        
        try {
          // Generate SEO fields if missing
          if (!article.seo_title) {
            updateData.seo_title = await contentService.generateSEOTitle(
              article.title, 
              article.content, 
              article.category || 'News'
            );
          }

          if (!article.seo_description) {
            updateData.seo_description = await contentService.generateSEODescription(
              article.title, 
              article.content, 
              article.category || 'News'
            );
          }

          if (!article.seo_keywords) {
            updateData.seo_keywords = await contentService.extractKeywords(
              article.title, 
              article.content, 
              article.category || 'News'
            );
          }

          // Generate summary if missing
          if (!article.summary) {
            updateData.summary = await contentService.generateSummary(article.content);
          }

          console.log('✅ AI enhancements generated');
        } catch (aiError) {
          console.log('⚠️  AI enhancement failed, using basic metrics only');
          console.error('AI Error:', aiError.message);
        }
      } else {
        console.log('⚠️  OpenAI API key not found, skipping AI enhancements');
      }

      // Update the article
      const success = await updateArticle(article.id, updateData);
      
      if (success) {
        successCount++;
        console.log('✅ Article updated successfully');
      } else {
        errorCount++;
        console.log('❌ Failed to update article');
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing article ${article.id}:`, error.message);
    }
  }

  console.log(`\n📊 Population Complete:`);
  console.log(`✅ Successfully enhanced: ${successCount}/${articles.length} articles`);
  console.log(`❌ Failed: ${errorCount}/${articles.length} articles`);

  if (successCount > 0) {
    console.log('\n🎉 Articles have been enhanced with:');
    console.log('   • Author information');
    console.log('   • Content analytics (word count, reading time, difficulty)');
    console.log('   • Editorial workflow fields');
    console.log('   • Fact-checking status');
    if (process.env.OPENAI_API_KEY) {
      console.log('   • AI-generated SEO metadata');
      console.log('   • AI-generated summaries');
      console.log('   • AI-extracted keywords');
    }
    console.log('\n📝 Next steps:');
    console.log('   1. Check Directus admin panel to verify enhancements');
    console.log('   2. Update frontend components to display new fields');
    console.log('   3. Test article filtering and search functionality');
  }
}

// Run the population
populateEnhancedFields().catch(console.error);
