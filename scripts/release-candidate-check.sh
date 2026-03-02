#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3105}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}}"
STRICT_AUTH="${STRICT_AUTH:-true}"
INTERNAL_API_KEY="${INTERNAL_API_KEY:-test-internal-key}"
MCP_PROXY_API_KEY="${MCP_PROXY_API_KEY:-test-mcp-proxy-key}"
SERVER_LOG_FILE="${SERVER_LOG_FILE:-/tmp/asha-release-candidate-server.log}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
REQUIRE_AUTH_SMOKE="$(echo "${REQUIRE_AUTH_SMOKE:-true}" | tr '[:upper:]' '[:lower:]')"

SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ "$REQUIRE_AUTH_SMOKE" == "true" ]] && [[ -z "$AUTH_TOKEN" ]]; then
  echo "AUTH_TOKEN is required when REQUIRE_AUTH_SMOKE=true."
  echo "Set AUTH_TOKEN to a valid Supabase access token or override with REQUIRE_AUTH_SMOKE=false."
  exit 1
fi

wait_for_health() {
  local tries=45
  while [[ "$tries" -gt 0 ]]; do
    local code
    code=$(curl -s -o /tmp/asha_release_health.json -w "%{http_code}" "$BASE_URL/api/health" || true)
    if [[ "$code" == "200" || "$code" == "503" ]]; then
      return 0
    fi
    tries=$((tries - 1))
    sleep 1
  done
  echo "Server failed to become ready. Last health response:"
  cat /tmp/asha_release_health.json || true
  echo
  echo "Server logs:"
  cat "$SERVER_LOG_FILE" || true
  exit 1
}

echo "== Asha release-candidate checks =="

echo "[1/7] Backend lint"
(cd server && npm run lint)

echo "[2/7] Backend tests"
(cd server && npm test -- --runInBand)

echo "[3/7] Frontend tests"
CI=true npm test -- --watch=false --runInBand

echo "[4/7] Frontend production build"
npm run build

echo "[5/7] Security smoke checks"
bash scripts/security-smoke.sh

echo "[6/7] v1 API smoke checks (ephemeral strict server)"
(
  cd server
  PORT="$PORT" \
  NODE_ENV=production \
  STRICT_AUTH="$STRICT_AUTH" \
  INTERNAL_API_KEY="$INTERNAL_API_KEY" \
  MCP_PROXY_API_KEY="$MCP_PROXY_API_KEY" \
  npm start >"$SERVER_LOG_FILE" 2>&1
) &
SERVER_PID=$!

wait_for_health
BASE_URL="$BASE_URL" bash scripts/smoke-v1.sh

echo "[7/7] Authenticated v1 smoke checks"
if [[ -n "$AUTH_TOKEN" ]]; then
  BASE_URL="$BASE_URL" AUTH_TOKEN="$AUTH_TOKEN" bash scripts/smoke-v1-auth.sh
elif [[ "$REQUIRE_AUTH_SMOKE" == "true" ]]; then
  echo "Authenticated smoke checks are required but AUTH_TOKEN is missing."
  exit 1
else
  echo "Skipping authenticated smoke checks (REQUIRE_AUTH_SMOKE=false)."
fi

echo "Release-candidate checks completed successfully."
