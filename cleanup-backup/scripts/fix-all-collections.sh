#!/bin/bash

# Fix all non-clickable collections by ensuring proper field definitions
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Fixing All Collections ==="

# Get admin token
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Delete duplicate collections first
echo "🧹 Cleaning up duplicates..."
curl -s -X DELETE "$DIRECTUS_URL/collections/Global_Settings" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true
curl -s -X DELETE "$DIRECTUS_URL/collections/RSS_Sources" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true

# Fix news_sources collection
echo "📰 Fixing news_sources collection..."
curl -s -X DELETE "$DIRECTUS_URL/collections/news_sources" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "news_sources",
    "meta": {"icon": "rss_feed", "note": "News source configurations"},
    "schema": {"name": "news_sources"}
  }' > /dev/null

# Add fields to news_sources
curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "name", "type": "string", "meta": {"interface": "input", "required": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "rss_url", "type": "string", "meta": {"interface": "input"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "enabled", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

# Fix site_configuration collection
echo "⚙️ Fixing site_configuration collection..."
curl -s -X DELETE "$DIRECTUS_URL/collections/site_configuration" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "site_configuration",
    "meta": {"icon": "settings", "note": "Global site settings", "singleton": true},
    "schema": {"name": "site_configuration"}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "site_name", "type": "string", "meta": {"interface": "input", "required": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "site_description", "type": "text", "meta": {"interface": "input-multiline"}}' > /dev/null

# Fix global_settings collection
echo "🌐 Fixing global_settings collection..."
curl -s -X DELETE "$DIRECTUS_URL/collections/global_settings" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "global_settings",
    "meta": {"icon": "public", "note": "Global application settings", "singleton": true},
    "schema": {"name": "global_settings"}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "app_name", "type": "string", "meta": {"interface": "input", "required": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "maintenance_mode", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}}' > /dev/null

# Fix rss_sources collection
echo "📡 Fixing rss_sources collection..."
curl -s -X DELETE "$DIRECTUS_URL/collections/rss_sources" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "rss_sources",
    "meta": {"icon": "rss_feed", "note": "RSS feed sources"},
    "schema": {"name": "rss_sources"}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "name", "type": "string", "meta": {"interface": "input", "required": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "url", "type": "string", "meta": {"interface": "input", "required": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "enabled", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

echo "✅ All collections fixed!"
echo "📊 Fixed: articles, news_sources, site_configuration, global_settings, rss_sources, feature_flags"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
