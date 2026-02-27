#!/bin/bash

# Populate relations using existing integer IDs from collections
# This script creates junction table entries with the correct ID types

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Creating relations with existing IDs..."

# First, let's get existing IDs to work with
echo "Fetching existing IDs..."

# Get some article IDs
ARTICLE_1_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles?limit=1&offset=0&fields=id" | jq -r '.data[0].id')
ARTICLE_2_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles?limit=1&offset=1&fields=id" | jq -r '.data[0].id')
ARTICLE_3_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/articles?limit=1&offset=2&fields=id" | jq -r '.data[0].id')

# Get some tag IDs
TAG_TECH_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/tags?filter[name][_eq]=Technology&fields=id" | jq -r '.data[0].id')
TAG_POLITICS_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/tags?filter[name][_eq]=Politics&fields=id" | jq -r '.data[0].id')
TAG_BREAKING_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/tags?filter[name][_eq]=Breaking News&fields=id" | jq -r '.data[0].id')

echo "Found Article IDs: $ARTICLE_1_ID, $ARTICLE_2_ID, $ARTICLE_3_ID"
echo "Found Tag IDs: Technology=$TAG_TECH_ID, Politics=$TAG_POLITICS_ID, Breaking News=$TAG_BREAKING_ID"

# Create some article series if they don't exist
echo "Creating article series..."
SERIES_1_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/items/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Revolution Series",
    "slug": "ai-revolution",
    "description": "Deep dive into artificial intelligence developments",
    "status": "active"
  }')

SERIES_2_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/items/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Action Series", 
    "slug": "climate-action",
    "description": "Comprehensive climate change coverage",
    "status": "active"
  }')

# Extract series IDs from responses
SERIES_1_ID=$(echo $SERIES_1_RESPONSE | jq -r '.data.id // empty')
SERIES_2_ID=$(echo $SERIES_2_RESPONSE | jq -r '.data.id // empty')

# If creation failed, try to get existing series
if [ "$SERIES_1_ID" = "" ] || [ "$SERIES_1_ID" = "null" ]; then
  SERIES_1_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/article_series?limit=1&fields=id" | jq -r '.data[0].id // empty')
fi

if [ "$SERIES_2_ID" = "" ] || [ "$SERIES_2_ID" = "null" ]; then
  SERIES_2_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/article_series?limit=1&offset=1&fields=id" | jq -r '.data[0].id // empty')
fi

echo "Series IDs: $SERIES_1_ID, $SERIES_2_ID"

# Create some story clusters
echo "Creating story clusters..."
CLUSTER_1_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/items/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Technology Developments",
    "cluster_title": "AI Technology Developments",
    "slug": "ai-tech-developments",
    "description": "Latest developments in AI technology",
    "status": "active",
    "article_count": 0
  }')

CLUSTER_2_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/items/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Policy Updates",
    "cluster_title": "Climate Policy Updates", 
    "slug": "climate-policy-updates",
    "description": "Climate policy and environmental news",
    "status": "active",
    "article_count": 0
  }')

# Extract cluster IDs
CLUSTER_1_ID=$(echo $CLUSTER_1_RESPONSE | jq -r '.data.id // empty')
CLUSTER_2_ID=$(echo $CLUSTER_2_RESPONSE | jq -r '.data.id // empty')

# If creation failed, try to get existing clusters
if [ "$CLUSTER_1_ID" = "" ] || [ "$CLUSTER_1_ID" = "null" ]; then
  CLUSTER_1_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/story_clusters?limit=1&fields=id" | jq -r '.data[0].id // empty')
fi

if [ "$CLUSTER_2_ID" = "" ] || [ "$CLUSTER_2_ID" = "null" ]; then
  CLUSTER_2_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/story_clusters?limit=1&offset=1&fields=id" | jq -r '.data[0].id // empty')
fi

echo "Cluster IDs: $CLUSTER_1_ID, $CLUSTER_2_ID"

# Now create the many-to-many relations
echo "Creating article-tag relations..."

# Only create relations if we have valid IDs
if [ "$ARTICLE_1_ID" != "" ] && [ "$ARTICLE_1_ID" != "null" ] && [ "$TAG_TECH_ID" != "" ] && [ "$TAG_TECH_ID" != "null" ]; then
  echo "Linking Article $ARTICLE_1_ID with Technology tag $TAG_TECH_ID"
  curl -s -X POST "$DIRECTUS_URL/items/articles_tags" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"articles_id\": $ARTICLE_1_ID,
      \"tags_id\": $TAG_TECH_ID
    }"
fi

if [ "$ARTICLE_2_ID" != "" ] && [ "$ARTICLE_2_ID" != "null" ] && [ "$TAG_POLITICS_ID" != "" ] && [ "$TAG_POLITICS_ID" != "null" ]; then
  echo "Linking Article $ARTICLE_2_ID with Politics tag $TAG_POLITICS_ID"
  curl -s -X POST "$DIRECTUS_URL/items/articles_tags" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"articles_id\": $ARTICLE_2_ID,
      \"tags_id\": $TAG_POLITICS_ID
    }"
fi

if [ "$ARTICLE_3_ID" != "" ] && [ "$ARTICLE_3_ID" != "null" ] && [ "$TAG_BREAKING_ID" != "" ] && [ "$TAG_BREAKING_ID" != "null" ]; then
  echo "Linking Article $ARTICLE_3_ID with Breaking News tag $TAG_BREAKING_ID"
  curl -s -X POST "$DIRECTUS_URL/items/articles_tags" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"articles_id\": $ARTICLE_3_ID,
      \"tags_id\": $TAG_BREAKING_ID
    }"
fi

echo "Creating article-story_cluster relations..."

# Create story cluster relations
if [ "$ARTICLE_1_ID" != "" ] && [ "$ARTICLE_1_ID" != "null" ] && [ "$CLUSTER_1_ID" != "" ] && [ "$CLUSTER_1_ID" != "null" ]; then
  echo "Linking Article $ARTICLE_1_ID with Cluster $CLUSTER_1_ID"
  curl -s -X POST "$DIRECTUS_URL/items/articles_story_clusters" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"articles_id\": $ARTICLE_1_ID,
      \"story_clusters_id\": $CLUSTER_1_ID
    }"
fi

if [ "$ARTICLE_2_ID" != "" ] && [ "$ARTICLE_2_ID" != "null" ] && [ "$CLUSTER_2_ID" != "" ] && [ "$CLUSTER_2_ID" != "null" ]; then
  echo "Linking Article $ARTICLE_2_ID with Cluster $CLUSTER_2_ID"
  curl -s -X POST "$DIRECTUS_URL/items/articles_story_clusters" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"articles_id\": $ARTICLE_2_ID,
      \"story_clusters_id\": $CLUSTER_2_ID
    }"
fi

# Update articles to link to series (many-to-one)
echo "Creating article-series relations..."

if [ "$ARTICLE_1_ID" != "" ] && [ "$ARTICLE_1_ID" != "null" ] && [ "$SERIES_1_ID" != "" ] && [ "$SERIES_1_ID" != "null" ]; then
  echo "Linking Article $ARTICLE_1_ID with Series $SERIES_1_ID"
  curl -s -X PATCH "$DIRECTUS_URL/items/articles/$ARTICLE_1_ID" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"article_series_id\": $SERIES_1_ID
    }"
fi

if [ "$ARTICLE_2_ID" != "" ] && [ "$ARTICLE_2_ID" != "null" ] && [ "$SERIES_2_ID" != "" ] && [ "$SERIES_2_ID" != "null" ]; then
  echo "Linking Article $ARTICLE_2_ID with Series $SERIES_2_ID"
  curl -s -X PATCH "$DIRECTUS_URL/items/articles/$ARTICLE_2_ID" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"article_series_id\": $SERIES_2_ID
    }"
fi

echo ""
echo "Relations created successfully!"
echo "Summary:"
echo "- Created article-tag relations (many-to-many)"
echo "- Created article-story_cluster relations (many-to-many)"  
echo "- Created article-series relations (many-to-one)"
echo ""
echo "You can now test these relations in the Directus admin panel:"
echo "- Go to Articles and check the Tags and Story Clusters fields"
echo "- Go to Tags and check the Articles field"
echo "- Go to Story Clusters and check the Articles field"
echo "- Go to Article Series and check the Articles field"
