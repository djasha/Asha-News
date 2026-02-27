#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3001/api/cms';

// Test all CMS endpoints
const endpoints = [
  // Core collections
  { path: '/articles', name: 'Articles' },
  { path: '/news-sources', name: 'News Sources' },
  { path: '/trending-topics', name: 'Trending Topics' },
  { path: '/fact-check-claims', name: 'Fact Check Claims' },
  { path: '/story-clusters', name: 'Story Clusters' },
  { path: '/user-preferences', name: 'User Preferences' },
  
  // Phase 1 collections
  { path: '/tags', name: 'Tags' },
  { path: '/article-series', name: 'Article Series' },
  { path: '/sitemap-entries', name: 'Sitemap Entries' },
  
  // Phase 2 collections
  { path: '/user-activity', name: 'User Activity' },
  { path: '/user-subscriptions', name: 'User Subscriptions' },
  { path: '/user-sessions', name: 'User Sessions' },
  
  // Phase 3 collections
  { path: '/dashboard-widgets', name: 'Dashboard Widgets' },
  { path: '/user-dashboard-layouts', name: 'User Dashboard Layouts' },
  { path: '/reading-statistics', name: 'Reading Statistics' },
  
  // PRD collections
  { path: '/ai-analysis-logs', name: 'AI Analysis Logs' },
  { path: '/bias-reports', name: 'Bias Reports' },
  { path: '/content-moderation', name: 'Content Moderation' },
  { path: '/email-templates', name: 'Email Templates' },
  { path: '/notification-queue', name: 'Notification Queue' },
  { path: '/search-analytics', name: 'Search Analytics' },
  { path: '/api-usage-logs', name: 'API Usage Logs' },
  
  // Analytics endpoints
  { path: '/tags/trending', name: 'Trending Tags' },
  { path: '/user-analytics/test-user-123', name: 'User Analytics' }
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}?limit=5`);
    const data = await response.json();
    
    if (response.ok) {
      const count = data.data ? data.data.length : (data.articles ? data.articles.length : 0);
      console.log(`✅ ${endpoint.name}: ${response.status} - ${count} items`);
      return true;
    } else {
      console.log(`❌ ${endpoint.name}: ${response.status} - ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing all CMS endpoints...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All endpoints are working correctly!');
  } else {
    console.log('\n⚠️  Some endpoints need attention.');
  }
}

// Run the tests
runTests().catch(console.error);
