export type MonitorSettings = {
  conflict: string;
  days: number;
  verification: string;
  sourceTier: string;
  limit: number;
};

export type MonitorLayerPoint = {
  id: string;
  event_date: string;
  location: string;
  latitude: number;
  longitude: number;
  confidence: number;
  source_tier: string;
  fatalities_total: number;
  injured_total: number;
};

export type MonitorLocationIntensity = {
  location: string;
  hits: number;
  latitude: number;
  longitude: number;
};

export type MonitorLayerResponse = {
  generated_at: string;
  conflict: string;
  map_hints: {
    default_center: {
      latitude: number;
      longitude: number;
      zoom: number;
    };
  };
  layers: {
    event_points: MonitorLayerPoint[];
    location_intensity: MonitorLocationIntensity[];
    official_announcement_ledger: Array<{
      id: string;
      date: string;
      actor: string;
      text: string;
      source_name?: string;
      source_tier?: string;
    }>;
  };
};

export type MonitorDigestResponse = {
  digest_text: string;
  average_score: number;
  items: Array<{
    id: string;
    title: string;
    source_name: string;
    source_url?: string;
    source_tier: string;
    score: number;
    published_at?: string;
  }>;
};

export type MonitorFusionResponse = {
  fusion_score: number;
  confidence_label: string;
  components: {
    signal_strength: number;
    gap_penalty: number;
    digest_lift: number;
    freshness_score: number;
  };
  top_locations: Array<{ location: string; hits: number }>;
  top_weapons: Array<{ weapon: string; count: number }>;
  top_technologies: Array<{ technology: string; count: number }>;
  top_gaps: Array<{
    dimension: string;
    signal: string;
    severity: string;
    score: number;
    reasons: string[];
  }>;
};

export type MonitorFreshnessResponse = {
  freshness_score: number;
  status: string;
  latest: {
    event_at: string | null;
    verified_event_at: string | null;
    official_announcement_at: string | null;
    news_article_at: string | null;
  };
  age_hours: {
    event: number | null;
    verified_event: number | null;
    news_article: number | null;
  };
};

export type MonitorBriefResponse = {
  non_deterministic_label: string;
  confidence_label: string;
  key_findings: string[];
  recommended_actions: Array<{
    priority: string;
    action: string;
    reason: string;
  }>;
};
