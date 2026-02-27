const axios = require('axios');

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || 'your-directus-token';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function setupAIConfig() {
  try {
    console.log('Setting up AI Configuration Collections...');

    // Populate AI Providers with current setup
    const aiProviders = [
      {
        name: 'Groq',
        provider_type: 'groq',
        api_key: process.env.GROQ_API_KEY || 'your-groq-api-key',
        base_url: 'https://api.groq.com/openai/v1',
        model_name: 'llama-3.1-8b-instant',
        status: 'active',
        priority: 1,
        rate_limit_per_minute: 30
      },
      {
        name: 'OpenAI',
        provider_type: 'openai',
        api_key: process.env.OPENAI_API_KEY || 'your-openai-api-key',
        base_url: 'https://api.openai.com/v1',
        model_name: 'gpt-4',
        status: 'active',
        priority: 2,
        rate_limit_per_minute: 60
      },
      {
        name: 'Google AI',
        provider_type: 'google',
        api_key: process.env.GOOGLE_AI_API_KEY || 'your-google-ai-api-key',
        base_url: 'https://generativelanguage.googleapis.com/v1',
        model_name: 'gemini-pro',
        status: 'active',
        priority: 3,
        rate_limit_per_minute: 60
      }
    ];

    // Try to create AI providers
    for (const provider of aiProviders) {
      try {
        await axios.post(`${DIRECTUS_URL}/items/ai_providers`, provider, { headers });
        console.log(`✅ Added ${provider.name} provider`);
      } catch (error) {
        console.log(`⚠️  ${provider.name} provider may already exist`);
      }
    }

    // Populate AI Prompts with current prompts
    const aiPrompts = [
      {
        name: 'Palestine Bias Analysis',
        prompt_type: 'palestine_analysis',
        system_prompt: 'You are an expert analyst specializing in Palestine/Israel conflict reporting. Analyze articles for bias, factuality, and provide context with a focus on Palestinian perspectives and rights. You understand the historical context of Israeli occupation and Palestinian resistance. Respond only with valid JSON.',
        user_prompt_template: `Analyze this article about Palestine/Israel with sophisticated bias detection:

Title: {{title}}
Summary: {{summary}}
Content: {{content}}
Source: {{source_name}}

Provide comprehensive analysis in this exact JSON format:
{
  "bias_analysis": {
    "geographic_bias": {
      "score": 0.7,
      "direction": "pro-israel",
      "explanation": "Detailed explanation of geographic bias"
    },
    "institutional_bias": {
      "score": 0.6,
      "type": "western_media",
      "explanation": "Analysis of institutional perspective"
    },
    "language_bias": {
      "loaded_terms": ["terrorist", "conflict", "disputed"],
      "framing": "How the story is framed",
      "omissions": ["key context omitted"]
    },
    "overall_bias_score": 0.65,
    "bias_explanation": "Comprehensive bias assessment"
  },
  "factuality_analysis": {
    "accuracy_score": 0.8,
    "verification_status": "VERIFIED",
    "sources_quality": 0.7,
    "evidence_strength": 0.6,
    "fact_check_notes": "Detailed factual assessment",
    "missing_context": ["important context not mentioned"],
    "historical_accuracy": 0.8
  },
  "palestinian_context": {
    "impact_on_palestinians": "How this affects Palestinian people",
    "rights_implications": "Human rights and legal implications",
    "historical_context": "Relevant historical background",
    "resistance_context": "Context of Palestinian resistance",
    "occupation_context": "How this relates to Israeli occupation"
  }
}`,
        temperature: 0.3,
        max_tokens: 2000,
        status: 'active'
      },
      {
        name: 'Story Clustering',
        prompt_type: 'story_clustering',
        system_prompt: 'You are an expert at analyzing news articles and determining if they cover the same story or event. You understand context, timing, and can identify when articles from different sources are reporting on the same underlying news story.',
        user_prompt_template: `Analyze these articles to determine if they should be clustered together as the same story:

Article 1:
Title: {{title1}}
Summary: {{summary1}}
Source: {{source1}}

Article 2:
Title: {{title2}}
Summary: {{summary2}}
Source: {{source2}}

Respond with JSON:
{
  "should_cluster": true/false,
  "similarity_score": 0.85,
  "explanation": "Why these articles should or should not be clustered",
  "story_title": "Suggested title for the story cluster",
  "key_elements": ["shared story elements"]
}`,
        temperature: 0.2,
        max_tokens: 1000,
        status: 'active'
      },
      {
        name: 'Story Summary Generation',
        prompt_type: 'summarization',
        system_prompt: 'You are an expert journalist who creates neutral, comprehensive summaries of news stories from multiple sources. You synthesize information while maintaining objectivity and noting different perspectives.',
        user_prompt_template: `Create a comprehensive summary for this story cluster:

Story Title: {{cluster_title}}
Articles: {{articles_data}}

Generate a JSON response:
{
  "summary": "Neutral summary combining all sources",
  "key_facts": ["fact1", "fact2", "fact3"],
  "different_perspectives": ["perspective1", "perspective2"],
  "suggested_questions": ["question1", "question2", "question3"],
  "suggested_answers": ["answer1", "answer2", "answer3"]
}`,
        temperature: 0.4,
        max_tokens: 1500,
        status: 'active'
      }
    ];

    // Try to create AI prompts
    for (const prompt of aiPrompts) {
      try {
        await axios.post(`${DIRECTUS_URL}/items/ai_prompts`, prompt, { headers });
        console.log(`✅ Added ${prompt.name} prompt`);
      } catch (error) {
        console.log(`⚠️  ${prompt.name} prompt may already exist`);
      }
    }

    // Populate RSS Sources with sample sources
    const rssSources = [
      {
        name: 'BBC News',
        source_type: 'rss',
        url: 'http://feeds.bbci.co.uk/news/rss.xml',
        bias_rating: 'center',
        credibility_score: 0.85,
        country: 'UK',
        language: 'en',
        category: 'general',
        fetch_frequency: 15,
        cluster_eligible: true,
        status: 'active'
      },
      {
        name: 'Al Jazeera English',
        source_type: 'rss',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        bias_rating: 'lean_left',
        credibility_score: 0.80,
        country: 'Qatar',
        language: 'en',
        category: 'general',
        fetch_frequency: 15,
        cluster_eligible: true,
        status: 'active'
      },
      {
        name: 'Reuters',
        source_type: 'rss',
        url: 'https://feeds.reuters.com/reuters/topNews',
        bias_rating: 'center',
        credibility_score: 0.90,
        country: 'UK',
        language: 'en',
        category: 'general',
        fetch_frequency: 10,
        cluster_eligible: true,
        status: 'active'
      }
    ];

    // Try to create RSS sources
    for (const source of rssSources) {
      try {
        await axios.post(`${DIRECTUS_URL}/items/rss_sources`, source, { headers });
        console.log(`✅ Added ${source.name} RSS source`);
      } catch (error) {
        console.log(`⚠️  ${source.name} RSS source may already exist`);
      }
    }

    console.log('\n🎉 AI Configuration setup complete!');
    console.log('\nYou can now manage:');
    console.log('- AI Providers: Configure API keys and models');
    console.log('- AI Prompts: Edit prompts and rules for different analysis types');
    console.log('- RSS Sources: Add and manage news feeds');
    console.log('\nAccess these collections in Directus admin panel.');

  } catch (error) {
    console.error('❌ Error setting up AI config:', error.response?.data || error.message);
  }
}

// Run the script
setupAIConfig();
