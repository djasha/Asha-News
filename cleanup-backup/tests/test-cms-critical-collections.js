#!/usr/bin/env node

/**
 * Test Script for Critical CMS Collections
 * Tests the new fact_check_claims, story_clusters, and user_preferences endpoints
 */

// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3001/api/cms';

// Test data
const testFactCheckClaim = {
  claim_text: "Test claim: The sky is blue during daytime",
  claimant: "Test User",
  verdict: "true",
  confidence_score: 0.95,
  evidence_summary: "Scientific evidence supports this claim about sky color.",
  claim_category: "science",
  published: true
};

const testStoryCluster = {
  cluster_title: "Test Story Cluster: Climate Change Updates",
  cluster_summary: "A collection of articles about recent climate change developments.",
  main_topic: "climate-change",
  source_count: 3,
  article_count: 5,
  bias_distribution: {
    left: 30,
    center: 40,
    right: 30
  },
  trending_score: 75.5,
  featured: true,
  status: "active"
};

const testUserPreferences = {
  user_id: "test-user-123",
  bias_tolerance: "moderate",
  preferred_topics: ["politics", "technology", "science"],
  theme: "dark",
  language_preference: "en",
  breaking_news_alerts: true,
  daily_brief_time: "08:00:00",
  personalization: true
};

async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log(`\n🧪 Testing ${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Success: ${response.status}`);
      if (result.data) {
        console.log(`📊 Data received: ${Array.isArray(result.data) ? result.data.length + ' items' : 'Single item'}`);
      }
      return result.data;
    } else {
      console.log(`❌ Failed: ${response.status} - ${result.error}`);
      return null;
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting CMS Critical Collections Integration Tests');
  console.log('==================================================');

  // Test 1: Fact Check Claims
  console.log('\n📋 TESTING FACT CHECK CLAIMS');
  console.log('-----------------------------');
  
  // GET all claims
  await testEndpoint('GET', '/fact-check-claims');
  
  // GET with filters
  await testEndpoint('GET', '/fact-check-claims?published=true&limit=10');
  
  // POST new claim (if server supports it)
  const newClaim = await testEndpoint('POST', '/fact-check-claims', testFactCheckClaim);
  
  // GET specific claim (if created)
  if (newClaim && newClaim.id) {
    await testEndpoint('GET', `/fact-check-claims/${newClaim.id}`);
  }

  // Test 2: Story Clusters
  console.log('\n🔗 TESTING STORY CLUSTERS');
  console.log('-------------------------');
  
  // GET all clusters
  await testEndpoint('GET', '/story-clusters');
  
  // GET with filters
  await testEndpoint('GET', '/story-clusters?status=active&featured=true');
  
  // POST new cluster (if server supports it)
  const newCluster = await testEndpoint('POST', '/story-clusters', testStoryCluster);
  
  // GET specific cluster (if created)
  if (newCluster && newCluster.id) {
    await testEndpoint('GET', `/story-clusters/${newCluster.id}`);
  }

  // Test 3: User Preferences
  console.log('\n⚙️  TESTING USER PREFERENCES');
  console.log('----------------------------');
  
  // GET all preferences
  await testEndpoint('GET', '/user-preferences');
  
  // GET by user ID
  await testEndpoint('GET', '/user-preferences?user_id=test-user-123');
  
  // POST new preferences (if server supports it)
  const newPrefs = await testEndpoint('POST', '/user-preferences', testUserPreferences);
  
  // GET specific preferences (if created)
  if (newPrefs && newPrefs.id) {
    await testEndpoint('GET', `/user-preferences/${newPrefs.id}`);
  }

  // Test 4: Existing Endpoints (Regression Test)
  console.log('\n🔄 TESTING EXISTING ENDPOINTS');
  console.log('-----------------------------');
  
  await testEndpoint('GET', '/site-config');
  await testEndpoint('GET', '/navigation?location=header');
  await testEndpoint('GET', '/topics');
  await testEndpoint('GET', '/trending-topics');
  await testEndpoint('GET', '/breaking-news');

  console.log('\n🎉 All tests completed!');
  console.log('======================');
  console.log('\nNext steps:');
  console.log('1. Create the Directus collections using the shell scripts');
  console.log('2. Add sample data to test the integration');
  console.log('3. Update frontend components to use the new endpoints');
}

// Run tests
runTests().catch(console.error);
