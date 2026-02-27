#!/usr/bin/env node
/**
 * Test and fix OpenRouter API key loading
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function fixOpenRouter() {
  console.log('\n=== OPENROUTER API KEY DEBUG ===\n');
  
  // 1. Check environment variable
  console.log('1. Environment Variable:');
  console.log('   OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 
    `SET (${process.env.OPENROUTER_API_KEY.substring(0, 15)}...)` : 'MISSING');
  
  // 2. Check adminSettingsService
  console.log('\n2. Admin Settings Service:');
  const adminSettingsService = require('../services/adminSettingsService');
  
  const orConfig = await adminSettingsService.getProviderConfig('openrouter');
  console.log('   Config found:', !!orConfig);
  console.log('   Config enabled:', orConfig?.enabled);
  console.log('   Config apiKey:', orConfig?.apiKey ? 
    `SET (${orConfig.apiKey.substring(0, 15)}...)` : 'MISSING');
  
  // 3. Test direct OpenRouter call
  console.log('\n3. Testing Direct OpenRouter API Call:');
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.log('   ❌ Cannot test - API key missing from environment');
    return;
  }
  
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://asha.news',
        'X-Title': 'Asha News'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
        messages: [{ role: 'user', content: 'Say "test successful" if you can read this.' }],
        max_tokens: 20
      })
    });
    
    const json = await resp.json();
    
    console.log('   Status:', resp.status);
    console.log('   Response:', json);
    
    if (resp.ok && json.choices?.[0]?.message?.content) {
      console.log('   ✅ OpenRouter API is working!');
      console.log('   Message:', json.choices[0].message.content);
    } else if (json.error) {
      console.log('   ❌ Error:', json.error.message || json.error);
    }
  } catch (error) {
    console.log('   ❌ Request failed:', error.message);
  }
  
  console.log('\n=== END DEBUG ===\n');
}

fixOpenRouter().catch(console.error);
