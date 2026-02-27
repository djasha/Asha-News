#!/bin/bash

# Populate Missing Collections with Sample Data
# For Asha News Directus CMS

DIRECTUS_URL="http://168.231.111.192:8055"
TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Populating Missing Collections with Sample Data..."

# 1. Populate Tags Collection
echo "🏷️ Adding sample tags..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Breaking News",
    "slug": "breaking-news",
    "color": "#F44336",
    "description": "Urgent and developing news stories",
    "sort_order": 1
  }' "$DIRECTUS_URL/items/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Politics",
    "slug": "politics",
    "color": "#2196F3",
    "description": "Political news and analysis",
    "sort_order": 2
  }' "$DIRECTUS_URL/items/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Technology",
    "slug": "technology",
    "color": "#4CAF50",
    "description": "Tech industry news and innovations",
    "sort_order": 3
  }' "$DIRECTUS_URL/items/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Business",
    "slug": "business",
    "color": "#FF9800",
    "description": "Business and economic news",
    "sort_order": 4
  }' "$DIRECTUS_URL/items/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Health",
    "slug": "health",
    "color": "#9C27B0",
    "description": "Health and medical news",
    "sort_order": 5
  }' "$DIRECTUS_URL/items/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Science",
    "slug": "science",
    "color": "#00BCD4",
    "description": "Scientific discoveries and research",
    "sort_order": 6
  }' "$DIRECTUS_URL/items/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Climate",
    "slug": "climate",
    "color": "#8BC34A",
    "description": "Climate change and environmental news",
    "sort_order": 7
  }' "$DIRECTUS_URL/items/tags"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "International",
    "slug": "international",
    "color": "#607D8B",
    "description": "Global and international news",
    "sort_order": 8
  }' "$DIRECTUS_URL/items/tags"

echo "✅ Tags populated"

# 2. Populate Article Series Collection
echo "📚 Adding sample article series..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "2024 Election Deep Dive",
    "slug": "2024-election-deep-dive",
    "description": "Comprehensive coverage of the 2024 election cycle",
    "status": "active",
    "total_parts": 12,
    "published_parts": 8,
    "featured_image": null,
    "start_date": "2024-01-15",
    "estimated_end_date": "2024-11-15"
  }' "$DIRECTUS_URL/items/article_series"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "AI Revolution: Impact on Society",
    "slug": "ai-revolution-impact",
    "description": "Exploring how artificial intelligence is transforming various sectors",
    "status": "active",
    "total_parts": 6,
    "published_parts": 4,
    "featured_image": null,
    "start_date": "2024-03-01",
    "estimated_end_date": "2024-06-01"
  }' "$DIRECTUS_URL/items/article_series"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Climate Crisis Solutions",
    "slug": "climate-crisis-solutions",
    "description": "Investigating innovative approaches to addressing climate change",
    "status": "planning",
    "total_parts": 8,
    "published_parts": 0,
    "featured_image": null,
    "start_date": "2024-06-01",
    "estimated_end_date": "2024-09-01"
  }' "$DIRECTUS_URL/items/article_series"

echo "✅ Article Series populated"

# 3. Populate User Activity Collection
echo "👥 Adding sample user activity..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_001",
    "action": "article_view",
    "target_type": "article",
    "target_id": "1",
    "metadata": {
      "reading_time": 120,
      "scroll_depth": 85,
      "source": "homepage"
    },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "timestamp": "2024-09-07T18:30:00Z"
  }' "$DIRECTUS_URL/items/user_activity"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_002",
    "action": "article_share",
    "target_type": "article",
    "target_id": "2",
    "metadata": {
      "platform": "twitter",
      "engagement_type": "share"
    },
    "ip_address": "10.0.0.50",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    "timestamp": "2024-09-07T19:15:00Z"
  }' "$DIRECTUS_URL/items/user_activity"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "user_003",
    "action": "search",
    "target_type": "search_query",
    "target_id": null,
    "metadata": {
      "query": "climate change policy",
      "results_count": 24,
      "clicked_result": 3
    },
    "ip_address": "172.16.0.25",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "timestamp": "2024-09-07T20:45:00Z"
  }' "$DIRECTUS_URL/items/user_activity"

echo "✅ User Activity populated"

# 4. Populate AI Analysis Logs Collection
echo "🤖 Adding sample AI analysis logs..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "article_id": "1",
    "analysis_type": "bias_detection",
    "ai_model": "gpt-4",
    "input_data": {
      "title": "AI Technology Breakthrough Promises Revolutionary Changes",
      "content": "In a groundbreaking announcement, leading technology companies..."
    },
    "output_data": {
      "bias_score": 0.3,
      "political_leaning": "center",
      "confidence": 0.85,
      "reasoning": "Article presents factual information with minimal bias indicators"
    },
    "processing_time_ms": 1250,
    "status": "completed",
    "error_message": null,
    "created_at": "2024-09-07T18:30:15Z"
  }' "$DIRECTUS_URL/items/ai_analysis_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "article_id": "2",
    "analysis_type": "fact_check",
    "ai_model": "gpt-4",
    "input_data": {
      "title": "Climate Summit Reaches Historic Agreement",
      "content": "World leaders at the international climate summit..."
    },
    "output_data": {
      "credibility_score": 0.92,
      "fact_check_status": "verified",
      "sources_verified": 8,
      "claims_analyzed": 12
    },
    "processing_time_ms": 2100,
    "status": "completed",
    "error_message": null,
    "created_at": "2024-09-07T19:20:30Z"
  }' "$DIRECTUS_URL/items/ai_analysis_logs"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "article_id": "3",
    "analysis_type": "breaking_news_detection",
    "ai_model": "keyword_algorithm",
    "input_data": {
      "title": "URGENT: Breaking News Alert - Major Development",
      "content": "This is a test article to verify breaking news detection..."
    },
    "output_data": {
      "breaking_score": 18,
      "keywords_matched": ["breaking", "urgent", "alert"],
      "recommendation": "PROMOTE_TO_BREAKING"
    },
    "processing_time_ms": 45,
    "status": "completed",
    "error_message": null,
    "created_at": "2024-09-07T22:29:30Z"
  }' "$DIRECTUS_URL/items/ai_analysis_logs"

echo "✅ AI Analysis Logs populated"

# 5. Populate Notification Queue Collection
echo "🔔 Adding sample notifications..."

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "breaking_news",
    "recipient_type": "all_users",
    "recipient_id": null,
    "title": "Breaking: Major Earthquake Strikes Region",
    "message": "A devastating earthquake has struck, emergency response teams deployed",
    "data": {
      "article_id": "12",
      "urgency": "high",
      "category": "emergency"
    },
    "channels": ["push", "email", "sms"],
    "status": "sent",
    "scheduled_at": "2024-09-07T22:30:00Z",
    "sent_at": "2024-09-07T22:30:05Z",
    "delivery_stats": {
      "push_sent": 15420,
      "push_delivered": 14890,
      "email_sent": 8750,
      "email_opened": 3200
    }
  }' "$DIRECTUS_URL/items/notification_queue"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "daily_brief",
    "recipient_type": "subscribers",
    "recipient_id": null,
    "title": "Your Daily News Brief - September 7, 2024",
    "message": "Top stories from today including politics, technology, and climate news",
    "data": {
      "brief_id": "daily_2024_09_07",
      "article_count": 12,
      "categories": ["politics", "technology", "climate"]
    },
    "channels": ["email"],
    "status": "scheduled",
    "scheduled_at": "2024-09-08T06:00:00Z",
    "sent_at": null,
    "delivery_stats": null
  }' "$DIRECTUS_URL/items/notification_queue"

curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "article_recommendation",
    "recipient_type": "user",
    "recipient_id": "user_001",
    "title": "Articles You Might Like",
    "message": "Based on your reading history, we found 3 articles that match your interests",
    "data": {
      "recommended_articles": ["5", "8", "11"],
      "recommendation_reason": "similar_topics",
      "user_interests": ["technology", "ai", "innovation"]
    },
    "channels": ["push", "in_app"],
    "status": "pending",
    "scheduled_at": "2024-09-08T09:00:00Z",
    "sent_at": null,
    "delivery_stats": null
  }' "$DIRECTUS_URL/items/notification_queue"

echo "✅ Notification Queue populated"

echo ""
echo "🎉 Sample Data Population Complete!"
echo "📊 Populated collections with sample data:"
echo "   1. ✅ tags - 8 sample tags (Breaking News, Politics, Technology, etc.)"
echo "   2. ✅ article_series - 3 sample series (Election, AI Revolution, Climate)"
echo "   3. ✅ user_activity - 3 sample activities (view, share, search)"
echo "   4. ✅ ai_analysis_logs - 3 sample AI analyses (bias, fact-check, breaking news)"
echo "   5. ✅ notification_queue - 3 sample notifications (breaking, daily brief, recommendations)"
echo ""
echo "🔗 View data at: $DIRECTUS_URL/admin/content"
echo "🧪 Test API endpoints:"
echo "   GET $DIRECTUS_URL/items/tags"
echo "   GET $DIRECTUS_URL/items/article_series"
echo "   GET $DIRECTUS_URL/items/user_activity"
echo "   GET $DIRECTUS_URL/items/ai_analysis_logs"
echo "   GET $DIRECTUS_URL/items/notification_queue"
