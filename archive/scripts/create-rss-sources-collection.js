#!/usr/bin/env node

/**
 * Create RSS Sources Collection in Directus CMS
 * Creates the RSS_Sources collection with proper schema and fields
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from server/.env
require('dotenv').config({ path: './server/.env' });

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function createCollection() {
  try {
    // Create the RSS_Sources collection
    const collectionData = {
      collection: 'RSS_Sources',
      meta: {
        collection: 'RSS_Sources',
        icon: 'rss_feed',
        note: 'RSS feed sources for news aggregation',
        display_template: '{{name}} ({{bias_rating}})',
        hidden: false,
        singleton: false,
        translations: null,
        archive_field: null,
        archive_app_filter: true,
        archive_value: null,
        unarchive_value: null,
        sort_field: 'priority_level',
        accountability: 'all',
        color: '#2196F3',
        item_duplication_fields: null,
        sort: null,
        group: null,
        collapse: 'open'
      },
      schema: {
        name: 'RSS_Sources'
      }
    };

    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(collectionData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create collection:', error);
      return false;
    }

    console.log('✅ Created RSS_Sources collection');
    return true;
  } catch (error) {
    console.error('Error creating collection:', error);
    return false;
  }
}

async function createField(fieldData) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/fields/RSS_Sources`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fieldData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to create field "${fieldData.field}":`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error creating field "${fieldData.field}":`, error);
    return false;
  }
}

async function createFields() {
  const fields = [
    // Primary key
    {
      field: 'id',
      type: 'uuid',
      meta: {
        field: 'id',
        special: ['uuid'],
        interface: 'input',
        options: null,
        display: null,
        display_options: null,
        readonly: true,
        hidden: true,
        sort: 1,
        width: 'full',
        translations: null,
        note: 'Primary key',
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'id',
        table: 'RSS_Sources',
        data_type: 'uuid',
        default_value: null,
        max_length: null,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: false,
        is_unique: true,
        is_primary_key: true,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Source ID
    {
      field: 'source_id',
      type: 'string',
      meta: {
        field: 'source_id',
        special: null,
        interface: 'input',
        options: null,
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 2,
        width: 'half',
        translations: null,
        note: 'Unique identifier for the RSS source',
        conditions: null,
        required: true,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'source_id',
        table: 'RSS_Sources',
        data_type: 'varchar',
        default_value: null,
        max_length: 100,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: false,
        is_unique: true,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Name
    {
      field: 'name',
      type: 'string',
      meta: {
        field: 'name',
        special: null,
        interface: 'input',
        options: null,
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 3,
        width: 'half',
        translations: null,
        note: 'Display name of the news source',
        conditions: null,
        required: true,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'name',
        table: 'RSS_Sources',
        data_type: 'varchar',
        default_value: null,
        max_length: 255,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: false,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // RSS URL
    {
      field: 'rss_url',
      type: 'text',
      meta: {
        field: 'rss_url',
        special: null,
        interface: 'input',
        options: null,
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 4,
        width: 'full',
        translations: null,
        note: 'RSS feed URL',
        conditions: null,
        required: true,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'rss_url',
        table: 'RSS_Sources',
        data_type: 'text',
        default_value: null,
        max_length: null,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: false,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Bias Rating
    {
      field: 'bias_rating',
      type: 'string',
      meta: {
        field: 'bias_rating',
        special: null,
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Left', value: 'left' },
            { text: 'Center', value: 'center' },
            { text: 'Right', value: 'right' }
          ]
        },
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 5,
        width: 'half',
        translations: null,
        note: 'Political bias rating of the source',
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'bias_rating',
        table: 'RSS_Sources',
        data_type: 'varchar',
        default_value: 'center',
        max_length: 50,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Enabled
    {
      field: 'enabled',
      type: 'boolean',
      meta: {
        field: 'enabled',
        special: null,
        interface: 'boolean',
        options: null,
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 6,
        width: 'half',
        translations: null,
        note: 'Whether this RSS source is active',
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'enabled',
        table: 'RSS_Sources',
        data_type: 'boolean',
        default_value: true,
        max_length: null,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Priority Level
    {
      field: 'priority_level',
      type: 'string',
      meta: {
        field: 'priority_level',
        special: null,
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'High', value: 'high' },
            { text: 'Medium', value: 'medium' },
            { text: 'Low', value: 'low' }
          ]
        },
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 7,
        width: 'half',
        translations: null,
        note: 'Priority level for fetching',
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'priority_level',
        table: 'RSS_Sources',
        data_type: 'varchar',
        default_value: 'medium',
        max_length: 50,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Category
    {
      field: 'category',
      type: 'string',
      meta: {
        field: 'category',
        special: null,
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'News', value: 'news' },
            { text: 'Politics', value: 'politics' },
            { text: 'Business', value: 'business' },
            { text: 'Technology', value: 'technology' },
            { text: 'Sports', value: 'sports' },
            { text: 'Entertainment', value: 'entertainment' },
            { text: 'International', value: 'international' }
          ]
        },
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 8,
        width: 'half',
        translations: null,
        note: 'Content category',
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'category',
        table: 'RSS_Sources',
        data_type: 'varchar',
        default_value: 'news',
        max_length: 100,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Description
    {
      field: 'description',
      type: 'text',
      meta: {
        field: 'description',
        special: null,
        interface: 'input-multiline',
        options: null,
        display: null,
        display_options: null,
        readonly: false,
        hidden: false,
        sort: 9,
        width: 'full',
        translations: null,
        note: 'Description of the RSS source',
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'description',
        table: 'RSS_Sources',
        data_type: 'text',
        default_value: null,
        max_length: null,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    // Timestamps
    {
      field: 'date_created',
      type: 'timestamp',
      meta: {
        field: 'date_created',
        special: ['date-created'],
        interface: 'datetime',
        options: null,
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        hidden: true,
        sort: 10,
        width: 'half',
        translations: null,
        note: null,
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'date_created',
        table: 'RSS_Sources',
        data_type: 'timestamp',
        default_value: 'CURRENT_TIMESTAMP',
        max_length: null,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        field: 'date_updated',
        special: ['date-updated'],
        interface: 'datetime',
        options: null,
        display: 'datetime',
        display_options: { relative: true },
        readonly: true,
        hidden: true,
        sort: 11,
        width: 'half',
        translations: null,
        note: null,
        conditions: null,
        required: false,
        group: null,
        validation: null,
        validation_message: null
      },
      schema: {
        name: 'date_updated',
        table: 'RSS_Sources',
        data_type: 'timestamp',
        default_value: 'CURRENT_TIMESTAMP',
        max_length: null,
        numeric_precision: null,
        numeric_scale: null,
        is_nullable: true,
        is_unique: false,
        is_primary_key: false,
        is_generated: false,
        generation_expression: null,
        has_auto_increment: false,
        foreign_key_table: null,
        foreign_key_column: null
      }
    }
  ];

  let created = 0;
  let errors = 0;

  for (const field of fields) {
    const success = await createField(field);
    if (success) {
      console.log(`✅ Created field: ${field.field}`);
      created++;
    } else {
      errors++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Fields creation summary:`);
  console.log(`  - Created: ${created} fields`);
  console.log(`  - Errors: ${errors} fields`);
  
  return created > 0;
}

async function main() {
  console.log('🔄 Creating RSS_Sources collection in Directus...');
  
  // Create the collection
  const collectionCreated = await createCollection();
  if (!collectionCreated) {
    console.log('❌ Failed to create collection');
    return;
  }
  
  // Wait a moment for collection to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create the fields
  console.log('\n🔄 Creating fields...');
  const fieldsCreated = await createFields();
  
  if (fieldsCreated) {
    console.log('\n🎉 RSS_Sources collection created successfully!');
    console.log(`📍 Access at: ${DIRECTUS_URL}/admin/content/RSS_Sources`);
  } else {
    console.log('\n❌ Failed to create fields');
  }
}

// Run the creation
main().catch(console.error);
