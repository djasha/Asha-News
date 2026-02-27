#!/usr/bin/env node
/**
 * Test OpenRouter AI Summary Generation
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function testOpenRouter() {
  console.log('\n=== TESTING OPENROUTER AI SUMMARIES ===\n');
  
  const testArticles = [
    {
      title: "US labor market stays strong as jobless claims fall",
      summary: "Initial unemployment claims fell to 241,000 last week",
      content: "The U.S. labor market continues to show resilience as initial jobless claims fell to 241,000 in the latest week, down from 260,000 the previous week. This marks the lowest level in several months and suggests the economy remains on solid footing despite higher interest rates. Economists had expected claims to remain elevated, but the surprise drop indicates employers are holding onto workers.",
      source: "Reuters",
      bias: "center"
    },
    {
      title: "Jobless Claims Drop More Than Expected",
      summary: "Weekly unemployment claims show surprising decline",
      content: "Weekly jobless claims dropped more sharply than economists anticipated, falling to 241,000 from a revised 260,000 the prior week. The four-week moving average, which smooths out weekly volatility, also declined to 250,000. Labor Department officials noted strong demand for workers across multiple sectors, particularly in healthcare and professional services.",
      source: "Bloomberg",
      bias: "center"
    }
  ];
  
  const StoryClusteringService = require('../services/storyClusteringService');
  const clusterService = new StoryClusteringService();
  
  console.log('Generating cluster analysis with OpenRouter...\n');
  
  try {
    const result = await clusterService.generateClusterAnalysis(
      testArticles,
      "US Jobless Claims Fall More Than Expected"
    );
    
    console.log('✅ RESULTS:');
    console.log('- Summary length:', result.summary?.length || 0, 'chars');
    console.log('- Summary:', result.summary);
    console.log('\n- Key Facts count:', result.key_facts?.length || 0);
    if (result.key_facts && result.key_facts.length > 0) {
      console.log('- First fact:', result.key_facts[0]);
    }
    console.log('\n- Timeline events:', result.timeline_events?.length || 0);
    console.log('- Questions:', result.suggested_questions?.length || 0);
    
    // Check if it's the generic fallback
    const isGeneric = result.summary?.includes('Multiple sources') && 
                     result.summary?.includes('this developing story');
    console.log('\n⚠️  IS GENERIC FALLBACK:', isGeneric ? 'YES - AI FAILED!' : 'NO - AI WORKED!');
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
  
  console.log('\n=== END TEST ===\n');
}

testOpenRouter().catch(console.error);
