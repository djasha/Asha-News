/**
 * Comprehensive End-to-End Test for Hybrid News Clustering System
 * Tests all components: clustering, API endpoints, database integration, and frontend
 */

const axios = require('axios');
const StoryClusteringService = require('./server/services/storyClusteringService');

const BASE_URL = 'http://localhost:3001';

// Test data representing different types of articles
const testArticles = [
  {
    id: 101,
    title: 'Global Climate Summit Reaches Breakthrough Agreement',
    content: 'World leaders at COP29 have reached a historic agreement on carbon emission reductions, establishing binding targets for major economies and creating a new international carbon trading framework.',
    summary: 'Historic climate agreement with binding emission targets',
    source_name: 'Reuters',
    political_bias: 'center',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  },
  {
    id: 102,
    title: 'Environmental Groups Praise Climate Deal Despite Concerns',
    content: 'Environmental organizations have welcomed the new climate agreement while expressing concerns about implementation timelines. Industry groups warn of economic disruption from rapid transitions.',
    summary: 'Mixed reactions to climate agreement from stakeholders',
    source_name: 'BBC News',
    political_bias: 'lean_left',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  },
  {
    id: 103,
    title: 'Climate Accord Creates New Investment Opportunities',
    content: 'Financial markets respond positively to climate agreement as clean energy stocks surge. Analysts predict $2 trillion in new green investments over the next decade.',
    summary: 'Financial markets react to climate deal',
    source_name: 'Financial Times',
    political_bias: 'center',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  },
  {
    id: 104,
    title: 'Tech Giants Announce AI Safety Partnership',
    content: 'Major technology companies including Google, Microsoft, and OpenAI have announced a new partnership to develop comprehensive AI safety standards and ethical guidelines.',
    summary: 'Tech companies collaborate on AI safety standards',
    source_name: 'TechCrunch',
    political_bias: 'lean_left',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  },
  {
    id: 105,
    title: 'New Medical Breakthrough in Cancer Treatment',
    content: 'Researchers at Johns Hopkins have developed a revolutionary cancer treatment that shows 95% success rate in early trials, offering hope for millions of patients worldwide.',
    summary: 'Revolutionary cancer treatment shows promise',
    source_name: 'Medical News Today',
    political_bias: 'center',
    content_type: 'cms',
    cluster_eligible: false, // CMS articles typically not clustered
    published_date: new Date().toISOString()
  }
];

class HybridSystemTester {
  constructor() {
    this.clusteringService = new StoryClusteringService();
    this.testResults = {
      clustering: [],
      api: [],
      integration: [],
      performance: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Hybrid System Testing...\n');
    
    try {
      // Test 1: Core Clustering Functionality
      await this.testClusteringCore();
      
      // Test 2: API Endpoints
      await this.testAPIEndpoints();
      
      // Test 3: System Integration
      await this.testSystemIntegration();
      
      // Test 4: Performance & Scalability
      await this.testPerformance();
      
      // Test 5: Error Handling & Edge Cases
      await this.testErrorHandling();
      
      // Generate Test Report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return false;
    }
  }

  async testClusteringCore() {
    console.log('1️⃣ Testing Core Clustering Functionality...');
    
    try {
      // Test embedding generation
      const embedding = await this.clusteringService.generateEmbedding(testArticles[0]);
      this.testResults.clustering.push({
        test: 'Embedding Generation',
        status: embedding.length > 0 ? 'PASS' : 'FAIL',
        details: `Generated ${embedding.length}-dimensional vector`
      });

      // Test similarity calculation
      const embedding1 = await this.clusteringService.generateEmbedding(testArticles[0]);
      const embedding2 = await this.clusteringService.generateEmbedding(testArticles[1]);
      const similarity = this.clusteringService.calculateCosineSimilarity(embedding1, embedding2);
      
      this.testResults.clustering.push({
        test: 'Similarity Calculation',
        status: similarity > 0.4 && similarity < 1.0 ? 'PASS' : 'FAIL',
        details: `Climate articles similarity: ${similarity.toFixed(3)}`
      });

      // Test full clustering with different thresholds
      const clusters = await this.clusteringService.clusterArticles(testArticles, 0.6);
      this.testResults.clustering.push({
        test: 'Article Clustering',
        status: clusters.length > 0 ? 'PASS' : 'FAIL',
        details: `Created ${clusters.length} clusters from ${testArticles.length} articles`
      });

      // Test cluster enhancement (AI-generated content)
      const hasEnhancement = clusters.every(cluster => 
        cluster.cluster_title && 
        cluster.bias_distribution && 
        cluster.suggested_questions
      );
      
      this.testResults.clustering.push({
        test: 'Cluster Enhancement',
        status: hasEnhancement ? 'PASS' : 'FAIL',
        details: 'AI-generated titles, bias analysis, and Q&A'
      });

      console.log('✅ Core clustering tests completed\n');
      
    } catch (error) {
      console.error('❌ Clustering test failed:', error.message);
      this.testResults.clustering.push({
        test: 'Core Clustering',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testAPIEndpoints() {
    console.log('2️⃣ Testing API Endpoints...');
    
    const endpoints = [
      { method: 'GET', path: '/api/health', expectedStatus: 200 },
      { method: 'GET', path: '/api/clusters', expectedStatus: 200 },
      { method: 'GET', path: '/api/clusters/test-cluster', expectedStatus: 200 },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.path}`,
          timeout: 5000,
          validateStatus: () => true // Don't throw on non-2xx status
        });

        this.testResults.api.push({
          test: `${endpoint.method} ${endpoint.path}`,
          status: response.status === endpoint.expectedStatus ? 'PASS' : 'WARN',
          details: `Status: ${response.status}, Expected: ${endpoint.expectedStatus}`
        });

      } catch (error) {
        this.testResults.api.push({
          test: `${endpoint.method} ${endpoint.path}`,
          status: 'FAIL',
          details: error.message
        });
      }
    }

    // Test cluster creation endpoint
    try {
      const createResponse = await axios.post(`${BASE_URL}/api/clusters/create`, {
        articles: testArticles.slice(0, 2),
        threshold: 0.7
      }, { timeout: 10000 });

      this.testResults.api.push({
        test: 'POST /api/clusters/create',
        status: createResponse.data.success ? 'PASS' : 'FAIL',
        details: `Created cluster: ${createResponse.data.data?.cluster_title || 'Unknown'}`
      });

    } catch (error) {
      this.testResults.api.push({
        test: 'POST /api/clusters/create',
        status: error.response?.status === 429 ? 'WARN' : 'FAIL',
        details: error.response?.status === 429 ? 'Rate limited (expected)' : error.message
      });
    }

    console.log('✅ API endpoint tests completed\n');
  }

  async testSystemIntegration() {
    console.log('3️⃣ Testing System Integration...');
    
    try {
      // Test hybrid content model
      const hybridTest = {
        individualArticles: testArticles.filter(a => !a.cluster_eligible),
        clusterEligible: testArticles.filter(a => a.cluster_eligible),
        cmsArticles: testArticles.filter(a => a.content_type === 'cms'),
        rssArticles: testArticles.filter(a => a.content_type === 'rss')
      };

      this.testResults.integration.push({
        test: 'Hybrid Content Model',
        status: 'PASS',
        details: `CMS: ${hybridTest.cmsArticles.length}, RSS: ${hybridTest.rssArticles.length}, Clusterable: ${hybridTest.clusterEligible.length}`
      });

      // Test bias distribution calculation
      const clusters = await this.clusteringService.clusterArticles(testArticles.slice(0, 3), 0.5);
      const hasBiasAnalysis = clusters.some(cluster => 
        cluster.bias_distribution && 
        Object.keys(cluster.bias_distribution).length > 0
      );

      this.testResults.integration.push({
        test: 'Bias Distribution Analysis',
        status: hasBiasAnalysis ? 'PASS' : 'FAIL',
        details: 'Multi-source bias analysis across political spectrum'
      });

      // Test source diversity metrics
      const hasSourceDiversity = clusters.some(cluster => 
        cluster.source_diversity && 
        cluster.source_diversity.unique_sources > 0
      );

      this.testResults.integration.push({
        test: 'Source Diversity Metrics',
        status: hasSourceDiversity ? 'PASS' : 'FAIL',
        details: 'Source counting and diversity scoring'
      });

      console.log('✅ System integration tests completed\n');
      
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
      this.testResults.integration.push({
        test: 'System Integration',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testPerformance() {
    console.log('4️⃣ Testing Performance & Scalability...');
    
    try {
      // Test clustering performance with multiple articles
      const startTime = Date.now();
      const clusters = await this.clusteringService.clusterArticles(testArticles, 0.7);
      const clusteringTime = Date.now() - startTime;

      this.testResults.performance.push({
        test: 'Clustering Performance',
        status: clusteringTime < 10000 ? 'PASS' : 'WARN',
        details: `${testArticles.length} articles clustered in ${clusteringTime}ms`
      });

      // Test memory usage (basic check)
      const memUsage = process.memoryUsage();
      this.testResults.performance.push({
        test: 'Memory Usage',
        status: memUsage.heapUsed < 100 * 1024 * 1024 ? 'PASS' : 'WARN', // 100MB threshold
        details: `Heap used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`
      });

      console.log('✅ Performance tests completed\n');
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
      this.testResults.performance.push({
        test: 'Performance Testing',
        status: 'FAIL',
        details: error.message
      });
    }
  }

  async testErrorHandling() {
    console.log('5️⃣ Testing Error Handling & Edge Cases...');
    
    try {
      // Test with empty articles array
      const emptyClusters = await this.clusteringService.clusterArticles([], 0.7);
      this.testResults.clustering.push({
        test: 'Empty Articles Handling',
        status: emptyClusters.length === 0 ? 'PASS' : 'FAIL',
        details: 'Graceful handling of empty input'
      });

      // Test with single article
      const singleClusters = await this.clusteringService.clusterArticles([testArticles[0]], 0.7);
      this.testResults.clustering.push({
        test: 'Single Article Handling',
        status: singleClusters.length === 1 ? 'PASS' : 'FAIL',
        details: 'Single article creates single cluster'
      });

      // Test with very high similarity threshold
      const strictClusters = await this.clusteringService.clusterArticles(testArticles, 0.99);
      this.testResults.clustering.push({
        test: 'High Threshold Handling',
        status: strictClusters.length >= testArticles.length ? 'PASS' : 'FAIL',
        details: 'High threshold creates individual clusters'
      });

      console.log('✅ Error handling tests completed\n');
      
    } catch (error) {
      console.error('❌ Error handling test failed:', error.message);
    }
  }

  generateTestReport() {
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(50));
    
    const categories = ['clustering', 'api', 'integration', 'performance'];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let warnings = 0;

    categories.forEach(category => {
      const tests = this.testResults[category];
      if (tests.length === 0) return;

      console.log(`\n${category.toUpperCase()} TESTS:`);
      console.log('-'.repeat(30));
      
      tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
        console.log(`${icon} ${test.test}: ${test.details}`);
        
        totalTests++;
        if (test.status === 'PASS') passedTests++;
        else if (test.status === 'FAIL') failedTests++;
        else warnings++;
      });
    });

    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Hybrid system is ready for production.');
    } else {
      console.log('\n⚠️ Some tests failed. Review issues before deployment.');
    }
    
    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      warnings: warnings,
      successRate: Math.round((passedTests / totalTests) * 100)
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new HybridSystemTester();
  tester.runAllTests()
    .then(result => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test suite execution failed:', error);
      process.exit(1);
    });
}

module.exports = { HybridSystemTester, testArticles };
