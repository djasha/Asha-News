#!/bin/bash

echo "===  CLUSTER TESTING SCRIPT ===="
echo ""

# 1. Check backend health
echo "1. Testing Backend Health..."
HEALTH=$(curl -s http://localhost:3001/api/health | jq -r '.status')
if [ "$HEALTH" = "healthy" ]; then
  echo "   ✅ Backend is healthy"
else
  echo "   ❌ Backend is not responding"
  exit 1
fi
echo ""

# 2. List clusters and find one with data
echo "2. Finding working cluster..."
CLUSTER_ID=$(curl -s 'http://localhost:3001/api/clusters?limit=20' | jq -r '.data[] | select(.cluster_title != null and .article_count > 0) | .id' | head -1)
if [ -z "$CLUSTER_ID" ]; then
  echo "   ❌ No working clusters found!"
  exit 1
fi
echo "   ✅ Found cluster ID: $CLUSTER_ID"
CLUSTER_TITLE=$(curl -s "http://localhost:3001/api/clusters?limit=20" | jq -r ".data[] | select(.id == $CLUSTER_ID) | .cluster_title")
echo "   Title: $CLUSTER_TITLE"
echo ""

# 3. Test GET endpoint for this cluster
echo "3. Testing GET /api/clusters/$CLUSTER_ID..."
RESPONSE=$(curl -s "http://localhost:3001/api/clusters/$CLUSTER_ID")
TITLE=$(echo "$RESPONSE" | jq -r '.data.cluster_title')
ARTICLE_COUNT=$(echo "$RESPONSE" | jq -r '.data.articles | length')

if [ "$TITLE" = "null" ] || [ -z "$TITLE" ]; then
  echo "   ❌ GET endpoint returns null title"
  echo "   Response keys:" 
  echo "$RESPONSE" | jq '.data | keys' | head -10
else
  echo "   ✅ Title: $TITLE"
  echo "   ✅ Articles: $ARTICLE_COUNT"
fi
echo ""

# 4. Test Q&A generation
echo "4. Testing Q&A Generation..."
QA_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/clusters/$CLUSTER_ID/qa" -H "Content-Type: application/json" -d '{}')
QA_SUCCESS=$(echo "$QA_RESPONSE" | jq -r '.success')
if [ "$QA_SUCCESS" = "true" ]; then
  CACHED=$(echo "$QA_RESPONSE" | jq -r '.data.cached')
  QUESTIONS=$(echo "$QA_RESPONSE" | jq -r '.data.suggested_questions | length')
  echo "   ✅ Q&A generated (cached: $CACHED, questions: $QUESTIONS)"
else
  ERROR=$(echo "$QA_RESPONSE" | jq -r '.error')
  echo "   ❌ Q&A generation failed: $ERROR"
fi
echo ""

# 5. Test Fact-Check generation
echo "5. Testing Fact-Check Generation..."
FC_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/clusters/$CLUSTER_ID/fact-check" -H "Content-Type: application/json" -d '{}')
FC_SUCCESS=$(echo "$FC_RESPONSE" | jq -r '.success')
if [ "$FC_SUCCESS" = "true" ]; then
  CACHED=$(echo "$FC_RESPONSE" | jq -r '.data.cached')
  echo "   ✅ Fact-check generated (cached: $CACHED)"
else
  ERROR=$(echo "$FC_RESPONSE" | jq -r '.error')
  echo "   ❌ Fact-check failed: $ERROR"
fi
echo ""

# 6. Test Analysis generation
echo "6. Testing Analysis Generation..."
AN_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/clusters/$CLUSTER_ID/analysis" -H "Content-Type: application/json" -d '{}')
AN_SUCCESS=$(echo "$AN_RESPONSE" | jq -r '.success')
if [ "$AN_SUCCESS" = "true" ]; then
  CACHED=$(echo "$AN_RESPONSE" | jq -r '.data.cached')
  FACTS=$(echo "$AN_RESPONSE" | jq -r '.data.key_facts | length')
  echo "   ✅ Analysis generated (cached: $CACHED, facts: $FACTS)"
else
  ERROR=$(echo "$AN_RESPONSE" | jq -r '.error')
  echo "   ❌ Analysis failed: $ERROR"
fi
echo ""

echo "=== TEST COMPLETE ==="
echo "Open in browser: http://localhost:3000/story/$CLUSTER_ID"
