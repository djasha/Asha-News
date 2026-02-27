// Test script to verify NewsAPI.ai filtering with Palestine keyword
import NewsApiAiAdapter from './src/adapters/newsApiAiAdapter.js';

async function testNewsApiAiFiltering() {
  console.log('=== Testing NewsAPI.ai (Event Registry) Filtering ===\n');
  
  const newsApiAiAdapter = new NewsApiAiAdapter();
  
  // Test 1: Palestine keyword search
  console.log('1. Testing Palestine keyword search...');
  try {
    const palestineArticles = await newsApiAiAdapter.fetchArticles({ 
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
  
  // Test 2: Palestine with international focus (excluding US)
  console.log('2. Testing Palestine + international focus...');
  try {
    const intlPalestineArticles = await newsApiAiAdapter.fetchArticles({ 
      keywords: 'palestine',
      countries: 'us', // This will exclude US sources
      limit: 10 
    });
    console.log(`Palestine + international focus: ${intlPalestineArticles.length} articles`);
    if (intlPalestineArticles.length > 0) {
      console.log('Sample articles:');
      intlPalestineArticles.slice(0, 3).forEach(article => {
        console.log(`- "${article.title}" (${article.source_name})`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('Palestine + international search failed:', error);
  }
  
  // Test 3: Business category filtering
  console.log('3. Testing business category...');
  try {
    const businessArticles = await newsApiAiAdapter.fetchArticles({ 
      category: 'business',
      limit: 5 
    });
    console.log(`Business articles: ${businessArticles.length} articles`);
    console.log('Sources:', [...new Set(businessArticles.map(a => a.source_name))]);
    console.log('');
  } catch (error) {
    console.error('Business category failed:', error);
  }
  
  // Test 4: Connection test
  console.log('4. Testing API connection...');
  try {
    const connectionTest = await newsApiAiAdapter.testConnection();
    console.log('Connection test result:', connectionTest);
    console.log('');
  } catch (error) {
    console.error('Connection test failed:', error);
  }
  
  console.log('=== NewsAPI.ai Test Complete ===');
}

testNewsApiAiFiltering().catch(console.error);
