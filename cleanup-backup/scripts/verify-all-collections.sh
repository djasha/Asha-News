#!/bin/bash

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔍 Verifying All Directus Collections..."
echo "============================================================"

# Get all collections
COLLECTIONS=$(curl -s "$DIRECTUS_URL/collections" -H "Authorization: Bearer $DIRECTUS_TOKEN" | jq -r '.data[].collection' | grep -v "^directus_" | sort)

echo "📊 Found Collections:"
echo "$COLLECTIONS"
echo ""

# Test each collection
echo "🧪 Testing Collection Access..."
echo "============================================================"

for collection in $COLLECTIONS; do
    echo -n "Testing $collection... "
    
    # Test API access
    RESPONSE=$(curl -s "$DIRECTUS_URL/items/$collection?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN")
    
    if echo "$RESPONSE" | grep -q "errors"; then
        echo "❌ ERROR"
        echo "   Error: $(echo "$RESPONSE" | jq -r '.errors[0].message' | head -c 80)..."
    else
        ITEM_COUNT=$(echo "$RESPONSE" | jq -r '.data | length')
        echo "✅ OK ($ITEM_COUNT items)"
    fi
done

echo ""
echo "🔍 Checking for Duplicates..."
echo "============================================================"

# Check for potential duplicates
DUPLICATES=$(echo "$COLLECTIONS" | sort | uniq -d)
if [ -z "$DUPLICATES" ]; then
    echo "✅ No duplicate collections found"
else
    echo "⚠️  Potential duplicates found:"
    echo "$DUPLICATES"
fi

echo ""
echo "📋 Collection Summary:"
echo "============================================================"
TOTAL_COUNT=$(echo "$COLLECTIONS" | wc -l | tr -d ' ')
echo "Total Collections: $TOTAL_COUNT"
echo ""
echo "Core Collections:"
echo "$COLLECTIONS" | grep -E "(articles|news_sources|trending_topics|story_clusters|fact_check_claims|user_preferences)" | sed 's/^/  ✓ /'
echo ""
echo "New Collections:"
echo "$COLLECTIONS" | grep -E "(tags|article_series|sitemap_entries|user_activity|user_subscriptions|user_sessions|dashboard_widgets|user_dashboard_layouts|reading_statistics)" | sed 's/^/  ✓ /'
echo ""
echo "Junction Tables:"
echo "$COLLECTIONS" | grep -E "(articles_tags|articles_story_clusters|articles_related|fact_check_claims_articles|story_clusters_related)" | sed 's/^/  ✓ /'
