#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "👥 Creating Phase 2: User Management Collections..."
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

# === 1. USER ACTIVITY COLLECTION ===
echo "📊 Creating user_activity collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "user_activity",
        "meta": {
            "icon": "analytics",
            "note": "User behavior tracking",
            "display_template": "{{activity_type}} - {{user_id}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "timestamp"
        },
        "schema": {
            "name": "user_activity"
        }
    }' > /dev/null

# Add fields to user_activity
add_field "user_activity" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "user_activity" "user_id" "uuid" '{
    "interface": "select-dropdown-m2o",
    "display": "related-values",
    "display_options": {
        "template": "{{first_name}} {{last_name}} ({{email}})"
    },
    "width": "half"
}' '{}'

add_field "user_activity" "activity_type" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Page View", "value": "page_view"},
            {"text": "Article Read", "value": "article_read"},
            {"text": "Search", "value": "search"},
            {"text": "Share", "value": "share"},
            {"text": "Bookmark", "value": "bookmark"},
            {"text": "Comment", "value": "comment"},
            {"text": "Vote", "value": "vote"}
        ]
    },
    "width": "half"
}' '{}'

add_field "user_activity" "target_type" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Article", "value": "article"},
            {"text": "Topic", "value": "topic"},
            {"text": "Source", "value": "source"},
            {"text": "Search Query", "value": "search_query"},
            {"text": "Fact Check", "value": "fact_check"}
        ]
    },
    "width": "half"
}' '{}'

add_field "user_activity" "target_id" "string" '{
    "interface": "input",
    "width": "half",
    "note": "ID of the target item"
}' '{}'

add_field "user_activity" "metadata" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Additional context data"
}' '{}'

add_field "user_activity" "reading_time" "integer" '{
    "interface": "input",
    "width": "half",
    "note": "Time spent in seconds"
}' '{
    "default_value": 0
}'

add_field "user_activity" "engagement_score" "decimal" '{
    "interface": "slider",
    "options": {
        "min": 0,
        "max": 1,
        "step": 0.01
    },
    "width": "half",
    "note": "Engagement level (0-1)"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0
}'

add_field "user_activity" "device_type" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Desktop", "value": "desktop"},
            {"text": "Mobile", "value": "mobile"},
            {"text": "Tablet", "value": "tablet"}
        ]
    },
    "width": "half"
}' '{}'

add_field "user_activity" "referrer" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Referrer URL"
}' '{}'

add_field "user_activity" "timestamp" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_activity" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

echo "✅ User Activity collection created"

# === 2. USER SUBSCRIPTIONS COLLECTION ===
echo "💳 Creating user_subscriptions collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "user_subscriptions",
        "meta": {
            "icon": "credit_card",
            "note": "User subscription management",
            "display_template": "{{user_id}} - {{plan_type}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "created_at"
        },
        "schema": {
            "name": "user_subscriptions"
        }
    }' > /dev/null

# Add fields to user_subscriptions
add_field "user_subscriptions" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "user_subscriptions" "user_id" "uuid" '{
    "interface": "select-dropdown-m2o",
    "display": "related-values",
    "display_options": {
        "template": "{{first_name}} {{last_name}} ({{email}})"
    },
    "width": "half"
}' '{}'

add_field "user_subscriptions" "plan_type" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Free", "value": "free"},
            {"text": "Premium", "value": "premium"},
            {"text": "Pro", "value": "pro"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Free", "value": "free", "foreground": "#FFFFFF", "background": "#6B7280"},
            {"text": "Premium", "value": "premium", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Pro", "value": "pro", "foreground": "#FFFFFF", "background": "#DC2626"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "free"
}'

add_field "user_subscriptions" "billing_cycle" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Monthly", "value": "monthly"},
            {"text": "Yearly", "value": "yearly"}
        ]
    },
    "width": "half"
}' '{}'

add_field "user_subscriptions" "amount" "decimal" '{
    "interface": "input",
    "width": "half",
    "note": "Subscription amount"
}' '{
    "precision": 10,
    "scale": 2
}'

add_field "user_subscriptions" "currency" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "USD", "value": "USD"},
            {"text": "EUR", "value": "EUR"},
            {"text": "GBP", "value": "GBP"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "USD"
}'

add_field "user_subscriptions" "payment_method" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Stripe", "value": "stripe"},
            {"text": "PayPal", "value": "paypal"},
            {"text": "Apple Pay", "value": "apple_pay"},
            {"text": "Google Pay", "value": "google_pay"}
        ]
    },
    "width": "half"
}' '{}'

add_field "user_subscriptions" "stripe_subscription_id" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Stripe subscription ID"
}' '{}'

add_field "user_subscriptions" "stripe_customer_id" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Stripe customer ID"
}' '{}'

add_field "user_subscriptions" "status" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Active", "value": "active"},
            {"text": "Past Due", "value": "past_due"},
            {"text": "Cancelled", "value": "cancelled"},
            {"text": "Unpaid", "value": "unpaid"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Active", "value": "active", "foreground": "#FFFFFF", "background": "#059669"},
            {"text": "Past Due", "value": "past_due", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Cancelled", "value": "cancelled", "foreground": "#FFFFFF", "background": "#6B7280"},
            {"text": "Unpaid", "value": "unpaid", "foreground": "#FFFFFF", "background": "#DC2626"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "active"
}'

add_field "user_subscriptions" "current_period_start" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_subscriptions" "current_period_end" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_subscriptions" "trial_start" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_subscriptions" "trial_end" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_subscriptions" "cancelled_at" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_subscriptions" "cancel_at_period_end" "boolean" '{
    "interface": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "user_subscriptions" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

add_field "user_subscriptions" "updated_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-updated"]
}' '{}'

echo "✅ User Subscriptions collection created"

# === 3. USER SESSIONS COLLECTION ===
echo "🔐 Creating user_sessions collection..."
curl -s -X POST "$DIRECTUS_URL/collections" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "collection": "user_sessions",
        "meta": {
            "icon": "login",
            "note": "User session tracking",
            "display_template": "{{user_id}} - {{login_time}}",
            "hidden": false,
            "singleton": false,
            "sort_field": "login_time"
        },
        "schema": {
            "name": "user_sessions"
        }
    }' > /dev/null

# Add fields to user_sessions
add_field "user_sessions" "id" "uuid" '{
    "interface": "input",
    "readonly": true,
    "hidden": true
}' '{
    "is_primary_key": true
}'

add_field "user_sessions" "user_id" "uuid" '{
    "interface": "select-dropdown-m2o",
    "display": "related-values",
    "display_options": {
        "template": "{{first_name}} {{last_name}} ({{email}})"
    },
    "width": "half"
}' '{}'

add_field "user_sessions" "session_token" "string" '{
    "interface": "input",
    "width": "half",
    "note": "Session token"
}' '{}'

add_field "user_sessions" "ip_address" "string" '{
    "interface": "input",
    "width": "half",
    "note": "User IP address"
}' '{}'

add_field "user_sessions" "user_agent" "text" '{
    "interface": "input-multiline",
    "width": "full",
    "note": "Browser user agent"
}' '{}'

add_field "user_sessions" "device_info" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Device information"
}' '{}'

add_field "user_sessions" "login_time" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_sessions" "logout_time" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "user_sessions" "session_duration" "integer" '{
    "interface": "input",
    "width": "half",
    "note": "Session duration in seconds"
}' '{
    "default_value": 0
}'

add_field "user_sessions" "pages_visited" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Array of visited page URLs"
}' '{}'

add_field "user_sessions" "articles_read" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full",
    "note": "Array of article IDs read"
}' '{}'

add_field "user_sessions" "status" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Active", "value": "active"},
            {"text": "Expired", "value": "expired"},
            {"text": "Logged Out", "value": "logged_out"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Active", "value": "active", "foreground": "#FFFFFF", "background": "#059669"},
            {"text": "Expired", "value": "expired", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Logged Out", "value": "logged_out", "foreground": "#FFFFFF", "background": "#6B7280"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "active"
}'

add_field "user_sessions" "created_at" "timestamp" '{
    "interface": "datetime",
    "readonly": true,
    "hidden": true,
    "special": ["date-created"]
}' '{}'

echo "✅ User Sessions collection created"

echo ""
echo "🎉 Phase 2 Collections completed successfully!"
echo "📊 Created: user_activity, user_subscriptions, user_sessions"
echo "🔗 Test at: $DIRECTUS_URL/admin/content"
