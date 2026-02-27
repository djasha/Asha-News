#!/bin/bash

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "📊 Populating Sample Data for Empty Collections..."
echo "============================================================"

# === TAGS ===
echo "🏷️ Adding sample tags..."
curl -s -X POST "$DIRECTUS_URL/items/tags" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Technology",
        "slug": "technology",
        "description": "Technology and innovation news",
        "color": "#3B82F6",
        "usage_count": 45,
        "trending": true,
        "status": "active"
    }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/tags" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Politics",
        "slug": "politics",
        "description": "Political news and analysis",
        "color": "#EF4444",
        "usage_count": 38,
        "trending": true,
        "status": "active"
    }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/tags" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Climate",
        "slug": "climate",
        "description": "Climate change and environment",
        "color": "#10B981",
        "usage_count": 22,
        "trending": false,
        "status": "active"
    }' > /dev/null

echo "✅ Added 3 sample tags"

# === ARTICLE SERIES ===
echo "📚 Adding sample article series..."
curl -s -X POST "$DIRECTUS_URL/items/article_series" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "AI Revolution 2024",
        "slug": "ai-revolution-2024",
        "description": "A comprehensive look at how AI is transforming industries in 2024",
        "total_parts": 5,
        "published_parts": 3,
        "series_type": "investigative",
        "status": "published",
        "featured": true
    }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/article_series" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Election Coverage 2024",
        "slug": "election-coverage-2024",
        "description": "Complete coverage of the 2024 election cycle",
        "total_parts": 12,
        "published_parts": 8,
        "series_type": "news",
        "status": "published",
        "featured": false
    }' > /dev/null

echo "✅ Added 2 sample article series"

# === DASHBOARD WIDGETS ===
echo "📊 Adding sample dashboard widgets..."
curl -s -X POST "$DIRECTUS_URL/items/dashboard_widgets" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "News Feed",
        "type": "news_feed",
        "description": "Latest news articles personalized for you",
        "component_name": "NewsFeedWidget",
        "default_config": {"limit": 10, "categories": ["all"]},
        "user_configurable": true,
        "subscription_required": "free",
        "sort_order": 1,
        "status": "active"
    }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/dashboard_widgets" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Bias Analysis",
        "type": "bias_analysis",
        "description": "Your reading bias breakdown and recommendations",
        "component_name": "BiasAnalysisWidget",
        "default_config": {"timeframe": "week", "showRecommendations": true},
        "user_configurable": true,
        "subscription_required": "premium",
        "sort_order": 2,
        "status": "active"
    }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/dashboard_widgets" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Reading Statistics",
        "type": "reading_stats",
        "description": "Track your daily reading habits and progress",
        "component_name": "ReadingStatsWidget",
        "default_config": {"showStreak": true, "showGoals": true},
        "user_configurable": true,
        "subscription_required": "free",
        "sort_order": 3,
        "status": "active"
    }' > /dev/null

echo "✅ Added 3 sample dashboard widgets"

# === USER PREFERENCES ===
echo "👤 Adding sample user preferences..."
curl -s -X POST "$DIRECTUS_URL/items/user_preferences" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "preferred_topics": ["technology", "science", "business"],
        "bias_preference": "balanced",
        "reading_level": "advanced",
        "notification_frequency": "daily",
        "email_notifications": true,
        "push_notifications": false,
        "theme": "light",
        "language": "en",
        "timezone": "UTC",
        "articles_per_page": 20,
        "auto_play_videos": false,
        "show_bias_indicators": true,
        "fact_check_alerts": true,
        "personalized_feed": true,
        "data_sharing_consent": true
    }' > /dev/null

echo "✅ Added sample user preferences"

# === SITEMAP ENTRIES ===
echo "🗺️ Adding sample sitemap entries..."
curl -s -X POST "$DIRECTUS_URL/items/sitemap_entries" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "/",
        "title": "Asha News - Unbiased News Analysis",
        "description": "Get balanced news coverage with AI-powered bias analysis",
        "priority": 1.0,
        "change_frequency": "daily",
        "last_modified": "2024-01-15T00:00:00Z",
        "status": "active",
        "content_type": "page"
    }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/sitemap_entries" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "/fact-check",
        "title": "Fact Check - Verify Claims and Information",
        "description": "Professional fact-checking tools and database",
        "priority": 0.8,
        "change_frequency": "weekly",
        "last_modified": "2024-01-15T00:00:00Z",
        "status": "active",
        "content_type": "page"
    }' > /dev/null

echo "✅ Added 2 sample sitemap entries"

# === EMAIL TEMPLATES ===
echo "📧 Adding sample email templates..."
curl -s -X POST "$DIRECTUS_URL/items/email_templates" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "template_name": "Welcome Email",
        "template_key": "welcome_new_user",
        "subject": "Welcome to Asha News - Your Unbiased News Source",
        "html_content": "<h1>Welcome to Asha News!</h1><p>Thank you for joining our community of informed readers.</p>",
        "text_content": "Welcome to Asha News! Thank you for joining our community of informed readers.",
        "template_variables": {"user_name": "string", "verification_link": "url"},
        "category": "welcome",
        "status": "active"
    }' > /dev/null

curl -s -X POST "$DIRECTUS_URL/items/email_templates" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "template_name": "Daily Newsletter",
        "template_key": "daily_newsletter",
        "subject": "Your Daily News Briefing - {{date}}",
        "html_content": "<h2>Today'\''s Top Stories</h2><p>Here are the most important stories from today.</p>",
        "text_content": "Today'\''s Top Stories - Here are the most important stories from today.",
        "template_variables": {"date": "string", "articles": "array", "user_name": "string"},
        "category": "newsletter",
        "status": "active"
    }' > /dev/null

echo "✅ Added 2 sample email templates"

# === BIAS REPORTS ===
echo "📊 Adding sample bias report..."
curl -s -X POST "$DIRECTUS_URL/items/bias_reports" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "report_title": "Weekly Bias Analysis - January 2024",
        "report_type": "weekly",
        "date_range_start": "2024-01-08",
        "date_range_end": "2024-01-14",
        "total_articles_analyzed": 247,
        "bias_distribution": {"left": 0.32, "center": 0.41, "right": 0.27},
        "source_breakdown": {"cnn": 0.15, "bbc": 0.20, "reuters": 0.18},
        "topic_breakdown": {"politics": 0.35, "technology": 0.25, "health": 0.15},
        "key_insights": "This week showed a balanced distribution across the political spectrum with technology coverage increasing.",
        "recommendations": "Consider adding more diverse sources for health coverage.",
        "generated_by": "AI Analysis System",
        "status": "published"
    }' > /dev/null

echo "✅ Added sample bias report"

echo ""
echo "🎉 Sample Data Population Complete!"
echo "📊 Populated: tags (3), article_series (2), dashboard_widgets (3), user_preferences (1), sitemap_entries (2), email_templates (2), bias_reports (1)"
echo "🔗 View at: $DIRECTUS_URL/admin/content"
