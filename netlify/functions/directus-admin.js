
const handler = async (event, context) => {
  const DIRECTUS_URL = process.env.DIRECTUS_URL;
  const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
  const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
  const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN;

  if (!DIRECTUS_URL) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "DIRECTUS_URL not configured" })
    };
  }

  try {
    let adminToken = DIRECTUS_ADMIN_TOKEN || null;

    // Fallback to credential login only if token is not provided
    if (!adminToken) {
      if (!DIRECTUS_ADMIN_EMAIL || !DIRECTUS_ADMIN_PASSWORD) {
        return {
          statusCode: 500,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Directus admin authentication not configured",
            required: ["DIRECTUS_ADMIN_TOKEN (preferred) or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD"]
          })
        };
      }

      const authResponse = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: DIRECTUS_ADMIN_EMAIL,
          password: DIRECTUS_ADMIN_PASSWORD
        })
      });

      const authData = await authResponse.json();
      adminToken = authData.data?.access_token;
    }

    if (!adminToken) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Failed to authenticate with Directus" })
      };
    }

    const action = event.queryStringParameters?.action;

    switch (action) {
      case "fix-permissions":
        return await fixPermissions(DIRECTUS_URL, adminToken);
      case "list-collections":
        return await listCollections(DIRECTUS_URL, adminToken);
      case "create-sample-data":
        return await createSampleData(DIRECTUS_URL, adminToken);
      case "get-users":
        return await getUsers(DIRECTUS_URL, adminToken);
      default:
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            error: "Invalid action",
            availableActions: ["fix-permissions", "list-collections", "create-sample-data", "get-users"]
          })
        };
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      })
    };
  }
};

exports.handler = handler;

async function fixPermissions(directusUrl, adminToken) {
  try {
    // Get Administrator policy ID
    const policiesResponse = await fetch(`${directusUrl}/policies?filter[name][_eq]=Administrator&fields[]=id&limit=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const policiesData = await policiesResponse.json();
    const adminPolicyId = policiesData.data?.[0]?.id;

    if (!adminPolicyId) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Administrator policy not found" })
      };
    }

    // Ensure Administrator policy has correct settings
    await fetch(`${directusUrl}/policies/${adminPolicyId}`, {
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

    const results = [];

    // Grant CRUD permissions for each collection
    for (const collection of collections) {
      for (const action of ["create", "read", "update", "delete", "share"]) {
        try {
          const permResponse = await fetch(`${directusUrl}/permissions`, {
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
          
          if (permResponse.ok) {
            results.push(`${collection}.${action}: granted`);
          } else {
            results.push(`${collection}.${action}: ${permResponse.status}`);
          }
        } catch (error) {
          results.push(`${collection}.${action}: error`);
        }
      }
    }

    // Clear cache
    await fetch(`${directusUrl}/utils/cache/clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        adminPolicyId,
        results
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to fix permissions",
        details: error.message 
      })
    };
  }
}

async function listCollections(directusUrl, adminToken) {
  try {
    const response = await fetch(`${directusUrl}/collections`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: data.data?.map((c) => c.collection) || []
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to list collections",
        details: error.message 
      })
    };
  }
}

async function createSampleData(directusUrl, adminToken) {
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

  const results = [];

  for (const item of sampleData) {
    try {
      const response = await fetch(`${directusUrl}/items/${item.collection}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(item.data)
      });

      if (response.ok) {
        const data = await response.json();
        results.push(`${item.collection}: created (id: ${data.data?.id})`);
      } else {
        results.push(`${item.collection}: ${response.status}`);
      }
    } catch (error) {
      results.push(`${item.collection}: error`);
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      results
    })
  };
}

async function getUsers(directusUrl, adminToken) {
  try {
    const response = await fetch(`${directusUrl}/users?fields[]=id&fields[]=email&fields[]=first_name&fields[]=policies`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        users: data.data || []
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Failed to get users",
        details: error.message 
      })
    };
  }
}

