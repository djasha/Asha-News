#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

if [[ -z "$AUTH_TOKEN" ]]; then
  echo "AUTH_TOKEN is required for authenticated smoke checks"
  exit 1
fi

echo "== Asha v1 authenticated smoke checks =="
echo "BASE_URL=$BASE_URL"

request_code() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  shift 3 || true
  if [[ -n "$body" ]]; then
    curl -s -o /tmp/asha_smoke_auth_body.json -w "%{http_code}" \
      -X "$method" "$url" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      -H "Content-Type: application/json" \
      "$@" \
      -d "$body"
  else
    curl -s -o /tmp/asha_smoke_auth_body.json -w "%{http_code}" \
      -X "$method" "$url" \
      -H "Authorization: Bearer $AUTH_TOKEN" \
      "$@"
  fi
}

expect_code() {
  local name="$1"
  local code="$2"
  local expected="$3"
  echo "[$name] -> $code"
  if [[ "$code" != "$expected" ]]; then
    echo "Unexpected status for $name. Expected $expected"
    echo "Body:"
    cat /tmp/asha_smoke_auth_body.json || true
    exit 1
  fi
}

TOKEN_SUB=$(node -e "const t=process.env.AUTH_TOKEN||'';const p=t.split('.')[1];if(!p){process.stdout.write('');process.exit(0)};const d=JSON.parse(Buffer.from(p,'base64url').toString('utf8'));process.stdout.write(d.sub||'');")
TOKEN_EMAIL=$(node -e "const t=process.env.AUTH_TOKEN||'';const p=t.split('.')[1];if(!p){process.stdout.write('');process.exit(0)};const d=JSON.parse(Buffer.from(p,'base64url').toString('utf8'));process.stdout.write((d.email||'').toLowerCase());")

if [[ -z "$TOKEN_SUB" || -z "$TOKEN_EMAIL" ]]; then
  echo "AUTH_TOKEN is missing required claims (sub/email)"
  exit 1
fi

# Ensure user profile row exists for share-token flow.
sync_payload=$(cat <<JSON
{"provider_uid":"$TOKEN_SUB","firebase_uid":"$TOKEN_SUB","provider":"supabase","email":"$TOKEN_EMAIL","displayName":"Smoke Test User","firstName":"Smoke","lastName":"User"}
JSON
)
syncCode=$(request_code POST "$BASE_URL/api/users" "$sync_payload")
expect_code "user_profile_sync" "$syncCode" "200"

code=$(request_code GET "$BASE_URL/api/v1/digest?scope=personal&limit=3" "")
expect_code "personal_digest" "$code" "200"

code=$(request_code POST "$BASE_URL/api/v1/digest/share-token" '{"enabled":true,"rotate":true}')
expect_code "share_token_enable_rotate" "$code" "200"

SHARE_TOKEN=$(node -e "const fs=require('fs'); try { const j=JSON.parse(fs.readFileSync('/tmp/asha_smoke_auth_body.json','utf8')); process.stdout.write(j.token || ''); } catch { process.stdout.write(''); }")
if [[ -z "$SHARE_TOKEN" ]]; then
  echo "share-token response missing token"
  cat /tmp/asha_smoke_auth_body.json || true
  exit 1
fi

publicCode=$(curl -s -o /tmp/asha_smoke_auth_body.json -w "%{http_code}" "$BASE_URL/api/v1/public/token/$SHARE_TOKEN")
expect_code "public_token_enabled" "$publicCode" "200"

code=$(request_code POST "$BASE_URL/api/v1/digest/share-token" '{"enabled":false}')
expect_code "share_token_disable" "$code" "200"

publicDisabledCode=$(curl -s -o /tmp/asha_smoke_auth_body.json -w "%{http_code}" "$BASE_URL/api/v1/public/token/$SHARE_TOKEN")
expect_code "public_token_disabled" "$publicDisabledCode" "404"

echo "Authenticated smoke checks passed."
