#!/bin/bash

# Populate Remaining Collections with Sample Data
# For Asha News Directus CMS

DIRECTUS_URL="http://168.231.111.192:8055"
TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Populating Remaining Collections with Sample Data..."

# 1. Populate Sitemap Entries Collection
echo "🗺️ Adding sample sitemap entries..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "url": "https://asha.news/",
    "priority": 1.0,
    "changefreq": "daily",
    "lastmod": "2024-09-07T22:00:00Z"
  }' "$DIRECTUS_URL/items/sitemap_entries"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "url": "https://asha.news/politics",
    "priority": 0.8,
    "changefreq": "hourly",
    "lastmod": "2024-09-07T21:30:00Z"
  }' "$DIRECTUS_URL/items/sitemap_entries"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "url": "https://asha.news/fact-check",
    "priority": 0.9,
    "changefreq": "daily",
    "lastmod": "2024-09-07T20:15:00Z"
  }' "$DIRECTUS_URL/items/sitemap_entries"

echo "✅ Sitemap entries populated"

# 2. Populate User Subscriptions Collection
echo "📧 Adding sample user subscriptions..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_001",
    "subscription_type": "daily_brief",
    "status": "active",
    "created_at": "2024-09-01T08:00:00Z"
  }' "$DIRECTUS_URL/items/user_subscriptions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_002",
    "subscription_type": "breaking_news",
    "status": "active",
    "created_at": "2024-09-03T14:30:00Z"
  }' "$DIRECTUS_URL/items/user_subscriptions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_003",
    "subscription_type": "premium",
    "status": "paused",
    "created_at": "2024-08-15T10:00:00Z"
  }' "$DIRECTUS_URL/items/user_subscriptions"

echo "✅ User subscriptions populated"

# 3. Populate User Sessions Collection
echo "🔐 Adding sample user sessions..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_001",
    "session_token": "sess_abc123def456ghi789",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "created_at": "2024-09-07T18:00:00Z",
    "expires_at": "2024-09-14T18:00:00Z"
  }' "$DIRECTUS_URL/items/user_sessions"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_002",
    "session_token": "sess_xyz789uvw456rst123",
    "ip_address": "10.0.0.50",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "created_at": "2024-09-07T19:30:00Z",
    "expires_at": "2024-09-14T19:30:00Z"
  }' "$DIRECTUS_URL/items/user_sessions"

echo "✅ User sessions populated"

# 4. Populate Dashboard Widgets Collection
echo "📊 Adding sample dashboard widgets..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Article Views Chart",
    "widget_type": "chart",
    "configuration": {
      "chart_type": "line",
      "data_source": "articles",
      "metric": "views",
      "time_range": "7d"
    },
    "sort_order": 1
  }' "$DIRECTUS_URL/items/dashboard_widgets"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "User Engagement Stats",
    "widget_type": "stats",
    "configuration": {
      "metrics": ["active_users", "page_views", "bounce_rate"],
      "display_format": "cards"
    },
    "sort_order": 2
  }' "$DIRECTUS_URL/items/dashboard_widgets"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Recent Articles Feed",
    "widget_type": "feed",
    "configuration": {
      "source": "articles",
      "limit": 10,
      "sort": "created_at"
    },
    "sort_order": 3
  }' "$DIRECTUS_URL/items/dashboard_widgets"

echo "✅ Dashboard widgets populated"

# 5. Populate User Dashboard Layouts Collection
echo "🎨 Adding sample user dashboard layouts..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_001",
    "layout_config": {
      "widgets": [
        {"id": "1", "position": {"x": 0, "y": 0, "w": 6, "h": 4}},
        {"id": "2", "position": {"x": 6, "y": 0, "w": 6, "h": 2}},
        {"id": "3", "position": {"x": 0, "y": 4, "w": 12, "h": 6}}
      ],
      "theme": "light"
    },
    "updated_at": "2024-09-07T15:30:00Z"
  }' "$DIRECTUS_URL/items/user_dashboard_layouts"

echo "✅ User dashboard layouts populated"

# 6. Populate Reading Statistics Collection
echo "📈 Adding sample reading statistics..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_001",
    "date": "2024-09-07",
    "articles_read": 8,
    "reading_time_minutes": 45,
    "categories_engaged": ["politics", "technology", "climate"]
  }' "$DIRECTUS_URL/items/reading_statistics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_002",
    "date": "2024-09-07",
    "articles_read": 12,
    "reading_time_minutes": 67,
    "categories_engaged": ["business", "health", "science"]
  }' "$DIRECTUS_URL/items/reading_statistics"

echo "✅ Reading statistics populated"

# 7. Populate Bias Reports Collection
echo "⚖️ Adding sample bias reports..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "article_id": "1",
    "bias_score": 0.2,
    "political_leaning": "center",
    "confidence_score": 0.85,
    "analysis_details": {
      "keywords_analyzed": ["policy", "government", "citizens"],
      "sentiment_score": 0.1,
      "source_credibility": 0.9
    },
    "created_at": "2024-09-07T18:30:00Z"
  }' "$DIRECTUS_URL/items/bias_reports"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "article_id": "2",
    "bias_score": -0.4,
    "political_leaning": "center-left",
    "confidence_score": 0.72,
    "analysis_details": {
      "keywords_analyzed": ["progressive", "reform", "social"],
      "sentiment_score": -0.3,
      "source_credibility": 0.8
    },
    "created_at": "2024-09-07T19:15:00Z"
  }' "$DIRECTUS_URL/items/bias_reports"

echo "✅ Bias reports populated"

# 8. Populate Content Moderation Collection
echo "🛡️ Adding sample content moderation entries..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content_type": "article",
    "content_id": "15",
    "status": "approved",
    "moderator_id": "mod_001",
    "reason": "Content meets editorial standards",
    "created_at": "2024-09-07T16:00:00Z"
  }' "$DIRECTUS_URL/items/content_moderation"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content_type": "comment",
    "content_id": "comment_789",
    "status": "flagged",
    "moderator_id": "mod_002",
    "reason": "Contains potentially misleading information, requires fact-checking",
    "created_at": "2024-09-07T20:30:00Z"
  }' "$DIRECTUS_URL/items/content_moderation"

echo "✅ Content moderation populated"

# 9. Populate Email Templates Collection
echo "📧 Adding sample email templates..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Daily Brief Template",
    "subject": "Your Daily News Brief - {{date}}",
    "html_content": "<h1>Daily Brief</h1><p>Here are todays top stories...</p>",
    "text_content": "Daily Brief\n\nHere are todays top stories...",
    "template_type": "daily_brief"
  }' "$DIRECTUS_URL/items/email_templates"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Breaking News Alert",
    "subject": "🚨 Breaking: {{headline}}",
    "html_content": "<h1>Breaking News</h1><p>{{content}}</p>",
    "text_content": "Breaking News\n\n{{content}}",
    "template_type": "breaking_news"
  }' "$DIRECTUS_URL/items/email_templates"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Welcome Email",
    "subject": "Welcome to Asha News!",
    "html_content": "<h1>Welcome!</h1><p>Thank you for joining Asha News...</p>",
    "text_content": "Welcome!\n\nThank you for joining Asha News...",
    "template_type": "welcome"
  }' "$DIRECTUS_URL/items/email_templates"

echo "✅ Email templates populated"

# 10. Populate Search Analytics Collection
echo "🔍 Adding sample search analytics..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "climate change policy",
    "results_count": 24,
    "clicked_result_position": 3,
    "user_id": "user_001",
    "timestamp": "2024-09-07T20:45:00Z"
  }' "$DIRECTUS_URL/items/search_analytics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "election 2024",
    "results_count": 156,
    "clicked_result_position": 1,
    "user_id": "user_002",
    "timestamp": "2024-09-07T21:15:00Z"
  }' "$DIRECTUS_URL/items/search_analytics"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "artificial intelligence news",
    "results_count": 89,
    "clicked_result_position": 2,
    "user_id": "user_003",
    "timestamp": "2024-09-07T21:30:00Z"
  }' "$DIRECTUS_URL/items/search_analytics"

echo "✅ Search analytics populated"

# 11. Populate API Usage Logs Collection
echo "📊 Adding sample API usage logs..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "endpoint": "/api/articles",
    "method": "GET",
    "status_code": 200,
    "response_time_ms": 145,
    "user_id": "user_001",
    "ip_address": "192.168.1.100",
    "timestamp": "2024-09-07T22:00:00Z"
  }' "$DIRECTUS_URL/items/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "endpoint": "/api/search",
    "method": "POST",
    "status_code": 200,
    "response_time_ms": 89,
    "user_id": "user_002",
    "ip_address": "10.0.0.50",
    "timestamp": "2024-09-07T22:15:00Z"
  }' "$DIRECTUS_URL/items/api_usage_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "endpoint": "/api/fact-check",
    "method": "POST",
    "status_code": 201,
    "response_time_ms": 1250,
    "user_id": "user_003",
    "ip_address": "172.16.0.25",
    "timestamp": "2024-09-07T22:30:00Z"
  }' "$DIRECTUS_URL/items/api_usage_logs"

echo "✅ API usage logs populated"

echo ""
echo "🎉 Sample Data Population Complete!"
echo "📊 Populated all 11 remaining collections with sample data:"
echo "   1. ✅ sitemap_entries - 3 sample entries"
echo "   2. ✅ user_subscriptions - 3 sample subscriptions"
echo "   3. ✅ user_sessions - 2 sample sessions"
echo "   4. ✅ dashboard_widgets - 3 sample widgets"
echo "   5. ✅ user_dashboard_layouts - 1 sample layout"
echo "   6. ✅ reading_statistics - 2 sample statistics"
echo "   7. ✅ bias_reports - 2 sample reports"
echo "   8. ✅ content_moderation - 2 sample moderation entries"
echo "   9. ✅ email_templates - 3 sample templates"
echo "   10. ✅ search_analytics - 3 sample search queries"
echo "   11. ✅ api_usage_logs - 3 sample API calls"
echo ""
echo "🔗 View all data at: $DIRECTUS_URL/admin/content"
echo "🧪 All collections now have sample data for testing"
