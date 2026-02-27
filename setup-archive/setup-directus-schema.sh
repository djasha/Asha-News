#!/bin/bash

# Directus Schema Setup Script - SAFE VERSION
# This script creates collections for Asha News CMS with proper error handling

set -e  # Exit on any error

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Directus Schema Setup for Asha News ==="
echo "URL: $DIRECTUS_URL"
echo "This script will create CMS collections safely."
echo ""

# Function to check API response
check_response() {
    local response="$1"
    local operation="$2"
    
    if echo "$response" | grep -q '"error"'; then
        echo "❌ Error in $operation:"
        echo "$response" | grep -o '"message":"[^"]*' | cut -d'"' -f4
        return 1
    else
        echo "✅ $operation successful"
        return 0
    fi
}

# Get admin token
echo "🔐 Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed. Check credentials and Directus availability."
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ Authentication successful"

# Create Global Settings collection (singleton)
echo "Creating Global Settings collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "global_settings",
    "meta": {
      "icon": "settings",
      "note": "Global site settings",
      "singleton": true
    }
  }'

# Add fields to Global Settings
curl -s -X POST "$DIRECTUS_URL/fields/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "site_name",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "Site name"
    }
  }'

curl -s -X POST "$DIRECTUS_URL/fields/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "site_description",
    "type": "text",
    "meta": {
      "interface": "input-multiline",
      "note": "Site description"
    }
  }'

# Create RSS Sources collection
echo "Creating RSS Sources collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "rss_sources",
    "meta": {
      "icon": "rss_feed",
      "note": "RSS feed sources"
    }
  }'

# Add fields to RSS Sources
curl -s -X POST "$DIRECTUS_URL/fields/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "name",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "Source name"
    }
  }'

curl -s -X POST "$DIRECTUS_URL/fields/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "url",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "RSS feed URL"
    }
  }'

curl -s -X POST "$DIRECTUS_URL/fields/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "enabled",
    "type": "boolean",
    "meta": {
      "interface": "boolean",
      "note": "Enable this RSS source"
    }
  }'

# Create Feature Flags collection
echo "Creating Feature Flags collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "feature_flags",
    "meta": {
      "icon": "flag",
      "note": "Feature toggles"
    }
  }'

# Add fields to Feature Flags
curl -s -X POST "$DIRECTUS_URL/fields/feature_flags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "name",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "Feature name"
    }
  }'

curl -s -X POST "$DIRECTUS_URL/fields/feature_flags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "enabled",
    "type": "boolean",
    "meta": {
      "interface": "boolean",
      "note": "Enable this feature"
    }
  }'

echo "Schema setup completed!"
echo "Check your Directus admin panel to see the new collections."
