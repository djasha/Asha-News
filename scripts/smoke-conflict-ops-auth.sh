#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
INTERNAL_API_KEY="${INTERNAL_API_KEY:-}"
STRICT_EXPECT="${STRICT_EXPECT:-true}"

echo "== Conflict Ops auth smoke checks =="
echo "BASE_URL=$BASE_URL"
echo "STRICT_EXPECT=$STRICT_EXPECT"

request_code() {
  local method="$1"
  local url="$2"
  local auth="${3:-none}"
  local body="${4:-}"

  local -a args
  args=(-s -o /tmp/conflict_ops_auth_body.json -w "%{http_code}" -X "$method" "$url")

  if [[ "$auth" == "bearer" && -n "$AUTH_TOKEN" ]]; then
    args+=(-H "Authorization: Bearer $AUTH_TOKEN")
  fi

  if [[ "$auth" == "internal" && -n "$INTERNAL_API_KEY" ]]; then
    args+=(-H "X-Internal-Key: $INTERNAL_API_KEY")
  fi

  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi

  curl "${args[@]}"
}

expect_code() {
  local label="$1"
  local got="$2"
  local expected="$3"
  echo "[$label] -> $got (expected $expected)"
  if [[ "$got" != "$expected" ]]; then
    echo "Unexpected status for $label"
    cat /tmp/conflict_ops_auth_body.json || true
    exit 1
  fi
}

expect_not_code() {
  local label="$1"
  local got="$2"
  local forbidden="$3"
  echo "[$label] -> $got (must not be $forbidden)"
  if [[ "$got" == "$forbidden" ]]; then
    echo "Unexpected status for $label"
    cat /tmp/conflict_ops_auth_body.json || true
    exit 1
  fi
}

# Public endpoint should always be reachable.
publicCode=$(request_code GET "$BASE_URL/api/conflicts/stats?conflict=gaza-israel&days=7" none)
expect_code "public_stats" "$publicCode" "200"

# Protected endpoint behavior without auth.
noAuthCode=$(request_code GET "$BASE_URL/api/conflicts/autonomy/status" none)
if [[ "$STRICT_EXPECT" == "true" ]]; then
  expect_not_code "autonomy_status_no_auth" "$noAuthCode" "200"
else
  echo "[autonomy_status_no_auth] -> $noAuthCode (non-strict mode accepted)"
fi

if [[ -n "$AUTH_TOKEN" ]]; then
  authCode=$(request_code GET "$BASE_URL/api/conflicts/autonomy/status" bearer)
  expect_code "autonomy_status_bearer" "$authCode" "200"

  queueCode=$(request_code GET "$BASE_URL/api/conflicts/reviews/queue?limit=5" bearer)
  expect_code "reviews_queue_bearer" "$queueCode" "200"
else
  echo "Skipping bearer checks: AUTH_TOKEN not provided."
fi

if [[ -n "$INTERNAL_API_KEY" ]]; then
  internalCode=$(request_code GET "$BASE_URL/api/conflicts/autonomy/status" internal)
  expect_code "autonomy_status_internal" "$internalCode" "200"

  runCode=$(request_code POST "$BASE_URL/api/conflicts/autonomy/run" internal '{"force":true,"shadowMode":true,"async":true,"maxAgentMs":5000,"maxCycleMs":30000}')
  if [[ "$runCode" != "200" && "$runCode" != "202" ]]; then
    echo "[autonomy_run_internal] -> $runCode (expected 200 or 202)"
    cat /tmp/conflict_ops_auth_body.json || true
    exit 1
  fi
  echo "[autonomy_run_internal] -> $runCode (expected 200 or 202)"
else
  echo "Skipping internal-key checks: INTERNAL_API_KEY not provided."
fi

echo "Conflict Ops auth smoke checks passed."
