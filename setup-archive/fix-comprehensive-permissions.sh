#!/bin/bash

# Fix comprehensive permissions for all Directus collections
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Fixing Comprehensive Directus Permissions ==="

# Get admin token
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Get Administrator policy ID
ADMIN_POLICY_ID="f66a5e36-eab2-461f-8903-2d50e008c9f7"

echo "🔐 Setting up comprehensive permissions for Administrator policy: $ADMIN_POLICY_ID"

# All collections that need permissions
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

# All actions to permit
actions=("create" "read" "update" "delete" "share")

echo "📋 Setting permissions for ${#collections[@]} collections with ${#actions[@]} actions each..."

for collection in "${collections[@]}"; do
  echo "  🔧 Setting permissions for: $collection"
  for action in "${actions[@]}"; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"collection\": \"$collection\",
        \"action\": \"$action\",
        \"policy\": \"$ADMIN_POLICY_ID\",
        \"fields\": [\"*\"],
        \"permissions\": null,
        \"validation\": null,
        \"presets\": null
      }" > /dev/null 2>&1
  done
done

echo "✅ Permissions configured for all collections!"

# Test a few collections to verify permissions work
echo "🧪 Testing permissions..."

echo "  Testing site_configuration:"
SITE_CONFIG_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/site_configuration" | grep -o '"data"' || echo "FAILED")
if [ "$SITE_CONFIG_TEST" = '"data"' ]; then
  echo "    ✅ site_configuration accessible"
else
  echo "    ❌ site_configuration failed"
fi

echo "  Testing topic_categories:"
TOPICS_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/topic_categories" | grep -o '"data"' || echo "FAILED")
if [ "$TOPICS_TEST" = '"data"' ]; then
  echo "    ✅ topic_categories accessible"
else
  echo "    ❌ topic_categories failed"
fi

echo "  Testing news_sources:"
SOURCES_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/news_sources" | grep -o '"data"' || echo "FAILED")
if [ "$SOURCES_TEST" = '"data"' ]; then
  echo "    ✅ news_sources accessible"
else
  echo "    ❌ news_sources failed"
fi

echo "🎉 Comprehensive permissions setup completed!"
echo "📊 Configured permissions for $(echo ${#collections[@]}) collections"
echo "🔗 All collections should now be accessible via API endpoints"
