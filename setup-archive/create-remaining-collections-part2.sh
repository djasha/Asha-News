#!/bin/bash

# Create Remaining Collections Part 2 for Asha News Directus CMS
# Following DIRECTUS_COLLECTION_FIX_GUIDE.md

DIRECTUS_URL="http://168.231.111.192:8055"
TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Creating Remaining Collections Part 2..."

# 6. Reading Statistics Collection
echo "📈 Creating reading_statistics collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "reading_statistics",
    "meta": {
      "collection": "reading_statistics",
      "icon": "analytics",
      "note": "User reading analytics",
      "display_template": "{{user_id}} - {{date}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "date"
    },
    "schema": {
      "name": "reading_statistics"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for reading_statistics
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "reading_statistics",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/reading_statistics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "user_id",
    "type": "string",
    "meta": {
      "field": "user_id",
      "collection": "reading_statistics",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/reading_statistics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "date",
    "type": "date",
    "meta": {
      "field": "date",
      "collection": "reading_statistics",
      "interface": "datetime",
      "required": true
    },
    "schema": {
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/reading_statistics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "articles_read",
    "type": "integer",
    "meta": {
      "field": "articles_read",
      "collection": "reading_statistics",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "default_value": 0
    }
  }' "$DIRECTUS_URL/fields/reading_statistics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "reading_time_minutes",
    "type": "integer",
    "meta": {
      "field": "reading_time_minutes",
      "collection": "reading_statistics",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "default_value": 0
    }
  }' "$DIRECTUS_URL/fields/reading_statistics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "categories_engaged",
    "type": "json",
    "meta": {
      "field": "categories_engaged",
      "collection": "reading_statistics",
      "interface": "tags"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/reading_statistics"

echo "✅ reading_statistics collection created"

# 7. Bias Reports Collection
echo "⚖️ Creating bias_reports collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "bias_reports",
    "meta": {
      "collection": "bias_reports",
      "icon": "balance",
      "note": "Bias analysis reports",
      "display_template": "{{article_id}} - {{bias_score}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "created_at"
    },
    "schema": {
      "name": "bias_reports"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for bias_reports
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "bias_reports",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/bias_reports"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "article_id",
    "type": "string",
    "meta": {
      "field": "article_id",
      "collection": "bias_reports",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/bias_reports"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "bias_score",
    "type": "float",
    "meta": {
      "field": "bias_score",
      "collection": "bias_reports",
      "interface": "input",
      "note": "Bias score from -1.0 (left) to 1.0 (right)"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/bias_reports"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "political_leaning",
    "type": "string",
    "meta": {
      "field": "political_leaning",
      "collection": "bias_reports",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Left", "value": "left"},
          {"text": "Center-Left", "value": "center-left"},
          {"text": "Center", "value": "center"},
          {"text": "Center-Right", "value": "center-right"},
          {"text": "Right", "value": "right"}
        ]
      }
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/bias_reports"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "confidence_score",
    "type": "float",
    "meta": {
      "field": "confidence_score",
      "collection": "bias_reports",
      "interface": "input",
      "note": "Confidence from 0.0 to 1.0"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/bias_reports"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "analysis_details",
    "type": "json",
    "meta": {
      "field": "analysis_details",
      "collection": "bias_reports",
      "interface": "input-code",
      "options": {
        "language": "json"
      }
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/bias_reports"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "collection": "bias_reports",
      "interface": "datetime",
      "readonly": true
    },
    "schema": {
      "is_nullable": false,
      "default_value": "CURRENT_TIMESTAMP"
    }
  }' "$DIRECTUS_URL/fields/bias_reports"

echo "✅ bias_reports collection created"

# 8. Content Moderation Collection
echo "🛡️ Creating content_moderation collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "content_moderation",
    "meta": {
      "collection": "content_moderation",
      "icon": "security",
      "note": "Content moderation workflow",
      "display_template": "{{content_type}} - {{status}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "created_at"
    },
    "schema": {
      "name": "content_moderation"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for content_moderation
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "content_moderation",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/content_moderation"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "content_type",
    "type": "string",
    "meta": {
      "field": "content_type",
      "collection": "content_moderation",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Article", "value": "article"},
          {"text": "Comment", "value": "comment"},
          {"text": "User Profile", "value": "user_profile"},
          {"text": "Image", "value": "image"}
        ]
      }
    },
    "schema": {
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/content_moderation"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "content_id",
    "type": "string",
    "meta": {
      "field": "content_id",
      "collection": "content_moderation",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/content_moderation"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "status",
    "type": "string",
    "meta": {
      "field": "status",
      "collection": "content_moderation",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Pending", "value": "pending"},
          {"text": "Approved", "value": "approved"},
          {"text": "Rejected", "value": "rejected"},
          {"text": "Flagged", "value": "flagged"}
        ]
      }
    },
    "schema": {
      "is_nullable": false,
      "default_value": "pending"
    }
  }' "$DIRECTUS_URL/fields/content_moderation"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "moderator_id",
    "type": "string",
    "meta": {
      "field": "moderator_id",
      "collection": "content_moderation",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/content_moderation"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "reason",
    "type": "text",
    "meta": {
      "field": "reason",
      "collection": "content_moderation",
      "interface": "input-multiline"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/content_moderation"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "created_at",
    "type": "timestamp",
    "meta": {
      "field": "created_at",
      "collection": "content_moderation",
      "interface": "datetime",
      "readonly": true
    },
    "schema": {
      "is_nullable": false,
      "default_value": "CURRENT_TIMESTAMP"
    }
  }' "$DIRECTUS_URL/fields/content_moderation"

echo "✅ content_moderation collection created"

# 9. Email Templates Collection
echo "📧 Creating email_templates collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "email_templates",
    "meta": {
      "collection": "email_templates",
      "icon": "email",
      "note": "Email template management",
      "display_template": "{{name}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "name"
    },
    "schema": {
      "name": "email_templates"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for email_templates
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "email_templates",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/email_templates"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "name",
    "type": "string",
    "meta": {
      "field": "name",
      "collection": "email_templates",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/email_templates"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "subject",
    "type": "string",
    "meta": {
      "field": "subject",
      "collection": "email_templates",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 500
    }
  }' "$DIRECTUS_URL/fields/email_templates"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "html_content",
    "type": "text",
    "meta": {
      "field": "html_content",
      "collection": "email_templates",
      "interface": "input-rich-text-html"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/email_templates"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "text_content",
    "type": "text",
    "meta": {
      "field": "text_content",
      "collection": "email_templates",
      "interface": "input-multiline"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/email_templates"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "template_type",
    "type": "string",
    "meta": {
      "field": "template_type",
      "collection": "email_templates",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "Welcome", "value": "welcome"},
          {"text": "Daily Brief", "value": "daily_brief"},
          {"text": "Breaking News", "value": "breaking_news"},
          {"text": "Password Reset", "value": "password_reset"},
          {"text": "Subscription", "value": "subscription"}
        ]
      }
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/email_templates"

echo "✅ email_templates collection created"

# 10. Search Analytics Collection
echo "🔍 Creating search_analytics collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "search_analytics",
    "meta": {
      "collection": "search_analytics",
      "icon": "search",
      "note": "Search behavior tracking",
      "display_template": "{{query}} - {{results_count}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "timestamp"
    },
    "schema": {
      "name": "search_analytics"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for search_analytics
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "search_analytics",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/search_analytics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "query",
    "type": "string",
    "meta": {
      "field": "query",
      "collection": "search_analytics",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 500
    }
  }' "$DIRECTUS_URL/fields/search_analytics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "results_count",
    "type": "integer",
    "meta": {
      "field": "results_count",
      "collection": "search_analytics",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "default_value": 0
    }
  }' "$DIRECTUS_URL/fields/search_analytics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "clicked_result_position",
    "type": "integer",
    "meta": {
      "field": "clicked_result_position",
      "collection": "search_analytics",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/search_analytics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "user_id",
    "type": "string",
    "meta": {
      "field": "user_id",
      "collection": "search_analytics",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/search_analytics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "timestamp",
    "type": "timestamp",
    "meta": {
      "field": "timestamp",
      "collection": "search_analytics",
      "interface": "datetime",
      "readonly": true
    },
    "schema": {
      "is_nullable": false,
      "default_value": "CURRENT_TIMESTAMP"
    }
  }' "$DIRECTUS_URL/fields/search_analytics"

echo "✅ search_analytics collection created"

# 11. API Usage Logs Collection
echo "📊 Creating api_usage_logs collection..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "collection": "api_usage_logs",
    "meta": {
      "collection": "api_usage_logs",
      "icon": "api",
      "note": "API usage monitoring",
      "display_template": "{{endpoint}} - {{status_code}}",
      "hidden": false,
      "singleton": false,
      "sort_field": "timestamp"
    },
    "schema": {
      "name": "api_usage_logs"
    }
  }' "$DIRECTUS_URL/collections"

# Add fields for api_usage_logs
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "field": "id",
      "collection": "api_usage_logs",
      "interface": "input",
      "hidden": true
    },
    "schema": {
      "is_primary_key": true,
      "has_auto_increment": false,
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "endpoint",
    "type": "string",
    "meta": {
      "field": "endpoint",
      "collection": "api_usage_logs",
      "interface": "input",
      "required": true
    },
    "schema": {
      "is_nullable": false,
      "max_length": 500
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "method",
    "type": "string",
    "meta": {
      "field": "method",
      "collection": "api_usage_logs",
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "GET", "value": "GET"},
          {"text": "POST", "value": "POST"},
          {"text": "PUT", "value": "PUT"},
          {"text": "DELETE", "value": "DELETE"},
          {"text": "PATCH", "value": "PATCH"}
        ]
      }
    },
    "schema": {
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "status_code",
    "type": "integer",
    "meta": {
      "field": "status_code",
      "collection": "api_usage_logs",
      "interface": "input"
    },
    "schema": {
      "is_nullable": false
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "response_time_ms",
    "type": "integer",
    "meta": {
      "field": "response_time_ms",
      "collection": "api_usage_logs",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "user_id",
    "type": "string",
    "meta": {
      "field": "user_id",
      "collection": "api_usage_logs",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 255
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "ip_address",
    "type": "string",
    "meta": {
      "field": "ip_address",
      "collection": "api_usage_logs",
      "interface": "input"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 45
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "field": "timestamp",
    "type": "timestamp",
    "meta": {
      "field": "timestamp",
      "collection": "api_usage_logs",
      "interface": "datetime",
      "readonly": true
    },
    "schema": {
      "is_nullable": false,
      "default_value": "CURRENT_TIMESTAMP"
    }
  }' "$DIRECTUS_URL/fields/api_usage_logs"

echo "✅ api_usage_logs collection created"

echo ""
echo "🎉 All Collections Created Successfully!"
echo "📊 Created 6 additional collections:"
echo "   6. ✅ reading_statistics"
echo "   7. ✅ bias_reports"
echo "   8. ✅ content_moderation"
echo "   9. ✅ email_templates"
echo "   10. ✅ search_analytics"
echo "   11. ✅ api_usage_logs"
echo ""
echo "🏆 TOTAL: 11 new collections created in this session"
echo "🔗 View all collections at: $DIRECTUS_URL/admin/content"
