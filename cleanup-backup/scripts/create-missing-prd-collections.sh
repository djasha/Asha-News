#!/bin/bash

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Creating Missing PRD Collections..."
echo "============================================================"

# Function to add field to collection
add_field() {
    local collection="$1"
    local field_name="$2"
    local field_type="$3"
    local field_meta="$4"
    local field_schema="$5"
    
    curl -s -X POST "$DIRECTUS_URL/fields/$collection" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"field\": \"$field_name\",
            \"type\": \"$field_type\",
            \"meta\": $field_meta,
            \"schema\": $field_schema
        }" > /dev/null
}

# === 1. AI ANALYSIS LOGS ===
echo "🤖 Creating ai_analysis_logs collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "ai_analysis_logs",
        "meta": {
            "icon": "psychology",
            "note": "AI processing and analysis logs",
            "display_template": "{{article_id}} - {{analysis_type}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "created_at"
        },
        "schema": {
            "name": "ai_analysis_logs"
        }
    }' > /dev/null

add_field "ai_analysis_logs" "id" "uuid" '{"interface": "input", "readonly": true, "hidden": true}' '{"is_primary_key": true}'
add_field "ai_analysis_logs" "article_id" "uuid" '{"interface": "input", "width": "half"}' '{}'
add_field "ai_analysis_logs" "analysis_type" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Bias Analysis", "value": "bias"}, {"text": "Fact Check", "value": "fact_check"}, {"text": "Sentiment", "value": "sentiment"}, {"text": "Topic Classification", "value": "topic"}]}, "width": "half"}' '{}'
add_field "ai_analysis_logs" "ai_model" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "ai_analysis_logs" "processing_time_ms" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "ai_analysis_logs" "input_data" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "ai_analysis_logs" "output_data" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "ai_analysis_logs" "confidence_score" "decimal" '{"interface": "slider", "options": {"min": 0, "max": 1, "step": 0.01}, "width": "half"}' '{"precision": 3, "scale": 2}'
add_field "ai_analysis_logs" "status" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Success", "value": "success"}, {"text": "Failed", "value": "failed"}, {"text": "Pending", "value": "pending"}]}, "width": "half"}' '{}'
add_field "ai_analysis_logs" "error_message" "text" '{"interface": "input-multiline", "width": "full"}' '{}'
add_field "ai_analysis_logs" "created_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}' '{}'

echo "✅ AI Analysis Logs collection created"

# === 2. BIAS REPORTS ===
echo "📊 Creating bias_reports collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "bias_reports",
        "meta": {
            "icon": "analytics",
            "note": "Bias analysis reports and metrics",
            "display_template": "{{report_title}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "created_at"
        },
        "schema": {
            "name": "bias_reports"
        }
    }' > /dev/null

add_field "bias_reports" "id" "uuid" '{"interface": "input", "readonly": true, "hidden": true}' '{"is_primary_key": true}'
add_field "bias_reports" "report_title" "string" '{"interface": "input", "required": true, "width": "full"}' '{}'
add_field "bias_reports" "report_type" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Daily Summary", "value": "daily"}, {"text": "Weekly Analysis", "value": "weekly"}, {"text": "Source Analysis", "value": "source"}, {"text": "Topic Analysis", "value": "topic"}]}, "width": "half"}' '{}'
add_field "bias_reports" "date_range_start" "date" '{"interface": "datetime", "width": "half"}' '{}'
add_field "bias_reports" "date_range_end" "date" '{"interface": "datetime", "width": "half"}' '{}'
add_field "bias_reports" "total_articles_analyzed" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "bias_reports" "bias_distribution" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "bias_reports" "source_breakdown" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "bias_reports" "topic_breakdown" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "bias_reports" "key_insights" "text" '{"interface": "input-rich-text-html", "width": "full"}' '{}'
add_field "bias_reports" "recommendations" "text" '{"interface": "input-rich-text-html", "width": "full"}' '{}'
add_field "bias_reports" "generated_by" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "bias_reports" "status" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Draft", "value": "draft"}, {"text": "Published", "value": "published"}, {"text": "Archived", "value": "archived"}]}, "width": "half"}' '{}'
add_field "bias_reports" "created_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}' '{}'

echo "✅ Bias Reports collection created"

# === 3. CONTENT MODERATION ===
echo "🛡️ Creating content_moderation collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "content_moderation",
        "meta": {
            "icon": "shield",
            "note": "Content moderation workflow and decisions",
            "display_template": "{{content_type}} - {{status}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "created_at"
        },
        "schema": {
            "name": "content_moderation"
        }
    }' > /dev/null

add_field "content_moderation" "id" "uuid" '{"interface": "input", "readonly": true, "hidden": true}' '{"is_primary_key": true}'
add_field "content_moderation" "content_type" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Article", "value": "article"}, {"text": "Comment", "value": "comment"}, {"text": "User Profile", "value": "user"}, {"text": "Image", "value": "image"}]}, "width": "half"}' '{}'
add_field "content_moderation" "content_id" "uuid" '{"interface": "input", "width": "half"}' '{}'
add_field "content_moderation" "moderation_reason" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Spam", "value": "spam"}, {"text": "Inappropriate Content", "value": "inappropriate"}, {"text": "Misinformation", "value": "misinformation"}, {"text": "Copyright", "value": "copyright"}, {"text": "Other", "value": "other"}]}, "width": "half"}' '{}'
add_field "content_moderation" "status" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Pending", "value": "pending"}, {"text": "Approved", "value": "approved"}, {"text": "Rejected", "value": "rejected"}, {"text": "Flagged", "value": "flagged"}]}, "width": "half"}' '{}'
add_field "content_moderation" "moderator_id" "uuid" '{"interface": "input", "width": "half"}' '{}'
add_field "content_moderation" "moderation_notes" "text" '{"interface": "input-multiline", "width": "full"}' '{}'
add_field "content_moderation" "auto_flagged" "boolean" '{"interface": "boolean", "width": "half"}' '{}'
add_field "content_moderation" "severity_level" "integer" '{"interface": "slider", "options": {"min": 1, "max": 5}, "width": "half"}' '{}'
add_field "content_moderation" "action_taken" "string" '{"interface": "input", "width": "full"}' '{}'
add_field "content_moderation" "created_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}' '{}'
add_field "content_moderation" "resolved_at" "timestamp" '{"interface": "datetime", "width": "half"}' '{}'

echo "✅ Content Moderation collection created"

# === 4. EMAIL TEMPLATES ===
echo "📧 Creating email_templates collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "email_templates",
        "meta": {
            "icon": "email",
            "note": "Email template management",
            "display_template": "{{template_name}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "template_name"
        },
        "schema": {
            "name": "email_templates"
        }
    }' > /dev/null

add_field "email_templates" "id" "uuid" '{"interface": "input", "readonly": true, "hidden": true}' '{"is_primary_key": true}'
add_field "email_templates" "template_name" "string" '{"interface": "input", "required": true, "width": "half"}' '{}'
add_field "email_templates" "template_key" "string" '{"interface": "input", "required": true, "width": "half"}' '{}'
add_field "email_templates" "subject" "string" '{"interface": "input", "width": "full"}' '{}'
add_field "email_templates" "html_content" "text" '{"interface": "input-rich-text-html", "width": "full"}' '{}'
add_field "email_templates" "text_content" "text" '{"interface": "input-multiline", "width": "full"}' '{}'
add_field "email_templates" "template_variables" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "email_templates" "category" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Welcome", "value": "welcome"}, {"text": "Newsletter", "value": "newsletter"}, {"text": "Notification", "value": "notification"}, {"text": "Marketing", "value": "marketing"}]}, "width": "half"}' '{}'
add_field "email_templates" "status" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Active", "value": "active"}, {"text": "Draft", "value": "draft"}, {"text": "Archived", "value": "archived"}]}, "width": "half"}' '{}'
add_field "email_templates" "created_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}' '{}'
add_field "email_templates" "updated_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-updated"]}' '{}'

echo "✅ Email Templates collection created"

# === 5. NOTIFICATION QUEUE ===
echo "🔔 Creating notification_queue collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "notification_queue",
        "meta": {
            "icon": "notifications",
            "note": "Notification queue and delivery tracking",
            "display_template": "{{notification_type}} - {{status}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "created_at"
        },
        "schema": {
            "name": "notification_queue"
        }
    }' > /dev/null

add_field "notification_queue" "id" "uuid" '{"interface": "input", "readonly": true, "hidden": true}' '{"is_primary_key": true}'
add_field "notification_queue" "user_id" "uuid" '{"interface": "input", "width": "half"}' '{}'
add_field "notification_queue" "notification_type" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Email", "value": "email"}, {"text": "Push", "value": "push"}, {"text": "SMS", "value": "sms"}, {"text": "In-App", "value": "in_app"}]}, "width": "half"}' '{}'
add_field "notification_queue" "title" "string" '{"interface": "input", "width": "full"}' '{}'
add_field "notification_queue" "message" "text" '{"interface": "input-multiline", "width": "full"}' '{}'
add_field "notification_queue" "data" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "notification_queue" "status" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Pending", "value": "pending"}, {"text": "Sent", "value": "sent"}, {"text": "Failed", "value": "failed"}, {"text": "Cancelled", "value": "cancelled"}]}, "width": "half"}' '{}'
add_field "notification_queue" "scheduled_at" "timestamp" '{"interface": "datetime", "width": "half"}' '{}'
add_field "notification_queue" "sent_at" "timestamp" '{"interface": "datetime", "width": "half"}' '{}'
add_field "notification_queue" "attempts" "integer" '{"interface": "input", "width": "half"}' '{"default_value": 0}'
add_field "notification_queue" "error_message" "text" '{"interface": "input-multiline", "width": "full"}' '{}'
add_field "notification_queue" "created_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}' '{}'

echo "✅ Notification Queue collection created"

# === 6. SEARCH ANALYTICS ===
echo "🔍 Creating search_analytics collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "search_analytics",
        "meta": {
            "icon": "search",
            "note": "Search behavior tracking and analytics",
            "display_template": "{{search_query}} - {{result_count}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "created_at"
        },
        "schema": {
            "name": "search_analytics"
        }
    }' > /dev/null

add_field "search_analytics" "id" "uuid" '{"interface": "input", "readonly": true, "hidden": true}' '{"is_primary_key": true}'
add_field "search_analytics" "user_id" "uuid" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "search_query" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "search_type" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "Articles", "value": "articles"}, {"text": "Sources", "value": "sources"}, {"text": "Topics", "value": "topics"}, {"text": "Global", "value": "global"}]}, "width": "half"}' '{}'
add_field "search_analytics" "result_count" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "clicked_result_id" "uuid" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "clicked_position" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "search_filters" "json" '{"interface": "input-code", "options": {"language": "json"}, "width": "full"}' '{}'
add_field "search_analytics" "response_time_ms" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "user_agent" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "ip_address" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "session_id" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "search_analytics" "created_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}' '{}'

echo "✅ Search Analytics collection created"

# === 7. API USAGE LOGS ===
echo "📡 Creating api_usage_logs collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "api_usage_logs",
        "meta": {
            "icon": "api",
            "note": "API usage monitoring and rate limiting",
            "display_template": "{{endpoint}} - {{status_code}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "created_at"
        },
        "schema": {
            "name": "api_usage_logs"
        }
    }' > /dev/null

add_field "api_usage_logs" "id" "uuid" '{"interface": "input", "readonly": true, "hidden": true}' '{"is_primary_key": true}'
add_field "api_usage_logs" "user_id" "uuid" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "endpoint" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "method" "string" '{"interface": "select-dropdown", "options": {"choices": [{"text": "GET", "value": "GET"}, {"text": "POST", "value": "POST"}, {"text": "PUT", "value": "PUT"}, {"text": "DELETE", "value": "DELETE"}]}, "width": "half"}' '{}'
add_field "api_usage_logs" "status_code" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "response_time_ms" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "request_size_bytes" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "response_size_bytes" "integer" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "user_agent" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "ip_address" "string" '{"interface": "input", "width": "half"}' '{}'
add_field "api_usage_logs" "rate_limit_hit" "boolean" '{"interface": "boolean", "width": "half"}' '{}'
add_field "api_usage_logs" "error_message" "text" '{"interface": "input-multiline", "width": "full"}' '{}'
add_field "api_usage_logs" "created_at" "timestamp" '{"interface": "datetime", "readonly": true, "hidden": true, "special": ["date-created"]}' '{}'

echo "✅ API Usage Logs collection created"

echo ""
echo "🎉 All Missing PRD Collections Created!"
echo "📊 Created: ai_analysis_logs, bias_reports, content_moderation, email_templates, notification_queue, search_analytics, api_usage_logs"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
