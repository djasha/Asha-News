const axios = require('axios');

const DIRECTUS_URL = 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function createClusteringSchema() {
  try {
    console.log('Creating Story Clustering Database Schema...');

    // 1. Story Clusters Collection
    const storyClustersCollection = {
      collection: 'story_clusters',
      meta: {
        collection: 'story_clusters',
        icon: 'group_work',
        note: 'Story clusters grouping related articles from different sources',
        display_template: '{{cluster_title}} ({{article_count}} articles)'
      },
      schema: {
        name: 'story_clusters'
      }
    };

    await axios.post(`${DIRECTUS_URL}/collections`, storyClustersCollection, { headers });
    console.log('✅ Created story_clusters collection');

    // Add fields to story_clusters
    const storyClusterFields = [
      {
        collection: 'story_clusters',
        field: 'id',
        type: 'uuid',
        meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
        schema: { is_primary_key: true, has_auto_increment: false, is_nullable: false }
      },
      {
        collection: 'story_clusters',
        field: 'cluster_title',
        type: 'string',
        meta: { interface: 'input', display: 'raw', required: true, note: 'AI-generated title for the story cluster' },
        schema: { is_nullable: false, max_length: 255 }
      },
      {
        collection: 'story_clusters',
        field: 'slug',
        type: 'string',
        meta: { interface: 'input', note: 'URL-friendly slug for the cluster', readonly: true },
        schema: { is_nullable: true, max_length: 255 }
      },
      {
        collection: 'story_clusters',
        field: 'cluster_summary',
        type: 'text',
        meta: { interface: 'input-rich-text-html', note: 'AI-generated summary combining all sources' },
        schema: { is_nullable: true }
      },
      {
        collection: 'story_clusters',
        field: 'article_count',
        type: 'integer',
        meta: { interface: 'input', readonly: true, note: 'Number of articles in this cluster' },
        schema: { is_nullable: false, default_value: 0 }
      },
      {
        collection: 'story_clusters',
        field: 'topic_category',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Politics', value: 'politics' },
              { text: 'Technology', value: 'technology' },
              { text: 'Business', value: 'business' },
              { text: 'Sports', value: 'sports' },
              { text: 'Health', value: 'health' },
              { text: 'Science', value: 'science' },
              { text: 'Entertainment', value: 'entertainment' },
              { text: 'World News', value: 'world' },
              { text: 'Breaking News', value: 'breaking' }
            ]
          }
        },
        schema: { is_nullable: true, max_length: 50 }
      },
      {
        collection: 'story_clusters',
        field: 'bias_distribution',
        type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, note: 'Bias distribution across sources' },
        schema: { is_nullable: true }
      },
      {
        collection: 'story_clusters',
        field: 'source_diversity',
        type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, note: 'Source diversity metrics' },
        schema: { is_nullable: true }
      },
      {
        collection: 'story_clusters',
        field: 'coverage_score',
        type: 'float',
        meta: { interface: 'input', note: 'Coverage completeness score (0-1)' },
        schema: { is_nullable: true, default_value: 0.5 }
      },
      {
        collection: 'story_clusters',
        field: 'blindspot_detected',
        type: 'boolean',
        meta: { interface: 'boolean', note: 'Whether coverage gaps were detected' },
        schema: { is_nullable: false, default_value: false }
      },
      {
        collection: 'story_clusters',
        field: 'key_facts',
        type: 'json',
        meta: { interface: 'list', note: 'Key facts extracted from all articles' },
        schema: { is_nullable: true }
      },
      {
        collection: 'story_clusters',
        field: 'fact_check_notes',
        type: 'text',
        meta: { interface: 'input-multiline', note: 'Aggregated fact-checking notes' },
        schema: { is_nullable: true }
      },
      {
        collection: 'story_clusters',
        field: 'suggested_questions',
        type: 'json',
        meta: { interface: 'list', note: 'AI-generated questions about the story' },
        schema: { is_nullable: true }
      },
      {
        collection: 'story_clusters',
        field: 'suggested_answers',
        type: 'json',
        meta: { interface: 'list', note: 'AI-generated answers to suggested questions' },
        schema: { is_nullable: true }
      },
      {
        collection: 'story_clusters',
        field: 'status',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Active', value: 'active' },
              { text: 'Archived', value: 'archived' },
              { text: 'Draft', value: 'draft' }
            ]
          },
          default_value: 'active'
        },
        schema: { is_nullable: false, default_value: 'active', max_length: 20 }
      },
      {
        collection: 'story_clusters',
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-created'] },
        schema: { is_nullable: false }
      },
      {
        collection: 'story_clusters',
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-updated'] },
        schema: { is_nullable: false }
      }
    ];

    for (const field of storyClusterFields) {
      await axios.post(`${DIRECTUS_URL}/fields/${field.collection}`, field, { headers });
    }
    console.log('✅ Added fields to story_clusters collection');

    // 2. Cluster Articles Junction Table
    const clusterArticlesCollection = {
      collection: 'cluster_articles',
      meta: {
        collection: 'cluster_articles',
        icon: 'link',
        note: 'Junction table linking articles to story clusters',
        display_template: '{{cluster_id}} - {{article_id}}'
      },
      schema: {
        name: 'cluster_articles'
      }
    };

    await axios.post(`${DIRECTUS_URL}/collections`, clusterArticlesCollection, { headers });
    console.log('✅ Created cluster_articles collection');

    // Add fields to cluster_articles
    const clusterArticleFields = [
      {
        collection: 'cluster_articles',
        field: 'id',
        type: 'uuid',
        meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
        schema: { is_primary_key: true, has_auto_increment: false, is_nullable: false }
      },
      {
        collection: 'cluster_articles',
        field: 'cluster_id',
        type: 'uuid',
        meta: { interface: 'select-dropdown-m2o', display: 'related-values', required: true },
        schema: { is_nullable: false }
      },
      {
        collection: 'cluster_articles',
        field: 'article_id',
        type: 'integer',
        meta: { interface: 'select-dropdown-m2o', display: 'related-values', required: true },
        schema: { is_nullable: false }
      },
      {
        collection: 'cluster_articles',
        field: 'similarity_score',
        type: 'float',
        meta: { interface: 'input', note: 'Similarity score to cluster (0-1)' },
        schema: { is_nullable: false, default_value: 0.0 }
      },
      {
        collection: 'cluster_articles',
        field: 'is_primary_source',
        type: 'boolean',
        meta: { interface: 'boolean', note: 'Whether this is the primary article for the cluster' },
        schema: { is_nullable: false, default_value: false }
      },
      {
        collection: 'cluster_articles',
        field: 'source_perspective',
        type: 'string',
        meta: { interface: 'input', note: 'Perspective this source brings to the story' },
        schema: { is_nullable: true, max_length: 255 }
      },
      {
        collection: 'cluster_articles',
        field: 'added_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, special: ['date-created'] },
        schema: { is_nullable: false }
      }
    ];

    for (const field of clusterArticleFields) {
      await axios.post(`${DIRECTUS_URL}/fields/${field.collection}`, field, { headers });
    }
    console.log('✅ Added fields to cluster_articles collection');

    // 3. Update articles table to add clustering fields
    const articleClusteringFields = [
      {
        collection: 'articles',
        field: 'content_type',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'CMS Article', value: 'cms' },
              { text: 'RSS Article', value: 'rss' },
              { text: 'Telegram Post', value: 'telegram' },
              { text: 'YouTube Video', value: 'youtube' }
            ]
          },
          default_value: 'cms'
        },
        schema: { is_nullable: false, default_value: 'cms', max_length: 20 }
      },
      {
        collection: 'articles',
        field: 'cluster_eligible',
        type: 'boolean',
        meta: { interface: 'boolean', note: 'Whether this article can be included in clustering' },
        schema: { is_nullable: false, default_value: true }
      },
      {
        collection: 'articles',
        field: 'embedding_vector',
        type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, note: 'AI-generated embedding for clustering', hidden: true },
        schema: { is_nullable: true }
      },
      {
        collection: 'articles',
        field: 'last_clustered',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, note: 'Last time this article was processed for clustering' },
        schema: { is_nullable: true }
      }
    ];

    for (const field of articleClusteringFields) {
      try {
        await axios.post(`${DIRECTUS_URL}/fields/${field.collection}`, field, { headers });
        console.log(`✅ Added ${field.field} to articles collection`);
      } catch (error) {
        console.log(`⚠️  Field ${field.field} may already exist in articles collection`);
      }
    }

    // 4. Create relations
    const relations = [
      {
        collection: 'cluster_articles',
        field: 'cluster_id',
        related_collection: 'story_clusters',
        meta: {
          many_collection: 'cluster_articles',
          many_field: 'cluster_id',
          one_collection: 'story_clusters',
          one_field: null,
          one_collection_field: null,
          one_allowed_collections: null,
          junction_field: 'article_id',
          sort_field: null,
          one_deselect_action: 'nullify'
        },
        schema: {
          table: 'cluster_articles',
          column: 'cluster_id',
          foreign_key_table: 'story_clusters',
          foreign_key_column: 'id',
          constraint_name: null,
          on_update: 'NO ACTION',
          on_delete: 'SET NULL'
        }
      },
      {
        collection: 'cluster_articles',
        field: 'article_id',
        related_collection: 'articles',
        meta: {
          many_collection: 'cluster_articles',
          many_field: 'article_id',
          one_collection: 'articles',
          one_field: null,
          one_collection_field: null,
          one_allowed_collections: null,
          junction_field: 'cluster_id',
          sort_field: null,
          one_deselect_action: 'nullify'
        },
        schema: {
          table: 'cluster_articles',
          column: 'article_id',
          foreign_key_table: 'articles',
          foreign_key_column: 'id',
          constraint_name: null,
          on_update: 'NO ACTION',
          on_delete: 'SET NULL'
        }
      }
    ];

    for (const relation of relations) {
      try {
        await axios.post(`${DIRECTUS_URL}/relations`, relation, { headers });
        console.log(`✅ Created relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}`);
      } catch (error) {
        console.log(`⚠️  Relation ${relation.collection}.${relation.field} may already exist`);
      }
    }

    console.log('\n🎉 Story Clustering Database Schema Created Successfully!');
    console.log('\nCollections created:');
    console.log('- story_clusters: Main story cluster data with AI analysis');
    console.log('- cluster_articles: Junction table linking articles to clusters');
    console.log('- articles: Enhanced with clustering fields');
    console.log('\nRelations created:');
    console.log('- story_clusters ↔ articles (many-to-many via cluster_articles)');
    console.log('\nYou can now manage story clusters in Directus admin panel.');

  } catch (error) {
    console.error('❌ Error creating clustering schema:', error.response?.data || error.message);
  }
}

// Run the script
createClusteringSchema();
