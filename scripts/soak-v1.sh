#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
DURATION_HOURS="${DURATION_HOURS:-24}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-300}"
MAX_CONSECUTIVE_FAILURES="${MAX_CONSECUTIVE_FAILURES:-3}"
LOG_FILE="${LOG_FILE:-/tmp/asha-v1-soak.log}"
DURATION_SECONDS="${DURATION_SECONDS:-$((DURATION_HOURS * 3600))}"

end_epoch=$(( $(date +%s) + DURATION_SECONDS ))
consecutive_failures=0
passes=0
failures=0

log() {
  local line="$1"
  echo "$line"
  echo "$line" >> "$LOG_FILE"
}

check_endpoint() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /tmp/asha_soak_body.json -w "%{http_code}" "$url" || true)
  if [[ "$code" -ge 200 && "$code" -lt 300 ]]; then
    log "  [$name] $code"
    return 0
  fi
  log "  [$name] FAILED ($code)"
  cat /tmp/asha_soak_body.json >> "$LOG_FILE" 2>/dev/null || true
  echo >> "$LOG_FILE"
  return 1
}

log "== Asha v1 soak check =="
log "BASE_URL=$BASE_URL"
log "DURATION_HOURS=$DURATION_HOURS"
log "DURATION_SECONDS=$DURATION_SECONDS"
log "INTERVAL_SECONDS=$INTERVAL_SECONDS"
log "LOG_FILE=$LOG_FILE"

while [[ "$(date +%s)" -lt "$end_epoch" ]]; do
  ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  log ""
  log "[$ts] cycle start"

  cycle_ok=true
  check_endpoint "health" "$BASE_URL/api/health" || cycle_ok=false
  check_endpoint "openapi" "$BASE_URL/api/v1/openapi" || cycle_ok=false
  check_endpoint "public_digest" "$BASE_URL/api/v1/digest?scope=public&limit=3" || cycle_ok=false
  check_endpoint "clusters_search" "$BASE_URL/api/v1/clusters/search?q=market&limit=3" || cycle_ok=false

  if [[ "$cycle_ok" == true ]]; then
    passes=$((passes + 1))
    consecutive_failures=0
    log "[$ts] cycle result: PASS"
  else
    failures=$((failures + 1))
    consecutive_failures=$((consecutive_failures + 1))
    log "[$ts] cycle result: FAIL (consecutive_failures=$consecutive_failures)"
  fi

  if [[ "$consecutive_failures" -ge "$MAX_CONSECUTIVE_FAILURES" ]]; then
    log ""
    log "Soak check failed: reached $MAX_CONSECUTIVE_FAILURES consecutive failing cycles."
    exit 1
  fi

  sleep "$INTERVAL_SECONDS"
done

log ""
log "Soak check completed."
log "pass_cycles=$passes fail_cycles=$failures"
exit 0
