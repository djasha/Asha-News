const axios = require('axios');

const DIRECTUS_URL = 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function createAIConfigCollections() {
  try {
    console.log('Creating AI Configuration Management Collections...');

    // 1. AI Providers Collection
    const aiProvidersCollection = {
      collection: 'ai_providers',
      meta: {
        collection: 'ai_providers',
        icon: 'psychology',
        note: 'AI API providers configuration (OpenAI, Groq, Google, etc.)',
        display_template: '{{name}} - {{status}}'
      },
      schema: {
        name: 'ai_providers'
      }
    };

    await axios.post(`${DIRECTUS_URL}/collections`, aiProvidersCollection, { headers });
    console.log('✅ Created ai_providers collection');

    // Add fields to ai_providers
    const aiProviderFields = [
      {
        collection: 'ai_providers',
        field: 'id',
        type: 'uuid',
        meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
        schema: { is_primary_key: true, has_auto_increment: false, is_nullable: false }
      },
      {
        collection: 'ai_providers',
        field: 'name',
        type: 'string',
        meta: { interface: 'input', display: 'raw', required: true, note: 'Provider name (e.g., OpenAI, Groq, Google)' },
        schema: { is_nullable: false, max_length: 100 }
      },
      {
        collection: 'ai_providers',
        field: 'provider_type',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'OpenAI', value: 'openai' },
              { text: 'Groq', value: 'groq' },
              { text: 'Google AI', value: 'google' },
              { text: 'Anthropic', value: 'anthropic' },
              { text: 'Custom', value: 'custom' }
            ]
          },
          required: true
        },
        schema: { is_nullable: false, max_length: 50 }
      },
      {
        collection: 'ai_providers',
        field: 'api_key',
        type: 'string',
        meta: { interface: 'input', display: 'formatted-value', required: true, note: 'API key (encrypted in storage)', special: ['hash'] },
        schema: { is_nullable: false, max_length: 500 }
      },
      {
        collection: 'ai_providers',
        field: 'base_url',
        type: 'string',
        meta: { interface: 'input', note: 'API base URL (optional for custom providers)' },
        schema: { is_nullable: true, max_length: 255 }
      },
      {
        collection: 'ai_providers',
        field: 'model_name',
        type: 'string',
        meta: { interface: 'input', note: 'Default model name (e.g., gpt-4, llama-3.1-8b-instant)' },
        schema: { is_nullable: true, max_length: 100 }
      },
      {
        collection: 'ai_providers',
        field: 'status',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Active', value: 'active' },
              { text: 'Inactive', value: 'inactive' },
              { text: 'Testing', value: 'testing' }
            ]
          },
          default_value: 'active'
        },
        schema: { is_nullable: false, default_value: 'active', max_length: 20 }
      },
      {
        collection: 'ai_providers',
        field: 'priority',
        type: 'integer',
        meta: { interface: 'input', note: 'Priority order (1 = highest priority)', default_value: 1 },
        schema: { is_nullable: false, default_value: 1 }
      },
      {
        collection: 'ai_providers',
        field: 'rate_limit_per_minute',
        type: 'integer',
        meta: { interface: 'input', note: 'API rate limit per minute', default_value: 60 },
        schema: { is_nullable: true, default_value: 60 }
      },
      {
        collection: 'ai_providers',
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-created'] },
        schema: { is_nullable: false }
      },
      {
        collection: 'ai_providers',
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-updated'] },
        schema: { is_nullable: false }
      }
    ];

    for (const field of aiProviderFields) {
      await axios.post(`${DIRECTUS_URL}/fields/${field.collection}`, field, { headers });
    }
    console.log('✅ Added fields to ai_providers collection');

    // 2. AI Prompts Collection
    const aiPromptsCollection = {
      collection: 'ai_prompts',
      meta: {
        collection: 'ai_prompts',
        icon: 'chat',
        note: 'AI prompts and rules for different analysis types',
        display_template: '{{name}} - {{prompt_type}}'
      },
      schema: {
        name: 'ai_prompts'
      }
    };

    await axios.post(`${DIRECTUS_URL}/collections`, aiPromptsCollection, { headers });
    console.log('✅ Created ai_prompts collection');

    // Add fields to ai_prompts
    const aiPromptFields = [
      {
        collection: 'ai_prompts',
        field: 'id',
        type: 'uuid',
        meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
        schema: { is_primary_key: true, has_auto_increment: false, is_nullable: false }
      },
      {
        collection: 'ai_prompts',
        field: 'name',
        type: 'string',
        meta: { interface: 'input', display: 'raw', required: true, note: 'Prompt name for identification' },
        schema: { is_nullable: false, max_length: 100 }
      },
      {
        collection: 'ai_prompts',
        field: 'prompt_type',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Bias Analysis', value: 'bias_analysis' },
              { text: 'Fact Checking', value: 'fact_checking' },
              { text: 'Story Clustering', value: 'story_clustering' },
              { text: 'Summarization', value: 'summarization' },
              { text: 'Q&A Generation', value: 'qa_generation' },
              { text: 'Palestine Analysis', value: 'palestine_analysis' },
              { text: 'Custom', value: 'custom' }
            ]
          },
          required: true
        },
        schema: { is_nullable: false, max_length: 50 }
      },
      {
        collection: 'ai_prompts',
        field: 'system_prompt',
        type: 'text',
        meta: { interface: 'input-rich-text-html', required: true, note: 'System prompt that defines AI behavior and context' },
        schema: { is_nullable: false }
      },
      {
        collection: 'ai_prompts',
        field: 'user_prompt_template',
        type: 'text',
        meta: { interface: 'input-rich-text-html', required: true, note: 'User prompt template with variables like {{title}}, {{content}}' },
        schema: { is_nullable: false }
      },
      {
        collection: 'ai_prompts',
        field: 'response_format',
        type: 'json',
        meta: { interface: 'input-code', options: { language: 'json' }, note: 'Expected JSON response format schema' },
        schema: { is_nullable: true }
      },
      {
        collection: 'ai_prompts',
        field: 'temperature',
        type: 'float',
        meta: { interface: 'input', note: 'AI temperature (0.0-1.0)', default_value: 0.3 },
        schema: { is_nullable: false, default_value: 0.3 }
      },
      {
        collection: 'ai_prompts',
        field: 'max_tokens',
        type: 'integer',
        meta: { interface: 'input', note: 'Maximum tokens in response', default_value: 2000 },
        schema: { is_nullable: false, default_value: 2000 }
      },
      {
        collection: 'ai_prompts',
        field: 'status',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Active', value: 'active' },
              { text: 'Inactive', value: 'inactive' },
              { text: 'Testing', value: 'testing' }
            ]
          },
          default_value: 'active'
        },
        schema: { is_nullable: false, default_value: 'active', max_length: 20 }
      },
      {
        collection: 'ai_prompts',
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-created'] },
        schema: { is_nullable: false }
      },
      {
        collection: 'ai_prompts',
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-updated'] },
        schema: { is_nullable: false }
      }
    ];

    for (const field of aiPromptFields) {
      await axios.post(`${DIRECTUS_URL}/fields/${field.collection}`, field, { headers });
    }
    console.log('✅ Added fields to ai_prompts collection');

    // 3. RSS Sources Collection (Enhanced)
    const rssSourcesCollection = {
      collection: 'rss_sources',
      meta: {
        collection: 'rss_sources',
        icon: 'rss_feed',
        note: 'RSS feeds and news sources configuration',
        display_template: '{{name}} - {{status}}'
      },
      schema: {
        name: 'rss_sources'
      }
    };

    await axios.post(`${DIRECTUS_URL}/collections`, rssSourcesCollection, { headers });
    console.log('✅ Created rss_sources collection');

    // Add fields to rss_sources
    const rssSourceFields = [
      {
        collection: 'rss_sources',
        field: 'id',
        type: 'uuid',
        meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] },
        schema: { is_primary_key: true, has_auto_increment: false, is_nullable: false }
      },
      {
        collection: 'rss_sources',
        field: 'name',
        type: 'string',
        meta: { interface: 'input', display: 'raw', required: true, note: 'Source name (e.g., BBC News, CNN)' },
        schema: { is_nullable: false, max_length: 100 }
      },
      {
        collection: 'rss_sources',
        field: 'source_type',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'RSS Feed', value: 'rss' },
              { text: 'Telegram Channel', value: 'telegram' },
              { text: 'YouTube Channel', value: 'youtube' },
              { text: 'Twitter Feed', value: 'twitter' },
              { text: 'Custom API', value: 'api' }
            ]
          },
          required: true
        },
        schema: { is_nullable: false, max_length: 20 }
      },
      {
        collection: 'rss_sources',
        field: 'url',
        type: 'string',
        meta: { interface: 'input', required: true, note: 'RSS URL, Telegram channel, YouTube channel, etc.' },
        schema: { is_nullable: false, max_length: 500 }
      },
      {
        collection: 'rss_sources',
        field: 'bias_rating',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Left', value: 'left' },
              { text: 'Lean Left', value: 'lean_left' },
              { text: 'Center', value: 'center' },
              { text: 'Lean Right', value: 'lean_right' },
              { text: 'Right', value: 'right' },
              { text: 'Mixed', value: 'mixed' },
              { text: 'Unknown', value: 'unknown' }
            ]
          },
          default_value: 'unknown'
        },
        schema: { is_nullable: false, default_value: 'unknown', max_length: 20 }
      },
      {
        collection: 'rss_sources',
        field: 'credibility_score',
        type: 'float',
        meta: { interface: 'input', note: 'Credibility score (0.0-1.0)', default_value: 0.5 },
        schema: { is_nullable: false, default_value: 0.5 }
      },
      {
        collection: 'rss_sources',
        field: 'country',
        type: 'string',
        meta: { interface: 'input', note: 'Source country/region' },
        schema: { is_nullable: true, max_length: 50 }
      },
      {
        collection: 'rss_sources',
        field: 'language',
        type: 'string',
        meta: { interface: 'input', note: 'Primary language', default_value: 'en' },
        schema: { is_nullable: false, default_value: 'en', max_length: 10 }
      },
      {
        collection: 'rss_sources',
        field: 'category',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'General News', value: 'general' },
              { text: 'Politics', value: 'politics' },
              { text: 'Technology', value: 'technology' },
              { text: 'Business', value: 'business' },
              { text: 'Sports', value: 'sports' },
              { text: 'Health', value: 'health' },
              { text: 'Science', value: 'science' },
              { text: 'Entertainment', value: 'entertainment' }
            ]
          },
          default_value: 'general'
        },
        schema: { is_nullable: false, default_value: 'general', max_length: 30 }
      },
      {
        collection: 'rss_sources',
        field: 'fetch_frequency',
        type: 'integer',
        meta: { interface: 'input', note: 'Fetch frequency in minutes', default_value: 15 },
        schema: { is_nullable: false, default_value: 15 }
      },
      {
        collection: 'rss_sources',
        field: 'cluster_eligible',
        type: 'boolean',
        meta: { interface: 'boolean', note: 'Include articles from this source in clustering', default_value: true },
        schema: { is_nullable: false, default_value: true }
      },
      {
        collection: 'rss_sources',
        field: 'status',
        type: 'string',
        meta: { 
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Active', value: 'active' },
              { text: 'Inactive', value: 'inactive' },
              { text: 'Error', value: 'error' },
              { text: 'Testing', value: 'testing' }
            ]
          },
          default_value: 'active'
        },
        schema: { is_nullable: false, default_value: 'active', max_length: 20 }
      },
      {
        collection: 'rss_sources',
        field: 'last_fetched',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, note: 'Last successful fetch time' },
        schema: { is_nullable: true }
      },
      {
        collection: 'rss_sources',
        field: 'error_message',
        type: 'text',
        meta: { interface: 'input-multiline', readonly: true, note: 'Last error message if any' },
        schema: { is_nullable: true }
      },
      {
        collection: 'rss_sources',
        field: 'created_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-created'] },
        schema: { is_nullable: false }
      },
      {
        collection: 'rss_sources',
        field: 'updated_at',
        type: 'timestamp',
        meta: { interface: 'datetime', readonly: true, hidden: true, special: ['date-updated'] },
        schema: { is_nullable: false }
      }
    ];

    for (const field of rssSourceFields) {
      await axios.post(`${DIRECTUS_URL}/fields/${field.collection}`, field, { headers });
    }
    console.log('✅ Added fields to rss_sources collection');

    console.log('\n🎉 Successfully created AI Configuration Management Collections!');
    console.log('\nCollections created:');
    console.log('- ai_providers: Manage AI API providers and keys');
    console.log('- ai_prompts: Manage AI prompts and rules');
    console.log('- rss_sources: Manage RSS feeds and news sources');
    console.log('\nYou can now access these in Directus admin panel to configure AI settings.');

  } catch (error) {
    console.error('❌ Error creating collections:', error.response?.data || error.message);
  }
}

// Run the script
createAIConfigCollections();
