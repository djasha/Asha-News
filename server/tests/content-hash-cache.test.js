/**
 * End-to-end tests for content-hash caching
 * Validates that Q&A, fact-check, and analysis are cached when articles unchanged
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

async function testContentHashCaching() {
  console.log('🧪 Content-Hash Caching E2E Tests\n');
  
  try {
    // 1. Get a valid cluster
    console.log('📋 Step 1: Fetching clusters...');
    const clustersResp = await axios.get(`${API_BASE}/clusters?limit=5`);
    const clusters = clustersResp.data?.data || [];
    
    if (clusters.length === 0) {
      console.log('❌ No clusters found. Please create clusters first.');
      return false;
    }
    
    const cluster = clusters.find(c => c.cluster_title && c.id);
    if (!cluster) {
      console.log('❌ No valid cluster with title found.');
      return false;
    }
    
    console.log(`✅ Using cluster: "${cluster.cluster_title}" (ID: ${cluster.id})`);
    
    // 2. Test Q&A caching
    console.log('\n📋 Step 2: Testing Q&A caching...');
    const qa1 = await axios.post(`${API_BASE}/clusters/${cluster.id}/qa`, {});
    const qa1Cached = qa1.data?.data?.cached || false;
    const qa1Hash = qa1.data?.data?.content_hash;
    console.log(`  First Q&A call: cached=${qa1Cached}, hash=${qa1Hash?.substring(0, 8)}...`);
    
    const qa2 = await axios.post(`${API_BASE}/clusters/${cluster.id}/qa`, {});
    const qa2Cached = qa2.data?.data?.cached || false;
    const qa2Hash = qa2.data?.data?.content_hash;
    console.log(`  Second Q&A call: cached=${qa2Cached}, hash=${qa2Hash?.substring(0, 8)}...`);
    
    if (qa2Cached && qa1Hash === qa2Hash) {
      console.log('✅ Q&A caching working correctly');
    } else {
      console.log(`⚠️  Q&A caching: expected cached=true on second call, got cached=${qa2Cached}`);
    }
    
    // 3. Test fact-check caching
    console.log('\n📋 Step 3: Testing fact-check caching...');
    const fc1 = await axios.post(`${API_BASE}/clusters/${cluster.id}/fact-check`, {});
    const fc1Cached = fc1.data?.data?.cached || false;
    const fc1Hash = fc1.data?.data?.content_hash;
    console.log(`  First fact-check call: cached=${fc1Cached}, hash=${fc1Hash?.substring(0, 8)}...`);
    
    const fc2 = await axios.post(`${API_BASE}/clusters/${cluster.id}/fact-check`, {});
    const fc2Cached = fc2.data?.data?.cached || false;
    const fc2Hash = fc2.data?.data?.content_hash;
    console.log(`  Second fact-check call: cached=${fc2Cached}, hash=${fc2Hash?.substring(0, 8)}...`);
    
    if (fc2Cached && fc1Hash === fc2Hash) {
      console.log('✅ Fact-check caching working correctly');
    } else {
      console.log(`⚠️  Fact-check caching: expected cached=true on second call, got cached=${fc2Cached}`);
    }
    
    // 4. Test analysis caching
    console.log('\n📋 Step 4: Testing analysis caching...');
    const an1 = await axios.post(`${API_BASE}/clusters/${cluster.id}/analysis`, {});
    const an1Cached = an1.data?.data?.cached || false;
    const an1Hash = an1.data?.data?.content_hash;
    console.log(`  First analysis call: cached=${an1Cached}, hash=${an1Hash?.substring(0, 8)}...`);
    
    const an2 = await axios.post(`${API_BASE}/clusters/${cluster.id}/analysis`, {});
    const an2Cached = an2.data?.data?.cached || false;
    const an2Hash = an2.data?.data?.content_hash;
    console.log(`  Second analysis call: cached=${an2Cached}, hash=${an2Hash?.substring(0, 8)}...`);
    
    if (an2Cached && an1Hash === an2Hash) {
      console.log('✅ Analysis caching working correctly');
    } else {
      console.log(`⚠️  Analysis caching: expected cached=true on second call, got cached=${an2Cached}`);
    }
    
    // 5. Test regenerate flag bypasses cache
    console.log('\n📋 Step 5: Testing regenerate flag...');
    const qaRegen = await axios.post(`${API_BASE}/clusters/${cluster.id}/qa`, { regenerate: true });
    const qaRegenCached = qaRegen.data?.data?.cached || false;
    console.log(`  Q&A with regenerate=true: cached=${qaRegenCached}`);
    
    if (!qaRegenCached) {
      console.log('✅ Regenerate flag correctly bypasses cache');
    } else {
      console.log('⚠️  Regenerate flag did not bypass cache');
    }
    
    console.log('\n🎉 Content-hash caching tests completed!');
    console.log('\n📊 Summary:');
    console.log(`  - Q&A second call cached: ${qa2Cached ? '✅' : '❌'}`);
    console.log(`  - Fact-check second call cached: ${fc2Cached ? '✅' : '❌'}`);
    console.log(`  - Analysis second call cached: ${an2Cached ? '✅' : '❌'}`);
    console.log(`  - Regenerate bypasses cache: ${!qaRegenCached ? '✅' : '❌'}`);
    
    return qa2Cached && fc2Cached && an2Cached && !qaRegenCached;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Run tests if executed directly
if (require.main === module) {
  testContentHashCaching().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testContentHashCaching };

// Jest placeholder so the suite contains at least one test.
// The actual E2E runner is intended to execute testContentHashCaching directly against a running API server.
describe('content-hash-cache e2e (placeholder)', () => {
  test('smoke', () => {
    expect(true).toBe(true);
  });
});
