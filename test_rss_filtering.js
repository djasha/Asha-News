// Test script to debug RSS filtering issues
import RSSAdapter from './src/adapters/rssAdapter.js';

async function testRSSFiltering() {
  console.log('=== Testing RSS Filtering ===\n');
  
  const rssAdapter = new RSSAdapter();
  
  // Test 1: Default fetch (no filters)
  console.log('1. Testing default fetch (no filters)...');
  try {
    const defaultArticles = await rssAdapter.fetchArticles({ limit: 5 });
    console.log(`Default fetch: ${defaultArticles.length} articles`);
    console.log('Sources:', [...new Set(defaultArticles.map(a => a.source_name))]);
    console.log('Countries:', [...new Set(defaultArticles.map(a => rssAdapter.sources.find(s => s.name === a.source_name)?.country))]);
    console.log('');
  } catch (error) {
    console.error('Default fetch failed:', error);
  }
  
  // Test 2: Exclude US sources
  console.log('2. Testing country exclusion (exclude US)...');
  try {
    const nonUSArticles = await rssAdapter.fetchArticles({ 
      countries: 'us',
      limit: 10 
    });
    console.log(`Non-US fetch: ${nonUSArticles.length} articles`);
    console.log('Sources:', [...new Set(nonUSArticles.map(a => a.source_name))]);
    console.log('Countries:', [...new Set(nonUSArticles.map(a => rssAdapter.sources.find(s => s.name === a.source_name)?.country))]);
    console.log('');
  } catch (error) {
    console.error('Country exclusion failed:', error);
  }
  
  // Test 3: Keyword search for "palestine"
  console.log('3. Testing keyword search for "palestine"...');
  try {
    const palestineArticles = await rssAdapter.fetchArticles({ 
      keywords: 'palestine',
      limit: 10 
    });
    console.log(`Palestine keyword search: ${palestineArticles.length} articles`);
    if (palestineArticles.length > 0) {
      console.log('Found articles:');
      palestineArticles.slice(0, 3).forEach(article => {
        console.log(`- ${article.title} (${article.source_name})`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('Keyword search failed:', error);
  }
  
  // Test 4: Combined filters
  console.log('4. Testing combined filters (palestine + exclude US)...');
  try {
    const combinedArticles = await rssAdapter.fetchArticles({ 
      keywords: 'palestine',
      countries: 'us',
      limit: 10 
    });
    console.log(`Combined filters: ${combinedArticles.length} articles`);
    if (combinedArticles.length > 0) {
      console.log('Found articles:');
      combinedArticles.slice(0, 3).forEach(article => {
        console.log(`- ${article.title} (${article.source_name})`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('Combined filters failed:', error);
  }
  
  // Test 5: Check available sources
  console.log('5. Available sources by country:');
  const stats = rssAdapter.getSourceStats();
  console.log('Source statistics:', stats);
  console.log('All sources:');
  rssAdapter.getAllSources().forEach(source => {
    console.log(`- ${source.name} (${source.country}, ${source.category})`);
  });
}

testRSSFiltering().catch(console.error);
