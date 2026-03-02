#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
INTERNAL_API_KEY="${INTERNAL_API_KEY:-}"
AUTO_VERIFY="${AUTO_VERIFY:-false}"
VERIFY_LIMIT="${VERIFY_LIMIT:-5}"

HOURS_BACK="${HOURS_BACK:-72}"
MIN_PER_CATEGORY="${MIN_PER_CATEGORY:-4}"
MAX_FEEDS="${MAX_FEEDS:-6}"
INGEST_LIMIT="${INGEST_LIMIT:-300}"
MIN_CONFIDENCE="${MIN_CONFIDENCE:-0.25}"
CURL_TIMEOUT_SECONDS="${CURL_TIMEOUT_SECONDS:-180}"
RSS_INGEST_TIMEOUT_SECONDS="${RSS_INGEST_TIMEOUT_SECONDS:-60}"
RSS_BOOTSTRAP_MODE="${RSS_BOOTSTRAP_MODE:-auto}" # auto|always|never
RSS_REQUIRED="${RSS_REQUIRED:-false}"
MIN_ARTICLES_BEFORE_RSS="${MIN_ARTICLES_BEFORE_RSS:-10}"

echo "== Conflict Ops functional smoke =="
echo "BASE_URL=$BASE_URL"
echo "AUTO_VERIFY=$AUTO_VERIFY"
echo "RSS_BOOTSTRAP_MODE=$RSS_BOOTSTRAP_MODE"

declare -a AUTH_ARGS=()
if [[ -n "$INTERNAL_API_KEY" ]]; then
  AUTH_ARGS=(-H "X-Internal-Key: $INTERNAL_API_KEY")
  echo "Using internal-key auth header."
fi

curl_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local timeout="${4:-$CURL_TIMEOUT_SECONDS}"
  local -a args
  args=(-sS -m "$timeout" -X "$method" "$url")
  if [[ "${#AUTH_ARGS[@]}" -gt 0 ]]; then
    args+=("${AUTH_ARGS[@]}")
  fi
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi
  curl "${args[@]}"
}

is_true() {
  [[ "$1" == "true" || "$1" == "1" || "$1" == "yes" ]]
}

BOOTSTRAP_ARTICLES_PAYLOAD=$(curl_json GET "$BASE_URL/api/articles?limit=1" "" 20 || echo "{}")
BOOTSTRAP_ARTICLES_TOTAL=$(echo "$BOOTSTRAP_ARTICLES_PAYLOAD" | jq -r '.pagination.total // 0' 2>/dev/null || echo "0")

RUN_RSS_BOOTSTRAP=false
case "$RSS_BOOTSTRAP_MODE" in
  always)
    RUN_RSS_BOOTSTRAP=true
    ;;
  never)
    RUN_RSS_BOOTSTRAP=false
    ;;
  auto)
    if [[ "$BOOTSTRAP_ARTICLES_TOTAL" =~ ^[0-9]+$ ]] && (( BOOTSTRAP_ARTICLES_TOTAL < MIN_ARTICLES_BEFORE_RSS )); then
      RUN_RSS_BOOTSTRAP=true
    fi
    ;;
  *)
    echo "Invalid RSS_BOOTSTRAP_MODE: $RSS_BOOTSTRAP_MODE (expected auto|always|never)"
    exit 1
    ;;
esac

if is_true "$RUN_RSS_BOOTSTRAP"; then
  set +e
  RSS_PAYLOAD=$(curl_json POST "$BASE_URL/api/rss-processing/ingest-from-content" \
    "{\"hours_back\":$HOURS_BACK,\"min_per_category\":$MIN_PER_CATEGORY,\"max_feeds\":$MAX_FEEDS}" \
    "$RSS_INGEST_TIMEOUT_SECONDS" 2>&1)
  RSS_STATUS=$?
  set -e

  if [[ "$RSS_STATUS" -ne 0 ]]; then
    echo "RSS ingest request failed or timed out (status=$RSS_STATUS)."
    echo "$RSS_PAYLOAD"
    if is_true "$RSS_REQUIRED"; then
      echo "RSS_REQUIRED=true, failing smoke."
      exit 1
    fi
    echo "Continuing because RSS_REQUIRED=false."
  else
    RSS_SUCCESS=$(echo "$RSS_PAYLOAD" | jq -r '.success // false')
    if ! is_true "$RSS_SUCCESS"; then
      echo "RSS ingest returned non-success payload:"
      echo "$RSS_PAYLOAD"
      if is_true "$RSS_REQUIRED"; then
        echo "RSS_REQUIRED=true, failing smoke."
        exit 1
      fi
      echo "Continuing because RSS_REQUIRED=false."
    else
      RSS_PROCESSED=$(echo "$RSS_PAYLOAD" | jq -r '.processed_feeds // 0')
      echo "RSS ingest ok: processed_feeds=$RSS_PROCESSED"
    fi
  fi
else
  echo "Skipping RSS bootstrap (mode=$RSS_BOOTSTRAP_MODE, existing_articles=$BOOTSTRAP_ARTICLES_TOTAL)."
fi

CONFLICT_PAYLOAD=$(curl_json POST "$BASE_URL/api/conflicts/ingest/from-articles" \
  "{\"limit\":$INGEST_LIMIT,\"dryRun\":false,\"minConfidence\":$MIN_CONFIDENCE,\"conflict\":\"all\"}")
CONFLICT_SUCCESS=$(echo "$CONFLICT_PAYLOAD" | jq -r '.success // false')
if ! is_true "$CONFLICT_SUCCESS"; then
  echo "Conflict ingest failed:"
  echo "$CONFLICT_PAYLOAD"
  exit 1
fi
SCANNED=$(echo "$CONFLICT_PAYLOAD" | jq -r '.data.scanned_articles // 0')
CANDIDATES=$(echo "$CONFLICT_PAYLOAD" | jq -r '.data.candidate_events // 0')
CREATED=$(echo "$CONFLICT_PAYLOAD" | jq -r '.data.created_events // 0')
echo "Conflict ingest ok: scanned=$SCANNED candidates=$CANDIDATES created=$CREATED"

QUEUE_PAYLOAD=$(curl_json GET "$BASE_URL/api/conflicts/reviews/queue?limit=$VERIFY_LIMIT")
QUEUE_SUCCESS=$(echo "$QUEUE_PAYLOAD" | jq -r '.success // false')
QUEUE_TOTAL=$(echo "$QUEUE_PAYLOAD" | jq -r '.total // 0')
if is_true "$QUEUE_SUCCESS"; then
  echo "Review queue visible: total=$QUEUE_TOTAL"
else
  echo "Review queue unavailable without privileged auth."
  if is_true "$AUTO_VERIFY"; then
    echo "AUTO_VERIFY=true requires queue access; provide INTERNAL_API_KEY or disable AUTO_VERIFY."
    exit 1
  fi
fi

if is_true "$AUTO_VERIFY"; then
  IDS=$(echo "$QUEUE_PAYLOAD" | jq -r '.data[].id' | head -n "$VERIFY_LIMIT")
  if [[ -n "$IDS" ]]; then
    while IFS= read -r id; do
      [[ -n "$id" ]] || continue
      REVIEW_PAYLOAD=$(curl_json POST "$BASE_URL/api/conflicts/reviews/$id" \
        '{"action":"verify","reason":"functional smoke validation"}')
      REVIEW_SUCCESS=$(echo "$REVIEW_PAYLOAD" | jq -r '.success // false')
      if ! is_true "$REVIEW_SUCCESS"; then
        echo "Review action failed for eventId=$id"
        echo "$REVIEW_PAYLOAD"
        exit 1
      fi
    done <<< "$IDS"
    echo "Auto-verified up to $VERIFY_LIMIT queue items."
  else
    echo "No review items to auto-verify."
  fi
fi

ARTICLES_PAYLOAD=$(curl_json GET "$BASE_URL/api/articles?limit=20")
ARTICLES_TOTAL=$(echo "$ARTICLES_PAYLOAD" | jq -r '.pagination.total // 0')
echo "Articles total=$ARTICLES_TOTAL"

STATS_VERIFIED=$(curl_json GET "$BASE_URL/api/conflicts/stats")
STATS_ALL=$(curl_json GET "$BASE_URL/api/conflicts/stats?verification=all")
RELATED=$(curl_json GET "$BASE_URL/api/conflicts/related-news?verification=all&limit=10")

VERIFIED_EVENTS=$(echo "$STATS_VERIFIED" | jq -r '.data.totals.events // 0')
ALL_EVENTS=$(echo "$STATS_ALL" | jq -r '.data.totals.events // 0')
RELATED_COUNT=$(echo "$RELATED" | jq -r '.data.items | length')

echo "Verified totals events=$VERIFIED_EVENTS"
echo "All totals events=$ALL_EVENTS"
echo "Related-news items=$RELATED_COUNT"
echo "Conflict Ops functional smoke checks passed."
