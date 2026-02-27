#!/usr/bin/env node

// Test script for all new collection endpoints
const API_BASE = 'http://localhost:3001/api/cms';

const endpoints = [
  // Phase 1: Core Content Collections
  '/tags',
  '/tags/trending',
  '/article-series',
  '/sitemap-entries',
  
  // Phase 2: User Management Collections
  '/user-activity',
  '/user-subscriptions', 
  '/user-sessions',
  
  // Phase 3: Dashboard Collections
  '/dashboard-widgets',
  '/user-dashboard-layouts',
  '/reading-statistics',
  
  // Analytics endpoints
  '/user-analytics/test-user-id',
  '/articles/enhanced'
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    const data = await response.json();
    
    console.log(`✅ ${endpoint}: ${response.status} - ${data.data ? data.data.length : 0} items`);
    return true;
  } catch (error) {
    console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing New Collection Endpoints...');
  console.log('============================================');
  
  let passed = 0;
  let total = endpoints.length;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) passed++;
  }
  
  console.log('============================================');
  console.log(`📊 Results: ${passed}/${total} endpoints working`);
  
  if (passed === total) {
    console.log('🎉 All new collection endpoints are functional!');
  } else {
    console.log('⚠️  Some endpoints need attention');
  }
}

runTests().catch(console.error);
