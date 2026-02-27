#!/bin/bash

# Enhance Story Clusters Collection with All Missing Fields
# Based on DIRECTUS_ARCHITECTURE.md complete specification

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Enhancing story_clusters collection with missing fields..."
echo "=========================================================="

# Function to add field
add_field() {
    local collection=$1
    local field_data=$2
    
    echo "Adding field..."
    curl -s -X POST "$DIRECTUS_URL/fields/$collection" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$field_data" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✓ Field added successfully"
    else
        echo "  ✗ Field addition failed"
    fi
}

# Missing fields for story_clusters
missing_fields=(
    # Clustering Analysis
    '{"field":"similarity_threshold","type":"decimal","meta":{"field":"similarity_threshold","interface":"input","width":"half","note":"Similarity threshold used for clustering (0-1)"},"schema":{"name":"similarity_threshold","table":"story_clusters","data_type":"decimal","numeric_precision":3,"numeric_scale":2,"default_value":"0.75"}}'
    
    '{"field":"geographic_scope","type":"string","meta":{"field":"geographic_scope","interface":"select-dropdown","options":{"choices":[{"text":"Local","value":"local"},{"text":"National","value":"national"},{"text":"International","value":"international"},{"text":"Global","value":"global"}]},"width":"half","note":"Geographic scope of the story"},"schema":{"name":"geographic_scope","table":"story_clusters","data_type":"varchar","max_length":50,"default_value":"national"}}'
    
    # Advanced Bias Analysis
    '{"field":"coverage_gaps","type":"json","meta":{"field":"coverage_gaps","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"half","note":"Array of missing perspectives"},"schema":{"name":"coverage_gaps","table":"story_clusters","data_type":"json"}}'
    
    '{"field":"blindspot_detected","type":"boolean","meta":{"field":"blindspot_detected","interface":"boolean","width":"half","note":"Whether bias blindspots were detected"},"schema":{"name":"blindspot_detected","table":"story_clusters","data_type":"boolean","default_value":false}}'
    
    '{"field":"bias_balance_score","type":"decimal","meta":{"field":"bias_balance_score","interface":"input","width":"half","note":"How balanced the coverage is (0-1)"},"schema":{"name":"bias_balance_score","table":"story_clusters","data_type":"decimal","numeric_precision":3,"numeric_scale":2}}'
    
    # Trending & Time Analysis
    '{"field":"peak_interest_time","type":"timestamp","meta":{"field":"peak_interest_time","interface":"datetime","width":"half","note":"Time of peak interest"},"schema":{"name":"peak_interest_time","table":"story_clusters","data_type":"timestamp"}}'
    
    '{"field":"decline_rate","type":"decimal","meta":{"field":"decline_rate","interface":"input","width":"half","note":"Rate of interest decline"},"schema":{"name":"decline_rate","table":"story_clusters","data_type":"decimal","numeric_precision":5,"numeric_scale":2}}'
    
    '{"field":"news_cycle_stage","type":"string","meta":{"field":"news_cycle_stage","interface":"select-dropdown","options":{"choices":[{"text":"Emerging","value":"emerging"},{"text":"Peak","value":"peak"},{"text":"Declining","value":"declining"},{"text":"Archived","value":"archived"}]},"width":"half","note":"Current stage in news cycle"},"schema":{"name":"news_cycle_stage","table":"story_clusters","data_type":"varchar","max_length":50,"default_value":"emerging"}}'
    
    # Editorial Management
    '{"field":"editorial_priority","type":"string","meta":{"field":"editorial_priority","interface":"select-dropdown","options":{"choices":[{"text":"Low","value":"low"},{"text":"Medium","value":"medium"},{"text":"High","value":"high"},{"text":"Urgent","value":"urgent"}]},"width":"half","note":"Editorial priority level"},"schema":{"name":"editorial_priority","table":"story_clusters","data_type":"varchar","max_length":50,"default_value":"medium"}}'
    
    '{"field":"curator_notes","type":"text","meta":{"field":"curator_notes","interface":"input-multiline","width":"full","note":"Editorial curator notes"},"schema":{"name":"curator_notes","table":"story_clusters","data_type":"text"}}'
    
    # Time Management
    '{"field":"expires_at","type":"timestamp","meta":{"field":"expires_at","interface":"datetime","width":"half","note":"Expiration timestamp"},"schema":{"name":"expires_at","table":"story_clusters","data_type":"timestamp"}}'
    
    '{"field":"last_article_added","type":"timestamp","meta":{"field":"last_article_added","interface":"datetime","width":"half","note":"When last article was added"},"schema":{"name":"last_article_added","table":"story_clusters","data_type":"timestamp"}}'
)

echo "Adding ${#missing_fields[@]} missing fields to story_clusters..."

for field in "${missing_fields[@]}"; do
    add_field "story_clusters" "$field"
    sleep 0.5
done

echo ""
echo "✅ story_clusters collection enhancement completed!"
echo "Added fields: similarity_threshold, geographic_scope, coverage_gaps,"
echo "blindspot_detected, bias_balance_score, peak_interest_time, decline_rate,"
echo "news_cycle_stage, editorial_priority, curator_notes, expires_at, last_article_added"
