#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔗 Creating Collection Relations..."
echo "============================================================"

# Function to add relation field
add_relation() {
    local collection="$1"
    local field_name="$2"
    local related_collection="$3"
    local relation_type="$4"
    local field_meta="$5"
    local field_schema="$6"
    
    curl -s -X POST "$DIRECTUS_URL/fields/$collection" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"field\": \"$field_name\",
            \"type\": \"uuid\",
            \"meta\": $field_meta,
            \"schema\": $field_schema
        }" > /dev/null
}

# Function to create many-to-many junction table
create_junction() {
    local junction_name="$1"
    local collection_a="$2"
    local collection_b="$3"
    
    echo "Creating junction table: $junction_name"
    
    # Create junction collection
    curl -s -X POST "$DIRECTUS_URL/collections" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"collection\": \"$junction_name\",
            \"meta\": {
                \"hidden\": true,
                \"icon\": \"import_export\"
            },
            \"schema\": {
                \"name\": \"$junction_name\"
            }
        }" > /dev/null
    
    # Add ID field
    curl -s -X POST "$DIRECTUS_URL/fields/$junction_name" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "field": "id",
            "type": "integer",
            "meta": {"interface": "input", "hidden": true},
            "schema": {"is_primary_key": true, "has_auto_increment": true}
        }' > /dev/null
    
    # Add relation fields
    curl -s -X POST "$DIRECTUS_URL/fields/$junction_name" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"field\": \"${collection_a}_id\",
            \"type\": \"uuid\",
            \"meta\": {\"interface\": \"select-dropdown-m2o\", \"hidden\": true},
            \"schema\": {}
        }" > /dev/null
    
    curl -s -X POST "$DIRECTUS_URL/fields/$junction_name" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"field\": \"${collection_b}_id\",
            \"type\": \"uuid\",
            \"meta\": {\"interface\": \"select-dropdown-m2o\", \"hidden\": true},
            \"schema\": {}
        }" > /dev/null
}

echo "📝 Creating Articles ↔ Tags relation..."
create_junction "articles_tags" "articles" "tags"

# Add tags field to articles
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "tags",
        "type": "alias",
        "meta": {
            "interface": "list-m2m",
            "special": ["m2m"],
            "options": {
                "enableCreate": true,
                "enableSelect": true
            },
            "display": "related-values",
            "display_options": {
                "template": "{{name}}"
            },
            "width": "full"
        }
    }' > /dev/null

echo "✅ Articles ↔ Tags relation created"

echo "📚 Creating Articles ↔ Article Series relation..."
# Add article_series field to articles
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "article_series",
        "type": "uuid",
        "meta": {
            "interface": "select-dropdown-m2o",
            "display": "related-values",
            "display_options": {
                "template": "{{title}}"
            },
            "width": "half"
        }
    }' > /dev/null

# Add series_part field to articles
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "series_part",
        "type": "integer",
        "meta": {
            "interface": "input",
            "width": "half",
            "note": "Part number in series"
        },
        "schema": {
            "default_value": 1
        }
    }' > /dev/null

echo "✅ Articles ↔ Article Series relation created"

echo "🔗 Creating Articles ↔ Story Clusters relation..."
create_junction "articles_story_clusters" "articles" "story_clusters"

# Add story_clusters field to articles
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "story_clusters",
        "type": "alias",
        "meta": {
            "interface": "list-m2m",
            "special": ["m2m"],
            "display": "related-values",
            "display_options": {
                "template": "{{cluster_title}}"
            },
            "width": "full"
        }
    }' > /dev/null

echo "✅ Articles ↔ Story Clusters relation created"

echo "🔄 Creating Articles ↔ Related Articles relation..."
create_junction "articles_related" "articles" "articles"

# Add related_articles field to articles
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "related_articles",
        "type": "alias",
        "meta": {
            "interface": "list-m2m",
            "special": ["m2m"],
            "display": "related-values",
            "display_options": {
                "template": "{{title}}"
            },
            "width": "full"
        }
    }' > /dev/null

echo "✅ Articles ↔ Related Articles relation created"

echo "✅ Creating Fact Check Claims ↔ Articles relation..."
create_junction "fact_check_claims_articles" "fact_check_claims" "articles"

# Add articles field to fact_check_claims
curl -s -X POST "$DIRECTUS_URL/fields/fact_check_claims" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "related_articles",
        "type": "alias",
        "meta": {
            "interface": "list-m2m",
            "special": ["m2m"],
            "display": "related-values",
            "display_options": {
                "template": "{{title}}"
            },
            "width": "full"
        }
    }' > /dev/null

echo "✅ Fact Check Claims ↔ Articles relation created"

echo "👥 Creating User Relations..."

# Add user_id relation to user_preferences
curl -s -X POST "$DIRECTUS_URL/fields/user_preferences" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "user_id",
        "type": "uuid",
        "meta": {
            "interface": "select-dropdown-m2o",
            "display": "related-values",
            "display_options": {
                "template": "{{first_name}} {{last_name}} ({{email}})"
            },
            "width": "full"
        }
    }' > /dev/null

echo "✅ User Preferences ↔ Users relation created"

# Relations for user_activity, user_subscriptions, user_sessions already created in their scripts

echo "🔗 Creating Story Clusters ↔ Related Clusters relation..."
create_junction "story_clusters_related" "story_clusters" "story_clusters"

# Add related_clusters field to story_clusters
curl -s -X POST "$DIRECTUS_URL/fields/story_clusters" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "related_clusters",
        "type": "alias",
        "meta": {
            "interface": "list-m2m",
            "special": ["m2m"],
            "display": "related-values",
            "display_options": {
                "template": "{{cluster_title}}"
            },
            "width": "full"
        }
    }' > /dev/null

echo "✅ Story Clusters ↔ Related Clusters relation created"

echo ""
echo "🎉 All Collection Relations created successfully!"
echo "📊 Relations added:"
echo "   - Articles ↔ Tags (many-to-many)"
echo "   - Articles ↔ Article Series (many-to-one)"
echo "   - Articles ↔ Story Clusters (many-to-many)"
echo "   - Articles ↔ Related Articles (many-to-many)"
echo "   - Fact Check Claims ↔ Articles (many-to-many)"
echo "   - User Preferences ↔ Users (one-to-one)"
echo "   - Story Clusters ↔ Related Clusters (many-to-many)"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
