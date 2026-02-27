#!/bin/bash

# Phase 3: Navigation & Structure Collections
# Following DIRECTUS_COLLECTION_FIX_GUIDE.md exactly

set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Phase 3: Navigation & Structure Collections ==="

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

# 1. Navigation Menus Collection
echo "🧭 Creating Navigation Menus collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "navigation_menus",
    "meta": {
      "icon": "menu",
      "note": "Site navigation structure"
    },
    "schema": {
      "name": "navigation_menus"
    }
  }' > /dev/null

# Add fields to navigation_menus
curl -s -X POST "$DIRECTUS_URL/fields/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "name", "type": "string", "meta": {"interface": "input", "required": true, "note": "Menu identifier"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "location", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Header", "value": "header"}, {"text": "Footer", "value": "footer"}, {"text": "Mobile", "value": "mobile"}]}}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "enabled", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "sort_order", "type": "integer", "meta": {"interface": "input"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_updated", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-updated"]}}' > /dev/null

echo "✅ Navigation Menus collection created"

# Test navigation_menus
NAV_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/navigation_menus")
if [[ "$NAV_TEST" == *"data"* ]]; then
  echo "✅ Navigation Menus collection test passed"
else
  echo "❌ Navigation Menus collection test failed"
  exit 1
fi

# 2. Menu Items Collection
echo "📋 Creating Menu Items collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "menu_items",
    "meta": {
      "icon": "list",
      "note": "Individual navigation links"
    },
    "schema": {
      "name": "menu_items"
    }
  }' > /dev/null

# Add fields to menu_items
curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "title", "type": "string", "meta": {"interface": "input", "required": true, "note": "Display text"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "url", "type": "string", "meta": {"interface": "input", "required": true, "note": "Link destination"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "icon", "type": "string", "meta": {"interface": "input", "note": "Icon name"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "target", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Same Window", "value": "_self"}, {"text": "New Window", "value": "_blank"}]}}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "enabled", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "sort_order", "type": "integer", "meta": {"interface": "input"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "parent_menu", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "display_template": "{{name}}", "note": "Parent navigation menu"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

echo "✅ Menu Items collection created"

# Test menu_items
MENU_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/menu_items")
if [[ "$MENU_TEST" == *"data"* ]]; then
  echo "✅ Menu Items collection test passed"
else
  echo "❌ Menu Items collection test failed"
  exit 1
fi

echo "🎉 Phase 3 Collections (Part 1) completed successfully!"
echo "📊 Created: navigation_menus, menu_items"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
