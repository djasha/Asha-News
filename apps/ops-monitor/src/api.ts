import type {
  AlertActionsStateMC,
  AlertsInboxMC,
  ExplainerMC,
  FeedHomeMC,
  FeedItemsResponseMC,
  FeedTabMC,
  FeedFilterCatalogMC,
  HazardTypeMC,
  HomeSnapshotMC,
  LayerDescriptorMC,
  LeakItemMC,
  MapLayerPackMC,
  MapSessionMC,
  MissionControlSettings,
  OpsHealthMC,
  AudioPreferenceMC,
  SafetyGuideItemMC,
  NotificationTelemetryMC,
  NotificationPreferenceMC,
  TickerItemMC,
  WMResourceCoverageMC,
  WorkspacePresetMC,
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'http://localhost:3001';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
};

function resolveAuthToken(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return '';
  const directKeys = [
    'mc_access_token',
    'supabase.access_token',
    'sb-access-token',
    'access_token',
  ];
  for (const key of directKeys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  const sbRaw = localStorage.getItem('supabase.auth.token');
  if (sbRaw) {
    try {
      const parsed = JSON.parse(sbRaw) as {
        currentSession?: { access_token?: string };
        access_token?: string;
      };
      const token = parsed?.currentSession?.access_token || parsed?.access_token || '';
      if (token) return token;
    } catch {
      // Ignore parse error and continue.
    }
  }

  return '';
}

function authHeaders(): Record<string, string> {
  const token = resolveAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function buildParams(settings: MissionControlSettings): string {
  const localeHint = String(
    settings.language && settings.language !== 'auto'
      ? settings.language
      : (typeof navigator !== 'undefined' ? navigator.language : 'en')
  ).trim();
  const localeCountry =
    localeHint.split('-')[1]?.toUpperCase()
    || localeHint.split('_')[1]?.toUpperCase()
    || '';
  const requestedCountry = String(settings.country || '').trim().toUpperCase();
  const countryHint = /^[A-Z]{2}$/.test(requestedCountry)
    ? requestedCountry
    : localeCountry;

  const params = new URLSearchParams({
    conflict: settings.conflict,
    days: String(settings.days),
    mode: settings.mode,
    verification_mode: settings.verificationMode,
    profile: settings.profile,
    lang: localeHint,
  });
  if (/^[A-Z]{2}$/.test(countryHint)) {
    params.set('country', countryHint);
  }
  return params.toString();
}

async function fetchJson<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${pathname}`, {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...authHeaders(),
      ...(init?.headers || {}),
    },
    ...init,
  });
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload.data as T;
}

export async function loadMissionControlBundle(settings: MissionControlSettings) {
  const query = buildParams(settings);

  const [home, inbox, layersCatalog, hazardsCatalog, safetyGuidesPayload, explainersPayload, alertActions, telemetryResult, feedHome, feedItems, wmResources, mapSession, mapLayers] = await Promise.all([
    fetchJson<HomeSnapshotMC>(`/api/mc/home?${query}`),
    fetchJson<AlertsInboxMC>(`/api/mc/alerts/inbox?${query}`),
    fetchJson<{ generated_at: string; items: LayerDescriptorMC[] }>(`/api/mc/layers/catalog`),
    fetchJson<{ generated_at: string; items: HazardTypeMC[] }>(`/api/mc/hazards/catalog`)
      .catch(() => ({ generated_at: new Date().toISOString(), items: [] })),
    fetchJson<{ generated_at: string; incident_type: string; items: SafetyGuideItemMC[] }>(
      `/api/mc/safety-guides?incident_type=all&profile=${encodeURIComponent(settings.profile)}`
    ).catch(() => ({ generated_at: new Date().toISOString(), incident_type: 'all', items: [] })),
    fetchJson<{ generated_at: string; items: ExplainerMC[] }>(`/api/mc/explainers`),
    fetchJson<AlertActionsStateMC>(`/api/mc/alerts/actions?profile=${encodeURIComponent(settings.profile)}`),
    fetchJson<NotificationTelemetryMC>(`/api/mc/notifications/telemetry?profile=${encodeURIComponent(settings.profile)}`)
      .then((data) => data)
      .catch(() => null),
    fetchJson<FeedHomeMC>(`/api/mc/feed/home?${query}`)
      .catch(() => ({
        generated_at: new Date().toISOString(),
        view_mode: 'feed-v1',
        tab_counts: { feed: 0, whale: 0, flights: 0 },
        items: [],
        filters_catalog: {
          severities: ['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'INFO'],
          source_types: [],
          topics: [],
          categories: [],
          countries: [],
          verification_statuses: [],
          time_ranges: ['all', '1h', '6h', '24h', '7d'],
        },
        source_health: [],
        feature_flags: {
          glint_compat_theme: true,
          feed_v2: true,
          wm_full_resource_adapters: false,
        },
      })),
    fetchJson<FeedItemsResponseMC>(`/api/mc/feed/items?${query}&tab=feed&limit=40`)
      .catch(() => ({
        generated_at: new Date().toISOString(),
        scope_id: settings.profile,
        tab: 'feed',
        items: [],
        page: {
          cursor: 0,
          next_cursor: null,
          has_more: false,
          total_filtered: 0,
        },
        filters_applied: {
          severity: 'ALL',
          source_type: [],
          topic: [],
          category: [],
          country_filter: [],
          verification_status: 'all',
          time_range: 'all',
          search: '',
        },
        filters_catalog: {
          severities: ['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'INFO'],
          source_types: [],
          topics: [],
          categories: [],
          countries: [],
          verification_statuses: [],
          time_ranges: ['all', '1h', '6h', '24h', '7d'],
        },
        source_health: [],
      })),
    fetchJson<WMResourceCoverageMC>(`/api/mc/wm/resources?${query}`)
      .catch(() => ({
        generated_at: new Date().toISOString(),
        scope_id: settings.profile,
        enabled: false,
        resources: [],
        families: [],
        feature_flags: {
          glint_compat_theme: true,
          feed_v2: true,
          wm_full_resource_adapters: false,
          direct_social_connectors: false,
          uniqueness_pass: false,
        },
      })),
    fetchJson<MapSessionMC>(`/api/mc/map/session?${query}`)
      .catch(() => ({
        generated_at: new Date().toISOString(),
        default_center: {
          latitude: 31.5,
          longitude: 34.7,
          zoom: 4.9,
        },
        mode: settings.mode,
        default_layer_ids: [],
        packs: [],
        source_latencies: [],
        map_sources: {},
      })),
    fetchJson<{ generated_at: string; mode: string; items: LayerDescriptorMC[]; packs: MapLayerPackMC[]; defaults: string[] }>(
      `/api/mc/map/layers?${query}`
    ).catch(() => ({
      generated_at: new Date().toISOString(),
      mode: settings.mode,
      items: [],
      packs: [],
      defaults: [],
    })),
  ]);

  return {
    home,
    ticker: (home.ticker || []) as TickerItemMC[],
    alertsInbox: inbox,
    leaks: (home.leaks || home.leaks_preview || []) as LeakItemMC[],
    layersCatalog: layersCatalog.items,
    hazardsCatalog: hazardsCatalog.items,
    safetyGuides: safetyGuidesPayload.items,
    explainers: explainersPayload.items,
    notificationPreference: home.notification_preference as NotificationPreferenceMC,
    alertActions,
    notificationTelemetry: telemetryResult,
    feedHome,
    feedItems,
    feedFiltersCatalog: (feedHome?.filters_catalog || feedItems?.filters_catalog || {
      severities: ['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'INFO'],
      source_types: [],
      topics: [],
      categories: [],
      countries: [],
      verification_statuses: [],
      time_ranges: ['all', '1h', '6h', '24h', '7d'],
    }) as FeedFilterCatalogMC,
    wmResources,
    mapSession,
    mapLayerPacks: mapLayers.packs || [],
    mapLayerDefaults: mapLayers.defaults || [],
  };
}

type FeedItemsQuery = {
  settings: MissionControlSettings;
  tab: FeedTabMC;
  cursor?: number;
  limit?: number;
  severity?: string;
  sourceType?: string[];
  topic?: string | string[];
  category?: string | string[];
  countryFilter?: string | string[];
  verificationStatus?: string;
  timeRange?: string;
  search?: string;
};

function encodeMultiValueParam(value?: string | string[]): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item || '').trim()).filter(Boolean);
    return items.join(',');
  }
  return String(value || '').trim();
}

export async function loadMissionControlFeedItems(params: FeedItemsQuery): Promise<FeedItemsResponseMC> {
  const base = new URLSearchParams(buildParams(params.settings));
  base.set('tab', params.tab);
  if (Number.isFinite(params.cursor)) base.set('cursor', String(params.cursor));
  if (Number.isFinite(params.limit)) base.set('limit', String(params.limit));
  if (params.severity) base.set('severity', params.severity);
  if (params.sourceType?.length) base.set('source_type', params.sourceType.join(','));
  const topic = encodeMultiValueParam(params.topic);
  const category = encodeMultiValueParam(params.category);
  const countryFilter = encodeMultiValueParam(params.countryFilter);
  if (topic) base.set('topic', topic);
  if (category) base.set('category', category);
  if (countryFilter) base.set('country_filter', countryFilter);
  if (params.verificationStatus) base.set('verification_status', params.verificationStatus);
  if (params.timeRange) base.set('time_range', params.timeRange);
  if (params.search) base.set('search', params.search);
  return fetchJson<FeedItemsResponseMC>(`/api/mc/feed/items?${base.toString()}`);
}

export async function updateWorkspacePreset(id: string, payload: Partial<WorkspacePresetMC>) {
  return fetchJson<WorkspacePresetMC>(`/api/mc/layouts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateNotificationPreferences(
  profile: string,
  payload: Partial<NotificationPreferenceMC>
) {
  return fetchJson<NotificationPreferenceMC>(
    `/api/mc/notifications/preferences?profile=${encodeURIComponent(profile)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateAlertAudioPreferences(
  profile: string,
  payload: Partial<AudioPreferenceMC> & {
    mode?: 'silent' | 'vibration-only' | 'tone';
    vibration?: boolean;
    severity_profiles?: AudioPreferenceMC['severity_profiles'];
  }
) {
  return fetchJson<NotificationPreferenceMC>(
    `/api/mc/alerts/audio-preferences?profile=${encodeURIComponent(profile)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

export async function postAlertAction(
  action: 'acknowledge' | 'mute-similar' | 'follow-region',
  alertId: string,
  profile: string,
  payload: Record<string, unknown> = {}
) {
  return fetchJson<{
    generated_at: string;
    action: string;
    state: AlertActionsStateMC;
  }>(`/api/mc/alerts/${encodeURIComponent(alertId)}/${action}?profile=${encodeURIComponent(profile)}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loadOpsHealth(profile: string): Promise<OpsHealthMC> {
  return fetchJson<OpsHealthMC>(`/api/mc/ops/health?profile=${encodeURIComponent(profile)}`);
}
