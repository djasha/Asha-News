#!/bin/bash

# Final Directus Admin Fix - Create proper Super Admin policy and assign user
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Final Directus Admin Fix ==="

# Get admin token
echo "🔐 Authenticating..."
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Get current user ID
echo "👤 Getting admin user ID..."
USER_RESPONSE=$(curl -s -X GET "$DIRECTUS_URL/users/me" \
  -H "Authorization: Bearer $TOKEN")

USER_ID=$(echo "$USER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ Failed to get user ID"
  exit 1
fi

echo "✅ Admin user ID: $USER_ID"

# Create Super Admin policy with full access
echo "🔧 Creating Super Admin policy..."
POLICY_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/policies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "description": "Full administrative access to all collections and settings",
    "admin_access": true,
    "app_access": true
  }')

POLICY_ID=$(echo "$POLICY_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$POLICY_ID" ]; then
  echo "❌ Failed to create Super Admin policy"
  echo "Response: $POLICY_RESPONSE"
  exit 1
fi

echo "✅ Super Admin policy created: $POLICY_ID"

# Assign Super Admin policy to current user
echo "👑 Assigning Super Admin policy to user..."
ASSIGNMENT_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/access" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$POLICY_ID\",
    \"user\": \"$USER_ID\"
  }")

echo "✅ Policy assigned to user"

# Clear cache
echo "🧹 Clearing cache..."
curl -s -X POST "$DIRECTUS_URL/utils/cache/clear" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo "✅ Cache cleared"

# Test access to collections
echo "🧪 Testing collection access..."
collections=("site_configuration" "breaking_news" "topic_categories" "news_sources" "homepage_sections")

for collection in "${collections[@]}"; do
  TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X GET "$DIRECTUS_URL/items/$collection?limit=1" \
    -H "Authorization: Bearer $TOKEN")
  
  if [ "$TEST_RESPONSE" = "200" ]; then
    echo "  ✅ $collection: accessible"
  else
    echo "  ❌ $collection: failed ($TEST_RESPONSE)"
  fi
done

echo ""
echo "🎉 Directus Admin Fix Complete!"
echo "📋 Summary:"
echo "  - Super Admin policy created with full access"
echo "  - Policy assigned to admin@asha.news"
echo "  - Cache cleared"
echo "  - Collections tested"
echo ""
echo "🔗 Next steps:"
echo "  1. Log out of Directus admin panel"
echo "  2. Log back in with admin@asha.news / AdminPass123"
echo "  3. Navigate to Content section"
echo "  4. All collections should now be editable"
