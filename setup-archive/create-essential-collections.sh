#!/bin/bash

# Create essential collections for Asha News CMS
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Creating Essential Collections ==="

# Get admin token
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Create News Sources collection
echo "📰 Creating News Sources..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "news_sources",
    "meta": {
      "icon": "rss_feed",
      "note": "News source configurations"
    }
  }' > /dev/null

# Add fields to news_sources
curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {"interface": "input", "readonly": true, "hidden": true},
    "schema": {"is_primary_key": true}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "name",
    "type": "string",
    "meta": {"interface": "input", "required": true}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "rss_url",
    "type": "string",
    "meta": {"interface": "input"}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "enabled",
    "type": "boolean",
    "meta": {"interface": "boolean"},
    "schema": {"default_value": true}
  }' > /dev/null

# Create Site Configuration (singleton)
echo "⚙️ Creating Site Configuration..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "site_configuration",
    "meta": {
      "icon": "settings",
      "note": "Global site settings",
      "singleton": true
    }
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "id",
    "type": "uuid",
    "meta": {"interface": "input", "readonly": true, "hidden": true},
    "schema": {"is_primary_key": true}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "site_name",
    "type": "string",
    "meta": {"interface": "input", "required": true}
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "site_description",
    "type": "text",
    "meta": {"interface": "input-multiline"}
  }' > /dev/null

echo "✅ Essential collections created!"
echo "🔗 Access at: $DIRECTUS_URL/admin/content"
