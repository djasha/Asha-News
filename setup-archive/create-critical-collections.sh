#!/bin/bash

# Create Critical Missing Collections for Asha.News Directus CMS
# Based on DIRECTUS_ARCHITECTURE.md Phase 1 requirements

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🚀 Creating Critical Collections for Asha.News CMS..."
echo "=================================================="

# Function to create collection
create_collection() {
    local collection_name=$1
    local icon=$2
    local color=$3
    local note=$4
    
    echo "Creating $collection_name collection..."
    curl -s -X POST "$DIRECTUS_URL/collections" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"collection\": \"$collection_name\",
        \"meta\": {
          \"collection\": \"$collection_name\",
          \"icon\": \"$icon\",
          \"note\": \"$note\",
          \"display_template\": \"{{id}}\",
          \"hidden\": false,
          \"singleton\": false,
          \"accountability\": \"all\",
          \"color\": \"$color\"
        },
        \"schema\": {
          \"name\": \"$collection_name\"
        }
      }" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ $collection_name collection created"
    else
        echo "❌ Failed to create $collection_name collection"
    fi
}

# Function to create field
create_field() {
    local collection=$1
    local field_data=$2
    
    curl -s -X POST "$DIRECTUS_URL/fields/$collection" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$field_data" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✓ Field created"
    else
        echo "  ✗ Field creation failed"
    fi
}

# 1. CREATE FACT_CHECK_CLAIMS COLLECTION
echo ""
echo "1️⃣ Creating fact_check_claims collection..."
create_collection "fact_check_claims" "fact_check" "#2196F3" "Fact checking claims database with verification workflow"

# Essential fields for fact_check_claims
fact_check_fields=(
    '{"field":"id","type":"uuid","meta":{"field":"id","special":["uuid"],"interface":"input","readonly":true,"hidden":true},"schema":{"name":"id","table":"fact_check_claims","data_type":"uuid","is_primary_key":true}}'
    '{"field":"claim_text","type":"text","meta":{"field":"claim_text","interface":"input-multiline","required":true,"width":"full","note":"The actual claim being fact-checked"},"schema":{"name":"claim_text","table":"fact_check_claims","data_type":"text","is_nullable":false}}'
    '{"field":"claimant","type":"string","meta":{"field":"claimant","interface":"input","width":"half","note":"Person or organization making the claim"},"schema":{"name":"claimant","table":"fact_check_claims","data_type":"varchar","max_length":255}}'
    '{"field":"verdict","type":"string","meta":{"field":"verdict","interface":"select-dropdown","options":{"choices":[{"text":"True","value":"true"},{"text":"Mostly True","value":"mostly_true"},{"text":"Mixed","value":"mixed"},{"text":"Mostly False","value":"mostly_false"},{"text":"False","value":"false"},{"text":"Unproven","value":"unproven"}]},"width":"half"},"schema":{"name":"verdict","table":"fact_check_claims","data_type":"varchar","max_length":50}}'
    '{"field":"confidence_score","type":"decimal","meta":{"field":"confidence_score","interface":"input","width":"half","note":"Confidence level (0-1)"},"schema":{"name":"confidence_score","table":"fact_check_claims","data_type":"decimal","numeric_precision":3,"numeric_scale":2}}'
    '{"field":"evidence_summary","type":"text","meta":{"field":"evidence_summary","interface":"input-rich-text-html","width":"full"},"schema":{"name":"evidence_summary","table":"fact_check_claims","data_type":"text"}}'
    '{"field":"claim_category","type":"string","meta":{"field":"claim_category","interface":"select-dropdown","options":{"choices":[{"text":"Political","value":"political"},{"text":"Health","value":"health"},{"text":"Science","value":"science"},{"text":"Economics","value":"economics"},{"text":"Social","value":"social"},{"text":"Environmental","value":"environmental"}]},"width":"half"},"schema":{"name":"claim_category","table":"fact_check_claims","data_type":"varchar","max_length":50}}'
    '{"field":"published","type":"boolean","meta":{"field":"published","interface":"boolean","width":"half"},"schema":{"name":"published","table":"fact_check_claims","data_type":"boolean","default_value":false}}'
    '{"field":"created_at","type":"timestamp","meta":{"field":"created_at","special":["date-created"],"interface":"datetime","readonly":true},"schema":{"name":"created_at","table":"fact_check_claims","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
    '{"field":"updated_at","type":"timestamp","meta":{"field":"updated_at","special":["date-updated"],"interface":"datetime","readonly":true},"schema":{"name":"updated_at","table":"fact_check_claims","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
)

for field in "${fact_check_fields[@]}"; do
    create_field "fact_check_claims" "$field"
done

# 2. CREATE STORY_CLUSTERS COLLECTION
echo ""
echo "2️⃣ Creating story_clusters collection..."
create_collection "story_clusters" "group_work" "#4CAF50" "Editorial story clustering with bias analysis and multi-source coverage"

# Essential fields for story_clusters
story_cluster_fields=(
    '{"field":"id","type":"uuid","meta":{"field":"id","special":["uuid"],"interface":"input","readonly":true,"hidden":true},"schema":{"name":"id","table":"story_clusters","data_type":"uuid","is_primary_key":true}}'
    '{"field":"cluster_title","type":"string","meta":{"field":"cluster_title","interface":"input","required":true,"width":"full","note":"Title of the story cluster"},"schema":{"name":"cluster_title","table":"story_clusters","data_type":"varchar","max_length":255,"is_nullable":false}}'
    '{"field":"cluster_summary","type":"text","meta":{"field":"cluster_summary","interface":"input-rich-text-html","width":"full"},"schema":{"name":"cluster_summary","table":"story_clusters","data_type":"text"}}'
    '{"field":"main_topic","type":"string","meta":{"field":"main_topic","interface":"input","width":"half"},"schema":{"name":"main_topic","table":"story_clusters","data_type":"varchar","max_length":255}}'
    '{"field":"source_count","type":"integer","meta":{"field":"source_count","interface":"input","width":"half","note":"Number of different sources"},"schema":{"name":"source_count","table":"story_clusters","data_type":"integer"}}'
    '{"field":"article_count","type":"integer","meta":{"field":"article_count","interface":"input","width":"half","note":"Total articles in cluster"},"schema":{"name":"article_count","table":"story_clusters","data_type":"integer"}}'
    '{"field":"bias_distribution","type":"json","meta":{"field":"bias_distribution","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","note":"Bias distribution {left: %, center: %, right: %}"},"schema":{"name":"bias_distribution","table":"story_clusters","data_type":"json"}}'
    '{"field":"trending_score","type":"decimal","meta":{"field":"trending_score","interface":"input","width":"half"},"schema":{"name":"trending_score","table":"story_clusters","data_type":"decimal","numeric_precision":5,"numeric_scale":2}}'
    '{"field":"featured","type":"boolean","meta":{"field":"featured","interface":"boolean","width":"half"},"schema":{"name":"featured","table":"story_clusters","data_type":"boolean","default_value":false}}'
    '{"field":"status","type":"string","meta":{"field":"status","interface":"select-dropdown","options":{"choices":[{"text":"Active","value":"active"},{"text":"Monitoring","value":"monitoring"},{"text":"Archived","value":"archived"}]},"width":"half"},"schema":{"name":"status","table":"story_clusters","data_type":"varchar","max_length":50,"default_value":"active"}}'
    '{"field":"created_at","type":"timestamp","meta":{"field":"created_at","special":["date-created"],"interface":"datetime","readonly":true},"schema":{"name":"created_at","table":"story_clusters","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
    '{"field":"updated_at","type":"timestamp","meta":{"field":"updated_at","special":["date-updated"],"interface":"datetime","readonly":true},"schema":{"name":"updated_at","table":"story_clusters","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
)

for field in "${story_cluster_fields[@]}"; do
    create_field "story_clusters" "$field"
done

# 3. CREATE USER_PREFERENCES COLLECTION
echo ""
echo "3️⃣ Creating user_preferences collection..."
create_collection "user_preferences" "settings" "#FF9800" "User preferences for personalized news experience"

# Essential fields for user_preferences
user_pref_fields=(
    '{"field":"id","type":"uuid","meta":{"field":"id","special":["uuid"],"interface":"input","readonly":true,"hidden":true},"schema":{"name":"id","table":"user_preferences","data_type":"uuid","is_primary_key":true}}'
    '{"field":"user_id","type":"uuid","meta":{"field":"user_id","interface":"select-dropdown-m2o","required":true,"width":"full","note":"Reference to user account"},"schema":{"name":"user_id","table":"user_preferences","data_type":"uuid","is_nullable":false}}'
    '{"field":"bias_tolerance","type":"string","meta":{"field":"bias_tolerance","interface":"select-dropdown","options":{"choices":[{"text":"Strict Center","value":"strict_center"},{"text":"Moderate","value":"moderate"},{"text":"Open to All","value":"open_all"}]},"width":"half"},"schema":{"name":"bias_tolerance","table":"user_preferences","data_type":"varchar","max_length":50,"default_value":"moderate"}}'
    '{"field":"preferred_topics","type":"json","meta":{"field":"preferred_topics","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","note":"Array of topic IDs with weights"},"schema":{"name":"preferred_topics","table":"user_preferences","data_type":"json"}}'
    '{"field":"theme","type":"string","meta":{"field":"theme","interface":"select-dropdown","options":{"choices":[{"text":"Light","value":"light"},{"text":"Dark","value":"dark"},{"text":"Auto","value":"auto"}]},"width":"half"},"schema":{"name":"theme","table":"user_preferences","data_type":"varchar","max_length":20,"default_value":"auto"}}'
    '{"field":"language_preference","type":"string","meta":{"field":"language_preference","interface":"select-dropdown","options":{"choices":[{"text":"English","value":"en"},{"text":"Spanish","value":"es"},{"text":"French","value":"fr"}]},"width":"half"},"schema":{"name":"language_preference","table":"user_preferences","data_type":"varchar","max_length":10,"default_value":"en"}}'
    '{"field":"breaking_news_alerts","type":"boolean","meta":{"field":"breaking_news_alerts","interface":"boolean","width":"half"},"schema":{"name":"breaking_news_alerts","table":"user_preferences","data_type":"boolean","default_value":true}}'
    '{"field":"daily_brief_time","type":"time","meta":{"field":"daily_brief_time","interface":"datetime","width":"half"},"schema":{"name":"daily_brief_time","table":"user_preferences","data_type":"time","default_value":"08:00:00"}}'
    '{"field":"personalization","type":"boolean","meta":{"field":"personalization","interface":"boolean","width":"half"},"schema":{"name":"personalization","table":"user_preferences","data_type":"boolean","default_value":true}}'
    '{"field":"created_at","type":"timestamp","meta":{"field":"created_at","special":["date-created"],"interface":"datetime","readonly":true},"schema":{"name":"created_at","table":"user_preferences","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
    '{"field":"updated_at","type":"timestamp","meta":{"field":"updated_at","special":["date-updated"],"interface":"datetime","readonly":true},"schema":{"name":"updated_at","table":"user_preferences","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
)

for field in "${user_pref_fields[@]}"; do
    create_field "user_preferences" "$field"
done

echo ""
echo "🎉 Critical collections created successfully!"
echo "=================================================="
echo "✅ fact_check_claims - Fact checking database"
echo "✅ story_clusters - Editorial story management" 
echo "✅ user_preferences - User personalization settings"
echo ""
echo "Next steps:"
echo "1. Add backend API endpoints"
echo "2. Update frontend components"
echo "3. Test CMS integration"
echo ""
echo "⚠️  Remember to replace 'your_admin_token_here' with actual Directus admin token"
