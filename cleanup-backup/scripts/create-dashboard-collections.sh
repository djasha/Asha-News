#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "📊 Creating Phase 3: Dashboard Collections..."
echo "============================================================"

# Function to add field to collection
add_field() {
    local collection="$1"
    local field_name="$2"
    local field_type="$3"
    local field_meta="$4"
    local field_schema="$5"
    
    curl -s -X POST "$DIRECTUS_URL/fields/$collection" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"field\": \"$field_name\",
            \"type\": \"$field_type\",
            \"meta\": $field_meta,
            \"schema\": $field_schema
        }" > /dev/null
}

# === 1. DASHBOARD WIDGETS COLLECTION ===
echo "🧩 Creating dashboard_widgets collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "dashboard_widgets",
        "meta": {
            "icon": "dashboard",
            "note": "Dashboard widget definitions",
            "display_template": "{{name}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "sort_order"
        },
        "schema": {
            "name": "dashboard_widgets"
        }
    }' > /dev/null

# Add fields to dashboard_widgets
add_field "dashboard_widgets" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "dashboard_widgets" "name" "string" '{
    "interface": "input",
    "required": true,
    "width": "half",
    "note": "Widget name"
}' '{}'

add_field "dashboard_widgets" "type" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "News Feed", "value": "news_feed"},
            {"text": "Trending Topics", "value": "trending_topics"},
            {"text": "Reading Stats", "value": "reading_stats"},
            {"text": "Bias Analysis", "value": "bias_analysis"},
            {"text": "Bookmarks", "value": "bookmarks"},
            {"text": "Recent Activity", "value": "recent_activity"}
        ]
    },
    "width": "half"
}' '{}'

add_field "dashboard_widgets" "description" "text" '{
    "interface": "input-multiline",
    "width": "full",
    "note": "Widget description"
}' '{}'

add_field "dashboard_widgets" "component_name" "string" '{
    "interface": "input",
    "width": "half",
    "note": "React component name"
}' '{}'

add_field "dashboard_widgets" "default_config" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Default widget configuration"
}' '{}'

add_field "dashboard_widgets" "user_configurable" "boolean" '{
    "interface": "boolean",
    "width": "half",
    "note": "Can users customize this widget"
}' '{
    "default_value": true
}'

add_field "dashboard_widgets" "subscription_required" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Free", "value": "free"},
            {"text": "Premium", "value": "premium"},
            {"text": "Pro", "value": "pro"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "free"
}'

add_field "dashboard_widgets" "sort_order" "integer" '{
    "interface": "input",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "dashboard_widgets" "status" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Active", "value": "active"},
            {"text": "Inactive", "value": "inactive"},
            {"text": "Beta", "value": "beta"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "active"
}'

add_field "dashboard_widgets" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

add_field "dashboard_widgets" "updated_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-updated"]
}' '{}'

echo "✅ Dashboard Widgets collection created"

# === 2. USER DASHBOARD LAYOUTS COLLECTION ===
echo "🎨 Creating user_dashboard_layouts collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "user_dashboard_layouts",
        "meta": {
            "icon": "view_quilt",
            "note": "User dashboard customization",
            "display_template": "{{user_id}} - {{layout_name}}",
            "hidden": false,
            "singleton": false
        },
        "schema": {
            "name": "user_dashboard_layouts"
        }
    }' > /dev/null

# Add fields to user_dashboard_layouts
add_field "user_dashboard_layouts" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "user_dashboard_layouts" "user_id" "uuid" '{
    "interface": "select-dropdown-m2o",
    "display": "related-values",
    "display_options": {
        "template": "{{first_name}} {{last_name}} ({{email}})"
    },
    "width": "half"
}' '{}'

add_field "user_dashboard_layouts" "layout_name" "string" '{
    "interface": "input",
    "required": true,
    "width": "half",
    "note": "Layout name"
}' '{}'

add_field "user_dashboard_layouts" "is_default" "boolean" '{
    "interface": "boolean",
    "width": "half",
    "note": "Is this the default layout"
}' '{
    "default_value": false
}'

add_field "user_dashboard_layouts" "widgets" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Array of widget configurations"
}' '{}'

add_field "user_dashboard_layouts" "grid_layout" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Widget positions and sizes"
}' '{}'

add_field "user_dashboard_layouts" "theme_overrides" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Custom theme settings"
}' '{}'

add_field "user_dashboard_layouts" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

add_field "user_dashboard_layouts" "updated_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-updated"]
}' '{}'

echo "✅ User Dashboard Layouts collection created"

# === 3. READING STATISTICS COLLECTION ===
echo "📈 Creating reading_statistics collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "reading_statistics",
        "meta": {
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
    }' > /dev/null

# Add fields to reading_statistics
add_field "reading_statistics" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "reading_statistics" "user_id" "uuid" '{
    "interface": "select-dropdown-m2o",
    "display": "related-values",
    "display_options": {
        "template": "{{first_name}} {{last_name}} ({{email}})"
    },
    "width": "half"
}' '{}'

add_field "reading_statistics" "date" "date" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "reading_statistics" "articles_read" "integer" '{
    "interface": "input",
    "width": "half",
    "note": "Number of articles read"
}' '{
    "default_value": 0
}'

add_field "reading_statistics" "reading_time_minutes" "integer" '{
    "interface": "input",
    "width": "half",
    "note": "Total reading time in minutes"
}' '{
    "default_value": 0
}'

add_field "reading_statistics" "topics_explored" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Array of topic IDs explored"
}' '{}'

add_field "reading_statistics" "sources_read" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Array of source IDs read"
}' '{}'

add_field "reading_statistics" "bias_exposure" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Bias exposure breakdown {left: %, center: %, right: %}"
}' '{}'

add_field "reading_statistics" "fact_checks_performed" "integer" '{
    "interface": "input",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "reading_statistics" "shares_made" "integer" '{
    "interface": "input",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "reading_statistics" "bookmarks_added" "integer" '{
    "interface": "input",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "reading_statistics" "streak_days" "integer" '{
    "interface": "input",
    "width": "half",
    "note": "Reading streak in days"
}' '{
    "default_value": 0
}'

add_field "reading_statistics" "engagement_score" "decimal" '{
    "interface": "slider",
    "options": {
        "min": 0,
        "max": 1,
        "step": 0.01
    },
    "width": "half",
    "note": "Daily engagement score"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0
}'

add_field "reading_statistics" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

echo "✅ Reading Statistics collection created"

echo ""
echo "🎉 Phase 3 Collections completed successfully!"
echo "📊 Created: dashboard_widgets, user_dashboard_layouts, reading_statistics"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
