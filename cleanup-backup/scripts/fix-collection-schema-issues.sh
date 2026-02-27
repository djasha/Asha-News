#!/bin/bash

DIRECTUS_URL="http://168.231.111.192:8055"
DIRECTUS_TOKEN="rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z"

echo "🔧 Fixing Collection Schema Issues..."
echo "============================================================"

# Fix fact_check_claims collection
echo "Fixing fact_check_claims collection..."
curl -s -X DELETE "$DIRECTUS_URL/fields/fact_check_claims/related_articles" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

echo "✅ Fixed fact_check_claims"

# Fix story_clusters collection  
echo "Fixing story_clusters collection..."
curl -s -X DELETE "$DIRECTUS_URL/fields/story_clusters/related_clusters" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

echo "✅ Fixed story_clusters"

# Fix user_activity permissions by removing problematic fields
echo "Fixing user_activity permissions..."
curl -s -X DELETE "$DIRECTUS_URL/fields/user_activity/timestamp" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

# Re-add timestamp field with proper permissions
curl -s -X POST "$DIRECTUS_URL/fields/user_activity" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "timestamp",
        "type": "timestamp",
        "meta": {
            "interface": "datetime",
            "width": "half",
            "readonly": false,
            "hidden": false
        },
        "schema": {
            "default_value": "CURRENT_TIMESTAMP"
        }
    }' > /dev/null

echo "✅ Fixed user_activity"

# Fix user_sessions permissions
echo "Fixing user_sessions permissions..."
curl -s -X DELETE "$DIRECTUS_URL/fields/user_sessions/login_time" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

# Re-add login_time field with proper permissions
curl -s -X POST "$DIRECTUS_URL/fields/user_sessions" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "field": "login_time",
        "type": "timestamp",
        "meta": {
            "interface": "datetime",
            "width": "half",
            "readonly": false,
            "hidden": false
        },
        "schema": {}
    }' > /dev/null

echo "✅ Fixed user_sessions"

echo ""
echo "🧪 Testing fixed collections..."
echo "============================================================"

# Test each fixed collection
for collection in "fact_check_claims" "story_clusters" "user_activity" "user_sessions"; do
    echo -n "Testing $collection... "
    RESPONSE=$(curl -s "$DIRECTUS_URL/items/$collection?limit=1" -H "Authorization: Bearer $DIRECTUS_TOKEN")
    
    if echo "$RESPONSE" | grep -q "errors"; then
        echo "❌ Still has errors"
    else
        echo "✅ Working"
    fi
done

echo ""
echo "🎉 Schema fixes completed!"
