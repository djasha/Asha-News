#!/bin/bash

# Fix Admin Role to Have Full Access
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "🔐 Getting admin token..."
TOKEN=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Get current admin user info
echo "👤 Getting admin user info..."
ADMIN_ROLE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/users/me" | jq -r '.data.role')
echo "Current admin role ID: $ADMIN_ROLE_ID"

# Update the admin role to have full access
echo "👑 Updating admin role permissions..."
curl -s -X PATCH "$DIRECTUS_URL/roles/$ADMIN_ROLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_access": true,
    "app_access": true,
    "name": "Administrator",
    "description": "Full system administrator access"
  }' > /dev/null

echo "✅ Admin role updated!"

# Test collection access
echo "🧪 Testing collection access..."
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/topic_categories")
if echo "$RESPONSE" | grep -q '"data"'; then
  echo "✅ Collections now accessible!"
  
  # Count items in each collection
  echo "📊 Collection status:"
  collections=("site_configuration" "topic_categories" "news_sources" "navigation_menus" "breaking_news" "trending_topics")
  
  for collection in "${collections[@]}"; do
    COUNT=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/$collection" | jq '.data | length // 0')
    echo "  $collection: $COUNT items"
  done
else
  echo "❌ Collections still not accessible"
  echo "Response: $RESPONSE"
fi

echo "🎉 Admin role fix completed!"
echo "🔗 Access your Directus admin panel at: $DIRECTUS_URL"
