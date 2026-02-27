#!/bin/bash

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔍 Comprehensive Directus CMS Audit..."
echo "============================================================"

# Get all collections
echo "📊 Getting all collections..."
COLLECTIONS=$(curl -s "$DIRECTUS_URL/collections" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.data[].collection' | grep -v "^directus_" | sort)

echo "Found $(echo "$COLLECTIONS" | wc -l | tr -d ' ') collections"
echo ""

# Check each collection for field completeness
echo "🔍 Checking field completeness for each collection..."
echo "============================================================"

for collection in $COLLECTIONS; do
    echo "Checking $collection..."
    
    # Get field count
    FIELD_COUNT=$(curl -s "$DIRECTUS_URL/fields/$collection" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq '.data | length')
    
    # Get item count
    ITEM_COUNT=$(curl -s "$DIRECTUS_URL/items/$collection?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.data | length // 0')
    
    # Check for errors
    ERROR_CHECK=$(curl -s "$DIRECTUS_URL/items/$collection?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.errors // empty')
    
    if [ -n "$ERROR_CHECK" ]; then
        echo "  ❌ $collection: ERROR - $ERROR_CHECK"
    else
        echo "  ✅ $collection: $FIELD_COUNT fields, $ITEM_COUNT items"
    fi
done

echo ""
echo "🔗 Checking Relations Implementation..."
echo "============================================================"

# Check if relation fields exist in articles
echo "Articles relation fields:"
ARTICLES_FIELDS=$(curl -s "$DIRECTUS_URL/fields/articles" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.data[].field' | grep -E "(tags|series|cluster)" || echo "None found")
echo "  $ARTICLES_FIELDS"

# Check junction tables
echo ""
echo "Junction tables status:"
for junction in "articles_tags" "articles_story_clusters" "articles_related" "fact_check_claims_articles" "story_clusters_related"; do
    if echo "$COLLECTIONS" | grep -q "^$junction$"; then
        JUNCTION_FIELDS=$(curl -s "$DIRECTUS_URL/fields/$junction" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq '.data | length')
        echo "  ✅ $junction: $JUNCTION_FIELDS fields"
    else
        echo "  ❌ $junction: Missing"
    fi
done

echo ""
echo "📋 Content Population Status..."
echo "============================================================"

# Check content in key collections
for collection in "articles" "news_sources" "tags" "article_series" "dashboard_widgets" "user_preferences"; do
    if echo "$COLLECTIONS" | grep -q "^$collection$"; then
        ITEMS=$(curl -s "$DIRECTUS_URL/items/$collection" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.data | length // 0')
        if [ "$ITEMS" -eq 0 ]; then
            echo "  ⚠️  $collection: Empty (needs sample data)"
        else
            echo "  ✅ $collection: $ITEMS items"
        fi
    else
        echo "  ❌ $collection: Collection missing"
    fi
done

echo ""
echo "🧪 Testing API Endpoints..."
echo "============================================================"

# Test new collection endpoints
NEW_ENDPOINTS=(
    "/tags"
    "/article-series" 
    "/sitemap-entries"
    "/user-activity"
    "/user-subscriptions"
    "/user-sessions"
    "/dashboard-widgets"
    "/user-dashboard-layouts"
    "/reading-statistics"
)

for endpoint in "${NEW_ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/cms$endpoint")
    if [ "$STATUS" = "200" ]; then
        echo "  ✅ $endpoint: Working"
    else
        echo "  ❌ $endpoint: HTTP $STATUS"
    fi
done

echo ""
echo "🎯 Missing Collections from PRD..."
echo "============================================================"

# Check for collections mentioned in PRD but not created
PRD_COLLECTIONS=(
    "ai_analysis_logs"
    "bias_reports" 
    "content_moderation"
    "email_templates"
    "notification_queue"
    "search_analytics"
    "api_usage_logs"
)

for collection in "${PRD_COLLECTIONS[@]}"; do
    if echo "$COLLECTIONS" | grep -q "^$collection$"; then
        echo "  ✅ $collection: Exists"
    else
        echo "  ❌ $collection: Missing (PRD requirement)"
    fi
done

echo ""
echo "📊 AUDIT SUMMARY"
echo "============================================================"
echo "Total Collections: $(echo "$COLLECTIONS" | wc -l | tr -d ' ')"
echo "Collections with errors: $(for c in $COLLECTIONS; do curl -s "$DIRECTUS_URL/items/$c?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.errors // empty' | grep -c . || echo 0; done | paste -sd+ | bc)"
echo "Empty collections: $(for c in $COLLECTIONS; do curl -s "$DIRECTUS_URL/items/$c?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.data | length // 0' | grep -c '^0$' || echo 0; done | paste -sd+ | bc)"
echo ""
