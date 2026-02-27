const { default: fetch } = require('node-fetch');

const DIRECTUS_URL = "http://168.231.111.192:8055";
const ADMIN_EMAIL = "admin@asha.news";
const ADMIN_PASSWORD = "AdminPass123";

async function fixDirectusPermissions() {
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

    // Get Administrator policy ID
    console.log("🔍 Finding Administrator policy...");
    const policiesResponse = await fetch(`${DIRECTUS_URL}/policies?filter[name][_eq]=Administrator&fields[]=id&limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const policiesData = await policiesResponse.json();
    const adminPolicyId = policiesData.data?.[0]?.id;

    if (!adminPolicyId) {
      console.error("❌ Administrator policy not found");
      return;
    }

    console.log(`✅ Found Administrator policy: ${adminPolicyId}`);

    // Ensure Administrator policy has correct settings
    console.log("⚙️  Configuring Administrator policy...");
    await fetch(`${DIRECTUS_URL}/policies/${adminPolicyId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        admin_access: false,
        app_access: true
      })
    });

    // Collections to grant permissions for
    const collections = [
      "articles", "site_configuration", "news_sources", "topic_categories",
      "homepage_sections", "breaking_news", "daily_briefs", "trending_topics",
      "legal_pages", "page_content", "navigation_menus", "menu_items",
      "feature_flags", "rss_sources", "global_settings"
    ];

    console.log("🛡️  Granting permissions for collections...");

    // Grant CRUD permissions for each collection
    for (const collection of collections) {
      console.log(`  📂 ${collection}`);
      for (const action of ["create", "read", "update", "delete", "share"]) {
        try {
          await fetch(`${DIRECTUS_URL}/permissions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${adminToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              policy: adminPolicyId,
              collection: collection,
              action: action,
              permissions: {},
              validation: {},
              presets: {},
              fields: ["*"]
            })
          });
        } catch (error) {
          // Ignore errors for existing permissions
        }
      }
    }

    // Clear cache
    console.log("🧹 Clearing cache...");
    await fetch(`${DIRECTUS_URL}/utils/cache/clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Get Backend Service user and fix their policies
    console.log("👤 Fixing Backend Service user policies...");
    const usersResponse = await fetch(`${DIRECTUS_URL}/users?fields[]=id&fields[]=email&fields[]=policies`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersData = await usersResponse.json();
    
    // Find Backend Service user (the one with multiple policies)
    const backendUser = usersData.data?.find(user => 
      user.policies && user.policies.length > 1
    );

    if (backendUser) {
      console.log(`  📝 Updating user ${backendUser.email || backendUser.id}`);
      await fetch(`${DIRECTUS_URL}/users/${backendUser.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          policies: [adminPolicyId]
        })
      });
    }

    // Add sample data to make collections appear as data models
    console.log("📝 Adding sample data...");
    
    const sampleData = [
      {
        collection: "articles",
        data: {
          title: "Sample News Article",
          content: "This is sample content for testing the CMS.",
          published: true
        }
      },
      {
        collection: "site_configuration", 
        data: {
          site_name: "Asha News",
          site_description: "Unbiased news with AI analysis",
          contact_email: "contact@asha.news"
        }
      },
      {
        collection: "news_sources",
        data: {
          name: "Reuters",
          url: "https://reuters.com",
          political_bias: "center",
          credibility_score: 95,
          enabled: true
        }
      }
    ];

    for (const item of sampleData) {
      try {
        const response = await fetch(`${DIRECTUS_URL}/items/${item.collection}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ ${item.collection}: created (id: ${data.data?.id})`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${item.collection}: ${error.message}`);
      }
    }

    console.log("\n🎉 Directus permissions fixed successfully!");
    console.log("📋 Next steps:");
    console.log("   1. Refresh your Directus admin panel");
    console.log("   2. Collections should now be clickable (table icons, not folders)");
    console.log("   3. Try creating/editing content in the collections");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

fixDirectusPermissions();
