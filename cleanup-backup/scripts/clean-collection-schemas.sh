#!/bin/bash

# Clean up problematic alias fields from all collections
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Cleaning up problematic alias fields from collections..."

# Remove problematic alias fields from article_series
echo "Cleaning article_series collection..."
curl -s -X DELETE "$DIRECTUS_URL/fields/article_series/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

# Remove problematic alias fields from story_clusters  
echo "Cleaning story_clusters collection..."
curl -s -X DELETE "$DIRECTUS_URL/fields/story_clusters/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

# Remove problematic alias fields from tags (already done but ensuring)
echo "Cleaning tags collection..."
curl -s -X DELETE "$DIRECTUS_URL/fields/tags/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

echo "Schema cleanup completed!"

# Now test collections accessibility
echo ""
echo "Testing collections accessibility..."

COLLECTIONS=("tags" "article_series" "story_clusters")
for collection in "${COLLECTIONS[@]}"; do
    echo "Testing $collection..."
    RESULT=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/$collection?limit=1" | jq '.data // .errors')
    if [[ "$RESULT" == "[]" ]] || [[ "$RESULT" =~ ^\[.*\]$ ]]; then
        echo "✅ $collection: accessible"
    else
        echo "❌ $collection: $RESULT"
    fi
done

echo ""
echo "Collections cleanup completed!"
