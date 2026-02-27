const http = require('http');

// Test all CMS endpoints
const endpoints = [
  '/api/cms/settings',
  '/api/cms/rss-sources', 
  '/api/cms/feature-flags',
  '/api/cms/site-config',
  '/api/cms/navigation',
  '/api/cms/menu-items',
  '/api/cms/topics',
  '/api/cms/news-sources',
  '/api/cms/homepage-sections',
  '/api/cms/breaking-news',
  '/api/cms/daily-briefs',
  '/api/cms/trending-topics',
  '/api/cms/page-content?page=about',
  '/api/cms/legal-pages',
  '/api/cms/fact-check-claims',
  '/api/cms/story-clusters',
  '/api/cms/user-preferences',
  '/api/cms/articles/enhanced',
  '/api/cms/news-sources/analytics',
  '/api/cms/trending-topics/metrics',
  '/api/cms/story-clusters/analysis',
  '/api/cms/fact-check-claims/workflow',
  '/api/cms/articles',
  '/api/cms/article-series',
  '/api/cms/sitemap-entries'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const hasData = parsed.data || parsed.articles || parsed.trending_topics || parsed.breaking_news || parsed.daily_briefs;
          resolve({
            endpoint,
            status: res.statusCode,
            hasData: !!hasData,
            dataCount: Array.isArray(hasData) ? hasData.length : (hasData ? 1 : 0),
            error: null
          });
        } catch (e) {
          resolve({
            endpoint,
            status: res.statusCode,
            hasData: false,
            dataCount: 0,
            error: 'Invalid JSON'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint,
        status: 'ERROR',
        hasData: false,
        dataCount: 0,
        error: err.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 'TIMEOUT',
        hasData: false,
        dataCount: 0,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing all CMS endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const status = result.status === 200 ? '✅' : '❌';
    const data = result.hasData ? `📊 ${result.dataCount} items` : '🚫 No data';
    console.log(`${status} ${endpoint} - ${result.status} - ${data}`);
    
    if (result.error) {
      console.log(`   ⚠️  Error: ${result.error}`);
    }
  }
  
  console.log('\n📊 Summary:');
  const working = results.filter(r => r.status === 200).length;
  const withData = results.filter(r => r.hasData).length;
  console.log(`✅ Working endpoints: ${working}/${endpoints.length}`);
  console.log(`📊 Endpoints with data: ${withData}/${endpoints.length}`);
  
  const failed = results.filter(r => r.status !== 200);
  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(f => console.log(`   ${f.endpoint} - ${f.status} - ${f.error || 'Unknown error'}`));
  }
}

testAllEndpoints().catch(console.error);
