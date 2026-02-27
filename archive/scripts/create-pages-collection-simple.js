const { default: fetch } = require('node-fetch');

const DIRECTUS_URL = "http://168.231.111.192:8055";
const ADMIN_EMAIL = "admin@asha.news";
const ADMIN_PASSWORD = "AdminPass123";

async function createPagesCollection() {
  try {
    // Authenticate
    const authResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const token = authData.data.access_token;

    console.log('✅ Authenticated successfully');

    // Helper function
    const makeRequest = async (endpoint, method = 'GET', body = null) => {
      const response = await fetch(`${DIRECTUS_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : null,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Request failed: ${response.status} - ${errorText}`);
        return null;
      }
      
      return response.json();
    };

    // 1. Create Pages collection
    console.log('📄 Creating pages collection...');
    
    const pagesCollectionResult = await makeRequest('/collections', 'POST', {
      collection: 'pages',
      meta: {
        collection: 'pages',
        icon: 'web',
        note: 'Visual page builder for website pages',
        display_template: '{{title}}',
        hidden: false,
        singleton: false,
        sort_field: 'sort',
        accountability: 'all',
        sort: 1,
        group: null,
        collapse: 'open'
      },
      schema: {
        name: 'pages'
      }
    });

    if (pagesCollectionResult) {
      console.log('✅ Pages collection created');
    }

    // 2. Create fields for pages collection
    const fields = [
      {
        field: 'title',
        type: 'string',
        meta: {
          interface: 'input',
          required: true,
          sort: 1,
          width: 'full',
          note: 'Page title'
        },
        schema: {
          is_nullable: false,
          max_length: 255
        }
      },
      {
        field: 'slug',
        type: 'string',
        meta: {
          interface: 'input',
          required: true,
          sort: 2,
          width: 'half',
          note: 'URL slug for the page'
        },
        schema: {
          is_nullable: false,
          is_unique: true,
          max_length: 255
        }
      },
      {
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Draft', value: 'draft' },
              { text: 'Published', value: 'published' },
              { text: 'Archived', value: 'archived' }
            ]
          },
          default_value: 'draft',
          sort: 3,
          width: 'half'
        },
        schema: {
          is_nullable: false,
          default_value: 'draft'
        }
      },
      {
        field: 'components',
        type: 'json',
        meta: {
          interface: 'input-code',
          options: {
            language: 'json'
          },
          sort: 4,
          width: 'full',
          note: 'Page components configuration'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'layout_settings',
        type: 'json',
        meta: {
          interface: 'input-code',
          options: {
            language: 'json'
          },
          sort: 5,
          width: 'full',
          note: 'Layout configuration'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'seo_title',
        type: 'string',
        meta: {
          interface: 'input',
          sort: 6,
          width: 'half',
          note: 'SEO title'
        },
        schema: {
          is_nullable: true,
          max_length: 255
        }
      },
      {
        field: 'seo_description',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          sort: 7,
          width: 'full',
          note: 'SEO description'
        },
        schema: {
          is_nullable: true
        }
      },
      {
        field: 'sort',
        type: 'integer',
        meta: {
          interface: 'input',
          sort: 8,
          width: 'half',
          note: 'Sort order'
        },
        schema: {
          is_nullable: true,
          default_value: 0
        }
      }
    ];

    console.log('🔧 Creating fields...');
    for (const field of fields) {
      const result = await makeRequest(`/fields/pages`, 'POST', field);
      if (result) {
        console.log(`✅ Created field: ${field.field}`);
      }
    }

    // 3. Create sample pages
    console.log('📝 Creating sample pages...');
    
    const samplePages = [
      {
        title: 'Home Page',
        slug: 'home',
        status: 'published',
        components: [
          {
            type: 'hero_cluster',
            settings: {
              show_hero: true,
              cluster_limit: 1
            }
          },
          {
            type: 'story_clusters',
            settings: {
              title: 'Top Story Clusters',
              limit: 6,
              show_bias: true
            }
          },
          {
            type: 'daily_briefs',
            settings: {
              title: 'Daily Briefing',
              limit: 4
            }
          },
          {
            type: 'trending_grid',
            settings: {
              title: 'Trending Now',
              limit: 6
            }
          }
        ],
        layout_settings: {
          container_width: 'full',
          spacing: 'normal',
          background: 'default'
        },
        seo_title: 'Asha.News - AI-Powered News Analysis & Bias Detection',
        seo_description: 'Combat media bias with AI-powered news analysis. Get balanced perspectives from 200+ sources with GPT-4 bias detection, fact-checking, and blindspot identification.',
        sort: 1
      },
      {
        title: 'Articles Page',
        slug: 'articles',
        status: 'published',
        components: [
          {
            type: 'news_feed',
            settings: {
              title: 'Latest Articles',
              pagination: true,
              per_page: 20,
              show_filters: true
            }
          }
        ],
        layout_settings: {
          container_width: 'contained',
          spacing: 'normal',
          background: 'default'
        },
        seo_title: 'Latest News Articles - Asha.News',
        seo_description: 'Browse the latest news articles with AI-powered bias analysis and fact-checking.',
        sort: 2
      }
    ];

    for (const page of samplePages) {
      const result = await makeRequest('/items/pages', 'POST', page);
      if (result) {
        console.log(`✅ Created page: ${page.title}`);
      }
    }

    console.log('\n🎉 Page builder collections created successfully!');
    console.log('📋 Summary:');
    console.log('  - Pages collection created with all fields');
    console.log('  - Sample Home and Articles pages created');
    console.log('  - Visual editor should now work in Directus');
    console.log('\n🔗 Next steps:');
    console.log('  1. Go to Directus admin panel');
    console.log('  2. Navigate to Visual Editor');
    console.log('  3. Select a page to edit');

  } catch (error) {
    console.error('❌ Error creating page builder collections:', error.message);
  }
}

// Run the function
createPagesCollection();
