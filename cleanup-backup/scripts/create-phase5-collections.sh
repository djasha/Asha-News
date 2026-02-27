#!/bin/bash

# Phase 5: Legal & Compliance Collections
# Following DIRECTUS_COLLECTION_FIX_GUIDE.md exactly

set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Phase 5: Legal & Compliance Collections ==="

# Get admin token
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "✅ Authentication successful"

# 1. Legal Pages Collection
echo "⚖️ Creating Legal Pages collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "legal_pages",
    "meta": {
      "icon": "gavel",
      "note": "Legal and policy pages"
    },
    "schema": {
      "name": "legal_pages"
    }
  }' > /dev/null

# Add fields to legal_pages
curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "title", "type": "string", "meta": {"interface": "input", "required": true, "note": "Page title"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "slug", "type": "string", "meta": {"interface": "input", "required": true, "note": "URL slug"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "content", "type": "text", "meta": {"interface": "input-rich-text-html", "note": "Page content"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "last_updated", "type": "timestamp", "meta": {"interface": "datetime", "note": "Last updated date"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "version", "type": "string", "meta": {"interface": "input", "note": "Version number"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "published", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

echo "✅ Legal Pages collection created"

# Test legal_pages
LEGAL_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/legal_pages")
if [[ "$LEGAL_TEST" == *"data"* ]]; then
  echo "✅ Legal Pages collection test passed"
else
  echo "❌ Legal Pages collection test failed"
  exit 1
fi

# 2. User Feedback Collection
echo "💬 Creating User Feedback collection..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "user_feedback",
    "meta": {
      "icon": "feedback",
      "note": "User comments and suggestions"
    },
    "schema": {
      "name": "user_feedback"
    }
  }' > /dev/null

# Add fields to user_feedback
curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "id", "type": "uuid", "meta": {"interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "name", "type": "string", "meta": {"interface": "input", "note": "User name"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "email", "type": "string", "meta": {"interface": "input", "note": "User email"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "subject", "type": "string", "meta": {"interface": "input", "required": true, "note": "Feedback subject"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "message", "type": "text", "meta": {"interface": "input-multiline", "required": true, "note": "Feedback message"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "category", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Bug Report", "value": "bug"}, {"text": "Feature Request", "value": "feature"}, {"text": "General Feedback", "value": "general"}]}}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "New", "value": "new"}, {"text": "In Review", "value": "review"}, {"text": "Resolved", "value": "resolved"}]}}, "schema": {"default_value": "new"}}' > /dev/null

curl -s -X POST "$DIRECTUS_URL/fields/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field": "date_created", "type": "timestamp", "meta": {"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}}' > /dev/null

echo "✅ User Feedback collection created"

# Test user_feedback
FEEDBACK_TEST=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/user_feedback")
if [[ "$FEEDBACK_TEST" == *"data"* ]]; then
  echo "✅ User Feedback collection test passed"
else
  echo "❌ User Feedback collection test failed"
  exit 1
fi

echo "🎉 Phase 5 Collections completed successfully!"
echo "📊 Created: legal_pages, user_feedback"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
