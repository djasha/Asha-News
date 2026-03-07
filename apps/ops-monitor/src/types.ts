export type MissionControlMode = 'simple' | 'analyst';
export type MissionTheme = 'dark' | 'light';
export type MissionAccentTheme = 'wm-blue' | 'palestine';
export type VerificationMode = 'verified-first' | 'all-sources';
export type MainViewMode = 'Map' | 'Chain' | 'Brief' | 'Suites';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'INFO';
export type VerificationStatus = 'verified' | 'unverified' | 'rejected' | string;
export type TickerKind = 'verified' | 'leak';
export type TickerViewMode = 'all' | 'verified' | 'leak';
export type FeedTabMC = 'feed' | 'whale' | 'flights';

export type FeedItemMC = {
  id: string;
  alert_id: string;
  kind: 'verified' | 'leak';
  title: string;
  summary: string;
  source_name: string;
  source_type: 'telegram' | 'x' | 'news' | 'official' | 'osint' | 'wm-ai' | string;
  severity: SeverityLevel;
  verification_status: VerificationStatus;
  confidence_score: number;
  source_count: number;
  updated_at: string;
  location: string;
  country: string;
  topic: string;
  category: string;
  tags: string[];
  avatar_glyph: string;
  metadata?: Record<string, unknown>;
};

export type FeedFilterCatalogMC = {
  severities: string[];
  source_types: string[];
  topics: string[];
  categories: string[];
  countries: string[];
  verification_statuses: string[];
  time_ranges: string[];
};

export type FeedViewStateMC = {
  cursor: number;
  next_cursor: number | null;
  has_more: boolean;
  total_filtered: number;
};

export type FeedHomeMC = {
  generated_at: string;
  view_mode: string;
  tab_counts: {
    feed: number;
    whale: number;
    flights: number;
  };
  items: FeedItemMC[];
  filters_catalog: FeedFilterCatalogMC;
  source_health: Array<{
    source: string;
    status: string;
    latency_ms: number;
    message?: string;
    updated_at: string;
  }>;
  feature_flags: {
    glint_compat_theme: boolean;
    feed_v2: boolean;
    wm_full_resource_adapters: boolean;
  };
};

export type FeedItemsResponseMC = {
  generated_at: string;
  scope_id: string;
  tab: FeedTabMC;
  items: FeedItemMC[];
  page: FeedViewStateMC;
  filters_applied: {
    severity: string;
    source_type: string[];
    topic: string[];
    category: string[];
    country_filter: string[];
    verification_status: string;
    time_range: string;
    search: string;
  };
  filters_catalog: FeedFilterCatalogMC;
  source_health: Array<{
    source: string;
    status: string;
    latency_ms: number;
    message?: string;
    updated_at: string;
  }>;
};

export type WMResourceCoverageMC = {
  generated_at: string;
  scope_id: string;
  enabled: boolean;
  resources: Array<{
    key: string;
    family: string;
    path: string;
    status: string;
    latency_ms: number;
    error_code: string | null;
    updated_at: string;
    wm_endpoint_version: string;
    cache_ttl_ms: number;
  }>;
  families: Array<{
    family: string;
    total: number;
    ok: number;
    degraded: number;
    circuit_open: number;
  }>;
  feature_flags: {
    glint_compat_theme: boolean;
    feed_v2: boolean;
    wm_full_resource_adapters: boolean;
    direct_social_connectors: boolean;
    uniqueness_pass: boolean;
  };
};

export type MapLayerPackMC = {
  id: string;
  name: string;
  layer_ids: string[];
};

export type SystemHealthCompactMC = {
  platform: 'online' | 'weak' | 'offline';
  sources: 'online' | 'weak' | 'offline';
  ai: 'online' | 'weak' | 'offline';
  dispatch: 'online' | 'weak' | 'offline';
};

export type HazardTypeMC = {
  id: string;
  label: string;
  description: string;
  default_severity: SeverityLevel | string;
  docs_url: string;
  source: string;
  last_verified_at: string;
};

export type SafetyGuideItemMC = {
  id: string;
  incident_type: string;
  title: string;
  summary: string;
  risk_level: string;
  steps: string[];
  self_care: string[];
  provenance: string;
  disclaimer: string;
  last_verified_at: string;
  docs_url: string;
};

export type AudioPreferenceMC = {
  mode: 'silent' | 'vibration-only' | 'tone';
  vibration: boolean;
  severity_profiles: {
    CRITICAL: string;
    HIGH: string;
    ELEVATED: string;
    INFO: string;
  };
};

export type AlertTierPolicyMC = {
  basic: string;
  pro: string;
  critical_delay_allowed: boolean;
  monetization_scope: string;
  rationale: string;
};

export type MissionControlSettings = {
  conflict: string;
  days: number;
  mode: MissionControlMode;
  theme?: MissionTheme;
  accentTheme?: MissionAccentTheme;
  verificationMode: VerificationMode;
  profile: string;
  language?: string;
  country?: string;
};

export type AlertCardMC = {
  id: string;
  event_id: string;
  title: string;
  location: string;
  severity: SeverityLevel;
  confidence_score: number;
  source_count: number;
  updated_at: string;
  verification_status: VerificationStatus;
  source_tier: string;
  summary: string;
  source_name: string;
  hazard_type?: string;
  evidence_pills: string[];
  latitude: number | null;
  longitude: number | null;
  actions: string[];
};

export type MapFallbackSignalMC = {
  id: string;
  label: string;
  summary: string;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
};

export type LeakItemMC = {
  id: string;
  title: string;
  location: string;
  severity: SeverityLevel;
  confidence_score: number;
  source_count: number;
  updated_at: string;
  verification_status: VerificationStatus;
  hazard_type?: string;
  unverified_reason: string;
  risk_warning_level: 'low' | 'medium' | 'high' | string;
  source_name: string;
  summary: string;
  latitude: number | null;
  longitude: number | null;
};

export type TickerItemMC = {
  id: string;
  kind: TickerKind;
  headline: string;
  severity: SeverityLevel;
  location: string;
  confidence_score: number;
  source_count: number;
  updated_at: string;
  verification_status: VerificationStatus;
  hazard_type?: string;
  alert_id: string;
  warning: string | null;
};

export type LayerDescriptorMC = {
  id: string;
  name: string;
  category: 'core' | 'optional' | string;
  default_enabled: boolean;
  description: string;
  source: string;
  update_latency_seconds: number;
  integration_mode: 'integrated' | 'external_fallback' | string;
  external_url?: string;
};

export type MapSessionMC = {
  generated_at: string;
  default_center: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  mode: MissionControlMode;
  default_layer_ids: string[];
  packs: MapLayerPackMC[];
  source_latencies: Array<{
    source: string;
    status: string;
    latency_ms: number;
    updated_at: string;
  }>;
  map_sources: Record<string, unknown>;
};

export type ExplainerMC = {
  id: string;
  group: string;
  title: string;
  anchor: string;
  one_line: string;
  methodology: string;
  docs_url: string;
};

export type PizzIntLocationMC = {
  place_id: string;
  name: string;
  address: string;
  current_popularity: number;
  percentage_of_usual: number;
  is_spike: boolean;
  spike_magnitude: number | null;
  data_source: string;
  recorded_at: string;
  data_freshness: string;
  is_closed_now: boolean;
  lat: number | null;
  lng: number | null;
};

export type PizzIntTensionPairMC = {
  id: string;
  label: string;
  score: number;
  trend: 'rising' | 'stable' | 'falling' | string;
  change_percent: number;
  region: string;
  countries: [string, string];
};

export type PizzIntStatusMC = {
  defcon_level: number;
  defcon_label: string;
  aggregate_activity: number;
  active_spikes: number;
  locations_monitored: number;
  locations_open: number;
  updated_at: string;
  data_freshness: string;
  locations: PizzIntLocationMC[];
  tensions: PizzIntTensionPairMC[];
};

export type SourceSuggestionMC = {
  id: string;
  name: string;
  local_name: string;
  language: string;
  country_scope: string;
  reason: string;
  priority: 'high' | 'medium' | 'low' | string;
  enabled_by_default: boolean;
  url: string;
};

export type WorkspacePresetMC = {
  id: string;
  name: string;
  mode: MissionControlMode;
  description: string;
  layout: {
    modules?: string[];
    quick_actions?: string[];
    right_rail?: boolean;
    leaks_lane_collapsed?: boolean;
  };
  updated_at?: string;
};

export type NotificationPreferenceMC = {
  profile: string;
  channels: {
    push: boolean;
    email: boolean;
    in_app: boolean;
  };
  dispatch: {
    verified_critical_instant: boolean;
    verified_high_instant: boolean;
    elevated_instant: boolean;
    info_digest: boolean;
  };
  digest: {
    enabled: boolean;
    local_time: string;
  };
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  muted_regions: string[];
  muted_topics: string[];
  audio: AudioPreferenceMC;
  updated_at: string;
  dispatch_policy?: {
    critical_verified: string;
    high_verified: string;
    elevated: string;
    info: string;
    channels: {
      in_app: boolean;
      email: boolean;
      push: boolean;
    };
  };
  alert_tier_policy?: AlertTierPolicyMC;
};

export type AlertsInboxMC = {
  generated_at: string;
  critical: AlertCardMC[];
  assigned: AlertCardMC[];
  following: AlertCardMC[];
  resolved: AlertCardMC[];
  unread_total: number;
};

export type AlertActionsStateMC = {
  generated_at?: string;
  acknowledged_alert_ids: string[];
  followed_regions: string[];
  muted_signatures: string[];
};

export type NotificationTelemetryMC = {
  generated_at: string;
  scope_id: string;
  window_hours: number;
  qualification_to_inbox_ms: {
    avg_ms: number;
    p95_ms: number;
    samples: number;
  };
  qualification_to_email_ms: {
    avg_ms: number;
    p95_ms: number;
    samples: number;
  };
  dispatch_success_rate: {
    rate: number;
    sent: number;
    failed: number;
    queued: number;
    total_completed: number;
  };
  action_persistence_errors: number;
  source: string;
};

export type OpsHealthMC = {
  generated_at: string;
  scope_id: string;
  dispatch_worker: {
    enabled: boolean;
    running: boolean;
    worker_id: string;
    interval_ms: number;
    batch_size: number;
    last_started_at: string | null;
    last_stopped_at: string | null;
    last_tick_at: string | null;
    last_tick_completed_at: string | null;
    last_tick_stats: Record<string, unknown> | null;
    last_error: string;
    tick_inflight: boolean;
  };
  dispatch_queue: {
    queued: number;
    processing: number;
    dead_letter: number;
    sent: number;
    lag_ms: number;
  };
  cache: {
    mode: 'memory' | 'redis' | string;
    redis_enabled: boolean;
    home_ttl_ms: number;
    home_stale_ttl_ms: number;
  };
  source_circuit: Array<{
    source: string;
    status: 'open' | 'closed' | string;
    failures: number;
    open_until: string | null;
  }>;
  source_health_recent: Array<{
    source: string;
    status: string;
    latency_ms: number;
    message: string;
    updated_at: string;
  }>;
  recent_failures: Array<{
    queue_id: string;
    provider: string;
    error: string;
    created_at: string;
  }>;
  source: string;
};

export type HomeSnapshotMC = {
  generated_at: string;
  filters: {
    conflict: string;
    days: number;
    mode: MissionControlMode;
    verification_mode: VerificationMode;
  };
  posture: {
    level: 'CRITICAL' | 'ELEVATED' | 'STABLE' | string;
    label: string;
    summary: string;
  };
  freshness: {
    score: number;
    status: string;
    updated_at: string;
  };
  verification: {
    mode: VerificationMode | string;
    label: string;
  };
  map: {
    default_center: {
      latitude: number;
      longitude: number;
      zoom: number;
    };
    event_points: Array<{
      id: string;
      event_date: string;
      location: string;
      latitude: number;
      longitude: number;
      confidence: number;
      source_tier: string;
      fatalities_total: number;
      injured_total: number;
      official_announcement_types?: string[];
    }>;
    location_intensity: Array<{
      location: string;
      hits: number;
      latitude: number;
      longitude: number;
    }>;
    infrastructure_points: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      risk: number;
    }>;
    waterways: Array<{
      id: string;
      name: string;
      points: [number, number][];
      risk: number;
    }>;
    optional_feeds: {
      flight_radar: Array<{
        id: string;
        callsign: string;
        latitude: number;
        longitude: number;
        heading: number;
        speed_kts: number;
        updated_at: string;
      }>;
      maritime_risk: Array<{
        id: string;
        latitude: number;
        longitude: number;
        risk: number;
        corridor: string;
      }>;
      cyber_comms: Array<{
        id: string;
        latitude: number;
        longitude: number;
        impact: string;
        confidence: number;
      }>;
      economic_shocks: Array<{
        id: string;
        latitude: number;
        longitude: number;
        intensity: number;
      }>;
      weather_alerts: Array<{
        id: string;
        latitude: number;
        longitude: number;
        level: string;
        event: string;
      }>;
    };
    sources: {
      flight_radar: {
        mode: string;
        latency_seconds: number;
        source: string;
        external_url: string;
      };
      maritime_risk: {
        mode: string;
        latency_seconds: number;
        source: string;
      };
    };
  };
  critical_now: AlertCardMC[];
  ticker: TickerItemMC[];
  leaks: LeakItemMC[];
  leaks_preview: LeakItemMC[];
  analyst: {
    fusion_score: number;
    confidence_label: string;
    top_gaps: Array<{
      dimension: string;
      signal: string;
      severity: string;
      score: number;
      reasons: string[];
    }>;
    top_locations: Array<{ location: string; hits: number }>;
    top_weapons: Array<{ weapon: string; count: number }>;
    top_technologies: Array<{ technology: string; count: number }>;
    digest: {
      digest_text: string;
      items?: Array<{
        id: string;
        title: string;
        source_name: string;
        source_url?: string;
        score: number;
      }>;
    } | null;
  };
  brief: {
    confidence_label: string;
    non_deterministic_label: string;
    key_findings: string[];
    recommended_actions: Array<{
      priority: string;
      action: string;
      reason: string;
    }>;
  };
  workspace_presets: WorkspacePresetMC[];
  notification_summary: {
    unread_total: number;
    critical_unread: number;
    assigned_unread: number;
    following_unread: number;
  };
  notification_preference: NotificationPreferenceMC;
  pizzint?: PizzIntStatusMC | null;
  source_suggestions?: {
    language: string;
    country: string;
    items: SourceSuggestionMC[];
  };
  source_health?: Array<{
    source: string;
    status: string;
    latency_ms: number;
    message?: string;
    updated_at: string;
  }>;
};
