#!/bin/bash

# Create User Preferences Collection
# Based on DIRECTUS_ARCHITECTURE.md specification

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="your_admin_token_here"

echo "Creating user_preferences collection..."

# Create the collection
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "user_preferences",
    "meta": {
      "collection": "user_preferences",
      "icon": "settings",
      "note": "User preferences for personalized news experience",
      "display_template": "{{user_id}} - Preferences",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "sort",
      "accountability": "all",
      "color": "#FF9800",
      "item_duplication_fields": null,
      "sort": 1,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "user_preferences"
    }
  }'

echo "Creating fields for user_preferences..."

# Create fields
fields=(
  '{"field":"id","type":"uuid","meta":{"field":"id","special":["uuid"],"interface":"input","readonly":true,"hidden":true,"width":"full","translations":null,"note":"Primary key"},"schema":{"name":"id","table":"user_preferences","data_type":"uuid","default_value":null,"max_length":null,"numeric_precision":null,"numeric_scale":null,"is_nullable":false,"is_unique":false,"is_primary_key":true,"has_auto_increment":false,"foreign_key_column":null,"foreign_key_table":null}}'
  
  '{"field":"user_id","type":"uuid","meta":{"field":"user_id","special":null,"interface":"select-dropdown-m2o","display_options":{"template":"{{first_name}} {{last_name}} ({{email}})"},"required":true,"width":"full","translations":null,"note":"Reference to user account"},"schema":{"name":"user_id","table":"user_preferences","data_type":"uuid","is_nullable":false}}'
  
  '{"field":"preferred_topics","type":"json","meta":{"field":"preferred_topics","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","translations":null,"note":"Array of topic IDs with preference weights"},"schema":{"name":"preferred_topics","table":"user_preferences","data_type":"json"}}'
  
  '{"field":"bias_tolerance","type":"string","meta":{"field":"bias_tolerance","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Strict Center","value":"strict_center"},{"text":"Moderate","value":"moderate"},{"text":"Open to All","value":"open_all"}]},"width":"half","translations":null,"note":"User bias tolerance level"},"schema":{"name":"bias_tolerance","table":"user_preferences","data_type":"varchar","max_length":50,"default_value":"moderate"}}'
  
  '{"field":"source_preferences","type":"json","meta":{"field":"source_preferences","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","translations":null,"note":"Preferred and blocked news sources"},"schema":{"name":"source_preferences","table":"user_preferences","data_type":"json"}}'
  
  '{"field":"language_preference","type":"string","meta":{"field":"language_preference","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"English","value":"en"},{"text":"Spanish","value":"es"},{"text":"French","value":"fr"},{"text":"German","value":"de"},{"text":"Arabic","value":"ar"}]},"width":"half","translations":null,"note":"Preferred content language"},"schema":{"name":"language_preference","table":"user_preferences","data_type":"varchar","max_length":10,"default_value":"en"}}'
  
  '{"field":"reading_level","type":"string","meta":{"field":"reading_level","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Basic","value":"basic"},{"text":"Intermediate","value":"intermediate"},{"text":"Advanced","value":"advanced"}]},"width":"half","translations":null,"note":"Preferred reading complexity level"},"schema":{"name":"reading_level","table":"user_preferences","data_type":"varchar","max_length":50,"default_value":"intermediate"}}'
  
  '{"field":"theme","type":"string","meta":{"field":"theme","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Light","value":"light"},{"text":"Dark","value":"dark"},{"text":"Auto","value":"auto"}]},"width":"half","translations":null,"note":"UI theme preference"},"schema":{"name":"theme","table":"user_preferences","data_type":"varchar","max_length":20,"default_value":"auto"}}'
  
  '{"field":"layout_density","type":"string","meta":{"field":"layout_density","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Compact","value":"compact"},{"text":"Comfortable","value":"comfortable"},{"text":"Spacious","value":"spacious"}]},"width":"half","translations":null,"note":"Layout density preference"},"schema":{"name":"layout_density","table":"user_preferences","data_type":"varchar","max_length":20,"default_value":"comfortable"}}'
  
  '{"field":"font_size","type":"string","meta":{"field":"font_size","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Small","value":"small"},{"text":"Medium","value":"medium"},{"text":"Large","value":"large"},{"text":"Extra Large","value":"xl"}]},"width":"half","translations":null,"note":"Font size preference"},"schema":{"name":"font_size","table":"user_preferences","data_type":"varchar","max_length":20,"default_value":"medium"}}'
  
  '{"field":"show_images","type":"boolean","meta":{"field":"show_images","special":null,"interface":"boolean","width":"half","translations":null,"note":"Show article images"},"schema":{"name":"show_images","table":"user_preferences","data_type":"boolean","default_value":true}}'
  
  '{"field":"show_summaries","type":"boolean","meta":{"field":"show_summaries","special":null,"interface":"boolean","width":"half","translations":null,"note":"Show article summaries"},"schema":{"name":"show_summaries","table":"user_preferences","data_type":"boolean","default_value":true}}'
  
  '{"field":"articles_per_page","type":"integer","meta":{"field":"articles_per_page","special":null,"interface":"input","width":"half","translations":null,"note":"Number of articles per page"},"schema":{"name":"articles_per_page","table":"user_preferences","data_type":"integer","default_value":20}}'
  
  '{"field":"breaking_news_alerts","type":"boolean","meta":{"field":"breaking_news_alerts","special":null,"interface":"boolean","width":"half","translations":null,"note":"Enable breaking news alerts"},"schema":{"name":"breaking_news_alerts","table":"user_preferences","data_type":"boolean","default_value":true}}'
  
  '{"field":"daily_brief_time","type":"time","meta":{"field":"daily_brief_time","special":null,"interface":"datetime","width":"half","translations":null,"note":"Preferred time for daily brief"},"schema":{"name":"daily_brief_time","table":"user_preferences","data_type":"time","default_value":"08:00:00"}}'
  
  '{"field":"weekly_summary","type":"boolean","meta":{"field":"weekly_summary","special":null,"interface":"boolean","width":"half","translations":null,"note":"Enable weekly summary emails"},"schema":{"name":"weekly_summary","table":"user_preferences","data_type":"boolean","default_value":false}}'
  
  '{"field":"fact_check_alerts","type":"boolean","meta":{"field":"fact_check_alerts","special":null,"interface":"boolean","width":"half","translations":null,"note":"Enable fact check alerts"},"schema":{"name":"fact_check_alerts","table":"user_preferences","data_type":"boolean","default_value":true}}'
  
  '{"field":"trending_topics_alerts","type":"boolean","meta":{"field":"trending_topics_alerts","special":null,"interface":"boolean","width":"half","translations":null,"note":"Enable trending topics alerts"},"schema":{"name":"trending_topics_alerts","table":"user_preferences","data_type":"boolean","default_value":false}}'
  
  '{"field":"data_sharing","type":"boolean","meta":{"field":"data_sharing","special":null,"interface":"boolean","width":"half","translations":null,"note":"Allow data sharing for research"},"schema":{"name":"data_sharing","table":"user_preferences","data_type":"boolean","default_value":false}}'
  
  '{"field":"analytics_tracking","type":"boolean","meta":{"field":"analytics_tracking","special":null,"interface":"boolean","width":"half","translations":null,"note":"Allow analytics tracking"},"schema":{"name":"analytics_tracking","table":"user_preferences","data_type":"boolean","default_value":true}}'
  
  '{"field":"personalization","type":"boolean","meta":{"field":"personalization","special":null,"interface":"boolean","width":"half","translations":null,"note":"Enable content personalization"},"schema":{"name":"personalization","table":"user_preferences","data_type":"boolean","default_value":true}}'
  
  '{"field":"public_profile","type":"boolean","meta":{"field":"public_profile","special":null,"interface":"boolean","width":"half","translations":null,"note":"Make profile public"},"schema":{"name":"public_profile","table":"user_preferences","data_type":"boolean","default_value":false}}'
  
  '{"field":"dashboard_widgets","type":"json","meta":{"field":"dashboard_widgets","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","translations":null,"note":"Dashboard widget configuration"},"schema":{"name":"dashboard_widgets","table":"user_preferences","data_type":"json"}}'
  
  '{"field":"homepage_sections","type":"json","meta":{"field":"homepage_sections","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","translations":null,"note":"Homepage section preferences"},"schema":{"name":"homepage_sections","table":"user_preferences","data_type":"json"}}'
  
  '{"field":"created_at","type":"timestamp","meta":{"field":"created_at","special":["date-created"],"interface":"datetime","readonly":true,"width":"half","translations":null,"note":"Creation timestamp"},"schema":{"name":"created_at","table":"user_preferences","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
  
  '{"field":"updated_at","type":"timestamp","meta":{"field":"updated_at","special":["date-updated"],"interface":"datetime","readonly":true,"width":"half","translations":null,"note":"Last update timestamp"},"schema":{"name":"updated_at","table":"user_preferences","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
)

for field in "${fields[@]}"; do
  echo "Creating field..."
  curl -X POST "$DIRECTUS_URL/fields/user_preferences" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field"
  sleep 1
done

echo "user_preferences collection created successfully!"
