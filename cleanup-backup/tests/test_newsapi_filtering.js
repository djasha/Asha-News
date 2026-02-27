// Test script to verify NewsAPI filtering with Palestine keyword
import NewsAPIAdapter from './src/adapters/newsApiAdapter.js';

async function testNewsAPIFiltering() {
  console.log('=== Testing NewsAPI.org Filtering ===\n');
  
  const newsApiAdapter = new NewsAPIAdapter();
  
  // Test 1: Palestine keyword search
  console.log('1. Testing Palestine keyword search...');
  try {
    const palestineArticles = await newsApiAdapter.fetchArticles({ 
      keywords: 'palestine',
      limit: 10 
    });
    console.log(`Palestine articles found: ${palestineArticles.length}`);
    if (palestineArticles.length > 0) {
      console.log('Sample articles:');
      palestineArticles.slice(0, 3).forEach(article => {
        console.log(`- "${article.title}" (${article.source_name})`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('Palestine search failed:', error);
  }
  
  // Test 2: Palestine with UK focus (excluding US)
  console.log('2. Testing Palestine + UK focus...');
  try {
    const ukPalestineArticles = await newsApiAdapter.fetchArticles({ 
      keywords: 'palestine',
      countries: 'us', // This will exclude US and focus on UK
      limit: 10 
    });
    console.log(`Palestine + UK focus: ${ukPalestineArticles.length} articles`);
    if (ukPalestineArticles.length > 0) {
      console.log('Sample articles:');
      ukPalestineArticles.slice(0, 3).forEach(article => {
        console.log(`- "${article.title}" (${article.source_name})`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('Palestine + UK search failed:', error);
  }
  
  // Test 3: General news without filters
  console.log('3. Testing general news (no filters)...');
  try {
    const generalArticles = await newsApiAdapter.fetchArticles({ 
      limit: 5 
    });
    console.log(`General news: ${generalArticles.length} articles`);
    console.log('Sources:', [...new Set(generalArticles.map(a => a.source_name))]);
    console.log('');
  } catch (error) {
    console.error('General news failed:', error);
  }
  
  console.log('=== Test Complete ===');
}

testNewsAPIFiltering().catch(console.error);
