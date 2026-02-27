const fetch = require('node-fetch');

const DIRECTUS_URL = "http://168.231.111.192:8055";
const ADMIN_EMAIL = "admin@asha.news";
const ADMIN_PASSWORD = "AdminPass123";

async function createPageBuilderCollections() {
  try {
    // Authenticate with admin credentials
    const authResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const token = authData.data.access_token;

    console.log('Creating page builder collections...');

    // Helper function to make authenticated requests
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
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }
      
      return response.json();
    };

    // 1. Create Pages collection
    const pagesCollection = {
      collection: 'pages',
      meta: {
        collection: 'pages',
        icon: 'web',
        note: 'Visual page builder for website pages',
        display_template: '{{title}}',
        hidden: false,
        singleton: false,
        translations: null,
        archive_field: null,
        archive_app_filter: true,
        archive_value: null,
        unarchive_value: null,
        sort_field: 'sort',
        accountability: 'all',
        color: null,
        item_duplication_fields: null,
        sort: 1,
        group: null,
        collapse: 'open'
      },
      schema: {
        name: 'pages'
      },
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: {
            field: 'id',
            special: ['autoincrement'],
            interface: 'input',
            options: null,
            display: null,
            display_options: null,
            readonly: true,
            hidden: true,
            sort: 1,
            width: 'full',
            translations: null,
            note: null,
            conditions: null,
            required: false,
            group: null,
            validation: null,
            validation_message: null
          },
          schema: {
            name: 'id',
            table: 'pages',
            data_type: 'integer',
            default_value: null,
            max_length: null,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: true,
            is_generated: false,
            generation_expression: null,
            has_auto_increment: true,
            foreign_key_column: null,
            foreign_key_table: null
          }
        },
        {
          field: 'title',
          type: 'string',
          meta: {
            field: 'title',
            special: null,
            interface: 'input',
            options: null,
            display: null,
            display_options: null,
            readonly: false,
            hidden: false,
            sort: 2,
            width: 'full',
            translations: null,
            note: 'Page title for navigation and SEO',
            conditions: null,
            required: true,
            group: null,
            validation: null,
            validation_message: null
          },
          schema: {
            name: 'title',
            table: 'pages',
            data_type: 'varchar',
            default_value: null,
            max_length: 255,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        },
        {
          field: 'slug',
          type: 'string',
          meta: {
            field: 'slug',
            special: null,
            interface: 'input',
            options: {
              slug: true,
              onlyOnCreate: false
            },
            display: null,
            display_options: null,
            readonly: false,
            hidden: false,
            sort: 3,
            width: 'half',
            translations: null,
            note: 'URL slug for the page',
            conditions: null,
            required: true,
            group: null,
            validation: null,
            validation_message: null
          },
          schema: {
            name: 'slug',
            table: 'pages',
            data_type: 'varchar',
            default_value: null,
            max_length: 255,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: false,
            is_unique: true,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        },
        {
          field: 'status',
          type: 'string',
          meta: {
            field: 'status',
            special: null,
            interface: 'select-dropdown',
            options: {
              choices: [
                { text: 'Draft', value: 'draft' },
                { text: 'Published', value: 'published' },
                { text: 'Archived', value: 'archived' }
              ]
            },
            display: 'labels',
            display_options: {
              showAsDot: true,
              choices: [
                { text: 'Draft', value: 'draft', foreground: '#18222c', background: '#d3dae4' },
                { text: 'Published', value: 'published', foreground: '#ffffff', background: '#00c897' },
                { text: 'Archived', value: 'archived', foreground: '#ffffff', background: '#a2b5cd' }
              ]
            },
            readonly: false,
            hidden: false,
            sort: 4,
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
            name: 'status',
            table: 'pages',
            data_type: 'varchar',
            default_value: 'draft',
            max_length: 20,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        },
        {
          field: 'components',
          type: 'json',
          meta: {
            field: 'components',
            special: ['cast-json'],
            interface: 'list',
            options: {
              template: '{{component_type}} - {{component_name}}',
              addLabel: 'Add Component',
              fields: [
                {
                  field: 'component_type',
                  name: 'Component Type',
                  type: 'string',
                  meta: {
                    interface: 'select-dropdown',
                    options: {
                      choices: [
                        { text: 'Hero Section', value: 'hero' },
                        { text: 'Story Clusters', value: 'story_clusters' },
                        { text: 'News Feed', value: 'news_feed' },
                        { text: 'Daily Briefs', value: 'daily_briefs' },
                        { text: 'Trending Grid', value: 'trending_grid' },
                        { text: 'Image Board', value: 'image_board' },
                        { text: 'Analysis Section', value: 'analysis_section' },
                        { text: 'Topic Carousel', value: 'topic_carousel' },
                        { text: 'Gaza Israel News', value: 'gaza_israel_news' },
                        { text: 'Latest From Asha', value: 'latest_from_asha' },
                        { text: 'Custom HTML', value: 'custom_html' }
                      ]
                    },
                    width: 'half'
                  }
                },
                {
                  field: 'component_name',
                  name: 'Component Name',
                  type: 'string',
                  meta: {
                    interface: 'input',
                    width: 'half'
                  }
                },
                {
                  field: 'enabled',
                  name: 'Enabled',
                  type: 'boolean',
                  meta: {
                    interface: 'boolean',
                    width: 'half'
                  }
                },
                {
                  field: 'sort_order',
                  name: 'Sort Order',
                  type: 'integer',
                  meta: {
                    interface: 'input',
                    width: 'half'
                  }
                },
                {
                  field: 'settings',
                  name: 'Component Settings',
                  type: 'json',
                  meta: {
                    interface: 'input-code',
                    options: {
                      language: 'json'
                    },
                    width: 'full'
                  }
                }
              ]
            },
            display: null,
            display_options: null,
            readonly: false,
            hidden: false,
            sort: 5,
            width: 'full',
            translations: null,
            note: 'Drag and drop components to build the page',
            conditions: null,
            required: false,
            group: null,
            validation: null,
            validation_message: null
          },
          schema: {
            name: 'components',
            table: 'pages',
            data_type: 'json',
            default_value: null,
            max_length: null,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: true,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        },
        {
          field: 'layout_settings',
          type: 'json',
          meta: {
            field: 'layout_settings',
            special: ['cast-json'],
            interface: 'input-code',
            options: {
              language: 'json',
              template: JSON.stringify({
                sidebar_enabled: true,
                sidebar_position: 'right',
                container_width: 'max-w-7xl',
                background_color: 'bg-surface-light',
                padding: 'py-8 lg:py-12'
              }, null, 2)
            },
            display: null,
            display_options: null,
            readonly: false,
            hidden: false,
            sort: 6,
            width: 'full',
            translations: null,
            note: 'Page layout and styling settings',
            conditions: null,
            required: false,
            group: null,
            validation: null,
            validation_message: null
          },
          schema: {
            name: 'layout_settings',
            table: 'pages',
            data_type: 'json',
            default_value: null,
            max_length: null,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: true,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        },
        {
          field: 'seo_settings',
          type: 'json',
          meta: {
            field: 'seo_settings',
            special: ['cast-json'],
            interface: 'input-code',
            options: {
              language: 'json',
              template: JSON.stringify({
                meta_title: '',
                meta_description: '',
                og_title: '',
                og_description: '',
                og_image: '',
                canonical_url: ''
              }, null, 2)
            },
            display: null,
            display_options: null,
            readonly: false,
            hidden: false,
            sort: 7,
            width: 'full',
            translations: null,
            note: 'SEO and social media settings',
            conditions: null,
            required: false,
            group: null,
            validation: null,
            validation_message: null
          },
          schema: {
            name: 'seo_settings',
            table: 'pages',
            data_type: 'json',
            default_value: null,
            max_length: null,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: true,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        },
        {
          field: 'created_at',
          type: 'timestamp',
          meta: {
            field: 'created_at',
            special: ['date-created'],
            interface: 'datetime',
            options: null,
            display: 'datetime',
            display_options: {
              relative: true
            },
            readonly: true,
            hidden: true,
            sort: 8,
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
            name: 'created_at',
            table: 'pages',
            data_type: 'timestamp',
            default_value: 'CURRENT_TIMESTAMP',
            max_length: null,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        },
        {
          field: 'updated_at',
          type: 'timestamp',
          meta: {
            field: 'updated_at',
            special: ['date-updated'],
            interface: 'datetime',
            options: null,
            display: 'datetime',
            display_options: {
              relative: true
            },
            readonly: true,
            hidden: true,
            sort: 9,
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
            name: 'updated_at',
            table: 'pages',
            data_type: 'timestamp',
            default_value: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            max_length: null,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            comment: ''
          }
        }
      ]
    };

    // Create the pages collection
    await directus.collections.createOne(pagesCollection);
    console.log('✅ Pages collection created');

    // 2. Create sample Home page
    const homePage = {
      title: 'Home Page',
      slug: 'home',
      status: 'published',
      components: [
        {
          component_type: 'hero',
          component_name: 'Hero Story Cluster',
          enabled: true,
          sort_order: 1,
          settings: {
            show_clusters: true,
            fallback_to_articles: true,
            max_clusters: 1,
            background_gradient: 'from-primary-50 to-primary-100'
          }
        },
        {
          component_type: 'story_clusters',
          component_name: 'Top Story Clusters',
          enabled: true,
          sort_order: 2,
          settings: {
            limit: 6,
            show_bias_distribution: true,
            show_source_count: true
          }
        },
        {
          component_type: 'daily_briefs',
          component_name: 'Daily Briefing',
          enabled: true,
          sort_order: 3,
          settings: {
            carousel_enabled: true,
            auto_play: true,
            interval: 8000
          }
        },
        {
          component_type: 'trending_grid',
          component_name: 'Trending Topics',
          enabled: true,
          sort_order: 4,
          settings: {
            grid_columns: 3,
            show_images: true
          }
        },
        {
          component_type: 'image_board',
          component_name: 'Visual Stories',
          enabled: true,
          sort_order: 5,
          settings: {
            masonry_layout: true,
            image_quality: 'high'
          }
        },
        {
          component_type: 'analysis_section',
          component_name: 'AI Analysis',
          enabled: true,
          sort_order: 6,
          settings: {
            show_bias_charts: true,
            show_fact_checks: true
          }
        },
        {
          component_type: 'topic_carousel',
          component_name: 'Topic Navigation',
          enabled: true,
          sort_order: 7,
          settings: {
            auto_scroll: true,
            show_article_count: true
          }
        },
        {
          component_type: 'gaza_israel_news',
          component_name: 'Palestine Coverage',
          enabled: true,
          sort_order: 8,
          settings: {
            forensic_focus: true,
            show_investigations: true
          }
        },
        {
          component_type: 'latest_from_asha',
          component_name: 'Latest Updates',
          enabled: true,
          sort_order: 9,
          settings: {
            limit: 5,
            show_timestamps: true
          }
        },
        {
          component_type: 'news_feed',
          component_name: 'Sidebar Articles',
          enabled: true,
          sort_order: 10,
          settings: {
            layout: 'sidebar',
            show_filters: true,
            show_bias_overview: true,
            max_articles: 20
          }
        }
      ],
      layout_settings: {
        sidebar_enabled: true,
        sidebar_position: 'right',
        container_width: 'max-w-7xl',
        background_color: 'bg-surface-light',
        padding: 'py-8 lg:py-12',
        grid_layout: 'lg:grid-cols-4',
        main_content_span: 'lg:col-span-3',
        sidebar_span: 'lg:col-span-1'
      },
      seo_settings: {
        meta_title: 'Asha.News - Unbiased News with AI-Powered Analysis',
        meta_description: 'Get comprehensive news coverage with bias analysis, story clustering, and fact-checking. Multiple perspectives on every story.',
        og_title: 'Asha.News - Unbiased News Platform',
        og_description: 'AI-powered news analysis with bias detection and story clustering',
        og_image: '/images/asha-news-og.jpg',
        canonical_url: 'https://asha.news'
      }
    };

    await directus.items('pages').createOne(homePage);
    console.log('✅ Home page created');

    // 3. Create Articles page
    const articlesPage = {
      title: 'Articles',
      slug: 'articles',
      status: 'published',
      components: [
        {
          component_type: 'news_feed',
          component_name: 'Main Articles Feed',
          enabled: true,
          sort_order: 1,
          settings: {
            layout: 'grid',
            show_filters: true,
            show_bias_overview: true,
            pagination: true,
            articles_per_page: 20,
            show_search: true
          }
        },
        {
          component_type: 'trending_grid',
          component_name: 'Trending Now',
          enabled: true,
          sort_order: 2,
          settings: {
            grid_columns: 4,
            show_images: true,
            limit: 8
          }
        }
      ],
      layout_settings: {
        sidebar_enabled: true,
        sidebar_position: 'right',
        container_width: 'max-w-7xl',
        background_color: 'bg-surface-light',
        padding: 'py-8 lg:py-12'
      },
      seo_settings: {
        meta_title: 'Latest News Articles - Asha.News',
        meta_description: 'Browse all latest news articles with comprehensive bias analysis and fact-checking.',
        og_title: 'Latest News Articles - Asha.News',
        og_description: 'Comprehensive news coverage with AI-powered analysis',
        canonical_url: 'https://asha.news/articles'
      }
    };

    await directus.items('pages').createOne(articlesPage);
    console.log('✅ Articles page created');

    console.log('🎉 Page builder collections created successfully!');
    console.log('📝 You can now edit pages in Directus admin panel');

  } catch (error) {
    console.error('Error creating page builder collections:', error);
  }
}

// Run the script
createPageBuilderCollections();
