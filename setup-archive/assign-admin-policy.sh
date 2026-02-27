#!/bin/bash
set -euo pipefail
DIRECTUS_URL="http://168.231.111.192:8055"
ADMIN_EMAIL="admin@asha.news"
ADMIN_PASSWORD="AdminPass123"
echo "=== Assign existing Administrator policy to admin user ==="
AUTH=$(curl -s -X POST "$DIRECTUS_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
TOKEN=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));console.log(j.data?.access_token||'');" <<< "$AUTH")
[ -z "$TOKEN" ] && { echo "Auth failed"; exit 1; }
USER_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/users/me?fields[]=id")
USER_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));console.log(j.data?.id||'');" <<< "$USER_JSON")
POL_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/policies?filter[name][_eq]=Administrator&fields[]=id&limit=1")
POL_ID=$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(0,'utf8'));console.log((j.data&&j.data[0])?j.data[0].id:'');" <<< "$POL_JSON")
if [ -z "$POL_ID" ]; then echo "Administrator policy not found"; exit 1; fi
echo "Assigning policy $POL_ID to user $USER_ID"
ASSIGN=$(curl -s -X POST "$DIRECTUS_URL/access" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"policy\":\"$POL_ID\",\"user\":\"$USER_ID\"}")
echo "$ASSIGN" | grep -q 'data' && echo "✅ Assigned" || echo "⚠️ Check response: $ASSIGN"
echo "Testing read on articles..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/articles?limit=1")
echo "articles => $CODE"
