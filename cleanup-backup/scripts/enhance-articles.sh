#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Enhancing articles collection with missing fields..."
echo "============================================================"

# Function to add field to collection
add_field() {
    local field_name="$1"
    local field_type="$2"
    local field_meta="$3"
    local field_schema="$4"
    
    echo "Adding field: $field_name..."
    
    curl -s -X POST "$DIRECTUS_URL/fields/articles" \
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

echo "Adding missing fields to articles collection..."

# Content Details
add_field "article_type" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "News", "value": "news"},
            {"text": "Analysis", "value": "analysis"},
            {"text": "Opinion", "value": "opinion"},
            {"text": "Editorial", "value": "editorial"},
            {"text": "Breaking", "value": "breaking"},
            {"text": "Feature", "value": "feature"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "News", "value": "news", "foreground": "#FFFFFF", "background": "#2563EB"},
            {"text": "Analysis", "value": "analysis", "foreground": "#FFFFFF", "background": "#7C3AED"},
            {"text": "Opinion", "value": "opinion", "foreground": "#FFFFFF", "background": "#DC2626"},
            {"text": "Editorial", "value": "editorial", "foreground": "#FFFFFF", "background": "#059669"},
            {"text": "Breaking", "value": "breaking", "foreground": "#FFFFFF", "background": "#DC2626"},
            {"text": "Feature", "value": "feature", "foreground": "#FFFFFF", "background": "#D97706"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "news"
}'

add_field "reading_time" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "display_options": {
        "suffix": " min"
    },
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "word_count" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "width": "half"
}' '{
    "default_value": 0
}'

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

# Media fields
add_field "featured_image_alt" "string" '{
    "interface": "input",
    "width": "full"
}' '{}'

add_field "featured_image_caption" "text" '{
    "interface": "input-multiline",
    "width": "full"
}' '{}'

add_field "gallery_images" "json" '{
    "interface": "list",
    "width": "full"
}' '{}'

add_field "video_url" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

add_field "audio_url" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

# Source & Attribution
add_field "byline" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

add_field "original_publication_date" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

# Bias & Quality Analysis
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

add_field "political_bias" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Left", "value": "left"},
            {"text": "Center-Left", "value": "center-left"},
            {"text": "Center", "value": "center"},
            {"text": "Center-Right", "value": "center-right"},
            {"text": "Right", "value": "right"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Left", "value": "left", "foreground": "#FFFFFF", "background": "#DC2626"},
            {"text": "Center-Left", "value": "center-left", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "Center", "value": "center", "foreground": "#FFFFFF", "background": "#6B7280"},
            {"text": "Center-Right", "value": "center-right", "foreground": "#FFFFFF", "background": "#3B82F6"},
            {"text": "Right", "value": "right", "foreground": "#FFFFFF", "background": "#2563EB"}
        ]
    },
    "width": "half"
}' '{}'

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

add_field "factual_quality" "decimal" '{
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

add_field "bias_analysis" "json" '{
    "interface": "input-code",
    "options": {
        "language": "json"
    },
    "width": "full"
}' '{}'

add_field "fact_check_status" "string" '{
    "interface": "select-dropdown",
    "options": {
        "choices": [
            {"text": "Pending", "value": "pending"},
            {"text": "Verified", "value": "verified"},
            {"text": "Disputed", "value": "disputed"},
            {"text": "False", "value": "false"}
        ]
    },
    "display": "labels",
    "display_options": {
        "choices": [
            {"text": "Pending", "value": "pending", "foreground": "#FFFFFF", "background": "#6B7280"},
            {"text": "Verified", "value": "verified", "foreground": "#FFFFFF", "background": "#059669"},
            {"text": "Disputed", "value": "disputed", "foreground": "#FFFFFF", "background": "#F59E0B"},
            {"text": "False", "value": "false", "foreground": "#FFFFFF", "background": "#DC2626"}
        ]
    },
    "width": "half"
}' '{
    "default_value": "pending"
}'

# Engagement & Performance
add_field "view_count" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "share_count" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "bookmark_count" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "comment_count" "integer" '{
    "interface": "input",
    "display": "formatted-value",
    "width": "half"
}' '{
    "default_value": 0
}'

add_field "engagement_score" "decimal" '{
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

add_field "trending_score" "decimal" '{
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

# SEO & Social
add_field "seo_title" "string" '{
    "interface": "input",
    "width": "full"
}' '{}'

add_field "seo_description" "text" '{
    "interface": "input-multiline",
    "width": "full"
}' '{}'

add_field "canonical_url" "string" '{
    "interface": "input",
    "width": "full"
}' '{}'

add_field "og_title" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

add_field "og_description" "text" '{
    "interface": "input-multiline",
    "width": "half"
}' '{}'

add_field "twitter_title" "string" '{
    "interface": "input",
    "width": "half"
}' '{}'

add_field "twitter_description" "text" '{
    "interface": "input-multiline",
    "width": "half"
}' '{}'

# Editorial
add_field "featured" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "breaking_news" "boolean" '{
    "interface": "boolean",
    "display": "boolean",
    "width": "half"
}' '{
    "default_value": false
}'

add_field "editor_notes" "text" '{
    "interface": "input-rich-text-html",
    "width": "full"
}' '{}'

add_field "content_warnings" "text" '{
    "interface": "input-multiline",
    "width": "full"
}' '{}'

add_field "accessibility_description" "text" '{
    "interface": "input-multiline",
    "width": "full"
}' '{}'

# Publishing fields
add_field "scheduled_for" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

add_field "expires_at" "datetime" '{
    "interface": "datetime",
    "width": "half"
}' '{}'

echo ""
echo "✅ articles collection enhancement completed!"
echo "Added fields: article_type, reading_time, word_count, language, featured_image_alt,"
echo "featured_image_caption, gallery_images, video_url, audio_url, byline,"
echo "original_publication_date, bias_score, political_bias, credibility_score,"
echo "factual_quality, bias_analysis, fact_check_status, view_count, share_count,"
echo "bookmark_count, comment_count, engagement_score, trending_score, seo_title,"
echo "seo_description, canonical_url, og_title, og_description, twitter_title,"
echo "twitter_description, featured, breaking_news, editor_notes, content_warnings,"
echo "accessibility_description, scheduled_for, expires_at"
