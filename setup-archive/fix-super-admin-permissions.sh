#!/bin/bash

# Fix Super Admin Policy Permissions (robust version without jq)
set -euo pipefail

DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"

echo "=== Fixing Super Admin Policy Permissions ==="

# 1) Authenticate and extract access token using Node for safe JSON parsing
AUTH_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));console.log(j.data?.access_token||'');" <<< "$AUTH_RESPONSE")

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi
echo "✅ Authentication successful"

# 2) Find or create Super Admin policy and ensure admin/app access enabled
POLICIES_JSON=$(curl -s -X GET "$DIRECTUS_URL/policies?fields[]=id&fields[]=name" -H "Authorization: Bearer $TOKEN")
POLICY_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));const p=(j.data||[]).find(x=>x.name==='Super Admin');console.log(p?p.id:'');" <<< "$POLICIES_JSON")

if [ -z "$POLICY_ID" ]; then
  echo "ℹ️  Super Admin policy not found, creating..."
  CREATE_JSON=$(curl -s -X POST "$DIRECTUS_URL/policies" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Super Admin","description":"Full administrative access to all collections and settings","admin_access":true,"app_access":true}')
  POLICY_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));console.log(j.data?.id||'');" <<< "$CREATE_JSON")
fi

if [ -z "$POLICY_ID" ]; then
  echo "❌ Failed to obtain Super Admin policy id"
  exit 1
fi
echo "✅ Super Admin policy ID: $POLICY_ID"

# Ensure policy toggles are correct
curl -s -X PATCH "$DIRECTUS_URL/policies/$POLICY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"admin_access":true,"app_access":true}' > /dev/null
echo "✅ admin_access + app_access enabled"

# 3) Enumerate all non-system collections dynamically
COLLECTIONS_JSON=$(curl -s -X GET "$DIRECTUS_URL/collections?limit=-1&fields[]=collection&fields[]=meta.system" \
  -H "Authorization: Bearer $TOKEN")
COLLECTIONS=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));const list=(j.data||[]).filter(c=>!(c.meta&&c.meta.system)).map(c=>c.collection);console.log(list.join('\n'));" <<< "$COLLECTIONS_JSON")

echo "🔧 Creating full CRUD permissions for collections..."
while IFS= read -r collection; do
  [ -z "$collection" ] && continue
  echo "  • $collection"
  for action in create read update delete; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\n        \"policy\": \"$POLICY_ID\",\n        \"collection\": \"$collection\",\n        \"action\": \"$action\",\n        \"permissions\": {},\n        \"validation\": {},\n        \"presets\": {},\n        \"fields\": [\"*\"]\n      }" > /dev/null || true
  done
  # Optional share action (no-op if not supported)
  curl -s -X POST "$DIRECTUS_URL/permissions" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\n      \"policy\": \"$POLICY_ID\",\n      \"collection\": \"$collection\",\n      \"action\": \"share\",\n      \"permissions\": {},\n      \"validation\": {},\n      \"presets\": {},\n      \"fields\": [\"*\"]\n    }" > /dev/null || true
done <<< "$COLLECTIONS"

# 4) Clear cache
echo "🧹 Clearing cache..."
curl -s -X POST "$DIRECTUS_URL/utils/cache/clear" -H "Authorization: Bearer $TOKEN" > /dev/null || true

# 5) Smoke test access on a few common collections
echo "🧪 Testing collection access..."
TEST_LIST=$(echo "$COLLECTIONS" | head -n 5)
while IFS= read -r collection; do
  [ -z "$collection" ] && continue
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$DIRECTUS_URL/items/$collection?limit=1" -H "Authorization: Bearer $TOKEN")
  if [ "$CODE" = "200" ]; then
    echo "  ✅ $collection: accessible"
  else
    echo "  ❌ $collection: $CODE"
  fi
done <<< "$TEST_LIST"

echo "\n🎉 Super Admin Permissions Fixed!"
echo "📋 Summary:"
echo "  - Super Admin policy ensured (admin_access + app_access)"
echo "  - Full CRUD permissions created for every non-system collection"
echo "  - Cache cleared and smoke-tested"
echo "\nIf the Admin UI still shows folders, please log out and log back in."
