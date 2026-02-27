/**
 * Cleanup Old Articles Script
 * Deletes articles older than the latest 300 to keep database clean
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: DIRECTUS_TOKEN not found in environment variables');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function getArticleCount() {
  try {
    const response = await axios.get(`${DIRECTUS_URL}/items/articles`, {
      headers,
      params: {
        limit: 1,
        meta: 'total_count'
      }
    });
    
    return response.data.meta?.total_count || 0;
  } catch (error) {
    console.error('Error getting article count:', error.message);
    return 0;
  }
}

async function getOldArticleIds(keepLatest = 300) {
  try {
    console.log(`\n📊 Fetching articles to identify old ones (keeping latest ${keepLatest})...`);
    
    // Get all article IDs sorted by date (newest first)
    const response = await axios.get(`${DIRECTUS_URL}/items/articles`, {
      headers,
      params: {
        fields: 'id,published_at,title',
        sort: '-published_at,-id',
        limit: -1  // Get all
      }
    });
    
    const articles = response.data.data || [];
    console.log(`✓ Found ${articles.length} total articles`);
    
    if (articles.length <= keepLatest) {
      console.log(`✓ No cleanup needed. Article count (${articles.length}) is within limit (${keepLatest})`);
      return [];
    }
    
    // Get articles to delete (everything after the first keepLatest articles)
    const articlesToDelete = articles.slice(keepLatest);
    console.log(`📝 Will delete ${articlesToDelete.length} old articles`);
    
    return articlesToDelete.map(a => a.id);
  } catch (error) {
    console.error('Error fetching old articles:', error.message);
    return [];
  }
}

async function deleteArticles(articleIds) {
  if (articleIds.length === 0) {
    console.log('✓ No articles to delete');
    return 0;
  }
  
  console.log(`\n🗑️  Deleting ${articleIds.length} old articles...`);
  let deletedCount = 0;
  let errorCount = 0;
  
  // Delete in batches of 50
  const batchSize = 50;
  for (let i = 0; i < articleIds.length; i += batchSize) {
    const batch = articleIds.slice(i, i + batchSize);
    
    try {
      // Directus allows batch delete with comma-separated IDs
      await axios.delete(`${DIRECTUS_URL}/items/articles/${batch.join(',')}`, {
        headers
      });
      
      deletedCount += batch.length;
      console.log(`  ✓ Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articleIds.length / batchSize)} (${deletedCount}/${articleIds.length})`);
    } catch (error) {
      errorCount += batch.length;
      console.error(`  ✗ Error deleting batch: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Deleted: ${deletedCount} articles`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} articles`);
  }
  
  return deletedCount;
}

async function main() {
  console.log('🧹 Article Cleanup Script');
  console.log('═══════════════════════════════════════\n');
  console.log(`📍 Directus URL: ${DIRECTUS_URL}`);
  console.log(`📄 Policy: Keep latest 300 articles\n`);
  
  try {
    // Get current count
    const totalCount = await getArticleCount();
    console.log(`📊 Current article count: ${totalCount}`);
    
    if (totalCount <= 300) {
      console.log('✅ No cleanup needed. Article count is within limit.');
      return;
    }
    
    console.log(`⚠️  Exceeds limit by ${totalCount - 300} articles`);
    
    // Get IDs of old articles
    const oldArticleIds = await getOldArticleIds(300);
    
    if (oldArticleIds.length === 0) {
      console.log('✓ No articles to delete');
      return;
    }
    
    // Confirm deletion
    console.log(`\n⚠️  About to delete ${oldArticleIds.length} articles`);
    console.log('   This action cannot be undone!');
    
    // Delete articles
    const deletedCount = await deleteArticles(oldArticleIds);
    
    // Get new count
    const newCount = await getArticleCount();
    console.log(`\n📊 New article count: ${newCount}`);
    console.log(`✅ Freed up space from ${totalCount} → ${newCount} articles`);
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Unhandled Error:', error);
    process.exit(1);
  });
}

module.exports = { getOldArticleIds, deleteArticles };
