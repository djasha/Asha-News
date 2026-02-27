#!/bin/bash

# Populate comprehensive sample data for production demo
DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Populating comprehensive sample data for production demo..."

# Create more diverse tags
echo "Creating additional tags..."
TAGS=(
    '{"name": "Artificial Intelligence", "slug": "artificial-intelligence", "description": "AI and machine learning developments", "color": "#8B5CF6", "status": "active"}'
    '{"name": "Cybersecurity", "slug": "cybersecurity", "description": "Digital security and privacy news", "color": "#EF4444", "status": "active"}'
    '{"name": "Space Exploration", "slug": "space-exploration", "description": "Space missions and discoveries", "color": "#06B6D4", "status": "active"}'
    '{"name": "Healthcare Innovation", "slug": "healthcare-innovation", "description": "Medical breakthroughs and health tech", "color": "#10B981", "status": "active"}'
    '{"name": "Economic Policy", "slug": "economic-policy", "description": "Economic trends and policy analysis", "color": "#F59E0B", "status": "active"}'
)

for tag in "${TAGS[@]}"; do
    curl -s -X POST "$DIRECTUS_URL/items/tags" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$tag" | jq '.data.id // .errors[0].message' | head -1
done

# Create more article series
echo "Creating additional article series..."
SERIES=(
    '{"title": "Future of Work Series", "slug": "future-of-work", "description": "Exploring how technology reshapes employment", "status": "active"}'
    '{"title": "Global Health Watch", "slug": "global-health-watch", "description": "Tracking worldwide health developments", "status": "active"}'
    '{"title": "Space Race 2024", "slug": "space-race-2024", "description": "Commercial and government space initiatives", "status": "active"}'
    '{"title": "Cybersecurity Frontlines", "slug": "cybersecurity-frontlines", "description": "Digital security threats and solutions", "status": "active"}'
)

for series in "${SERIES[@]}"; do
    curl -s -X POST "$DIRECTUS_URL/items/article_series" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$series" | jq '.data.id // .errors[0].message' | head -1
done

# Create more story clusters
echo "Creating additional story clusters..."
CLUSTERS=(
    '{"title": "AI Regulation Debate", "cluster_title": "AI Regulation Debate", "slug": "ai-regulation-debate", "description": "Global discussions on AI governance", "status": "active", "article_count": 0}'
    '{"title": "Space Tourism Boom", "cluster_title": "Space Tourism Boom", "slug": "space-tourism-boom", "description": "Commercial space travel developments", "status": "active", "article_count": 0}'
    '{"title": "Healthcare Data Privacy", "cluster_title": "Healthcare Data Privacy", "slug": "healthcare-data-privacy", "description": "Medical data security concerns", "status": "active", "article_count": 0}'
    '{"title": "Green Energy Transition", "cluster_title": "Green Energy Transition", "slug": "green-energy-transition", "description": "Renewable energy adoption worldwide", "status": "active", "article_count": 0}'
)

for cluster in "${CLUSTERS[@]}"; do
    curl -s -X POST "$DIRECTUS_URL/items/story_clusters" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$cluster" | jq '.data.id // .errors[0].message' | head -1
done

# Create more comprehensive articles with relations
echo "Creating additional articles..."
ARTICLES=(
    '{"title": "AI Regulation Framework Proposed by EU", "content": "The European Union has unveiled a comprehensive framework for artificial intelligence regulation, setting global precedents for AI governance and ethical standards.", "excerpt": "EU proposes groundbreaking AI regulation framework", "status": "published", "published_at": "2024-01-16T09:00:00Z", "author": "Tech Policy Desk", "source_url": "https://example.com/eu-ai-regulation", "bias_score": 0.1, "credibility_score": 0.95, "article_type": "analysis", "article_series_id": 2}'
    '{"title": "SpaceX Announces Mars Mission Timeline", "content": "SpaceX has revealed detailed plans for its Mars colonization mission, including launch windows and crew selection criteria for the ambitious interplanetary journey.", "excerpt": "SpaceX details Mars mission plans and timeline", "status": "published", "published_at": "2024-01-15T14:00:00Z", "author": "Space Correspondent", "source_url": "https://example.com/spacex-mars-mission", "bias_score": 0.05, "credibility_score": 0.9, "article_type": "news", "article_series_id": 3}'
    '{"title": "Breakthrough in Quantum Computing Achieved", "content": "Researchers have achieved a significant milestone in quantum computing, demonstrating error correction capabilities that bring practical quantum computers closer to reality.", "excerpt": "Major quantum computing breakthrough announced", "status": "published", "published_at": "2024-01-14T11:30:00Z", "author": "Science Reporter", "source_url": "https://example.com/quantum-breakthrough", "bias_score": 0.0, "credibility_score": 0.92, "article_type": "breaking"}'
)

ARTICLE_IDS=()
for article in "${ARTICLES[@]}"; do
    RESULT=$(curl -s -X POST "$DIRECTUS_URL/items/articles" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$article" | jq '.data.id // empty')
    if [ "$RESULT" != "" ] && [ "$RESULT" != "null" ]; then
        ARTICLE_IDS+=($RESULT)
        echo "Created article with ID: $RESULT"
    fi
done

# Create more relations between new articles and tags/clusters
echo "Creating additional relations..."

# Get some tag and cluster IDs
TAG_AI_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/tags?filter[slug][_eq]=artificial-intelligence&fields=id" | jq -r '.data[0].id // empty')
TAG_SPACE_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/tags?filter[slug][_eq]=space-exploration&fields=id" | jq -r '.data[0].id // empty')

CLUSTER_AI_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/story_clusters?filter[slug][_eq]=ai-regulation-debate&fields=id" | jq -r '.data[0].id // empty')
CLUSTER_SPACE_ID=$(curl -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/items/story_clusters?filter[slug][_eq]=space-tourism-boom&fields=id" | jq -r '.data[0].id // empty')

# Create article-tag relations
if [ ${#ARTICLE_IDS[@]} -gt 0 ] && [ "$TAG_AI_ID" != "" ] && [ "$TAG_AI_ID" != "null" ]; then
    curl -s -X POST "$DIRECTUS_URL/items/articles_tags" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"articles_id\": ${ARTICLE_IDS[0]}, \"tags_id\": $TAG_AI_ID}" | jq '.data.id // .errors[0].message' | head -1
fi

if [ ${#ARTICLE_IDS[@]} -gt 1 ] && [ "$TAG_SPACE_ID" != "" ] && [ "$TAG_SPACE_ID" != "null" ]; then
    curl -s -X POST "$DIRECTUS_URL/items/articles_tags" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"articles_id\": ${ARTICLE_IDS[1]}, \"tags_id\": $TAG_SPACE_ID}" | jq '.data.id // .errors[0].message' | head -1
fi

# Create article-cluster relations
if [ ${#ARTICLE_IDS[@]} -gt 0 ] && [ "$CLUSTER_AI_ID" != "" ] && [ "$CLUSTER_AI_ID" != "null" ]; then
    curl -s -X POST "$DIRECTUS_URL/items/articles_story_clusters" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"articles_id\": ${ARTICLE_IDS[0]}, \"story_clusters_id\": $CLUSTER_AI_ID}" | jq '.data.id // .errors[0].message' | head -1
fi

if [ ${#ARTICLE_IDS[@]} -gt 1 ] && [ "$CLUSTER_SPACE_ID" != "" ] && [ "$CLUSTER_SPACE_ID" != "null" ]; then
    curl -s -X POST "$DIRECTUS_URL/items/articles_story_clusters" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"articles_id\": ${ARTICLE_IDS[1]}, \"story_clusters_id\": $CLUSTER_SPACE_ID}" | jq '.data.id // .errors[0].message' | head -1
fi

echo ""
echo "Sample data population completed!"
echo "Created additional:"
echo "- 5 new tags (AI, Cybersecurity, Space, Healthcare, Economic)"
echo "- 4 new article series"
echo "- 4 new story clusters"
echo "- 3 new articles with relations"
echo "- Multiple new article-tag and article-cluster relations"
