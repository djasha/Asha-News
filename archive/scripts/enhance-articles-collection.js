#!/usr/bin/env node

/**
 * Enhance Articles Collection with Missing Critical Fields
 * Adds SEO, author, content analytics, and editorial workflow fields
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

// New fields to add to articles collection
const newFields = [
  // SEO Fields
  {
    field: 'seo_title',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      width: 'full',
      note: 'SEO optimized title (max 60 chars)',
      options: { placeholder: 'Enter SEO title...', maxLength: 60 }
    },
    schema: { max_length: 60, is_nullable: true }
  },
  {
    field: 'seo_description',
    type: 'text',
    meta: {
      interface: 'input-multiline',
      display: 'raw',
      width: 'full',
      note: 'Meta description for search results (max 155 chars)',
      options: { placeholder: 'Enter meta description...', rows: 3 }
    },
    schema: { is_nullable: true }
  },
  {
    field: 'seo_keywords',
    type: 'json',
    meta: {
      interface: 'tags',
      display: 'tags',
      width: 'full',
      note: 'SEO keywords and tags',
      options: { placeholder: 'Add keywords...' }
    },
    schema: { is_nullable: true }
  },
  
  // Author Fields
  {
    field: 'author_name',
    type: 'string',
    meta: {
      interface: 'input',
      display: 'raw',
      width: 'half',
      note: 'Article author name (required)',
      required: true,
      options: { placeholder: 'Author name...' }
    },
    schema: { max_length: 100, is_nullable: false, default_value: 'Asha News' }
  },
  {
    field: 'author_bio',
    type: 'text',
    meta: {
      interface: 'input-multiline',
      display: 'raw',
      width: 'half',
      note: 'Author biography',
      options: { placeholder: 'Author bio...', rows: 3 }
    },
    schema: { is_nullable: true }
  },
  {
    field: 'author_avatar',
    type: 'uuid',
    meta: {
      interface: 'file-image',
      display: 'image',
      width: 'half',
      note: 'Author profile image'
    },
    schema: { is_nullable: true }
  },
  {
    field: 'author_social',
    type: 'json',
    meta: {
      interface: 'input-code',
      display: 'raw',
      width: 'half',
      note: 'Author social media links (JSON)',
      options: { 
        language: 'json',
        placeholder: '{"twitter": "@username", "linkedin": "profile-url"}'
      }
    },
    schema: { is_nullable: true }
  },
  
  // Content Analytics
  {
    field: 'word_count',
    type: 'integer',
    meta: {
      interface: 'input',
      display: 'raw',
      width: 'half',
      note: 'Auto-calculated word count',
      readonly: true
    },
    schema: { is_nullable: true, default_value: 0 }
  },
  {
    field: 'reading_time',
    type: 'integer',
    meta: {
      interface: 'input',
      display: 'raw',
      width: 'half',
      note: 'Estimated reading time in minutes',
      readonly: true
    },
    schema: { is_nullable: true, default_value: 1 }
  },
  {
    field: 'difficulty_score',
    type: 'decimal',
    meta: {
      interface: 'slider',
      display: 'raw',
      width: 'half',
      note: 'Content difficulty score (0-1)',
      options: { min: 0, max: 1, step: 0.1 }
    },
    schema: { numeric_precision: 3, numeric_scale: 2, is_nullable: true, default_value: 0.5 }
  },
  
  // Editorial Workflow
  {
    field: 'editorial_status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      width: 'half',
      note: 'Editorial workflow status',
      options: {
        choices: [
          { text: 'Draft', value: 'draft' },
          { text: 'In Review', value: 'review' },
          { text: 'Published', value: 'published' },
          { text: 'Archived', value: 'archived' }
        ]
      }
    },
    schema: { max_length: 20, is_nullable: true, default_value: 'draft' }
  },
  {
    field: 'fact_check_status',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      width: 'half',
      note: 'Fact-checking verification status',
      options: {
        choices: [
          { text: 'Unverified', value: 'unverified' },
          { text: 'Verified', value: 'verified' },
          { text: 'Disputed', value: 'disputed' },
          { text: 'False', value: 'false' }
        ]
      }
    },
    schema: { max_length: 20, is_nullable: true, default_value: 'unverified' }
  },
  {
    field: 'source_credibility',
    type: 'decimal',
    meta: {
      interface: 'slider',
      display: 'raw',
      width: 'half',
      note: 'Source credibility score (0-1)',
      options: { min: 0, max: 1, step: 0.1 }
    },
    schema: { numeric_precision: 3, numeric_scale: 2, is_nullable: true, default_value: 0.8 }
  },
  {
    field: 'breaking_news',
    type: 'boolean',
    meta: {
      interface: 'boolean',
      display: 'boolean',
      width: 'half',
      note: 'Mark as breaking news'
    },
    schema: { is_nullable: true, default_value: false }
  },
  {
    field: 'editor_notes',
    type: 'text',
    meta: {
      interface: 'input-multiline',
      display: 'raw',
      width: 'full',
      note: 'Internal editor notes',
      options: { placeholder: 'Editor notes...', rows: 3 }
    },
    schema: { is_nullable: true }
  },
  {
    field: 'geographic_tags',
    type: 'json',
    meta: {
      interface: 'tags',
      display: 'tags',
      width: 'full',
      note: 'Geographic relevance tags',
      options: { placeholder: 'Add locations...' }
    },
    schema: { is_nullable: true }
  },
  {
    field: 'social_shares',
    type: 'json',
    meta: {
      interface: 'input-code',
      display: 'raw',
      width: 'full',
      note: 'Social media share counts (JSON)',
      readonly: true,
      options: { 
        language: 'json',
        placeholder: '{"facebook": 0, "twitter": 0, "linkedin": 0}'
      }
    },
    schema: { is_nullable: true }
  }
];

async function addFieldToCollection(field) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/fields/articles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(field)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to add field ${field.field}:`, error);
      return false;
    }

    console.log(`✅ Added field: ${field.field}`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding field ${field.field}:`, error.message);
    return false;
  }
}

async function enhanceArticlesCollection() {
  console.log('🚀 Enhancing Articles Collection with Missing Fields...\n');

  let successCount = 0;
  let totalFields = newFields.length;

  for (const field of newFields) {
    const success = await addFieldToCollection(field);
    if (success) successCount++;
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Enhancement Complete:`);
  console.log(`✅ Successfully added: ${successCount}/${totalFields} fields`);
  console.log(`❌ Failed: ${totalFields - successCount}/${totalFields} fields`);

  if (successCount === totalFields) {
    console.log('\n🎉 All fields added successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Check Directus admin panel to verify fields');
    console.log('   2. Update existing articles with new field data');
    console.log('   3. Implement AI auto-population for SEO fields');
    console.log('   4. Update frontend components to use new fields');
  } else {
    console.log('\n⚠️  Some fields failed to add. Check the errors above.');
  }
}

// Run the enhancement
enhanceArticlesCollection().catch(console.error);
