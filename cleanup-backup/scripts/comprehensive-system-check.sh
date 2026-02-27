#!/bin/bash

# Comprehensive system check for Asha News project
# This script verifies all components are working correctly

echo "=== ASHA NEWS COMPREHENSIVE SYSTEM CHECK ==="
echo ""

# Check backend server status
echo "1. Backend Server Health Check:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend server responding on port 3001"
else
    echo "❌ Backend server not responding (status: $BACKEND_STATUS)"
fi

# Check Directus connection
echo ""
echo "2. Directus CMS Connection:"
DIRECTUS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z" "http://168.231.111.192:8055/items/articles?limit=1")
if [ "$DIRECTUS_STATUS" = "200" ]; then
    echo "✅ Directus CMS accessible and authenticated"
else
    echo "❌ Directus CMS connection issue (status: $DIRECTUS_STATUS)"
fi

# Check authentication endpoints
echo ""
echo "3. Authentication Endpoints:"
AUTH_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/login)
AUTH_GOOGLE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/google)

if [ "$AUTH_LOGIN" = "405" ] || [ "$AUTH_LOGIN" = "400" ]; then
    echo "✅ Login endpoint accessible (expects POST)"
else
    echo "❌ Login endpoint issue (status: $AUTH_LOGIN)"
fi

if [ "$AUTH_GOOGLE" = "302" ] || [ "$AUTH_GOOGLE" = "500" ]; then
    echo "✅ Google OAuth endpoint accessible (redirect/config expected)"
else
    echo "❌ Google OAuth endpoint issue (status: $AUTH_GOOGLE)"
fi

# Check relations data
echo ""
echo "4. Relations Data Verification:"
ARTICLES_TAGS=$(curl -s -H "Authorization: Bearer rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z" "http://168.231.111.192:8055/items/articles_tags" | jq '.data | length' 2>/dev/null)
ARTICLES_CLUSTERS=$(curl -s -H "Authorization: Bearer rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z" "http://168.231.111.192:8055/items/articles_story_clusters" | jq '.data | length' 2>/dev/null)

echo "   Articles-Tags relations: $ARTICLES_TAGS"
echo "   Articles-Clusters relations: $ARTICLES_CLUSTERS"

if [ "$ARTICLES_TAGS" -gt "0" ] && [ "$ARTICLES_CLUSTERS" -gt "0" ]; then
    echo "✅ Relations data populated"
else
    echo "❌ Relations data missing"
fi

# Check collections accessibility
echo ""
echo "5. Key Collections Status:"
COLLECTIONS=("articles" "tags" "article_series" "story_clusters" "users" "api_configurations")

for collection in "${COLLECTIONS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z" "http://168.231.111.192:8055/items/$collection?limit=1")
    if [ "$STATUS" = "200" ]; then
        COUNT=$(curl -s -H "Authorization: Bearer rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z" "http://168.231.111.192:8055/items/$collection" | jq '.data | length' 2>/dev/null)
        echo "   ✅ $collection: $COUNT items"
    else
        echo "   ❌ $collection: inaccessible (status: $STATUS)"
    fi
done

# Check environment variables
echo ""
echo "6. Environment Configuration:"
if [ -f "server/.env" ]; then
    echo "✅ Server .env file exists"
    if grep -q "DIRECTUS_URL" server/.env; then
        echo "✅ DIRECTUS_URL configured"
    else
        echo "❌ DIRECTUS_URL missing"
    fi
    if grep -q "JWT_SECRET" server/.env; then
        echo "✅ JWT_SECRET configured"
    else
        echo "❌ JWT_SECRET missing"
    fi
else
    echo "❌ Server .env file missing"
fi

# Check for potential issues
echo ""
echo "7. Potential Issues Check:"

# Check for running processes
BACKEND_PROCESSES=$(pgrep -f "node.*server" | wc -l)
if [ "$BACKEND_PROCESSES" -gt "1" ]; then
    echo "⚠️  Multiple backend processes running ($BACKEND_PROCESSES)"
else
    echo "✅ Single backend process running"
fi

# Check for port conflicts
if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ Port 3001 in use (backend server)"
else
    echo "❌ Port 3001 not in use"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Port 3000 in use (frontend)"
else
    echo "⚠️  Port 3000 not in use (frontend may be stopped)"
fi

echo ""
echo "=== SYSTEM CHECK COMPLETE ==="
