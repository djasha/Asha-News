#!/bin/bash

# Comprehensive verification of all relations
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "=== COMPREHENSIVE RELATIONS VERIFICATION ==="
echo ""

echo "1. Junction Tables Status:"
echo "Articles-Tags relations:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles_tags" | jq '.data | length'
echo "Articles-Story Clusters relations:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles_story_clusters" | jq '.data | length'

echo ""
echo "2. Many-to-One Relations:"
echo "Articles with Series:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles?fields=id,title,article_series_id&filter[article_series_id][_nnull]=true" | jq '.data | length'

echo ""
echo "3. Sample Data Verification:"
echo "Article 1 details:"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles/1?fields=id,title,article_series_id" | jq '.data'

echo "Article 1 tags (via junction):"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles_tags?filter[articles_id][_eq]=1&fields=*,tags_id.name" | jq '.data'

echo "Article 1 story clusters (via junction):"
curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles_story_clusters?filter[articles_id][_eq]=1&fields=*,story_clusters_id.title" | jq '.data'

echo ""
echo "4. Collections Status:"
echo "Total articles:" $(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles" | jq '.data | length')
echo "Total tags:" $(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/tags" | jq '.data | length')
echo "Total article series:" $(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/article_series" | jq '.data | length')
echo "Total story clusters:" $(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/story_clusters" | jq '.data | length')

echo ""
echo "=== VERIFICATION COMPLETE ==="
