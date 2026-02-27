#!/bin/bash

# Phase 3 Part 2: Topic Categories & Page Content Collections
# Following DIRECTUS_COLLECTION_FIX_GUIDE.md exactly

set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Phase 3 Part 2: Topic Categories & Page Content ==="

# Get admin token
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "✅ Authentication successful"

# 3. Topic Categories Collection
echo "📂 Creating Topic Categories collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "topic_categories",
    "meta": {
      "icon": "category",
      "note": "News topic categorization"
    },
    "schema": {
      "name": "topic_categories"
    }
  }' > /dev/null

# Add fields to topic_categories
curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "name", "type": "string", "meta": {"interface": "input", "required": true, "note": "Category name"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "slug", "type": "string", "meta": {"interface": "input", "required": true, "note": "URL slug"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "description", "type": "text", "meta": {"interface": "input-multiline", "note": "Category description"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "color", "type": "string", "meta": {"interface": "input", "note": "Hex color code"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "icon", "type": "string", "meta": {"interface": "input", "note": "Icon name"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "enabled", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "sort_order", "type": "integer", "meta": {"interface": "input"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "article_count", "type": "integer", "meta": {"interface": "input", "readonly": true, "note": "Auto-calculated"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

echo "✅ Topic Categories collection created"

# Test topic_categories
TOPIC_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/topic_categories")
if [[ "$TOPIC_TEST" == *"data"* ]]; then
  echo "✅ Topic Categories collection test passed"
else
  echo "❌ Topic Categories collection test failed"
  exit 1
fi

# 4. Page Content Collection
echo "📄 Creating Page Content collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "page_content",
    "meta": {
      "icon": "description",
      "note": "Static page management"
    },
    "schema": {
      "name": "page_content"
    }
  }' > /dev/null

# Add fields to page_content
curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "page_name", "type": "string", "meta": {"interface": "input", "required": true, "note": "Page identifier"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "title", "type": "string", "meta": {"interface": "input", "required": true, "note": "Page title"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "content", "type": "text", "meta": {"interface": "input-rich-text-html", "note": "Page content"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "meta_title", "type": "string", "meta": {"interface": "input", "note": "SEO title"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "meta_description", "type": "text", "meta": {"interface": "input-multiline", "note": "SEO description"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "meta_keywords", "type": "text", "meta": {"interface": "input-multiline", "note": "SEO keywords"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "published", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_updated", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-updated"]}}' > /dev/null

echo "✅ Page Content collection created"

# Test page_content
PAGE_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/page_content")
if [[ "$PAGE_TEST" == *"data"* ]]; then
  echo "✅ Page Content collection test passed"
else
  echo "❌ Page Content collection test failed"
  exit 1
fi

echo "🎉 Phase 3 Collections completed successfully!"
echo "📊 Total Phase 3: navigation_menus, menu_items, topic_categories, page_content"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
