#!/bin/bash

# Create Story Clusters Collection
# Based on DIRECTUS_ARCHITECTURE.md specification

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="your_admin_token_here"

echo "Creating story_clusters collection..."

# Create the collection
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "story_clusters",
    "meta": {
      "collection": "story_clusters",
      "icon": "group_work",
      "note": "Editorial story clustering with bias analysis and multi-source coverage",
      "display_template": "{{cluster_title}}",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "sort",
      "accountability": "all",
      "color": "#4CAF50",
      "item_duplication_fields": null,
      "sort": 1,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "story_clusters"
    }
  }'

echo "Creating fields for story_clusters..."

# Create fields
fields=(
  '{"field":"id","type":"uuid","meta":{"field":"id","special":["uuid"],"interface":"input","readonly":true,"hidden":true,"width":"full","translations":null,"note":"Primary key"},"schema":{"name":"id","table":"story_clusters","data_type":"uuid","default_value":null,"max_length":null,"numeric_precision":null,"numeric_scale":null,"is_nullable":false,"is_unique":false,"is_primary_key":true,"has_auto_increment":false,"foreign_key_column":null,"foreign_key_table":null}}'
  
  '{"field":"cluster_title","type":"string","meta":{"field":"cluster_title","special":null,"interface":"input","required":true,"width":"full","translations":null,"note":"Title of the story cluster"},"schema":{"name":"cluster_title","table":"story_clusters","data_type":"varchar","max_length":255,"is_nullable":false}}'
  
  '{"field":"cluster_summary","type":"text","meta":{"field":"cluster_summary","special":null,"interface":"input-rich-text-html","width":"full","translations":null,"note":"Summary of the clustered story"},"schema":{"name":"cluster_summary","table":"story_clusters","data_type":"text"}}'
  
  '{"field":"main_topic","type":"string","meta":{"field":"main_topic","special":null,"interface":"input","width":"half","translations":null,"note":"Primary topic of the cluster"},"schema":{"name":"main_topic","table":"story_clusters","data_type":"varchar","max_length":255}}'
  
  '{"field":"similarity_threshold","type":"decimal","meta":{"field":"similarity_threshold","special":null,"interface":"input","width":"half","translations":null,"note":"Similarity threshold used for clustering (0-1)"},"schema":{"name":"similarity_threshold","table":"story_clusters","data_type":"decimal","numeric_precision":3,"numeric_scale":2}}'
  
  '{"field":"source_count","type":"integer","meta":{"field":"source_count","special":null,"interface":"input","width":"half","translations":null,"note":"Number of different sources in cluster"},"schema":{"name":"source_count","table":"story_clusters","data_type":"integer"}}'
  
  '{"field":"article_count","type":"integer","meta":{"field":"article_count","special":null,"interface":"input","width":"half","translations":null,"note":"Total number of articles in cluster"},"schema":{"name":"article_count","table":"story_clusters","data_type":"integer"}}'
  
  '{"field":"geographic_scope","type":"string","meta":{"field":"geographic_scope","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Local","value":"local"},{"text":"National","value":"national"},{"text":"International","value":"international"},{"text":"Global","value":"global"}]},"width":"half","translations":null,"note":"Geographic scope of the story"},"schema":{"name":"geographic_scope","table":"story_clusters","data_type":"varchar","max_length":50}}'
  
  '{"field":"bias_distribution","type":"json","meta":{"field":"bias_distribution","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","translations":null,"note":"Bias distribution across sources {left: %, center: %, right: %}"},"schema":{"name":"bias_distribution","table":"story_clusters","data_type":"json"}}'
  
  '{"field":"coverage_gaps","type":"json","meta":{"field":"coverage_gaps","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"half","translations":null,"note":"Array of missing perspectives"},"schema":{"name":"coverage_gaps","table":"story_clusters","data_type":"json"}}'
  
  '{"field":"blindspot_detected","type":"boolean","meta":{"field":"blindspot_detected","special":null,"interface":"boolean","width":"half","translations":null,"note":"Whether bias blindspots were detected"},"schema":{"name":"blindspot_detected","table":"story_clusters","data_type":"boolean","default_value":false}}'
  
  '{"field":"bias_balance_score","type":"decimal","meta":{"field":"bias_balance_score","special":null,"interface":"input","width":"half","translations":null,"note":"How balanced the coverage is (0-1)"},"schema":{"name":"bias_balance_score","table":"story_clusters","data_type":"decimal","numeric_precision":3,"numeric_scale":2}}'
  
  '{"field":"trending_score","type":"decimal","meta":{"field":"trending_score","special":null,"interface":"input","width":"half","translations":null,"note":"Current trending score"},"schema":{"name":"trending_score","table":"story_clusters","data_type":"decimal","numeric_precision":5,"numeric_scale":2}}'
  
  '{"field":"peak_interest_time","type":"timestamp","meta":{"field":"peak_interest_time","special":null,"interface":"datetime","width":"half","translations":null,"note":"Time of peak interest"},"schema":{"name":"peak_interest_time","table":"story_clusters","data_type":"timestamp"}}'
  
  '{"field":"decline_rate","type":"decimal","meta":{"field":"decline_rate","special":null,"interface":"input","width":"half","translations":null,"note":"Rate of interest decline"},"schema":{"name":"decline_rate","table":"story_clusters","data_type":"decimal","numeric_precision":5,"numeric_scale":2}}'
  
  '{"field":"news_cycle_stage","type":"string","meta":{"field":"news_cycle_stage","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Emerging","value":"emerging"},{"text":"Peak","value":"peak"},{"text":"Declining","value":"declining"},{"text":"Archived","value":"archived"}]},"width":"half","translations":null,"note":"Current stage in news cycle"},"schema":{"name":"news_cycle_stage","table":"story_clusters","data_type":"varchar","max_length":50}}'
  
  '{"field":"featured","type":"boolean","meta":{"field":"featured","special":null,"interface":"boolean","width":"half","translations":null,"note":"Featured cluster"},"schema":{"name":"featured","table":"story_clusters","data_type":"boolean","default_value":false}}'
  
  '{"field":"editorial_priority","type":"string","meta":{"field":"editorial_priority","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Low","value":"low"},{"text":"Medium","value":"medium"},{"text":"High","value":"high"},{"text":"Urgent","value":"urgent"}]},"width":"half","translations":null,"note":"Editorial priority level"},"schema":{"name":"editorial_priority","table":"story_clusters","data_type":"varchar","max_length":50}}'
  
  '{"field":"curator_notes","type":"text","meta":{"field":"curator_notes","special":null,"interface":"input-multiline","width":"full","translations":null,"note":"Editorial curator notes"},"schema":{"name":"curator_notes","table":"story_clusters","data_type":"text"}}'
  
  '{"field":"status","type":"string","meta":{"field":"status","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Active","value":"active"},{"text":"Monitoring","value":"monitoring"},{"text":"Archived","value":"archived"}]},"width":"half","translations":null,"note":"Cluster status"},"schema":{"name":"status","table":"story_clusters","data_type":"varchar","max_length":50,"default_value":"active"}}'
  
  '{"field":"created_at","type":"timestamp","meta":{"field":"created_at","special":["date-created"],"interface":"datetime","readonly":true,"width":"half","translations":null,"note":"Creation timestamp"},"schema":{"name":"created_at","table":"story_clusters","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
  
  '{"field":"updated_at","type":"timestamp","meta":{"field":"updated_at","special":["date-updated"],"interface":"datetime","readonly":true,"width":"half","translations":null,"note":"Last update timestamp"},"schema":{"name":"updated_at","table":"story_clusters","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
  
  '{"field":"expires_at","type":"timestamp","meta":{"field":"expires_at","special":null,"interface":"datetime","width":"half","translations":null,"note":"Expiration timestamp"},"schema":{"name":"expires_at","table":"story_clusters","data_type":"timestamp"}}'
  
  '{"field":"last_article_added","type":"timestamp","meta":{"field":"last_article_added","special":null,"interface":"datetime","width":"half","translations":null,"note":"When last article was added"},"schema":{"name":"last_article_added","table":"story_clusters","data_type":"timestamp"}}'
)

for field in "${fields[@]}"; do
  echo "Creating field..."
  curl -X POST "$DIRECTUS_URL/fields/story_clusters" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field"
  sleep 1
done

echo "story_clusters collection created successfully!"
