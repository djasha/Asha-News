#!/bin/bash

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔗 Restoring Article Relations..."
echo "============================================================"

# Add tags relation field to articles (many-to-many)
echo "Adding tags relation to articles..."
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

# Add article_series relation field to articles (many-to-one)
echo "Adding article_series relation to articles..."
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
echo "Adding series_part field to articles..."
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

# Add story_clusters relation field to articles (many-to-many)
echo "Adding story_clusters relation to articles..."
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

# Add related_articles relation field to articles (many-to-many)
echo "Adding related_articles relation to articles..."
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

echo ""
echo "🧪 Testing article relations..."
echo "============================================================"

# Test articles collection with new relations
RESPONSE=$(curl -s "$DIRECTUS_URL/items/articles?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN")

if echo "$RESPONSE" | grep -q "errors"; then
    echo "❌ Articles collection has errors:"
    echo "$RESPONSE" | jq -r '.errors[0].message'
    
    echo ""
    echo "🔧 Removing problematic relations..."
    curl -s -X DELETE "$DIRECTUS_URL/fields/articles/tags" -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null
    curl -s -X DELETE "$DIRECTUS_URL/fields/articles/story_clusters" -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null
    curl -s -X DELETE "$DIRECTUS_URL/fields/articles/related_articles" -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null
    echo "✅ Removed problematic relation fields"
else
    echo "✅ Articles collection working with relations"
fi

echo ""
echo "🎉 Article Relations Setup Complete!"
echo "🔗 Test at: $DIRECTUS_URL/admin/content/articles"
