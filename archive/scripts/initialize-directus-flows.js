/**
 * Initialize Directus Automation Flows
 * Creates all automated workflows for Asha News CMS
 */

const DirectusFlowService = require('./server/services/directusFlowService');

async function initializeFlows() {
  console.log('🚀 Starting Directus Flow Initialization...\n');
  
  const flowService = new DirectusFlowService();
  
  try {
    // Initialize all automation flows
    const results = await flowService.initializeAllFlows();
    
    console.log('\n✅ Flow Initialization Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    results.forEach((result, index) => {
      const status = result.status === 'created' ? '🆕 Created' : '✅ Already exists';
      console.log(`${index + 1}. ${result.name}: ${status}${result.id ? ` (ID: ${result.id})` : ''}`);
    });
    
    console.log('\n📋 What these flows do:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Fact Checking: Auto-analyzes articles for credibility when published');
    console.log('🏷️  Categorization: AI-powered auto-categorization and tagging of articles');
    console.log('📰 Daily Briefs: Generates daily news summaries every morning at 6 AM');
    console.log('🚨 Breaking News: Detects and promotes breaking news automatically');
    
    console.log('\n🎯 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Publish an article in Directus to test fact-checking flow');
    console.log('2. Create an RSS article to test categorization flow');
    console.log('3. Wait until 6 AM tomorrow to see daily brief generation');
    console.log('4. Add breaking news keywords to test breaking news detection');
    console.log('5. Monitor flow execution in Directus admin panel');
    
    console.log('\n🔗 Access Points:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Directus Admin: http://168.231.111.192:8055/admin');
    console.log('• Flow Management: http://168.231.111.192:8055/admin/settings/flows');
    console.log('• API Endpoint: http://localhost:3001/api/flows');
    
  } catch (error) {
    console.error('❌ Flow initialization failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeFlows();
