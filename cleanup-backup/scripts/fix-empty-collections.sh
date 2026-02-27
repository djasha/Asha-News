#!/bin/bash

# Fix empty collections by populating sample data
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Populating empty collections with sample data..."

# Populate tags
echo "Creating sample tags..."
curl -s -X POST "$DIRECTUS_URL/items/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "slug": "technology",
    "description": "Technology and innovation news",
    "color": "#3B82F6",
    "status": "active"
  }' | jq '.data.id // .errors'

curl -s -X POST "$DIRECTUS_URL/items/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Politics",
    "slug": "politics", 
    "description": "Political news and analysis",
    "color": "#EF4444",
    "status": "active"
  }' | jq '.data.id // .errors'

curl -s -X POST "$DIRECTUS_URL/items/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Climate",
    "slug": "climate",
    "description": "Climate and environmental news",
    "color": "#10B981",
    "status": "active"
  }' | jq '.data.id // .errors'

# Populate article_series
echo "Creating sample article series..."
curl -s -X POST "$DIRECTUS_URL/items/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Revolution 2024",
    "slug": "ai-revolution-2024",
    "description": "Deep dive into AI developments",
    "status": "active"
  }' | jq '.data.id // .errors'

curl -s -X POST "$DIRECTUS_URL/items/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Action Series",
    "slug": "climate-action-series",
    "description": "Climate policy and action coverage",
    "status": "active"
  }' | jq '.data.id // .errors'

# Populate story_clusters
echo "Creating sample story clusters..."
curl -s -X POST "$DIRECTUS_URL/items/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Industry Updates",
    "cluster_title": "Tech Industry Updates",
    "slug": "tech-industry-updates",
    "description": "Latest technology industry news",
    "status": "active",
    "article_count": 0
  }' | jq '.data.id // .errors'

curl -s -X POST "$DIRECTUS_URL/items/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Political Developments",
    "cluster_title": "Political Developments",
    "slug": "political-developments", 
    "description": "Political news and analysis",
    "status": "active",
    "article_count": 0
  }' | jq '.data.id // .errors'

echo "Sample data creation completed!"
