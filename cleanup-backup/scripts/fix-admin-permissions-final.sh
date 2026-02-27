#!/bin/bash

# Fix Admin Permissions for All Collections - Final Solution
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

# Get all policies assigned to admin user
echo "📋 Getting admin user policies..."
POLICIES=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/users/me" | \
  jq -r '.data.policies[]')

echo "Found policies: $POLICIES"

# Collections to grant permissions for
collections=(
  "site_configuration"
  "navigation_menus"
  "menu_items"
  "topic_categories"
  "news_sources"
  "legal_pages"
  "articles"
  "homepage_sections"
  "page_content"
  "breaking_news"
  "daily_briefs"
  "trending_topics"
)

# Actions to permit
actions=("create" "read" "update" "delete" "share")

echo "🔧 Setting comprehensive permissions for all policies..."

# Grant permissions for each policy
for policy in $POLICIES; do
  echo "  📝 Setting permissions for policy: $policy"
  
  for collection in "${collections[@]}"; do
    for action in "${actions[@]}"; do
      curl -s -X POST "$DIRECTUS_URL/permissions" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"collection\": \"$collection\",
          \"action\": \"$action\",
          \"policy\": \"$policy\",
          \"fields\": [\"*\"],
          \"permissions\": {},
          \"validation\": {}
        }" > /dev/null 2>&1
    done
  done
done

# Also grant system collection permissions
system_collections=("directus_collections" "directus_fields" "directus_relations")

for policy in $POLICIES; do
  for collection in "${system_collections[@]}"; do
    for action in "${actions[@]}"; do
      curl -s -X POST "$DIRECTUS_URL/permissions" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
          \"collection\": \"$collection\",
          \"action\": \"$action\",
          \"policy\": \"$policy\",
          \"fields\": [\"*\"],
          \"permissions\": {},
          \"validation\": {}
        }" > /dev/null 2>&1
    done
  done
done

echo "✅ Permissions configured for all policies!"

# Test permissions
echo "🧪 Testing permissions..."
for collection in "${collections[@]}"; do
  RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/$collection")
  if echo "$RESPONSE" | grep -q '"data"'; then
    echo "  ✅ $collection: accessible"
  else
    echo "  ❌ $collection: failed"
  fi
done

echo "🎉 Admin permissions setup completed!"
echo "🔗 Access your Directus admin panel at: $DIRECTUS_URL"
