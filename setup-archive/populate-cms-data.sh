#!/bin/bash

# Populate CMS with sample data for testing
set -e

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Populating CMS with Sample Data ==="

# Get admin token
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"

# Create site configuration
echo "📝 Creating site configuration..."
curl -s -X POST "$DIRECTUS_URL/items/site_configuration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_name": "Asha News",
    "site_description": "Unbiased news aggregation with AI-powered bias analysis",
    "contact_email": "contact@asha.news",
    "support_email": "support@asha.news",
    "social_twitter": "@AshaNews",
    "social_facebook": "https://facebook.com/AshaNews",
    "social_linkedin": "https://linkedin.com/company/asha-news",
    "analytics_ga_id": "GA-XXXXXXXX-X",
    "seo_default_title": "Asha News - Unbiased News Analysis",
    "seo_default_description": "Get unbiased news with AI-powered bias analysis from multiple sources",
    "seo_default_keywords": "news, unbiased, bias analysis, AI, journalism"
  }' > /dev/null

# Create navigation menus
echo "📝 Creating navigation menus..."
HEADER_MENU=$(curl -s -X POST "$DIRECTUS_URL/items/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Header Menu",
    "location": "header",
    "enabled": true,
    "sort_order": 1
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

FOOTER_MENU=$(curl -s -X POST "$DIRECTUS_URL/items/navigation_menus" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Footer Menu",
    "location": "footer",
    "enabled": true,
    "sort_order": 2
  }' | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Create menu items for header
echo "📝 Creating menu items..."
curl -s -X POST "$DIRECTUS_URL/items/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Home\",
    \"url\": \"/\",
    \"icon\": \"home\",
    \"target\": \"_self\",
    \"enabled\": true,
    \"sort_order\": 1,
    \"parent_menu\": \"$HEADER_MENU\"
  }" > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Stories\",
    \"url\": \"/stories\",
    \"icon\": \"article\",
    \"target\": \"_self\",
    \"enabled\": true,
    \"sort_order\": 2,
    \"parent_menu\": \"$HEADER_MENU\"
  }" > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/menu_items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Fact Check\",
    \"url\": \"/fact-check\",
    \"icon\": \"fact_check\",
    \"target\": \"_self\",
    \"enabled\": true,
    \"sort_order\": 3,
    \"parent_menu\": \"$HEADER_MENU\"
  }" > /dev/null

# Create topic categories
echo "📝 Creating topic categories..."
curl -s -X POST "$DIRECTUS_URL/items/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Politics",
    "slug": "politics",
    "description": "Political news and analysis",
    "color": "#3B82F6",
    "icon": "how_to_vote",
    "enabled": true,
    "sort_order": 1,
    "article_count": 0
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Technology",
    "slug": "technology",
    "description": "Technology and innovation news",
    "color": "#10B981",
    "icon": "computer",
    "enabled": true,
    "sort_order": 2,
    "article_count": 0
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/topic_categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Business",
    "slug": "business",
    "description": "Business and economic news",
    "color": "#F59E0B",
    "icon": "business",
    "enabled": true,
    "sort_order": 3,
    "article_count": 0
  }' > /dev/null

# Create enhanced news sources
echo "📝 Creating enhanced news sources..."
curl -s -X POST "$DIRECTUS_URL/items/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reuters",
    "domain": "reuters.com",
    "rss_url": "http://feeds.reuters.com/reuters/topNews",
    "bias_rating": "center",
    "credibility_score": 4.8,
    "factual_accuracy": 4.9,
    "bias_transparency": 4.7,
    "ownership": "Thomson Reuters Corporation",
    "funding": "Subscription and licensing",
    "geographic_coverage": "International",
    "logo_url": "/logos/reuters.png",
    "description": "International news agency with strong factual reporting",
    "enabled": true
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/news_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BBC News",
    "domain": "bbc.com",
    "rss_url": "http://feeds.bbci.co.uk/news/rss.xml",
    "bias_rating": "center",
    "credibility_score": 4.5,
    "factual_accuracy": 4.6,
    "bias_transparency": 4.4,
    "ownership": "British Broadcasting Corporation",
    "funding": "License fees and government funding",
    "geographic_coverage": "International",
    "logo_url": "/logos/bbc.png",
    "description": "British public service broadcaster",
    "enabled": true
  }' > /dev/null

# Create homepage sections
echo "📝 Creating homepage sections..."
curl -s -X POST "$DIRECTUS_URL/items/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "hero_feed",
    "title": "Latest News",
    "description": "Top stories from multiple sources",
    "enabled": true,
    "sort_order": 1,
    "max_articles": 6,
    "section_type": "hero"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/homepage_sections" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "trending_grid",
    "title": "Trending Now",
    "description": "Most popular stories",
    "enabled": true,
    "sort_order": 2,
    "max_articles": 4,
    "section_type": "grid"
  }' > /dev/null

# Create breaking news
echo "📝 Creating breaking news..."
curl -s -X POST "$DIRECTUS_URL/items/breaking_news" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Major Technology Breakthrough Announced",
    "summary": "Scientists announce significant advancement in AI technology",
    "url": "/article/tech-breakthrough-2025",
    "priority": "high",
    "active": true,
    "expires_at": "2025-09-07T00:00:00Z",
    "created_at": "2025-09-06T03:30:00Z"
  }' > /dev/null

# Create trending topics
echo "📝 Creating trending topics..."
curl -s -X POST "$DIRECTUS_URL/items/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Technology",
    "hashtag": "#AITech",
    "description": "Latest developments in artificial intelligence",
    "trend_score": 95.5,
    "article_count": 12,
    "active": true,
    "created_at": "2025-09-06T03:30:00Z"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/trending_topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Climate Change",
    "hashtag": "#ClimateChange",
    "description": "Environmental and climate news",
    "trend_score": 87.2,
    "article_count": 8,
    "active": true,
    "created_at": "2025-09-06T03:25:00Z"
  }' > /dev/null

# Create page content
echo "📝 Creating page content..."
curl -s -X POST "$DIRECTUS_URL/items/page_content" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page_name": "about",
    "title": "About Asha News",
    "content": "<h1>About Asha News</h1><p>Asha News is dedicated to providing unbiased news analysis using advanced AI technology to detect and highlight bias across multiple news sources.</p>",
    "meta_title": "About Asha News - Unbiased AI-Powered News Analysis",
    "meta_description": "Learn about Asha News mission to provide unbiased news analysis using AI technology",
    "meta_keywords": "about, asha news, unbiased news, AI analysis",
    "published": true,
    "last_updated": "2025-09-06T03:30:00Z"
  }' > /dev/null

# Create legal pages
echo "📝 Creating legal pages..."
curl -s -X POST "$DIRECTUS_URL/items/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Privacy Policy",
    "slug": "privacy",
    "content": "<h1>Privacy Policy</h1><p>This privacy policy explains how Asha News collects, uses, and protects your personal information.</p>",
    "last_updated": "2025-09-06T03:30:00Z",
    "version": "1.0",
    "published": true
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/legal_pages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Terms of Service",
    "slug": "terms",
    "content": "<h1>Terms of Service</h1><p>These terms govern your use of the Asha News platform and services.</p>",
    "last_updated": "2025-09-06T03:30:00Z",
    "version": "1.0",
    "published": true
  }' > /dev/null

# Create RSS sources
echo "📝 Creating RSS sources..."
curl -s -X POST "$DIRECTUS_URL/items/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reuters Top News",
    "url": "http://feeds.reuters.com/reuters/topNews",
    "category": "general",
    "enabled": true,
    "fetch_frequency": 15,
    "last_fetched": null,
    "article_count": 0,
    "error_count": 0,
    "description": "Reuters main news feed"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BBC World News",
    "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
    "category": "world",
    "enabled": true,
    "fetch_frequency": 20,
    "last_fetched": null,
    "article_count": 0,
    "error_count": 0,
    "description": "BBC world news RSS feed"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/rss_sources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechCrunch",
    "url": "http://feeds.feedburner.com/TechCrunch",
    "category": "technology",
    "enabled": true,
    "fetch_frequency": 30,
    "last_fetched": null,
    "article_count": 0,
    "error_count": 0,
    "description": "Technology news and startup coverage"
  }' > /dev/null

# Create feature flags
echo "📝 Creating feature flags..."
curl -s -X POST "$DIRECTUS_URL/items/feature_flags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "bias_analysis",
    "description": "Enable AI bias analysis for articles",
    "enabled": true,
    "environment": "production",
    "rollout_percentage": 100,
    "created_at": "2025-09-06T03:30:00Z"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/feature_flags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fact_checking",
    "description": "Enable fact checking integration",
    "enabled": true,
    "environment": "production",
    "rollout_percentage": 80,
    "created_at": "2025-09-06T03:30:00Z"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/feature_flags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "user_comments",
    "description": "Enable user comments on articles",
    "enabled": false,
    "environment": "development",
    "rollout_percentage": 0,
    "created_at": "2025-09-06T03:30:00Z"
  }' > /dev/null

# Create global settings
echo "📝 Creating global settings..."
curl -s -X POST "$DIRECTUS_URL/items/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "articles_per_page",
    "setting_value": "20",
    "setting_type": "number",
    "description": "Number of articles to display per page",
    "category": "display",
    "environment": "production"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "bias_threshold",
    "setting_value": "0.7",
    "setting_type": "number",
    "description": "Minimum bias score to flag articles",
    "category": "analysis",
    "environment": "production"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/global_settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "setting_key": "cache_duration",
    "setting_value": "300",
    "setting_type": "number",
    "description": "Cache duration in seconds",
    "category": "performance",
    "environment": "production"
  }' > /dev/null

# Create daily briefs
echo "📝 Creating daily briefs..."
curl -s -X POST "$DIRECTUS_URL/items/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Brief - September 7, 2025",
    "summary": "Key stories from overnight: Technology breakthrough, climate summit updates, and market analysis",
    "content": "<h2>Top Stories</h2><ul><li>AI breakthrough announced by major tech companies</li><li>Climate summit reaches key agreements</li><li>Markets respond positively to economic indicators</li></ul>",
    "brief_date": "2025-09-07",
    "brief_type": "morning",
    "published": true,
    "article_count": 5,
    "created_at": "2025-09-07T06:00:00Z"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/daily_briefs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Evening Brief - September 6, 2025",
    "summary": "End of day wrap-up: Political developments, business news, and international updates",
    "content": "<h2>Evening Highlights</h2><ul><li>Political negotiations continue on key legislation</li><li>Business earnings exceed expectations</li><li>International trade discussions progress</li></ul>",
    "brief_date": "2025-09-06",
    "brief_type": "evening",
    "published": true,
    "article_count": 7,
    "created_at": "2025-09-06T18:00:00Z"
  }' > /dev/null

# Create sample articles
echo "📝 Creating sample articles..."
curl -s -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Technology Breakthrough Promises Revolutionary Changes",
    "slug": "ai-technology-breakthrough-2025",
    "summary": "Major technology companies announce significant advancement in artificial intelligence capabilities",
    "content": "<p>In a groundbreaking announcement, leading technology companies have revealed a major breakthrough in artificial intelligence that promises to revolutionize multiple industries.</p><p>The advancement focuses on improved natural language processing and reasoning capabilities, with potential applications in healthcare, education, and scientific research.</p>",
    "author": "Tech Reporter",
    "source_url": "https://example.com/ai-breakthrough",
    "source_name": "Reuters",
    "published_at": "2025-09-07T08:00:00Z",
    "bias_score": 0.2,
    "bias_analysis": "Neutral reporting with factual presentation",
    "credibility_score": 4.8,
    "fact_check_status": "verified",
    "category": "technology",
    "tags": ["AI", "technology", "innovation"],
    "view_count": 1250,
    "share_count": 89,
    "status": "published",
    "featured": true
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Climate Summit Reaches Historic Agreement on Emissions",
    "slug": "climate-summit-agreement-2025",
    "summary": "International climate summit concludes with unprecedented agreement on emission reduction targets",
    "content": "<p>World leaders at the international climate summit have reached a historic agreement on ambitious emission reduction targets for the next decade.</p><p>The agreement includes specific commitments from major economies and establishes new funding mechanisms for developing nations to transition to clean energy.</p>",
    "author": "Environmental Correspondent",
    "source_url": "https://example.com/climate-agreement",
    "source_name": "BBC News",
    "published_at": "2025-09-07T10:30:00Z",
    "bias_score": 0.1,
    "bias_analysis": "Balanced coverage of international agreement",
    "credibility_score": 4.6,
    "fact_check_status": "verified",
    "category": "environment",
    "tags": ["climate", "environment", "politics"],
    "view_count": 892,
    "share_count": 156,
    "status": "published",
    "featured": false
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/articles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Global Markets Show Strong Performance Amid Economic Optimism",
    "slug": "global-markets-performance-2025",
    "summary": "Stock markets worldwide post gains as economic indicators point to sustained growth",
    "content": "<p>Global financial markets have shown robust performance this week, with major indices posting significant gains across multiple regions.</p><p>Economic analysts point to strong employment data, controlled inflation, and positive corporate earnings as key drivers of market optimism.</p>",
    "author": "Financial Reporter",
    "source_url": "https://example.com/market-performance",
    "source_name": "Reuters",
    "published_at": "2025-09-07T14:15:00Z",
    "bias_score": 0.3,
    "bias_analysis": "Slightly optimistic tone but factually accurate",
    "credibility_score": 4.7,
    "fact_check_status": "verified",
    "category": "business",
    "tags": ["markets", "economy", "finance"],
    "view_count": 634,
    "share_count": 42,
    "status": "published",
    "featured": false
  }' > /dev/null

# Create user feedback samples
echo "📝 Creating user feedback samples..."
curl -s -X POST "$DIRECTUS_URL/items/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah@example.com",
    "subject": "Love the bias analysis feature",
    "message": "The AI bias analysis is incredibly helpful for understanding different perspectives on news stories. Keep up the great work!",
    "category": "general",
    "status": "new"
  }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/user_feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mike Chen",
    "email": "mike@example.com",
    "subject": "Mobile app suggestion",
    "message": "Would love to see a mobile app version of Asha News for easier reading on the go.",
    "category": "feature",
    "status": "review"
  }' > /dev/null

echo "✅ Comprehensive sample data created successfully!"
echo "📊 Collections populated:"
echo "   • Site Configuration: 1 item"
echo "   • Navigation Menus: 2 items"
echo "   • Menu Items: 3 items"
echo "   • Topic Categories: 3 items"
echo "   • News Sources: 2 items"
echo "   • RSS Sources: 3 items"
echo "   • Feature Flags: 3 items"
echo "   • Global Settings: 3 items"
echo "   • Homepage Sections: 2 items"
echo "   • Breaking News: 1 item"
echo "   • Daily Briefs: 2 items"
echo "   • Trending Topics: 2 items"
echo "   • Page Content: 1 item"
echo "   • Legal Pages: 2 items"
echo "   • Articles: 3 items"
echo "   • User Feedback: 2 items"
echo ""
echo "🎉 Asha News CMS is now fully populated and ready!"
echo "🔗 Admin Panel: $DIRECTUS_URL/admin/content"
