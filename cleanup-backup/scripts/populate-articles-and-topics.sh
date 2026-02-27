#!/bin/bash

# Populate Articles and Trending Topics for Frontend Display
DIRECTUS_URL="http://168.231.111.192:8055"
TOKEN="$DIRECTUS_TOKEN"

echo "🚀 Populating Articles and Trending Topics..."

# Create sample articles
echo "📰 Creating sample articles..."

curl -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Breaking: Major Tech Innovation Announced",
    "summary": "A groundbreaking technological advancement promises to revolutionize the industry with unprecedented capabilities and efficiency improvements.",
    "content": "In a significant development that could reshape the technology landscape, industry leaders have unveiled a revolutionary innovation that promises to transform how we interact with digital systems. The breakthrough technology demonstrates remarkable efficiency improvements and opens new possibilities for future applications.",
    "source_name": "Tech News Daily",
    "source_url": "https://technewsdaily.com/breaking-innovation",
    "category": "Technology",
    "published_at": "2024-01-15T10:00:00Z",
    "status": "published",
    "featured": true,
    "breaking": true,
    "bias_score": 0.5,
    "credibility_score": 0.9,
    "view_count": 1250,
    "share_count": 89,
    "article_type": "news",
    "image_url": "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800"
  }'

curl -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Global Climate Summit Reaches Historic Agreement",
    "summary": "World leaders unite on comprehensive climate action plan with ambitious targets for carbon reduction and renewable energy adoption.",
    "content": "After days of intense negotiations, representatives from over 190 countries have reached a landmark agreement on climate action. The comprehensive plan includes specific targets for carbon emission reductions, renewable energy adoption, and financial support for developing nations to transition to sustainable practices.",
    "source_name": "Global News Network",
    "source_url": "https://globalnews.com/climate-summit-agreement",
    "category": "Environment",
    "published_at": "2024-01-14T14:30:00Z",
    "status": "published",
    "featured": true,
    "breaking": false,
    "bias_score": 0.4,
    "credibility_score": 0.95,
    "view_count": 2100,
    "share_count": 156,
    "article_type": "news",
    "image_url": "https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800"
  }'

curl -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Economic Markets Show Strong Recovery Signs",
    "summary": "Financial analysts report positive indicators as markets demonstrate resilience and growth potential across multiple sectors.",
    "content": "Recent economic data reveals encouraging trends as markets continue to show signs of robust recovery. Key indicators including employment rates, consumer spending, and business investment have all demonstrated positive momentum, suggesting sustained economic growth in the coming quarters.",
    "source_name": "Financial Times",
    "source_url": "https://financialtimes.com/market-recovery",
    "category": "Business",
    "published_at": "2024-01-13T09:15:00Z",
    "status": "published",
    "featured": false,
    "breaking": false,
    "bias_score": 0.3,
    "credibility_score": 0.88,
    "view_count": 890,
    "share_count": 67,
    "article_type": "analysis",
    "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800"
  }'

curl -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Healthcare Breakthrough: New Treatment Shows Promise",
    "summary": "Medical researchers announce significant progress in treating a previously challenging condition with innovative therapeutic approach.",
    "content": "A team of international researchers has made a significant breakthrough in medical treatment, developing an innovative approach that shows remarkable promise for patients with previously difficult-to-treat conditions. Clinical trials have demonstrated exceptional results with minimal side effects.",
    "source_name": "Medical Journal Today",
    "source_url": "https://medicaljournal.com/breakthrough-treatment",
    "category": "Health",
    "published_at": "2024-01-12T16:45:00Z",
    "status": "published",
    "featured": true,
    "breaking": false,
    "bias_score": 0.2,
    "credibility_score": 0.92,
    "view_count": 1560,
    "share_count": 203,
    "article_type": "news",
    "image_url": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800"
  }'

# Create trending topics
echo "📈 Creating trending topics..."

curl -X POST "$DIRECTUS_URL/items/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Artificial Intelligence",
    "slug": "artificial-intelligence",
    "description": "Latest developments in AI technology and applications",
    "trend_score": 95,
    "article_count": 45,
    "category": "Technology",
    "status": "active",
    "featured": true
  }'

curl -X POST "$DIRECTUS_URL/items/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Climate Change",
    "slug": "climate-change",
    "description": "Environmental news and climate action updates",
    "trend_score": 88,
    "article_count": 32,
    "category": "Environment",
    "status": "active",
    "featured": true
  }'

curl -X POST "$DIRECTUS_URL/items/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Economic Recovery",
    "slug": "economic-recovery",
    "description": "Market trends and economic analysis",
    "trend_score": 76,
    "article_count": 28,
    "category": "Business",
    "status": "active",
    "featured": false
  }'

curl -X POST "$DIRECTUS_URL/items/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Healthcare Innovation",
    "slug": "healthcare-innovation",
    "description": "Medical breakthroughs and health technology",
    "trend_score": 82,
    "article_count": 19,
    "category": "Health",
    "status": "active",
    "featured": true
  }'

echo "✅ Sample data created successfully!"
echo "🔍 Testing API endpoints..."

# Test the endpoints
echo "Testing articles endpoint:"
curl -s "http://localhost:3001/api/cms/articles?limit=2" | head -10

echo -e "\nTesting trending topics endpoint:"
curl -s "http://localhost:3001/api/cms/trending-topics?limit=2" | head -10

echo -e "\n🎉 Articles and trending topics should now display on the frontend!"
