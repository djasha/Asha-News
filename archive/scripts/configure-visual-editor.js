const axios = require('axios');

// Prefer environment variables; fall back to repo defaults if not set
const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://168.231.111.192:8055";
const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || "admin@asha.news";
const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || "AdminPass123";
const DIRECTUS_TOKEN_ENV = process.env.DIRECTUS_TOKEN || null;
const PREVIEW_BASE_URL = (process.env.PREVIEW_BASE_URL || "http://localhost:3000").replace(/\/$/, '');

async function configureVisualEditor() {
  try {
    // Authenticate (prefer DIRECTUS_TOKEN if provided)
    let token = DIRECTUS_TOKEN_ENV;
    if (!token) {
      const authResponse = await axios.post(`${DIRECTUS_URL}/auth/login`, {
        email: DIRECTUS_ADMIN_EMAIL,
        password: DIRECTUS_ADMIN_PASSWORD,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      token = authResponse.data?.data?.access_token;
      if (!token) throw new Error('Authentication failed: missing access token');
      console.log('✅ Authenticated successfully');
    } else {
      console.log('✅ Using provided DIRECTUS_TOKEN');
    }

    // Helper function
    const makeRequest = async (endpoint, method = 'GET', body = null) => {
      try {
        const url = `${DIRECTUS_URL}${endpoint}`;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        let resp;
        if (method === 'GET') {
          resp = await axios.get(url, { headers });
        } else if (method === 'PATCH') {
          resp = await axios.patch(url, body, { headers });
        } else if (method === 'POST') {
          resp = await axios.post(url, body, { headers });
        } else {
          resp = await axios({ url, method, headers, data: body });
        }
        return resp.data;
      } catch (err) {
        console.error(`Request failed: ${err.response?.status} - ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
        return null;
      }
    };

    // Configure visual editor settings
    console.log('🔧 Configuring visual editor settings...');
    
    // Update visual editor settings
    const visualEditorSettings = {
      project_url: PREVIEW_BASE_URL,
      project_name: 'Asha News',
      project_descriptor: 'AI-Powered News Analysis Platform',
      project_logo: null,
      public_foreground: null,
      public_background: null,
      public_note: 'Visual page editor for Asha News website',
      auth_login_attempts: 25,
      auth_password_policy: null,
      storage_asset_transform: 'all',
      storage_asset_presets: null,
      files_mime_type_allow_list: null,
      mapbox_key: null,
      module_bar: null,
      project_color: '#6366f1',
      default_language: 'en-US',
      custom_css: null,
      storage_default_folder: null,
      basemaps: null,
      mapbox_style: null,
      theme_light: null,
      theme_dark: null,
      theme_light_overrides: null,
      theme_dark_overrides: null
    };

    // Try to update existing settings
    const updateResult = await makeRequest('/settings', 'PATCH', visualEditorSettings);
    
    if (updateResult) {
      console.log('✅ Visual editor settings updated');
    } else {
      console.log('⚠️  Could not update settings, trying to create...');
      const createResult = await makeRequest('/settings', 'POST', visualEditorSettings);
      if (createResult) {
        console.log('✅ Visual editor settings created');
      }
    }

    // Configure pages collection for visual editor
    console.log('📄 Configuring pages collection for visual editor...');
    
    // Update pages collection metadata with preview URL
    const pagesCollectionUpdate = {
      meta: {
        icon: 'web',
        note: 'Visual page builder for website pages',
        display_template: '{{title}}',
        hidden: false,
        singleton: false,
        sort_field: 'sort',
        accountability: 'all',
        sort: 1,
        group: null,
        collapse: 'open',
        preview_url: `${PREVIEW_BASE_URL}/page/{{slug}}`,
        versioning: false
      }
    };

    const collectionResult = await makeRequest('/collections/pages', 'PATCH', pagesCollectionUpdate);
    
    if (collectionResult) {
      console.log('✅ Pages collection configured for visual editor');
    }

    console.log('\n🎉 Visual editor configuration complete!');
    console.log('📋 Summary:');
    console.log(`  - Project URL set to ${PREVIEW_BASE_URL}`);
    console.log(`  - Pages collection preview URL: ${PREVIEW_BASE_URL}/page/{{slug}}`);
    console.log('  - Visual editor should now work properly');
    console.log('\n🔗 Next steps:');
    console.log('  1. Go to Directus Visual Editor');
    console.log('  2. It should now show your pages');
    console.log('  3. Select a page to start editing');

  } catch (error) {
    console.error('❌ Error configuring visual editor:', error.message);
  }
}

// Run the function
configureVisualEditor();
