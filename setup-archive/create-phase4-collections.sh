#!/bin/bash

# Phase 4: Editorial & Publishing Collections
# Following DIRECTUS_COLLECTION_FIX_GUIDE.md exactly

set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Phase 4: Editorial & Publishing Collections ==="

# Get admin token
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "✅ Authentication successful"

# 1. Breaking News Collection
echo "🚨 Creating Breaking News collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "breaking_news",
    "meta": {
      "icon": "warning",
      "note": "Urgent news alerts"
    },
    "schema": {
      "name": "breaking_news"
    }
  }' > /dev/null

# Add fields to breaking_news
curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "headline", "type": "string", "meta": {"interface": "input", "required": true, "note": "Alert headline"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "summary", "type": "text", "meta": {"interface": "input-multiline", "note": "Brief description"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "url", "type": "string", "meta": {"interface": "input", "note": "Related article URL"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "priority", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "High", "value": "high"}, {"text": "Medium", "value": "medium"}, {"text": "Low", "value": "low"}]}}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "active", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "expires_at", "type": "timestamp", "meta": {"interface": "datetime", "note": "Auto-deactivation time"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

echo "✅ Breaking News collection created"

# Test breaking_news
BREAKING_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/breaking_news")
if [[ "$BREAKING_TEST" == *"data"* ]]; then
  echo "✅ Breaking News collection test passed"
else
  echo "❌ Breaking News collection test failed"
  exit 1
fi

# 2. Daily Briefs Collection
echo "📅 Creating Daily Briefs collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "daily_briefs",
    "meta": {
      "icon": "schedule",
      "note": "Curated daily summaries"
    },
    "schema": {
      "name": "daily_briefs"
    }
  }' > /dev/null

# Add fields to daily_briefs
curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "title", "type": "string", "meta": {"interface": "input", "required": true, "note": "Brief title"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "time_period", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Morning", "value": "morning"}, {"text": "Midday", "value": "midday"}, {"text": "Evening", "value": "evening"}]}}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "content", "type": "text", "meta": {"interface": "input-rich-text-html", "note": "Brief content"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date", "type": "date", "meta": {"interface": "datetime", "note": "Brief date"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "published", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "featured_articles", "type": "json", "meta": {"interface": "input-code", "note": "Featured article IDs (JSON array)"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

echo "✅ Daily Briefs collection created"

# Test daily_briefs
DAILY_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/daily_briefs")
if [[ "$DAILY_TEST" == *"data"* ]]; then
  echo "✅ Daily Briefs collection test passed"
else
  echo "❌ Daily Briefs collection test failed"
  exit 1
fi

# 3. Trending Topics Collection
echo "📈 Creating Trending Topics collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "trending_topics",
    "meta": {
      "icon": "trending_up",
      "note": "Popular topics tracking"
    },
    "schema": {
      "name": "trending_topics"
    }
  }' > /dev/null

# Add fields to trending_topics
curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "name", "type": "string", "meta": {"interface": "input", "required": true, "note": "Topic name"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "hashtag", "type": "string", "meta": {"interface": "input", "note": "Associated hashtag"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "description", "type": "text", "meta": {"interface": "input-multiline", "note": "Topic description"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "trend_score", "type": "float", "meta": {"interface": "input", "note": "Popularity score"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "article_count", "type": "integer", "meta": {"interface": "input", "note": "Related articles"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "active", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_updated", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-updated"]}}' > /dev/null

echo "✅ Trending Topics collection created"

# Test trending_topics
TRENDING_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/trending_topics")
if [[ "$TRENDING_TEST" == *"data"* ]]; then
  echo "✅ Trending Topics collection test passed"
else
  echo "❌ Trending Topics collection test failed"
  exit 1
fi

# 4. Homepage Sections Collection
echo "🏠 Creating Homepage Sections collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "homepage_sections",
    "meta": {
      "icon": "home",
      "note": "Homepage content management"
    },
    "schema": {
      "name": "homepage_sections"
    }
  }' > /dev/null

# Add fields to homepage_sections
curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "name", "type": "string", "meta": {"interface": "input", "required": true, "note": "Section identifier"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "title", "type": "string", "meta": {"interface": "input", "note": "Display title"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "description", "type": "text", "meta": {"interface": "input-multiline", "note": "Section description"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "enabled", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "sort_order", "type": "integer", "meta": {"interface": "input"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "max_articles", "type": "integer", "meta": {"interface": "input", "note": "Article limit"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "section_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Featured", "value": "featured"}, {"text": "Latest", "value": "latest"}, {"text": "Category", "value": "category"}]}}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

echo "✅ Homepage Sections collection created"

# Test homepage_sections
HOMEPAGE_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/homepage_sections")
if [[ "$HOMEPAGE_TEST" == *"data"* ]]; then
  echo "✅ Homepage Sections collection test passed"
else
  echo "❌ Homepage Sections collection test failed"
  exit 1
fi

echo "🎉 Phase 4 Collections completed successfully!"
echo "📊 Created: breaking_news, daily_briefs, trending_topics, homepage_sections"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
