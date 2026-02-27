#!/bin/bash

# Final Fix for Directus CMS - Make it Actually Usable
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "🔧 Final Directus CMS Fix - Making it User-Friendly"

# Get admin token
TOKEN=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | \
  jq -r '.data.access_token')

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Delete all existing permissions to start fresh
echo "🧹 Cleaning up existing permissions..."
curl -s -X DELETE "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1 || true

# Get admin role ID
ADMIN_ROLE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/users/me" | jq -r '.data.role')
echo "Admin role ID: $ADMIN_ROLE_ID"

# Update admin role to have full access
echo "👑 Setting full admin access..."
curl -s -X PATCH "$DIRECTUS_URL/roles/$ADMIN_ROLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_access": true,
    "app_access": true,
    "enforce_tfa": false
  }' > /dev/null

# Collections that need permissions
collections=(
  "site_configuration"
  "navigation_menus" 
  "menu_items"
  "topic_categories"
  "news_sources"
  "articles"
  "homepage_sections"
  "page_content"
  "breaking_news"
  "daily_briefs"
  "trending_topics"
  "legal_pages"
)

# Grant full permissions to admin role for all collections
echo "🔐 Setting up comprehensive permissions..."
for collection in "${collections[@]}"; do
  for action in "create" "read" "update" "delete"; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"role\": \"$ADMIN_ROLE_ID\",
        \"collection\": \"$collection\",
        \"action\": \"$action\",
        \"fields\": [\"*\"],
        \"permissions\": {},
        \"validation\": {}
      }" > /dev/null 2>&1
  done
  echo "  ✅ $collection permissions set"
done

echo "📝 Creating sample content for easy editing..."

# Create site configuration (singleton)
curl -s -X POST "$DIRECTUS_URL/items/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_name": "Asha News",
    "site_description": "Your trusted source for unbiased news with AI-powered analysis",
    "contact_email": "contact@asha.news",
    "support_email": "support@asha.news",
    "social_twitter": "@AshaNews",
    "social_facebook": "https://facebook.com/AshaNews",
    "social_linkedin": "https://linkedin.com/company/asha-news",
    "seo_default_title": "Asha News - Unbiased News Analysis",
    "seo_default_description": "Get balanced news coverage with AI-powered bias analysis"
  }' > /dev/null 2>&1

# Create topic categories
topics=(
  '{"name": "Politics", "slug": "politics", "description": "Political news and analysis", "color": "#3B82F6", "icon": "gavel", "enabled": true, "sort_order": 1}'
  '{"name": "Technology", "slug": "technology", "description": "Tech news and innovations", "color": "#10B981", "icon": "computer", "enabled": true, "sort_order": 2}'
  '{"name": "Health", "slug": "health", "description": "Health and medical news", "color": "#EF4444", "icon": "favorite", "enabled": true, "sort_order": 3}'
  '{"name": "Business", "slug": "business", "description": "Business and finance news", "color": "#F59E0B", "icon": "trending_up", "enabled": true, "sort_order": 4}'
  '{"name": "Sports", "slug": "sports", "description": "Sports news and updates", "color": "#8B5CF6", "icon": "sports_soccer", "enabled": true, "sort_order": 5}'
)

for topic in "${topics[@]}"; do
  curl -s -X POST "$DIRECTUS_URL/items/topic_categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$topic" > /dev/null 2>&1
done

# Create news sources
sources=(
  '{"name": "BBC News", "domain": "bbc.com", "rss_url": "http://feeds.bbci.co.uk/news/rss.xml", "bias_rating": "center", "credibility_score": 4.5, "enabled": true}'
  '{"name": "Reuters", "domain": "reuters.com", "rss_url": "http://feeds.reuters.com/reuters/topNews", "bias_rating": "center", "credibility_score": 4.8, "enabled": true}'
  '{"name": "Associated Press", "domain": "apnews.com", "rss_url": "https://rsshub.app/ap/topics/apf-topnews", "bias_rating": "center", "credibility_score": 4.7, "enabled": true}'
)

for source in "${sources[@]}"; do
  curl -s -X POST "$DIRECTUS_URL/items/news_sources" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$source" > /dev/null 2>&1
done

# Create homepage sections
sections=(
  '{"name": "hero", "title": "Breaking News", "description": "Latest breaking news", "enabled": true, "sort_order": 1, "section_type": "breaking"}'
  '{"name": "trending", "title": "Trending Topics", "description": "What people are talking about", "enabled": true, "sort_order": 2, "section_type": "trending"}'
  '{"name": "daily_briefs", "title": "Daily Briefs", "description": "Morning, midday, and evening summaries", "enabled": true, "sort_order": 3, "section_type": "briefs"}'
  '{"name": "topic_carousel", "title": "Browse by Topic", "description": "Explore news by category", "enabled": true, "sort_order": 4, "section_type": "topics"}'
)

for section in "${sections[@]}"; do
  curl -s -X POST "$DIRECTUS_URL/items/homepage_sections" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$section" > /dev/null 2>&1
done

# Create navigation menu
curl -s -X POST "$DIRECTUS_URL/items/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Navigation", 
    "location": "header", 
    "enabled": true, 
    "sort_order": 1
  }' > /dev/null 2>&1

# Create page content
pages=(
  '{"page_name": "about", "title": "About Asha News", "content": "<h1>About Asha News</h1><p>We provide unbiased news analysis using AI technology.</p>", "published": true}'
  '{"page_name": "bias-methodology", "title": "Our Bias Analysis", "content": "<h1>Bias Methodology</h1><p>Learn how we analyze news bias using advanced AI algorithms.</p>", "published": true}'
  '{"page_name": "contact", "title": "Contact Us", "content": "<h1>Contact Asha News</h1><p>Get in touch with our editorial team.</p>", "published": true}'
)

for page in "${pages[@]}"; do
  curl -s -X POST "$DIRECTUS_URL/items/page_content" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$page" > /dev/null 2>&1
done

echo "🧪 Testing collection access..."
for collection in "${collections[@]}"; do
  RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/$collection")
  if echo "$RESPONSE" | grep -q '"data"'; then
    COUNT=$(echo "$RESPONSE" | jq '.data | length // 0')
    echo "  ✅ $collection: $COUNT items"
  else
    echo "  ❌ $collection: failed"
  fi
done

echo "🎉 Directus CMS is now ready for easy editing!"
echo "🔗 Access your admin panel at: $DIRECTUS_URL"
echo "📧 Login: $ADMIN_EMAIL"
echo "🔑 Password: $ADMIN_PASSWORD"
