#!/bin/bash

# Add article_type field to articles collection for blog/news distinction
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Adding article_type field to articles collection ==="

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

# Add article_type field to articles collection
echo "📝 Adding article_type field..."
curl -s -X POST "$DIRECTUS_URL/fields/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "article_type",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "News Article", "value": "news"},
          {"text": "Blog Post", "value": "blog"}
        ]
      },
      "note": "Choose whether this is a news article or blog post",
      "required": false
    },
    "schema": {
      "default_value": "news"
    }
  }' > /dev/null

echo "✅ article_type field added successfully"

# Update existing articles to have article_type = 'news' by default
echo "📝 Updating existing articles..."
curl -s -X PATCH "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keys": ["1", "2", "3", "4"],
    "data": {
      "article_type": "news"
    }
  }' > /dev/null

echo "✅ Existing articles updated with article_type = 'news'"
echo "🎉 Article type field setup complete!"
echo "📝 You can now choose 'News Article' or 'Blog Post' when creating content in Directus"
