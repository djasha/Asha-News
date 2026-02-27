#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Creating Phase 1: Core Content Collections..."
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

# === 1. TAGS COLLECTION ===
echo "📝 Creating tags collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "tags",
        "meta": {
            "icon": "local_offer",
            "note": "Article tags and categories",
            "display_template": "{{name}}",
            "hidden": false,
            "singleton": false,
            "translations": null,
            "archive_field": null,
            "archive_value": null,
            "unarchive_value": null,
            "sort_field": "sort_order"
        },
        "schema": {
            "name": "tags"
        }
    }' > /dev/null

# Add fields to tags
add_field "tags" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true,
    "width": "full"
}' '{
    "is_primary_key": true
}'

add_field "tags" "name" "string" '{
    "interface": "input",
    "required": true,
    "width": "half",
    "note": "Tag name"
}' '{
    "is_unique": true
}'

add_field "tags" "slug" "string" '{
    "interface": "input",
    "required": true,
    "width": "half",
    "note": "URL-friendly slug"
}' '{
    "is_unique": true
}'

add_field "tags" "description" "text" '{
    "interface": "input-multiline",
    "width": "full",
    "note": "Tag description"
}' '{}'

add_field "tags" "color" "string" '{
    "interface": "select-color",
    "width": "half",
    "note": "Tag color for UI"
}' '{
    "default_value": "#3B82F6"
}'

add_field "tags" "icon" "string" '{
    "interface": "select-icon",
    "width": "half",
    "note": "Tag icon"
}' '{}'

add_field "tags" "category" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Topic", "value": "topic"},
            {"text": "Location", "value": "location"},
            {"text": "Person", "value": "person"},
            {"text": "Organization", "value": "organization"},
            {"text": "Event", "value": "event"},
            {"text": "Technology", "value": "technology"},
            {"text": "General", "value": "general"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "general"
}'

add_field "tags" "usage_count" "integer" '{
    "interface": "input",
    "readonly": true,
    "width": "half",
    "note": "Number of articles using this tag"
}' '{
    "default_value": 0
}'

add_field "tags" "trending" "boolean" '{
    "interface": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "tags" "featured" "boolean" '{
    "interface": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "tags" "sort_order" "integer" '{
    "interface": "input",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "tags" "status" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Active", "value": "active"},
            {"text": "Inactive", "value": "inactive"},
            {"text": "Archived", "value": "archived"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "active"
}'

add_field "tags" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

add_field "tags" "updated_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-updated"]
}' '{}'

echo "✅ Tags collection created"

# === 2. ARTICLE SERIES COLLECTION ===
echo "📚 Creating article_series collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "article_series",
        "meta": {
            "icon": "library_books",
            "note": "Multi-part article series",
            "display_template": "{{title}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "sort_order"
        },
        "schema": {
            "name": "article_series"
        }
    }' > /dev/null

# Add fields to article_series
add_field "article_series" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "article_series" "title" "string" '{
    "interface": "input",
    "required": true,
    "width": "full",
    "note": "Series title"
}' '{}'

add_field "article_series" "slug" "string" '{
    "interface": "input",
    "required": true,
    "width": "half",
    "note": "URL-friendly slug"
}' '{
    "is_unique": true
}'

add_field "article_series" "description" "text" '{
    "interface": "input-rich-text-html",
    "width": "full",
    "note": "Series description"
}' '{}'

add_field "article_series" "summary" "text" '{
    "interface": "input-multiline",
    "width": "full",
    "note": "Brief series summary"
}' '{}'

add_field "article_series" "featured_image" "uuid" '{
    "interface": "file-image",
    "width": "half",
    "note": "Series cover image"
}' '{}'

add_field "article_series" "author" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Series author"
}' '{}'

add_field "article_series" "total_parts" "integer" '{
    "interface": "input",
    "width": "half",
    "note": "Expected number of parts"
}' '{
    "default_value": 1
}'

add_field "article_series" "published_parts" "integer" '{
    "interface": "input",
    "readonly": true,
    "width": "half",
    "note": "Number of published parts"
}' '{
    "default_value": 0
}'

add_field "article_series" "status" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Planning", "value": "planning"},
            {"text": "In Progress", "value": "in_progress"},
            {"text": "Completed", "value": "completed"},
            {"text": "On Hold", "value": "on_hold"},
            {"text": "Cancelled", "value": "cancelled"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "planning"
}'

add_field "article_series" "category" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Series category"
}' '{}'

add_field "article_series" "tags" "json" '{
    "interface": "tags",
    "width": "full",
    "note": "Series tags"
}' '{}'

add_field "article_series" "featured" "boolean" '{
    "interface": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "article_series" "sort_order" "integer" '{
    "interface": "input",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "article_series" "seo_title" "string" '{
    "interface": "input",
    "width": "half",
    "note": "SEO title"
}' '{}'

add_field "article_series" "seo_description" "text" '{
    "interface": "input-multiline",
    "width": "half",
    "note": "SEO description"
}' '{}'

add_field "article_series" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

add_field "article_series" "updated_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-updated"]
}' '{}'

echo "✅ Article Series collection created"

# === 3. SITEMAP ENTRIES COLLECTION ===
echo "🗺️ Creating sitemap_entries collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "sitemap_entries",
        "meta": {
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
    }' > /dev/null

# Add fields to sitemap_entries
add_field "sitemap_entries" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "sitemap_entries" "url" "string" '{
    "interface": "input",
    "required": true,
    "width": "full",
    "note": "Page URL"
}' '{
    "is_unique": true
}'

add_field "sitemap_entries" "priority" "decimal" '{
    "interface": "slider",
    "options": {
        "min": 0,
        "max": 1,
        "step": 0.1
    },
    "width": "half",
    "note": "Priority (0.0-1.0)"
}' '{
    "precision": 2,
    "scale": 1,
    "default_value": 0.5
}'

add_field "sitemap_entries" "changefreq" "string" '{
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
    },
    "width": "half"
}' '{
    "default_value": "weekly"
}'

add_field "sitemap_entries" "lastmod" "datetime" '{
    "interface": "datetime",
    "width": "half",
    "note": "Last modification date"
}' '{}'

add_field "sitemap_entries" "page_type" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Static", "value": "static"},
            {"text": "Dynamic", "value": "dynamic"},
            {"text": "Category", "value": "category"},
            {"text": "Article", "value": "article"},
            {"text": "Topic", "value": "topic"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "static"
}'

add_field "sitemap_entries" "meta_title" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Page meta title"
}' '{}'

add_field "sitemap_entries" "meta_description" "text" '{
    "interface": "input-multiline",
    "width": "half",
    "note": "Page meta description"
}' '{}'

add_field "sitemap_entries" "canonical_url" "string" '{
    "interface": "input",
    "width": "full",
    "note": "Canonical URL"
}' '{}'

add_field "sitemap_entries" "noindex" "boolean" '{
    "interface": "boolean",
    "width": "half",
    "note": "Exclude from search engines"
}' '{
    "default_value": false
}'

add_field "sitemap_entries" "nofollow" "boolean" '{
    "interface": "boolean",
    "width": "half",
    "note": "No follow links"
}' '{
    "default_value": false
}'

add_field "sitemap_entries" "status" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Active", "value": "active"},
            {"text": "Inactive", "value": "inactive"},
            {"text": "Redirect", "value": "redirect"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "active"
}'

add_field "sitemap_entries" "redirect_url" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Redirect URL (if status is redirect)"
}' '{}'

add_field "sitemap_entries" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

add_field "sitemap_entries" "updated_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-updated"]
}' '{}'

echo "✅ Sitemap Entries collection created"

echo ""
echo "🎉 Phase 1 Collections completed successfully!"
echo "📊 Created: tags, article_series, sitemap_entries"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
