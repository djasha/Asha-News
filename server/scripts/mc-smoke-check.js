#!/usr/bin/env node
/* eslint-disable no-console */

const DEFAULT_BASE_URL = process.env.MC_SMOKE_BASE_URL || 'http://127.0.0.1:3001';
const PROFILE = process.env.MC_SMOKE_PROFILE || 'default';
const AUTH_TOKEN = process.env.MC_SMOKE_BEARER || '';
const TIMEOUT_MS = Math.max(1500, Math.min(Number(process.env.MC_SMOKE_TIMEOUT_MS || 12000), 60000));

function authHeaders() {
  if (!AUTH_TOKEN) return {};
  return { Authorization: `Bearer ${AUTH_TOKEN}` };
}

async function fetchJson(pathname) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const response = await fetch(`${DEFAULT_BASE_URL}${pathname}`, {
      headers: {
        Accept: 'application/json',
        ...authHeaders(),
      },
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    const payload = await response.json().catch(() => null);
    return {
      pathname,
      ok: response.ok && payload?.success !== false,
      status: response.status,
      latencyMs,
      payload,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function assertShape(name, result, check) {
  if (!result.ok) {
    throw new Error(`${name} failed: status=${result.status}`);
  }
  if (!check(result.payload?.data)) {
    throw new Error(`${name} payload shape invalid`);
  }
}

async function main() {
  const routes = [
    `/api/mc/home?profile=${encodeURIComponent(PROFILE)}`,
    `/api/mc/alerts/inbox?profile=${encodeURIComponent(PROFILE)}`,
    `/api/mc/hazards/catalog`,
    `/api/mc/safety-guides?profile=${encodeURIComponent(PROFILE)}&incident_type=all`,
    `/api/mc/notifications/telemetry?profile=${encodeURIComponent(PROFILE)}`,
    `/api/mc/ops/health?profile=${encodeURIComponent(PROFILE)}`,
  ];

  const results = [];
  for (const route of routes) {
    results.push(await fetchJson(route));
  }

  assertShape('home', results[0], (data) => Boolean(data?.generated_at && data?.map && Array.isArray(data?.critical_now)));
  assertShape('alerts/inbox', results[1], (data) => Array.isArray(data?.critical) && typeof data?.unread_total === 'number');
  assertShape('hazards/catalog', results[2], (data) => Array.isArray(data?.items));
  assertShape('safety-guides', results[3], (data) => Array.isArray(data?.items));
  assertShape(
    'notifications/telemetry',
    results[4],
    (data) => Boolean(data?.qualification_to_inbox_ms && data?.dispatch_success_rate)
  );
  assertShape('ops/health', results[5], (data) => Boolean(data?.dispatch_worker && data?.dispatch_queue && data?.cache));

  console.log(`Mission Control smoke check against ${DEFAULT_BASE_URL}`);
  results.forEach((item) => {
    console.log(`${item.pathname} -> ${item.status} (${item.latencyMs}ms)`);
  });

  const homeLatency = results[0].latencyMs;
  const inboxLatency = results[1].latencyMs;
  console.log(`home_latency_ms=${homeLatency}`);
  console.log(`inbox_latency_ms=${inboxLatency}`);
}

main().catch((error) => {
  console.error(`Mission Control smoke check failed: ${error.message}`);
  process.exit(1);
});
