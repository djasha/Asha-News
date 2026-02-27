#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Enhancing trending_topics collection with advanced metrics..."
echo "============================================================"

# Function to add field to collection
add_field() {
    local field_name="$1"
    local field_type="$2"
    local field_meta="$3"
    local field_schema="$4"
    
    echo "Adding field: $field_name..."
    
    curl -s -X POST "$DIRECTUS_URL/fields/trending_topics" \
        -H "Authorization: Bearer $DIRECTUS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"field\": \"$field_name\",
            \"type\": \"$field_type\",
            \"meta\": $field_meta,
            \"schema\": $field_schema
        }" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✓ Field added successfully"
    else
        echo "  ✗ Failed to add field"
    fi
}

echo "Adding missing advanced metrics fields to trending_topics collection..."

# Advanced Metrics
add_field "velocity_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 2,
    "default_value": 0
}'

add_field "momentum_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 2,
    "default_value": 0
}'

add_field "peak_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 2,
    "default_value": 0
}'

add_field "peak_time" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "decline_rate" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 2,
    "default_value": 0
}'

# Geographic and Demographic Data
add_field "geographic_distribution" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full"
}' '{}'

add_field "primary_regions" "json" '{
    "interface": "tags",
    "width": "full"
}' '{}'

add_field "demographic_breakdown" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full"
}' '{}'

# Social Media Metrics
add_field "social_mentions" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "social_sentiment" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0.5
}'

add_field "viral_coefficient" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 4,
    "scale": 2,
    "default_value": 0
}'

add_field "share_velocity" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 2,
    "default_value": 0
}'

# Content Analysis
add_field "keyword_density" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full"
}' '{}'

add_field "related_keywords" "json" '{
    "interface": "tags",
    "width": "full"
}' '{}'

add_field "content_categories" "json" '{
    "interface": "tags",
    "width": "full"
}' '{}'

add_field "sentiment_analysis" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full"
}' '{}'

# Bias and Quality Metrics
add_field "bias_distribution" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full"
}' '{}'

add_field "source_diversity_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0
}'

add_field "coverage_completeness" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0
}'

add_field "fact_check_ratio" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0
}'

# Lifecycle Management
add_field "lifecycle_stage" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Emerging", "value": "emerging"},
            {"text": "Rising", "value": "rising"},
            {"text": "Peak", "value": "peak"},
            {"text": "Declining", "value": "declining"},
            {"text": "Archived", "value": "archived"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Emerging", "value": "emerging", "foreground": "#FFFFFF", "background": "#10B981"},
            {"text": "Rising", "value": "rising", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Peak", "value": "peak", "foreground": "#FFFFFF", "background": "#DC2626"},
            {"text": "Declining", "value": "declining", "foreground": "#FFFFFF", "background": "#6B7280"},
            {"text": "Archived", "value": "archived", "foreground": "#FFFFFF", "background": "#374151"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "emerging"
}'

add_field "estimated_lifespan" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "suffix": " hours"
    },
    "width": "half"
}' '{
    "default_value": 24
}'

add_field "expiry_prediction" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

# Engagement Metrics
add_field "engagement_rate" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00%"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 4,
    "default_value": 0
}'

add_field "click_through_rate" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00%"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 4,
    "default_value": 0
}'

add_field "time_on_topic" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "suffix": " seconds"
    },
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "bounce_rate" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00%"
    },
    "width": "half"
}' '{
    "precision": 5,
    "scale": 4,
    "default_value": 0
}'

# Prediction and AI Metrics
add_field "ai_confidence_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0
}'

add_field "trend_prediction" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Rising Fast", "value": "rising_fast"},
            {"text": "Rising Steady", "value": "rising_steady"},
            {"text": "Stable", "value": "stable"},
            {"text": "Declining Slow", "value": "declining_slow"},
            {"text": "Declining Fast", "value": "declining_fast"}
        ]
    },
    "width": "half"
}' '{}'

add_field "anomaly_detected" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "quality_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 0.5
}'

# Editorial and Management
add_field "editorial_priority" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Critical", "value": "critical"},
            {"text": "High", "value": "high"},
            {"text": "Medium", "value": "medium"},
            {"text": "Low", "value": "low"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Critical", "value": "critical", "foreground": "#FFFFFF", "background": "#DC2626"},
            {"text": "High", "value": "high", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Medium", "value": "medium", "foreground": "#FFFFFF", "background": "#3B82F6"},
            {"text": "Low", "value": "low", "foreground": "#FFFFFF", "background": "#6B7280"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "medium"
}'

add_field "curator_notes" "text" '{
    "interface": "input-rich-text-html",
    "width": "full"
}' '{}'

add_field "featured_on_homepage" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "alert_threshold_reached" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

echo ""
echo "✅ trending_topics collection enhancement completed!"
echo "Added fields: velocity_score, momentum_score, peak_score, peak_time, decline_rate,"
echo "geographic_distribution, primary_regions, demographic_breakdown, social_mentions,"
echo "social_sentiment, viral_coefficient, share_velocity, keyword_density, related_keywords,"
echo "content_categories, sentiment_analysis, bias_distribution, source_diversity_score,"
echo "coverage_completeness, fact_check_ratio, lifecycle_stage, estimated_lifespan,"
echo "expiry_prediction, engagement_rate, click_through_rate, time_on_topic, bounce_rate,"
echo "ai_confidence_score, trend_prediction, anomaly_detected, quality_score,"
echo "editorial_priority, curator_notes, featured_on_homepage, alert_threshold_reached"
