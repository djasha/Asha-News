#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Enhancing news_sources collection with bias analysis fields..."
echo "============================================================"

# Function to add field to collection
add_field() {
    local field_name="$1"
    local field_type="$2"
    local field_meta="$3"
    local field_schema="$4"
    
    echo "Adding field: $field_name..."
    
    curl -s -X POST "$DIRECTUS_URL/fields/news_sources" \
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

echo "Adding missing fields to news_sources collection..."

# Source Details
add_field "description" "text" '{
    "interface": "input-multiline",
    "width": "full"
}' '{}'

add_field "website_url" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

add_field "logo_url" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

add_field "country" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

add_field "language" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "English", "value": "en"},
            {"text": "Spanish", "value": "es"},
            {"text": "French", "value": "fr"},
            {"text": "German", "value": "de"},
            {"text": "Arabic", "value": "ar"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "en"
}'

add_field "category" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Newspaper", "value": "newspaper"},
            {"text": "Magazine", "value": "magazine"},
            {"text": "TV News", "value": "tv_news"},
            {"text": "Radio", "value": "radio"},
            {"text": "Online News", "value": "online_news"},
            {"text": "Wire Service", "value": "wire_service"},
            {"text": "Blog", "value": "blog"},
            {"text": "Government", "value": "government"},
            {"text": "Think Tank", "value": "think_tank"}
        ]
    },
    "width": "half"
}' '{}'

# Bias Analysis Fields
add_field "bias_rating" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Left", "value": "left"},
            {"text": "Center-Left", "value": "center-left"},
            {"text": "Center", "value": "center"},
            {"text": "Center-Right", "value": "center-right"},
            {"text": "Right", "value": "right"},
            {"text": "Mixed", "value": "mixed"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Left", "value": "left", "foreground": "#FFFFFF", "background": "#DC2626"},
            {"text": "Center-Left", "value": "center-left", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Center", "value": "center", "foreground": "#FFFFFF", "background": "#6B7280"},
            {"text": "Center-Right", "value": "center-right", "foreground": "#FFFFFF", "background": "#3B82F6"},
            {"text": "Right", "value": "right", "foreground": "#FFFFFF", "background": "#2563EB"},
            {"text": "Mixed", "value": "mixed", "foreground": "#FFFFFF", "background": "#7C3AED"}
        ]
    },
    "width": "half"
}' '{}'

add_field "bias_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2
}'

add_field "credibility_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2
}'

add_field "factual_reporting" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Very High", "value": "very_high"},
            {"text": "High", "value": "high"},
            {"text": "Mostly Factual", "value": "mostly_factual"},
            {"text": "Mixed", "value": "mixed"},
            {"text": "Low", "value": "low"},
            {"text": "Very Low", "value": "very_low"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Very High", "value": "very_high", "foreground": "#FFFFFF", "background": "#059669"},
            {"text": "High", "value": "high", "foreground": "#FFFFFF", "background": "#10B981"},
            {"text": "Mostly Factual", "value": "mostly_factual", "foreground": "#FFFFFF", "background": "#34D399"},
            {"text": "Mixed", "value": "mixed", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Low", "value": "low", "foreground": "#FFFFFF", "background": "#EF4444"},
            {"text": "Very Low", "value": "very_low", "foreground": "#FFFFFF", "background": "#DC2626"}
        ]
    },
    "width": "half"
}' '{}'

add_field "bias_methodology" "text" '{
    "interface": "input-multiline",
    "width": "full"
}' '{}'

add_field "last_bias_review" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

# Quality & Trust Metrics
add_field "trust_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2
}'

add_field "transparency_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2
}'

add_field "ownership_transparency" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "funding_transparency" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

# Editorial Standards
add_field "editorial_standards" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full"
}' '{}'

add_field "correction_policy" "text" '{
    "interface": "input-multiline",
    "width": "full"
}' '{}'

add_field "source_verification" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Excellent", "value": "excellent"},
            {"text": "Good", "value": "good"},
            {"text": "Fair", "value": "fair"},
            {"text": "Poor", "value": "poor"},
            {"text": "Unknown", "value": "unknown"}
        ]
    },
    "width": "half"
}' '{}'

# Performance Metrics
add_field "article_count" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "avg_articles_per_day" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.0"
    },
    "width": "half"
}' '{
    "precision": 4,
    "scale": 1,
    "default_value": 0
}'

add_field "last_article_date" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "feed_health_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2,
    "default_value": 1.0
}'

# Content Analysis
add_field "content_quality_score" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.00"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 2
}'

add_field "avg_reading_level" "decimal" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "format": "0.0"
    },
    "width": "half"
}' '{
    "precision": 3,
    "scale": 1
}'

add_field "primary_topics" "json" '{
    "interface": "tags",
    "width": "full"
}' '{}'

# Status and Management
add_field "monitoring_enabled" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": true
}'

add_field "priority_level" "string" '{
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

add_field "notes" "text" '{
    "interface": "input-rich-text-html",
    "width": "full"
}' '{}'

echo ""
echo "✅ news_sources collection enhancement completed!"
echo "Added fields: description, website_url, logo_url, country, language, category,"
echo "bias_rating, bias_score, credibility_score, factual_reporting, bias_methodology,"
echo "last_bias_review, trust_score, transparency_score, ownership_transparency,"
echo "funding_transparency, editorial_standards, correction_policy, source_verification,"
echo "article_count, avg_articles_per_day, last_article_date, feed_health_score,"
echo "content_quality_score, avg_reading_level, primary_topics, monitoring_enabled,"
echo "priority_level, notes"
