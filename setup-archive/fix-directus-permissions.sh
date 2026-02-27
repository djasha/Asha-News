#!/bin/bash

# Fix Directus Permissions and Setup Global Settings
# This script fixes permission issues and creates the global settings singleton

set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Fixing Directus Permissions and Global Settings ==="

# Get admin token
echo "🔐 Getting fresh admin token..."
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Get admin role ID
ROLES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/roles")
ADMIN_ROLE_ID=$(echo "$ROLES_RESPONSE" | grep -o '"id":"[^"]*","name":"Administrator"' | cut -d'"' -f4)

if [ -z "$ADMIN_ROLE_ID" ]; then
  echo "❌ Could not find Administrator role"
  exit 1
fi

echo "✅ Found Administrator role: $ADMIN_ROLE_ID"

# Create permissions for global_settings collection
echo "🔧 Setting up global_settings permissions..."

# Create permission
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"collection\": \"global_settings\",
    \"action\": \"create\",
    \"role\": \"$ADMIN_ROLE_ID\",
    \"fields\": [\"*\"]
  }"

curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"collection\": \"global_settings\",
    \"action\": \"read\",
    \"role\": \"$ADMIN_ROLE_ID\",
    \"fields\": [\"*\"]
  }"

curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"collection\": \"global_settings\",
    \"action\": \"update\",
    \"role\": \"$ADMIN_ROLE_ID\",
    \"fields\": [\"*\"]
  }"

echo "✅ Permissions created"

# Create the singleton global settings record
echo "📝 Creating global settings singleton..."
SETTINGS_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/items/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_name": "Asha News",
    "site_description": "Unbiased news aggregation with AI-powered bias analysis"
  }')

echo "Settings response: $SETTINGS_RESPONSE"

# Test the endpoints
echo "🧪 Testing endpoints..."
echo "Testing global_settings:"
curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/global_settings"
echo ""

echo "Testing RSS_Sources:"
curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/RSS_Sources?limit=3"
echo ""

echo "Testing feature_flags:"
curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/feature_flags"
echo ""

echo "✅ Directus permissions and global settings setup completed!"
