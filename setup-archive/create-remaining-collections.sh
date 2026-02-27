#!/bin/bash

# Create Remaining Collections for Asha News Directus CMS
# Following DIRECTUS_COLLECTION_FIX_GUIDE.md

DIRECTUS_URL="http://168.231.111.192:8055"
TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Creating Remaining Collections..."

# 1. Sitemap Entries Collection
echo "🗺️ Creating sitemap_entries collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "sitemap_entries",
    "meta": {
      "collection": "sitemap_entries",
      "icon": "map",
      "note": "SEO sitemap management",
      "display_template": "{{url}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "priority"
    },
    "schema": {
      "name": "sitemap_entries"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for sitemap_entries
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "sitemap_entries",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/sitemap_entries"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "url",
    "type": "string",
    "meta": {
      "field": "url",
      "collection": "sitemap_entries",
      "interface": "input",
      "required": true,
      "width": "full"
    },
    "schema": {
      "is_nullable": false,
      "max_length": 500
    }
  }' "$DIRECTUS_URL/fields/sitemap_entries"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "priority",
    "type": "float",
    "meta": {
      "field": "priority",
      "collection": "sitemap_entries",
      "interface": "input",
      "note": "Priority from 0.0 to 1.0"
    },
    "schema": {
      "is_nullable": true,
      "default_value": 0.5
    }
  }' "$DIRECTUS_URL/fields/sitemap_entries"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "changefreq",
    "type": "string",
    "meta": {
      "field": "changefreq",
      "collection": "sitemap_entries",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Always", "value": "always"},
          {"text": "Hourly", "value": "hourly"},
          {"text": "Daily", "value": "daily"},
          {"text": "Weekly", "value": "weekly"},
          {"text": "Monthly", "value": "monthly"},
          {"text": "Yearly", "value": "yearly"},
          {"text": "Never", "value": "never"}
        ]
      }
    },
    "schema": {
      "is_nullable": true,
      "default_value": "weekly"
    }
  }' "$DIRECTUS_URL/fields/sitemap_entries"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "lastmod",
    "type": "timestamp",
    "meta": {
      "field": "lastmod",
      "collection": "sitemap_entries",
      "interface": "datetime"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/sitemap_entries"

echo "✅ sitemap_entries collection created"

# 2. User Subscriptions Collection
echo "📧 Creating user_subscriptions collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "user_subscriptions",
    "meta": {
      "collection": "user_subscriptions",
      "icon": "email",
      "note": "User subscription management",
      "display_template": "{{user_id}} - {{subscription_type}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "created_at"
    },
    "schema": {
      "name": "user_subscriptions"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for user_subscriptions
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "user_subscriptions",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/user_subscriptions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "user_id",
    "type": "string",
    "meta": {
      "field": "user_id",
      "collection": "user_subscriptions",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/user_subscriptions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "subscription_type",
    "type": "string",
    "meta": {
      "field": "subscription_type",
      "collection": "user_subscriptions",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Daily Brief", "value": "daily_brief"},
          {"text": "Breaking News", "value": "breaking_news"},
          {"text": "Weekly Digest", "value": "weekly_digest"},
          {"text": "Topic Alerts", "value": "topic_alerts"},
          {"text": "Premium", "value": "premium"}
        ]
      }
    },
    "schema": {
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/user_subscriptions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "status",
    "type": "string",
    "meta": {
      "field": "status",
      "collection": "user_subscriptions",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Active", "value": "active"},
          {"text": "Paused", "value": "paused"},
          {"text": "Cancelled", "value": "cancelled"}
        ]
      }
    },
    "schema": {
      "is_nullable": false,
      "default_value": "active"
    }
  }' "$DIRECTUS_URL/fields/user_subscriptions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "collection": "user_subscriptions",
      "interface": "datetime",
      "readonly": true
    },
    "schema": {
      "is_nullable": false,
      "default_value": "CURRENT_TIMESTAMP"
    }
  }' "$DIRECTUS_URL/fields/user_subscriptions"

echo "✅ user_subscriptions collection created"

# 3. User Sessions Collection
echo "🔐 Creating user_sessions collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "user_sessions",
    "meta": {
      "collection": "user_sessions",
      "icon": "login",
      "note": "User session tracking",
      "display_template": "{{user_id}} - {{created_at}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "created_at"
    },
    "schema": {
      "name": "user_sessions"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for user_sessions
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "user_sessions",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/user_sessions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "user_id",
    "type": "string",
    "meta": {
      "field": "user_id",
      "collection": "user_sessions",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/user_sessions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "session_token",
    "type": "string",
    "meta": {
      "field": "session_token",
      "collection": "user_sessions",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 500
    }
  }' "$DIRECTUS_URL/fields/user_sessions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "ip_address",
    "type": "string",
    "meta": {
      "field": "ip_address",
      "collection": "user_sessions",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 45
    }
  }' "$DIRECTUS_URL/fields/user_sessions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "user_agent",
    "type": "text",
    "meta": {
      "field": "user_agent",
      "collection": "user_sessions",
      "interface": "input-multiline"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/user_sessions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "collection": "user_sessions",
      "interface": "datetime",
      "readonly": true
    },
    "schema": {
      "is_nullable": false,
      "default_value": "CURRENT_TIMESTAMP"
    }
  }' "$DIRECTUS_URL/fields/user_sessions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "expires_at",
    "type": "timestamp",
    "meta": {
      "field": "expires_at",
      "collection": "user_sessions",
      "interface": "datetime"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/user_sessions"

echo "✅ user_sessions collection created"

# 4. Dashboard Widgets Collection
echo "📊 Creating dashboard_widgets collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "dashboard_widgets",
    "meta": {
      "collection": "dashboard_widgets",
      "icon": "dashboard",
      "note": "Dashboard widget definitions",
      "display_template": "{{title}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "sort_order"
    },
    "schema": {
      "name": "dashboard_widgets"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for dashboard_widgets
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "dashboard_widgets",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/dashboard_widgets"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "title",
    "type": "string",
    "meta": {
      "field": "title",
      "collection": "dashboard_widgets",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/dashboard_widgets"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "widget_type",
    "type": "string",
    "meta": {
      "field": "widget_type",
      "collection": "dashboard_widgets",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Chart", "value": "chart"},
          {"text": "Stats", "value": "stats"},
          {"text": "List", "value": "list"},
          {"text": "Feed", "value": "feed"},
          {"text": "Custom", "value": "custom"}
        ]
      }
    },
    "schema": {
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/dashboard_widgets"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "configuration",
    "type": "json",
    "meta": {
      "field": "configuration",
      "collection": "dashboard_widgets",
      "interface": "input-code",
      "options": {
        "language": "json"
      }
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/dashboard_widgets"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "sort_order",
    "type": "integer",
    "meta": {
      "field": "sort_order",
      "collection": "dashboard_widgets",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "default_value": 0
    }
  }' "$DIRECTUS_URL/fields/dashboard_widgets"

echo "✅ dashboard_widgets collection created"

# 5. User Dashboard Layouts Collection
echo "🎨 Creating user_dashboard_layouts collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "user_dashboard_layouts",
    "meta": {
      "collection": "user_dashboard_layouts",
      "icon": "view_quilt",
      "note": "User dashboard customization",
      "display_template": "{{user_id}} Dashboard",
      "hidden": false,
      "singleton": false
    },
    "schema": {
      "name": "user_dashboard_layouts"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for user_dashboard_layouts
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "user_dashboard_layouts",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/user_dashboard_layouts"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "user_id",
    "type": "string",
    "meta": {
      "field": "user_id",
      "collection": "user_dashboard_layouts",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/user_dashboard_layouts"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "layout_config",
    "type": "json",
    "meta": {
      "field": "layout_config",
      "collection": "user_dashboard_layouts",
      "interface": "input-code",
      "options": {
        "language": "json"
      }
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/user_dashboard_layouts"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "updated_at",
    "type": "timestamp",
    "meta": {
      "field": "updated_at",
      "collection": "user_dashboard_layouts",
      "interface": "datetime",
      "readonly": true
    },
    "schema": {
      "is_nullable": false,
      "default_value": "CURRENT_TIMESTAMP"
    }
  }' "$DIRECTUS_URL/fields/user_dashboard_layouts"

echo "✅ user_dashboard_layouts collection created"

echo ""
echo "🎉 Phase 1 Complete! Created 5 collections:"
echo "   1. ✅ sitemap_entries"
echo "   2. ✅ user_subscriptions"  
echo "   3. ✅ user_sessions"
echo "   4. ✅ dashboard_widgets"
echo "   5. ✅ user_dashboard_layouts"
echo ""
echo "⏳ Continuing with remaining collections..."
