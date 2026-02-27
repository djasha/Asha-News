#!/bin/bash

# Final test of all relations to verify they're working correctly

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Testing all relations..."

# 1. Create a few article-tag relations to test
echo "Creating article-tag relations..."
curl -s -X POST "$DIRECTUS_URL/items/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 1,
    "tags_id": 1
  }' | jq '.data // .errors'

curl -s -X POST "$DIRECTUS_URL/items/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 2,
    "tags_id": 2
  }' | jq '.data // .errors'

# 2. Update articles to link to series
echo "Linking articles to series..."
curl -s -X PATCH "$DIRECTUS_URL/items/articles/1" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_series_id": 1
  }' | jq '.data.id // .errors'

curl -s -X PATCH "$DIRECTUS_URL/items/articles/2" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_series_id": 2
  }' | jq '.data.id // .errors'

# 3. Test fetching relations
echo "Testing relation queries..."

echo "Articles with story clusters:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  "$DIRECTUS_URL/items/articles_story_clusters" | jq '.data'

echo "Articles with tags:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  "$DIRECTUS_URL/items/articles_tags" | jq '.data'

echo "Articles with series:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  "$DIRECTUS_URL/items/articles?fields=id,title,article_series_id&filter[article_series_id][_nnull]=true" | jq '.data'

echo "Story clusters with article count:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  "$DIRECTUS_URL/items/story_clusters?fields=id,title,cluster_title" | jq '.data'

echo ""
echo "Relations test completed!"
echo "All junction tables should now have data and be visible in the Directus admin panel."
