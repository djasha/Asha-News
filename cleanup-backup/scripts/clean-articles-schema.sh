#!/bin/bash

# Clean up articles schema by removing problematic alias fields
# The junction tables work fine, but the alias fields are causing SQL errors

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Cleaning up articles schema..."

# Remove problematic alias fields from articles collection
echo "Removing problematic alias fields..."
curl -X DELETE "$DIRECTUS_URL/fields/articles/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/fields/articles/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

curl -X DELETE "$DIRECTUS_URL/fields/articles/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN"

echo "Articles schema cleaned up!"
echo "Junction tables remain functional for relations:"
echo "- articles_tags (many-to-many)"
echo "- articles_story_clusters (many-to-many)"
echo "- article_series_id field (many-to-one)"
