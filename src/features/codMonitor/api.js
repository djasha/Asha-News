import { API_SERVER } from '../../config/api';

export const defaultMonitorSettings = Object.freeze({
  conflict: 'all',
  days: 14,
  verification: 'verified',
  sourceTier: 'all',
  limit: 500,
});

const ENDPOINTS = {
  layers: { path: '/api/monitor/layers', retries: 0, critical: true },
  digest: { path: '/api/monitor/news/digest', retries: 1, critical: false },
  fusion: { path: '/api/monitor/signals/fusion', retries: 0, critical: true },
  freshness: { path: '/api/monitor/freshness', retries: 1, critical: false },
  brief: { path: '/api/monitor/intel/brief', retries: 1, critical: false },
};

function buildQuery(settings) {
  const params = new URLSearchParams({
    conflict: settings.conflict,
    days: String(settings.days),
    verification: settings.verification,
    source_tier: settings.sourceTier,
    limit: String(settings.limit),
  });

  return params.toString();
}

async function fetchWithTimeout(url, { signal, timeoutMs = 12000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);

  const onAbort = () => controller.abort(signal?.reason || new Error('aborted'));
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new Error('aborted');
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || `Request failed (${response.status})`);
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}

async function fetchWithRetry(url, { signal, retries = 0, timeoutMs }) {
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      return await fetchWithTimeout(url, { signal, timeoutMs });
    } catch (error) {
      lastError = error;
      if (signal?.aborted) {
        throw error;
      }
      if (attempt >= retries) {
        throw error;
      }
      attempt += 1;
    }
  }

  throw lastError || new Error('Unknown fetch failure');
}

export async function loadMonitorBundlePartial(settings, { signal } = {}) {
  const query = buildQuery(settings);
  const tasks = Object.entries(ENDPOINTS).map(async ([key, config]) => {
    const data = await fetchWithRetry(`${API_SERVER}${config.path}?${query}`, {
      signal,
      retries: config.retries,
      timeoutMs: 12000,
    });
    return { key, data };
  });

  const settled = await Promise.allSettled(tasks);

  const data = {};
  const errors = {};
  let hasCriticalFailure = false;

  settled.forEach((result, index) => {
    const key = Object.keys(ENDPOINTS)[index];
    if (result.status === 'fulfilled') {
      data[key] = result.value.data;
      return;
    }

    errors[key] = result.reason?.message || 'Failed to load monitor panel';
    if (ENDPOINTS[key].critical) {
      hasCriticalFailure = true;
    }
  });

  return {
    data,
    errors,
    hasCriticalFailure,
  };
}

