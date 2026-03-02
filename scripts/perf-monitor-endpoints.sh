#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
CONFLICT="${CONFLICT:-gaza-israel}"
ITERATIONS="${ITERATIONS:-20}"
CURL_TIMEOUT_SECONDS="${CURL_TIMEOUT_SECONDS:-20}"

if ! [[ "${ITERATIONS}" =~ ^[0-9]+$ ]] || [ "${ITERATIONS}" -lt 1 ]; then
  echo "ITERATIONS must be a positive integer" >&2
  exit 1
fi

ENDPOINTS=(
  "/api/monitor/layers?conflict=${CONFLICT}&days=14&verification=verified&limit=400"
  "/api/monitor/news/digest?conflict=${CONFLICT}&days=7&verification=verified&limit=12"
  "/api/monitor/signals/fusion?conflict=${CONFLICT}&days=14&verification=verified&limit=600"
  "/api/monitor/freshness?conflict=${CONFLICT}&days=14"
  "/api/monitor/intel/brief?conflict=${CONFLICT}&days=14&verification=verified"
  "/api/conflicts/stats?conflict=${CONFLICT}&days=14&verification=verified&limit=500"
  "/api/conflicts/signals?conflict=${CONFLICT}&days=14&verification=verified&limit=700"
  "/api/conflicts/intel-gaps?conflict=${CONFLICT}&days=14&verification=all&limit=1200"
)

percentile_from_file() {
  local file="$1"
  local p="$2"
  awk -v pct="${p}" '
    { vals[NR] = $1 }
    END {
      if (NR == 0) { print 0; exit }
      idx = int((pct / 100) * (NR - 1)) + 1
      if (idx < 1) idx = 1
      if (idx > NR) idx = NR
      print vals[idx]
    }
  ' "${file}"
}

now_ms() {
  local raw

  if command -v gdate >/dev/null 2>&1; then
    raw="$(gdate +%s%3N 2>/dev/null || true)"
    if [[ "${raw}" =~ ^[0-9]+$ ]]; then
      echo "${raw}"
      return
    fi
  fi

  raw="$(date +%s%3N 2>/dev/null || true)"
  if [[ "${raw}" =~ ^[0-9]+$ ]]; then
    echo "${raw}"
    return
  fi

  perl -MTime::HiRes=time -e 'printf "%.0f\n", time()*1000'
}

run_endpoint() {
  local endpoint="$1"
  local timings_file
  timings_file="$(mktemp)"
  local ok_count=0
  local fail_count=0

  for _ in $(seq 1 "${ITERATIONS}"); do
    local start_ms end_ms duration status
    start_ms="$(now_ms)"
    status="$(curl -sS -o /dev/null -w "%{http_code}" --max-time "${CURL_TIMEOUT_SECONDS}" "${BASE_URL}${endpoint}" || echo 000)"
    end_ms="$(now_ms)"
    duration=$((end_ms - start_ms))
    echo "${duration}" >> "${timings_file}"

    if [ "${status}" -ge 200 ] && [ "${status}" -lt 300 ]; then
      ok_count=$((ok_count + 1))
    else
      fail_count=$((fail_count + 1))
    fi
  done

  sort -n "${timings_file}" -o "${timings_file}"
  local p50 p95 avg
  p50="$(percentile_from_file "${timings_file}" 50)"
  p95="$(percentile_from_file "${timings_file}" 95)"
  avg="$(awk '{ sum += $1 } END { if (NR == 0) print 0; else printf "%.0f", (sum / NR) }' "${timings_file}")"

  printf "%-64s | %6s | %6s | %6s | %4s/%-4s\n" "${endpoint}" "${avg}" "${p50}" "${p95}" "${ok_count}" "${ITERATIONS}"
  rm -f "${timings_file}"

  if [ "${fail_count}" -gt 0 ]; then
    return 1
  fi
  return 0
}

echo "Monitor endpoint perf sweep"
echo "Base URL: ${BASE_URL}"
echo "Conflict: ${CONFLICT}"
echo "Iterations per endpoint: ${ITERATIONS}"
echo
printf "%-64s | %6s | %6s | %6s | %9s\n" "Endpoint" "avg" "p50" "p95" "2xx/total"
printf "%-64s-+-%6s-+-%6s-+-%6s-+-%9s\n" "----------------------------------------------------------------" "------" "------" "------" "---------"

overall_failures=0
for endpoint in "${ENDPOINTS[@]}"; do
  if ! run_endpoint "${endpoint}"; then
    overall_failures=$((overall_failures + 1))
  fi
done

echo
if [ "${overall_failures}" -gt 0 ]; then
  echo "Perf sweep completed with endpoint errors: ${overall_failures}" >&2
  exit 1
fi

echo "Perf sweep completed successfully."
