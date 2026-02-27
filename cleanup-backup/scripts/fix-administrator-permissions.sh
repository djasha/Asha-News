#!/bin/bash
# Ensure Administrator policy has explicit full CRUD on core domain collections
set -euo pipefail

# Prefer server/.env token to avoid UI auth limitations
if [ -f "server/.env" ]; then
  set -a
  . server/.env
  set +a
fi

DIRECTUS_URL=${DIRECTUS_URL:-"http://168.231.111.192:8055"}
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@asha.news"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"AdminPass123"}

CORE_COLLECTIONS=(
  site_configuration
  navigation_menus
  menu_items
  topic_categories
  news_sources
  legal_pages
  articles
  homepage_sections
  page_content
  breaking_news
  daily_briefs
  trending_topics
  feature_flags
  rss_sources
  global_settings
)

echo "=== Ensure Administrator policy permissions ==="

TOKEN="${DIRECTUS_TOKEN:-}"
if [ -z "${TOKEN}" ]; then
  echo "No DIRECTUS_TOKEN in server/.env, falling back to login..."
  AUTH=$(curl -s -X POST "$DIRECTUS_URL/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
  TOKEN=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(j.data?.access_token||'');" <<< "$AUTH")
fi

if [ -z "$TOKEN" ]; then echo "❌ Could not obtain token"; exit 1; fi
echo "🔑 Using token (length ${#TOKEN}) against $DIRECTUS_URL"

echo "🔎 Fetching Administrator-like policy id..."
# Try Administrator
POL_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "$DIRECTUS_URL/policies?filter[name][_eq]=Administrator&fields[]=id&limit=1")
POLICY_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write((j.data&&j.data[0])?j.data[0].id:'');" <<< "$POL_JSON")
# Try Super Admin if empty
if [ -z "$POLICY_ID" ]; then
  POL_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$DIRECTUS_URL/policies?filter[name][_eq]=Super%20Admin&fields[]=id&limit=1")
  POLICY_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write((j.data&&j.data[0])?j.data[0].id:'');" <<< "$POL_JSON")
fi
# Try Super Administrator if still empty
if [ -z "$POLICY_ID" ]; then
  POL_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "$DIRECTUS_URL/policies?filter[name][_eq]=Super%20Administrator&fields[]=id&limit=1")
  POLICY_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write((j.data&&j.data[0])?j.data[0].id:'');" <<< "$POL_JSON")
fi

if [ -z "$POLICY_ID" ]; then
  echo "ℹ️  No existing Administrator-like policy found. Creating 'Administrator'..."
  CREATE_JSON=$(curl -s -X POST "$DIRECTUS_URL/policies" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Administrator","description":"Full administrative access to all collections","admin_access":true,"app_access":true}')
  POLICY_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(j.data?.id||'');" <<< "$CREATE_JSON")
fi

if [ -z "$POLICY_ID" ]; then echo "❌ Could not obtain a policy id"; exit 1; fi
echo "✅ Using policy id: $POLICY_ID"

echo "🔧 Enabling admin_access + app_access..."
curl -s -X PATCH "$DIRECTUS_URL/policies/$POLICY_ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"admin_access":true,"app_access":true}' >/dev/null || true

for c in "${CORE_COLLECTIONS[@]}"; do
  echo "🛡️  Granting full CRUD for $c"
  for action in create read update delete; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\n        \"policy\": \"$POLICY_ID\",\n        \"collection\": \"$c\",\n        \"action\": \"$action\",\n        \"permissions\": {},\n        \"validation\": {},\n        \"presets\": {},\n        \"fields\": [\"*\"]\n      }" >/dev/null || true
  done
  # optional share
  curl -s -X POST "$DIRECTUS_URL/permissions" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\n      \"policy\": \"$POLICY_ID\",\n      \"collection\": \"$c\",\n      \"action\": \"share\",\n      \"permissions\": {},\n      \"validation\": {},\n      \"presets\": {},\n      \"fields\": [\"*\"]\n    }" >/dev/null || true
done

echo "🧹 Clearing cache..."
curl -s -X POST "$DIRECTUS_URL/utils/cache/clear" -H "Authorization: Bearer $TOKEN" >/dev/null || true

echo "🧪 Smoke test (articles, site_configuration, feature_flags, news_sources)"
for c in site_configuration articles feature_flags news_sources; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/$c?limit=1")
  echo "  $c => $CODE"
done

echo "✅ Done. If UI still shows folders or blocks clicks, please logout and login again."
