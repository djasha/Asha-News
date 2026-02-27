#!/usr/bin/env node

/**
 * Test script to verify article IDs are preserved during clustering
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const DirectusService = require('../services/directusService');
const directus = new DirectusService();

async function test() {
  console.log('🧪 Testing Article ID Preservation\n');
  
  try {
    // Step 1: Fetch articles
    console.log('1️⃣  Fetching articles from Directus...');
    const articles = await directus.getArticles({
      limit: 10,
      status: 'published'
    });
    
    console.log(`   ✅ Fetched ${articles.length} articles`);
    console.log(`   First article:`, {
      id: articles[0]?.id,
      title: articles[0]?.title?.substring(0, 50),
      hasId: !!articles[0]?.id
    });
    
    // Step 2: Check if IDs are present
    const articlesWithIds = articles.filter(a => a.id).length;
    const articlesWithoutIds = articles.length - articlesWithIds;
    
    console.log(`\n2️⃣  ID Check:`);
    console.log(`   ✅ Articles with IDs: ${articlesWithIds}`);
    console.log(`   ❌ Articles without IDs: ${articlesWithoutIds}`);
    
    if (articlesWithoutIds > 0) {
      console.log(`\n❌ PROBLEM: ${articlesWithoutIds} articles missing IDs!`);
      console.log('   Sample article without ID:', articles.find(a => !a.id));
    } else {
      console.log(`\n✅ SUCCESS: All articles have IDs`);
    }
    
    // Step 3: Test saving cluster articles
    if (articlesWithIds >= 2) {
      console.log(`\n3️⃣  Testing saveClusterArticles...`);
      const testArticleIds = articles.slice(0, 2).map(a => a.id);
      console.log(`   Article IDs to link: [${testArticleIds.join(', ')}]`);
      
      await directus.saveClusterArticles(3442, testArticleIds);
      console.log(`   ✅ Successfully linked articles to cluster 3442`);
    }
    
    console.log(`\n✅ Test complete!`);
    
  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test().then(() => process.exit(0));
