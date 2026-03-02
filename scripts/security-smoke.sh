#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3102}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}}"
STRICT_AUTH="${STRICT_AUTH:-true}"
INTERNAL_API_KEY="${INTERNAL_API_KEY:-test-internal-key}"
MCP_PROXY_API_KEY="${MCP_PROXY_API_KEY:-test-mcp-proxy-key}"
LOG_FILE="${LOG_FILE:-/tmp/asha-security-smoke.log}"

SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "== Asha v1 security smoke checks =="
echo "BASE_URL=$BASE_URL"
echo "STRICT_AUTH=$STRICT_AUTH"

(
  cd server
  PORT="$PORT" \
  NODE_ENV=production \
  STRICT_AUTH="$STRICT_AUTH" \
  INTERNAL_API_KEY="$INTERNAL_API_KEY" \
  MCP_PROXY_API_KEY="$MCP_PROXY_API_KEY" \
  npm start >"$LOG_FILE" 2>&1
) &
SERVER_PID=$!

wait_for_health() {
  local tries=30
  while [[ "$tries" -gt 0 ]]; do
    local code
    code=$(curl -s -o /tmp/asha_security_body.txt -w "%{http_code}" "$BASE_URL/api/health" || true)
    if [[ "$code" == "200" || "$code" == "503" ]]; then
      return 0
    fi
    sleep 1
    tries=$((tries - 1))
  done

  echo "Server failed to become ready. Last response:"
  cat /tmp/asha_security_body.txt || true
  echo
  echo "Server logs:"
  cat "$LOG_FILE" || true
  exit 1
}

request_code() {
  local method="$1"
  local url="$2"
  shift 2
  curl -s -o /tmp/asha_security_body.txt -w "%{http_code}" -X "$method" "$url" "$@"
}

expect_one_of() {
  local name="$1"
  local code="$2"
  shift 2
  for allowed in "$@"; do
    if [[ "$code" == "$allowed" ]]; then
      echo "[$name] -> $code"
      return 0
    fi
  done

  echo "[$name] unexpected status: $code"
  echo "Body:"
  cat /tmp/asha_security_body.txt || true
  exit 1
}

expect_not_one_of() {
  local name="$1"
  local code="$2"
  shift 2
  for denied in "$@"; do
    if [[ "$code" == "$denied" ]]; then
      echo "[$name] denied with status: $code"
      echo "Body:"
      cat /tmp/asha_security_body.txt || true
      exit 1
    fi
  done
  echo "[$name] -> $code"
}

wait_for_health

# Anonymous requests should be denied for strict/prod ops/admin mutation routes.
code=$(request_code POST "$BASE_URL/api/rss-automation/fetch" -H "Content-Type: application/json" -d "{}")
expect_one_of "anon_ops_rss_fetch_denied" "$code" 401 403

code=$(request_code POST "$BASE_URL/api/clusters/auto-cluster" -H "Content-Type: application/json" -d "{}")
expect_one_of "anon_ops_cluster_denied" "$code" 401 403

code=$(request_code POST "$BASE_URL/api/webhooks/test" -H "Content-Type: application/json" -d "{}")
expect_one_of "anon_webhook_denied" "$code" 401 403

code=$(request_code POST "$BASE_URL/api/mcp/tools/call" -H "Content-Type: application/json" -d '{"name":"list_tools","arguments":{}}')
expect_one_of "anon_mcp_denied" "$code" 401 403

# Internal keys should bypass strict auth for internal/ops paths.
code=$(request_code GET "$BASE_URL/api/rss-automation/status" -H "X-Internal-Key: $INTERNAL_API_KEY")
expect_not_one_of "internal_rss_status_allowed" "$code" 401 403

code=$(request_code POST "$BASE_URL/api/webhooks/test" -H "X-Internal-Key: $INTERNAL_API_KEY" -H "Content-Type: application/json" -d '{"test":true}')
expect_not_one_of "internal_webhook_allowed" "$code" 401 403

code=$(request_code POST "$BASE_URL/api/clusters/auto-cluster" -H "X-Internal-Key: $INTERNAL_API_KEY" -H "Content-Type: application/json" -d '{"max_articles":2}')
expect_not_one_of "internal_cluster_ops_allowed" "$code" 401 403

code=$(request_code GET "$BASE_URL/api/mcp/health" -H "X-API-Key: $MCP_PROXY_API_KEY")
expect_one_of "mcp_api_key_allowed" "$code" 200

# Token and digest auth behavior.
code=$(request_code GET "$BASE_URL/api/v1/public/token/this-token-does-not-exist")
expect_one_of "public_digest_invalid_token" "$code" 404

code=$(request_code GET "$BASE_URL/api/v1/digest?scope=personal&limit=1")
expect_one_of "personal_digest_anonymous_denied" "$code" 401

code=$(request_code POST "$BASE_URL/api/v1/digest/share-token" -H "Content-Type: application/json" -d '{"enabled":true}')
expect_one_of "share_token_anonymous_denied" "$code" 401

code=$(request_code POST "$BASE_URL/api/v1/digest/share-token" -H "Authorization: Bearer invalid-token" -H "Content-Type: application/json" -d '{"enabled":true}')
expect_one_of "share_token_invalid_token_denied" "$code" 403

echo "Security smoke checks passed."
