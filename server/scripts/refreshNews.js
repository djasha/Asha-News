#!/usr/bin/env node

/**
 * Refresh news script - fetches fresh RSS articles and creates clusters
 * Run this periodically (e.g., every hour via cron) to keep news updated
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function refreshNews() {
  console.log('🔄 Starting news refresh...');
  
  try {
    // Step 1: Ingest fresh articles from RSS feeds
    console.log('📥 Fetching RSS articles...');
    const ingestResponse = await axios.post(`${API_BASE}/api/rss/ingest-from-content`, {
      hours_back: 24,        // Get articles from last 24 hours
      min_per_category: 10,  // Ensure at least 10 articles per category
      max_feeds: 50          // Process up to 50 feeds
    });
    
    let totalArticles = 0;
    if (ingestResponse.data.success) {
      const { processed_feeds, summary } = ingestResponse.data;
      console.log(`✅ Processed ${processed_feeds} RSS feeds`);
      
      // Count total articles
      totalArticles = Object.values(summary)
        .reduce((sum, cat) => sum + (cat.upserted || 0), 0);
      console.log(`📰 Imported ${totalArticles} articles across categories`);
    }
    
    // Wait a bit for articles to be fully saved
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Create clusters from recent articles
    console.log('🔗 Creating story clusters...');
    const clusterResponse = await axios.post(`${API_BASE}/api/clusters/auto-cluster`, {
      hours_back: 24,        // Cluster articles from last 24 hours
      threshold: 0.75,       // Similarity threshold
      max_articles: 200      // Max articles to process
    });
    
    if (clusterResponse.data.success) {
      const { clusters_created, articles_processed } = clusterResponse.data;
      console.log(`✅ Created ${clusters_created} clusters from ${articles_processed} articles`);
    }
    
    // Step 3: Clean up old clusters (optional)
    console.log('🧹 Cleaning up old clusters...');
    const cleanupResponse = await axios.post(`${API_BASE}/api/clusters/cleanup`, {
      days_old: 7  // Remove clusters older than 7 days
    }).catch(() => null); // Ignore if endpoint doesn't exist
    
    if (cleanupResponse?.data?.success) {
      console.log(`✅ Cleaned up ${cleanupResponse.data.deleted} old clusters`);
    }
    
    console.log('✨ News refresh complete!');
    
    // Return success status
    return {
      success: true,
      articles_imported: totalArticles || 0,
      clusters_created: clusterResponse.data.clusters_created || 0
    };
    
  } catch (error) {
    console.error('❌ Error refreshing news:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  refreshNews().then(result => {
    console.log('\n📊 Summary:', result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = refreshNews;
