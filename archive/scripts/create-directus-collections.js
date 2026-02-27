const { default: fetch } = require('node-fetch');

const DIRECTUS_URL = "http://168.231.111.192:8055";
const ADMIN_EMAIL = "admin@asha.news";
const ADMIN_PASSWORD = "AdminPass123";

async function createDirectusCollections() {
  try {
    console.log("🔐 Authenticating with Directus...");
    
    // Get admin token
    const authResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const authData = await authResponse.json();
    const adminToken = authData.data?.access_token;

    if (!adminToken) {
      console.error("❌ Failed to authenticate:", authData);
      return;
    }

    console.log("✅ Authentication successful");

    // Collection schemas to create
    const collections = [
      {
        collection: "articles",
        meta: {
          icon: "article",
          note: "News articles and content",
          display_template: "{{title}}",
          hidden: false,
          singleton: false
        },
        schema: { name: "articles" },
        fields: [
          {
            field: "id",
            type: "integer",
            meta: { hidden: true, readonly: true, interface: "input" },
            schema: { is_primary_key: true, has_auto_increment: true }
          },
          {
            field: "title",
            type: "string",
            meta: { interface: "input", options: { placeholder: "Article title" } },
            schema: { max_length: 255 }
          },
          {
            field: "content",
            type: "text",
            meta: { interface: "input-rich-text-html" },
            schema: {}
          },
          {
            field: "published",
            type: "boolean",
            meta: { interface: "boolean" },
            schema: { default_value: false }
          },
          {
            field: "slug",
            type: "string",
            meta: { interface: "input" },
            schema: { max_length: 255 }
          }
        ]
      },
      {
        collection: "site_configuration",
        meta: {
          icon: "settings",
          note: "Site configuration settings",
          singleton: true,
          hidden: false
        },
        schema: { name: "site_configuration" },
        fields: [
          {
            field: "id",
            type: "integer",
            meta: { hidden: true, readonly: true, interface: "input" },
            schema: { is_primary_key: true, has_auto_increment: true }
          },
          {
            field: "site_name",
            type: "string",
            meta: { interface: "input" },
            schema: { max_length: 255 }
          },
          {
            field: "site_description",
            type: "text",
            meta: { interface: "input-multiline" },
            schema: {}
          },
          {
            field: "contact_email",
            type: "string",
            meta: { interface: "input" },
            schema: { max_length: 255 }
          }
        ]
      },
      {
        collection: "news_sources",
        meta: {
          icon: "rss_feed",
          note: "News sources and RSS feeds",
          display_template: "{{name}}",
          hidden: false,
          singleton: false
        },
        schema: { name: "news_sources" },
        fields: [
          {
            field: "id",
            type: "integer",
            meta: { hidden: true, readonly: true, interface: "input" },
            schema: { is_primary_key: true, has_auto_increment: true }
          },
          {
            field: "name",
            type: "string",
            meta: { interface: "input" },
            schema: { max_length: 255 }
          },
          {
            field: "url",
            type: "string",
            meta: { interface: "input" },
            schema: { max_length: 500 }
          },
          {
            field: "rss_url",
            type: "string",
            meta: { interface: "input" },
            schema: { max_length: 500 }
          },
          {
            field: "political_bias",
            type: "string",
            meta: { interface: "select-dropdown", options: { choices: [
              { text: "Left", value: "left" },
              { text: "Center-Left", value: "center-left" },
              { text: "Center", value: "center" },
              { text: "Center-Right", value: "center-right" },
              { text: "Right", value: "right" }
            ]}},
            schema: { max_length: 50 }
          },
          {
            field: "credibility_score",
            type: "integer",
            meta: { interface: "input" },
            schema: {}
          },
          {
            field: "enabled",
            type: "boolean",
            meta: { interface: "boolean" },
            schema: { default_value: true }
          }
        ]
      }
    ];

    // Create each collection
    for (const collectionConfig of collections) {
      console.log(`📦 Creating collection: ${collectionConfig.collection}`);
      
      try {
        // Create collection
        const collectionResponse = await fetch(`${DIRECTUS_URL}/collections`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(collectionConfig)
        });

        if (collectionResponse.ok) {
          console.log(`  ✅ Collection ${collectionConfig.collection} created successfully`);
        } else {
          const error = await collectionResponse.json();
          if (error.errors?.[0]?.message?.includes("already exists")) {
            console.log(`  ⚠️  Collection ${collectionConfig.collection} already exists`);
          } else {
            console.log(`  ❌ Failed to create ${collectionConfig.collection}:`, error);
          }
        }
      } catch (error) {
        console.log(`  ❌ Error creating ${collectionConfig.collection}:`, error.message);
      }
    }

    console.log("\n🎉 Collection creation completed!");
    console.log("📋 Next steps:");
    console.log("   1. Refresh your Directus admin panel");
    console.log("   2. Check Data Model to see the new collections");
    console.log("   3. Try accessing collections from the Content section");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createDirectusCollections();
