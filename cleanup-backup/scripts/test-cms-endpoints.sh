#!/bin/bash

# Comprehensive CMS Endpoints Testing Script
set -e

SERVER_URL="http://localhost:3001"
echo "=== Testing Comprehensive CMS Endpoints ==="
echo "Server: $SERVER_URL"
echo ""

# Function to test endpoint and show results
test_endpoint() {
  local endpoint="$1"
  local description="$2"
  echo "🧪 Testing: $description"
  echo "   Endpoint: $endpoint"
  
  response=$(curl -s "$SERVER_URL$endpoint" || echo '{"error":"Connection failed"}')
  
  # Check if response contains data or error
  if echo "$response" | grep -q '"data"'; then
    data_count=$(echo "$response" | grep -o '"data":\[[^]]*\]' | wc -c || echo "0")
    if [ "$data_count" -gt 10 ]; then
      echo "   ✅ SUCCESS - Data returned"
    else
      echo "   ✅ SUCCESS - Empty data array"
    fi
  elif echo "$response" | grep -q '"error"'; then
    error_msg=$(echo "$response" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
    echo "   ❌ ERROR - $error_msg"
  else
    echo "   ⚠️  UNKNOWN - Unexpected response format"
  fi
  
  # Show first 200 characters of response
  echo "   Response: $(echo "$response" | cut -c1-200)..."
  echo ""
}

# Test all comprehensive CMS endpoints
echo "📋 Testing Core Configuration Endpoints:"
test_endpoint "/api/cms/site-config" "Site Configuration"
test_endpoint "/api/cms/navigation?location=header" "Header Navigation"
test_endpoint "/api/cms/navigation?location=footer" "Footer Navigation"

echo "📋 Testing Content Management Endpoints:"
test_endpoint "/api/cms/topics" "Topic Categories"
test_endpoint "/api/cms/news-sources" "News Sources"
test_endpoint "/api/cms/articles?limit=10" "Articles (Limited)"
test_endpoint "/api/cms/articles?featured=true" "Featured Articles"

echo "📋 Testing Homepage & Feature Endpoints:"
test_endpoint "/api/cms/homepage-sections" "Homepage Sections"
test_endpoint "/api/cms/breaking-news" "Breaking News"
test_endpoint "/api/cms/daily-briefs" "Daily Briefs"
test_endpoint "/api/cms/trending-topics" "Trending Topics"

echo "📋 Testing Page Content Endpoints:"
test_endpoint "/api/cms/page-content?page=home" "Home Page Content"
test_endpoint "/api/cms/page-content?page=about" "About Page Content"
test_endpoint "/api/cms/legal-pages" "Legal Pages"

echo "📋 Testing Legacy Endpoints:"
test_endpoint "/api/cms/settings" "Legacy Settings"
test_endpoint "/api/cms/rss-sources" "Legacy RSS Sources"
test_endpoint "/api/cms/feature-flags" "Feature Flags"

echo "🎉 CMS Endpoints Testing Complete!"
echo ""
echo "📊 Summary:"
echo "   - All endpoints tested for basic connectivity"
echo "   - Fallback responses should activate for permission issues"
echo "   - Check server logs for detailed error information"
echo ""
echo "🔗 Next Steps:"
echo "   1. Review any failed endpoints above"
echo "   2. Check server logs: tail -f server/logs or server console"
echo "   3. Verify Directus permissions if needed"
echo "   4. Test frontend integration with working endpoints"
