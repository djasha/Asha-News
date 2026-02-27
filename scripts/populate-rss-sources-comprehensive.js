#!/usr/bin/env node

/**
 * Comprehensive RSS Sources Population Script
 * Populates Directus with 50+ RSS sources across the political spectrum
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

async function makeDirectusRequest(endpoint, method = 'GET', data = null) {
  const fetch = (await import('node-fetch')).default;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function clearExistingRSSSources() {
  try {
    console.log('🧹 Clearing existing RSS sources...');
    
    // Get all existing RSS sources
    const existing = await makeDirectusRequest('/items/rss_sources');
    
    if (existing.data && existing.data.length > 0) {
      // Delete each source
      for (const source of existing.data) {
        await makeDirectusRequest(`/items/rss_sources/${source.id}`, 'DELETE');
        console.log(`   Deleted: ${source.name}`);
      }
    }
    
    console.log('✅ Cleared existing RSS sources');
  } catch (error) {
    console.error('❌ Error clearing existing sources:', error.message);
  }
}

async function populateRSSSources() {
  try {
    console.log('📰 Starting comprehensive RSS sources population...');

    // Load sources from JSON file
    const sourcesPath = path.join(__dirname, 'sources.json');
    const sourcesData = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));

    console.log(`📊 Found ${sourcesData.length} RSS sources to populate`);

    // Clear existing sources first
    await clearExistingRSSSources();

    let successCount = 0;
    let errorCount = 0;

    // Add each source to Directus
    for (const source of sourcesData) {
      try {
        const directusSource = {
          name: source.name,
          url: source.rss,
          enabled: true,
          bias_rating: source.bias,
          category: source.category || 'general',
          region: source.region || 'us',
          credibility_score: source.credibility || 7,
          source_id: source.id,
          last_fetched: null,
          fetch_frequency: 30, // minutes
          error_count: 0,
          status: 'active'
        };

        const result = await makeDirectusRequest('/items/rss_sources', 'POST', directusSource);
        
        console.log(`✅ Added: ${source.name} (${source.bias}) - ID: ${result.data.id}`);
        successCount++;
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to add ${source.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 RSS Sources Population Summary:');
    console.log(`✅ Successfully added: ${successCount} sources`);
    console.log(`❌ Failed to add: ${errorCount} sources`);
    console.log(`📰 Total sources in database: ${successCount}`);

    // Display bias distribution
    const biasDistribution = sourcesData.reduce((acc, source) => {
      acc[source.bias] = (acc[source.bias] || 0) + 1;
      return acc;
    }, {});

    console.log('\n🎯 Bias Distribution:');
    Object.entries(biasDistribution).forEach(([bias, count]) => {
      console.log(`   ${bias.toUpperCase()}: ${count} sources`);
    });

    // Display category distribution
    const categoryDistribution = sourcesData.reduce((acc, source) => {
      const category = source.category || 'general';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📂 Category Distribution:');
    Object.entries(categoryDistribution).forEach(([category, count]) => {
      console.log(`   ${category.toUpperCase()}: ${count} sources`);
    });

    return { successCount, errorCount, total: sourcesData.length };

  } catch (error) {
    console.error('❌ Fatal error during RSS sources population:', error);
    throw error;
  }
}

async function verifyRSSSourcesCollection() {
  try {
    console.log('🔍 Verifying RSS sources collection structure...');
    
    // Check if collection exists and get its fields
    const collection = await makeDirectusRequest('/collections/rss_sources');
    console.log('✅ RSS sources collection exists');
    
    // Get collection fields
    const fields = await makeDirectusRequest('/fields/rss_sources');
    const fieldNames = fields.data.map(field => field.field);
    
    console.log('📋 Available fields:', fieldNames.join(', '));
    
    // Check for required fields
    const requiredFields = ['name', 'url', 'enabled'];
    const missingFields = requiredFields.filter(field => !fieldNames.includes(field));
    
    if (missingFields.length > 0) {
      console.warn('⚠️  Missing required fields:', missingFields.join(', '));
    } else {
      console.log('✅ All required fields present');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying collection:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Comprehensive RSS Sources Setup');
    console.log('==========================================');
    
    // Verify collection structure
    const collectionOk = await verifyRSSSourcesCollection();
    if (!collectionOk) {
      throw new Error('RSS sources collection verification failed');
    }
    
    // Populate sources
    const result = await populateRSSSources();
    
    console.log('\n🎉 RSS Sources Setup Complete!');
    console.log('=====================================');
    console.log(`📊 Total: ${result.total} sources processed`);
    console.log(`✅ Success: ${result.successCount} sources added`);
    console.log(`❌ Errors: ${result.errorCount} sources failed`);
    
    if (result.successCount > 0) {
      console.log('\n🔗 Next Steps:');
      console.log('1. Check Directus admin panel: http://168.231.111.192:8055/admin/content/rss_sources');
      console.log('2. Run RSS fetch automation to start collecting articles');
      console.log('3. Monitor RSS feed health and performance');
    }
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { populateRSSSources, verifyRSSSourcesCollection };
