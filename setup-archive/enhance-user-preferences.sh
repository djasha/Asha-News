#!/bin/bash

# Enhance User Preferences Collection with All Missing Fields
# Based on DIRECTUS_ARCHITECTURE.md complete specification

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Enhancing user_preferences collection with missing fields..."
echo "============================================================"

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

# Missing fields for user_preferences
missing_fields=(
    # News Preferences (Enhanced)
    '{"field":"source_preferences","type":"json","meta":{"field":"source_preferences","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","note":"Preferred and blocked news sources"},"schema":{"name":"source_preferences","table":"user_preferences","data_type":"json"}}'
    
    '{"field":"reading_level","type":"string","meta":{"field":"reading_level","interface":"select-dropdown","options":{"choices":[{"text":"Basic","value":"basic"},{"text":"Intermediate","value":"intermediate"},{"text":"Advanced","value":"advanced"}]},"width":"half","note":"Preferred reading complexity level"},"schema":{"name":"reading_level","table":"user_preferences","data_type":"varchar","max_length":50,"default_value":"intermediate"}}'
    
    # Display Preferences (Enhanced)
    '{"field":"layout_density","type":"string","meta":{"field":"layout_density","interface":"select-dropdown","options":{"choices":[{"text":"Compact","value":"compact"},{"text":"Comfortable","value":"comfortable"},{"text":"Spacious","value":"spacious"}]},"width":"half","note":"Layout density preference"},"schema":{"name":"layout_density","table":"user_preferences","data_type":"varchar","max_length":20,"default_value":"comfortable"}}'
    
    '{"field":"font_size","type":"string","meta":{"field":"font_size","interface":"select-dropdown","options":{"choices":[{"text":"Small","value":"small"},{"text":"Medium","value":"medium"},{"text":"Large","value":"large"},{"text":"Extra Large","value":"xl"}]},"width":"half","note":"Font size preference"},"schema":{"name":"font_size","table":"user_preferences","data_type":"varchar","max_length":20,"default_value":"medium"}}'
    
    '{"field":"show_images","type":"boolean","meta":{"field":"show_images","interface":"boolean","width":"half","note":"Show article images"},"schema":{"name":"show_images","table":"user_preferences","data_type":"boolean","default_value":true}}'
    
    '{"field":"show_summaries","type":"boolean","meta":{"field":"show_summaries","interface":"boolean","width":"half","note":"Show article summaries"},"schema":{"name":"show_summaries","table":"user_preferences","data_type":"boolean","default_value":true}}'
    
    '{"field":"articles_per_page","type":"integer","meta":{"field":"articles_per_page","interface":"input","width":"half","note":"Number of articles per page"},"schema":{"name":"articles_per_page","table":"user_preferences","data_type":"integer","default_value":20}}'
    
    # Notification Preferences (Enhanced)
    '{"field":"weekly_summary","type":"boolean","meta":{"field":"weekly_summary","interface":"boolean","width":"half","note":"Enable weekly summary emails"},"schema":{"name":"weekly_summary","table":"user_preferences","data_type":"boolean","default_value":false}}'
    
    '{"field":"fact_check_alerts","type":"boolean","meta":{"field":"fact_check_alerts","interface":"boolean","width":"half","note":"Enable fact check alerts"},"schema":{"name":"fact_check_alerts","table":"user_preferences","data_type":"boolean","default_value":true}}'
    
    '{"field":"trending_topics_alerts","type":"boolean","meta":{"field":"trending_topics_alerts","interface":"boolean","width":"half","note":"Enable trending topics alerts"},"schema":{"name":"trending_topics_alerts","table":"user_preferences","data_type":"boolean","default_value":false}}'
    
    # Privacy Preferences
    '{"field":"data_sharing","type":"boolean","meta":{"field":"data_sharing","interface":"boolean","width":"half","note":"Allow data sharing for research"},"schema":{"name":"data_sharing","table":"user_preferences","data_type":"boolean","default_value":false}}'
    
    '{"field":"analytics_tracking","type":"boolean","meta":{"field":"analytics_tracking","interface":"boolean","width":"half","note":"Allow analytics tracking"},"schema":{"name":"analytics_tracking","table":"user_preferences","data_type":"boolean","default_value":true}}'
    
    '{"field":"public_profile","type":"boolean","meta":{"field":"public_profile","interface":"boolean","width":"half","note":"Make profile public"},"schema":{"name":"public_profile","table":"user_preferences","data_type":"boolean","default_value":false}}'
    
    # Dashboard Layout
    '{"field":"dashboard_widgets","type":"json","meta":{"field":"dashboard_widgets","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","note":"Dashboard widget configuration"},"schema":{"name":"dashboard_widgets","table":"user_preferences","data_type":"json"}}'
    
    '{"field":"homepage_sections","type":"json","meta":{"field":"homepage_sections","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","note":"Homepage section preferences"},"schema":{"name":"homepage_sections","table":"user_preferences","data_type":"json"}}'
)

echo "Adding ${#missing_fields[@]} missing fields to user_preferences..."

for field in "${missing_fields[@]}"; do
    add_field "user_preferences" "$field"
    sleep 0.5
done

echo ""
echo "✅ user_preferences collection enhancement completed!"
echo "Added fields: source_preferences, reading_level, layout_density, font_size,"
echo "show_images, show_summaries, articles_per_page, weekly_summary, fact_check_alerts,"
echo "trending_topics_alerts, data_sharing, analytics_tracking, public_profile,"
echo "dashboard_widgets, homepage_sections"
