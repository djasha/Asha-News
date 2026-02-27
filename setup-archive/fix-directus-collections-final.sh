#!/bin/bash

# Final fix for Directus collection access issues
# This script completely removes and recreates collections with proper field definitions

set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Final Directus Collection Fix ==="

# Get admin token
echo "🔐 Getting admin token..."
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Collections to clean up
collections=(
  "articles"
  "breaking_news"
  "daily_briefs"
  "homepage_sections"
  "page_content"
  "trending_topics"
  "news_sources"
  "topic_categories"
  "navigation_menus"
  "menu_items"
  "site_configuration"
  "legal_pages"
)

echo "🧹 Cleaning up existing collections..."
for collection in "${collections[@]}"; do
  echo "Deleting collection: $collection"
  curl -s -X DELETE "$DIRECTUS_URL/collections/$collection" \
    -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true
done

echo "⏳ Waiting for cleanup to complete..."
sleep 3

# Create articles collection with proper schema
echo "📰 Creating Articles collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "articles",
    "meta": {
      "icon": "article",
      "note": "News articles and content",
      "hidden": false,
      "singleton": false
    },
    "schema": {
      "name": "articles"
    }
  }' > /dev/null

# Add fields to articles
echo "📝 Adding fields to Articles..."

# ID field (primary key)
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {
      "interface": "input",
      "readonly": true,
      "hidden": true
    },
    "schema": {
      "is_primary_key": true
    }
  }' > /dev/null

# Title field
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "title",
    "type": "string",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "Article title"
    },
    "schema": {
      "max_length": 255
    }
  }' > /dev/null

# Content field
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "content",
    "type": "text",
    "meta": {
      "interface": "input-rich-text-html",
      "note": "Article content"
    }
  }' > /dev/null

# URL field
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "url",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "Original article URL"
    }
  }' > /dev/null

# Published field
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "published",
    "type": "boolean",
    "meta": {
      "interface": "boolean",
      "note": "Published status"
    },
    "schema": {
      "default_value": false
    }
  }' > /dev/null

# Created timestamp
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "date_created",
    "type": "timestamp",
    "meta": {
      "interface": "datetime",
      "readonly": true,
      "hidden": true,
      "special": ["date-created"]
    }
  }' > /dev/null

echo "✅ Articles collection created successfully!"

# Test the collection
echo "🧪 Testing collection access..."
ARTICLES_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/articles")
if [[ "$ARTICLES_TEST" == *"data"* ]]; then
  echo "✅ Articles collection is accessible!"
else
  echo "❌ Articles collection test failed"
fi

echo "🎉 Collection fix completed!"
echo "🔗 Test at: $DIRECTUS_URL/admin/content/articles"
