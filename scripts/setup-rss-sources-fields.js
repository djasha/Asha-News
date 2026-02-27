/**
 * Setup RSS Sources Collection Fields
 * Adds all required fields for RSS management
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const REQUIRED_FIELDS = [
  {
    field: 'rss_url',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'RSS feed URL',
      width: 'full',
      required: true
    }
  },
  {
    field: 'category',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      note: 'Article category',
      options: {
        choices: [
          { text: 'General', value: 'general' },
          { text: 'Politics', value: 'politics' },
          { text: 'Business', value: 'business' },
          { text: 'Technology', value: 'technology' },
          { text: 'Health', value: 'health' },
          { text: 'Sports', value: 'sports' },
          { text: 'Entertainment', value: 'entertainment' },
          { text: 'Science', value: 'science' },
          { text: 'Local', value: 'local' }
        ]
      }
    }
  },
  {
    field: 'political_bias',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      note: 'Political bias classification',
      options: {
        choices: [
          { text: 'Left', value: 'left' },
          { text: 'Center', value: 'center' },
          { text: 'Right', value: 'right' }
        ]
      }
    }
  },
  {
    field: 'credibility_score',
    type: 'integer',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Credibility score (1-10)'
    },
    schema: {
      default_value: 7
    }
  },
  {
    field: 'region',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      note: 'Geographic region',
      options: {
        choices: [
          { text: 'Global', value: 'global' },
          { text: 'United States', value: 'us' },
          { text: 'United Kingdom', value: 'uk' },
          { text: 'European Union', value: 'eu' },
          { text: 'Asia', value: 'asia' },
          { text: 'Middle East', value: 'middle-east' },
          { text: 'Africa', value: 'africa' },
          { text: 'Latin America', value: 'latam' }
        ]
      }
    },
    schema: {
      default_value: 'global'
    }
  },
  {
    field: 'fetch_frequency',
    type: 'integer',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Fetch frequency in minutes'
    },
    schema: {
      default_value: 30
    }
  },
  {
    field: 'description',
    type: 'text',
    meta: {
      interface: 'input-multiline',
      display: 'raw',
      note: 'Optional description'
    }
  },
  {
    field: 'status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      note: 'Source status',
      options: {
        choices: [
          { text: 'Active', value: 'active' },
          { text: 'Paused', value: 'paused' },
          { text: 'Error', value: 'error' }
        ]
      }
    },
    schema: {
      default_value: 'active'
    }
  }
];

async function fieldExists(fieldName) {
  try {
    const response = await axios.get(
      `${DIRECTUS_URL}/fields/rss_sources/${fieldName}`,
      {
        headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
      }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function createField(fieldConfig) {
  try {
    const response = await axios.post(
      `${DIRECTUS_URL}/fields/rss_sources`,
      fieldConfig,
      {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true };
  } catch (error) {
    return { error: error.response?.data || error.message };
  }
}

async function migrateUrlField() {
  // Copy data from 'url' to 'rss_url' for existing sources
  try {
    console.log('\n📋 Migrating existing URL data...');
    const response = await axios.get(
      `${DIRECTUS_URL}/items/rss_sources`,
      {
        headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` },
        params: { limit: -1 }
      }
    );

    const sources = response.data.data || [];
    let migrated = 0;

    for (const source of sources) {
      if (source.url && !source.rss_url) {
        await axios.patch(
          `${DIRECTUS_URL}/items/rss_sources/${source.id}`,
          { rss_url: source.url },
          {
            headers: {
              'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        migrated++;
      }
    }

    console.log(`  ✓ Migrated ${migrated} sources`);
  } catch (error) {
    console.error('  ✗ Migration error:', error.message);
  }
}

async function main() {
  console.log('🔧 Setting up RSS Sources Collection Fields...\n');
  console.log(`📡 Directus URL: ${DIRECTUS_URL}\n`);
  
  if (!DIRECTUS_TOKEN) {
    console.error('❌ Error: DIRECTUS_TOKEN not found in environment variables');
    process.exit(1);
  }
  
  let created = 0;
  let exists = 0;
  let errors = 0;
  
  for (const fieldConfig of REQUIRED_FIELDS) {
    const fieldName = fieldConfig.field;
    
    // Check if field exists
    if (await fieldExists(fieldName)) {
      console.log(`  ✓ Field "${fieldName}" already exists`);
      exists++;
      continue;
    }
    
    // Create field
    console.log(`  + Creating field "${fieldName}"...`);
    const result = await createField(fieldConfig);
    
    if (result.success) {
      console.log(`    ✓ Created successfully`);
      created++;
    } else {
      console.error(`    ✗ Error:`, result.error);
      errors++;
    }
    
    // Small delay between field creation
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Migrate existing 'url' data to 'rss_url'
  if (created > 0 || exists > 0) {
    await migrateUrlField();
  }
  
  console.log('\n✅ Field Setup Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total fields: ${REQUIRED_FIELDS.length}`);
  console.log(`   ✓ Created: ${created}`);
  console.log(`   ⊙ Already exist: ${exists}`);
  console.log(`   ✗ Errors: ${errors}\n`);
  
  if (errors === 0) {
    console.log('🎉 All fields are ready! Refresh the admin panel.\n');
  } else {
    console.log('⚠️  Some fields had errors. Check the logs above.\n');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal Error:', error.message);
  process.exit(1);
});
