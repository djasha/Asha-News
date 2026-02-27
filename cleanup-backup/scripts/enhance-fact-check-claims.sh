#!/bin/bash

# Enhance Fact Check Claims Collection with All Missing Fields
# Based on DIRECTUS_ARCHITECTURE.md complete specification

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Enhancing fact_check_claims collection with missing fields..."
echo "=============================================================="

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

# Missing fields for fact_check_claims
missing_fields=(
    # Source & Attribution
    '{"field":"claim_source","type":"string","meta":{"field":"claim_source","interface":"input","width":"half","note":"Source where the claim was made"},"schema":{"name":"claim_source","table":"fact_check_claims","data_type":"varchar","max_length":255}}'
    
    '{"field":"claim_date","type":"date","meta":{"field":"claim_date","interface":"datetime","width":"half","note":"Date when the claim was made"},"schema":{"name":"claim_date","table":"fact_check_claims","data_type":"date"}}'
    
    # Review Process
    '{"field":"methodology_notes","type":"text","meta":{"field":"methodology_notes","interface":"input-multiline","width":"full","note":"Notes on fact-checking methodology used"},"schema":{"name":"methodology_notes","table":"fact_check_claims","data_type":"text"}}'
    
    '{"field":"sources_checked","type":"json","meta":{"field":"sources_checked","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","note":"Array of sources verified"},"schema":{"name":"sources_checked","table":"fact_check_claims","data_type":"json"}}'
    
    '{"field":"supporting_evidence","type":"json","meta":{"field":"supporting_evidence","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"half","note":"Evidence supporting the claim"},"schema":{"name":"supporting_evidence","table":"fact_check_claims","data_type":"json"}}'
    
    '{"field":"contradicting_evidence","type":"json","meta":{"field":"contradicting_evidence","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"half","note":"Evidence contradicting the claim"},"schema":{"name":"contradicting_evidence","table":"fact_check_claims","data_type":"json"}}'
    
    '{"field":"expert_opinions","type":"json","meta":{"field":"expert_opinions","special":["cast-json"],"interface":"input-code","options":{"language":"json"},"width":"full","note":"Expert quotes and opinions"},"schema":{"name":"expert_opinions","table":"fact_check_claims","data_type":"json"}}'
    
    # Review Workflow
    '{"field":"fact_checker_name","type":"string","meta":{"field":"fact_checker_name","interface":"input","width":"half","note":"Name of fact checker"},"schema":{"name":"fact_checker_name","table":"fact_check_claims","data_type":"varchar","max_length":255}}'
    
    '{"field":"review_date","type":"timestamp","meta":{"field":"review_date","interface":"datetime","width":"half","note":"Date of fact check review"},"schema":{"name":"review_date","table":"fact_check_claims","data_type":"timestamp"}}'
    
    '{"field":"review_status","type":"string","meta":{"field":"review_status","interface":"select-dropdown","options":{"choices":[{"text":"Pending","value":"pending"},{"text":"In Progress","value":"in_progress"},{"text":"Completed","value":"completed"},{"text":"Disputed","value":"disputed"}]},"width":"half","note":"Review workflow status"},"schema":{"name":"review_status","table":"fact_check_claims","data_type":"varchar","max_length":50,"default_value":"pending"}}'
    
    '{"field":"peer_reviewed","type":"boolean","meta":{"field":"peer_reviewed","interface":"boolean","width":"half","note":"Has been peer reviewed"},"schema":{"name":"peer_reviewed","table":"fact_check_claims","data_type":"boolean","default_value":false}}'
    
    '{"field":"review_notes","type":"text","meta":{"field":"review_notes","interface":"input-multiline","width":"full","note":"Internal review notes"},"schema":{"name":"review_notes","table":"fact_check_claims","data_type":"text"}}'
    
    # Classification & Metrics
    '{"field":"complexity_level","type":"string","meta":{"field":"complexity_level","interface":"select-dropdown","options":{"choices":[{"text":"Simple","value":"simple"},{"text":"Moderate","value":"moderate"},{"text":"Complex","value":"complex"}]},"width":"half","note":"Complexity of fact check"},"schema":{"name":"complexity_level","table":"fact_check_claims","data_type":"varchar","max_length":50,"default_value":"moderate"}}'
    
    '{"field":"public_interest_score","type":"integer","meta":{"field":"public_interest_score","interface":"slider","options":{"min":1,"max":10},"width":"half","note":"Public interest level (1-10)"},"schema":{"name":"public_interest_score","table":"fact_check_claims","data_type":"integer","default_value":5}}'
    
    '{"field":"viral_potential","type":"string","meta":{"field":"viral_potential","interface":"select-dropdown","options":{"choices":[{"text":"Low","value":"low"},{"text":"Medium","value":"medium"},{"text":"High","value":"high"}]},"width":"half","note":"Potential for viral spread"},"schema":{"name":"viral_potential","table":"fact_check_claims","data_type":"varchar","max_length":50,"default_value":"medium"}}'
    
    # Content Management
    '{"field":"featured","type":"boolean","meta":{"field":"featured","interface":"boolean","width":"half","note":"Featured fact check"},"schema":{"name":"featured","table":"fact_check_claims","data_type":"boolean","default_value":false}}'
    
    '{"field":"published_at","type":"timestamp","meta":{"field":"published_at","interface":"datetime","width":"half","note":"Publication date"},"schema":{"name":"published_at","table":"fact_check_claims","data_type":"timestamp"}}'
    
    # User Relations
    '{"field":"created_by","type":"uuid","meta":{"field":"created_by","special":["user-created"],"interface":"select-dropdown-m2o","template":"{{first_name}} {{last_name}}","readonly":true,"width":"half","note":"Created by user"},"schema":{"name":"created_by","table":"fact_check_claims","data_type":"uuid"}}'
    
    '{"field":"updated_by","type":"uuid","meta":{"field":"updated_by","special":["user-updated"],"interface":"select-dropdown-m2o","template":"{{first_name}} {{last_name}}","readonly":true,"width":"half","note":"Updated by user"},"schema":{"name":"updated_by","table":"fact_check_claims","data_type":"uuid"}}'
)

echo "Adding ${#missing_fields[@]} missing fields to fact_check_claims..."

for field in "${missing_fields[@]}"; do
    add_field "fact_check_claims" "$field"
    sleep 0.5
done

echo ""
echo "✅ fact_check_claims collection enhancement completed!"
echo "Added fields: claim_source, claim_date, methodology_notes, sources_checked,"
echo "supporting_evidence, contradicting_evidence, expert_opinions, fact_checker_name,"
echo "review_date, review_status, peer_reviewed, review_notes, complexity_level,"
echo "public_interest_score, viral_potential, featured, published_at, created_by, updated_by"
