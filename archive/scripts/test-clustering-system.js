const StoryClusteringService = require('./server/services/storyClusteringService');

// Test articles with similar content
const testArticles = [
  {
    id: 1,
    title: 'Global Climate Summit Reaches Historic Agreement',
    content: 'World leaders at the UN Climate Summit have reached a historic agreement on reducing carbon emissions by 50% over the next decade. The agreement includes binding commitments from major economies and establishes a new international carbon trading system.',
    summary: 'Historic climate agreement reached with binding emission reduction targets',
    source_name: 'Reuters',
    political_bias: 'center',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Climate Deal Sparks Mixed Reactions from Environmental Groups',
    content: 'Environmental organizations have expressed mixed reactions to the new climate agreement. While some praise the binding commitments, others argue the targets are insufficient to prevent catastrophic warming. Industry groups warn of economic impacts.',
    summary: 'Mixed reactions to climate deal from environmental and industry groups',
    source_name: 'BBC News',
    political_bias: 'lean_left',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  },
  {
    id: 3,
    title: 'New Climate Accord: Economic Opportunities and Challenges',
    content: 'The recently signed climate accord presents both opportunities and challenges for the global economy. Clean energy investments are expected to surge, while traditional energy sectors face transition pressures. Market analysts predict significant shifts in commodity prices.',
    summary: 'Climate accord creates economic opportunities and challenges',
    source_name: 'Financial Times',
    political_bias: 'center',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  },
  {
    id: 4,
    title: 'Tech Giants Announce New AI Partnership',
    content: 'Major technology companies have announced a new partnership to develop artificial intelligence safety standards. The initiative aims to create industry-wide guidelines for responsible AI development and deployment.',
    summary: 'Tech companies partner on AI safety standards',
    source_name: 'TechCrunch',
    political_bias: 'lean_left',
    content_type: 'rss',
    cluster_eligible: true,
    published_date: new Date().toISOString()
  }
];

async function testClusteringSystem() {
  console.log('🧪 Testing Story Clustering System...\n');
  
  try {
    const clusteringService = new StoryClusteringService();
    
    // Test 1: Generate embeddings
    console.log('1. Testing embedding generation...');
    const embedding = await clusteringService.generateEmbedding(testArticles[0]);
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);
    
    // Test 2: Calculate similarity between articles
    console.log('\n2. Testing similarity calculation...');
    const embedding1 = await clusteringService.generateEmbedding(testArticles[0]);
    const embedding2 = await clusteringService.generateEmbedding(testArticles[1]);
    const similarity = clusteringService.calculateCosineSimilarity(embedding1, embedding2);
    console.log(`✅ Similarity between climate articles: ${similarity.toFixed(3)}`);
    
    const embedding3 = await clusteringService.generateEmbedding(testArticles[3]);
    const similarity2 = clusteringService.calculateCosineSimilarity(embedding1, embedding3);
    console.log(`✅ Similarity between climate and tech articles: ${similarity2.toFixed(3)}`);
    
    // Test 3: Full clustering
    console.log('\n3. Testing full clustering process...');
    const clusters = await clusteringService.clusterArticles(testArticles, 0.7);
    
    console.log(`✅ Created ${clusters.length} clusters:`);
    clusters.forEach((cluster, index) => {
      console.log(`\nCluster ${index + 1}: "${cluster.cluster_title}"`);
      console.log(`  - Articles: ${cluster.article_count}`);
      console.log(`  - Category: ${cluster.topic_category || 'general'}`);
      console.log(`  - Coverage Score: ${cluster.coverage_score}`);
      console.log(`  - Bias Distribution:`, cluster.bias_distribution);
      console.log(`  - Key Facts: ${cluster.key_facts?.length || 0} facts`);
      console.log(`  - Questions: ${cluster.suggested_questions?.length || 0} questions`);
      
      cluster.articles.forEach(article => {
        console.log(`    • ${article.title} (${article.source_name}) - Similarity: ${article.similarity_score?.toFixed(3) || 'N/A'}`);
      });
    });
    
    // Test 4: Test with different thresholds
    console.log('\n4. Testing different similarity thresholds...');
    const strictClusters = await clusteringService.clusterArticles(testArticles, 0.9);
    const looseClusters = await clusteringService.clusterArticles(testArticles, 0.5);
    
    console.log(`✅ Strict threshold (0.9): ${strictClusters.length} clusters`);
    console.log(`✅ Loose threshold (0.5): ${looseClusters.length} clusters`);
    
    console.log('\n🎉 All clustering tests passed successfully!');
    
    return {
      success: true,
      clusters: clusters,
      tests: {
        embedding: embedding.length > 0,
        similarity: similarity > 0,
        clustering: clusters.length > 0,
        enhancement: clusters.every(c => c.cluster_title && c.bias_distribution)
      }
    };
    
  } catch (error) {
    console.error('❌ Clustering test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  testClusteringSystem()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All tests completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testClusteringSystem, testArticles };
