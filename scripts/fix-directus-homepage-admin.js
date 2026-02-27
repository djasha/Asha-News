#!/usr/bin/env node

/**
 * Fix Directus Homepage Sections Admin Interface
 * Makes homepage sections easier to edit in Directus admin panel
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

class DirectusAdminFixer {
  async makeDirectusRequest(endpoint, method = 'GET', data = null) {
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

  async updateFieldLabels() {
    console.log('🔧 Updating field labels for better admin experience...');

    const fieldUpdates = [
      {
        collection: 'homepage_sections',
        field: 'name',
        meta: {
          display: 'input',
          display_options: { placeholder: 'e.g., hero_feed, trending_grid' },
          note: 'Internal identifier for this section (no spaces, use underscores)',
          width: 'half'
        }
      },
      {
        collection: 'homepage_sections',
        field: 'title',
        meta: {
          display: 'input',
          display_options: { placeholder: 'e.g., Latest News, Trending Stories' },
          note: 'Display title shown to users on the homepage',
          width: 'half'
        }
      },
      {
        collection: 'homepage_sections',
        field: 'description',
        meta: {
          display: 'input',
          display_options: { placeholder: 'Brief description of this section' },
          note: 'Optional description for this homepage section',
          width: 'full'
        }
      },
      {
        collection: 'homepage_sections',
        field: 'enabled',
        meta: {
          display: 'boolean',
          display_options: { label: 'Show on Homepage' },
          note: 'Toggle to show/hide this section on the homepage',
          width: 'half'
        }
      },
      {
        collection: 'homepage_sections',
        field: 'sort_order',
        meta: {
          display: 'input',
          display_options: { placeholder: '1, 2, 3...' },
          note: 'Order of appearance on homepage (1 = first, 2 = second, etc.)',
          width: 'half'
        }
      },
      {
        collection: 'homepage_sections',
        field: 'max_articles',
        meta: {
          display: 'input',
          display_options: { placeholder: '4, 6, 8...' },
          note: 'Maximum number of articles to show in this section',
          width: 'half'
        }
      },
      {
        collection: 'homepage_sections',
        field: 'section_type',
        meta: {
          display: 'dropdown',
          display_options: {
            choices: [
              { text: 'Hero Section', value: 'hero' },
              { text: 'Grid Layout', value: 'grid' },
              { text: 'List Layout', value: 'list' },
              { text: 'Carousel', value: 'carousel' }
            ]
          },
          note: 'Visual layout style for this section',
          width: 'half'
        }
      }
    ];

    for (const update of fieldUpdates) {
      try {
        await this.makeDirectusRequest(
          `/fields/${update.collection}/${update.field}`,
          'PATCH',
          { meta: update.meta }
        );
        console.log(`   ✅ Updated ${update.field} field`);
      } catch (error) {
        console.log(`   ⚠️  Could not update ${update.field}: ${error.message}`);
      }
    }
  }

  async enableAllSections() {
    console.log('🔄 Enabling all homepage sections...');

    try {
      const sections = await this.makeDirectusRequest('/items/homepage_sections');
      
      for (const section of sections.data) {
        if (!section.enabled) {
          await this.makeDirectusRequest(
            `/items/homepage_sections/${section.id}`,
            'PATCH',
            { enabled: true }
          );
          console.log(`   ✅ Enabled section: ${section.title}`);
        }
      }
    } catch (error) {
      console.error('❌ Error enabling sections:', error.message);
    }
  }

  async addMoreSections() {
    console.log('➕ Adding additional homepage sections...');

    const newSections = [
      {
        name: 'breaking_news',
        title: 'Breaking News',
        description: 'Latest breaking news alerts',
        enabled: true,
        sort_order: 3,
        max_articles: 3,
        section_type: 'list'
      },
      {
        name: 'analysis_deep_dive',
        title: 'Deep Analysis',
        description: 'In-depth analysis and opinion pieces',
        enabled: true,
        sort_order: 4,
        max_articles: 4,
        section_type: 'grid'
      },
      {
        name: 'local_news',
        title: 'Local News',
        description: 'Regional and local news stories',
        enabled: false,
        sort_order: 5,
        max_articles: 6,
        section_type: 'carousel'
      }
    ];

    for (const section of newSections) {
      try {
        // Check if section already exists
        const existing = await this.makeDirectusRequest(
          `/items/homepage_sections?filter[name][_eq]=${section.name}`
        );

        if (existing.data && existing.data.length === 0) {
          await this.makeDirectusRequest('/items/homepage_sections', 'POST', section);
          console.log(`   ✅ Added section: ${section.title}`);
        } else {
          console.log(`   ⚠️  Section ${section.title} already exists`);
        }
      } catch (error) {
        console.log(`   ❌ Could not add ${section.title}: ${error.message}`);
      }
    }
  }

  async updateCollectionSettings() {
    console.log('⚙️  Updating collection settings for better admin experience...');

    try {
      await this.makeDirectusRequest('/collections/homepage_sections', 'PATCH', {
        meta: {
          display_template: '{{title}} ({{section_type}})',
          note: 'Configure homepage sections - drag to reorder, toggle enabled status',
          sort_field: 'sort_order'
        }
      });
      console.log('   ✅ Updated collection display settings');
    } catch (error) {
      console.log(`   ⚠️  Could not update collection settings: ${error.message}`);
    }
  }

  async run() {
    try {
      console.log('🚀 Fixing Directus Homepage Sections Admin Interface');
      console.log('==================================================');
      
      await this.enableAllSections();
      await this.updateFieldLabels();
      await this.addMoreSections();
      await this.updateCollectionSettings();

      console.log('\n✅ Homepage sections admin interface improved!');
      console.log('🔗 Access at: http://168.231.111.192:8055/admin/content/homepage_sections');
      console.log('\n📝 You can now easily:');
      console.log('   • Edit section titles and descriptions');
      console.log('   • Toggle sections on/off with the "Show on Homepage" checkbox');
      console.log('   • Reorder sections by changing sort_order numbers');
      console.log('   • Change layout types (hero, grid, list, carousel)');
      console.log('   • Set max articles per section');

    } catch (error) {
      console.error('💥 Failed to fix admin interface:', error.message);
      throw error;
    }
  }
}

async function main() {
  const fixer = new DirectusAdminFixer();
  await fixer.run();
}

// Export for use in other modules
module.exports = DirectusAdminFixer;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error.message);
    process.exit(1);
  });
}
