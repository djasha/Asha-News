#!/usr/bin/env node
/**
 * DEPRECATED — Directus has been removed.
 * Tables are now created by server/db/migrate.js
 * Run: node server/db/migrate.js
 */
console.log('This script is deprecated. Use "node server/db/migrate.js" instead.');
process.exit(0);
/* eslint-disable */

const headers = {};

async function createCollection(name, config) {
  try {
    console.log(`Creating collection: ${name}...`);
    
    // Create collection with schema
    const collectionPayload = {
      collection: name,
      meta: {
        ...config.meta,
        icon: config.meta?.icon || 'folder'
      },
      schema: {
        name: name
      }
    };
    
    await axios.post(`${DIRECTUS_URL}/collections`, collectionPayload, { headers });
    console.log(`✓ Collection created: ${name}`);
    
    // Add fields
    if (config.fields && config.fields.length > 0) {
      for (const field of config.fields) {
        try {
          await axios.post(`${DIRECTUS_URL}/fields/${name}`, field, { headers });
          console.log(`  ✓ Field added: ${field.field}`);
        } catch (err) {
          if (err.response?.status === 400 && err.response?.data?.errors?.[0]?.message?.includes('already exists')) {
            console.log(`  ⚠️  Field exists: ${field.field}`);
          } else {
            throw err;
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.errors?.[0]?.message?.includes('already exists')) {
      console.log(`⚠️  Collection exists: ${name}`);
      return false;
    }
    console.error(`❌ Failed to create ${name}:`, error.response?.data || error.message);
    throw error;
  }
}

async function setupCollections() {
  console.log('🚀 Setting up Admin Collections...');
  console.log(`📍 Directus URL: ${DIRECTUS_URL}`);
  
  try {
    // 1. Site Settings (Singleton)
    await createCollection('site_settings', {
      meta: {
        singleton: true,
        icon: 'settings',
        note: 'Global site settings'
      },
      fields: [
        {
          field: 'id',
          type: 'integer',
          schema: { is_primary_key: true, has_auto_increment: true },
          meta: { hidden: true, readonly: true }
        },
        {
          field: 'site_name',
          type: 'string',
          schema: { default_value: 'Asha.News' },
          meta: { interface: 'input', width: 'half', required: true }
        },
        {
          field: 'site_tagline',
          type: 'string',
          schema: { default_value: 'Unbiased News Aggregation' },
          meta: { interface: 'input', width: 'half' }
        },
        {
          field: 'site_description',
          type: 'text',
          meta: { interface: 'input-multiline', width: 'full' }
        },
        {
          field: 'logo_url',
          type: 'string',
          meta: { interface: 'input', width: 'half' }
        },
        {
          field: 'favicon_url',
          type: 'string',
          meta: { interface: 'input', width: 'half' }
        },
        {
          field: 'primary_color',
          type: 'string',
          schema: { default_value: '#1a56db' },
          meta: { interface: 'select-color', width: 'half' }
        },
        {
          field: 'secondary_color',
          type: 'string',
          schema: { default_value: '#9061f9' },
          meta: { interface: 'select-color', width: 'half' }
        },
        {
          field: 'contact_email',
          type: 'string',
          meta: { interface: 'input', width: 'half' }
        },
        {
          field: 'support_email',
          type: 'string',
          meta: { interface: 'input', width: 'half' }
        }
      ]
    });
    
    // 2. Categories
    await createCollection('categories', {
      meta: {
        icon: 'category',
        note: 'Content categories'
      },
      fields: [
        {
          field: 'id',
          type: 'integer',
          schema: { is_primary_key: true, has_auto_increment: true },
          meta: { hidden: true, readonly: true }
        },
        {
          field: 'name',
          type: 'string',
          schema: { is_nullable: false },
          meta: { interface: 'input', width: 'half', required: true }
        },
        {
          field: 'slug',
          type: 'string',
          schema: { is_nullable: false, is_unique: true },
          meta: { interface: 'input', width: 'half', required: true }
        },
        {
          field: 'description',
          type: 'text',
          meta: { interface: 'input-multiline', width: 'full' }
        },
        {
          field: 'color',
          type: 'string',
          schema: { default_value: '#3b82f6' },
          meta: { interface: 'select-color', width: 'half' }
        },
        {
          field: 'icon',
          type: 'string',
          schema: { default_value: 'newspaper' },
          meta: { interface: 'input', width: 'half' }
        },
        {
          field: 'enabled',
          type: 'boolean',
          schema: { default_value: true },
          meta: { interface: 'boolean', width: 'half' }
        },
        {
          field: 'featured',
          type: 'boolean',
          schema: { default_value: false },
          meta: { interface: 'boolean', width: 'half' }
        },
        {
          field: 'order',
          type: 'integer',
          schema: { default_value: 0 },
          meta: { interface: 'input', width: 'half' }
        }
      ]
    });
    
    // 3. Menu Items
    await createCollection('menu_items', {
      meta: {
        icon: 'menu',
        note: 'Navigation menu items'
      },
      fields: [
        {
          field: 'id',
          type: 'integer',
          schema: { is_primary_key: true, has_auto_increment: true },
          meta: { hidden: true, readonly: true }
        },
        {
          field: 'menu_location',
          type: 'string',
          schema: { default_value: 'header' },
          meta: { 
            interface: 'select-dropdown',
            width: 'half',
            options: {
              choices: [
                { text: 'Header Primary', value: 'header' },
                { text: 'Footer Column 1', value: 'footer-1' },
                { text: 'Footer Column 2', value: 'footer-2' },
                { text: 'Mobile Menu', value: 'mobile' }
              ]
            }
          }
        },
        {
          field: 'label',
          type: 'string',
          schema: { is_nullable: false },
          meta: { interface: 'input', width: 'half', required: true }
        },
        {
          field: 'url',
          type: 'string',
          schema: { is_nullable: false },
          meta: { interface: 'input', width: 'half', required: true }
        },
        {
          field: 'icon',
          type: 'string',
          meta: { interface: 'input', width: 'half' }
        },
        {
          field: 'enabled',
          type: 'boolean',
          schema: { default_value: true },
          meta: { interface: 'boolean', width: 'half' }
        },
        {
          field: 'order',
          type: 'integer',
          schema: { default_value: 0 },
          meta: { interface: 'input', width: 'half' }
        },
        {
          field: 'parent_id',
          type: 'integer',
          meta: { interface: 'input', width: 'half', note: 'ID of parent menu item for nesting' }
        }
      ]
    });
    
    console.log('\n✅ All collections created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Visit Directus admin panel to verify collections');
    console.log('2. Populate initial data with: node server/scripts/seedCategories.js');
    console.log('3. Register routes in server.js');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupCollections();
