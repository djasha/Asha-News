/**
 * Setup Directus Webhooks for Automation
 * Creates webhooks to trigger our automation endpoints
 */

const axios = require('axios');

const DIRECTUS_URL = 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';
const BACKEND_URL = 'http://localhost:3001';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function setupWebhooks() {
  console.log('🔗 Setting up Directus webhooks for automation...\n');

  try {
    // 1. Article Automation Webhook
    const articleWebhook = {
      name: 'Article Automation',
      method: 'POST',
      url: `${BACKEND_URL}/api/webhooks/article-automation`,
      status: 'active',
      data: true,
      actions: ['create', 'update'],
      collections: ['articles'],
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('📝 Creating article automation webhook...');
    const articleResponse = await axios.post(`${DIRECTUS_URL}/webhooks`, articleWebhook, { headers });
    console.log(`✅ Article webhook created: ${articleResponse.data.data.id}`);

    // 2. Test Webhook
    const testWebhook = {
      name: 'Test Webhook',
      method: 'POST', 
      url: `${BACKEND_URL}/api/webhooks/test`,
      status: 'active',
      data: true,
      actions: ['create'],
      collections: ['articles'],
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('🧪 Creating test webhook...');
    const testResponse = await axios.post(`${DIRECTUS_URL}/webhooks`, testWebhook, { headers });
    console.log(`✅ Test webhook created: ${testResponse.data.data.id}`);

    console.log('\n🎯 Webhook Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Article Automation: Triggers on article create/update');
    console.log('🧪 Test Webhook: For testing webhook functionality');
    
    console.log('\n🔧 What happens now:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. When you publish an article in Directus → Automatic fact-checking');
    console.log('2. When you create an article → AI categorization and bias analysis');
    console.log('3. Breaking news keywords → Automatic breaking news detection');
    console.log('4. All results saved back to Directus automatically');

    console.log('\n🧪 Testing:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to Directus admin: http://168.231.111.192:8055/admin');
    console.log('2. Create/publish an article in the Articles collection');
    console.log('3. Watch the server logs for automation activity');
    console.log('4. Check the article for updated fields (fact_check_status, bias_score, etc.)');

    console.log('\n📊 Monitor webhooks:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• Directus Settings → Webhooks');
    console.log('• Server logs at http://localhost:3001');
    console.log('• Webhook test endpoint: POST /api/webhooks/test');

  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.errors?.[0]?.message?.includes('duplicate')) {
      console.log('ℹ️ Webhooks may already exist. Checking existing webhooks...');
      
      try {
        const existingResponse = await axios.get(`${DIRECTUS_URL}/webhooks`, { headers });
        const existingWebhooks = existingResponse.data.data || [];
        
        console.log('\n📋 Existing webhooks:');
        existingWebhooks.forEach(webhook => {
          console.log(`• ${webhook.name}: ${webhook.url} (${webhook.status})`);
        });
        
        if (existingWebhooks.length > 0) {
          console.log('\n✅ Webhooks are already configured and ready to use!');
        }
      } catch (listError) {
        console.error('❌ Failed to list existing webhooks:', listError.message);
      }
    } else {
      console.error('❌ Webhook setup failed:', error.response?.data || error.message);
    }
  }
}

// Run setup
setupWebhooks();
