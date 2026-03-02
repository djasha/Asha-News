import type {
  MonitorBriefResponse,
  MonitorDigestResponse,
  MonitorFreshnessResponse,
  MonitorFusionResponse,
  MonitorLayerResponse,
  MonitorSettings,
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'http://localhost:3001';

function buildParams(settings: MonitorSettings): string {
  const params = new URLSearchParams({
    conflict: settings.conflict,
    days: String(settings.days),
    verification: settings.verification,
    source_tier: settings.sourceTier,
    limit: String(settings.limit),
  });
  return params.toString();
}

async function fetchJson<T>(pathname: string): Promise<T> {
  const response = await fetch(`${API_BASE}${pathname}`);
  const payload = (await response.json()) as { success?: boolean; data?: T; error?: string };
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload.data as T;
}

export async function loadMonitorBundle(settings: MonitorSettings) {
  const query = buildParams(settings);

  const [layers, digest, fusion, freshness, brief] = await Promise.all([
    fetchJson<MonitorLayerResponse>(`/api/monitor/layers?${query}`),
    fetchJson<MonitorDigestResponse>(`/api/monitor/news/digest?${query}`),
    fetchJson<MonitorFusionResponse>(`/api/monitor/signals/fusion?${query}`),
    fetchJson<MonitorFreshnessResponse>(`/api/monitor/freshness?${query}`),
    fetchJson<MonitorBriefResponse>(`/api/monitor/intel/brief?${query}`),
  ]);

  return { layers, digest, fusion, freshness, brief };
}
