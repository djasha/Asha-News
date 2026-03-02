#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

echo "== Asha v1 smoke checks =="
echo "BASE_URL=$BASE_URL"

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /tmp/asha_smoke_body.txt -w "%{http_code}" "$url")
  echo "[$name] $url -> $code"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    echo "Body:"
    cat /tmp/asha_smoke_body.txt
    exit 1
  fi
}

check "health" "$BASE_URL/api/health"
check "openapi" "$BASE_URL/api/v1/openapi"
check "public_digest" "$BASE_URL/api/v1/digest?scope=public&limit=3"
check "clusters_search" "$BASE_URL/api/v1/clusters/search?q=market&limit=3"
check "instrument_news" "$BASE_URL/api/v1/instruments/BTCUSD/news?limit=3"
check "instrument_prices" "$BASE_URL/api/v1/instruments/prices?symbols=BTCUSD,ETHUSD"

if [[ -n "$AUTH_TOKEN" ]]; then
  code=$(curl -s -o /tmp/asha_smoke_body.txt -w "%{http_code}" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/api/v1/digest?scope=personal&limit=3")
  echo "[personal_digest] -> $code"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    cat /tmp/asha_smoke_body.txt
    exit 1
  fi
else
  echo "[personal_digest] skipped (set AUTH_TOKEN to run)"
fi

echo "Smoke checks passed."
