#!/usr/bin/env node
/**
 * Diagnostic script to check XAI, clustering, and coherence issues
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function diagnose() {
  console.log('\n=== DIAGNOSTIC REPORT ===\n');

  // 1. Check XAI Configuration
  console.log('1. X.AI Configuration:');
  const XAISocialService = require('../services/xaiSocialService');
  const xaiService = new XAISocialService();
  console.log('   - Enabled:', xaiService.isAvailable());
  console.log('   - API Key:', process.env.XAI_API_KEY ? 'SET (first 10 chars: ' + process.env.XAI_API_KEY.substring(0, 10) + '...)' : 'MISSING');
  console.log('   - Model:', xaiService.model);
  
  // 2. Check Admin Settings (Coherence Guard)
  console.log('\n2. Admin Settings (Clustering):');
  const adminSettingsService = require('../services/adminSettingsService');
  const settings = await adminSettingsService.getClusterSettings();
  console.log('   - Coherence Guard Enabled:', settings.coherenceGuardEnabled);
  console.log('   - Coherence Shadow Mode:', settings.coherenceGuardShadowMode);
  console.log('   - Coherence Min Score:', settings.coherenceMinScore);
  console.log('   - Similarity Threshold:', settings.similarityThreshold);
  console.log('   - Event Only Enabled:', settings.eventOnlyEnabled);
  console.log('   - Allowed Topics:', settings.allowedTopics?.slice(0, 3).join(', ') + '...');
  
  // 3. Check OpenRouter
  console.log('\n3. OpenRouter Configuration:');
  console.log('   - API Key:', process.env.OPENROUTER_API_KEY ? 'SET (first 10 chars: ' + process.env.OPENROUTER_API_KEY.substring(0, 10) + '...)' : 'MISSING');
  const usageConfig = await adminSettingsService.getUsageConfig('clustering');
  console.log('   - Usage Provider:', usageConfig?.provider || 'default');
  console.log('   - Usage Model:', usageConfig?.model || 'default');
  
  // 4. Test XAI with a simple cluster
  console.log('\n4. Testing XAI Tweet Generation:');
  try {
    const testCluster = {
      cluster_title: 'Test: Israel strikes Lebanon',
      cluster_summary: 'Testing tweet generation with a real news topic.',
      articles: [
        { title: 'Israel conducts strikes in southern Lebanon', source_name: 'NPR' },
        { title: 'Lebanon reports casualties from Israeli attack', source_name: 'Al Jazeera' }
      ]
    };
    
    console.log('   - Calling XAI service...');
    const result = await xaiService.generateSocialContent(testCluster);
    console.log('   - Tweets Generated:', result.x_posts?.length || 0);
    console.log('   - Hashtags Generated:', result.trending_hashtags?.length || 0);
    
    if (result.x_posts && result.x_posts.length > 0) {
      console.log('   - Sample Tweet:', result.x_posts[0].text.substring(0, 80) + '...');
    } else {
      console.log('   - ⚠️  No tweets returned! Check XAI API key or rate limits.');
    }
  } catch (error) {
    console.log('   - ❌ Error:', error.message);
  }
  
  // 5. Check recent clusters for generic summaries
  console.log('\n5. Checking Recent Cluster Summaries:');
  const DirectusService = require('../services/directusService');
  const directus = new DirectusService();
  try {
    const clusters = await directus.getItems('story_clusters', { limit: 3, sort: '-created_at' });
    clusters.forEach((cluster, i) => {
      const isGeneric = cluster.cluster_summary?.includes('Multiple sources') && 
                       cluster.cluster_summary?.includes('this developing story');
      console.log(`   ${i+1}. Cluster ${cluster.id}:`);
      console.log(`      - Title: ${cluster.cluster_title?.substring(0, 60)}...`);
      console.log(`      - Generic Summary: ${isGeneric ? 'YES ⚠️' : 'NO ✓'}`);
      console.log(`      - Summary Preview: ${cluster.cluster_summary?.substring(0, 80)}...`);
    });
  } catch (error) {
    console.log('   - ❌ Error fetching clusters:', error.message);
  }
  
  console.log('\n=== END REPORT ===\n');
}

diagnose().catch(console.error);
