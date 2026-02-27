#!/bin/bash

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Fixing Articles Collection Schema Issues..."
echo "============================================================"

# Remove problematic relation fields that are causing schema conflicts
echo "Removing problematic relation fields..."

curl -s -X DELETE "$DIRECTUS_URL/fields/articles/tags" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

curl -s -X DELETE "$DIRECTUS_URL/fields/articles/story_clusters" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

curl -s -X DELETE "$DIRECTUS_URL/fields/articles/related_articles" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

curl -s -X DELETE "$DIRECTUS_URL/fields/articles/article_series" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

curl -s -X DELETE "$DIRECTUS_URL/fields/articles/series_part" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

echo "✅ Removed problematic fields"

# Test articles collection access
echo "Testing articles collection access..."
RESPONSE=$(curl -s "http://168.231.111.192:8055/items/articles?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN")

if echo "$RESPONSE" | grep -q "errors"; then
    echo "❌ Still has errors, checking field list..."
    curl -s "$DIRECTUS_URL/fields/articles" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq '.data[].field'
else
    echo "✅ Articles collection is now accessible"
fi

echo ""
echo "🎉 Articles collection schema fixed!"
echo "🔗 Test at: $DIRECTUS_URL/admin/content/articles"
