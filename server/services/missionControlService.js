const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const conflictAnalyticsService = require('./conflictAnalyticsService');
const queryBridge = require('../db/queryBridge');
const { getPool, isUsingSupabase } = require('../db');
const logger = require('../utils/logger');

let nodemailer = null;
try {
  // Optional in local/dev until SMTP credentials are provided.
  // eslint-disable-next-line global-require
  nodemailer = require('nodemailer');
} catch {
  nodemailer = null;
}

const STATE_DIR = path.join(__dirname, '../data');
const STATE_FILE = path.join(STATE_DIR, 'mission-control-state.json');

const DEFAULT_STATE = Object.freeze({
  layouts: {},
  notification_preferences: {},
  followed_regions: {},
  muted_rules: {},
  alert_actions: {},
});

const DEFAULT_LAYOUT_PRESETS = Object.freeze([
  {
    id: 'public-briefing',
    name: 'Public Briefing',
    mode: 'simple',
    description: 'Minimal tactical layout for broad audience briefing.',
    layout: {
      modules: ['map', 'critical-now', 'ticker'],
      quick_actions: ['Critical', 'Verified', 'Brief'],
      right_rail: true,
      leaks_lane_collapsed: true,
    },
  },
  {
    id: 'ops-commander',
    name: 'Ops Commander',
    mode: 'simple',
    description: 'Map-first command posture with persistent critical rail.',
    layout: {
      modules: ['map', 'critical-now', 'ticker', 'notifications'],
      quick_actions: ['Critical', 'Near Me', 'Verified', 'Leaks', 'Brief'],
      right_rail: true,
      leaks_lane_collapsed: true,
    },
  },
  {
    id: 'analyst',
    name: 'Analyst',
    mode: 'analyst',
    description: 'High-density overlays and deeper signal tables.',
    layout: {
      modules: ['map', 'critical-now', 'ticker', 'notifications', 'analyst-stack', 'leaks'],
      quick_actions: ['Critical', 'Near Me', 'Verified', 'Leaks', 'Brief'],
      right_rail: true,
      leaks_lane_collapsed: false,
    },
  },
  {
    id: 'mobile-rapid',
    name: 'Mobile Rapid',
    mode: 'simple',
    description: 'Compact map + sheet layout optimized for mobile rapid triage.',
    layout: {
      modules: ['map', 'critical-now', 'ticker', 'notifications', 'leaks'],
      quick_actions: ['Critical', 'Verified', 'Leaks'],
      right_rail: false,
      leaks_lane_collapsed: true,
    },
  },
]);

const DEFAULT_NOTIFICATION_PREFERENCE = Object.freeze({
  profile: 'default',
  channels: {
    push: true,
    email: true,
    in_app: true,
  },
  dispatch: {
    verified_critical_instant: true,
    verified_high_instant: false,
    elevated_instant: false,
    info_digest: true,
  },
  digest: {
    enabled: true,
    local_time: '09:00',
  },
  quiet_hours: {
    enabled: false,
    start: '23:00',
    end: '06:00',
  },
  muted_regions: [],
  muted_topics: [],
  audio: {
    mode: 'tone',
    vibration: true,
    severity_profiles: {
      CRITICAL: 'alarm-critical',
      HIGH: 'tone-high',
      ELEVATED: 'tone-elevated',
      INFO: 'tone-info',
    },
  },
  updated_at: new Date(0).toISOString(),
});

const LAYERS_CATALOG = Object.freeze([
  {
    id: 'conflict-zones',
    name: 'Conflict Zones',
    category: 'core',
    default_enabled: true,
    description: 'Intensity columns from verified and near-verified event density.',
    source: 'Mission Control aggregation',
    update_latency_seconds: 180,
    integration_mode: 'integrated',
  },
  {
    id: 'critical-infrastructure',
    name: 'Critical Infrastructure',
    category: 'core',
    default_enabled: true,
    description: 'Strategic energy, port, and logistics nodes with risk context.',
    source: 'Mission Control infrastructure model',
    update_latency_seconds: 3600,
    integration_mode: 'integrated',
  },
  {
    id: 'verified-hotspots',
    name: 'Verified Hotspots',
    category: 'core',
    default_enabled: true,
    description: 'Geo events that passed verification-first filters.',
    source: 'Conflict event verification stream',
    update_latency_seconds: 180,
    integration_mode: 'integrated',
  },
  {
    id: 'strategic-waterways',
    name: 'Strategic Waterways',
    category: 'core',
    default_enabled: true,
    description: 'High-impact maritime corridors and chokepoint watch lines.',
    source: 'Maritime strategic overlay',
    update_latency_seconds: 900,
    integration_mode: 'integrated',
  },
  {
    id: 'weather-alerts',
    name: 'Key Weather Alerts',
    category: 'core',
    default_enabled: true,
    description: 'Operational weather alerts in monitored regions.',
    source: 'Weather risk model',
    update_latency_seconds: 900,
    integration_mode: 'integrated',
  },
  {
    id: 'flight-radar',
    name: 'Flight Radar',
    category: 'optional',
    default_enabled: true,
    description: 'Flight movement overlay where licensing allows integrated display.',
    source: 'Flight feed connector',
    update_latency_seconds: 60,
    integration_mode: 'external_fallback',
    external_url: 'https://www.flightradar24.com/',
  },
  {
    id: 'maritime-risk',
    name: 'Maritime Risk',
    category: 'optional',
    default_enabled: false,
    description: 'Shipping corridor disruptions and elevated maritime risk points.',
    source: 'Maritime risk connector',
    update_latency_seconds: 300,
    integration_mode: 'integrated',
  },
  {
    id: 'cyber-comms',
    name: 'Cyber / Comms Disruptions',
    category: 'optional',
    default_enabled: false,
    description: 'Cyber incidents and communications disruption markers.',
    source: 'Cyber signal overlay',
    update_latency_seconds: 300,
    integration_mode: 'integrated',
  },
  {
    id: 'economic-shocks',
    name: 'Economic Shock Markers',
    category: 'optional',
    default_enabled: false,
    description: 'Macro or local shocks with potential operational spillover.',
    source: 'Economic signal model',
    update_latency_seconds: 900,
    integration_mode: 'integrated',
  },
]);

function getDefaultLayersByMode(mode = 'simple') {
  const normalized = normalizeMode(mode);
  if (normalized === 'analyst') {
    return LAYERS_CATALOG.map((layer) => layer.id);
  }
  return LAYERS_CATALOG
    .filter((layer) => layer.default_enabled || layer.category === 'core')
    .map((layer) => layer.id);
}

const EXPLAINERS = Object.freeze([
  {
    id: 'posture-chip',
    group: 'command',
    title: 'Global Posture',
    anchor: 'posture-chip',
    one_line: 'Summarizes current operating posture from fusion, freshness, and severity mix.',
    methodology: 'Uses weighted fusion score and unresolved critical volume.',
    docs_url: '/docs/mission-control#posture-chip',
  },
  {
    id: 'verification-filter',
    group: 'command',
    title: 'Verification Filter',
    anchor: 'verification-filter',
    one_line: 'Controls whether views prioritize verified intelligence only.',
    methodology: 'Verified-first suppresses unverified items from critical dispatch.',
    docs_url: '/docs/mission-control#verification-filter',
  },
  {
    id: 'severity-filter',
    group: 'controls',
    title: 'Severity Filter',
    anchor: 'severity-filter',
    one_line: 'Filters cards and overlays by operational severity.',
    methodology: 'Severity is derived from verification state, impact, and confidence.',
    docs_url: '/docs/mission-control#severity-filter',
  },
  {
    id: 'flight-layer',
    group: 'layers',
    title: 'Flight Layer',
    anchor: 'flight-layer',
    one_line: 'Shows air traffic overlays or external radar fallback when needed.',
    methodology: 'Displays source and latency with explicit licensing fallback.',
    docs_url: '/docs/mission-control#flight-layer',
  },
  {
    id: 'maritime-layer',
    group: 'layers',
    title: 'Maritime Layer',
    anchor: 'maritime-layer',
    one_line: 'Highlights maritime chokepoints and risk markers.',
    methodology: 'Risk score combines corridor density and recent incident proximity.',
    docs_url: '/docs/mission-control#maritime-layer',
  },
  {
    id: 'leaks-lane',
    group: 'leaks',
    title: 'Leaks / Unverified Intel',
    anchor: 'leaks-lane',
    one_line: 'Separate lane for unverified intelligence and leak reporting.',
    methodology: 'Never auto-escalated to critical dispatch without verification.',
    docs_url: '/docs/mission-control#leaks-lane',
  },
  {
    id: 'confidence-model',
    group: 'models',
    title: 'Confidence & Predictive Model',
    anchor: 'confidence-model',
    one_line: 'Confidence cues indicate reliability of current modelled signal state.',
    methodology: 'Combines verification share, freshness, source tiers, and recency.',
    docs_url: '/docs/mission-control#confidence-model',
  },
  {
    id: 'dispatch-policy',
    group: 'alerts',
    title: 'Dispatch Policy',
    anchor: 'dispatch-policy',
    one_line: 'Defines which severities dispatch instantly versus digest-only by channel.',
    methodology: 'Verified CRITICAL defaults to instant in-app and email; lower severities follow digest unless opted in.',
    docs_url: '/docs/mission-control#dispatch-policy',
  },
  {
    id: 'notification-slo',
    group: 'alerts',
    title: 'Notification SLO',
    anchor: 'notification-slo',
    one_line: 'Tracks qualification-to-inbox and qualification-to-email delivery latency.',
    methodology: 'SLO metrics are computed from alert qualification timestamps and dispatch queue outcomes.',
    docs_url: '/docs/mission-control#notification-slo',
  },
]);

const HAZARD_CATALOG = Object.freeze([
  {
    id: 'rocket-missile',
    label: 'Rocket / Missile',
    description: 'Incoming rocket or missile activity requiring immediate protective action.',
    default_severity: 'CRITICAL',
    docs_url: '/docs/mission-control#hazard-rocket-missile',
    source: 'Mission Control safety protocol',
    last_verified_at: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'drone',
    label: 'Drone Threat',
    description: 'Potential hostile drone activity with variable response window.',
    default_severity: 'HIGH',
    docs_url: '/docs/mission-control#hazard-drone',
    source: 'Mission Control safety protocol',
    last_verified_at: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'earthquake',
    label: 'Earthquake',
    description: 'Seismic event with aftershock risk and infrastructure disruption.',
    default_severity: 'HIGH',
    docs_url: '/docs/mission-control#hazard-earthquake',
    source: 'Mission Control safety protocol',
    last_verified_at: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'chemical-nuclear',
    label: 'Chemical / Nuclear Incident',
    description: 'High-consequence contamination or radiological threat.',
    default_severity: 'CRITICAL',
    docs_url: '/docs/mission-control#hazard-chemical-nuclear',
    source: 'Mission Control safety protocol',
    last_verified_at: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'civil-unrest',
    label: 'Civil Unrest',
    description: 'Public disorder events, rapid route changes, and crowd risk.',
    default_severity: 'ELEVATED',
    docs_url: '/docs/mission-control#hazard-civil-unrest',
    source: 'Mission Control safety protocol',
    last_verified_at: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'cyber-comms',
    label: 'Cyber / Comms Disruption',
    description: 'Cyber events or outages that degrade communication channels.',
    default_severity: 'ELEVATED',
    docs_url: '/docs/mission-control#hazard-cyber-comms',
    source: 'Mission Control safety protocol',
    last_verified_at: '2026-03-05T00:00:00.000Z',
  },
]);

const SAFETY_GUIDES = Object.freeze([
  {
    id: 'guide-rocket-missile',
    incident_type: 'rocket-missile',
    title: 'Rocket / Missile Immediate Action',
    summary: 'Move to nearest protected shelter immediately and stay until official all-clear.',
    risk_level: 'critical',
    steps: [
      'Move to reinforced shelter immediately; do not wait to gather items.',
      'Stay away from windows, glass, and exterior walls.',
      'Keep phone line open for official instructions only.',
    ],
    self_care: [
      'Use controlled breathing: inhale 4s, hold 4s, exhale 4s.',
      'Assign one person to monitor updates to reduce stress overload.',
    ],
    provenance: 'Curated from civil-defense public guidance and Mission Control risk policy.',
    disclaimer: 'Informational guidance only; always follow local official instructions.',
    last_verified_at: '2026-03-05T00:00:00.000Z',
    docs_url: '/docs/mission-control#guide-rocket-missile',
  },
  {
    id: 'guide-drone',
    incident_type: 'drone',
    title: 'Drone Threat Response',
    summary: 'Seek overhead cover and reduce exposed movement in open areas.',
    risk_level: 'high',
    steps: [
      'Move under solid overhead cover or into enclosed structure.',
      'Avoid gathering in open rooftops, roads, or courtyards.',
      'Track official updates before changing location again.',
    ],
    self_care: [
      'Keep communication short and role-based: location, status, next action.',
    ],
    provenance: 'Curated from open civil defense advisories and Mission Control guidance.',
    disclaimer: 'Informational guidance only; follow verified local authority instructions.',
    last_verified_at: '2026-03-05T00:00:00.000Z',
    docs_url: '/docs/mission-control#guide-drone',
  },
  {
    id: 'guide-earthquake',
    incident_type: 'earthquake',
    title: 'Earthquake Safety Actions',
    summary: 'Drop, cover, and hold on. Expect aftershocks and secondary hazards.',
    risk_level: 'high',
    steps: [
      'Drop, cover, and hold until shaking stops.',
      'After shaking, move to safer open area if structure is compromised.',
      'Avoid elevators and check gas/electrical hazards.',
    ],
    self_care: [
      'Do quick team check-ins and hydration once immediate danger drops.',
    ],
    provenance: 'Curated from public earthquake emergency guidance and Mission Control policy.',
    disclaimer: 'Informational guidance only; follow local emergency authority instructions.',
    last_verified_at: '2026-03-05T00:00:00.000Z',
    docs_url: '/docs/mission-control#guide-earthquake',
  },
  {
    id: 'guide-chemical-nuclear',
    incident_type: 'chemical-nuclear',
    title: 'Chemical / Radiological Protective Steps',
    summary: 'Shelter indoors, seal openings, and limit contamination exposure.',
    risk_level: 'critical',
    steps: [
      'Move indoors immediately and close doors/windows/vents if possible.',
      'Use available masks or cloth barriers; avoid contact with unknown residue.',
      'Wait for verified official decontamination and movement instructions.',
    ],
    self_care: [
      'Limit rumor spread by assigning one verified information source.',
    ],
    provenance: 'Curated from public emergency preparedness guidance and Mission Control policy.',
    disclaimer: 'Informational guidance only; official emergency directives take priority.',
    last_verified_at: '2026-03-05T00:00:00.000Z',
    docs_url: '/docs/mission-control#guide-chemical-nuclear',
  },
  {
    id: 'guide-civil-unrest',
    incident_type: 'civil-unrest',
    title: 'Civil Unrest Route Safety',
    summary: 'Avoid crowd pinch points and maintain clear exit options.',
    risk_level: 'elevated',
    steps: [
      'Avoid chokepoints, intersections, and known flashpoint routes.',
      'Use low-profile movement and keep alternate route options open.',
      'Follow verified transport and local authority updates.',
    ],
    self_care: [
      'Use short rest cycles and hydration reminders to reduce decision fatigue.',
    ],
    provenance: 'Curated from public safety travel advisories and Mission Control policy.',
    disclaimer: 'Informational guidance only; local authority instructions override this guide.',
    last_verified_at: '2026-03-05T00:00:00.000Z',
    docs_url: '/docs/mission-control#guide-civil-unrest',
  },
  {
    id: 'guide-default',
    incident_type: 'general',
    title: 'General Crisis Checklist',
    summary: 'Keep movement intentional, verify source quality, and preserve communication.',
    risk_level: 'info',
    steps: [
      'Confirm event verification status and confidence before major decisions.',
      'Keep emergency contacts and nearest safe-location options ready.',
      'Monitor updates from verified official channels.',
    ],
    self_care: [
      'Reduce panic exposure by limiting unverified feed consumption.',
    ],
    provenance: 'Mission Control baseline crisis guidance.',
    disclaimer: 'Informational guidance only; official local instructions take priority.',
    last_verified_at: '2026-03-05T00:00:00.000Z',
    docs_url: '/docs/mission-control#guide-general',
  },
]);

const SEVERITY_ORDER = Object.freeze({
  CRITICAL: 4,
  HIGH: 3,
  ELEVATED: 2,
  INFO: 1,
});

const LOCATION_COORDS = Object.freeze({
  Gaza: { latitude: 31.5017, longitude: 34.4668 },
  Rafah: { latitude: 31.2969, longitude: 34.2439 },
  'Khan Younis': { latitude: 31.3465, longitude: 34.3036 },
  Dahieh: { latitude: 33.8616, longitude: 35.5018 },
  Qatar: { latitude: 25.276987, longitude: 51.520008 },
  Doha: { latitude: 25.2854, longitude: 51.531 },
  'Tel Aviv': { latitude: 32.0853, longitude: 34.7818 },
  Jerusalem: { latitude: 31.7683, longitude: 35.2137 },
  Haifa: { latitude: 32.794, longitude: 34.9896 },
  Tehran: { latitude: 35.6892, longitude: 51.389 },
  Damascus: { latitude: 33.5138, longitude: 36.2765 },
  Beirut: { latitude: 33.8938, longitude: 35.5018 },
  Baghdad: { latitude: 33.3152, longitude: 44.3661 },
  'Suez Canal': { latitude: 30.1735, longitude: 32.5498 },
  'Bab el-Mandeb': { latitude: 12.5856, longitude: 43.3333 },
  'Strait of Hormuz': { latitude: 26.5667, longitude: 56.25 },
});

const COUNTRY_CODE_COORDS = Object.freeze({
  US: { latitude: 37.09, longitude: -95.71 },
  CA: { latitude: 56.13, longitude: -106.35 },
  MX: { latitude: 23.63, longitude: -102.55 },
  RU: { latitude: 61.52, longitude: 105.32 },
  CN: { latitude: 35.86, longitude: 104.2 },
  JP: { latitude: 36.2, longitude: 138.25 },
  IN: { latitude: 20.59, longitude: 78.96 },
  PK: { latitude: 30.38, longitude: 69.35 },
  AF: { latitude: 33.94, longitude: 67.71 },
  AE: { latitude: 23.42, longitude: 53.84 },
  KW: { latitude: 29.31, longitude: 47.48 },
  BH: { latitude: 25.93, longitude: 50.64 },
  QA: { latitude: 25.35, longitude: 51.18 },
  OM: { latitude: 21.47, longitude: 55.98 },
  UA: { latitude: 48.38, longitude: 31.17 },
  IL: { latitude: 31.05, longitude: 34.85 },
  IR: { latitude: 32.43, longitude: 53.69 },
  SY: { latitude: 34.8, longitude: 38.997 },
  YE: { latitude: 15.55, longitude: 48.52 },
  LB: { latitude: 33.85, longitude: 35.86 },
  JO: { latitude: 30.59, longitude: 36.24 },
  SA: { latitude: 23.89, longitude: 45.08 },
  EG: { latitude: 26.82, longitude: 30.8 },
  IQ: { latitude: 33.22, longitude: 43.68 },
  PS: { latitude: 31.95, longitude: 35.23 },
  TR: { latitude: 38.96, longitude: 35.24 },
  FR: { latitude: 46.23, longitude: 2.21 },
  DE: { latitude: 51.17, longitude: 10.45 },
  IT: { latitude: 41.87, longitude: 12.57 },
  ES: { latitude: 40.46, longitude: -3.75 },
  GB: { latitude: 55.37, longitude: -3.43 },
  PA: { latitude: 8.54, longitude: -80.78 },
});

const COUNTRY_NAME_TO_CODE = Object.freeze({
  'united states': 'US',
  usa: 'US',
  america: 'US',
  alaska: 'US',
  canada: 'CA',
  mexico: 'MX',
  uk: 'GB',
  'united kingdom': 'GB',
  britain: 'GB',
  england: 'GB',
  france: 'FR',
  germany: 'DE',
  italy: 'IT',
  spain: 'ES',
  russia: 'RU',
  japan: 'JP',
  india: 'IN',
  pakistan: 'PK',
  afghanistan: 'AF',
  ukraine: 'UA',
  china: 'CN',
  israel: 'IL',
  iran: 'IR',
  bahrain: 'BH',
  kuwait: 'KW',
  uae: 'AE',
  'united arab emirates': 'AE',
  oman: 'OM',
  panama: 'PA',
  lebanon: 'LB',
  gaza: 'PS',
  palestine: 'PS',
  syria: 'SY',
  yemen: 'YE',
  jordan: 'JO',
  turkey: 'TR',
  egypt: 'EG',
  iraq: 'IQ',
  qatar: 'QA',
  'saudi arabia': 'SA',
});

const DEFCON_LABELS = Object.freeze({
  1: 'Maximum Alert',
  2: 'Severe Escalation',
  3: 'Elevated Activity',
  4: 'Guarded Activity',
  5: 'Normal Activity',
});

const SOURCE_SUGGESTION_CATALOG = Object.freeze([
  {
    id: 'wm-news-en',
    name: 'World Monitor News Digest',
    local_name: 'World Monitor News Digest',
    language: 'en',
    country_scope: 'global',
    reason: 'Broad verified coverage for global monitoring.',
    priority: 'high',
    enabled_by_default: true,
    url: 'https://wm.asha.news/api/news/v1/list-feed-digest?variant=full&lang=en',
  },
  {
    id: 'wm-news-ar',
    name: 'World Monitor News Digest',
    local_name: 'ملخص أخبار وورلد مونيتور',
    language: 'ar',
    country_scope: 'mena',
    reason: 'Better Arabic signal recall for MENA monitoring.',
    priority: 'high',
    enabled_by_default: true,
    url: 'https://wm.asha.news/api/news/v1/list-feed-digest?variant=full&lang=ar',
  },
  {
    id: 'wm-news-es',
    name: 'World Monitor News Digest',
    local_name: 'Resumen de noticias World Monitor',
    language: 'es',
    country_scope: 'latam',
    reason: 'Spanish coverage for LATAM and bilingual users.',
    priority: 'medium',
    enabled_by_default: true,
    url: 'https://wm.asha.news/api/news/v1/list-feed-digest?variant=full&lang=es',
  },
  {
    id: 'wm-telegram',
    name: 'World Monitor Telegram Feed',
    local_name: 'تلغرام وورلد مونيتور',
    language: 'multi',
    country_scope: 'global',
    reason: 'Early signal stream, separated as unverified leaks.',
    priority: 'medium',
    enabled_by_default: true,
    url: 'https://wm.asha.news/api/telegram-feed',
  },
  {
    id: 'wm-oref',
    name: 'OREF Alerts',
    local_name: 'تنبيهات الجبهة الداخلية',
    language: 'he',
    country_scope: 'IL',
    reason: 'Official civil defense alerts for Israel.',
    priority: 'high',
    enabled_by_default: true,
    url: 'https://wm.asha.news/api/oref-alerts',
  },
  {
    id: 'wm-pizzint',
    name: 'PizzINT Status',
    local_name: 'مؤشر بيتزا',
    language: 'multi',
    country_scope: 'global',
    reason: 'DEFCON-style activity heuristic from worldmonitor intelligence.',
    priority: 'medium',
    enabled_by_default: true,
    url: 'https://wm.asha.news/api/intelligence/v1/get-pizzint-status?include_gdelt=true',
  },
]);

const WM_RESOURCE_REGISTRY = Object.freeze({
  intel_news: Object.freeze([
    { key: 'newsDigest', path: '/api/news/v1/list-feed-digest', query: { variant: 'full' }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'telegramFeed', path: '/api/telegram-feed', query: { limit: 200 }, version: 'v1', cache_ttl_ms: 12000 },
    { key: 'orefAlerts', path: '/api/oref-alerts', version: 'v1', cache_ttl_ms: 10000 },
    { key: 'riskScores', path: '/api/intelligence/v1/get-risk-scores', version: 'v1', cache_ttl_ms: 30000 },
    { key: 'pizzintStatus', path: '/api/intelligence/v1/get-pizzint-status', query: { include_gdelt: true }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'gdeltSearch', path: '/api/intelligence/v1/search-gdelt-documents', query: { limit: 20 }, version: 'v1', cache_ttl_ms: 60000 },
  ]),
  security_ops: Object.freeze([
    { key: 'acled', path: '/api/conflict/v1/list-acled-events', query: { page_size: 220 }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'unrest', path: '/api/unrest/v1/list-unrest-events', query: { page_size: 220 }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'iranEvents', path: '/api/conflict/v1/list-iran-events', query: { page_size: 120 }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'ucdpEvents', path: '/api/conflict/v1/list-ucdp-events', query: { page_size: 120 }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'militaryBases', path: '/api/military/v1/list-military-bases', version: 'v1', cache_ttl_ms: 60000 },
    { key: 'commercialFlights', path: '/api/commercial-flights', version: 'v1', cache_ttl_ms: 12000 },
    { key: 'militaryFlights', path: '/api/military-flights', version: 'v1', cache_ttl_ms: 12000 },
    { key: 'theaterPosture', path: '/api/military/v1/get-theater-posture', version: 'v1', cache_ttl_ms: 30000 },
    { key: 'navWarnings', path: '/api/maritime/v1/list-navigational-warnings', query: { page_size: 80 }, version: 'v1', cache_ttl_ms: 25000 },
    { key: 'vesselSnapshot', path: '/api/maritime/v1/get-vessel-snapshot', version: 'v1', cache_ttl_ms: 25000 },
    { key: 'cyberThreats', path: '/api/cyber/v1/list-cyber-threats', query: { page_size: 120 }, version: 'v1', cache_ttl_ms: 25000 },
  ]),
  infrastructure_natural: Object.freeze([
    { key: 'outages', path: '/api/infrastructure/v1/list-internet-outages', query: { page_size: 80 }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'serviceStatus', path: '/api/infrastructure/v1/list-service-statuses', version: 'v1', cache_ttl_ms: 30000 },
    { key: 'cableHealth', path: '/api/infrastructure/v1/get-cable-health', version: 'v1', cache_ttl_ms: 60000 },
    { key: 'aviationDelays', path: '/api/aviation/v1/list-airport-delays', query: { page_size: 80 }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'climateAnomalies', path: '/api/climate/v1/list-climate-anomalies', query: { page_size: 80 }, version: 'v1', cache_ttl_ms: 60000 },
    { key: 'earthquakes', path: '/api/seismology/v1/list-earthquakes', query: { page_size: 80 }, version: 'v1', cache_ttl_ms: 60000 },
    { key: 'wildfires', path: '/api/wildfire/v1/list-fire-detections', query: { page_size: 80 }, version: 'v1', cache_ttl_ms: 60000 },
    { key: 'displacementSummary', path: '/api/displacement/v1/get-displacement-summary', version: 'v1', cache_ttl_ms: 60000 },
    { key: 'populationExposure', path: '/api/displacement/v1/get-population-exposure', query: { conflict: 'all', days: 7 }, version: 'v1', cache_ttl_ms: 60000 },
  ]),
  markets_econ_trade: Object.freeze([
    { key: 'marketQuotes', path: '/api/market/v1/list-market-quotes', query: { limit: 80 }, version: 'v1', cache_ttl_ms: 30000 },
    { key: 'commodityQuotes', path: '/api/market/v1/list-commodity-quotes', query: { limit: 80 }, version: 'v1', cache_ttl_ms: 30000 },
    { key: 'cryptoQuotes', path: '/api/market/v1/list-crypto-quotes', query: { limit: 80 }, version: 'v1', cache_ttl_ms: 30000 },
    { key: 'etfFlows', path: '/api/market/v1/list-etf-flows', query: { limit: 40 }, version: 'v1', cache_ttl_ms: 30000 },
    { key: 'stablecoinMarkets', path: '/api/market/v1/list-stablecoin-markets', query: { limit: 40 }, version: 'v1', cache_ttl_ms: 30000 },
    { key: 'macroSignals', path: '/api/economic/v1/get-macro-signals', version: 'v1', cache_ttl_ms: 60000 },
    { key: 'worldBankIndicators', path: '/api/economic/v1/list-world-bank-indicators', query: { limit: 60 }, version: 'v1', cache_ttl_ms: 60000 },
    { key: 'tradeFlows', path: '/api/trade/v1/get-trade-flows', version: 'v1', cache_ttl_ms: 60000 },
    { key: 'tradeBarriers', path: '/api/trade/v1/get-trade-barriers', version: 'v1', cache_ttl_ms: 60000 },
    { key: 'tariffTrends', path: '/api/trade/v1/get-tariff-trends', version: 'v1', cache_ttl_ms: 60000 },
  ]),
  supply_research_prediction: Object.freeze([
    { key: 'predictionMarkets', path: '/api/prediction/v1/list-prediction-markets', query: { limit: 80 }, version: 'v1', cache_ttl_ms: 20000 },
    { key: 'chokepointStatus', path: '/api/supply-chain/v1/get-chokepoint-status', version: 'v1', cache_ttl_ms: 30000 },
    { key: 'criticalMinerals', path: '/api/supply-chain/v1/get-critical-minerals', version: 'v1', cache_ttl_ms: 30000 },
    { key: 'shippingRates', path: '/api/supply-chain/v1/get-shipping-rates', version: 'v1', cache_ttl_ms: 30000 },
    { key: 'arxivPapers', path: '/api/research/v1/list-arxiv-papers', query: { limit: 40 }, version: 'v1', cache_ttl_ms: 60000 },
    { key: 'hnResearch', path: '/api/research/v1/list-hackernews-items', query: { limit: 40 }, version: 'v1', cache_ttl_ms: 60000 },
    { key: 'trendingRepos', path: '/api/research/v1/list-trending-repos', query: { limit: 40 }, version: 'v1', cache_ttl_ms: 60000 },
    { key: 'techEvents', path: '/api/research/v1/list-tech-events', query: { limit: 40 }, version: 'v1', cache_ttl_ms: 60000 },
  ]),
});

const WORLDMONITOR_DEFAULT_API_BASE = 'https://wm.asha.news';
const WORLDMONITOR_TIMEOUT_MS = Math.max(
  1200,
  Math.min(Number(process.env.MC_WORLDMONITOR_TIMEOUT_MS || 2400), 15000)
);
const SOURCE_TIMEOUT_DEFAULT_MS = Math.max(
  1200,
  Math.min(Number(process.env.MC_SOURCE_TIMEOUT_DEFAULT_MS || WORLDMONITOR_TIMEOUT_MS), 15000)
);
const CORE_CACHE_TTL_MS = 20000;
const CORE_STALE_TTL_MS = 180000;
const AI_DIGEST_TTL_MS = 10 * 60 * 1000;
const SOURCE_CIRCUIT_WINDOW_MS = 60 * 1000;
const SOURCE_CIRCUIT_FAILURE_THRESHOLD = 3;
const METRICS_WINDOW_HOURS = Math.max(
  1,
  Math.min(parseCount(process.env.MC_METRICS_WINDOW_HOURS || 24), 168)
);

const HAS_DB_CREDENTIALS = Boolean(
  safeString(process.env.DATABASE_URL)
  || (safeString(process.env.SUPABASE_URL) && safeString(process.env.SUPABASE_ANON_KEY))
);
const PG_STATE_ENABLED =
  String(process.env.MC_PG_STATE_ENABLED || 'true').toLowerCase() !== 'false'
  && HAS_DB_CREDENTIALS;
const PG_SHADOW_WRITE_ENABLED =
  String(process.env.MC_PG_SHADOW_WRITE_ENABLED || 'false').toLowerCase() === 'true';
const DISPATCH_ENGINE_ENABLED = String(process.env.MC_DISPATCH_ENGINE_ENABLED || 'true').toLowerCase() !== 'false';
const DISPATCH_WORKER_ENABLED = String(process.env.MC_DISPATCH_WORKER_ENABLED || 'true').toLowerCase() !== 'false';
const DISPATCH_WORKER_INTERVAL_MS = Math.max(
  1000,
  Math.min(parseCount(process.env.MC_DISPATCH_WORKER_INTERVAL_MS || 5000), 60000)
);
const DISPATCH_BATCH_SIZE = Math.max(
  1,
  Math.min(parseCount(process.env.MC_DISPATCH_BATCH_SIZE || 25), 100)
);
const DISPATCH_CLAIM_TTL_MS = Math.max(
  30000,
  Math.min(parseCount(process.env.MC_DISPATCH_CLAIM_TTL_MS || 10 * 60 * 1000), 30 * 60 * 1000)
);
const DISPATCH_RETENTION_INTERVAL_MS = Math.max(
  5 * 60 * 1000,
  Math.min(parseCount(process.env.MC_DISPATCH_RETENTION_INTERVAL_MS || 60 * 60 * 1000), 24 * 60 * 60 * 1000)
);
const DISPATCH_DEAD_LETTER_RETENTION_DAYS = Math.max(
  1,
  Math.min(parseCount(process.env.MC_DISPATCH_DEAD_LETTER_RETENTION_DAYS || 14), 365)
);
const DISPATCH_LOG_RETENTION_DAYS = Math.max(
  1,
  Math.min(parseCount(process.env.MC_DISPATCH_LOG_RETENTION_DAYS || 30), 365)
);
const REDIS_CACHE_ENABLED = String(process.env.MC_REDIS_CACHE_ENABLED || 'false').toLowerCase() === 'true';
const REDIS_REST_URL = safeString(
  process.env.MC_REDIS_REST_URL
    || process.env.UPSTASH_REDIS_REST_URL
    || process.env.REDIS_REST_URL
);
const REDIS_REST_TOKEN = safeString(
  process.env.MC_REDIS_REST_TOKEN
    || process.env.UPSTASH_REDIS_REST_TOKEN
    || process.env.REDIS_REST_TOKEN
);
const REDIS_KEY_PREFIX = safeString(process.env.MC_REDIS_KEY_PREFIX, 'mc');
const REDIS_SHARED_CACHE_ACTIVE = Boolean(REDIS_CACHE_ENABLED && REDIS_REST_URL && REDIS_REST_TOKEN);
const GLINT_COMPAT_THEME_ENABLED =
  String(process.env.MC_GLINT_COMPAT_THEME_ENABLED || 'true').toLowerCase() !== 'false';
const FEED_V2_ENABLED =
  String(process.env.MC_FEED_V2_ENABLED || 'true').toLowerCase() !== 'false';
const WM_FULL_RESOURCE_ADAPTERS_ENABLED =
  String(process.env.MC_WM_FULL_RESOURCE_ADAPTERS_ENABLED || 'true').toLowerCase() !== 'false';
const DIRECT_SOCIAL_CONNECTORS_ENABLED =
  String(process.env.MC_DIRECT_SOCIAL_CONNECTORS_ENABLED || 'false').toLowerCase() === 'true';
const UNIQUENESS_PASS_ENABLED =
  String(process.env.MC_UNIQUENESS_PASS_ENABLED || 'false').toLowerCase() === 'true';
const WM_RESOURCE_CACHE_TTL_MS = Math.max(
  10000,
  Math.min(parseCount(process.env.MC_WM_RESOURCE_CACHE_TTL_MS || 60000), 10 * 60 * 1000)
);
const dispatchWorkerState = {
  running: false,
  tick_inflight: false,
  timer: null,
  worker_id: `mc-${safeString(os.hostname(), 'node')}-${process.pid}`,
  last_started_at: null,
  last_stopped_at: null,
  last_tick_at: null,
  last_tick_completed_at: null,
  last_tick_stats: null,
  last_retention_at: null,
  last_retention_stats: null,
  last_error: '',
};

if (!HAS_DB_CREDENTIALS && String(process.env.MC_PG_STATE_ENABLED || 'true').toLowerCase() !== 'false') {
  logger.warn('Mission Control DB state disabled because DATABASE_URL/SUPABASE credentials are not configured');
}

if (REDIS_CACHE_ENABLED && !REDIS_SHARED_CACHE_ACTIVE) {
  logger.warn('Mission Control Redis cache flag enabled but MC_REDIS_REST_URL/token are not configured');
}

const SOURCE_TIMEOUT_OVERRIDES = Object.freeze({
  acled: 2800,
  unrest: 2800,
  newsDigest: 2400,
  riskScores: 2400,
  commercialFlights: 2200,
  militaryFlights: 2200,
  navWarnings: 2400,
  cyberThreats: 2400,
  outages: 2400,
  aviationDelays: 2200,
  telegramFeed: 2200,
  orefAlerts: 1800,
  pizzintStatus: 2200,
  earthquakes: 2400,
  wildfires: 2400,
  climateAnomalies: 2600,
  predictionMarkets: 2400,
  marketQuotes: 2600,
  commodityQuotes: 2600,
  cryptoQuotes: 2600,
  etfFlows: 2600,
  stablecoinMarkets: 2600,
  macroSignals: 2800,
  worldBankIndicators: 2800,
  tradeFlows: 2800,
  tradeBarriers: 2800,
  tariffTrends: 2800,
  chokepointStatus: 2600,
  criticalMinerals: 2600,
  shippingRates: 2600,
  arxivPapers: 3000,
  hnResearch: 3000,
  trendingRepos: 3000,
  techEvents: 3000,
  displacementSummary: 2600,
  populationExposure: 2600,
  serviceStatus: 2600,
  cableHealth: 2600,
  militaryBases: 2600,
  theaterPosture: 2600,
  vesselSnapshot: 2600,
  gdeltSearch: 3200,
  intelligenceDeduction: 4200,
});

const THREAT_LEVEL_TO_SEVERITY = Object.freeze({
  THREAT_LEVEL_CRITICAL: 'CRITICAL',
  THREAT_LEVEL_HIGH: 'HIGH',
  THREAT_LEVEL_MEDIUM: 'ELEVATED',
  THREAT_LEVEL_LOW: 'INFO',
  THREAT_LEVEL_UNSPECIFIED: 'INFO',
});

const UNREST_CONFIDENCE_TO_SCORE = Object.freeze({
  CONFIDENCE_LEVEL_HIGH: 0.82,
  CONFIDENCE_LEVEL_MEDIUM: 0.62,
  CONFIDENCE_LEVEL_LOW: 0.42,
  CONFIDENCE_LEVEL_UNSPECIFIED: 0.5,
});

const CYBER_CRITICALITY_TO_SCORE = Object.freeze({
  CRITICALITY_LEVEL_CRITICAL: 0.92,
  CRITICALITY_LEVEL_HIGH: 0.8,
  CRITICALITY_LEVEL_MEDIUM: 0.62,
  CRITICALITY_LEVEL_LOW: 0.42,
  CRITICALITY_LEVEL_UNSPECIFIED: 0.5,
});

const OUTAGE_SEVERITY_TO_SCORE = Object.freeze({
  OUTAGE_SEVERITY_TOTAL: 0.95,
  OUTAGE_SEVERITY_MAJOR: 0.82,
  OUTAGE_SEVERITY_PARTIAL: 0.62,
  OUTAGE_SEVERITY_UNSPECIFIED: 0.5,
});

const coreSnapshotCache = new Map();
const coreSnapshotInflight = new Map();
const aiDigestCache = new Map();
const aiDigestInflight = new Map();
const wmResourceCache = new Map();
const sourceCircuitState = new Map();
let pgStateRuntimeDisabled = false;
const opsHealthWmCoverageCache = {
  ts: 0,
  coverage: null,
  inflight: null,
};

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function parseCount(raw) {
  const parsed = Number(String(raw || '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIso(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function normalizeConflict(input) {
  const value = String(input || '').trim().toLowerCase();
  if (!value || value === 'all') return 'all';
  if (value === 'gaza-israel' || value === 'gaza_israel') return 'gaza-israel';
  if (value === 'israel-us-iran' || value === 'israel_us_iran') return 'israel-us-iran';
  return value;
}

function normalizeMode(input) {
  return String(input || '').trim().toLowerCase() === 'analyst' ? 'analyst' : 'simple';
}

function normalizeVerificationMode(input) {
  return String(input || '').trim().toLowerCase() === 'all-sources'
    ? 'all-sources'
    : 'verified-first';
}

function normalizeProfile(input) {
  const value = String(input || '').trim().toLowerCase();
  return value || 'default';
}

function normalizeLanguage(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (!raw) return 'en';
  const first = raw.split(',')[0] || '';
  const main = first.split(';')[0] || '';
  const lang = main.split('-')[0] || main;
  if (!lang) return 'en';
  return /^[a-z]{2,3}$/.test(lang) ? lang : 'en';
}

function normalizeCountryHint(input) {
  const raw = String(input || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  const mapped = COUNTRY_NAME_TO_CODE[String(input || '').trim().toLowerCase()];
  return mapped || '';
}

function normalizeIncidentType(input) {
  const value = String(input || '').trim().toLowerCase();
  if (!value || value === 'all') return 'all';
  if (['rocket', 'missile', 'rocket-missile', 'rocket_missile'].includes(value)) return 'rocket-missile';
  if (['drone', 'uav'].includes(value)) return 'drone';
  if (['earthquake', 'seismic'].includes(value)) return 'earthquake';
  if (['chemical', 'nuclear', 'chemical-nuclear', 'chemical_nuclear', 'radiological'].includes(value)) {
    return 'chemical-nuclear';
  }
  if (['unrest', 'riot', 'civil-unrest', 'civil_unrest'].includes(value)) return 'civil-unrest';
  if (['cyber', 'comms', 'cyber-comms', 'cyber_comms', 'outage'].includes(value)) return 'cyber-comms';
  return 'general';
}

function normalizeAudioMode(input) {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'silent') return 'silent';
  if (value === 'vibration-only' || value === 'vibration_only') return 'vibration-only';
  return 'tone';
}

function deriveHazardTypeFromText(input = '') {
  const text = String(input || '').toLowerCase();
  if (!text) return 'general';
  if (
    text.includes('rocket')
    || text.includes('missile')
    || text.includes('ballistic')
    || text.includes('interceptor')
    || text.includes('sirens')
  ) {
    return 'rocket-missile';
  }
  if (text.includes('drone') || text.includes('uav')) return 'drone';
  if (text.includes('earthquake') || text.includes('seismic') || text.includes('tremor')) return 'earthquake';
  if (
    text.includes('nuclear')
    || text.includes('radiological')
    || text.includes('chemical')
    || text.includes('phosphorus')
  ) {
    return 'chemical-nuclear';
  }
  if (
    text.includes('cyber')
    || text.includes('comms')
    || text.includes('communications')
    || text.includes('outage')
  ) {
    return 'cyber-comms';
  }
  if (
    text.includes('riot')
    || text.includes('protest')
    || text.includes('unrest')
    || text.includes('crowd')
  ) {
    return 'civil-unrest';
  }
  return 'general';
}

function deriveHazardTypeFromEvent(event = {}) {
  return normalizeIncidentType(
    event.hazard_type
    || event.incident_type
    || event.event_type
    || deriveHazardTypeFromText(
      `${safeString(event.title)} ${safeString(event.summary)} ${safeString(event.weapon_type)} ${safeString(event.technology_type)}`
    )
  );
}

function resolveScope(options = {}) {
  const profile = normalizeProfile(options.profile);
  const userId = safeString(options.user_id || options.userId || '');
  if (userId) {
    return {
      scope_id: `user:${userId}`,
      user_id: userId,
      profile_key: profile,
    };
  }
  return {
    scope_id: `profile:${profile}`,
    user_id: null,
    profile_key: profile,
  };
}

function appendFilters(params, filter = {}) {
  Object.entries(filter || {}).forEach(([field, value]) => {
    if (value === undefined || value === null) return;
    params.push(`filter[${field}][_eq]=${encodeURIComponent(String(value))}`);
  });
}

function isMissingDbTableErrorMessage(input = '') {
  const message = String(input || '');
  return (
    message.includes('PGRST205')
    || message.includes('42P01')
    || message.includes('does not exist')
    || message.includes('Could not find the table')
    || message.includes('relation')
  );
}

function disablePgStateRuntime(reason = '') {
  if (pgStateRuntimeDisabled) return;
  pgStateRuntimeDisabled = true;
  logger.warn(
    { reason: String(reason || 'missing_table') },
    'Mission Control DB tables unavailable; switching to file-state fallback until migration is applied'
  );
}

async function dbListItems(collection, options = {}) {
  if (pgStateRuntimeDisabled) return [];
  const query = [];
  const limit = Number(options.limit || 100);
  if (Number.isFinite(limit) && limit > 0) query.push(`limit=${limit}`);
  const offset = Number(options.offset || 0);
  if (Number.isFinite(offset) && offset > 0) query.push(`offset=${offset}`);
  if (safeString(options.sort)) query.push(`sort=${encodeURIComponent(safeString(options.sort))}`);
  appendFilters(query, options.filter);
  const suffix = query.length ? `?${query.join('&')}` : '';
  const response = await queryBridge(`/items/${collection}${suffix}`);
  if (response?.error) {
    if (isMissingDbTableErrorMessage(response.error)) {
      disablePgStateRuntime(response.error);
    }
    return [];
  }
  return Array.isArray(response?.data) ? response.data : [];
}

async function dbInsertItem(collection, payload) {
  if (pgStateRuntimeDisabled) return null;
  const response = await queryBridge(`/items/${collection}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (response?.error) {
    if (isMissingDbTableErrorMessage(response.error)) {
      disablePgStateRuntime(response.error);
    }
    return null;
  }
  if (Array.isArray(response?.data)) return response.data[0] || null;
  return response?.data || null;
}

async function dbPatchItem(collection, id, payload) {
  if (pgStateRuntimeDisabled) return null;
  const response = await queryBridge(`/items/${collection}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (response?.error) {
    if (isMissingDbTableErrorMessage(response.error)) {
      disablePgStateRuntime(response.error);
    }
    return null;
  }
  if (Array.isArray(response?.data)) return response.data[0] || null;
  return response?.data || null;
}

function buildCoreCacheKey(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const mode = normalizeMode(options.mode || 'simple');
  const verificationMode = normalizeVerificationMode(options.verification_mode || 'verified-first');
  const days = Math.max(1, Math.min(parseCount(options.days || 14), 90));
  const language = normalizeLanguage(options.language || options.lang);
  const country = normalizeCountryHint(options.country);
  const scope = resolveScope(options).scope_id;
  return `${conflict}|${mode}|${verificationMode}|${days}|${language}|${country}|${scope}`;
}

function normalizeSeverityInput(input) {
  const value = String(input || '').trim().toUpperCase();
  return SEVERITY_ORDER[value] ? value : 'INFO';
}

async function ensureStateFile() {
  await fs.mkdir(STATE_DIR, { recursive: true });
  try {
    await fs.access(STATE_FILE);
  } catch {
    await fs.writeFile(STATE_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
  }
}

async function readFileState() {
  await ensureStateFile();
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      layouts: parsed?.layouts && typeof parsed.layouts === 'object' ? parsed.layouts : {},
      notification_preferences:
        parsed?.notification_preferences && typeof parsed.notification_preferences === 'object'
          ? parsed.notification_preferences
          : {},
      followed_regions:
        parsed?.followed_regions && typeof parsed.followed_regions === 'object'
          ? parsed.followed_regions
          : {},
      muted_rules:
        parsed?.muted_rules && typeof parsed.muted_rules === 'object'
          ? parsed.muted_rules
          : {},
      alert_actions:
        parsed?.alert_actions && typeof parsed.alert_actions === 'object'
          ? parsed.alert_actions
          : {},
    };
  } catch (error) {
    logger.warn({ err: error?.message }, 'Mission control state read failed; using defaults');
    return { ...DEFAULT_STATE };
  }
}

async function writeFileState(nextState) {
  await ensureStateFile();
  const tmp = `${STATE_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(nextState, null, 2), 'utf8');
  await fs.rename(tmp, STATE_FILE);
}

function safeString(value, fallback = '') {
  const str = String(value || '').trim();
  return str || fallback;
}

function toCacheNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function flattenWmResourceRegistry() {
  return Object.entries(WM_RESOURCE_REGISTRY).flatMap(([family, resources]) =>
    (resources || []).map((resource) => ({ family, ...resource }))
  );
}

function mapResourceHealthErrorCode(status, message = '') {
  const normalizedStatus = safeString(status).toLowerCase();
  const normalizedMessage = safeString(message).toLowerCase();
  if (normalizedStatus === 'ok') return null;
  if (normalizedStatus === 'circuit_open') return 'circuit_open';
  if (normalizedMessage.includes('timeout')) return 'timeout';
  if (normalizedMessage.includes('status 4')) return 'http_4xx';
  if (normalizedMessage.includes('status 5')) return 'http_5xx';
  if (normalizedMessage.includes('network')) return 'network';
  return normalizedStatus || 'degraded';
}

function parseCsvValues(input) {
  return String(input || '')
    .split(',')
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function parseCursorValue(input) {
  return Math.max(0, parseInt(String(input || '0'), 10) || 0);
}

function parseFeedLimit(input, fallback = 40) {
  const parsed = parseCount(input || fallback);
  if (!parsed) return fallback;
  return Math.max(1, Math.min(parsed, 120));
}

function parseTimeRangeMs(input) {
  const value = safeString(input).toLowerCase();
  if (!value || value === 'all') return Number.POSITIVE_INFINITY;
  if (value === '1h') return 60 * 60 * 1000;
  if (value === '6h') return 6 * 60 * 60 * 1000;
  if (value === '24h') return 24 * 60 * 60 * 1000;
  if (value === '48h') return 48 * 60 * 60 * 1000;
  if (value === '7d') return 7 * 24 * 60 * 60 * 1000;
  if (value === '14d') return 14 * 24 * 60 * 60 * 1000;
  return Number.POSITIVE_INFINITY;
}

function inferFeedSourceType(sourceName, verificationStatus = '', fallback = 'news') {
  const source = safeString(sourceName).toLowerCase();
  const verification = safeString(verificationStatus).toLowerCase();
  if (source.includes('telegram')) return 'telegram';
  if (source.includes('twitter') || source.includes('x ') || source === 'x') return 'x';
  if (source.includes('osint')) return 'osint';
  if (source.includes('oref') || source.includes('civil defense') || verification === 'verified') return 'official';
  if (source.includes('mission control ai') || source.includes('deduction')) return 'wm-ai';
  return fallback;
}

function normalizedCountryFromText(...inputs) {
  for (const input of inputs) {
    const code = detectCountryCodeFromText(input);
    if (code) return code;
  }
  return '';
}

function normalizeFeedTab(input) {
  const value = safeString(input, 'feed').toLowerCase();
  if (value === 'whale' || value === 'whale-tracker') return 'whale';
  if (value === 'flights' || value === 'flight') return 'flights';
  return 'feed';
}

function filterFeedItems(items = [], filters = {}) {
  const severity = safeString(filters.severity).toUpperCase();
  const sourceTypeFilter = new Set(parseCsvValues(filters.source_type).map((value) => value.toLowerCase()));
  const topicFilter = new Set(parseCsvValues(filters.topic).map((value) => safeString(value).toLowerCase()));
  const categoryFilter = new Set(parseCsvValues(filters.category).map((value) => safeString(value).toLowerCase()));
  const countryFilter = new Set(parseCsvValues(filters.country_filter).map((value) => safeString(value).toUpperCase()));
  const verificationStatus = safeString(filters.verification_status).toLowerCase();
  const search = safeString(filters.search).toLowerCase();
  const timeWindowMs = parseTimeRangeMs(filters.time_range);
  const now = Date.now();

  return items.filter((item) => {
    const itemSeverity = safeString(item.severity).toUpperCase();
    const itemSourceType = safeString(item.source_type).toLowerCase();
    const itemTopic = safeString(item.topic).toLowerCase();
    const itemCategory = safeString(item.category).toLowerCase();
    const itemCountry = safeString(item.country).toUpperCase();
    const itemVerification = safeString(item.verification_status).toLowerCase();
    const updatedAtMs = parseTimestampMs(item.updated_at) || 0;

    if (severity && severity !== 'ALL' && itemSeverity !== severity) return false;
    if (sourceTypeFilter.size && !sourceTypeFilter.has(itemSourceType)) return false;
    if (topicFilter.size && !topicFilter.has(itemTopic)) return false;
    if (categoryFilter.size && !categoryFilter.has(itemCategory)) return false;
    if (countryFilter.size && !countryFilter.has(itemCountry)) return false;
    if (verificationStatus && verificationStatus !== 'all' && itemVerification !== verificationStatus) return false;
    if (timeWindowMs !== Number.POSITIVE_INFINITY && updatedAtMs > 0 && now - updatedAtMs > timeWindowMs) return false;
    if (search) {
      const haystack = `${safeString(item.title)} ${safeString(item.summary)} ${safeString(item.source_name)} ${safeString(item.location)}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function sortFeedItems(items = []) {
  const sourceTrust = {
    official: 70,
    news: 46,
    'wm-ai': 34,
    osint: 14,
    x: 8,
    telegram: -4,
  };
  const verificationWeight = {
    verified: 240,
    probable: 40,
    unverified: -160,
  };

  const rankScore = (item) => {
    const severityScore = (SEVERITY_ORDER[normalizeSeverityInput(item.severity)] || 1) * 110;
    const verification = safeString(item.verification_status).toLowerCase();
    const verificationScore = verificationWeight[verification] ?? 0;
    const trustScore = sourceTrust[safeString(item.source_type).toLowerCase()] ?? 0;
    const confidenceScore = clamp(Number(item.confidence_score || 0), 0, 1) * 65;
    const sourceCountScore = Math.min(8, Math.max(1, parseCount(item.source_count || 1))) * 7;
    const ageHours = Math.max(0, (Date.now() - (parseTimestampMs(item.updated_at) || Date.now())) / 3600000);
    const freshnessPenalty = Math.min(140, ageHours * 3.2);
    return severityScore + verificationScore + trustScore + confidenceScore + sourceCountScore - freshnessPenalty;
  };

  return [...items].sort((a, b) => {
    const scoreDelta = rankScore(b) - rankScore(a);
    if (scoreDelta !== 0) return scoreDelta;
    return (parseTimestampMs(b.updated_at) || 0) - (parseTimestampMs(a.updated_at) || 0);
  });
}

function cacheKey(prefix, key) {
  return `${REDIS_KEY_PREFIX}:${prefix}:${safeString(key)}`;
}

function normalizeRedisBaseUrl() {
  return safeString(REDIS_REST_URL).replace(/\/+$/, '');
}

async function redisCommand(command = []) {
  if (!REDIS_SHARED_CACHE_ACTIVE) return null;
  try {
    const response = await fetch(normalizeRedisBaseUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`redis_http_${response.status}`);
    }
    const payload = await response.json();
    if (payload?.error) {
      throw new Error(safeString(payload.error, 'redis_command_error'));
    }
    return payload?.result ?? null;
  } catch (error) {
    logger.warn({ err: error?.message }, 'MC Redis command failed; falling back to process cache');
    return null;
  }
}

function setLocalCoreCache(key, data, ts = Date.now()) {
  coreSnapshotCache.set(key, { data, ts });
  if (coreSnapshotCache.size > 40) {
    const oldestKey = coreSnapshotCache.keys().next().value;
    if (oldestKey) coreSnapshotCache.delete(oldestKey);
  }
}

async function getSharedCoreCache(key) {
  if (!REDIS_SHARED_CACHE_ACTIVE) return null;
  const raw = await redisCommand(['GET', cacheKey('home', key)]);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      data: parsed.data,
      ts: toCacheNumber(parsed.ts, 0),
    };
  } catch {
    return null;
  }
}

async function setSharedCoreCache(key, data, ttlMs) {
  if (!REDIS_SHARED_CACHE_ACTIVE) return;
  const ttlSeconds = Math.max(1, Math.ceil(Math.max(1000, ttlMs) / 1000));
  const payload = JSON.stringify({
    data,
    ts: Date.now(),
  });
  await redisCommand(['SETEX', cacheKey('home', key), ttlSeconds, payload]);
}

function setLocalAiDigestCache(key, value) {
  aiDigestCache.set(key, {
    value,
    ts: Date.now(),
  });
  if (aiDigestCache.size > 80) {
    const oldest = aiDigestCache.keys().next().value;
    if (oldest) aiDigestCache.delete(oldest);
  }
}

async function getSharedAiDigestCache(key) {
  if (!REDIS_SHARED_CACHE_ACTIVE) return null;
  const raw = await redisCommand(['GET', cacheKey('ai', key)]);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(String(raw));
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      value: parsed.value,
      ts: toCacheNumber(parsed.ts, 0),
    };
  } catch {
    return null;
  }
}

async function setSharedAiDigestCache(key, value) {
  if (!REDIS_SHARED_CACHE_ACTIVE) return;
  const ttlSeconds = Math.max(1, Math.ceil(AI_DIGEST_TTL_MS / 1000));
  const payload = JSON.stringify({
    value,
    ts: Date.now(),
  });
  await redisCommand(['SETEX', cacheKey('ai', key), ttlSeconds, payload]);
}

function isPgStateActive() {
  return PG_STATE_ENABLED && !pgStateRuntimeDisabled;
}

function isPgReadActive() {
  return PG_STATE_ENABLED && !PG_SHADOW_WRITE_ENABLED && !pgStateRuntimeDisabled;
}

function isPgShadowWriteActive() {
  return PG_STATE_ENABLED && PG_SHADOW_WRITE_ENABLED && !pgStateRuntimeDisabled;
}

function scopedLayoutStorageKey(scope, presetId) {
  return `${scope.scope_id}::${safeString(presetId)}`;
}

function defaultActionState() {
  return {
    acknowledged_alert_ids: [],
    followed_regions: [],
    muted_signatures: [],
  };
}

function parseTimestampMs(value) {
  const ts = new Date(value || '').getTime();
  return Number.isFinite(ts) && ts > 0 ? ts : null;
}

function avg(values = []) {
  if (!Array.isArray(values) || !values.length) return 0;
  const sum = values.reduce((acc, item) => acc + Number(item || 0), 0);
  return Math.round(sum / values.length);
}

function p95(values = []) {
  if (!Array.isArray(values) || !values.length) return 0;
  const sorted = [...values].map((item) => Number(item || 0)).sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1));
  return Math.round(sorted[index] || 0);
}

async function recordDispatchMetric(scope, metricType, options = {}) {
  if (!isPgStateActive()) return;
  const valueMs = options.value_ms;
  const valueNum = options.value_num;
  if (!Number.isFinite(Number(valueMs)) && !Number.isFinite(Number(valueNum))) return;

  try {
    await dbInsertItem('mc_dispatch_metrics', {
      scope_id: scope.scope_id,
      user_id: scope.user_id,
      metric_type: safeString(metricType),
      value_ms: Number.isFinite(Number(valueMs)) ? Math.max(0, Math.round(Number(valueMs))) : null,
      value_num: Number.isFinite(Number(valueNum)) ? Number(valueNum) : null,
      channel: safeString(options.channel) || null,
      alert_id: safeString(options.alert_id) || null,
      metadata_json: options.metadata && typeof options.metadata === 'object' ? options.metadata : {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn(
      { err: error?.message, metric: metricType, scope: scope.scope_id },
      'MC dispatch metric insert failed'
    );
  }
}

async function getFallbackNotificationPreference(scope) {
  const state = await readFileState();
  const existing =
    state.notification_preferences?.[scope.scope_id]
    || state.notification_preferences?.[scope.profile_key]
    || {};
  return mergeNotificationPreference({ ...DEFAULT_NOTIFICATION_PREFERENCE, ...existing }, { profile: scope.profile_key });
}

async function setFallbackNotificationPreference(scope, preference) {
  const state = await readFileState();
  const nextState = {
    ...state,
    notification_preferences: {
      ...(state.notification_preferences || {}),
      [scope.scope_id]: preference,
      [scope.profile_key]: preference,
    },
  };
  await writeFileState(nextState);
  return preference;
}

async function getFallbackLayouts(scope) {
  const state = await readFileState();
  const fromScopedEntries = Object.entries(state.layouts || {}).reduce((acc, [key, value]) => {
    if (!key.startsWith(`${scope.scope_id}::`)) return acc;
    const presetId = key.slice(`${scope.scope_id}::`.length);
    acc[presetId] = value;
    return acc;
  }, {});
  const merged = Object.keys(fromScopedEntries).length
    ? fromScopedEntries
    : state.layouts || {};
  return mergeLayouts(merged);
}

async function setFallbackLayout(scope, presetId, presetPayload) {
  const state = await readFileState();
  const nextState = {
    ...state,
    layouts: {
      ...(state.layouts || {}),
      [scopedLayoutStorageKey(scope, presetId)]: presetPayload,
    },
  };
  await writeFileState(nextState);
  return presetPayload;
}

async function getFallbackActionState(scope) {
  const state = await readFileState();
  const actionState = state.alert_actions?.[scope.scope_id] || defaultActionState();
  const followed = Array.isArray(state.followed_regions?.[scope.scope_id])
    ? state.followed_regions[scope.scope_id]
    : [];
  const muted = Array.isArray(state.muted_rules?.[scope.scope_id])
    ? state.muted_rules[scope.scope_id]
    : [];
  return {
    acknowledged_alert_ids: Array.isArray(actionState.acknowledged_alert_ids)
      ? actionState.acknowledged_alert_ids
      : [],
    followed_regions: followed.map((item) => safeString(item)).filter(Boolean),
    muted_signatures: muted.map((item) => safeString(item)).filter(Boolean),
  };
}

async function appendFallbackAction(scope, actionName, payload = {}) {
  const state = await readFileState();
  const currentActions = state.alert_actions?.[scope.scope_id] || defaultActionState();
  const nextActions = {
    ...currentActions,
    acknowledged_alert_ids: Array.isArray(currentActions.acknowledged_alert_ids)
      ? [...currentActions.acknowledged_alert_ids]
      : [],
  };

  if (actionName === 'acknowledge') {
    const alertId = safeString(payload.alert_id);
    if (alertId && !nextActions.acknowledged_alert_ids.includes(alertId)) {
      nextActions.acknowledged_alert_ids.unshift(alertId);
    }
  }

  const followed = Array.isArray(state.followed_regions?.[scope.scope_id])
    ? [...state.followed_regions[scope.scope_id]]
    : [];
  if (actionName === 'follow_region') {
    const region = safeString(payload.region);
    if (region && !followed.includes(region)) followed.push(region);
  }

  const muted = Array.isArray(state.muted_rules?.[scope.scope_id])
    ? [...state.muted_rules[scope.scope_id]]
    : [];
  if (actionName === 'mute_similar') {
    const signature = safeString(payload.signature);
    if (signature && !muted.includes(signature)) muted.push(signature);
  }

  const nextState = {
    ...state,
    alert_actions: {
      ...(state.alert_actions || {}),
      [scope.scope_id]: nextActions,
    },
    followed_regions: {
      ...(state.followed_regions || {}),
      [scope.scope_id]: followed,
    },
    muted_rules: {
      ...(state.muted_rules || {}),
      [scope.scope_id]: muted,
    },
  };
  await writeFileState(nextState);
  return getFallbackActionState(scope);
}

async function getNotificationPreferenceRecordDb(scope) {
  const rows = await dbListItems('mc_user_preferences', {
    limit: 1,
    filter: {
      scope_id: scope.scope_id,
    },
  });
  const row = rows[0];
  const existing = row && typeof row.preferences_json === 'object' ? row.preferences_json : {};
  return mergeNotificationPreference({ ...DEFAULT_NOTIFICATION_PREFERENCE, ...existing }, { profile: scope.profile_key });
}

async function saveNotificationPreferenceRecordDb(scope, preference) {
  const rows = await dbListItems('mc_user_preferences', {
    limit: 1,
    filter: {
      scope_id: scope.scope_id,
    },
  });
  const payload = {
    scope_id: scope.scope_id,
    user_id: scope.user_id,
    profile_key: scope.profile_key,
    preferences_json: preference,
    mode_default: safeString(preference?.mode_default, 'simple'),
    updated_at: new Date().toISOString(),
  };
  if (rows[0]?.id) {
    await dbPatchItem('mc_user_preferences', rows[0].id, payload);
  } else {
    await dbInsertItem('mc_user_preferences', payload);
  }
  return preference;
}

async function getNotificationPreferenceRecord(scope) {
  if (!isPgReadActive()) {
    return getFallbackNotificationPreference(scope);
  }

  try {
    return await getNotificationPreferenceRecordDb(scope);
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC preferences DB read failed, using file fallback');
    return getFallbackNotificationPreference(scope);
  }
}

async function saveNotificationPreferenceRecord(scope, preference) {
  if (!isPgStateActive()) {
    return setFallbackNotificationPreference(scope, preference);
  }

  if (isPgShadowWriteActive()) {
    const saved = await setFallbackNotificationPreference(scope, preference);
    saveNotificationPreferenceRecordDb(scope, preference).catch((error) => {
      logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC shadow-write DB preference write failed');
    });
    return saved;
  }

  try {
    return await saveNotificationPreferenceRecordDb(scope, preference);
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC preferences DB write failed, using file fallback');
    return setFallbackNotificationPreference(scope, preference);
  }
}

async function getWorkspacePresetRecordsDb(scope) {
  const rows = await dbListItems('mc_workspace_layouts', {
    limit: 64,
    filter: {
      scope_id: scope.scope_id,
    },
    sort: '-updated_at',
  });
  const mapped = rows.reduce((acc, row) => {
    const presetId = safeString(row.preset_id);
    const layoutJson = row && typeof row.layout_json === 'object' ? row.layout_json : {};
    if (!presetId || !layoutJson || typeof layoutJson !== 'object') return acc;
    acc[presetId] = layoutJson;
    return acc;
  }, {});
  return mergeLayouts(mapped);
}

async function saveWorkspacePresetRecordDb(scope, presetId, payload) {
  const rows = await dbListItems('mc_workspace_layouts', {
    limit: 1,
    filter: {
      scope_id: scope.scope_id,
      preset_id: presetId,
    },
  });
  const next = {
    scope_id: scope.scope_id,
    user_id: scope.user_id,
    profile_key: scope.profile_key,
    preset_id: presetId,
    layout_json: payload,
    updated_at: new Date().toISOString(),
  };
  if (rows[0]?.id) {
    await dbPatchItem('mc_workspace_layouts', rows[0].id, next);
  } else {
    await dbInsertItem('mc_workspace_layouts', next);
  }
  return payload;
}

async function getWorkspacePresetRecords(scope) {
  if (!isPgReadActive()) {
    return getFallbackLayouts(scope);
  }

  try {
    return await getWorkspacePresetRecordsDb(scope);
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC workspace DB read failed, using file fallback');
    return getFallbackLayouts(scope);
  }
}

async function saveWorkspacePresetRecord(scope, presetId, payload) {
  if (!isPgStateActive()) {
    return setFallbackLayout(scope, presetId, payload);
  }

  if (isPgShadowWriteActive()) {
    const saved = await setFallbackLayout(scope, presetId, payload);
    saveWorkspacePresetRecordDb(scope, presetId, payload).catch((error) => {
      logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC shadow-write DB workspace write failed');
    });
    return saved;
  }

  try {
    return await saveWorkspacePresetRecordDb(scope, presetId, payload);
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC workspace DB write failed, using file fallback');
    return setFallbackLayout(scope, presetId, payload);
  }
}

async function getActionStateDb(scope) {
  const [actions, followedRegions, mutedRules] = await Promise.all([
    dbListItems('mc_alert_actions', {
      limit: 400,
      filter: { scope_id: scope.scope_id },
      sort: '-created_at',
    }),
    dbListItems('mc_followed_regions', {
      limit: 200,
      filter: { scope_id: scope.scope_id },
      sort: '-created_at',
    }),
    dbListItems('mc_muted_rules', {
      limit: 400,
      filter: { scope_id: scope.scope_id },
      sort: '-created_at',
    }),
  ]);

  const acknowledged = actions
    .filter((item) => safeString(item.action) === 'acknowledge')
    .map((item) => safeString(item.alert_id))
    .filter(Boolean);
  const followed = followedRegions.map((item) => safeString(item.region)).filter(Boolean);
  const muted = mutedRules.map((item) => safeString(item.signature)).filter(Boolean);

  return {
    acknowledged_alert_ids: [...new Set(acknowledged)],
    followed_regions: [...new Set(followed)],
    muted_signatures: [...new Set(muted)],
  };
}

async function getActionState(scope) {
  if (!isPgReadActive()) {
    return getFallbackActionState(scope);
  }

  try {
    return await getActionStateDb(scope);
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC action state DB read failed, using file fallback');
    return getFallbackActionState(scope);
  }
}

async function persistAlertActionDb(scope, actionName, payload = {}) {
  const alertId = safeString(payload.alert_id);
  const nowIso = new Date().toISOString();
  if (actionName === 'acknowledge' && alertId) {
    const existing = await dbListItems('mc_alert_actions', {
      limit: 1,
      filter: {
        scope_id: scope.scope_id,
        action: 'acknowledge',
        alert_id: alertId,
      },
    });
    if (!existing.length) {
      await dbInsertItem('mc_alert_actions', {
        scope_id: scope.scope_id,
        user_id: scope.user_id,
        alert_id: alertId,
        action: 'acknowledge',
        metadata_json: payload,
        created_at: nowIso,
      });
    }
  }

  if (actionName === 'follow_region') {
    const region = safeString(payload.region || payload.location);
    if (region) {
      const existing = await dbListItems('mc_followed_regions', {
        limit: 1,
        filter: {
          scope_id: scope.scope_id,
          region,
        },
      });
      if (!existing.length) {
        await dbInsertItem('mc_followed_regions', {
          scope_id: scope.scope_id,
          user_id: scope.user_id,
          region,
          created_at: nowIso,
        });
      }
    }
  }

  if (actionName === 'mute_similar') {
    const signature = safeString(payload.signature || `${safeString(payload.location)}::${safeString(payload.source_name)}`);
    if (signature) {
      const existing = await dbListItems('mc_muted_rules', {
        limit: 1,
        filter: {
          scope_id: scope.scope_id,
          signature,
          scope: 'source-location',
        },
      });
      if (!existing.length) {
        await dbInsertItem('mc_muted_rules', {
          scope_id: scope.scope_id,
          user_id: scope.user_id,
          signature,
          scope: 'source-location',
          created_at: nowIso,
        });
      }
    }
  }
}

async function persistAlertAction(scope, actionName, payload = {}) {
  if (!isPgStateActive()) {
    return appendFallbackAction(scope, actionName, payload);
  }

  if (isPgShadowWriteActive()) {
    const nextState = await appendFallbackAction(scope, actionName, payload);
    persistAlertActionDb(scope, actionName, payload).catch((error) => {
      logger.warn({ err: error?.message, scope: scope.scope_id, action: actionName }, 'MC shadow-write DB action persist failed');
      recordDispatchMetric(scope, 'action_persistence_error', {
        value_num: 1,
        metadata: {
          action: actionName,
          mode: 'shadow-write',
        },
      });
    });
    return nextState;
  }

  try {
    await persistAlertActionDb(scope, actionName, payload);
    return getActionState(scope);
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id, action: actionName }, 'MC action persist DB failed, using file fallback');
    recordDispatchMetric(scope, 'action_persistence_error', {
      value_num: 1,
      metadata: {
        action: actionName,
        mode: 'primary-db',
      },
    });
    return appendFallbackAction(scope, actionName, payload);
  }
}

function buildDispatchIdempotencyKey(scope, alert, channel) {
  const alertId = safeString(alert?.id || alert?.alert_id || alert?.event_id);
  return `${scope.scope_id}|${channel}|${alertId}`;
}

function hasSmtpConfig() {
  return Boolean(
    safeString(process.env.MC_SMTP_HOST)
    && parseCount(process.env.MC_SMTP_PORT || 587) > 0
    && safeString(process.env.MC_SMTP_FROM)
    && nodemailer
  );
}

async function createSmtpTransporter() {
  if (!hasSmtpConfig()) return null;
  return nodemailer.createTransport({
    host: safeString(process.env.MC_SMTP_HOST),
    port: parseCount(process.env.MC_SMTP_PORT || 587),
    secure: String(process.env.MC_SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: safeString(process.env.MC_SMTP_USER)
      ? {
          user: safeString(process.env.MC_SMTP_USER),
          pass: safeString(process.env.MC_SMTP_PASS),
        }
      : undefined,
  });
}

async function enqueueCriticalDispatch(scope, criticalAlerts = [], notificationPreference = {}) {
  if (!DISPATCH_ENGINE_ENABLED || !isPgStateActive()) return;
  if (!Array.isArray(criticalAlerts) || criticalAlerts.length === 0) return;

  const canEmail = Boolean(notificationPreference?.channels?.email && notificationPreference?.dispatch?.verified_critical_instant);
  if (!canEmail) return;

  const queueCandidates = criticalAlerts
    .filter((item) => safeString(item.verification_status) === 'verified')
    .filter((item) => safeString(item.severity) === 'CRITICAL')
    .slice(0, 20);

  await Promise.all(queueCandidates.map(async (alert) => {
    const idempotencyKey = buildDispatchIdempotencyKey(scope, alert, 'email');
    const qualifiedAt = new Date().toISOString();
    try {
      await dbInsertItem('mc_dispatch_queue', {
        scope_id: scope.scope_id,
        user_id: scope.user_id,
        alert_id: safeString(alert.id),
        channel: 'email',
        payload_json: {
          alert,
          preference_profile: notificationPreference.profile,
          qualified_at: qualifiedAt,
          alert_updated_at: safeString(alert.updated_at),
        },
        status: 'queued',
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
        claimed_at: null,
        claimed_by: null,
        last_error_code: null,
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      const message = safeString(error?.message || String(error)).toLowerCase();
      if (message.includes('duplicate') || message.includes('unique') || message.includes('idempotency_key')) {
        return;
      }
      throw error;
    }
  }));
}

function buildDispatchErrorCode(input) {
  const text = safeString(input || '').toLowerCase();
  if (!text) return 'unknown_error';
  if (text.includes('recipient') || text.includes('address')) return 'missing_recipient';
  if (text.includes('auth')) return 'smtp_auth';
  if (text.includes('timeout')) return 'smtp_timeout';
  if (text.includes('connect')) return 'smtp_connect';
  return 'smtp_send_failed';
}

async function claimDispatchQueueBatch(limit, workerId) {
  if (!isPgStateActive()) return [];
  const batchSize = Math.max(1, Math.min(parseCount(limit), 100));

  if (!isUsingSupabase()) {
    const pool = getPool();
    if (pool) {
      const result = await pool.query(
        `
          WITH picked AS (
            SELECT id
            FROM mc_dispatch_queue
            WHERE status = 'queued'
              AND COALESCE(next_attempt_at, NOW()) <= NOW()
              AND (claimed_at IS NULL OR claimed_at < NOW() - ($3 * INTERVAL '1 millisecond'))
            ORDER BY next_attempt_at ASC NULLS FIRST, created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
          )
          UPDATE mc_dispatch_queue q
          SET status = 'processing',
              claimed_at = NOW(),
              claimed_by = $2,
              updated_at = NOW()
          FROM picked
          WHERE q.id = picked.id
          RETURNING q.*
        `,
        [batchSize, safeString(workerId, dispatchWorkerState.worker_id), DISPATCH_CLAIM_TTL_MS]
      );
      return result.rows || [];
    }
  }

  const queued = await dbListItems('mc_dispatch_queue', {
    limit: batchSize,
    filter: { status: 'queued' },
    sort: 'next_attempt_at',
  });
  const now = Date.now();
  const claimed = [];
  for (const item of queued) {
    const nextAttemptMs = parseTimestampMs(item.next_attempt_at) || 0;
    if (nextAttemptMs > now) continue;
    const claimTs = parseTimestampMs(item.claimed_at) || 0;
    if (claimTs && now - claimTs < DISPATCH_CLAIM_TTL_MS) continue;
    const patched = await dbPatchItem('mc_dispatch_queue', item.id, {
      status: 'processing',
      claimed_at: new Date().toISOString(),
      claimed_by: safeString(workerId, dispatchWorkerState.worker_id),
      updated_at: new Date().toISOString(),
    });
    if (patched && safeString(patched.status) === 'processing') {
      claimed.push(patched);
    }
  }
  return claimed;
}

async function processDispatchQueue(options = {}) {
  if (!DISPATCH_ENGINE_ENABLED || !isPgStateActive()) return;
  if (!hasSmtpConfig()) return;

  const workerId = safeString(options.workerId, dispatchWorkerState.worker_id);
  const batchSize = Math.max(1, Math.min(parseCount(options.batchSize || DISPATCH_BATCH_SIZE), 100));
  const transporter = await createSmtpTransporter();
  if (!transporter) return;

  const queue = await claimDispatchQueueBatch(batchSize, workerId);
  const stats = {
    worker_id: workerId,
    claimed: queue.length,
    processed: 0,
    sent: 0,
    failed: 0,
    dead_letter: 0,
    requeued: 0,
  };

  for (const item of queue) {
    stats.processed += 1;
    const metricScope = {
      scope_id: safeString(item.scope_id, 'unknown-scope'),
      user_id: safeString(item.user_id) || null,
    };
    try {
      if (isUsingSupabase()) {
        const latestRows = await dbListItems('mc_dispatch_queue', {
          limit: 1,
          filter: { id: safeString(item.id) },
        });
        const latest = latestRows[0];
        if (
          !latest
          || safeString(latest.status) !== 'processing'
          || safeString(latest.claimed_by) !== workerId
        ) {
          continue;
        }
      }

      const payload = item && typeof item.payload_json === 'object' ? item.payload_json : {};
      const alert = payload?.alert || {};
      const recipient = safeString(process.env.MC_ALERT_EMAIL_TO || process.env.ALERT_EMAIL_TO);
      if (!recipient) {
        await dbPatchItem('mc_dispatch_queue', item.id, {
          status: 'dead_letter',
          attempts: parseCount(item.attempts) + 1,
          claimed_at: null,
          claimed_by: null,
          last_error_code: 'missing_recipient',
          updated_at: new Date().toISOString(),
        });
        await dbInsertItem('mc_dispatch_log', {
          queue_id: item.id,
          provider: 'smtp',
          result: 'failed',
          error: 'Recipient email not configured',
          created_at: new Date().toISOString(),
        });
        recordDispatchMetric(metricScope, 'dispatch_success', {
          value_num: 0,
          channel: 'email',
          alert_id: safeString(alert.id),
          metadata: {
            reason: 'missing_recipient',
          },
        });
        stats.failed += 1;
        stats.dead_letter += 1;
        // Skip all mail work if recipient is not set.
        continue;
      }

      await transporter.sendMail({
        from: safeString(process.env.MC_SMTP_FROM),
        to: recipient,
        subject: `[MC CRITICAL] ${safeString(alert.title, 'Critical alert')}`,
        text: [
          `Severity: ${safeString(alert.severity)}`,
          `Location: ${safeString(alert.location)}`,
          `Confidence: ${Math.round(clamp(Number(alert.confidence_score || 0), 0, 1) * 100)}%`,
          `Updated: ${safeString(alert.updated_at)}`,
          '',
          safeString(alert.summary || alert.title),
        ].join('\n'),
      });

      await dbPatchItem('mc_dispatch_queue', item.id, {
        status: 'sent',
        attempts: parseCount(item.attempts) + 1,
        claimed_at: null,
        claimed_by: null,
        last_error_code: null,
        updated_at: new Date().toISOString(),
      });
      const deliveredAt = Date.now();
      const qualifiedAtMs = parseTimestampMs(payload?.qualified_at) || parseTimestampMs(item.created_at) || deliveredAt;
      const qualificationToEmailMs = Math.max(0, deliveredAt - qualifiedAtMs);
      await dbInsertItem('mc_dispatch_log', {
        queue_id: item.id,
        provider: 'smtp',
        result: 'sent',
        delivered_at: new Date(deliveredAt).toISOString(),
        created_at: new Date().toISOString(),
      });
      recordDispatchMetric(metricScope, 'qualification_to_email_ms', {
        value_ms: qualificationToEmailMs,
        channel: 'email',
        alert_id: safeString(alert.id),
        metadata: {
          queue_id: safeString(item.id),
        },
      });
      recordDispatchMetric(metricScope, 'dispatch_success', {
        value_num: 1,
        channel: 'email',
        alert_id: safeString(alert.id),
      });
      stats.sent += 1;
    } catch (error) {
      const attempts = parseCount(item.attempts) + 1;
      const baseRetryDelay = Math.min(1800, 30 * attempts);
      const retryJitter = Math.floor(Math.random() * Math.min(60, baseRetryDelay));
      const retryDelay = baseRetryDelay + retryJitter;
      const willDeadLetter = attempts >= 5;
      const errorCode = buildDispatchErrorCode(error?.message || String(error));
      await dbPatchItem('mc_dispatch_queue', item.id, {
        status: willDeadLetter ? 'dead_letter' : 'queued',
        attempts,
        next_attempt_at: new Date(Date.now() + retryDelay * 1000).toISOString(),
        claimed_at: null,
        claimed_by: null,
        last_error_code: errorCode,
        updated_at: new Date().toISOString(),
      });
      await dbInsertItem('mc_dispatch_log', {
        queue_id: item.id,
        provider: 'smtp',
        result: 'failed',
        error: safeString(error?.message || String(error)),
        created_at: new Date().toISOString(),
      });
      recordDispatchMetric(metricScope, 'dispatch_success', {
        value_num: 0,
        channel: safeString(item.channel, 'email'),
        alert_id: safeString(item.alert_id),
        metadata: {
          error: safeString(error?.message || String(error)),
          attempts,
        },
      });
      stats.failed += 1;
      if (willDeadLetter) {
        stats.dead_letter += 1;
      } else {
        stats.requeued += 1;
      }
    }
  }

  return stats;
}

async function runDispatchRetention(force = false) {
  if (!isPgStateActive() || isUsingSupabase()) return null;
  const lastRunMs = parseTimestampMs(dispatchWorkerState.last_retention_at) || 0;
  const now = Date.now();
  if (!force && now - lastRunMs < DISPATCH_RETENTION_INTERVAL_MS) return null;
  const pool = getPool();
  if (!pool) return null;

  const [deadLetterResult, logResult] = await Promise.all([
    pool.query(
      `
        DELETE FROM mc_dispatch_queue
        WHERE status = 'dead_letter'
          AND updated_at < NOW() - ($1 * INTERVAL '1 day')
      `,
      [DISPATCH_DEAD_LETTER_RETENTION_DAYS]
    ),
    pool.query(
      `
        DELETE FROM mc_dispatch_log
        WHERE created_at < NOW() - ($1 * INTERVAL '1 day')
      `,
      [DISPATCH_LOG_RETENTION_DAYS]
    ),
  ]);

  const stats = {
    dead_letters_deleted: parseCount(deadLetterResult?.rowCount),
    logs_deleted: parseCount(logResult?.rowCount),
    dead_letter_retention_days: DISPATCH_DEAD_LETTER_RETENTION_DAYS,
    log_retention_days: DISPATCH_LOG_RETENTION_DAYS,
  };
  dispatchWorkerState.last_retention_at = new Date().toISOString();
  dispatchWorkerState.last_retention_stats = stats;
  return stats;
}

async function runDispatchWorkerTick() {
  if (!DISPATCH_ENGINE_ENABLED || !DISPATCH_WORKER_ENABLED || !isPgStateActive()) {
    return {
      skipped: 'disabled',
    };
  }
  if (dispatchWorkerState.tick_inflight) {
    return {
      skipped: 'inflight',
    };
  }

  dispatchWorkerState.tick_inflight = true;
  dispatchWorkerState.last_tick_at = new Date().toISOString();
  try {
    const stats = (await processDispatchQueue({
      workerId: dispatchWorkerState.worker_id,
      batchSize: DISPATCH_BATCH_SIZE,
    })) || {
      worker_id: dispatchWorkerState.worker_id,
      claimed: 0,
      processed: 0,
      sent: 0,
      failed: 0,
      dead_letter: 0,
      requeued: 0,
    };
    await runDispatchRetention(false).catch((error) => {
      logger.warn({ err: error?.message }, 'MC dispatch retention task failed');
    });
    dispatchWorkerState.last_tick_stats = stats;
    dispatchWorkerState.last_tick_completed_at = new Date().toISOString();
    dispatchWorkerState.last_error = '';
    return stats;
  } catch (error) {
    dispatchWorkerState.last_error = safeString(error?.message || String(error));
    dispatchWorkerState.last_tick_completed_at = new Date().toISOString();
    throw error;
  } finally {
    dispatchWorkerState.tick_inflight = false;
  }
}

function startDispatchWorker() {
  if (dispatchWorkerState.running) return true;
  if (!DISPATCH_ENGINE_ENABLED || !DISPATCH_WORKER_ENABLED) {
    logger.info('MC dispatch worker disabled by flags');
    return false;
  }
  if (!isPgStateActive()) {
    logger.info('MC dispatch worker not started because PG state is disabled');
    return false;
  }
  dispatchWorkerState.running = true;
  dispatchWorkerState.last_started_at = new Date().toISOString();
  dispatchWorkerState.timer = setInterval(() => {
    runDispatchWorkerTick().catch((error) => {
      logger.warn({ err: error?.message }, 'MC dispatch worker tick failed');
    });
  }, DISPATCH_WORKER_INTERVAL_MS);
  if (typeof dispatchWorkerState.timer.unref === 'function') {
    dispatchWorkerState.timer.unref();
  }
  runDispatchWorkerTick().catch((error) => {
    logger.warn({ err: error?.message }, 'MC dispatch worker initial tick failed');
  });
  logger.info(
    {
      interval_ms: DISPATCH_WORKER_INTERVAL_MS,
      batch_size: DISPATCH_BATCH_SIZE,
      worker_id: dispatchWorkerState.worker_id,
    },
    'MC dispatch worker started'
  );
  return true;
}

function stopDispatchWorker() {
  if (dispatchWorkerState.timer) {
    clearInterval(dispatchWorkerState.timer);
    dispatchWorkerState.timer = null;
  }
  dispatchWorkerState.running = false;
  dispatchWorkerState.last_stopped_at = new Date().toISOString();
}

function getDispatchWorkerState() {
  return {
    enabled: DISPATCH_ENGINE_ENABLED && DISPATCH_WORKER_ENABLED,
    running: dispatchWorkerState.running,
    worker_id: dispatchWorkerState.worker_id,
    interval_ms: DISPATCH_WORKER_INTERVAL_MS,
    batch_size: DISPATCH_BATCH_SIZE,
    last_started_at: dispatchWorkerState.last_started_at,
    last_stopped_at: dispatchWorkerState.last_stopped_at,
    last_tick_at: dispatchWorkerState.last_tick_at,
    last_tick_completed_at: dispatchWorkerState.last_tick_completed_at,
    last_tick_stats: dispatchWorkerState.last_tick_stats,
    last_retention_at: dispatchWorkerState.last_retention_at,
    last_retention_stats: dispatchWorkerState.last_retention_stats,
    last_error: dispatchWorkerState.last_error,
    tick_inflight: dispatchWorkerState.tick_inflight,
  };
}

function normalizeWorldMonitorBaseUrl() {
  const configured = safeString(
    process.env.MC_WORLDMONITOR_API_BASE ||
      process.env.WM_API_BASE_URL ||
      process.env.WORLDMONITOR_API_BASE_URL ||
      process.env.REACT_APP_WORLDMONITOR_URL ||
      WORLDMONITOR_DEFAULT_API_BASE
  );
  return configured.replace(/\/+$/, '');
}

function getWorldMonitorHeaders(customHeaders = {}) {
  const headers = {
    Accept: 'application/json',
    'User-Agent': 'AshaMissionControl/1.0',
    ...customHeaders,
  };
  const apiKey = safeString(
    process.env.MC_WORLDMONITOR_API_KEY ||
      process.env.WM_API_KEY ||
      process.env.WORLDMONITOR_API_KEY
  );
  if (apiKey) {
    const apiKeyHeader = safeString(process.env.MC_WORLDMONITOR_API_KEY_HEADER, 'X-WorldMonitor-Key');
    headers[apiKeyHeader] = apiKey;
    if (!headers.Authorization) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
  }
  return headers;
}

function buildWorldMonitorUrl(pathname, query = {}) {
  const baseUrl = normalizeWorldMonitorBaseUrl();
  const url = new URL(pathname.startsWith('/') ? pathname : `/${pathname}`, baseUrl);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const str = String(value).trim();
    if (!str) return;
    url.searchParams.set(key, str);
  });
  return url.toString();
}

function stableHash(value) {
  return crypto.createHash('sha1').update(String(value || '')).digest('hex').slice(0, 12);
}

function getSourceTimeoutMs(sourceName, fallbackMs) {
  const fromConfig = parseCount(
    process.env[`MC_SOURCE_TIMEOUT_${String(sourceName || '').toUpperCase()}`]
      || SOURCE_TIMEOUT_OVERRIDES[sourceName]
      || fallbackMs
  );
  return Math.max(1200, Math.min(fromConfig || fallbackMs || SOURCE_TIMEOUT_DEFAULT_MS, 15000));
}

function isSourceCircuitOpen(sourceName) {
  const state = sourceCircuitState.get(sourceName);
  if (!state) return false;
  return Number(state.open_until || 0) > Date.now();
}

function markSourceSuccess(sourceName) {
  sourceCircuitState.set(sourceName, {
    failures: 0,
    open_until: 0,
  });
}

function markSourceFailure(sourceName) {
  const current = sourceCircuitState.get(sourceName) || { failures: 0, open_until: 0 };
  const nextFailures = Number(current.failures || 0) + 1;
  const shouldOpen = nextFailures >= SOURCE_CIRCUIT_FAILURE_THRESHOLD;
  sourceCircuitState.set(sourceName, {
    failures: shouldOpen ? 0 : nextFailures,
    open_until: shouldOpen ? Date.now() + SOURCE_CIRCUIT_WINDOW_MS : Number(current.open_until || 0),
  });
}

function makeSourceHealth(source, status, latencyMs, message = '') {
  return {
    source,
    status,
    latency_ms: Math.max(0, parseCount(latencyMs)),
    message: safeString(message),
    updated_at: new Date().toISOString(),
  };
}

async function fetchWorldMonitorJson(pathname, options = {}) {
  const method = safeString(options.method, 'GET').toUpperCase();
  const timeoutMs = Math.max(
    1200,
    Math.min(
      parseCount(options.timeoutMs || process.env.MC_WORLDMONITOR_TIMEOUT_MS || WORLDMONITOR_TIMEOUT_MS),
      15000
    )
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = buildWorldMonitorUrl(pathname, options.query || {});

  try {
    const response = await fetch(url, {
      method,
      headers: getWorldMonitorHeaders({
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      }),
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal: controller.signal,
    });
    if (!response.ok) {
      logger.warn(
        {
          endpoint: pathname,
          status: response.status,
          base_url: normalizeWorldMonitorBaseUrl(),
        },
        'WorldMonitor request failed'
      );
      return null;
    }

    const contentType = safeString(response.headers.get('content-type')).toLowerCase();
    if (!contentType.includes('application/json')) {
      logger.warn({ endpoint: pathname, contentType }, 'WorldMonitor non-JSON response');
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.warn(
      {
        endpoint: pathname,
        base_url: normalizeWorldMonitorBaseUrl(),
        reason: safeString(error?.message || String(error)),
      },
      'WorldMonitor request exception'
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWorldMonitorSource(sourceName, pathname, options = {}) {
  if (isSourceCircuitOpen(sourceName)) {
    return {
      data: null,
      health: makeSourceHealth(sourceName, 'circuit_open', 0, 'Temporarily skipped after repeated upstream failures'),
    };
  }

  const startedAt = Date.now();
  const data = await fetchWorldMonitorJson(pathname, {
    ...options,
    timeoutMs: getSourceTimeoutMs(sourceName, options.timeoutMs || WORLDMONITOR_TIMEOUT_MS),
  });
  const latency = Date.now() - startedAt;
  if (data) {
    markSourceSuccess(sourceName);
    return {
      data,
      health: makeSourceHealth(sourceName, 'ok', latency),
    };
  }

  markSourceFailure(sourceName);
  return {
    data: null,
    health: makeSourceHealth(sourceName, 'degraded', latency, 'No payload returned from upstream'),
  };
}

async function persistSourceHealthSnapshots(scope, sourceHealth = []) {
  if (!isPgStateActive() || !Array.isArray(sourceHealth) || !sourceHealth.length) return;

  const entries = sourceHealth
    .map((item) => ({
      source: safeString(item?.source),
      status: safeString(item?.status, 'unknown'),
      latency_ms: Math.max(0, parseCount(item?.latency_ms)),
      message: safeString(item?.message) || null,
      updated_at: toIso(item?.updated_at),
    }))
    .filter((item) => item.source);

  if (!entries.length) return;

  try {
    if (!isUsingSupabase()) {
      const pool = getPool();
      if (pool) {
        await Promise.all(entries.map((item) => pool.query(
          `
            INSERT INTO mc_source_health_snapshots
              (scope_id, source, status, latency_ms, message, updated_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (scope_id, source)
            DO UPDATE SET
              status = EXCLUDED.status,
              latency_ms = EXCLUDED.latency_ms,
              message = EXCLUDED.message,
              updated_at = EXCLUDED.updated_at
          `,
          [
            scope.scope_id,
            item.source,
            item.status,
            item.latency_ms,
            item.message,
            item.updated_at,
          ]
        )));
        return;
      }
    }

    await Promise.all(entries.map(async (item) => {
      const existing = await dbListItems('mc_source_health_snapshots', {
        limit: 1,
        filter: {
          scope_id: scope.scope_id,
          source: item.source,
        },
      });
      const payload = {
        scope_id: scope.scope_id,
        source: item.source,
        status: item.status,
        latency_ms: item.latency_ms,
        message: item.message,
        updated_at: item.updated_at,
      };
      if (existing[0]?.id) {
        await dbPatchItem('mc_source_health_snapshots', existing[0].id, payload);
      } else {
        await dbInsertItem('mc_source_health_snapshots', {
          ...payload,
          created_at: new Date().toISOString(),
        });
      }
    }));
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC source health persistence failed');
  }
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1000, parseCount(timeoutMs)));
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function pickLocationFromText(text) {
  const raw = safeString(text);
  if (!raw) return '';
  const lower = raw.toLowerCase();
  const keys = Object.keys(LOCATION_COORDS);
  for (const key of keys) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  return '';
}

function pickCoordinatesFromLocationName(name, fallbackCountryCode = '') {
  const locationName = safeString(name);
  const fromKnown = LOCATION_COORDS[locationName];
  if (fromKnown) return fromKnown;

  const fromText = pickLocationFromText(locationName);
  if (fromText && LOCATION_COORDS[fromText]) return LOCATION_COORDS[fromText];

  const countryCode = safeString(fallbackCountryCode).toUpperCase();
  if (countryCode && COUNTRY_CODE_COORDS[countryCode]) return COUNTRY_CODE_COORDS[countryCode];
  return null;
}

function detectCountryCodeFromText(text) {
  const raw = safeString(text).toLowerCase();
  if (!raw) return '';
  for (const [countryName, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (raw.includes(countryName)) return code;
  }
  return '';
}

function pickCoordinatesFromNarrative(...chunks) {
  const narrative = chunks.map((item) => safeString(item)).filter(Boolean).join(' ');
  if (!narrative) return null;

  const locationName = pickLocationFromText(narrative);
  if (locationName) {
    const coords = pickCoordinatesFromLocationName(locationName);
    if (coords) return coords;
  }

  const countryCode = detectCountryCodeFromText(narrative);
  if (countryCode) {
    return pickCoordinatesFromLocationName('', countryCode);
  }
  return null;
}

function severityFromThreatLevel(level) {
  const key = safeString(level, 'THREAT_LEVEL_UNSPECIFIED');
  return THREAT_LEVEL_TO_SEVERITY[key] || 'INFO';
}

function confidenceFromUnrestLevel(level) {
  const key = safeString(level, 'CONFIDENCE_LEVEL_UNSPECIFIED');
  return UNREST_CONFIDENCE_TO_SCORE[key] || 0.5;
}

function inferSeverityFromText(text, fallback = 'INFO') {
  const value = safeString(text).toLowerCase();
  if (!value) return fallback;
  if (/(critical|emergency|immediate|attack|strike|explosion|evacuat|siren|incoming|war crime)/.test(value)) return 'CRITICAL';
  if (/(high|urgent|missile|rocket|raid|military|clash|airstrike|drone)/.test(value)) return 'HIGH';
  if (/(elevated|warning|alert|protest|riot|disruption|outage)/.test(value)) return 'ELEVATED';
  return fallback;
}

function inferConfidenceFromText(text, fallback = 0.5) {
  const value = safeString(text).toLowerCase();
  if (!value) return fallback;
  if (/(confirmed|verified|official|live footage|multi-source|independently verified)/.test(value)) return 0.82;
  if (/(reportedly|according to|initial reports|unconfirmed|early signal|rumor|claim)/.test(value)) return 0.42;
  return fallback;
}

function locationLabelFromPoint(lat, lon, fallback = 'Unknown location') {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return fallback;
  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
}

function toTitleCaseWords(value) {
  return safeString(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isGenericSignalLabel(value) {
  const normalized = safeString(value).toLowerCase();
  if (!normalized) return true;
  if (normalized === 'weather' || normalized === 'weather conditions') return true;
  if (normalized === 'cobaltstrike') return true;
  if (normalized === 'weather alert' || normalized === 'cyber threat cluster') return true;
  if (normalized.startsWith('anomaly_type_')) return true;
  if (normalized.startsWith('climate anomaly')) return true;
  if (/^[a-z0-9_-]{1,24}$/.test(normalized) && !normalized.includes(' ')) return true;
  return false;
}

function normalizeSignalLabel(value, fallback = 'Signal') {
  const raw = safeString(value, fallback);
  const normalized = raw.toLowerCase();
  if (normalized.startsWith('anomaly_type_')) {
    const suffix = normalized.replace('anomaly_type_', '').replace(/_/g, ' ').trim();
    const variant = suffix ? ` (${toTitleCaseWords(suffix)})` : '';
    return `Climate Anomaly${variant}`;
  }
  if (normalized === 'cobaltstrike') return 'Cyber Threat Cluster';
  if (normalized === 'weather' || normalized === 'weather conditions') return 'Weather Alert';
  if (/^[a-z0-9_-]{1,24}$/.test(normalized) && !normalized.includes(' ')) {
    return toTitleCaseWords(normalized.replace(/[_-]+/g, ' '));
  }
  return raw;
}

function extractMagnitude(text) {
  const value = safeString(text).toUpperCase();
  const match = value.match(/\bM\s*([0-9]+(?:\.[0-9]+)?)\b/);
  if (!match) return 0;
  return Number.parseFloat(match[1]) || 0;
}

function deriveWeatherSeverityFromSignal(item = {}) {
  const level = safeString(item.level).toUpperCase();
  const narrative = `${safeString(item.event)} ${safeString(item.text)} ${safeString(item.summary)}`.toLowerCase();
  const magnitude = Math.max(
    extractMagnitude(item.event),
    extractMagnitude(item.text),
    extractMagnitude(item.summary)
  );

  if (
    level === 'CRITICAL'
    || magnitude >= 7
    || /(tsunami|major earthquake|category\s*[45]|wildfire evacuation|flash flood emergency|volcanic eruption)/.test(narrative)
  ) {
    return 'CRITICAL';
  }
  if (
    level === 'HIGH'
    || magnitude >= 5.5
    || /(hurricane|typhoon|cyclone|severe storm|evacuation|landfall|extreme heat)/.test(narrative)
  ) {
    return 'HIGH';
  }
  if (
    level === 'ELEVATED'
    || magnitude >= 4
    || /(storm warning|flood watch|aftershock|heavy rain|heatwave)/.test(narrative)
  ) {
    return 'ELEVATED';
  }
  return 'INFO';
}

function deriveCyberSeverityFromSignal(item = {}) {
  const confidence = clamp(Number(item.confidence || 0.5), 0.1, 1);
  const narrative = `${safeString(item.impact)} ${safeString(item.summary)} ${safeString(item.notes)}`.toLowerCase();

  if (
    confidence >= 0.9
    || /(critical infrastructure|nationwide outage|grid disruption|airport shutdown|banking outage|ransomware campaign)/.test(narrative)
  ) {
    return 'CRITICAL';
  }
  if (
    confidence >= 0.72
    || /(internet outage|telecom disruption|service disruption|c2|malware cluster|intrusion wave|ddos wave)/.test(narrative)
  ) {
    return 'HIGH';
  }
  if (
    confidence >= 0.45
    || /(probe activity|scan spike|degraded communications|packet loss)/.test(narrative)
  ) {
    return 'ELEVATED';
  }
  return 'INFO';
}

function deriveSeverityFromEvent(event) {
  const verificationStatus = safeString(event.verification_status, 'unverified');
  const confidence = clamp(Number(event.confidence || 0), 0, 1);
  const fatalities = parseCount(event.fatalities_total);
  const injured = parseCount(event.injured_total);

  if (verificationStatus === 'verified' && (fatalities >= 20 || confidence >= 0.86)) {
    return 'CRITICAL';
  }
  if (verificationStatus === 'verified' && (fatalities >= 5 || injured >= 20 || confidence >= 0.7)) {
    return 'HIGH';
  }
  if (confidence >= 0.4) return 'ELEVATED';
  return 'INFO';
}

function getRiskWarningLevel(item) {
  const confidence = clamp(Number(item.confidence || 0), 0, 1);
  if (confidence < 0.28) return 'high';
  if (confidence < 0.5) return 'medium';
  return 'low';
}

function buildSourceCountsByLocation(events = []) {
  const map = new Map();
  events.forEach((event) => {
    const location = Array.isArray(event.hit_locations) ? event.hit_locations[0] : '';
    const key = safeString(location, 'unknown');
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function withCoordinates(event, idToCoords) {
  if (idToCoords.has(event.id)) {
    return idToCoords.get(event.id);
  }

  const location = Array.isArray(event.hit_locations) ? event.hit_locations[0] : '';
  const fallback = LOCATION_COORDS[location];
  if (fallback) return fallback;
  return null;
}

function makeAlertCard(event, sourceCountsByLocation, idToCoords) {
  const location = safeString(Array.isArray(event.hit_locations) ? event.hit_locations[0] : '', 'Unknown location');
  const coords = withCoordinates(event, idToCoords);
  const severity = deriveSeverityFromEvent(event);
  const hazardType = deriveHazardTypeFromEvent(event);
  const verificationStatus = safeString(event.verification_status, 'unverified');
  const confidenceScore = clamp(Number(event.confidence || 0), 0, 1);

  return {
    id: `alert-${safeString(event.id, Math.random().toString(36).slice(2, 9))}`,
    event_id: safeString(event.id),
    title: safeString(event.title, 'Operational update'),
    location,
    severity,
    confidence_score: Number(confidenceScore.toFixed(3)),
    source_count: Math.max(1, sourceCountsByLocation.get(location) || 1),
    updated_at: toIso(event.event_date || event.reported_at || new Date()),
    verification_status: verificationStatus,
    source_tier: safeString(event.source_tier, 'other'),
    summary: safeString(event.summary, 'No summary available.'),
    source_name: safeString(event.source_name, 'Unknown source'),
    hazard_type: hazardType,
    evidence_pills: [
      `Tier: ${safeString(event.source_tier, 'other')}`,
      `Conf ${Math.round(confidenceScore * 100)}%`,
      verificationStatus === 'verified' ? 'Verified' : 'Unverified',
    ],
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    actions: ['acknowledge', 'mute_similar', 'follow_region'],
  };
}

function sortAlerts(alerts = []) {
  return [...alerts].sort((a, b) => {
    const rankA = SEVERITY_ORDER[normalizeSeverityInput(a.severity)] || 0;
    const rankB = SEVERITY_ORDER[normalizeSeverityInput(b.severity)] || 0;
    if (rankA !== rankB) return rankB - rankA;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function buildTickerItems(verifiedAlerts = [], leakItems = []) {
  const verifiedItems = verifiedAlerts.slice(0, 18).map((alert) => ({
    id: `ticker-${alert.id}`,
    kind: 'verified',
    headline: alert.title,
    severity: alert.severity,
    location: alert.location,
    confidence_score: alert.confidence_score,
    source_count: alert.source_count,
    updated_at: alert.updated_at,
    verification_status: alert.verification_status,
    hazard_type: safeString(alert.hazard_type, 'general'),
    alert_id: alert.id,
    warning: null,
  }));

  const leakTicker = leakItems.slice(0, 10).map((leak) => ({
    id: `ticker-${leak.id}`,
    kind: 'leak',
    headline: leak.title,
    severity: leak.severity,
    location: leak.location,
    confidence_score: leak.confidence_score,
    source_count: leak.source_count,
    updated_at: leak.updated_at,
    verification_status: leak.verification_status,
    hazard_type: safeString(leak.hazard_type, 'general'),
    alert_id: leak.id,
    warning: leak.risk_warning_level,
  }));

  return sortAlerts([...verifiedItems, ...leakTicker]).slice(0, 28);
}

function normalizePizzintTrend(input) {
  const value = safeString(input).toUpperCase();
  if (value === 'TREND_DIRECTION_RISING' || value === 'RISING') return 'rising';
  if (value === 'TREND_DIRECTION_FALLING' || value === 'FALLING') return 'falling';
  return 'stable';
}

function normalizePizzintStatus(bundle = {}) {
  const source = bundle?.pizzint && typeof bundle.pizzint === 'object'
    ? bundle.pizzint
    : bundle && typeof bundle === 'object'
      ? bundle
      : null;
  if (!source) return null;

  const updatedValue = source.updatedAt ?? source.updated_at ?? Date.now();
  const updatedAt = Number(updatedValue) > 0
    ? new Date(Number(updatedValue)).toISOString()
    : toIso(updatedValue);
  const tensions = Array.isArray(bundle?.tensionPairs) ? bundle.tensionPairs : [];

  return {
    defcon_level: clamp(parseCount(source.defconLevel || source.defcon_level || 5), 1, 5),
    defcon_label: safeString(source.defconLabel || source.defcon_label, DEFCON_LABELS[5]),
    aggregate_activity: clamp(parseCount(source.aggregateActivity || source.aggregate_activity), 0, 100),
    active_spikes: Math.max(0, parseCount(source.activeSpikes || source.active_spikes)),
    locations_monitored: Math.max(0, parseCount(source.locationsMonitored || source.locations_monitored)),
    locations_open: Math.max(0, parseCount(source.locationsOpen || source.locations_open)),
    updated_at: updatedAt,
    data_freshness: safeString(source.dataFreshness || source.data_freshness, 'DATA_FRESHNESS_STALE'),
    locations: (Array.isArray(source.locations) ? source.locations : []).slice(0, 16).map((item) => ({
      place_id: safeString(item.placeId || item.place_id),
      name: safeString(item.name, 'Unknown'),
      address: safeString(item.address),
      current_popularity: Math.max(0, parseCount(item.currentPopularity ?? item.current_popularity)),
      percentage_of_usual: Math.max(0, parseCount(item.percentageOfUsual ?? item.percentage_of_usual)),
      is_spike: Boolean(item.isSpike ?? item.is_spike),
      spike_magnitude: Number.isFinite(Number(item.spikeMagnitude ?? item.spike_magnitude))
        ? Number(item.spikeMagnitude ?? item.spike_magnitude)
        : null,
      data_source: safeString(item.dataSource || item.data_source, 'unknown'),
      recorded_at: toIso(item.recordedAt || item.recorded_at),
      data_freshness: safeString(item.dataFreshness || item.data_freshness, 'DATA_FRESHNESS_STALE'),
      is_closed_now: Boolean(item.isClosedNow ?? item.is_closed_now),
      lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : null,
      lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : null,
    })),
    tensions: tensions.slice(0, 6).map((item, index) => ({
      id: safeString(item.id, `tension-${index + 1}`),
      label: safeString(item.label, 'Country pair'),
      score: Number(Number(item.score || 0).toFixed(2)),
      trend: normalizePizzintTrend(item.trend),
      change_percent: Number(Number(item.changePercent || item.change_percent || 0).toFixed(2)),
      region: safeString(item.region, 'global'),
      countries: [
        safeString((Array.isArray(item.countries) ? item.countries[0] : ''), ''),
        safeString((Array.isArray(item.countries) ? item.countries[1] : ''), ''),
      ],
    })),
  };
}

function buildSourceSuggestions(options = {}) {
  const language = normalizeLanguage(options.language || options.lang);
  const country = normalizeCountryHint(options.country);
  const conflict = normalizeConflict(options.conflict || 'all');
  const sourceHealth = Array.isArray(options.source_health) ? options.source_health : [];
  const statusBySource = new Map(
    sourceHealth.map((item) => [safeString(item.source), safeString(item.status, 'unknown')])
  );

  const inMena = ['JO', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'EG', 'LB', 'SY', 'IQ', 'PS', 'IL'].includes(country);
  const inLatam = ['MX', 'CO', 'AR', 'CL', 'PE', 'EC', 'UY', 'PY', 'VE', 'BO', 'DO', 'CR', 'PA'].includes(country);

  const items = SOURCE_SUGGESTION_CATALOG
    .filter((item) => {
      if (item.language === 'multi') return true;
      if (item.language === language) return true;
      return item.language === 'en';
    })
    .filter((item) => {
      if (item.country_scope === 'global') return true;
      if (item.country_scope === country) return true;
      if (item.country_scope === 'mena') return inMena || conflict !== 'all';
      if (item.country_scope === 'latam') return inLatam;
      return false;
    })
    .map((item) => {
      const sourceKey =
        item.id === 'wm-news-en' || item.id === 'wm-news-ar' || item.id === 'wm-news-es'
          ? 'newsDigest'
          : item.id === 'wm-telegram'
            ? 'telegramFeed'
            : item.id === 'wm-oref'
              ? 'orefAlerts'
              : item.id === 'wm-pizzint'
                ? 'pizzintStatus'
                : '';
      const healthState = sourceKey ? safeString(statusBySource.get(sourceKey), 'unknown') : 'unknown';
      const degradedHint = healthState === 'ok' ? '' : ` (currently ${healthState})`;
      return {
        ...item,
        language,
        reason: `${item.reason}${degradedHint}`,
      };
    })
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 };
      return (rank[b.priority] || 0) - (rank[a.priority] || 0);
    })
    .slice(0, 6);

  return {
    language,
    country: country || 'global',
    items,
  };
}

function buildLeakItem(event, sourceCountsByLocation, idToCoords) {
  const card = makeAlertCard(event, sourceCountsByLocation, idToCoords);
  return {
    id: `leak-${safeString(event.id, Math.random().toString(36).slice(2, 9))}`,
    title: card.title,
    location: card.location,
    severity: card.severity,
    confidence_score: card.confidence_score,
    source_count: card.source_count,
    updated_at: card.updated_at,
    verification_status: 'unverified',
    hazard_type: safeString(card.hazard_type, 'general'),
    unverified_reason: safeString(event.verification_reason, 'Awaiting independent verification'),
    risk_warning_level: getRiskWarningLevel(event),
    source_name: card.source_name,
    summary: card.summary,
    latitude: card.latitude,
    longitude: card.longitude,
  };
}

function mergeLayouts(customLayouts = {}) {
  const map = new Map(DEFAULT_LAYOUT_PRESETS.map((preset) => [preset.id, { ...preset }]));
  Object.values(customLayouts || {}).forEach((preset) => {
    if (!preset || !preset.id) return;
    map.set(String(preset.id), { ...preset });
  });
  return [...map.values()];
}

function mergeNotificationPreference(currentPreference = {}, patch = {}) {
  const mergedAudioProfiles = {
    ...(DEFAULT_NOTIFICATION_PREFERENCE.audio?.severity_profiles || {}),
    ...((currentPreference.audio && currentPreference.audio.severity_profiles) || {}),
    ...((patch?.audio && patch.audio.severity_profiles) || {}),
  };

  const current = {
    ...DEFAULT_NOTIFICATION_PREFERENCE,
    ...currentPreference,
    channels: {
      ...DEFAULT_NOTIFICATION_PREFERENCE.channels,
      ...(currentPreference.channels || {}),
    },
    dispatch: {
      ...DEFAULT_NOTIFICATION_PREFERENCE.dispatch,
      ...(currentPreference.dispatch || {}),
    },
    digest: {
      ...DEFAULT_NOTIFICATION_PREFERENCE.digest,
      ...(currentPreference.digest || {}),
    },
    quiet_hours: {
      ...DEFAULT_NOTIFICATION_PREFERENCE.quiet_hours,
      ...(currentPreference.quiet_hours || {}),
    },
    audio: {
      ...DEFAULT_NOTIFICATION_PREFERENCE.audio,
      ...(currentPreference.audio || {}),
      severity_profiles: mergedAudioProfiles,
    },
  };

  return {
    ...current,
    ...patch,
    channels: {
      ...current.channels,
      ...((patch && patch.channels) || {}),
    },
    digest: {
      ...current.digest,
      ...((patch && patch.digest) || {}),
    },
    quiet_hours: {
      ...current.quiet_hours,
      ...((patch && patch.quiet_hours) || {}),
    },
    audio: {
      ...current.audio,
      ...((patch && patch.audio) || {}),
      mode: normalizeAudioMode(patch?.audio?.mode || current.audio?.mode),
      vibration:
        typeof patch?.audio?.vibration === 'boolean'
          ? patch.audio.vibration
          : Boolean(current.audio?.vibration),
      severity_profiles: mergedAudioProfiles,
    },
    muted_regions: Array.isArray(patch?.muted_regions)
      ? patch.muted_regions.map((item) => safeString(item)).filter(Boolean)
      : current.muted_regions,
    muted_topics: Array.isArray(patch?.muted_topics)
      ? patch.muted_topics.map((item) => safeString(item)).filter(Boolean)
      : current.muted_topics,
    dispatch: {
      ...current.dispatch,
      ...((patch && patch.dispatch) || {}),
      verified_critical_instant: true,
    },
    updated_at: new Date().toISOString(),
  };
}

function withDispatchPolicy(preference) {
  return {
    ...preference,
    dispatch: {
      ...(preference?.dispatch || {}),
      verified_critical_instant: true,
    },
    dispatch_policy: {
      critical_verified: 'instant',
      high_verified: preference?.dispatch?.verified_high_instant ? 'instant' : 'digest',
      elevated: preference?.dispatch?.elevated_instant ? 'instant' : 'digest',
      info: 'digest',
      channels: {
        in_app: Boolean(preference?.channels?.in_app),
        email: Boolean(preference?.channels?.email),
        push: Boolean(preference?.channels?.push),
      },
    },
    alert_tier_policy: {
      basic: 'critical_instant',
      pro: 'critical_instant_plus_advanced',
      critical_delay_allowed: false,
      monetization_scope: 'analytics_and_power_features_only',
      rationale: 'Safety-critical alerts are never delayed or paywalled.',
    },
  };
}

function buildInfrastructurePoints() {
  return [
    { id: 'infra-ashdod-port', name: 'Ashdod Port', latitude: 31.804, longitude: 34.64, risk: 0.52 },
    { id: 'infra-haifa-port', name: 'Haifa Port', latitude: 32.823, longitude: 35.0, risk: 0.47 },
    { id: 'infra-eilat-port', name: 'Eilat Port', latitude: 29.55, longitude: 34.95, risk: 0.35 },
    { id: 'infra-rafah-crossing', name: 'Rafah Crossing', latitude: 31.253, longitude: 34.264, risk: 0.74 },
    { id: 'infra-tehran-air-hub', name: 'Tehran Air Hub', latitude: 35.69, longitude: 51.313, risk: 0.41 },
  ];
}

function buildWaterwayLines() {
  return [
    {
      id: 'waterway-suez',
      name: 'Suez Corridor',
      points: [
        [32.3, 30.0],
        [32.55, 30.1],
        [32.62, 30.38],
      ],
      risk: 0.46,
    },
    {
      id: 'waterway-hormuz',
      name: 'Strait of Hormuz',
      points: [
        [56.08, 26.3],
        [56.25, 26.56],
        [56.5, 26.8],
      ],
      risk: 0.58,
    },
    {
      id: 'waterway-babelmandeb',
      name: 'Bab el-Mandeb',
      points: [
        [43.0, 12.2],
        [43.33, 12.58],
        [43.7, 12.9],
      ],
      risk: 0.63,
    },
  ];
}

function buildOptionalLayerFeed(alerts = []) {
  const criticalCoords = alerts
    .filter((item) => item.latitude !== null && item.longitude !== null)
    .slice(0, 8);

  return {
    flight_radar: criticalCoords.map((item, index) => ({
      id: `flight-${index + 1}`,
      callsign: `MC${String(170 + index)}`,
      latitude: Number(item.latitude) + (index % 2 === 0 ? 0.4 : -0.35),
      longitude: Number(item.longitude) + (index % 2 === 0 ? 0.6 : -0.45),
      heading: 70 + (index * 14),
      speed_kts: 380 + (index * 12),
      updated_at: new Date().toISOString(),
    })),
    maritime_risk: [
      { id: 'sea-1', latitude: 26.62, longitude: 56.2, risk: 0.74, corridor: 'Strait of Hormuz' },
      { id: 'sea-2', latitude: 12.62, longitude: 43.38, risk: 0.79, corridor: 'Bab el-Mandeb' },
      { id: 'sea-3', latitude: 30.2, longitude: 32.56, risk: 0.61, corridor: 'Suez Canal' },
    ],
    cyber_comms: [
      { id: 'cyber-1', latitude: 32.08, longitude: 34.79, impact: 'regional', confidence: 0.57 },
      { id: 'cyber-2', latitude: 35.7, longitude: 51.4, impact: 'metro', confidence: 0.49 },
    ],
    economic_shocks: [
      { id: 'eco-1', latitude: 24.7136, longitude: 46.6753, intensity: 0.58 },
      { id: 'eco-2', latitude: 25.2048, longitude: 55.2708, intensity: 0.44 },
    ],
    weather_alerts: [
      { id: 'wx-1', latitude: 31.2, longitude: 34.2, level: 'HIGH', event: 'Dust storm' },
      { id: 'wx-2', latitude: 33.5, longitude: 36.3, level: 'ELEVATED', event: 'Heavy thunderstorm cell' },
    ],
  };
}

function conflictToWorldMonitorCountry(conflict) {
  const value = normalizeConflict(conflict);
  if (value === 'gaza-israel') return 'Israel';
  if (value === 'israel-us-iran') return 'Iran';
  return '';
}

function extractCountFromText(text) {
  const raw = safeString(text);
  if (!raw) return 0;
  const numbers = raw.match(/\b\d{1,4}\b/g) || [];
  if (!numbers.length) return 0;
  return clamp(parseCount(numbers[0]), 0, 10000);
}

function inferFatalitiesFromText(text) {
  const raw = safeString(text).toLowerCase();
  if (!raw) return 0;
  if (!/(killed|dead|fatalit|deaths|casualt)/.test(raw)) return 0;
  return extractCountFromText(raw);
}

function inferInjuriesFromText(text) {
  const raw = safeString(text).toLowerCase();
  if (!raw) return 0;
  if (!/(injured|wounded|casualt)/.test(raw)) return 0;
  return extractCountFromText(raw);
}

function normalizeWorldMonitorConflictEvents(events = []) {
  return (events || [])
    .filter((event) => event && event.id)
    .map((event) => {
      const latitude = Number(event?.location?.latitude);
      const longitude = Number(event?.location?.longitude);
      const location = safeString(event.admin1 || event.country, locationLabelFromPoint(latitude, longitude));
      return {
        id: `wm-acled-${safeString(event.id)}`,
        title: `${safeString(event.eventType, 'Conflict event')} in ${location}`,
        summary: safeString(event.actors?.join(' vs ') || event.source, 'ACLED conflict event'),
        hit_locations: [location],
        event_date: toIso(event.occurredAt || Date.now()),
        reported_at: toIso(event.occurredAt || Date.now()),
        verification_status: 'verified',
        confidence: 0.86,
        source_tier: 'official',
        fatalities_total: parseCount(event.fatalities),
        injured_total: 0,
        source_name: safeString(event.source, 'ACLED'),
        verification_reason: '',
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
      };
    });
}

function normalizeWorldMonitorUnrestEvents(events = []) {
  return (events || [])
    .filter((event) => event && event.id)
    .map((event) => {
      const latitude = Number(event?.location?.latitude);
      const longitude = Number(event?.location?.longitude);
      const fallbackLocation = safeString(event.city || event.region || event.country, locationLabelFromPoint(latitude, longitude));
      const verificationStatus =
        safeString(event.sourceType).toUpperCase() === 'UNREST_SOURCE_TYPE_ACLED'
          ? 'verified'
          : 'unverified';
      return {
        id: `wm-unrest-${safeString(event.id)}`,
        title: safeString(event.title, `Unrest signal in ${fallbackLocation}`),
        summary: safeString(event.summary, 'Civil unrest signal'),
        hit_locations: [fallbackLocation],
        event_date: toIso(event.occurredAt || Date.now()),
        reported_at: toIso(event.occurredAt || Date.now()),
        verification_status: verificationStatus,
        confidence: confidenceFromUnrestLevel(event.confidence),
        source_tier: verificationStatus === 'verified' ? 'official' : 'open-source',
        fatalities_total: parseCount(event.fatalities),
        injured_total: 0,
        source_name: safeString((event.sources || [])[0], safeString(event.sourceType, 'Unrest feed')),
        verification_reason:
          verificationStatus === 'verified'
            ? ''
            : 'Signal is still unverified and requires independent confirmation',
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
      };
    });
}

function flattenNewsDigestItems(newsDigest = {}) {
  const categories = newsDigest?.categories && typeof newsDigest.categories === 'object'
    ? newsDigest.categories
    : {};

  return Object.entries(categories).flatMap(([category, bucket]) => {
    const items = Array.isArray(bucket?.items) ? bucket.items : [];
    return items.map((item) => ({ category, ...item }));
  });
}

function normalizeWorldMonitorNewsEvents(newsDigest = {}) {
  const feedItems = flattenNewsDigestItems(newsDigest);
  return feedItems
    .filter((item) => item && item.title)
    .slice(0, 240)
    .map((item) => {
      const threatLevel = safeString(item?.threat?.level, 'THREAT_LEVEL_UNSPECIFIED');
      const threatConfidence = clamp(Number(item?.threat?.confidence || 0.45), 0, 1);
      const severity = severityFromThreatLevel(threatLevel);
      const verificationStatus =
        (severity === 'CRITICAL' || severity === 'HIGH') && threatConfidence >= 0.65
          ? 'verified'
          : 'unverified';
      const title = safeString(item.title, 'Breaking intelligence update');
      const summary = safeString(item.link, `Category: ${safeString(item.category, 'general')}`);
      const detectedLocation = pickLocationFromText(`${title} ${summary}`);
      const locationName = safeString(detectedLocation || item.locationName || item.category || 'Global');
      const fromLocation = pickCoordinatesFromNarrative(locationName, title, summary);
      const latitude = Number(item?.location?.latitude);
      const longitude = Number(item?.location?.longitude);
      const lat = Number.isFinite(latitude) ? latitude : fromLocation?.latitude ?? null;
      const lon = Number.isFinite(longitude) ? longitude : fromLocation?.longitude ?? null;
      const eventDate = Number(item.publishedAt) > 0 ? Number(item.publishedAt) : Date.now();
      return {
        id: `wm-news-${stableHash(`${safeString(item.link)}|${title}|${eventDate}`)}`,
        title,
        summary,
        hit_locations: [locationName],
        event_date: toIso(eventDate),
        reported_at: toIso(eventDate),
        verification_status: verificationStatus,
        confidence: threatConfidence || inferConfidenceFromText(title, 0.48),
        source_tier: 'open-source',
        fatalities_total: inferFatalitiesFromText(title),
        injured_total: inferInjuriesFromText(title),
        source_name: safeString(item.source, 'News feed'),
        verification_reason:
          verificationStatus === 'verified'
            ? ''
            : 'Headline is treated as unverified until corroborated',
        latitude: lat,
        longitude: lon,
      };
    });
}

function normalizeWorldMonitorOrefEvents(oref = {}) {
  const alerts = Array.isArray(oref?.alerts) ? oref.alerts : [];
  return alerts.map((item, index) => {
    const location = safeString(item?.city || item?.location || item?.region || 'Israel');
    const coords = pickCoordinatesFromLocationName(location, 'IL');
    const title = safeString(item?.title || item?.text || 'OREF siren alert');
    const eventDate = toIso(item?.timestamp || item?.ts || Date.now());
    return {
      id: `wm-oref-${stableHash(`${title}|${location}|${eventDate}|${index}`)}`,
      title,
      summary: safeString(item?.text || item?.details || 'Civil defense warning'),
      hit_locations: [location],
      event_date: eventDate,
      reported_at: eventDate,
      verification_status: 'verified',
      confidence: 0.92,
      source_tier: 'official',
      fatalities_total: inferFatalitiesFromText(title),
      injured_total: inferInjuriesFromText(title),
      source_name: safeString(item?.source || 'OREF'),
      verification_reason: '',
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    };
  });
}

function normalizeWorldMonitorTelegramLeaks(telegram = {}) {
  const items = Array.isArray(telegram?.items) ? telegram.items : [];
  return items.slice(0, 80).map((item, index) => {
    const text = safeString(item.text || item.title, 'Unverified leak update');
    const detectedLocation = pickLocationFromText(text);
    const location = safeString(detectedLocation || item.topic || item.channelTitle, 'Unspecified region');
    const coords = pickCoordinatesFromNarrative(location, text, item.channelTitle, item.topic);
    const confidence = inferConfidenceFromText(text, 0.36);
    return {
      id: `leak-telegram-${stableHash(`${safeString(item.id)}|${text}|${index}`)}`,
      title: text.slice(0, 180),
      location,
      severity: inferSeverityFromText(text, 'ELEVATED'),
      confidence_score: Number(confidence.toFixed(3)),
      source_count: 1,
      updated_at: toIso(item.ts || item.updatedAt || Date.now()),
      verification_status: 'unverified',
      unverified_reason: 'Pending independent verification.',
      risk_warning_level: getRiskWarningLevel({ confidence }),
      source_name: safeString(item.channelTitle || item.channel || 'Telegram'),
      summary: text,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    };
  });
}

function computeLocationIntensity(eventPoints = []) {
  const grouped = new Map();
  eventPoints.forEach((point) => {
    const key = safeString(point.location, 'Unknown location');
    const current = grouped.get(key) || {
      location: key,
      hits: 0,
      latitude: Number(point.latitude) || 0,
      longitude: Number(point.longitude) || 0,
    };
    current.hits += 1;
    grouped.set(key, current);
  });

  return [...grouped.values()]
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 120);
}

function mergeMapEventPoints(primaryPoints = [], derivedPoints = [], limit = 220) {
  const byKey = new Map();
  [...(primaryPoints || []), ...(derivedPoints || [])].forEach((point) => {
    const latitude = Number(point?.latitude);
    const longitude = Number(point?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const latBucket = Math.round(latitude * 2) / 2;
    const lonBucket = Math.round(longitude * 2) / 2;
    const locationKey = safeString(point?.location).toLowerCase().slice(0, 36);
    const key = `${latBucket}:${lonBucket}:${locationKey}`;

    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, point);
      return;
    }

    const currentConfidence = Number(current.confidence || 0);
    const nextConfidence = Number(point.confidence || 0);
    const currentImpact = parseCount(current.fatalities_total) + parseCount(current.injured_total);
    const nextImpact = parseCount(point.fatalities_total) + parseCount(point.injured_total);
    const currentTs = parseTimestampMs(current.event_date) || 0;
    const nextTs = parseTimestampMs(point.event_date) || 0;

    if (nextImpact > currentImpact || nextConfidence > currentConfidence || nextTs > currentTs) {
      byKey.set(key, point);
    }
  });

  return [...byKey.values()].slice(0, Math.max(32, parseCount(limit)));
}

function deriveEventPointsFromOptionalFeeds(optionalFeeds = {}) {
  const fromFlight = Array.isArray(optionalFeeds.flight_radar)
    ? optionalFeeds.flight_radar.slice(0, 18).map((item, idx) => ({
      id: `derived-flight-${idx + 1}-${safeString(item.id, stableHash(item.callsign || idx))}`,
      event_date: toIso(item.updated_at || Date.now()),
      location: safeString(item.callsign, locationLabelFromPoint(item.latitude, item.longitude)),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      confidence: 0.42,
      source_tier: 'derived-flight',
      fatalities_total: 0,
      injured_total: 0,
      official_announcement_types: [],
    }))
    : [];

  const fromMaritime = Array.isArray(optionalFeeds.maritime_risk)
    ? optionalFeeds.maritime_risk.slice(0, 14).map((item, idx) => ({
      id: `derived-maritime-${idx + 1}-${safeString(item.id, stableHash(item.corridor || idx))}`,
      event_date: toIso(Date.now()),
      location: safeString(item.corridor, locationLabelFromPoint(item.latitude, item.longitude)),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      confidence: clamp(Number(item.risk || 0.5), 0.35, 0.88),
      source_tier: 'derived-maritime',
      fatalities_total: 0,
      injured_total: 0,
      official_announcement_types: [],
    }))
    : [];

  const fromCyber = Array.isArray(optionalFeeds.cyber_comms)
    ? optionalFeeds.cyber_comms.slice(0, 16).map((item, idx) => ({
      id: `derived-cyber-${idx + 1}-${safeString(item.id, stableHash(item.impact || idx))}`,
      event_date: toIso(Date.now()),
      location: safeString(item.location || item.region || item.country)
        || (isGenericSignalLabel(item.impact)
        ? locationLabelFromPoint(item.latitude, item.longitude)
        : safeString(item.impact, locationLabelFromPoint(item.latitude, item.longitude))),
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      confidence: clamp(Number(item.confidence || 0.5), 0.35, 0.82),
      source_tier: 'derived-cyber',
      fatalities_total: 0,
      injured_total: 0,
      official_announcement_types: [],
    }))
    : [];

  const fromWeather = Array.isArray(optionalFeeds.weather_alerts)
    ? optionalFeeds.weather_alerts.slice(0, 10).map((item, idx) => {
      const derivedSeverity = deriveWeatherSeverityFromSignal(item);
      const confidence =
        derivedSeverity === 'CRITICAL'
          ? 0.84
          : derivedSeverity === 'HIGH'
            ? 0.72
            : derivedSeverity === 'ELEVATED'
              ? 0.56
              : 0.42;
      return {
        id: `derived-weather-${idx + 1}-${safeString(item.id, stableHash(item.event || idx))}`,
        event_date: toIso(Date.now()),
        location: safeString(item.location || item.region || item.country)
          || (isGenericSignalLabel(item.event)
          ? locationLabelFromPoint(item.latitude, item.longitude)
          : safeString(item.event, locationLabelFromPoint(item.latitude, item.longitude))),
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        confidence,
        source_tier: 'derived-weather',
        fatalities_total: 0,
        injured_total: 0,
        official_announcement_types: [],
      };
    })
    : [];

  return [...fromFlight, ...fromMaritime, ...fromCyber, ...fromWeather]
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .slice(0, 64);
}

function deriveEventPointsFromAlertCards(alerts = [], sourceTier = 'derived-alert') {
  return (alerts || [])
    .slice(0, 80)
    .map((item, index) => {
      const fallbackCoords = pickCoordinatesFromNarrative(
        safeString(item.location),
        safeString(item.title),
        safeString(item.summary)
      );
      const latitude = Number(item.latitude ?? fallbackCoords?.latitude);
      const longitude = Number(item.longitude ?? fallbackCoords?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        id: `derived-alert-${safeString(item.id, String(index + 1))}`,
        event_date: toIso(item.updated_at || Date.now()),
        location: safeString(item.location, locationLabelFromPoint(latitude, longitude)),
        latitude,
        longitude,
        confidence: clamp(Number(item.confidence_score || 0.5), 0.25, 0.95),
        source_tier: sourceTier,
        fatalities_total: 0,
        injured_total: 0,
        official_announcement_types: [],
      };
    })
    .filter(Boolean);
}

function buildWorldMonitorInfrastructurePoints(outages = []) {
  const base = buildInfrastructurePoints();
  const outagePoints = (outages || [])
    .filter((outage) => outage?.location)
    .slice(0, 8)
    .map((outage, index) => {
      const severity = safeString(outage.severity, 'OUTAGE_SEVERITY_UNSPECIFIED');
      const risk = OUTAGE_SEVERITY_TO_SCORE[severity] || 0.5;
      return {
        id: `infra-outage-${index + 1}-${stableHash(outage.id || outage.title)}`,
        name: safeString(outage.title, 'Infrastructure outage'),
        latitude: Number(outage.location.latitude),
        longitude: Number(outage.location.longitude),
        risk: Number(risk.toFixed(2)),
      };
    })
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

  return [...base, ...outagePoints].slice(0, 18);
}

function toFlightTrack(raw, idx, sourceLabel) {
  const latitude = Number(raw.latitude ?? raw.lat ?? raw?.location?.latitude);
  const longitude = Number(raw.longitude ?? raw.lon ?? raw?.location?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    id: `flight-${sourceLabel}-${idx + 1}`,
    callsign: safeString(raw.callsign || raw.flight || raw.hexCode, `MC-${idx + 1}`),
    latitude,
    longitude,
    heading: Number(raw.heading || 0),
    speed_kts: Number(raw.speed || raw.speed_kts || 0),
    updated_at: toIso(raw.lastSeen || raw.lastSeenAt || raw.updatedAt || Date.now()),
  };
}

function buildWorldMonitorOptionalFeeds(bundle = {}, fallbackAlerts = []) {
  const commercialFlights = Array.isArray(bundle?.commercialFlights?.flights)
    ? bundle.commercialFlights.flights
    : [];
  const militaryFlights = Array.isArray(bundle?.militaryFlights?.flights)
    ? bundle.militaryFlights.flights
    : [];

  const flightRadar = [
    ...commercialFlights.slice(0, 30).map((item, idx) => toFlightTrack(item, idx, 'commercial')),
    ...militaryFlights.slice(0, 20).map((item, idx) => toFlightTrack(item, idx, 'military')),
  ].filter(Boolean);

  const warnings = Array.isArray(bundle?.navWarnings?.warnings) ? bundle.navWarnings.warnings : [];
  const maritimeRisk = warnings
    .slice(0, 40)
    .map((warning, index) => {
      const coords = warning.location
        ? {
            latitude: Number(warning.location.latitude),
            longitude: Number(warning.location.longitude),
          }
        : pickCoordinatesFromLocationName(`${safeString(warning.area)} ${safeString(warning.text)}`);
      if (!coords) return null;
      const text = `${safeString(warning.title)} ${safeString(warning.text)}`;
      const risk = inferSeverityFromText(text, 'ELEVATED') === 'CRITICAL'
        ? 0.88
        : inferSeverityFromText(text, 'ELEVATED') === 'HIGH'
          ? 0.72
          : 0.56;
      return {
        id: `sea-warning-${index + 1}`,
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
        risk: Number(risk.toFixed(2)),
        corridor: safeString(warning.area, 'Maritime warning'),
      };
    })
    .filter(Boolean);

  const cyberThreats = Array.isArray(bundle?.cyberThreats?.threats) ? bundle.cyberThreats.threats : [];
  const cyberComms = cyberThreats
    .slice(0, 80)
    .map((threat, index) => {
      const latitude = Number(threat?.location?.latitude);
      const longitude = Number(threat?.location?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      const severity = safeString(threat.severity, 'CRITICALITY_LEVEL_UNSPECIFIED');
      return {
        id: `cyber-${index + 1}`,
        latitude,
        longitude,
        impact: safeString(threat.malwareFamily || threat.type, 'regional'),
        confidence: CYBER_CRITICALITY_TO_SCORE[severity] || 0.5,
      };
    })
    .filter(Boolean);

  const outages = Array.isArray(bundle?.outages?.outages) ? bundle.outages.outages : [];
  const economicShocks = outages
    .slice(0, 20)
    .map((outage, index) => {
      const latitude = Number(outage?.location?.latitude);
      const longitude = Number(outage?.location?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      const severity = safeString(outage.severity, 'OUTAGE_SEVERITY_UNSPECIFIED');
      return {
        id: `eco-${index + 1}`,
        latitude,
        longitude,
        intensity: OUTAGE_SEVERITY_TO_SCORE[severity] || 0.5,
      };
    })
    .filter(Boolean);

  const aviationAlerts = Array.isArray(bundle?.aviationDelays?.alerts) ? bundle.aviationDelays.alerts : [];
  const weatherAlerts = aviationAlerts
    .filter((alert) => {
      const reason = safeString(alert.reason).toLowerCase();
      return /(weather|storm|snow|wind|visibility|fog|thunder|dust)/.test(reason);
    })
    .slice(0, 20)
    .map((alert, index) => ({
      id: `wx-${index + 1}`,
      latitude: Number(alert?.location?.latitude),
      longitude: Number(alert?.location?.longitude),
      level: inferSeverityFromText(alert.reason, 'ELEVATED'),
      event: safeString(alert.reason, 'Aviation weather delay'),
    }))
    .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));

  const earthquakes = Array.isArray(bundle?.earthquakes?.earthquakes) ? bundle.earthquakes.earthquakes : [];
  const earthquakeAlerts = earthquakes
    .slice(0, 24)
    .map((event, index) => {
      const latitude = Number(event.latitude ?? event.lat ?? event?.location?.latitude);
      const longitude = Number(event.longitude ?? event.lon ?? event?.location?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      const magnitude = Number(event.magnitude || event.mag || 0);
      const level = magnitude >= 6.5 ? 'CRITICAL' : magnitude >= 5.2 ? 'HIGH' : 'ELEVATED';
      const label = safeString(event.place || event.title || event.region, 'Seismic activity');
      return {
        id: `eq-${index + 1}`,
        latitude,
        longitude,
        level,
        event: `${label} M${magnitude || '?'}`,
      };
    })
    .filter(Boolean);

  const wildfireDetections = Array.isArray(bundle?.wildfires?.fireDetections) ? bundle.wildfires.fireDetections : [];
  const wildfireAlerts = wildfireDetections
    .slice(0, 24)
    .map((event, index) => {
      const latitude = Number(event.latitude ?? event.lat ?? event?.location?.latitude);
      const longitude = Number(event.longitude ?? event.lon ?? event?.location?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      const confidence = Number(event.confidence || event.frp || event.brightness || 0);
      const level = confidence >= 85 ? 'HIGH' : 'ELEVATED';
      const label = safeString(event.region || event.name || event.title, 'Wildfire detection');
      return {
        id: `wf-${index + 1}`,
        latitude,
        longitude,
        level,
        event: label,
      };
    })
    .filter(Boolean);

  const climateAnomalies = Array.isArray(bundle?.climateAnomalies?.anomalies) ? bundle.climateAnomalies.anomalies : [];
  const climateAlerts = climateAnomalies
    .slice(0, 18)
    .map((event, index) => {
      const latitude = Number(event.latitude ?? event.lat ?? event?.location?.latitude);
      const longitude = Number(event.longitude ?? event.lon ?? event?.location?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        id: `climate-${index + 1}`,
        latitude,
        longitude,
        level: inferSeverityFromText(`${safeString(event.type)} ${safeString(event.severity)}`, 'ELEVATED'),
        event: safeString(event.title || event.type || 'Climate anomaly'),
      };
    })
    .filter(Boolean);

  const fallbackOptional = buildOptionalLayerFeed(fallbackAlerts);
  const naturalWeatherAlerts = [...weatherAlerts, ...earthquakeAlerts, ...wildfireAlerts, ...climateAlerts];

  return {
    flight_radar: flightRadar.length ? flightRadar : fallbackOptional.flight_radar,
    maritime_risk: maritimeRisk.length ? maritimeRisk : fallbackOptional.maritime_risk,
    cyber_comms: cyberComms.length ? cyberComms : fallbackOptional.cyber_comms,
    economic_shocks: economicShocks.length ? economicShocks : fallbackOptional.economic_shocks,
    weather_alerts: naturalWeatherAlerts.length ? naturalWeatherAlerts : fallbackOptional.weather_alerts,
  };
}

async function fetchWorldMonitorBundle(options = {}) {
  const days = Math.max(1, Math.min(parseCount(options.days || 14), 90));
  const language = normalizeLanguage(options.language || options.lang);
  const end = Date.now();
  const start = end - (days * 24 * 60 * 60 * 1000);
  const conflictCountry = conflictToWorldMonitorCountry(options.conflict);

  const sourceDefs = [
    {
      key: 'acled',
      path: '/api/conflict/v1/list-acled-events',
      options: {
        query: {
          start,
          end,
          page_size: 220,
          country: conflictCountry,
        },
      },
    },
    {
      key: 'unrest',
      path: '/api/unrest/v1/list-unrest-events',
      options: {
        query: {
          start,
          end,
          page_size: 220,
          country: conflictCountry,
        },
      },
    },
    {
      key: 'newsDigest',
      path: '/api/news/v1/list-feed-digest',
      options: {
        query: {
          variant: 'full',
          lang: language,
        },
      },
    },
    { key: 'riskScores', path: '/api/intelligence/v1/get-risk-scores' },
    { key: 'commercialFlights', path: '/api/commercial-flights' },
    { key: 'militaryFlights', path: '/api/military-flights' },
    {
      key: 'navWarnings',
      path: '/api/maritime/v1/list-navigational-warnings',
      options: { query: { page_size: 80 } },
    },
    {
      key: 'cyberThreats',
      path: '/api/cyber/v1/list-cyber-threats',
      options: { query: { page_size: 120 } },
    },
    {
      key: 'outages',
      path: '/api/infrastructure/v1/list-internet-outages',
      options: { query: { page_size: 80 } },
    },
    { key: 'aviationDelays', path: '/api/aviation/v1/list-airport-delays' },
    {
      key: 'earthquakes',
      path: '/api/seismology/v1/list-earthquakes',
      options: { query: { page_size: 80 } },
    },
    {
      key: 'wildfires',
      path: '/api/wildfire/v1/list-fire-detections',
      options: { query: { page_size: 80 } },
    },
    {
      key: 'climateAnomalies',
      path: '/api/climate/v1/list-climate-anomalies',
      options: { query: { page_size: 80 } },
    },
    {
      key: 'telegramFeed',
      path: '/api/telegram-feed',
      options: { query: { limit: 60 } },
    },
    { key: 'orefAlerts', path: '/api/oref-alerts' },
    {
      key: 'pizzintStatus',
      path: '/api/intelligence/v1/get-pizzint-status',
      options: {
        query: {
          include_gdelt: true,
        },
      },
    },
  ];

  const sourceResults = await Promise.all(
    sourceDefs.map((def) => fetchWorldMonitorSource(def.key, def.path, def.options || {}))
  );

  const sourceMap = sourceDefs.reduce((acc, def, index) => {
    acc[def.key] = sourceResults[index];
    return acc;
  }, {});

  return {
    acled: Array.isArray(sourceMap.acled?.data?.events) ? sourceMap.acled.data.events : [],
    unrest: Array.isArray(sourceMap.unrest?.data?.events) ? sourceMap.unrest.data.events : [],
    newsDigest: sourceMap.newsDigest?.data || { categories: {}, feedStatuses: {}, generatedAt: new Date().toISOString() },
    riskScores: sourceMap.riskScores?.data || { ciiScores: [], strategicRisks: [] },
    commercialFlights: sourceMap.commercialFlights?.data || { flights: [], generatedAt: new Date().toISOString() },
    militaryFlights: sourceMap.militaryFlights?.data || { flights: [], generatedAt: new Date().toISOString() },
    navWarnings: sourceMap.navWarnings?.data || { warnings: [] },
    cyberThreats: sourceMap.cyberThreats?.data || { threats: [] },
    outages: sourceMap.outages?.data || { outages: [] },
    aviationDelays: sourceMap.aviationDelays?.data || { alerts: [] },
    earthquakes: sourceMap.earthquakes?.data || { earthquakes: [] },
    wildfires: sourceMap.wildfires?.data || { fireDetections: [] },
    climateAnomalies: sourceMap.climateAnomalies?.data || { anomalies: [] },
    telegramFeed: sourceMap.telegramFeed?.data || { items: [] },
    orefAlerts: sourceMap.orefAlerts?.data || { alerts: [] },
    pizzintStatus: sourceMap.pizzintStatus?.data || { pizzint: null, tensionPairs: [] },
    source_health: sourceResults.map((item) => item.health),
  };
}

function buildWorldMonitorAnalyst(bundle, criticalNow, locationIntensity, verificationMode) {
  const strategicRisk = Array.isArray(bundle?.riskScores?.strategicRisks)
    ? bundle.riskScores.strategicRisks[0]
    : null;
  const fusionScore = clamp(Number((strategicRisk?.score || 0) / 100), 0, 1);

  const feedStatuses = bundle?.newsDigest?.feedStatuses && typeof bundle.newsDigest.feedStatuses === 'object'
    ? bundle.newsDigest.feedStatuses
    : {};
  const degradedFeeds = Object.entries(feedStatuses).filter(([, status]) => status !== 'ok');
  const topGaps = degradedFeeds.slice(0, 5).map(([signal, status]) => ({
    dimension: 'news_feed',
    signal,
    severity: status === 'timeout' ? 'high' : 'medium',
    score: status === 'timeout' ? 0.8 : 0.55,
    reasons: [`Feed status reported as "${status}".`],
  }));

  const topLocations = (locationIntensity || []).slice(0, 8).map((item) => ({
    location: safeString(item.location, 'Unknown'),
    hits: parseCount(item.hits),
  }));

  return {
    fusion_score: Number(fusionScore.toFixed(3)),
    confidence_label:
      verificationMode === 'verified-first'
        ? 'verified-bias'
        : fusionScore >= 0.7
          ? 'high'
          : fusionScore >= 0.45
            ? 'medium'
            : 'low',
    top_gaps: topGaps,
    top_locations: topLocations,
    top_weapons: [],
    top_technologies: [],
    digest: null,
  };
}

function buildAiGeoContext(criticalNow = [], leaks = [], analyst = {}, bundle = {}) {
  const topCritical = criticalNow
    .slice(0, 5)
    .map((item) => `${item.severity} - ${item.title} @ ${item.location} (${Math.round(item.confidence_score * 100)}% conf)`)
    .join('\n');

  const topLeaks = leaks
    .slice(0, 4)
    .map((item) => `${item.severity} - ${item.title} @ ${item.location} (${Math.round(item.confidence_score * 100)}% conf)`)
    .join('\n');

  const strategicRisk = bundle?.riskScores?.strategicRisks?.[0];
  const riskLine = strategicRisk
    ? `Strategic risk score: ${strategicRisk.score}, level: ${strategicRisk.level}.`
    : 'Strategic risk score unavailable.';

  const flightsCount = (bundle?.commercialFlights?.flights?.length || 0) + (bundle?.militaryFlights?.flights?.length || 0);

  return [
    `Verified critical alerts:\n${topCritical || 'None'}`,
    `Unverified leaks:\n${topLeaks || 'None'}`,
    riskLine,
    `Flight tracks observed: ${flightsCount}.`,
    `Analyst fusion score: ${Number(analyst.fusion_score || 0).toFixed(2)}.`,
  ].join('\n\n');
}

async function runLocalAiDeduction(query, geoContext) {
  const cleanQuery = safeString(query);
  if (!cleanQuery) return null;

  const systemPrompt = [
    'You are a senior intelligence analyst for a tactical mission control dashboard.',
    'Write concise operator guidance with likely outcomes in the next 24h-7d.',
    'Use markdown bullets, no filler, no hedging preamble.',
    'Include watch-items and immediate action priorities.',
  ].join(' ');
  const userPrompt = geoContext
    ? `${cleanQuery}\n\nContext:\n${geoContext}`
    : cleanQuery;

  const timeoutMs = 45000;

  const groqKey = safeString(process.env.GROQ_API_KEY);
  if (groqKey && !groqKey.startsWith('your_')) {
    try {
      const response = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AshaMissionControl/1.0',
        },
        body: JSON.stringify({
          model: safeString(process.env.MC_AI_GROQ_MODEL, 'llama-3.1-8b-instant'),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.25,
          max_tokens: 800,
        }),
      }, timeoutMs);
      if (response.ok) {
        const payload = await response.json();
        const analysis = safeString(payload?.choices?.[0]?.message?.content);
        if (analysis) {
          return {
            analysis,
            provider: 'groq-local',
            model: safeString(payload?.model, safeString(process.env.MC_AI_GROQ_MODEL, 'llama-3.1-8b-instant')),
          };
        }
      }
    } catch (error) {
      logger.warn({ err: error?.message }, 'Local Groq deduction failed');
    }
  }

  const openAiKey = safeString(process.env.OPENAI_API_KEY);
  if (openAiKey && !openAiKey.startsWith('your_')) {
    try {
      const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AshaMissionControl/1.0',
        },
        body: JSON.stringify({
          model: safeString(process.env.MC_AI_OPENAI_MODEL, 'gpt-4o-mini'),
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 700,
        }),
      }, timeoutMs);
      if (response.ok) {
        const payload = await response.json();
        const analysis = safeString(payload?.choices?.[0]?.message?.content);
        if (analysis) {
          return {
            analysis,
            provider: 'openai-local',
            model: safeString(payload?.model, safeString(process.env.MC_AI_OPENAI_MODEL, 'gpt-4o-mini')),
          };
        }
      }
    } catch (error) {
      logger.warn({ err: error?.message }, 'Local OpenAI deduction failed');
    }
  }

  return null;
}

async function runWorldMonitorDeduction(geoContext, healthCollector = null) {
  const query = 'Assess near-term escalation, operational risks, and likely trajectories for mission control.';
  const remoteResult = await fetchWorldMonitorSource('intelligenceDeduction', '/api/intelligence/v1/deduct-situation', {
    method: 'POST',
    body: {
      query,
      geoContext,
    },
    timeoutMs: getSourceTimeoutMs('intelligenceDeduction', 5000),
  });
  if (healthCollector && typeof healthCollector.push === 'function') {
    healthCollector.push(remoteResult.health);
  }
  const remote = remoteResult.data;

  const remoteAnalysis = safeString(remote?.analysis);
  if (remoteAnalysis) {
    return {
      analysis: remoteAnalysis,
      provider: safeString(remote?.provider, 'worldmonitor'),
      model: safeString(remote?.model),
    };
  }

  return runLocalAiDeduction(query, geoContext);
}

function splitFindingsFromAnalysis(analysis) {
  const raw = safeString(analysis);
  if (!raw) return [];
  const lines = raw
    .split('\n')
    .map((line) => line.replace(/^[\s\-*0-9.)]+/, '').trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  return lines.slice(0, 5);
}

async function getCachedAiDigest(cacheKey) {
  const now = Date.now();
  const localEntry = aiDigestCache.get(cacheKey);
  if (localEntry && now - Number(localEntry.ts || 0) <= AI_DIGEST_TTL_MS) {
    return localEntry.value || null;
  }

  if (!REDIS_SHARED_CACHE_ACTIVE) return null;
  const sharedEntry = await getSharedAiDigestCache(cacheKey);
  if (!sharedEntry) return null;
  if (now - Number(sharedEntry.ts || 0) > AI_DIGEST_TTL_MS) return null;
  setLocalAiDigestCache(cacheKey, sharedEntry.value || null);
  return sharedEntry.value || null;
}

function setCachedAiDigest(cacheKey, value) {
  setLocalAiDigestCache(cacheKey, value);
  setSharedAiDigestCache(cacheKey, value).catch(() => {});
}

function scheduleAiDigest(cacheKey, geoContext) {
  if (!geoContext) return;
  if (aiDigestInflight.has(cacheKey)) return;

  const promise = runWorldMonitorDeduction(geoContext)
    .then((result) => {
      if (!safeString(result?.analysis)) return;
      const lines = splitFindingsFromAnalysis(result.analysis);
      setCachedAiDigest(cacheKey, {
        digest_text: result.analysis,
        findings: lines,
        provider: safeString(result?.provider),
        model: safeString(result?.model),
      });
    })
    .catch((error) => {
      logger.warn({ err: error?.message }, 'Mission Control async AI digest refresh failed');
    })
    .finally(() => {
      aiDigestInflight.delete(cacheKey);
    });

  aiDigestInflight.set(cacheKey, promise);
}

function buildAlertInbox(criticalAlerts, notificationPreference, actionState = defaultActionState()) {
  const acknowledgedSet = new Set((actionState?.acknowledged_alert_ids || []).map((item) => safeString(item)));
  const followedRegionSet = new Set((actionState?.followed_regions || []).map((item) => safeString(item)));
  const mutedSignatureSet = new Set((actionState?.muted_signatures || []).map((item) => safeString(item)));

  const filtered = criticalAlerts.filter((item) => {
    const signature = `${safeString(item.location)}::${safeString(item.source_name)}`;
    return !mutedSignatureSet.has(signature);
  });

  const unresolved = filtered.filter((item) => !acknowledgedSet.has(safeString(item.id)));
  const critical = unresolved.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH');
  const elevated = unresolved.filter((item) => item.severity === 'ELEVATED' || item.severity === 'INFO');
  const following = unresolved.filter((item) => followedRegionSet.has(safeString(item.location)));
  const resolved = filtered
    .filter((item) => acknowledgedSet.has(safeString(item.id)))
    .map((item) => ({ ...item, state: 'resolved' }));

  const unreadSet = new Set([...critical.map((item) => item.id), ...following.map((item) => item.id)]);

  return {
    generated_at: new Date().toISOString(),
    critical: critical.slice(0, 12),
    assigned: critical.slice(0, 6),
    following: following.slice(0, 10),
    resolved: [...resolved, ...elevated.slice(-6).map((item) => ({ ...item, state: 'resolved' }))].slice(0, 20),
    unread_total: Math.min(99, unreadSet.size),
  };
}

async function getNotificationPreferences(options = {}) {
  const scope = resolveScope(options);
  const preference = await getNotificationPreferenceRecord(scope);
  return withDispatchPolicy(preference);
}

async function updateNotificationPreferences(options = {}, patch = {}) {
  const scope = resolveScope(options);
  const existing = await getNotificationPreferenceRecord(scope);
  const nextPreference = mergeNotificationPreference({ ...DEFAULT_NOTIFICATION_PREFERENCE, ...existing, profile: scope.profile_key }, patch);
  const saved = await saveNotificationPreferenceRecord(scope, nextPreference);
  return withDispatchPolicy(saved);
}

async function updateAlertAudioPreferences(options = {}, patch = {}) {
  const scope = resolveScope(options);
  const existing = await getNotificationPreferenceRecord(scope);
  const audioPatch = {
    audio: {
      mode: normalizeAudioMode(patch?.mode || patch?.audio?.mode || existing?.audio?.mode),
      vibration:
        typeof patch?.vibration === 'boolean'
          ? patch.vibration
          : typeof patch?.audio?.vibration === 'boolean'
            ? patch.audio.vibration
            : Boolean(existing?.audio?.vibration),
      severity_profiles: {
        ...(existing?.audio?.severity_profiles || {}),
        ...((patch?.severity_profiles && typeof patch.severity_profiles === 'object')
          ? patch.severity_profiles
          : {}),
        ...((patch?.audio?.severity_profiles && typeof patch.audio.severity_profiles === 'object')
          ? patch.audio.severity_profiles
          : {}),
      },
    },
  };
  const nextPreference = mergeNotificationPreference(
    { ...DEFAULT_NOTIFICATION_PREFERENCE, ...existing, profile: scope.profile_key },
    audioPatch
  );
  const saved = await saveNotificationPreferenceRecord(scope, nextPreference);
  return withDispatchPolicy(saved);
}

async function getLayersCatalog() {
  return {
    generated_at: new Date().toISOString(),
    items: LAYERS_CATALOG,
  };
}

async function getHazardsCatalog() {
  return {
    generated_at: new Date().toISOString(),
    items: HAZARD_CATALOG,
  };
}

async function getSafetyGuides(options = {}) {
  const requestedType = normalizeIncidentType(options.incident_type || options.incidentType || options.hazard_type);
  const items = requestedType === 'all'
    ? SAFETY_GUIDES
    : SAFETY_GUIDES.filter((item) => item.incident_type === requestedType || item.incident_type === 'general');
  return {
    generated_at: new Date().toISOString(),
    incident_type: requestedType,
    items,
    policy: {
      no_ai_shelter_routing: true,
      no_critical_delay_for_tiers: true,
      guidance_is_informational: true,
    },
  };
}

async function getExplainers() {
  return {
    generated_at: new Date().toISOString(),
    items: EXPLAINERS,
  };
}

async function getWorkspacePresets(options = {}) {
  const scope = resolveScope(options);
  return getWorkspacePresetRecords(scope);
}

async function updateWorkspaceLayout(id, payload = {}, options = {}) {
  const cleanId = safeString(id);
  if (!cleanId) {
    const error = new Error('layout id is required');
    error.statusCode = 400;
    throw error;
  }

  const scope = resolveScope(options);
  const presets = await getWorkspacePresetRecords(scope);
  const current = presets.find((item) => item.id === cleanId) || DEFAULT_LAYOUT_PRESETS.find((item) => item.id === cleanId) || {
    id: cleanId,
    name: cleanId,
    mode: 'simple',
    description: '',
    layout: {},
  };

  const nextPreset = {
    ...current,
    ...payload,
    id: cleanId,
    mode: normalizeMode(payload.mode || current.mode),
    name: safeString(payload.name || current.name || cleanId, cleanId),
    description: safeString(payload.description || current.description),
    layout: {
      ...(current.layout || {}),
      ...((payload && payload.layout) || {}),
    },
    updated_at: new Date().toISOString(),
  };

  return saveWorkspacePresetRecord(scope, cleanId, nextPreset);
}

async function buildLegacyCoreMissionData(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const mode = normalizeMode(options.mode || 'simple');
  const verificationMode = normalizeVerificationMode(options.verification_mode || 'verified-first');
  const days = Math.max(1, Math.min(parseCount(options.days || 14), 90));
  const eventsVerification = verificationMode === 'verified-first' ? 'verified' : 'all';
  const scope = resolveScope(options);

  const [layers, fusion, eventsRaw, presets, notificationPreference, actionState] = await Promise.all([
    conflictAnalyticsService.getMonitorLayers({
      conflict,
      days,
      verification: eventsVerification,
      source_tier: 'all',
      limit: 900,
    }),
    conflictAnalyticsService.getMonitorSignalsFusion({
      conflict,
      days,
      verification: eventsVerification,
      source_tier: 'all',
      limit: 900,
    }),
    conflictAnalyticsService.listEvents({
      conflict,
      verification: 'all',
      source_tier: 'all',
      days,
      limit: 1400,
      include_identities: false,
    }),
    getWorkspacePresets(options),
    getNotificationPreferences(options),
    getActionState(scope),
  ]);

  const idToCoords = new Map(
    (layers?.layers?.event_points || [])
      .filter((point) => point && point.id)
      .map((point) => [
        point.id,
        {
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
        },
      ])
  );

  const sourceCountsByLocation = buildSourceCountsByLocation(eventsRaw);

  const verifiedAndAllAlerts = eventsRaw
    .filter((event) => event && event.id)
    .map((event) => makeAlertCard(event, sourceCountsByLocation, idToCoords));

  const mutedSignatureSet = new Set((actionState?.muted_signatures || []).map((item) => safeString(item)));
  const acknowledgedSet = new Set((actionState?.acknowledged_alert_ids || []).map((item) => safeString(item)));

  const criticalNow = sortAlerts(
    verifiedAndAllAlerts
      .filter((item) => item.verification_status === 'verified')
      .filter((item) => !acknowledgedSet.has(safeString(item.id)))
      .filter((item) => !mutedSignatureSet.has(`${safeString(item.location)}::${safeString(item.source_name)}`))
  ).slice(0, mode === 'simple' ? 8 : 16);

  const leaks = sortAlerts(
    eventsRaw
      .filter((event) => safeString(event.verification_status) !== 'verified')
      .map((event) => buildLeakItem(event, sourceCountsByLocation, idToCoords))
  ).slice(0, mode === 'simple' ? 12 : 24);

  const ticker = buildTickerItems(criticalNow, leaks);
  const alertInbox = buildAlertInbox(criticalNow, notificationPreference, actionState);
  const optionalFeeds = buildOptionalLayerFeed(criticalNow);
  const sourceSuggestions = buildSourceSuggestions({
    language: options.language,
    country: options.country,
    conflict,
    source_health: [
      makeSourceHealth('legacy_conflict_analytics', 'ok', 0, 'Served from local conflict analytics fallback'),
    ],
  });

  const criticalCount = criticalNow.filter((item) => item.severity === 'CRITICAL').length;
  const highCount = criticalNow.filter((item) => item.severity === 'HIGH').length;
  const fusionScore = Number(fusion?.fusion_score || 0);
  const postureLevel = criticalCount >= 3 || fusionScore >= 0.73
    ? 'CRITICAL'
    : highCount >= 4 || fusionScore >= 0.55
      ? 'ELEVATED'
      : 'STABLE';

  const topGap = (fusion?.top_gaps || [])[0];
  const topLocation = (fusion?.top_locations || [])[0];
  const brief = {
    confidence_label: safeString(fusion?.confidence_label, 'unknown'),
    non_deterministic_label: 'Analyst brief is probabilistic and non-deterministic.',
    key_findings: [
      topGap
        ? `Primary intelligence gap: ${safeString(topGap.dimension)} "${safeString(topGap.signal)}" (${safeString(topGap.severity)}).`
        : 'Primary intelligence gap currently below configured significance threshold.',
      topLocation
        ? `Top monitored location signal: ${safeString(topLocation.location)} (${parseCount(topLocation.hits)} hits).`
        : 'Top monitored location signal is currently unavailable.',
      `Freshness status is ${safeString(fusion?.freshness?.status, 'unknown')} with score ${Number(
        fusion?.freshness?.freshness_score || 0
      ).toFixed(2)}.`,
    ],
    recommended_actions: (fusion?.top_gaps || []).slice(0, 5).map((gap) => ({
      priority: safeString(gap.severity, 'info'),
      action: `Increase verified coverage for ${safeString(gap.dimension)} "${safeString(gap.signal)}"`,
      reason: safeString((gap.reasons || [])[0], 'Coverage threshold not met.'),
    })),
  };

  return {
    generated_at: new Date().toISOString(),
    filters: {
      conflict,
      days,
      mode,
      verification_mode: verificationMode,
    },
    posture: {
      level: postureLevel,
      label:
        postureLevel === 'CRITICAL'
          ? 'Critical Watch'
          : postureLevel === 'ELEVATED'
            ? 'Elevated Watch'
            : 'Stable Watch',
      summary:
        postureLevel === 'CRITICAL'
          ? 'Critical alerts are elevated and require immediate operator attention.'
          : postureLevel === 'ELEVATED'
            ? 'Multiple high-priority signals are active across monitored regions.'
            : 'Signal load is steady with no dominant escalation cluster.',
    },
    freshness: {
      score: Number(fusion?.freshness?.freshness_score || 0),
      status: safeString(fusion?.freshness?.status, 'unknown'),
      updated_at: safeString(fusion?.freshness?.latest?.event_at, new Date().toISOString()),
    },
    verification: {
      mode: verificationMode,
      label: verificationMode === 'verified-first' ? 'Verified First' : 'All Sources',
    },
    map: {
      default_center: layers?.map_hints?.default_center || { latitude: 31.5, longitude: 34.7, zoom: 6.5 },
      event_points: layers?.layers?.event_points || [],
      location_intensity: layers?.layers?.location_intensity || [],
      infrastructure_points: buildInfrastructurePoints(),
      waterways: buildWaterwayLines(),
      optional_feeds: optionalFeeds,
      sources: {
        flight_radar: {
          mode: 'external_fallback',
          latency_seconds: 60,
          source: 'Flight connector',
          external_url: 'https://www.flightradar24.com/',
        },
        maritime_risk: {
          mode: 'integrated',
          latency_seconds: 300,
          source: 'Maritime connector',
        },
      },
    },
    critical_now: criticalNow,
    ticker,
    leaks,
    leaks_preview: leaks.slice(0, 8),
    analyst: {
      fusion_score: fusionScore,
      confidence_label: safeString(fusion?.confidence_label, 'unknown'),
      top_gaps: fusion?.top_gaps || [],
      top_locations: fusion?.top_locations || [],
      top_weapons: fusion?.top_weapons || [],
      top_technologies: fusion?.top_technologies || [],
      digest: fusion?.digest || null,
    },
    brief,
    workspace_presets: presets,
    notification_summary: {
      unread_total: alertInbox.unread_total,
      critical_unread: alertInbox.critical.length,
      assigned_unread: alertInbox.assigned.length,
      following_unread: alertInbox.following.length,
    },
    notification_preference: notificationPreference,
    pizzint: null,
    source_suggestions: sourceSuggestions,
    source_health: [
      makeSourceHealth('legacy_conflict_analytics', 'ok', 0, 'Served from local conflict analytics fallback'),
    ],
  };
}

async function buildWorldMonitorCoreMissionData(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const mode = normalizeMode(options.mode || 'simple');
  const verificationMode = normalizeVerificationMode(options.verification_mode || 'verified-first');
  const days = Math.max(1, Math.min(parseCount(options.days || 14), 90));
  const scope = resolveScope(options);

  const [bundle, presets, notificationPreference, actionState] = await Promise.all([
    fetchWorldMonitorBundle({
      conflict,
      days,
      language: options.language,
      country: options.country,
    }),
    getWorkspacePresets(options),
    getNotificationPreferences(options),
    getActionState(scope),
  ]);

  const normalizedEvents = [
    ...normalizeWorldMonitorConflictEvents(bundle.acled),
    ...normalizeWorldMonitorUnrestEvents(bundle.unrest),
    ...normalizeWorldMonitorNewsEvents(bundle.newsDigest),
    ...normalizeWorldMonitorOrefEvents(bundle.orefAlerts),
  ];

  const dedupedEvents = new Map();
  normalizedEvents.forEach((event) => {
    const id = safeString(event.id);
    if (!id) return;
    const existing = dedupedEvents.get(id);
    if (!existing) {
      dedupedEvents.set(id, event);
      return;
    }
    const existingScore = Number(existing.confidence || 0);
    const currentScore = Number(event.confidence || 0);
    const existingTs = new Date(existing.event_date).getTime();
    const currentTs = new Date(event.event_date).getTime();
    if (currentScore > existingScore || currentTs > existingTs) {
      dedupedEvents.set(id, event);
    }
  });

  const eventsRaw = [...dedupedEvents.values()];

  const idToCoords = new Map();
  eventsRaw.forEach((event) => {
    const locationName = safeString((event.hit_locations || [])[0]);
    const fallback = pickCoordinatesFromLocationName(locationName);
    const fallbackFromNarrative = pickCoordinatesFromNarrative(
      locationName,
      safeString(event.title),
      safeString(event.summary),
      safeString(event.source_name)
    );
    const latitude = Number(event.latitude ?? fallback?.latitude ?? fallbackFromNarrative?.latitude);
    const longitude = Number(event.longitude ?? fallback?.longitude ?? fallbackFromNarrative?.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      idToCoords.set(event.id, {
        latitude,
        longitude,
      });
    }
  });

  const sourceCountsByLocation = buildSourceCountsByLocation(eventsRaw);
  const allAlerts = sortAlerts(
    eventsRaw.map((event) => makeAlertCard(event, sourceCountsByLocation, idToCoords))
  );

  let baseAlerts =
    verificationMode === 'verified-first'
      ? allAlerts.filter((item) => safeString(item.verification_status) === 'verified')
      : allAlerts;
  if (!baseAlerts.length) {
    baseAlerts = allAlerts;
  }

  const mutedSignatureSet = new Set((actionState?.muted_signatures || []).map((item) => safeString(item)));
  const acknowledgedSet = new Set((actionState?.acknowledged_alert_ids || []).map((item) => safeString(item)));

  const criticalNow = baseAlerts
    .filter((item) => !acknowledgedSet.has(safeString(item.id)))
    .filter((item) => !mutedSignatureSet.has(`${safeString(item.location)}::${safeString(item.source_name)}`))
    .slice(0, mode === 'simple' ? 8 : 16);

  const eventLeaks = eventsRaw
    .filter((event) => safeString(event.verification_status) !== 'verified')
    .map((event) => buildLeakItem(event, sourceCountsByLocation, idToCoords));
  const telegramLeaks = normalizeWorldMonitorTelegramLeaks(bundle.telegramFeed);
  const leakMap = new Map();
  [...eventLeaks, ...telegramLeaks].forEach((item) => {
    const id = safeString(item.id);
    if (!id) return;
    const existing = leakMap.get(id);
    if (!existing || Number(item.confidence_score || 0) >= Number(existing.confidence_score || 0)) {
      leakMap.set(id, item);
    }
  });

  const leaks = sortAlerts([...leakMap.values()]).slice(0, mode === 'simple' ? 14 : 28);
  const ticker = buildTickerItems(criticalNow, leaks);
  const alertInbox = buildAlertInbox(criticalNow, notificationPreference, actionState);

  const eventPoints = eventsRaw
    .map((event) => {
      const point = idToCoords.get(event.id);
      if (!point) return null;
      return {
        id: safeString(event.id),
        event_date: toIso(event.event_date || Date.now()),
        location: safeString((event.hit_locations || [])[0], 'Unknown location'),
        latitude: Number(point.latitude),
        longitude: Number(point.longitude),
        confidence: clamp(Number(event.confidence || 0), 0, 1),
        source_tier: safeString(event.source_tier, 'open-source'),
        fatalities_total: parseCount(event.fatalities_total),
        injured_total: parseCount(event.injured_total),
        official_announcement_types: [],
      };
    })
    .filter(Boolean);

  const optionalFeeds = buildWorldMonitorOptionalFeeds(bundle, criticalNow);
  const derivedEventPoints = deriveEventPointsFromOptionalFeeds(optionalFeeds);
  const derivedFromCards = deriveEventPointsFromAlertCards([...criticalNow, ...leaks], 'derived-feed');
  const mergedDerivedPoints = [...derivedEventPoints, ...derivedFromCards]
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .slice(0, 180);
  const mapEventPoints = mergeMapEventPoints(
    eventPoints,
    mergedDerivedPoints,
    mode === 'simple' ? 180 : 240
  );
  const mapLocationIntensity = computeLocationIntensity(mapEventPoints);
  const analyst = buildWorldMonitorAnalyst(bundle, criticalNow, mapLocationIntensity, verificationMode);
  const geoContext = buildAiGeoContext(criticalNow, leaks, analyst, bundle);
  const digestCacheKey = buildCoreCacheKey(options);
  const cachedDigest = await getCachedAiDigest(digestCacheKey);
  scheduleAiDigest(digestCacheKey, geoContext);

  const analysisFindings = cachedDigest?.findings || [];
  if (safeString(cachedDigest?.digest_text)) {
    analyst.digest = {
      digest_text: cachedDigest.digest_text,
      items: criticalNow.slice(0, 6).map((item) => ({
        id: item.id,
        title: item.title,
        source_name: item.source_name,
        source_url: '',
        score: item.confidence_score,
      })),
    };
  }

  const infrastructurePoints = buildWorldMonitorInfrastructurePoints(bundle?.outages?.outages || []);
  const pizzint = normalizePizzintStatus(bundle?.pizzintStatus || {});
  const sourceSuggestions = buildSourceSuggestions({
    language: options.language,
    country: options.country,
    conflict,
    source_health: bundle?.source_health || [],
  });
  const mapCenter = criticalNow.find((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    || leaks.find((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    || mapLocationIntensity[0]
    || (mapEventPoints.length ? mapEventPoints[0] : null)
    || { latitude: 31.5, longitude: 34.7 };

  const newestCriticalAt = criticalNow.reduce((latest, item) => {
    const ts = new Date(item.updated_at).getTime();
    return Number.isFinite(ts) ? Math.max(latest, ts) : latest;
  }, 0);
  const generatedCandidates = [
    newestCriticalAt,
    new Date(bundle?.newsDigest?.generatedAt || 0).getTime(),
    new Date(bundle?.commercialFlights?.generatedAt || 0).getTime(),
    new Date(bundle?.militaryFlights?.generatedAt || 0).getTime(),
  ].filter((value) => Number.isFinite(value) && value > 0);
  const freshnessTimestamp = generatedCandidates.length ? Math.max(...generatedCandidates) : Date.now();
  const freshnessAgeMinutes = Math.max(0, Math.round((Date.now() - freshnessTimestamp) / 60000));
  const freshnessScore = clamp(1 - (freshnessAgeMinutes / 240), 0, 1);

  const criticalCount = criticalNow.filter((item) => item.severity === 'CRITICAL').length;
  const highCount = criticalNow.filter((item) => item.severity === 'HIGH').length;
  const fusionScore = Number(analyst.fusion_score || 0);
  const postureLevel = criticalCount >= 3 || fusionScore >= 0.73
    ? 'CRITICAL'
    : highCount >= 4 || fusionScore >= 0.55
      ? 'ELEVATED'
      : 'STABLE';

  const briefFindings = analysisFindings.length
    ? analysisFindings
    : [
        criticalNow[0]
          ? `Top active event: ${criticalNow[0].title} at ${criticalNow[0].location}.`
          : 'No critical event is currently in scope.',
        mapLocationIntensity[0]
          ? `Most active location: ${mapLocationIntensity[0].location} (${mapLocationIntensity[0].hits} signals).`
          : 'No dominant location cluster is currently available.',
        `Freshness is ${freshnessAgeMinutes} minute(s) old with score ${freshnessScore.toFixed(2)}.`,
      ];

  return {
    generated_at: new Date().toISOString(),
    filters: {
      conflict,
      days,
      mode,
      verification_mode: verificationMode,
    },
    posture: {
      level: postureLevel,
      label:
        postureLevel === 'CRITICAL'
          ? 'Critical Watch'
          : postureLevel === 'ELEVATED'
            ? 'Elevated Watch'
            : 'Stable Watch',
      summary:
        postureLevel === 'CRITICAL'
          ? 'Critical alerts are elevated and require immediate operator attention.'
          : postureLevel === 'ELEVATED'
            ? 'Multiple high-priority signals are active across monitored regions.'
            : 'Signal load is steady with no dominant escalation cluster.',
    },
    freshness: {
      score: Number(freshnessScore.toFixed(3)),
      status: freshnessAgeMinutes <= 30 ? 'fresh' : freshnessAgeMinutes <= 120 ? 'warming' : 'stale',
      updated_at: new Date(freshnessTimestamp).toISOString(),
    },
    verification: {
      mode: verificationMode,
      label: verificationMode === 'verified-first' ? 'Verified First' : 'All Sources',
    },
    map: {
      default_center: {
        latitude: Number(mapCenter.latitude || 31.5),
        longitude: Number(mapCenter.longitude || 34.7),
        zoom: mode === 'analyst' ? 5.2 : 4.9,
      },
      event_points: mapEventPoints,
      location_intensity: mapLocationIntensity,
      infrastructure_points: infrastructurePoints,
      waterways: buildWaterwayLines(),
      optional_feeds: optionalFeeds,
      sources: {
        flight_radar: {
          mode: optionalFeeds.flight_radar.length ? 'integrated' : 'external_fallback',
          latency_seconds: 60,
          source: safeString(
            bundle?.commercialFlights?.source || bundle?.militaryFlights?.source,
            'World Monitor aviation feeds'
          ),
          external_url: 'https://www.flightradar24.com/',
        },
        maritime_risk: {
          mode: optionalFeeds.maritime_risk.length ? 'integrated' : 'degraded',
          latency_seconds: 300,
          source: 'World Monitor maritime warnings',
        },
      },
    },
    critical_now: criticalNow,
    ticker,
    leaks,
    leaks_preview: leaks.slice(0, 8),
    analyst,
    brief: {
      confidence_label: safeString(analyst.confidence_label, 'unknown'),
      non_deterministic_label:
        'AI deduction is probabilistic and should be validated against verified operational reporting.',
      key_findings: briefFindings,
      recommended_actions: [
        ...criticalNow.slice(0, 3).map((item) => ({
          priority: item.severity.toLowerCase(),
          action: `Focus map and response workflow on ${item.location}`,
          reason: item.title,
        })),
        ...analyst.top_gaps.slice(0, 2).map((gap) => ({
          priority: safeString(gap.severity, 'medium'),
          action: `Recover degraded feed: ${safeString(gap.signal)}`,
          reason: safeString((gap.reasons || [])[0], 'Feed status degraded'),
        })),
      ],
    },
    workspace_presets: presets,
    notification_summary: {
      unread_total: alertInbox.unread_total,
      critical_unread: alertInbox.critical.length,
      assigned_unread: alertInbox.assigned.length,
      following_unread: alertInbox.following.length,
    },
    notification_preference: notificationPreference,
    pizzint,
    source_suggestions: sourceSuggestions,
    source_health: Array.isArray(bundle?.source_health) ? bundle.source_health : [],
  };
}

async function computeCoreMissionData(options = {}) {
  const scope = resolveScope(options);
  const worldMonitor = await buildWorldMonitorCoreMissionData(options);
  const hasLiveSignals =
    (worldMonitor?.critical_now?.length || 0) > 0
    || (worldMonitor?.leaks?.length || 0) > 0
    || (worldMonitor?.map?.event_points?.length || 0) > 0
    || (worldMonitor?.map?.optional_feeds?.flight_radar?.length || 0) > 0;

  if (hasLiveSignals) {
    persistSourceHealthSnapshots(scope, worldMonitor?.source_health || []).catch(() => {});
    return worldMonitor;
  }

  logger.warn(
    {
      base_url: normalizeWorldMonitorBaseUrl(),
    },
    'WorldMonitor payload sparse; falling back to local conflict analytics'
  );

  const fallback = await buildLegacyCoreMissionData(options);
  persistSourceHealthSnapshots(scope, fallback?.source_health || []).catch(() => {});
  return fallback;
}

async function buildCoreMissionData(options = {}) {
  const key = buildCoreCacheKey(options);
  const ttlMs = Math.max(
    5000,
    Math.min(parseCount(process.env.MC_HOME_CACHE_TTL_MS || CORE_CACHE_TTL_MS), 120000)
  );
  const staleTtlMs = Math.max(ttlMs, Math.min(parseCount(process.env.MC_HOME_STALE_TTL_MS || CORE_STALE_TTL_MS), 300000));
  const now = Date.now();
  let cached = coreSnapshotCache.get(key);
  if (!cached && REDIS_SHARED_CACHE_ACTIVE) {
    const shared = await getSharedCoreCache(key);
    if (shared?.data && Number(shared.ts || 0) > 0) {
      setLocalCoreCache(key, shared.data, shared.ts);
      cached = {
        data: shared.data,
        ts: shared.ts,
      };
    }
  }
  if (cached) {
    const age = now - Number(cached.ts || 0);
    if (age <= ttlMs) {
      return cached.data;
    }
    if (age <= staleTtlMs) {
      if (!coreSnapshotInflight.has(key)) {
        const refreshPromise = computeCoreMissionData(options)
          .then((data) => {
            setLocalCoreCache(key, data);
            setSharedCoreCache(key, data, staleTtlMs).catch(() => {});
            return data;
          })
          .finally(() => {
            coreSnapshotInflight.delete(key);
          });
        coreSnapshotInflight.set(key, refreshPromise);
      }
      return cached.data;
    }
  }

  if (coreSnapshotInflight.has(key)) {
    return coreSnapshotInflight.get(key);
  }

  const promise = computeCoreMissionData(options)
    .then((data) => {
      setLocalCoreCache(key, data);
      setSharedCoreCache(key, data, staleTtlMs).catch(() => {});
      return data;
    })
    .finally(() => {
      coreSnapshotInflight.delete(key);
    });

  coreSnapshotInflight.set(key, promise);
  return promise;
}

function buildPrewarmTargetOptions() {
  const languages = [...new Set(
    String(process.env.MC_HOME_PREWARM_LANGS || 'en')
      .split(',')
      .map((item) => normalizeLanguage(item))
      .filter(Boolean)
  )];
  const modes = [...new Set(
    String(process.env.MC_HOME_PREWARM_MODES || 'simple,analyst')
      .split(',')
      .map((item) => normalizeMode(item))
      .filter(Boolean)
  )];
  const daysList = [...new Set(
    String(process.env.MC_HOME_PREWARM_DAYS || '14')
      .split(',')
      .map((item) => Math.max(1, Math.min(parseCount(item || 14), 90)))
      .filter((item) => Number.isFinite(item) && item > 0)
  )];
  const countries = [...new Set(
    ['', ...String(process.env.MC_HOME_PREWARM_COUNTRIES || 'US')
      .split(',')
      .map((item) => normalizeCountryHint(item))
      .filter(Boolean)]
  )];

  const targets = [];
  for (const mode of modes) {
    for (const days of daysList) {
      for (const language of languages) {
        for (const country of countries) {
          targets.push({
            conflict: 'all',
            mode,
            verification_mode: 'verified-first',
            profile: 'default',
            days,
            lang: language,
            country,
          });
        }
      }
    }
  }
  return targets;
}

async function prewarmHomeSnapshots(optionsList = null, loader = buildCoreMissionData) {
  const enabled = String(process.env.MC_HOME_PREWARM_ENABLED || 'true').toLowerCase() !== 'false';
  if (!enabled) {
    return {
      enabled: false,
      targets: 0,
      warmed: 0,
      failed: 0,
    };
  }

  const targets = Array.isArray(optionsList) && optionsList.length ? optionsList : buildPrewarmTargetOptions();
  const result = {
    enabled: true,
    targets: targets.length,
    warmed: 0,
    failed: 0,
  };

  for (const target of targets) {
    try {
      // Warm sequentially to avoid hammering WM on process start.
      await loader(target);
      result.warmed += 1;
    } catch (error) {
      result.failed += 1;
      logger.warn({ err: error?.message, target }, 'MC home prewarm target failed');
    }
  }

  logger.info(result, 'MC home prewarm completed');
  return result;
}

function invalidateCoreCacheForScope(scope) {
  const scopeSuffix = `|${scope.scope_id}`;
  [...coreSnapshotCache.keys()].forEach((key) => {
    if (String(key).endsWith(scopeSuffix)) {
      coreSnapshotCache.delete(key);
    }
  });
  [...coreSnapshotInflight.keys()].forEach((key) => {
    if (String(key).endsWith(scopeSuffix)) {
      coreSnapshotInflight.delete(key);
    }
  });
  if (REDIS_SHARED_CACHE_ACTIVE) {
    redisCommand(['KEYS', cacheKey('home', `*${scopeSuffix}`)])
      .then(async (keys) => {
        if (!Array.isArray(keys) || !keys.length) return;
        await Promise.all(keys.map((entry) => redisCommand(['DEL', safeString(entry)])));
      })
      .catch(() => {});
  }
}

function resolveResourceQuery(definition, options = {}) {
  const query = { ...(definition.query || {}) };
  const days = Math.max(1, Math.min(parseCount(options.days || 14), 90));
  const end = Date.now();
  const start = end - (days * 24 * 60 * 60 * 1000);
  const language = normalizeLanguage(options.language || options.lang);
  const conflictCountry = conflictToWorldMonitorCountry(options.conflict || 'all');
  const explicitCountry = normalizeCountryHint(options.country);

  if (definition.key === 'newsDigest') {
    query.lang = language;
  }
  if (definition.key === 'acled' || definition.key === 'unrest') {
    query.start = start;
    query.end = end;
    query.country = conflictCountry;
  }
  if (definition.key === 'populationExposure') {
    query.days = days;
    query.conflict = normalizeConflict(options.conflict || 'all');
  }
  if (explicitCountry && ['marketQuotes', 'tradeFlows', 'tradeBarriers', 'tariffTrends'].includes(definition.key)) {
    query.country = explicitCountry;
  }
  return query;
}

async function persistWmResourceHealthSnapshots(scope, resources = []) {
  if (!isPgStateActive() || !Array.isArray(resources) || !resources.length) return;

  const entries = resources
    .map((item) => ({
      scope_id: scope.scope_id,
      family: safeString(item.family),
      resource_key: safeString(item.key),
      status: safeString(item.status, 'unknown'),
      latency_ms: Math.max(0, parseCount(item.latency_ms)),
      error_code: safeString(item.error_code) || null,
      endpoint_path: safeString(item.path) || null,
      wm_endpoint_version: safeString(item.wm_endpoint_version) || null,
      updated_at: toIso(item.updated_at),
    }))
    .filter((item) => item.family && item.resource_key);

  if (!entries.length) return;

  try {
    if (!isUsingSupabase()) {
      const pool = getPool();
      if (pool) {
        await Promise.all(entries.map((item) => pool.query(
          `
            INSERT INTO mc_wm_resource_health
              (scope_id, family, resource_key, status, latency_ms, error_code, endpoint_path, wm_endpoint_version, updated_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (scope_id, resource_key)
            DO UPDATE SET
              family = EXCLUDED.family,
              status = EXCLUDED.status,
              latency_ms = EXCLUDED.latency_ms,
              error_code = EXCLUDED.error_code,
              endpoint_path = EXCLUDED.endpoint_path,
              wm_endpoint_version = EXCLUDED.wm_endpoint_version,
              updated_at = EXCLUDED.updated_at
          `,
          [
            item.scope_id,
            item.family,
            item.resource_key,
            item.status,
            item.latency_ms,
            item.error_code,
            item.endpoint_path,
            item.wm_endpoint_version,
            item.updated_at,
          ]
        )));
        return;
      }
    }

    await Promise.all(entries.map(async (item) => {
      const existing = await dbListItems('mc_wm_resource_health', {
        limit: 1,
        filter: {
          scope_id: item.scope_id,
          resource_key: item.resource_key,
        },
      });
      if (existing[0]?.id) {
        await dbPatchItem('mc_wm_resource_health', existing[0].id, item);
      } else {
        await dbInsertItem('mc_wm_resource_health', {
          ...item,
          created_at: new Date().toISOString(),
        });
      }
    }));
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC WM resource health persistence failed');
  }
}

async function fetchWorldMonitorResourceSnapshot(options = {}) {
  const cacheKey = JSON.stringify({
    conflict: normalizeConflict(options.conflict || 'all'),
    days: Math.max(1, Math.min(parseCount(options.days || 14), 90)),
    language: normalizeLanguage(options.language || options.lang),
    country: normalizeCountryHint(options.country),
  });
  const cached = wmResourceCache.get(cacheKey);
  if (cached && Date.now() - Number(cached.ts || 0) <= WM_RESOURCE_CACHE_TTL_MS) {
    return cached.value;
  }

  const defs = flattenWmResourceRegistry();
  const resources = await Promise.all(defs.map(async (def) => {
    const query = resolveResourceQuery(def, options);
    const result = await fetchWorldMonitorSource(def.key, def.path, {
      query,
      timeoutMs: getSourceTimeoutMs(def.key, SOURCE_TIMEOUT_DEFAULT_MS),
    });
    const health = result?.health || makeSourceHealth(def.key, 'degraded', 0, 'No response');
    return {
      key: def.key,
      family: def.family,
      path: def.path,
      status: safeString(health.status, 'unknown'),
      latency_ms: parseCount(health.latency_ms),
      updated_at: toIso(health.updated_at),
      error_code: mapResourceHealthErrorCode(health.status, health.message),
      message: safeString(health.message),
      wm_endpoint_version: safeString(def.version, 'v1'),
      cache_ttl_ms: parseCount(def.cache_ttl_ms) || WM_RESOURCE_CACHE_TTL_MS,
      data: result?.data || null,
    };
  }));

  const byFamilyMap = new Map();
  resources.forEach((item) => {
    const current = byFamilyMap.get(item.family) || { family: item.family, total: 0, ok: 0, degraded: 0, circuit_open: 0 };
    current.total += 1;
    if (item.status === 'ok') current.ok += 1;
    else if (item.status === 'circuit_open') current.circuit_open += 1;
    else current.degraded += 1;
    byFamilyMap.set(item.family, current);
  });

  const value = {
    generated_at: new Date().toISOString(),
    enabled: WM_FULL_RESOURCE_ADAPTERS_ENABLED,
    direct_social_connectors_enabled: DIRECT_SOCIAL_CONNECTORS_ENABLED,
    resources,
    families: [...byFamilyMap.values()],
  };

  wmResourceCache.set(cacheKey, { ts: Date.now(), value });
  return value;
}

function buildFeedItemFromAlert(alert = {}, kind = 'verified') {
  const country = normalizedCountryFromText(alert.location, alert.title, alert.summary);
  const sourceType = inferFeedSourceType(alert.source_name, alert.verification_status, kind === 'leak' ? 'telegram' : 'news');
  const category = safeString(alert.hazard_type || deriveHazardTypeFromText(`${safeString(alert.title)} ${safeString(alert.summary)}`), 'general');

  return {
    id: safeString(alert.id, stableHash(`${safeString(alert.title)}|${safeString(alert.updated_at)}|${kind}`)),
    alert_id: safeString(alert.id),
    kind,
    title: safeString(alert.title, 'Signal update'),
    summary: safeString(alert.summary, ''),
    source_name: safeString(alert.source_name, 'World Monitor'),
    source_type: sourceType,
    severity: normalizeSeverityInput(alert.severity),
    verification_status: safeString(alert.verification_status, kind === 'leak' ? 'unverified' : 'verified'),
    confidence_score: clamp(Number(alert.confidence_score || 0), 0, 1),
    source_count: Math.max(1, parseCount(alert.source_count)),
    updated_at: toIso(alert.updated_at),
    location: safeString(alert.location, 'Global'),
    country,
    topic: category,
    category,
    tags: [category, sourceType, kind],
    avatar_glyph: sourceType.slice(0, 2).toUpperCase(),
    metadata: {
      risk_warning_level: safeString(alert.risk_warning_level),
      source_tier: safeString(alert.source_tier),
      evidence_pills: Array.isArray(alert.evidence_pills) ? alert.evidence_pills : [],
    },
  };
}

function buildFlightFeedItems(home = {}) {
  const flights = Array.isArray(home?.map?.optional_feeds?.flight_radar) ? home.map.optional_feeds.flight_radar : [];
  return flights.slice(0, 120).map((flight, index) => ({
    id: `flight-feed-${safeString(flight.id, String(index + 1))}`,
    alert_id: safeString(flight.id),
    kind: 'verified',
    title: `${safeString(flight.callsign, `Flight ${index + 1}`)} ${Math.round(Number(flight.speed_kts || 0))}kts`,
    summary: `Heading ${Math.round(Number(flight.heading || 0))}°`,
    source_name: 'World Monitor Aviation',
    source_type: 'official',
    severity: 'INFO',
    verification_status: 'verified',
    confidence_score: 0.6,
    source_count: 1,
    updated_at: toIso(flight.updated_at),
    location: locationLabelFromPoint(Number(flight.latitude), Number(flight.longitude)),
    country: normalizedCountryFromText(locationLabelFromPoint(Number(flight.latitude), Number(flight.longitude))),
    topic: 'aviation',
    category: 'aviation',
    tags: ['aviation', 'flight'],
    avatar_glyph: 'FL',
    metadata: {
      latitude: Number(flight.latitude),
      longitude: Number(flight.longitude),
      heading: Number(flight.heading || 0),
      speed_kts: Number(flight.speed_kts || 0),
    },
  }));
}

function buildOptionalSignalFeedItems(core = {}) {
  const optionalFeeds = core?.map?.optional_feeds || {};
  const weatherItems = Array.isArray(optionalFeeds.weather_alerts)
    ? optionalFeeds.weather_alerts.slice(0, 70).map((item, index) => {
      const severity = deriveWeatherSeverityFromSignal(item);
      const title = normalizeSignalLabel(item.event, 'Weather disruption');
      const location = safeString(item.location || item.city || item.region || item.country)
        || (isGenericSignalLabel(item.event)
        ? locationLabelFromPoint(item.latitude, item.longitude)
        : safeString(item.event, locationLabelFromPoint(item.latitude, item.longitude)));
      const summary = safeString(
        item.text || item.summary || item.details,
        `Weather signal ${title.toLowerCase()} in ${location}`
      );
      const baseConfidence =
        severity === 'CRITICAL'
          ? 0.84
          : severity === 'HIGH'
            ? 0.72
            : severity === 'ELEVATED'
              ? 0.58
              : 0.44;
      return {
        id: `weather-feed-${safeString(item.id, String(index + 1))}`,
        alert_id: safeString(item.id),
        kind: 'verified',
        title,
        summary,
        source_name: safeString(item.source, 'World Monitor Weather'),
        source_type: 'official',
        severity,
        verification_status: 'verified',
        confidence_score: clamp(Number(item.confidence || baseConfidence), 0.25, 0.96),
        source_count: 1,
        updated_at: toIso(item.updated_at || Date.now()),
        location,
        country: normalizedCountryFromText(location, title, summary),
        topic: 'weather',
        category: 'natural-hazard',
        tags: ['weather', 'hazard'],
        avatar_glyph: 'WX',
        metadata: {
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
        },
      };
    })
    : [];

  const cyberItems = Array.isArray(optionalFeeds.cyber_comms)
    ? optionalFeeds.cyber_comms.slice(0, 90).map((item, index) => {
      const confidence = clamp(Number(item.confidence || 0.5), 0.1, 1);
      const severity = deriveCyberSeverityFromSignal(item);
      const title = normalizeSignalLabel(item.impact, 'Cyber/comms disruption');
      const location = safeString(item.location || item.city || item.region || item.country)
        || (isGenericSignalLabel(item.impact)
        ? locationLabelFromPoint(item.latitude, item.longitude)
        : safeString(item.impact, locationLabelFromPoint(item.latitude, item.longitude)));
      const summary = safeString(item.summary || item.notes || 'Communications and cyber disruption indicator');
      return {
        id: `cyber-feed-${safeString(item.id, String(index + 1))}`,
        alert_id: safeString(item.id),
        kind: 'verified',
        title,
        summary,
        source_name: safeString(item.source, 'World Monitor Cyber'),
        source_type: 'osint',
        severity,
        verification_status: 'verified',
        confidence_score: confidence,
        source_count: Math.max(1, parseCount(item.source_count)),
        updated_at: toIso(item.updated_at || Date.now()),
        location,
        country: normalizedCountryFromText(location, title, summary),
        topic: 'cyber',
        category: 'cyber-comms',
        tags: ['cyber', 'comms'],
        avatar_glyph: 'CY',
        metadata: {
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
        },
      };
    })
    : [];

  const maritimeItems = Array.isArray(optionalFeeds.maritime_risk)
    ? optionalFeeds.maritime_risk.slice(0, 60).map((item, index) => {
      const risk = clamp(Number(item.risk || 0.4), 0.1, 1);
      const severity = risk >= 0.82 ? 'HIGH' : risk >= 0.55 ? 'ELEVATED' : 'INFO';
      const location = safeString(item.corridor, locationLabelFromPoint(item.latitude, item.longitude));
      const summary = safeString(item.summary || 'Shipping disruption and route risk indicator');
      return {
        id: `maritime-feed-${safeString(item.id, String(index + 1))}`,
        alert_id: safeString(item.id),
        kind: 'verified',
        title: safeString(item.corridor, 'Maritime risk corridor'),
        summary,
        source_name: 'World Monitor Maritime',
        source_type: 'official',
        severity,
        verification_status: 'verified',
        confidence_score: clamp(risk + 0.1, 0, 1),
        source_count: 1,
        updated_at: toIso(item.updated_at || Date.now()),
        location,
        country: normalizedCountryFromText(location, summary),
        topic: 'maritime',
        category: 'maritime-risk',
        tags: ['maritime', 'shipping'],
        avatar_glyph: 'MR',
        metadata: {
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          risk,
        },
      };
    })
    : [];

  const economicItems = Array.isArray(optionalFeeds.economic_shocks)
    ? optionalFeeds.economic_shocks.slice(0, 60).map((item, index) => {
      const intensity = clamp(Number(item.intensity || item.risk || 0.4), 0.1, 1);
      const severity = intensity >= 0.82 ? 'HIGH' : intensity >= 0.58 ? 'ELEVATED' : 'INFO';
      const location = safeString(item.location || item.label, locationLabelFromPoint(item.latitude, item.longitude));
      const title = safeString(item.label, 'Economic shock marker');
      const summary = safeString(item.summary || 'Macro-economic volatility indicator');
      return {
        id: `economic-feed-${safeString(item.id, String(index + 1))}`,
        alert_id: safeString(item.id),
        kind: 'verified',
        title,
        summary,
        source_name: safeString(item.source, 'World Monitor Markets'),
        source_type: 'news',
        severity,
        verification_status: 'verified',
        confidence_score: clamp(intensity + 0.05, 0, 1),
        source_count: 1,
        updated_at: toIso(item.updated_at || Date.now()),
        location,
        country: normalizedCountryFromText(location, title, summary),
        topic: 'economics',
        category: 'economic-shock',
        tags: ['economic', 'macro'],
        avatar_glyph: 'EC',
        metadata: {
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          intensity,
        },
      };
    })
    : [];

  return [...weatherItems, ...cyberItems, ...maritimeItems, ...economicItems];
}

function buildPredictionFeedItems(payload = {}) {
  const markets = Array.isArray(payload?.markets) ? payload.markets : [];
  return markets.slice(0, 160).map((market, index) => ({
    id: `whale-${safeString(market.id, stableHash(`${safeString(market.title)}|${index}`))}`,
    alert_id: safeString(market.id),
    kind: 'verified',
    title: safeString(market.title, 'Prediction market signal'),
    summary: safeString(market.description || market.subtitle || market.market || market.question),
    source_name: safeString(market.source || market.platform || 'Prediction market'),
    source_type: 'osint',
    severity: safeString(market.severity).toUpperCase() === 'CRITICAL' ? 'CRITICAL' : 'INFO',
    verification_status: 'verified',
    confidence_score: clamp(Number(market.confidence || market.score || market.probability || 0.5), 0, 1),
    source_count: 1,
    updated_at: toIso(market.updatedAt || market.updated_at || market.created_at || Date.now()),
    location: safeString(market.country || market.region || 'Global'),
    country: normalizedCountryFromText(market.country, market.region, market.title),
    topic: 'prediction-markets',
    category: 'prediction',
    tags: ['prediction', safeString(market.platform).toLowerCase()].filter(Boolean),
    avatar_glyph: 'PM',
    metadata: {
      probability: Number(market.probability || 0),
      market_url: safeString(market.url),
    },
  }));
}

function normalizeFeedDedupText(value) {
  return safeString(value)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

function feedDedupKey(item = {}) {
  const normalizedTitle = normalizeFeedDedupText(item.title);
  const genericTitle = isGenericSignalLabel(normalizedTitle);
  return [
    safeString(item.kind, 'verified').toLowerCase(),
    safeString(item.source_type).toLowerCase(),
    safeString(item.source_name).toLowerCase(),
    normalizedTitle,
    genericTitle ? '' : safeString(item.location).toLowerCase(),
    genericTitle ? '' : safeString(item.country).toUpperCase(),
    safeString(item.category).toLowerCase(),
  ].join('|');
}

function isPreferredFeedItem(candidate = {}, current = {}) {
  const severityDelta =
    (SEVERITY_ORDER[normalizeSeverityInput(candidate.severity)] || 0)
    - (SEVERITY_ORDER[normalizeSeverityInput(current.severity)] || 0);
  if (severityDelta !== 0) return severityDelta > 0;

  const verificationDelta =
    Number(safeString(candidate.verification_status).toLowerCase() === 'verified')
    - Number(safeString(current.verification_status).toLowerCase() === 'verified');
  if (verificationDelta !== 0) return verificationDelta > 0;

  const confidenceDelta = Number(candidate.confidence_score || 0) - Number(current.confidence_score || 0);
  if (confidenceDelta !== 0) return confidenceDelta > 0;

  return (parseTimestampMs(candidate.updated_at) || 0) > (parseTimestampMs(current.updated_at) || 0);
}

function dedupeFeedItems(items = []) {
  const byKey = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = feedDedupKey(item);
    if (!key) return;
    const existing = byKey.get(key);
    if (!existing || isPreferredFeedItem(item, existing)) {
      byKey.set(key, item);
    }
  });
  return sortFeedItems([...byKey.values()]);
}

function buildUnifiedFeedItems(core = {}, extras = {}) {
  const critical = Array.isArray(core?.critical_now) ? core.critical_now : [];
  const leaks = Array.isArray(core?.leaks) ? core.leaks : [];
  const alertItems = critical.map((item) => buildFeedItemFromAlert(item, 'verified'));
  const leakItems = leaks.map((item) => buildFeedItemFromAlert(item, 'leak'));
  const optionalSignalItems = buildOptionalSignalFeedItems(core);
  const aiItems = Array.isArray(core?.analyst?.digest?.items)
    ? core.analyst.digest.items.slice(0, 20).map((item, index) => ({
      id: `ai-digest-${safeString(item.id, String(index + 1))}`,
      alert_id: safeString(item.id),
      kind: 'verified',
      title: safeString(item.title, 'AI digest signal'),
      summary: safeString(core?.analyst?.digest?.digest_text),
      source_name: safeString(item.source_name, 'Mission Control AI'),
      source_type: 'wm-ai',
      severity: 'ELEVATED',
      verification_status: 'verified',
      confidence_score: clamp(Number(item.score || 0.5), 0, 1),
      source_count: 1,
      updated_at: toIso(core?.generated_at),
      location: 'Global',
      country: '',
      topic: 'ai-intel',
      category: 'analysis',
      tags: ['ai', 'digest'],
      avatar_glyph: 'AI',
      metadata: {
        source_url: safeString(item.source_url),
      },
    }))
    : [];

  const flightItems = buildFlightFeedItems(core);
  const whaleItems = buildPredictionFeedItems(extras?.prediction_markets || {});
  const whaleFallbackItems = optionalSignalItems.filter((item) => safeString(item.category) === 'economic-shock');

  return {
    feed: dedupeFeedItems([...alertItems, ...leakItems, ...aiItems, ...optionalSignalItems]),
    flights: dedupeFeedItems(flightItems),
    whale: dedupeFeedItems([...whaleItems, ...whaleFallbackItems]),
  };
}

function buildFeedFilterCatalog(items = []) {
  const unique = (mapper) => [...new Set(items.map(mapper).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  return {
    severities: ['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'INFO'],
    source_types: unique((item) => safeString(item.source_type).toLowerCase()),
    topics: unique((item) => safeString(item.topic).toLowerCase()),
    categories: unique((item) => safeString(item.category).toLowerCase()),
    countries: unique((item) => safeString(item.country).toUpperCase()),
    verification_statuses: unique((item) => safeString(item.verification_status).toLowerCase()),
    time_ranges: ['all', '1h', '6h', '24h', '48h', '7d', '14d'],
  };
}

function buildMapLayerPacks() {
  return [
    {
      id: 'mission-core',
      name: 'Mission Core',
      layer_ids: ['conflict-zones', 'verified-hotspots', 'critical-infrastructure', 'strategic-waterways', 'weather-alerts'],
    },
    {
      id: 'flights',
      name: 'Flights',
      layer_ids: ['flight-radar'],
    },
    {
      id: 'maritime',
      name: 'Maritime',
      layer_ids: ['maritime-risk', 'strategic-waterways'],
    },
    {
      id: 'cyber-comms',
      name: 'Cyber/Comms',
      layer_ids: ['cyber-comms'],
    },
    {
      id: 'natural-hazards',
      name: 'Natural Hazards',
      layer_ids: ['weather-alerts', 'conflict-zones'],
    },
    {
      id: 'economic-shock',
      name: 'Economic Shock',
      layer_ids: ['economic-shocks'],
    },
  ];
}

async function getWorldMonitorResources(options = {}) {
  const scope = resolveScope(options);
  const snapshot = await fetchWorldMonitorResourceSnapshot(options);
  persistWmResourceHealthSnapshots(scope, snapshot.resources || []).catch(() => {});
  return {
    generated_at: snapshot.generated_at,
    scope_id: scope.scope_id,
    enabled: WM_FULL_RESOURCE_ADAPTERS_ENABLED,
    resources: (snapshot.resources || []).map((item) => ({
      key: item.key,
      family: item.family,
      path: item.path,
      status: item.status,
      latency_ms: item.latency_ms,
      error_code: item.error_code,
      updated_at: item.updated_at,
      wm_endpoint_version: item.wm_endpoint_version,
      cache_ttl_ms: item.cache_ttl_ms,
    })),
    families: snapshot.families || [],
    feature_flags: {
      glint_compat_theme: GLINT_COMPAT_THEME_ENABLED,
      feed_v2: FEED_V2_ENABLED,
      wm_full_resource_adapters: WM_FULL_RESOURCE_ADAPTERS_ENABLED,
      direct_social_connectors: DIRECT_SOCIAL_CONNECTORS_ENABLED,
      uniqueness_pass: UNIQUENESS_PASS_ENABLED,
    },
  };
}

async function getFeedItems(options = {}) {
  const scope = resolveScope(options);
  const core = await buildCoreMissionData(options);
  const tab = normalizeFeedTab(options.feed_tab);
  let predictionPayload = null;
  const extraSourceHealth = [];
  if (tab === 'whale') {
    const predictionSource = await fetchWorldMonitorSource('predictionMarkets', '/api/prediction/v1/list-prediction-markets', {
      query: { limit: 120 },
      timeoutMs: getSourceTimeoutMs('predictionMarkets', 2600),
    });
    predictionPayload = predictionSource?.data || { markets: [] };
    if (predictionSource?.health) {
      extraSourceHealth.push(predictionSource.health);
    }
  }

  const allFeeds = buildUnifiedFeedItems(core, {
    prediction_markets: predictionPayload,
  });
  const selectedItems = allFeeds[tab] || allFeeds.feed || [];
  const filtered = filterFeedItems(selectedItems, options);
  const sorted = sortFeedItems(filtered);
  const limit = parseFeedLimit(options.limit, tab === 'flights' ? 60 : 40);
  const cursor = parseCursorValue(options.cursor);
  const pageItems = sorted.slice(cursor, cursor + limit);
  const nextCursor = cursor + pageItems.length;
  const hasMore = nextCursor < sorted.length;

  if (isPgStateActive()) {
    dbListItems('mc_feed_cursor_state', {
      limit: 1,
      filter: { scope_id: scope.scope_id, view: tab },
    })
      .then(async (rows) => {
        const payload = {
          scope_id: scope.scope_id,
          user_id: scope.user_id || null,
          view: tab,
          cursor: String(nextCursor),
          updated_at: new Date().toISOString(),
        };
        if (rows[0]?.id) {
          await dbPatchItem('mc_feed_cursor_state', rows[0].id, payload);
        } else {
          await dbInsertItem('mc_feed_cursor_state', {
            ...payload,
            created_at: new Date().toISOString(),
          });
        }
      })
      .catch(() => {});
  }

  const filterCatalog = buildFeedFilterCatalog(selectedItems);
  const sourceHealth = [...(core.source_health || []), ...extraSourceHealth];

  return {
    generated_at: new Date().toISOString(),
    scope_id: scope.scope_id,
    tab,
    items: pageItems,
    page: {
      cursor,
      next_cursor: hasMore ? nextCursor : null,
      has_more: hasMore,
      total_filtered: sorted.length,
    },
    filters_applied: {
      severity: safeString(options.severity, 'ALL').toUpperCase(),
      source_type: parseCsvValues(options.source_type),
      topic: parseCsvValues(options.topic).map((value) => safeString(value).toLowerCase()),
      category: parseCsvValues(options.category).map((value) => safeString(value).toLowerCase()),
      country_filter: parseCsvValues(options.country_filter).map((value) => safeString(value).toUpperCase()),
      verification_status: safeString(options.verification_status, 'all').toLowerCase(),
      time_range: safeString(options.time_range, 'all').toLowerCase(),
      search: safeString(options.search),
    },
    filters_catalog: filterCatalog,
    source_health: sourceHealth,
  };
}

async function getFeedHome(options = {}) {
  const core = await buildCoreMissionData(options);
  const allFeeds = buildUnifiedFeedItems(core, {});
  const feedItems = sortFeedItems(allFeeds.feed).slice(0, 40);
  const filterCatalog = buildFeedFilterCatalog(allFeeds.feed);
  return {
    generated_at: new Date().toISOString(),
    view_mode: FEED_V2_ENABLED ? 'feed-v2' : 'feed-v1',
    tab_counts: {
      feed: allFeeds.feed.length,
      whale: allFeeds.whale.length,
      flights: allFeeds.flights.length,
    },
    items: feedItems,
    filters_catalog: filterCatalog,
    source_health: core.source_health || [],
    feature_flags: {
      glint_compat_theme: GLINT_COMPAT_THEME_ENABLED,
      feed_v2: FEED_V2_ENABLED,
      wm_full_resource_adapters: WM_FULL_RESOURCE_ADAPTERS_ENABLED,
    },
  };
}

async function getFeedFiltersCatalog(options = {}) {
  const home = await getFeedHome(options);
  return {
    generated_at: home.generated_at,
    ...home.filters_catalog,
  };
}

async function getFeedTopics(options = {}) {
  const catalog = await getFeedFiltersCatalog(options);
  return {
    generated_at: new Date().toISOString(),
    items: catalog.topics || [],
  };
}

async function getFeedCategories(options = {}) {
  const catalog = await getFeedFiltersCatalog(options);
  return {
    generated_at: new Date().toISOString(),
    items: catalog.categories || [],
  };
}

async function getFeedCountries(options = {}) {
  const catalog = await getFeedFiltersCatalog(options);
  return {
    generated_at: new Date().toISOString(),
    items: catalog.countries || [],
  };
}

async function getMapLayers(options = {}) {
  const mode = normalizeMode(options.mode || 'simple');
  const defaults = getDefaultLayersByMode(mode);
  return {
    generated_at: new Date().toISOString(),
    mode,
    items: LAYERS_CATALOG,
    packs: buildMapLayerPacks(),
    defaults,
  };
}

async function getMapSession(options = {}) {
  const core = await buildCoreMissionData(options);
  const mapLayers = await getMapLayers(options);
  return {
    generated_at: new Date().toISOString(),
    default_center: core?.map?.default_center || { latitude: 31.5, longitude: 34.7, zoom: 4.9 },
    mode: normalizeMode(options.mode || core?.filters?.mode || 'simple'),
    default_layer_ids: mapLayers.defaults || [],
    packs: mapLayers.packs || [],
    source_latencies: (core?.source_health || []).map((item) => ({
      source: safeString(item.source),
      status: safeString(item.status),
      latency_ms: parseCount(item.latency_ms),
      updated_at: toIso(item.updated_at),
    })),
    map_sources: core?.map?.sources || {},
  };
}

async function getHomeSnapshot(options = {}) {
  return buildCoreMissionData(options);
}

async function getTicker(options = {}) {
  const core = await buildCoreMissionData(options);
  return {
    generated_at: core.generated_at,
    items: core.ticker,
  };
}

async function getAlertsInbox(options = {}) {
  const scope = resolveScope(options);
  const core = await buildCoreMissionData(options);
  const [notificationPreference, actionState] = await Promise.all([
    getNotificationPreferences(options),
    getActionState(scope),
  ]);
  const inbox = buildAlertInbox(core.critical_now, notificationPreference, actionState);
  const now = Date.now();
  const qualificationToInbox = inbox.critical
    .map((item) => {
      const updatedAtMs = parseTimestampMs(item.updated_at);
      if (!updatedAtMs) return null;
      return Math.max(0, now - updatedAtMs);
    })
    .filter((item) => Number.isFinite(item));

  if (qualificationToInbox.length) {
    recordDispatchMetric(scope, 'qualification_to_inbox_ms', {
      value_ms: avg(qualificationToInbox),
      metadata: {
        sample_size: qualificationToInbox.length,
        p95_ms: p95(qualificationToInbox),
      },
    });
  }

  enqueueCriticalDispatch(scope, inbox.critical, notificationPreference).catch((error) => {
    logger.warn({ err: error?.message }, 'MC dispatch enqueue failed');
  });

  return {
    generated_at: core.generated_at,
    ...inbox,
  };
}

async function getLeaks(options = {}) {
  const core = await buildCoreMissionData(options);
  return {
    generated_at: core.generated_at,
    items: core.leaks,
  };
}

async function getAlertActions(options = {}) {
  const scope = resolveScope(options);
  const actionState = await getActionState(scope);
  return {
    generated_at: new Date().toISOString(),
    ...actionState,
  };
}

async function getNotificationTelemetry(options = {}) {
  const scope = resolveScope(options);
  const generatedAt = new Date().toISOString();
  if (!isPgStateActive()) {
    return {
      generated_at: generatedAt,
      scope_id: scope.scope_id,
      window_hours: METRICS_WINDOW_HOURS,
      qualification_to_inbox_ms: { avg_ms: 0, p95_ms: 0, samples: 0 },
      qualification_to_email_ms: { avg_ms: 0, p95_ms: 0, samples: 0 },
      dispatch_success_rate: { rate: 1, sent: 0, failed: 0, queued: 0, total_completed: 0 },
      action_persistence_errors: 0,
      source: 'disabled',
    };
  }

  const cutoffMs = Date.now() - (METRICS_WINDOW_HOURS * 60 * 60 * 1000);

  const inWindow = (timestamp) => {
    const ts = parseTimestampMs(timestamp);
    return ts !== null && ts >= cutoffMs;
  };

  try {
    const [inboxRows, emailRows, actionErrorRows, queueRows] = await Promise.all([
      dbListItems('mc_dispatch_metrics', {
        limit: 500,
        filter: {
          scope_id: scope.scope_id,
          metric_type: 'qualification_to_inbox_ms',
        },
        sort: '-created_at',
      }),
      dbListItems('mc_dispatch_metrics', {
        limit: 500,
        filter: {
          scope_id: scope.scope_id,
          metric_type: 'qualification_to_email_ms',
        },
        sort: '-created_at',
      }),
      dbListItems('mc_dispatch_metrics', {
        limit: 500,
        filter: {
          scope_id: scope.scope_id,
          metric_type: 'action_persistence_error',
        },
        sort: '-created_at',
      }),
      dbListItems('mc_dispatch_queue', {
        limit: 500,
        filter: {
          scope_id: scope.scope_id,
        },
        sort: '-created_at',
      }),
    ]);

    const inboxSamples = inboxRows
      .filter((row) => inWindow(row.created_at))
      .map((row) => parseCount(row.value_ms))
      .filter((value) => value > 0);
    const emailSamples = emailRows
      .filter((row) => inWindow(row.created_at))
      .map((row) => parseCount(row.value_ms))
      .filter((value) => value > 0);
    const recentQueueRows = queueRows.filter((row) => inWindow(row.created_at));
    const sent = recentQueueRows.filter((row) => safeString(row.status) === 'sent').length;
    const failed = recentQueueRows.filter((row) => safeString(row.status) === 'dead_letter').length;
    const queued = recentQueueRows.filter((row) => safeString(row.status) === 'queued').length;
    const totalCompleted = sent + failed;
    const rate = totalCompleted > 0 ? Number((sent / totalCompleted).toFixed(4)) : 1;
    const actionErrors = actionErrorRows.filter((row) => inWindow(row.created_at)).length;

    return {
      generated_at: generatedAt,
      scope_id: scope.scope_id,
      window_hours: METRICS_WINDOW_HOURS,
      qualification_to_inbox_ms: {
        avg_ms: avg(inboxSamples),
        p95_ms: p95(inboxSamples),
        samples: inboxSamples.length,
      },
      qualification_to_email_ms: {
        avg_ms: avg(emailSamples),
        p95_ms: p95(emailSamples),
        samples: emailSamples.length,
      },
      dispatch_success_rate: {
        rate,
        sent,
        failed,
        queued,
        total_completed: totalCompleted,
      },
      action_persistence_errors: actionErrors,
      source: isPgShadowWriteActive() ? 'shadow-write' : 'primary-db',
    };
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC telemetry query failed');
    return {
      generated_at: generatedAt,
      scope_id: scope.scope_id,
      window_hours: METRICS_WINDOW_HOURS,
      qualification_to_inbox_ms: { avg_ms: 0, p95_ms: 0, samples: 0 },
      qualification_to_email_ms: { avg_ms: 0, p95_ms: 0, samples: 0 },
      dispatch_success_rate: { rate: 1, sent: 0, failed: 0, queued: 0, total_completed: 0 },
      action_persistence_errors: 0,
      source: 'error-fallback',
    };
  }
}

async function getOpsHealth(options = {}) {
  const scope = resolveScope(options);
  const generatedAt = new Date().toISOString();
  const worker = getDispatchWorkerState();

  const base = {
    generated_at: generatedAt,
    scope_id: scope.scope_id,
    dispatch_worker: worker,
    dispatch_queue: {
      queued: 0,
      processing: 0,
      dead_letter: 0,
      sent: 0,
      lag_ms: 0,
    },
    cache: {
      mode: REDIS_SHARED_CACHE_ACTIVE ? 'redis' : 'memory',
      redis_enabled: REDIS_SHARED_CACHE_ACTIVE,
      home_ttl_ms: Math.max(
        5000,
        Math.min(parseCount(process.env.MC_HOME_CACHE_TTL_MS || CORE_CACHE_TTL_MS), 120000)
      ),
      home_stale_ttl_ms: Math.max(
        Math.max(5000, Math.min(parseCount(process.env.MC_HOME_CACHE_TTL_MS || CORE_CACHE_TTL_MS), 120000)),
        Math.min(parseCount(process.env.MC_HOME_STALE_TTL_MS || CORE_STALE_TTL_MS), 300000)
      ),
    },
    source_circuit: [...sourceCircuitState.entries()].map(([source, state]) => ({
      source,
      status: Number(state?.open_until || 0) > Date.now() ? 'open' : 'closed',
      failures: parseCount(state?.failures),
      open_until: Number(state?.open_until || 0) > 0 ? new Date(Number(state.open_until)).toISOString() : null,
    })),
    source_health_recent: [],
    wm_resource_coverage: {
      total: 0,
      ok: 0,
      degraded: 0,
      circuit_open: 0,
    },
    recent_failures: [],
  };

  if (!isPgStateActive()) {
    return {
      ...base,
      source: 'disabled',
    };
  }

  try {
    const [queueRows, failures, sourceHealth, wmResourceRows] = await Promise.all([
      dbListItems('mc_dispatch_queue', {
        limit: 500,
        filter: {
          scope_id: scope.scope_id,
        },
        sort: '-created_at',
      }),
      dbListItems('mc_dispatch_log', {
        limit: 40,
        sort: '-created_at',
      }),
      dbListItems('mc_source_health_snapshots', {
        limit: 40,
        filter: {
          scope_id: scope.scope_id,
        },
        sort: '-updated_at',
      }),
      dbListItems('mc_wm_resource_health', {
        limit: 300,
        filter: {
          scope_id: scope.scope_id,
        },
        sort: '-updated_at',
      }),
    ]);

    const queuedRows = queueRows.filter((row) => safeString(row.status) === 'queued');
    const oldestQueuedAt = queuedRows.reduce((oldest, row) => {
      const ts = parseTimestampMs(row.created_at);
      if (!ts) return oldest;
      if (!oldest) return ts;
      return Math.min(oldest, ts);
    }, 0);
    const lagMs = oldestQueuedAt ? Math.max(0, Date.now() - oldestQueuedAt) : 0;

    const wmCoverage = wmResourceRows.reduce(
      (acc, row) => {
        const status = safeString(row.status);
        acc.total += 1;
        if (status === 'ok') acc.ok += 1;
        else if (status === 'circuit_open') acc.circuit_open += 1;
        else acc.degraded += 1;
        return acc;
      },
      { total: 0, ok: 0, degraded: 0, circuit_open: 0 }
    );

    if (wmCoverage.total === 0) {
      const now = Date.now();
      const cachedAge = now - Number(opsHealthWmCoverageCache.ts || 0);
      if (opsHealthWmCoverageCache.coverage) {
        wmCoverage.total = parseCount(opsHealthWmCoverageCache.coverage.total);
        wmCoverage.ok = parseCount(opsHealthWmCoverageCache.coverage.ok);
        wmCoverage.degraded = parseCount(opsHealthWmCoverageCache.coverage.degraded);
        wmCoverage.circuit_open = parseCount(opsHealthWmCoverageCache.coverage.circuit_open);
      }
      if (!opsHealthWmCoverageCache.coverage || cachedAge >= 60000) {
        if (!opsHealthWmCoverageCache.inflight) {
          opsHealthWmCoverageCache.inflight = fetchWorldMonitorResourceSnapshot(options)
            .then((wmSnapshot) => {
              const freshCoverage = { total: 0, ok: 0, degraded: 0, circuit_open: 0 };
              (wmSnapshot.resources || []).forEach((item) => {
                freshCoverage.total += 1;
                if (item.status === 'ok') freshCoverage.ok += 1;
                else if (item.status === 'circuit_open') freshCoverage.circuit_open += 1;
                else freshCoverage.degraded += 1;
              });
              opsHealthWmCoverageCache.ts = Date.now();
              opsHealthWmCoverageCache.coverage = freshCoverage;
            })
            .catch(() => {})
            .finally(() => {
              opsHealthWmCoverageCache.inflight = null;
            });
        }
      }
    }

    return {
      ...base,
      dispatch_queue: {
        queued: queuedRows.length,
        processing: queueRows.filter((row) => safeString(row.status) === 'processing').length,
        dead_letter: queueRows.filter((row) => safeString(row.status) === 'dead_letter').length,
        sent: queueRows.filter((row) => safeString(row.status) === 'sent').length,
        lag_ms: lagMs,
      },
      source_health_recent: sourceHealth.map((item) => ({
        source: safeString(item.source),
        status: safeString(item.status),
        latency_ms: parseCount(item.latency_ms),
        message: safeString(item.message),
        updated_at: toIso(item.updated_at),
      })),
      wm_resource_coverage: wmCoverage,
      recent_failures: failures
        .filter((item) => safeString(item.result) === 'failed')
        .slice(0, 20)
        .map((item) => ({
          queue_id: safeString(item.queue_id),
          provider: safeString(item.provider),
          error: safeString(item.error),
          created_at: toIso(item.created_at),
        })),
      source: isPgShadowWriteActive() ? 'shadow-write' : 'primary-db',
    };
  } catch (error) {
    logger.warn({ err: error?.message, scope: scope.scope_id }, 'MC ops health query failed');
    return {
      ...base,
      source: 'error-fallback',
    };
  }
}

async function applyAlertAction(action, options = {}, payload = {}) {
  const scope = resolveScope(options);
  const actionName = safeString(action).toLowerCase();
  if (!['acknowledge', 'mute_similar', 'follow_region'].includes(actionName)) {
    const error = new Error('Unsupported alert action');
    error.statusCode = 400;
    throw error;
  }

  const result = await persistAlertAction(scope, actionName, payload);
  invalidateCoreCacheForScope(scope);
  return {
    generated_at: new Date().toISOString(),
    action: actionName,
    state: result,
  };
}

module.exports = {
  getHomeSnapshot,
  getTicker,
  getFeedHome,
  getFeedItems,
  getFeedFiltersCatalog,
  getFeedTopics,
  getFeedCategories,
  getFeedCountries,
  getAlertsInbox,
  getLeaks,
  getAlertActions,
  getNotificationTelemetry,
  getOpsHealth,
  getMapLayers,
  getMapSession,
  getWorldMonitorResources,
  applyAlertAction,
  getLayersCatalog,
  getHazardsCatalog,
  getSafetyGuides,
  getExplainers,
  getWorkspacePresets,
  updateWorkspaceLayout,
  getNotificationPreferences,
  updateNotificationPreferences,
  updateAlertAudioPreferences,
  prewarmHomeSnapshots,
  startDispatchWorker,
  stopDispatchWorker,
  runDispatchWorkerTick,
  getDispatchWorkerState,
};
