#!/usr/bin/env node

/**
 * Populate RSS Sources in Directus CMS
 * Imports RSS sources from scripts/sources.json into Directus for admin panel management
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from server/.env
require('dotenv').config({ path: './server/.env' });

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';
const SOURCES_FILE = path.join(__dirname, 'scripts/sources.json');

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function loadLocalSources() {
  try {
    const data = fs.readFileSync(SOURCES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading local sources:', error);
    return [];
  }
}

async function checkExistingSource(sourceId) {
  try {
    const encodedId = encodeURIComponent(sourceId);
    const response = await fetch(`${DIRECTUS_URL}/items/RSS_Sources?filter[source_id][_eq]=${encodedId}&limit=1`, { headers });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.data && data.data.length > 0;
  } catch (error) {
    return false;
  }
}

async function createRSSSource(source) {
  try {
    const directusSource = {
      source_id: source.id,
      name: source.name,
      rss_url: source.rss,
      bias_rating: source.bias,
      enabled: true,
      priority_level: 'medium',
      category: 'news',
      description: `${source.name} RSS feed`,
      fetch_frequency: 60, // minutes
      last_fetched: null,
      article_count: 0,
      status: 'active',
      date_created: new Date().toISOString(),
      date_updated: new Date().toISOString()
    };

    const response = await fetch(`${DIRECTUS_URL}/items/RSS_Sources`, {
      method: 'POST',
      headers,
      body: JSON.stringify(directusSource)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to create RSS source "${source.name}":`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error creating RSS source "${source.name}":`, error);
    return false;
  }
}

async function main() {
  console.log('🔄 Loading local RSS sources...');
  const sources = await loadLocalSources();
  
  if (sources.length === 0) {
    console.log('❌ No sources found to import');
    return;
  }
  
  console.log(`📰 Found ${sources.length} RSS sources to process`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const source of sources) {
    try {
      // Check if source already exists
      const exists = await checkExistingSource(source.id);
      
      if (exists) {
        console.log(`⏭️  Skipping ${source.name} (already exists)`);
        skipped++;
        continue;
      }
      
      // Create new RSS source
      const success = await createRSSSource(source);
      
      if (success) {
        console.log(`✅ Imported ${source.name}`);
        imported++;
      } else {
        errors++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error processing source "${source.name}":`, error);
      errors++;
    }
  }
  
  console.log('\n✅ RSS Sources import completed!');
  console.log(`📈 Results:`);
  console.log(`  - Imported: ${imported} sources`);
  console.log(`  - Skipped (already exist): ${skipped} sources`);
  console.log(`  - Errors: ${errors} sources`);
  console.log(`  - Total processed: ${imported + skipped + errors} sources`);
  
  if (imported > 0) {
    console.log('\n🎉 RSS sources are now manageable from Directus admin panel!');
    console.log(`📍 Access at: ${DIRECTUS_URL}/admin/content/RSS_Sources`);
  }
}

// Run the import
main().catch(console.error);
