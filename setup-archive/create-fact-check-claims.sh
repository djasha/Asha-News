#!/bin/bash

# Create Fact Check Claims Collection
# Based on DIRECTUS_ARCHITECTURE.md specification

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="your_admin_token_here"

echo "Creating fact_check_claims collection..."

# Create the collection
curl -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "fact_check_claims",
    "meta": {
      "collection": "fact_check_claims",
      "icon": "fact_check",
      "note": "Fact checking claims database with verification workflow",
      "display_template": "{{claim_text}}",
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "sort",
      "accountability": "all",
      "color": "#2196F3",
      "item_duplication_fields": null,
      "sort": 1,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "fact_check_claims"
    }
  }'

echo "Creating fields for fact_check_claims..."

# Create fields
fields=(
  '{"field":"id","type":"uuid","meta":{"field":"id","special":["uuid"],"interface":"input","readonly":true,"hidden":true,"width":"full","translations":null,"note":"Primary key"},"schema":{"name":"id","table":"fact_check_claims","data_type":"uuid","default_value":null,"max_length":null,"numeric_precision":null,"numeric_scale":null,"is_nullable":false,"is_unique":false,"is_primary_key":true,"has_auto_increment":false,"foreign_key_column":null,"foreign_key_table":null}}'
  
  '{"field":"claim_text","type":"text","meta":{"field":"claim_text","special":null,"interface":"input-multiline","required":true,"width":"full","translations":null,"note":"The actual claim being fact-checked"},"schema":{"name":"claim_text","table":"fact_check_claims","data_type":"text","is_nullable":false}}'
  
  '{"field":"claim_source","type":"string","meta":{"field":"claim_source","special":null,"interface":"input","width":"half","translations":null,"note":"Source where the claim was made"},"schema":{"name":"claim_source","table":"fact_check_claims","data_type":"varchar","max_length":255}}'
  
  '{"field":"claimant","type":"string","meta":{"field":"claimant","special":null,"interface":"input","width":"half","translations":null,"note":"Person or organization making the claim"},"schema":{"name":"claimant","table":"fact_check_claims","data_type":"varchar","max_length":255}}'
  
  '{"field":"claim_date","type":"date","meta":{"field":"claim_date","special":null,"interface":"datetime","width":"half","translations":null,"note":"Date when the claim was made"},"schema":{"name":"claim_date","table":"fact_check_claims","data_type":"date"}}'
  
  '{"field":"verdict","type":"string","meta":{"field":"verdict","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"True","value":"true"},{"text":"Mostly True","value":"mostly_true"},{"text":"Mixed","value":"mixed"},{"text":"Mostly False","value":"mostly_false"},{"text":"False","value":"false"},{"text":"Unproven","value":"unproven"}]},"width":"half","translations":null,"note":"Fact check verdict"},"schema":{"name":"verdict","table":"fact_check_claims","data_type":"varchar","max_length":50}}'
  
  '{"field":"confidence_score","type":"decimal","meta":{"field":"confidence_score","special":null,"interface":"input","width":"half","translations":null,"note":"Confidence level (0-1)"},"schema":{"name":"confidence_score","table":"fact_check_claims","data_type":"decimal","numeric_precision":3,"numeric_scale":2}}'
  
  '{"field":"evidence_summary","type":"text","meta":{"field":"evidence_summary","special":null,"interface":"input-rich-text-html","width":"full","translations":null,"note":"Summary of evidence found"},"schema":{"name":"evidence_summary","table":"fact_check_claims","data_type":"text"}}'
  
  '{"field":"methodology_notes","type":"text","meta":{"field":"methodology_notes","special":null,"interface":"input-multiline","width":"full","translations":null,"note":"Notes on fact-checking methodology used"},"schema":{"name":"methodology_notes","table":"fact_check_claims","data_type":"text"}}'
  
  '{"field":"sources_checked","type":"json","meta":{"field":"sources_checked","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","translations":null,"note":"Array of sources verified"},"schema":{"name":"sources_checked","table":"fact_check_claims","data_type":"json"}}'
  
  '{"field":"supporting_evidence","type":"json","meta":{"field":"supporting_evidence","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"half","translations":null,"note":"Evidence supporting the claim"},"schema":{"name":"supporting_evidence","table":"fact_check_claims","data_type":"json"}}'
  
  '{"field":"contradicting_evidence","type":"json","meta":{"field":"contradicting_evidence","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"half","translations":null,"note":"Evidence contradicting the claim"},"schema":{"name":"contradicting_evidence","table":"fact_check_claims","data_type":"json"}}'
  
  '{"field":"expert_opinions","type":"json","meta":{"field":"expert_opinions","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","translations":null,"note":"Expert quotes and opinions"},"schema":{"name":"expert_opinions","table":"fact_check_claims","data_type":"json"}}'
  
  '{"field":"fact_checker_name","type":"string","meta":{"field":"fact_checker_name","special":null,"interface":"input","width":"half","translations":null,"note":"Name of fact checker"},"schema":{"name":"fact_checker_name","table":"fact_check_claims","data_type":"varchar","max_length":255}}'
  
  '{"field":"review_date","type":"timestamp","meta":{"field":"review_date","special":null,"interface":"datetime","width":"half","translations":null,"note":"Date of fact check review"},"schema":{"name":"review_date","table":"fact_check_claims","data_type":"timestamp"}}'
  
  '{"field":"review_status","type":"string","meta":{"field":"review_status","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Pending","value":"pending"},{"text":"In Progress","value":"in_progress"},{"text":"Completed","value":"completed"},{"text":"Disputed","value":"disputed"}]},"width":"half","translations":null,"note":"Review workflow status"},"schema":{"name":"review_status","table":"fact_check_claims","data_type":"varchar","max_length":50}}'
  
  '{"field":"peer_reviewed","type":"boolean","meta":{"field":"peer_reviewed","special":null,"interface":"boolean","width":"half","translations":null,"note":"Has been peer reviewed"},"schema":{"name":"peer_reviewed","table":"fact_check_claims","data_type":"boolean","default_value":false}}'
  
  '{"field":"review_notes","type":"text","meta":{"field":"review_notes","special":null,"interface":"input-multiline","width":"full","translations":null,"note":"Internal review notes"},"schema":{"name":"review_notes","table":"fact_check_claims","data_type":"text"}}'
  
  '{"field":"claim_category","type":"string","meta":{"field":"claim_category","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Political","value":"political"},{"text":"Health","value":"health"},{"text":"Science","value":"science"},{"text":"Economics","value":"economics"},{"text":"Social","value":"social"},{"text":"Environmental","value":"environmental"}]},"width":"half","translations":null,"note":"Category of claim"},"schema":{"name":"claim_category","table":"fact_check_claims","data_type":"varchar","max_length":50}}'
  
  '{"field":"complexity_level","type":"string","meta":{"field":"complexity_level","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Simple","value":"simple"},{"text":"Moderate","value":"moderate"},{"text":"Complex","value":"complex"}]},"width":"half","translations":null,"note":"Complexity of fact check"},"schema":{"name":"complexity_level","table":"fact_check_claims","data_type":"varchar","max_length":50}}'
  
  '{"field":"public_interest_score","type":"integer","meta":{"field":"public_interest_score","special":null,"interface":"slider","options":{"min":1,"max":10},"width":"half","translations":null,"note":"Public interest level (1-10)"},"schema":{"name":"public_interest_score","table":"fact_check_claims","data_type":"integer"}}'
  
  '{"field":"viral_potential","type":"string","meta":{"field":"viral_potential","special":null,"interface":"select-dropdown","options":{"choices":[{"text":"Low","value":"low"},{"text":"Medium","value":"medium"},{"text":"High","value":"high"}]},"width":"half","translations":null,"note":"Potential for viral spread"},"schema":{"name":"viral_potential","table":"fact_check_claims","data_type":"varchar","max_length":50}}'
  
  '{"field":"featured","type":"boolean","meta":{"field":"featured","special":null,"interface":"boolean","width":"half","translations":null,"note":"Featured fact check"},"schema":{"name":"featured","table":"fact_check_claims","data_type":"boolean","default_value":false}}'
  
  '{"field":"published","type":"boolean","meta":{"field":"published","special":null,"interface":"boolean","width":"half","translations":null,"note":"Published status"},"schema":{"name":"published","table":"fact_check_claims","data_type":"boolean","default_value":false}}'
  
  '{"field":"published_at","type":"timestamp","meta":{"field":"published_at","special":null,"interface":"datetime","width":"half","translations":null,"note":"Publication date"},"schema":{"name":"published_at","table":"fact_check_claims","data_type":"timestamp"}}'
  
  '{"field":"created_at","type":"timestamp","meta":{"field":"created_at","special":["date-created"],"interface":"datetime","readonly":true,"width":"half","translations":null,"note":"Creation timestamp"},"schema":{"name":"created_at","table":"fact_check_claims","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
  
  '{"field":"updated_at","type":"timestamp","meta":{"field":"updated_at","special":["date-updated"],"interface":"datetime","readonly":true,"width":"half","translations":null,"note":"Last update timestamp"},"schema":{"name":"updated_at","table":"fact_check_claims","data_type":"timestamp","default_value":"CURRENT_TIMESTAMP"}}'
  
  '{"field":"created_by","type":"uuid","meta":{"field":"created_by","special":["user-created"],"interface":"select-dropdown-m2o","template":"{{first_name}} {{last_name}}","readonly":true,"width":"half","translations":null,"note":"Created by user"},"schema":{"name":"created_by","table":"fact_check_claims","data_type":"uuid"}}'
  
  '{"field":"updated_by","type":"uuid","meta":{"field":"updated_by","special":["user-updated"],"interface":"select-dropdown-m2o","template":"{{first_name}} {{last_name}}","readonly":true,"width":"half","translations":null,"note":"Updated by user"},"schema":{"name":"updated_by","table":"fact_check_claims","data_type":"uuid"}}'
)

for field in "${fields[@]}"; do
  echo "Creating field..."
  curl -X POST "$DIRECTUS_URL/fields/fact_check_claims" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field"
  sleep 1
done

echo "fact_check_claims collection created successfully!"
