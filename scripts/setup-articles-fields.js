/**
 * Setup Articles Collection Fields
 * Adds necessary fields for article content scraping and display
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const REQUIRED_FIELDS = [
  {
    field: 'summary',
    type: 'text',
    meta: {
      interface: 'input-multiline',
      display: 'formatted-value',
      note: 'Article summary/excerpt',
      width: 'full'
    }
  },
  {
    field: 'source_name',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Name of the news source'
    }
  },
  {
    field: 'source_url',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'RSS feed URL or source URL'
    }
  },
  {
    field: 'author_name',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Article author'
    }
  },
  {
    field: 'published_at',
    type: 'timestamp',
    meta: {
      interface: 'datetime',
      display: 'datetime',
      note: 'Publication date and time'
    }
  },
  {
    field: 'image_url',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'image',
      note: 'Featured image URL'
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
    field: 'topic',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Article topic'
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
    field: 'bias_score',
    type: 'float',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Bias score (0-1, 0=left, 0.5=center, 1=right)'
    }
  },
  {
    field: 'credibility_score',
    type: 'float',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Credibility score (0-1)'
    }
  },
  {
    field: 'content_hash',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Content hash for deduplication',
      readonly: true
    }
  },
  {
    field: 'status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      note: 'Publication status',
      options: {
        choices: [
          { text: 'Draft', value: 'draft' },
          { text: 'Published', value: 'published' },
          { text: 'Archived', value: 'archived' }
        ]
      }
    }
  },
  {
    field: 'featured',
    type: 'boolean',
    meta: {
      interface: 'boolean',
      display: 'boolean',
      note: 'Featured article'
    }
  },
  {
    field: 'breaking',
    type: 'boolean',
    meta: {
      interface: 'boolean',
      display: 'boolean',
      note: 'Breaking news'
    }
  },
  {
    field: 'view_count',
    type: 'integer',
    meta: {
      interface: 'input',
      display: 'raw',
      note: 'Number of views'
    }
  }
];

async function fieldExists(fieldName) {
  try {
    const response = await axios.get(
      `${DIRECTUS_URL}/fields/articles/${fieldName}`,
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
      `${DIRECTUS_URL}/fields/articles`,
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

async function main() {
  console.log('🔧 Setting up Articles Collection Fields...\n');
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
  
  console.log('\n✅ Field Setup Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Total fields: ${REQUIRED_FIELDS.length}`);
  console.log(`   ✓ Created: ${created}`);
  console.log(`   ⊙ Already exist: ${exists}`);
  console.log(`   ✗ Errors: ${errors}\n`);
  
  if (errors === 0) {
    console.log('🎉 All fields are ready! You can now run populate-fresh-articles.js\n');
  } else {
    console.log('⚠️  Some fields had errors. Check the logs above.\n');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal Error:', error.message);
  process.exit(1);
});
