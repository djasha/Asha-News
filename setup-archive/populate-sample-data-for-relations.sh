#!/bin/bash

# Populate sample data for testing relations
# This script adds sample articles, tags, article_series, and story_clusters with proper relations

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "Populating sample data for relations testing..."

# First, create some tags
echo "Creating sample tags..."
curl -X POST "$DIRECTUS_URL/items/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Politics",
    "slug": "politics",
    "description": "Political news and analysis",
    "color": "#3B82F6",
    "status": "active"
  }'

curl -X POST "$DIRECTUS_URL/items/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "slug": "technology", 
    "description": "Tech industry news and innovations",
    "color": "#10B981",
    "status": "active"
  }'

curl -X POST "$DIRECTUS_URL/items/tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Breaking News",
    "slug": "breaking-news",
    "description": "Urgent and breaking news stories",
    "color": "#EF4444",
    "status": "active"
  }'

# Create some article series
echo "Creating sample article series..."
curl -X POST "$DIRECTUS_URL/items/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Election 2024 Coverage",
    "slug": "election-2024",
    "description": "Comprehensive coverage of the 2024 election cycle",
    "status": "active"
  }'

curl -X POST "$DIRECTUS_URL/items/article_series" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Revolution Series",
    "slug": "ai-revolution",
    "description": "Deep dive into artificial intelligence developments",
    "status": "active"
  }'

# Create some story clusters
echo "Creating sample story clusters..."
curl -X POST "$DIRECTUS_URL/items/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Change Summit",
    "slug": "climate-change-summit",
    "description": "Coverage of international climate negotiations",
    "status": "active",
    "article_count": 0
  }'

curl -X POST "$DIRECTUS_URL/items/story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Layoffs 2024",
    "slug": "tech-layoffs-2024", 
    "description": "Analysis of technology sector job cuts",
    "status": "active",
    "article_count": 0
  }'

# Create sample articles with relations
echo "Creating sample articles with relations..."
curl -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Presidential Debate Analysis: Key Takeaways",
    "slug": "presidential-debate-analysis-key-takeaways",
    "content": "A comprehensive analysis of the latest presidential debate, examining key policy positions and candidate performances.",
    "excerpt": "Breaking down the most important moments from last nights presidential debate.",
    "status": "published",
    "published_at": "2024-01-15T10:00:00Z",
    "author": "Political Desk",
    "source_url": "https://example.com/debate-analysis",
    "bias_score": 0.2,
    "credibility_score": 0.9,
    "article_series_id": 1,
    "article_type": "analysis"
  }'

curl -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Breakthrough: New Language Model Surpasses GPT-4",
    "slug": "ai-breakthrough-new-language-model-surpasses-gpt4",
    "content": "Researchers announce a significant advancement in artificial intelligence with a new language model that outperforms existing systems.",
    "excerpt": "New AI model shows remarkable improvements in reasoning and factual accuracy.",
    "status": "published", 
    "published_at": "2024-01-14T14:30:00Z",
    "author": "Tech Reporter",
    "source_url": "https://example.com/ai-breakthrough",
    "bias_score": 0.1,
    "credibility_score": 0.95,
    "article_series_id": 2,
    "article_type": "news"
  }'

curl -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Summit Reaches Historic Agreement",
    "slug": "climate-summit-reaches-historic-agreement",
    "content": "World leaders at the climate summit have reached a groundbreaking agreement on carbon emissions reduction targets.",
    "excerpt": "Historic climate deal sets ambitious targets for global carbon reduction.",
    "status": "published",
    "published_at": "2024-01-13T16:45:00Z", 
    "author": "Environmental Correspondent",
    "source_url": "https://example.com/climate-agreement",
    "bias_score": 0.15,
    "credibility_score": 0.92,
    "article_type": "breaking"
  }'

# Now create the many-to-many relations
echo "Creating article-tag relations..."

# Article 1 (Presidential Debate) -> Politics, Breaking News tags
curl -X POST "$DIRECTUS_URL/items/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 1,
    "tags_id": 1
  }'

curl -X POST "$DIRECTUS_URL/items/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 1,
    "tags_id": 3
  }'

# Article 2 (AI Breakthrough) -> Technology tag
curl -X POST "$DIRECTUS_URL/items/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 2,
    "tags_id": 2
  }'

# Article 3 (Climate Summit) -> Breaking News tag
curl -X POST "$DIRECTUS_URL/items/articles_tags" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 3,
    "tags_id": 3
  }'

echo "Creating article-story_cluster relations..."

# Article 3 (Climate Summit) -> Climate Change Summit cluster
curl -X POST "$DIRECTUS_URL/items/articles_story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 3,
    "story_clusters_id": 1
  }'

# Article 2 (AI Breakthrough) -> Tech Layoffs cluster (related tech story)
curl -X POST "$DIRECTUS_URL/items/articles_story_clusters" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articles_id": 2,
    "story_clusters_id": 2
  }'

echo "Sample data populated successfully!"
echo "Created:"
echo "- 3 tags (Politics, Technology, Breaking News)"
echo "- 2 article series (Election 2024, AI Revolution)"
echo "- 2 story clusters (Climate Change Summit, Tech Layoffs 2024)"
echo "- 3 articles with proper relations"
echo "- Multiple many-to-many relations between articles, tags, and story clusters"
