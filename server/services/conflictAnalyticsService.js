const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const queryBridge = require('../db/queryBridge');
const contentRepository = require('./contentRepository');
const aiProviderService = require('./aiProviderService');
const logger = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'conflict-events.json');
const DEFAULT_STORE = { events: [] };

const TABLES = {
  events: 'conflict_events',
  candidates: 'conflict_source_candidates',
  theories: 'conflict_theories',
  forecasts: 'conflict_forecasts',
  runs: 'agent_runs',
  incidents: 'agent_incidents',
  actions: 'agent_actions',
};

const FLAGS = {
  dashboard: 'conflict_ops_dashboard_v1',
  autonomy: 'conflict_ops_autonomy_v1',
  theoryPublic: 'conflict_ops_theory_public_v1',
  forecastPublic: 'conflict_ops_forecast_public_v1',
};

const PUBLIC_ARTIFACT_FLAGS = Object.freeze({
  theory: FLAGS.theoryPublic,
  forecast: FLAGS.forecastPublic,
});

const SOURCE_TIERS = ['official', 'wire', 'major', 'other'];
const SOURCE_TIER_WEIGHTS = {
  official: 1,
  wire: 0.86,
  major: 0.72,
  other: 0.55,
};

const CONFLICT_KEYWORDS = {
  'gaza-israel': [
    'gaza', 'israel', 'palestine', 'palestinian', 'hamas', 'idf', 'rafah', 'khan younis'
  ],
  'israel-us-iran': [
    'iran', 'tehran', 'israel', 'united states', 'u.s.', 'us military', 'israeli strike', 'irgc'
  ],
};

const ACTOR_PATTERNS = [
  { label: 'Israel', regex: /\b(israel|israeli|idf)\b/i },
  { label: 'Gaza Authorities', regex: /\b(gaza health ministry|gaza authorities)\b/i },
  { label: 'Hamas', regex: /\b(hamas)\b/i },
  { label: 'Palestinian Authority', regex: /\b(palestinian authority)\b/i },
  { label: 'Iran', regex: /\b(iran|iranian|irgc)\b/i },
  { label: 'United States', regex: /\b(united states|u\.s\.|us military|pentagon)\b/i },
  { label: 'Hezbollah', regex: /\b(hezbollah)\b/i },
  { label: 'UN', regex: /\b(united nations|unrwa|u\.n\.)\b/i },
];

const LOCATION_PATTERNS = [
  { label: 'Gaza', regex: /\b(gaza|gaza strip)\b/i },
  { label: 'Rafah', regex: /\b(rafah)\b/i },
  { label: 'Khan Younis', regex: /\b(khan[\s-]?younis|khan[\s-]?yunis)\b/i },
  { label: 'Jabalia', regex: /\b(jabalia)\b/i },
  { label: 'Deir al-Balah', regex: /\b(deir[\s-]?al[\s-]?balah)\b/i },
  { label: 'Tel Aviv', regex: /\b(tel[\s-]?aviv)\b/i },
  { label: 'Jerusalem', regex: /\b(jerusalem)\b/i },
  { label: 'Haifa', regex: /\b(haifa)\b/i },
  { label: 'West Bank', regex: /\b(west bank)\b/i },
  { label: 'Jenin', regex: /\b(jenin)\b/i },
  { label: 'Nablus', regex: /\b(nablus)\b/i },
  { label: 'Tehran', regex: /\b(tehran)\b/i },
  { label: 'Isfahan', regex: /\b(isfahan)\b/i },
  { label: 'Natanz', regex: /\b(natanz)\b/i },
  { label: 'Fordow', regex: /\b(fordow)\b/i },
  { label: 'Damascus', regex: /\b(damascus)\b/i },
  { label: 'Beirut', regex: /\b(beirut)\b/i },
  { label: 'Lebanon', regex: /\b(lebanon|lebanese)\b/i },
  { label: 'Syria', regex: /\b(syria|syrian)\b/i },
  { label: 'Iraq', regex: /\b(iraq|iraqi)\b/i },
  { label: 'Yemen', regex: /\b(yemen|yemeni)\b/i },
];

const LOCATION_COORDINATES = Object.freeze({
  Gaza: { lat: 31.5017, lng: 34.4668 },
  Rafah: { lat: 31.2969, lng: 34.2439 },
  'Khan Younis': { lat: 31.3465, lng: 34.3036 },
  Jabalia: { lat: 31.5333, lng: 34.4833 },
  'Deir al-Balah': { lat: 31.4178, lng: 34.3497 },
  'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
  Jerusalem: { lat: 31.7683, lng: 35.2137 },
  Haifa: { lat: 32.794, lng: 34.9896 },
  'West Bank': { lat: 31.9466, lng: 35.3027 },
  Jenin: { lat: 32.4595, lng: 35.3009 },
  Nablus: { lat: 32.2211, lng: 35.2544 },
  Tehran: { lat: 35.6892, lng: 51.389 },
  Isfahan: { lat: 32.6546, lng: 51.668 },
  Natanz: { lat: 33.73, lng: 51.73 },
  Fordow: { lat: 34.8844, lng: 50.9954 },
  Damascus: { lat: 33.5138, lng: 36.2765 },
  Beirut: { lat: 33.8938, lng: 35.5018 },
  Lebanon: { lat: 33.8547, lng: 35.8623 },
  Syria: { lat: 34.8021, lng: 38.9968 },
  Iraq: { lat: 33.2232, lng: 43.6793 },
  Yemen: { lat: 15.5527, lng: 48.5164 },
});

const WEAPON_PATTERNS = [
  { key: 'airstrike', category: 'air_power', regex: /\b(airstrike|air strike|air raid)\b/i },
  { key: 'missile', category: 'missile_systems', regex: /\b(missile|missiles)\b/i },
  { key: 'ballistic missile', category: 'missile_systems', regex: /\b(ballistic missile|ballistic missiles)\b/i },
  { key: 'cruise missile', category: 'missile_systems', regex: /\b(cruise missile|cruise missiles)\b/i },
  { key: 'rocket', category: 'rocket_artillery', regex: /\b(rocket|rockets)\b/i },
  { key: 'artillery', category: 'rocket_artillery', regex: /\b(artillery|howitzer|shelling)\b/i },
  { key: 'drone', category: 'uav_systems', regex: /\b(drone|drones|uav|ucav)\b/i },
  { key: 'tank', category: 'ground_systems', regex: /\b(tank|armored vehicle|apc)\b/i },
  { key: 'interceptor', category: 'air_defense', regex: /\b(interceptor|interceptors)\b/i },
  { key: 'bunker buster', category: 'precision_munitions', regex: /\b(bunker buster)\b/i },
];

const TECHNOLOGY_PATTERNS = [
  { key: 'iron dome', category: 'air_defense_platforms', regex: /\b(iron dome)\b/i },
  { key: 'arrow', category: 'air_defense_platforms', regex: /\b(arrow[-\s]?(2|3)?|arrow system)\b/i },
  { key: 'david\'s sling', category: 'air_defense_platforms', regex: /\b(david'?s sling)\b/i },
  { key: 'f-35', category: 'combat_aircraft', regex: /\b(f-?35)\b/i },
  { key: 'f-16', category: 'combat_aircraft', regex: /\b(f-?16)\b/i },
  { key: 'satellite', category: 'space_intel', regex: /\b(satellite|satellite imagery)\b/i },
  { key: 'cyber', category: 'cyber_operations', regex: /\b(cyber|cyberattack|cyber attack)\b/i },
  { key: 'electronic warfare', category: 'electronic_warfare', regex: /\b(electronic warfare|ew)\b/i },
  { key: 'gps jamming', category: 'electronic_warfare', regex: /\b(gps jamming|gps spoofing|navigation jamming)\b/i },
];

const ANNOUNCEMENT_TERMS = [
  'announced', 'statement', 'spokesperson', 'ministry said',
  'official said', 'confirmed', 'declared',
];

const ANNOUNCEMENT_TYPE_PATTERNS = [
  { type: 'casualty_update', regex: /\b(killed|injured|wounded|casualties?|death toll)\b/i },
  { type: 'military_operation', regex: /\b(operation|strike|offensive|raid|intercepted|retaliation)\b/i },
  { type: 'ceasefire_or_negotiation', regex: /\b(ceasefire|truce|talks|negotiation|mediation)\b/i },
  { type: 'diplomatic_statement', regex: /\b(embassy|foreign ministry|state department|diplomatic|envoy|summon)\b/i },
  { type: 'humanitarian_update', regex: /\b(humanitarian|aid|evacuation|corridor|hospital|relief)\b/i },
  { type: 'policy_or_sanctions', regex: /\b(sanction|policy|designation|restriction|ban)\b/i },
];

const IDENTITY_EXCLUDE_TERMS = new Set([
  'israel',
  'iran',
  'hamas',
  'hezbollah',
  'gaza',
  'west bank',
  'united states',
  'middle east',
  'palestinian authority',
  'gaza authorities',
  'israeli military',
  'ministry of health',
  'health ministry',
  'defense ministry',
]);

const AGENT_NAMES = {
  scout: 'source-scout-agent',
  ingestion: 'ingestion-agent',
  verification: 'verification-agent',
  theory: 'theory-agent',
  forecast: 'forecast-agent',
  reliability: 'reliability-agent',
};

const ALLOWED_AUTO_FIXES = new Set([
  'retry_ingestion_job',
  'quarantine_source',
  'lower_fetch_concurrency',
  'trigger_backfill_after_recovery',
  'open_incident_record',
]);

const DIRECT_SOURCE_TIER_HINTS = {
  official: [
    'gov', 'government', 'ministry', 'state department', 'defense ministry',
    'idf', 'pentagon', 'white house', 'press office', 'army.mil', 'un.org', 'who.int'
  ],
  wire: ['reuters', 'apnews', 'associated press', 'afp', 'anadolu'],
  major: ['bbc', 'cnn', 'nytimes', 'washington post', 'guardian', 'aljazeera', 'bloomberg'],
};

const flagCache = {
  expiresAt: 0,
  map: {},
};

const AUTONOMY_BUDGET_LIMITS = {
  minAgentMs: 1000,
  maxAgentMs: 300000,
  minCycleMs: 5000,
  maxCycleMs: 900000,
  defaultAgentMs: 45000,
  defaultCycleMs: 180000,
};

const STALE_AGENT_RUN_LIMITS = {
  minMs: 5 * 60 * 1000,
  maxMs: 7 * 24 * 60 * 60 * 1000,
  defaultMs: 45 * 60 * 1000,
  defaultLimit: 500,
  maxLimit: 5000,
};

const INTEL_GAP_DEFAULTS = {
  minSignalEvents: 3,
  lowVerifiedShare: 0.45,
  lowConfidence: 0.45,
  staleHours: 30,
};

const WEAPON_CATEGORY_BY_KEY = Object.freeze(
  WEAPON_PATTERNS.reduce((acc, item) => {
    acc[item.key] = item.category;
    return acc;
  }, {})
);

const TECHNOLOGY_CATEGORY_BY_KEY = Object.freeze(
  TECHNOLOGY_PATTERNS.reduce((acc, item) => {
    acc[item.key] = item.category;
    return acc;
  }, {})
);

function normalizeConflict(input) {
  const value = String(input || '').trim().toLowerCase();
  if (!value || value === 'all') return 'all';
  if (value === 'gaza-israel' || value === 'gaza_israel') return 'gaza-israel';
  if (value === 'israel-us-iran' || value === 'israel_us_iran' || value === 'israel-iran-us') return 'israel-us-iran';
  return value;
}

function normalizeVerification(input, defaultValue = 'verified') {
  const value = String(input || '').trim().toLowerCase();
  if (!value) return defaultValue;
  if (['verified', 'unverified', 'rejected', 'all'].includes(value)) return value;
  return defaultValue;
}

function normalizeSourceTier(input, defaultValue = 'all') {
  const value = String(input || '').trim().toLowerCase();
  if (!value || value === 'all') return defaultValue;
  if (SOURCE_TIERS.includes(value)) return value;
  return defaultValue;
}

function normalizeCompareMode(input) {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'actor-vs-actor' || value === 'actor') return 'actor-vs-actor';
  return 'conflict-vs-conflict';
}

function normalizeScopeType(input) {
  const value = String(input || '').trim().toLowerCase();
  if (value === 'actor') return 'actor';
  return 'conflict';
}

function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      // ignore
    }

    if (trimmed.includes(',')) {
      return trimmed.split(',').map((v) => String(v).trim()).filter(Boolean);
    }
    return [trimmed];
  }

  if (typeof value === 'object') {
    return Object.values(value).map((v) => String(v).trim()).filter(Boolean);
  }

  return [];
}

function ensureObject(value, fallback = {}) {
  if (!value) return { ...fallback };
  if (typeof value === 'object' && !Array.isArray(value)) return { ...value };
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return { ...fallback };
}

function ensureStructuredArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseCount(raw) {
  const str = String(raw || '').replace(/,/g, '');
  const val = parseInt(str, 10);
  return Number.isFinite(val) ? val : 0;
}

function parseFloatSafe(raw, fallback = 0) {
  const val = Number(raw);
  return Number.isFinite(val) ? val : fallback;
}

function extractMaxCount(text, regex) {
  let match;
  let max = 0;
  while ((match = regex.exec(text)) !== null) {
    max = Math.max(max, parseCount(match[1]));
  }
  return max;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseDurationMs(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return clamp(Math.round(parsed), min, max);
}

function generateUuid() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return [4, 2, 2, 2, 6]
    .map((len) => crypto.randomBytes(len).toString('hex'))
    .join('-');
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function toIsoDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function toDateMs(value) {
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueStrings(values = []) {
  return [...new Set(
    ensureArray(values).map((value) => String(value).trim()).filter(Boolean)
  )];
}

function extractPatternValues(text, patterns = [], valueKey = 'label') {
  const body = String(text || '');
  return uniqueStrings(
    patterns
      .filter((pattern) => pattern?.regex?.test(body))
      .map((pattern) => pattern[valueKey])
      .filter(Boolean)
  );
}

function extractTaxonomyMatches(text, patterns = []) {
  const body = String(text || '');
  const keys = [];
  const categories = [];

  patterns.forEach((pattern) => {
    if (!pattern?.regex || !pattern.regex.test(body)) return;
    if (pattern.key) keys.push(pattern.key);
    if (pattern.category) categories.push(pattern.category);
  });

  return {
    keys: uniqueStrings(keys),
    categories: uniqueStrings(categories),
  };
}

function isLikelyIdentityName(rawName) {
  const cleaned = String(rawName || '')
    .replace(/[.,;:()]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return false;

  const lower = cleaned.toLowerCase();
  if (IDENTITY_EXCLUDE_TERMS.has(lower)) return false;

  const tokens = cleaned.split(' ');
  if (tokens.length < 2 || tokens.length > 4) return false;
  if (tokens.some((token) => token.length < 2)) return false;

  const titledTokens = tokens.filter((token) => /^[A-Z][a-z'’-]+$/.test(token));
  return titledTokens.length >= 2;
}

function extractIdentitiesFromText(text) {
  const body = String(text || '');
  if (!body) return [];

  const identities = [];
  const seenNames = new Set();
  const seenIds = new Set();

  const namePatterns = [
    /\b(?:identified as|named|name released as|names released as|confirmed dead as|victim(?:s)? identified as)\s+([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+){1,3})/g,
    /\b(?:the(?:\s+late)?|deceased)\s+([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+){1,3})/g,
  ];

  namePatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(body)) !== null) {
      const name = String(match[1] || '').replace(/[.,;:()]+$/g, '').trim();
      const key = name.toLowerCase();
      if (!name || seenNames.has(key) || !isLikelyIdentityName(name)) continue;
      seenNames.add(key);
      identities.push({
        name,
        id: '',
        status: 'reported',
      });
    }
  });

  const idPattern = /\b(?:id|identifier|casualty id|record id|name id)\b\s*(?:#|:)\s*([A-Z0-9-]{4,20})\b/gi;
  let idMatch;
  while ((idMatch = idPattern.exec(body)) !== null) {
    const id = String(idMatch[1] || '').trim().toUpperCase();
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);
    identities.push({
      name: `ID-${id}`,
      id,
      status: 'reported',
    });
  }

  return identities.slice(0, 25);
}

function classifyOfficialAnnouncement(text) {
  const body = String(text || '').trim();
  if (!body) {
    return {
      type: '',
      confidence: 0,
      matched_signals: [],
    };
  }

  const matches = ANNOUNCEMENT_TYPE_PATTERNS
    .filter((pattern) => pattern.regex.test(body))
    .map((pattern) => pattern.type);

  const type = matches[0] || 'general_update';
  const confidence = matches.length === 0
    ? 0.35
    : clamp(0.45 + ((matches.length - 1) * 0.12), 0.45, 0.9);

  return {
    type,
    confidence: Number(confidence.toFixed(2)),
    matched_signals: uniqueStrings(matches),
  };
}

function tierRank(value) {
  const tier = normalizeSourceTier(value, 'other');
  if (tier === 'official') return 4;
  if (tier === 'wire') return 3;
  if (tier === 'major') return 2;
  return 1;
}

function classifySourceTier(sourceName, sourceUrl) {
  const haystack = `${String(sourceName || '')} ${String(sourceUrl || '')}`.toLowerCase();

  if (DIRECT_SOURCE_TIER_HINTS.official.some((hint) => haystack.includes(hint))) return 'official';
  if (DIRECT_SOURCE_TIER_HINTS.wire.some((hint) => haystack.includes(hint))) return 'wire';
  if (DIRECT_SOURCE_TIER_HINTS.major.some((hint) => haystack.includes(hint))) return 'major';
  return 'other';
}

function normalizeIdentities(raw) {
  const identities = Array.isArray(raw)
    ? raw
    : ensureArray(raw).map((name) => ({ name }));

  return identities
    .map((entry) => {
      if (typeof entry === 'string') return { name: entry };
      if (!entry || typeof entry !== 'object') return null;
      return {
        name: String(entry.name || '').trim(),
        id: String(entry.id || '').trim(),
        status: String(entry.status || '').trim() || 'reported',
      };
    })
    .filter((entry) => entry && entry.name);
}

function eventDedupeKey(event) {
  const conflict = normalizeConflict(event.conflict);
  const date = toIsoDate(event.event_date).slice(0, 10);
  const source = String(event.source_url || event.article_id || event.title || '').trim().toLowerCase();
  return `${conflict}|${date}|${source}`;
}

function inferConflict(text) {
  const body = String(text || '').toLowerCase();
  let best = { key: null, score: 0 };

  Object.entries(CONFLICT_KEYWORDS).forEach(([key, keywords]) => {
    const score = keywords.reduce((acc, keyword) => acc + (body.includes(keyword) ? 1 : 0), 0);
    if (score > best.score) {
      best = { key, score };
    }
  });

  return best.score >= 2 ? best.key : null;
}

function extractActors(text) {
  const body = String(text || '');
  return ACTOR_PATTERNS
    .filter((item) => item.regex.test(body))
    .map((item) => item.label);
}

function extractHitLocations(text) {
  return extractPatternValues(text, LOCATION_PATTERNS, 'label');
}

function extractWeaponSignals(text) {
  return extractTaxonomyMatches(text, WEAPON_PATTERNS);
}

function extractTechnologySignals(text) {
  return extractTaxonomyMatches(text, TECHNOLOGY_PATTERNS);
}

function deriveCategoriesFromKeys(keys = [], categoryLookup = {}) {
  return uniqueStrings(
    ensureArray(keys)
      .map((key) => categoryLookup[String(key).toLowerCase()] || categoryLookup[String(key)] || '')
      .filter(Boolean)
  );
}

function pickAnnouncement(text) {
  const body = String(text || '');
  const lines = body.split(/[.?!]\s+/).map((line) => line.trim()).filter(Boolean);
  const line = lines.find((candidate) => ANNOUNCEMENT_TERMS.some((term) => candidate.toLowerCase().includes(term)));
  if (!line) return '';
  return line.slice(0, 280);
}

async function ensureStoreFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
  }
}

async function readStore() {
  await ensureStoreFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    const events = Array.isArray(parsed?.events) ? parsed.events : [];
    return { events };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

async function writeStore(store) {
  await ensureStoreFile();
  const temp = `${DATA_FILE}.tmp`;
  await fs.writeFile(temp, JSON.stringify(store, null, 2), 'utf8');
  await fs.rename(temp, DATA_FILE);
}

function normalizeEvent(input = {}) {
  const actors = ensureArray(input.actors);
  const hitLocations = ensureArray(input.hit_locations || input.locations);
  const weapons = ensureArray(input.weapons);
  const technologies = ensureArray(input.technologies);
  const officialAnnouncementTypes = uniqueStrings(
    ensureArray(input.official_announcement_types).concat(
      ensureArray(ensureObject(input.metadata).official_announcement?.type)
    )
  );
  const conflict = normalizeConflict(input.conflict);
  const sourceTier = normalizeSourceTier(
    input.source_tier || classifySourceTier(input.source_name, input.source_url),
    'other'
  );
  const identities = normalizeIdentities(input.identities);

  const metadata = ensureObject(input.metadata);
  const identitiesPublic = metadata.identities_public === true || input.identities_public === true;

  return {
    id: String(input.id || generateUuid()),
    conflict: conflict === 'all' ? 'unknown' : conflict,
    event_date: toIsoDate(input.event_date),
    reported_at: toIsoDate(input.reported_at || new Date()),
    title: String(input.title || '').trim(),
    summary: String(input.summary || '').trim(),
    source_name: String(input.source_name || '').trim() || 'Unknown Source',
    source_url: String(input.source_url || '').trim(),
    source_tier: sourceTier,
    article_id: input.article_id ? String(input.article_id) : null,
    actors,
    hit_locations: hitLocations,
    weapons,
    technologies,
    official_announcement_types: officialAnnouncementTypes,
    identities,
    fatalities_total: parseCount(input.fatalities_total),
    injured_total: parseCount(input.injured_total),
    ids_released_count: parseCount(input.ids_released_count),
    official_announcement_text: String(input.official_announcement_text || '').trim(),
    official_announcement_actor: String(input.official_announcement_actor || '').trim(),
    verification_status: ['verified', 'unverified', 'rejected'].includes(input.verification_status)
      ? input.verification_status
      : 'unverified',
    verification_reason: String(input.verification_reason || '').trim(),
    verified_by: String(input.verified_by || '').trim() || null,
    verified_at: input.verified_at ? toIsoDate(input.verified_at) : null,
    extraction_method: String(input.extraction_method || 'manual'),
    confidence: Number.isFinite(Number(input.confidence))
      ? clamp(Number(input.confidence), 0, 1)
      : 0.5,
    metadata: {
      ...metadata,
      identities_public: identitiesPublic,
    },
  };
}

function hydrateEvent(row = {}) {
  const event = normalizeEvent({
    ...row,
    id: row.id,
  });

  if (!event.id && row.id) {
    event.id = String(row.id);
  }

  return event;
}

function sanitizeEventForPublic(event, includeIdentities = false) {
  const payload = {
    ...event,
    metadata: ensureObject(event.metadata),
  };

  if (!includeIdentities) {
    delete payload.identities;
    return payload;
  }

  const identityCount = Array.isArray(event.identities) ? event.identities.length : 0;
  const canExpose = event.verification_status === 'verified' && payload.metadata.identities_public === true;

  if (canExpose) {
    payload.identities = event.identities;
    return payload;
  }

  payload.identities = [];
  payload.identity_count = identityCount;
  payload.identity_withheld_notice = identityCount > 0
    ? 'Identities withheld pending verification/public policy review.'
    : '';
  return payload;
}

function buildEventFromArticle(article = {}) {
  const title = String(article.title || '').trim();
  const summary = String(article.summary || '').trim();
  const body = String(article.content || '').slice(0, 3000);
  const sourceUrl = String(article.url || article.source_url || '').trim();
  const sourceName = String(article.source_name || article.author_name || 'Unknown Source').trim();
  const mergedText = [title, summary, body].filter(Boolean).join(' ');
  const conflict = inferConflict(mergedText);

  if (!conflict) return null;

  const fatalities = extractMaxCount(
    mergedText,
    /(\d{1,6}(?:,\d{3})*)\s+(?:people|persons|civilians?|soldiers?|troops?|fighters?|children|journalists|aid workers)?\s*(?:killed|dead|deaths?|fatalities?)/gi
  );
  const injured = extractMaxCount(
    mergedText,
    /(\d{1,6}(?:,\d{3})*)\s+(?:people|persons|civilians?|soldiers?|troops?|fighters?|children)?\s*(?:were|was|are|have\s+been|had\s+been)?\s*(?:injured|wounded)/gi
  );
  const idsReleasedSignal = extractMaxCount(
    mergedText,
    /(\d{1,6}(?:,\d{3})*)\s+(?:identified|named|ids?\s+released|names\s+released)/gi
  );
  const extractedIdentities = extractIdentitiesFromText(mergedText);
  const idsReleased = Math.max(idsReleasedSignal, extractedIdentities.length);

  const actors = extractActors(mergedText);
  const hitLocations = extractHitLocations(mergedText);
  const weaponSignals = extractWeaponSignals(mergedText);
  const techSignals = extractTechnologySignals(mergedText);
  const weapons = weaponSignals.keys;
  const technologies = techSignals.keys;
  const officialAnnouncementText = pickAnnouncement(mergedText);
  const officialAnnouncementMeta = classifyOfficialAnnouncement(officialAnnouncementText);

  const hasSignal = fatalities > 0 ||
    injured > 0 ||
    actors.length > 0 ||
    hitLocations.length > 0 ||
    weapons.length > 0 ||
    technologies.length > 0 ||
    extractedIdentities.length > 0 ||
    Boolean(officialAnnouncementText);

  if (!hasSignal) return null;

  let confidence = 0.2;
  if (fatalities > 0 || injured > 0) confidence += 0.25;
  if (actors.length > 0) confidence += 0.2;
  if (hitLocations.length > 0) confidence += 0.15;
  if (weapons.length > 0 || technologies.length > 0) confidence += 0.1;
  if (extractedIdentities.length > 0) confidence += 0.1;
  if (officialAnnouncementText) confidence += 0.1;

  const officialAnnouncementActor = actors[0] || '';

  return normalizeEvent({
    conflict,
    event_date: article.published_at || article.date_created || new Date().toISOString(),
    title,
    summary,
    source_name: sourceName,
    source_url: sourceUrl,
    source_tier: classifySourceTier(sourceName, sourceUrl),
    article_id: article.id || null,
    actors,
    hit_locations: hitLocations,
    weapons,
    technologies,
    identities: extractedIdentities,
    fatalities_total: fatalities,
    injured_total: injured,
    ids_released_count: idsReleased,
    official_announcement_text: officialAnnouncementText,
    official_announcement_actor: officialAnnouncementActor,
    official_announcement_types: officialAnnouncementMeta.type ? [officialAnnouncementMeta.type] : [],
    verification_status: 'unverified',
    extraction_method: 'heuristic_article',
    confidence: Math.min(0.95, confidence),
    metadata: {
      inferred_from_article: true,
      source_tier: classifySourceTier(sourceName, sourceUrl),
      weapon_categories: weaponSignals.categories,
      technology_categories: techSignals.categories,
      official_announcement: officialAnnouncementMeta,
      extraction_confidence: {
        event_confidence: Math.min(0.95, confidence),
        announcement_confidence: officialAnnouncementMeta.confidence,
      },
      extracted_identity_count: extractedIdentities.length,
      location_signal_count: hitLocations.length,
    },
  });
}

function filterEvents(events, options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const verification = normalizeVerification(options.verification, 'verified');
  const sourceTier = normalizeSourceTier(options.source_tier || 'all', 'all');
  const days = parseCount(options.days || 30);
  const limit = Math.max(1, Math.min(parseCount(options.limit || 200), 5000));
  const from = options.from ? new Date(options.from) : null;
  const to = options.to ? new Date(options.to) : null;
  const now = Date.now();
  const maxAgeMs = days > 0 ? days * 24 * 60 * 60 * 1000 : null;

  const filtered = events
    .filter((event) => {
      if (conflict !== 'all' && normalizeConflict(event.conflict) !== conflict) return false;
      if (verification !== 'all' && normalizeVerification(event.verification_status, 'unverified') !== verification) return false;
      if (sourceTier !== 'all' && normalizeSourceTier(event.source_tier, 'other') !== sourceTier) return false;

      const ts = toDateMs(event.event_date);
      if (!Number.isFinite(ts)) return false;
      if (maxAgeMs && (now - ts) > maxAgeMs) return false;
      if (from && Number.isFinite(from.getTime()) && ts < from.getTime()) return false;
      if (to && Number.isFinite(to.getTime()) && ts > to.getTime()) return false;
      return true;
    })
    .sort((a, b) => toDateMs(b.event_date) - toDateMs(a.event_date));

  return filtered.slice(0, limit);
}

function toSortedCountArray(map, keyName, valueName = 'count') {
  return [...map.entries()]
    .map(([key, value]) => ({ [keyName]: key, [valueName]: value }))
    .sort((a, b) => b[valueName] - a[valueName]);
}

function buildTopSources(events = []) {
  const bySource = new Map();
  events.forEach((event) => {
    const key = `${event.source_name || 'Unknown'}|${event.source_tier || 'other'}`;
    const entry = bySource.get(key) || {
      source_name: event.source_name || 'Unknown',
      source_tier: event.source_tier || 'other',
      events: 0,
      verified_events: 0,
    };
    entry.events += 1;
    if (event.verification_status === 'verified') entry.verified_events += 1;
    bySource.set(key, entry);
  });

  return [...bySource.values()]
    .sort((a, b) => (b.events - a.events) || (tierRank(b.source_tier) - tierRank(a.source_tier)))
    .slice(0, 20);
}

function aggregateEvents(events = []) {
  const totals = {
    events: events.length,
    fatalities_total: 0,
    injured_total: 0,
    ids_released_count: 0,
    identity_records: 0,
    official_announcements: 0,
  };

  const byActor = new Map();
  const byLocation = new Map();
  const byWeapon = new Map();
  const byTechnology = new Map();
  const byWeaponCategory = new Map();
  const byTechnologyCategory = new Map();
  const byAnnouncementType = new Map();
  const byAnnouncementActor = new Map();
  const byIdentityStatus = new Map();
  const byDate = new Map();

  const officialAnnouncements = [];

  events.forEach((event) => {
    const eventMetadata = ensureObject(event.metadata);
    const eventIdentities = normalizeIdentities(event.identities);

    totals.fatalities_total += parseCount(event.fatalities_total);
    totals.injured_total += parseCount(event.injured_total);
    totals.ids_released_count += parseCount(event.ids_released_count);
    totals.identity_records += eventIdentities.length;

    eventIdentities.forEach((identity) => {
      const status = String(identity.status || 'reported').toLowerCase();
      byIdentityStatus.set(status, (byIdentityStatus.get(status) || 0) + 1);
    });

    if (event.official_announcement_text) {
      const classified = ensureObject(eventMetadata.official_announcement);
      const derivedType = String(
        classified.type || classifyOfficialAnnouncement(event.official_announcement_text).type || 'general_update'
      ).trim() || 'general_update';
      const announcementTypes = uniqueStrings([
        ...ensureArray(event.official_announcement_types),
        derivedType,
      ]);
      const announcementConfidence = Number.isFinite(Number(classified.confidence))
        ? clamp(Number(classified.confidence), 0, 1)
        : null;
      const announcementActor = event.official_announcement_actor || (event.actors && event.actors[0]) || 'Unknown';

      totals.official_announcements += 1;
      announcementTypes.forEach((announcementType) => {
        byAnnouncementType.set(announcementType, (byAnnouncementType.get(announcementType) || 0) + 1);
      });
      byAnnouncementActor.set(announcementActor, (byAnnouncementActor.get(announcementActor) || 0) + 1);

      officialAnnouncements.push({
        id: event.id,
        date: event.event_date,
        conflict: event.conflict,
        actor: announcementActor,
        announcement_type: derivedType,
        announcement_types: announcementTypes,
        announcement_confidence: announcementConfidence,
        text: event.official_announcement_text,
        source_name: event.source_name,
        source_url: event.source_url,
        source_tier: event.source_tier || 'other',
      });
    }

    const eventDate = toIsoDate(event.event_date).slice(0, 10);
    const dayEntry = byDate.get(eventDate) || {
      events: 0,
      fatalities_total: 0,
      injured_total: 0,
      ids_released_count: 0,
      official_announcements: 0,
    };
    dayEntry.events += 1;
    dayEntry.fatalities_total += parseCount(event.fatalities_total);
    dayEntry.injured_total += parseCount(event.injured_total);
    dayEntry.ids_released_count += parseCount(event.ids_released_count);
    if (event.official_announcement_text) {
      dayEntry.official_announcements += 1;
    }
    byDate.set(eventDate, dayEntry);

    const actors = ensureArray(event.actors);
    actors.forEach((actor) => {
      const key = actor || 'Unknown';
      const entry = byActor.get(key) || { events: 0, fatalities_total: 0, injured_total: 0 };
      entry.events += 1;
      entry.fatalities_total += parseCount(event.fatalities_total);
      entry.injured_total += parseCount(event.injured_total);
      byActor.set(key, entry);
    });

    ensureArray(event.hit_locations).forEach((location) => {
      byLocation.set(location, (byLocation.get(location) || 0) + 1);
    });

    ensureArray(event.weapons).forEach((weapon) => {
      byWeapon.set(weapon, (byWeapon.get(weapon) || 0) + 1);
    });
    const weaponCategories = uniqueStrings([
      ...ensureArray(eventMetadata.weapon_categories),
      ...ensureArray(eventMetadata.taxonomy?.weapon_categories),
      ...deriveCategoriesFromKeys(event.weapons, WEAPON_CATEGORY_BY_KEY),
    ]);
    weaponCategories.forEach((category) => {
      byWeaponCategory.set(category, (byWeaponCategory.get(category) || 0) + 1);
    });

    ensureArray(event.technologies).forEach((tech) => {
      byTechnology.set(tech, (byTechnology.get(tech) || 0) + 1);
    });
    const technologyCategories = uniqueStrings([
      ...ensureArray(eventMetadata.technology_categories),
      ...ensureArray(eventMetadata.taxonomy?.technology_categories),
      ...deriveCategoriesFromKeys(event.technologies, TECHNOLOGY_CATEGORY_BY_KEY),
    ]);
    technologyCategories.forEach((category) => {
      byTechnologyCategory.set(category, (byTechnologyCategory.get(category) || 0) + 1);
    });
  });

  const actorComparisons = [...byActor.entries()]
    .map(([actor, value]) => ({ actor, ...value }))
    .sort((a, b) => b.events - a.events);

  const timeline = [...byDate.entries()]
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dataQuality = {
    verified_events: events.filter((event) => event.verification_status === 'verified').length,
    unverified_events: events.filter((event) => event.verification_status === 'unverified').length,
    rejected_events: events.filter((event) => event.verification_status === 'rejected').length,
    average_confidence: events.length
      ? Number((events.reduce((acc, event) => acc + Number(event.confidence || 0), 0) / events.length).toFixed(3))
      : 0,
  };

  return {
    totals,
    actor_comparisons: actorComparisons,
    locations_hit: toSortedCountArray(byLocation, 'location', 'hits').slice(0, 20),
    weapon_usage: toSortedCountArray(byWeapon, 'weapon').slice(0, 20),
    weapon_category_usage: toSortedCountArray(byWeaponCategory, 'category').slice(0, 20),
    technology_usage: toSortedCountArray(byTechnology, 'technology').slice(0, 20),
    technology_category_usage: toSortedCountArray(byTechnologyCategory, 'category').slice(0, 20),
    timeline,
    announcement_type_usage: toSortedCountArray(byAnnouncementType, 'type').slice(0, 20),
    announcement_actor_usage: toSortedCountArray(byAnnouncementActor, 'actor').slice(0, 20),
    identity_status_breakdown: toSortedCountArray(byIdentityStatus, 'status').slice(0, 20),
    official_announcements: officialAnnouncements
      .sort((a, b) => toDateMs(b.date) - toDateMs(a.date))
      .slice(0, 30),
    source_breakdown: buildTopSources(events),
    data_quality: dataQuality,
  };
}

function buildComparison(events, options = {}) {
  const mode = normalizeCompareMode(options.compare_mode || options.mode || 'conflict-vs-conflict');
  const left = String(options.compare_left || options.left || (mode === 'actor-vs-actor' ? 'Israel' : 'gaza-israel')).trim();
  const right = String(options.compare_right || options.right || (mode === 'actor-vs-actor' ? 'Iran' : 'israel-us-iran')).trim();

  const leftEvents = mode === 'actor-vs-actor'
    ? events.filter((event) => ensureArray(event.actors).some((actor) => actor.toLowerCase() === left.toLowerCase()))
    : events.filter((event) => normalizeConflict(event.conflict) === normalizeConflict(left));

  const rightEvents = mode === 'actor-vs-actor'
    ? events.filter((event) => ensureArray(event.actors).some((actor) => actor.toLowerCase() === right.toLowerCase()))
    : events.filter((event) => normalizeConflict(event.conflict) === normalizeConflict(right));

  return {
    mode,
    left,
    right,
    left_metrics: aggregateEvents(leftEvents).totals,
    right_metrics: aggregateEvents(rightEvents).totals,
    left_event_count: leftEvents.length,
    right_event_count: rightEvents.length,
  };
}

function buildEvidenceFromEvents(events = [], limit = 8) {
  return events.slice(0, limit).map((event) => ({
    event_id: event.id,
    date: event.event_date,
    title: event.title || event.summary || 'Conflict event',
    source_name: event.source_name,
    source_tier: event.source_tier || 'other',
    source_url: event.source_url || null,
    fatalities_total: event.fatalities_total || 0,
    injured_total: event.injured_total || 0,
    confidence: Number(event.confidence || 0),
    verification_status: event.verification_status,
  }));
}

function computeSourceTierFloor(evidence = []) {
  if (!Array.isArray(evidence) || evidence.length === 0) return 'other';
  let minRank = 99;
  evidence.forEach((item) => {
    minRank = Math.min(minRank, 5 - tierRank(item.source_tier || 'other'));
  });
  if (minRank <= 1) return 'official';
  if (minRank === 2) return 'wire';
  if (minRank === 3) return 'major';
  return 'other';
}

function normalizeDistribution(raw = {}) {
  const escalation = Math.max(0, Number(raw.escalation || 0));
  const stable = Math.max(0, Number(raw.stable || 0));
  const deEscalation = Math.max(0, Number(raw.de_escalation || raw.deEscalation || 0));
  const total = escalation + stable + deEscalation;
  if (total <= 0) {
    return {
      escalation: 0.34,
      stable: 0.33,
      de_escalation: 0.33,
    };
  }
  return {
    escalation: Number((escalation / total).toFixed(4)),
    stable: Number((stable / total).toFixed(4)),
    de_escalation: Number((deEscalation / total).toFixed(4)),
  };
}

function deriveScenarioProbabilities(events = [], horizonHours = 24) {
  if (!events.length) {
    return normalizeDistribution({
      escalation: 0.34,
      stable: 0.36,
      de_escalation: 0.3,
    });
  }

  const now = Date.now();
  const horizonMs = horizonHours * 60 * 60 * 1000;
  const recentWindow = Math.min(Math.max(horizonMs * 2, 24 * 60 * 60 * 1000), 7 * 24 * 60 * 60 * 1000);
  const previousWindow = recentWindow;

  let recentScore = 0;
  let previousScore = 0;

  events.forEach((event) => {
    const ts = toDateMs(event.event_date);
    if (!ts) return;
    const age = now - ts;
    const intensity = Number(event.fatalities_total || 0) * 0.8
      + Number(event.injured_total || 0) * 0.2
      + Number(event.ids_released_count || 0) * 0.1
      + 2;

    if (age <= recentWindow) {
      recentScore += intensity;
    } else if (age <= recentWindow + previousWindow) {
      previousScore += intensity;
    }
  });

  const delta = recentScore - previousScore;
  const trend = previousScore > 0 ? delta / previousScore : (recentScore > 0 ? 1 : 0);
  const escalation = clamp(0.34 + trend * (horizonHours <= 24 ? 0.25 : 0.18), 0.12, 0.76);
  const deEscalation = clamp(0.33 - trend * (horizonHours <= 24 ? 0.2 : 0.15), 0.1, 0.7);
  const stable = clamp(1 - escalation - deEscalation, 0.08, 0.72);

  return normalizeDistribution({ escalation, stable, de_escalation: deEscalation });
}

function estimateCalibrationScore(events = []) {
  if (!events.length) return 0.25;
  const verifiedShare = events.filter((event) => event.verification_status === 'verified').length / events.length;
  const avgConfidence = events.reduce((acc, event) => acc + Number(event.confidence || 0), 0) / events.length;
  return Number(clamp(verifiedShare * 0.6 + avgConfidence * 0.4, 0, 1).toFixed(3));
}

function passesTheoryPublishGate(theory) {
  const evidenceCount = parseCount(theory.evidence_count);
  const highTierCount = parseCount(theory.metadata?.high_tier_evidence_count);
  return evidenceCount >= 3 && highTierCount >= 1 && Number(theory.confidence || 0) >= 0.45;
}

function passesForecastPublishGate(forecast) {
  const calibration = Number(forecast.calibration_score || 0);
  const probs = normalizeDistribution(forecast.scenario_probabilities || {});
  const bounded = Object.values(probs).every((value) => value >= 0 && value <= 1);
  return bounded && calibration >= 0.55;
}

function createDeterministicTheory(conflict, stats, evidence) {
  const totalFatalities = Number(stats?.totals?.fatalities_total || 0);
  const totalEvents = Number(stats?.totals?.events || 0);
  const escalationSignal = totalEvents > 0 ? totalFatalities / totalEvents : 0;

  const thesis = escalationSignal >= 8
    ? `Recent reporting for ${conflict} suggests elevated short-term escalation pressure concentrated in recurring hotspots.`
    : `Recent reporting for ${conflict} suggests a mixed but relatively stable operational pattern with localized spikes.`;

  const counterEvidence = (stats?.timeline || [])
    .slice(-7)
    .filter((row) => Number(row.events || 0) === 0)
    .map((row) => ({
      type: 'quiet_day',
      date: row.date,
      note: 'No events captured for this day in the selected window.',
    }));

  const highTierEvidenceCount = evidence.filter((item) => tierRank(item.source_tier) >= tierRank('major')).length;

  return {
    conflict,
    scope_type: 'conflict',
    scope_primary: conflict,
    scope_secondary: '',
    thesis,
    supporting_evidence: evidence,
    counter_evidence: counterEvidence,
    uncertainty: 'Hypothesis built from available reports and verification status; not a deterministic claim.',
    confidence: Number(clamp(0.35 + (stats?.data_quality?.average_confidence || 0) * 0.5, 0.2, 0.84).toFixed(3)),
    evidence_count: evidence.length,
    source_tier_min: computeSourceTierFloor(evidence),
    status: 'draft',
    model_version: 'heuristic-v1',
    model_provider: 'internal',
    metadata: {
      high_tier_evidence_count: highTierEvidenceCount,
      generated_by: 'deterministic',
      generated_at: new Date().toISOString(),
    },
  };
}

function buildRelatedNewsSignals(events = []) {
  const actors = new Set();
  const locations = new Set();
  const weapons = new Set();
  const tech = new Set();

  events.forEach((event) => {
    ensureArray(event.actors).forEach((item) => actors.add(item.toLowerCase()));
    ensureArray(event.hit_locations).forEach((item) => locations.add(item.toLowerCase()));
    ensureArray(event.weapons).forEach((item) => weapons.add(item.toLowerCase()));
    ensureArray(event.technologies).forEach((item) => tech.add(item.toLowerCase()));
  });

  return {
    actors: [...actors],
    locations: [...locations],
    weapons: [...weapons],
    technologies: [...tech],
  };
}

function scoreRelatedArticle(article, signals, options = {}) {
  const text = normalizeText(`${article.title || ''} ${article.summary || ''} ${article.content || ''}`);
  const conflictTokens = normalizeConflict(options.conflict || 'all') === 'gaza-israel'
    ? ['gaza', 'israel', 'palestine', 'hamas', 'rafah']
    : normalizeConflict(options.conflict || 'all') === 'israel-us-iran'
      ? ['israel', 'iran', 'tehran', 'united states', 'pentagon']
      : [];

  const overlapSignals = [];

  const allSignals = [
    ...signals.actors,
    ...signals.locations,
    ...signals.weapons,
    ...signals.technologies,
    ...conflictTokens,
  ].filter(Boolean);

  allSignals.forEach((signal) => {
    if (signal && text.includes(normalizeText(signal))) {
      overlapSignals.push(signal);
    }
  });

  const uniqueOverlap = [...new Set(overlapSignals)];
  const overlapScore = allSignals.length > 0
    ? clamp(uniqueOverlap.length / Math.min(allSignals.length, 12), 0, 1)
    : 0;

  const publishedTs = toDateMs(article.published_at || article.date_created) || Date.now();
  const ageHours = Math.max(0, (Date.now() - publishedTs) / (1000 * 60 * 60));
  const recencyScore = clamp(1 - (ageHours / (24 * 4)), 0, 1);

  const sourceTier = classifySourceTier(article.source_name || article.source, article.source_url || article.url);
  const sourceTierScore = SOURCE_TIER_WEIGHTS[sourceTier] || SOURCE_TIER_WEIGHTS.other;

  const verificationAlignment = normalizeVerification(options.verification, 'verified') === 'verified'
    ? (String(article.fact_check_status || '').toLowerCase() === 'verified' ? 1 : 0.45)
    : 0.7;

  const diversityScore = clamp(uniqueOverlap.length / 4, 0, 1);

  const score = Number((
    overlapScore * 0.42 +
    recencyScore * 0.25 +
    sourceTierScore * 0.2 +
    verificationAlignment * 0.08 +
    diversityScore * 0.05
  ).toFixed(4));

  return {
    article,
    score,
    source_tier: sourceTier,
    tie_breakers: {
      published_ts: publishedTs,
      tier_rank: tierRank(sourceTier),
      signal_diversity: uniqueOverlap.length,
    },
    explain: {
      matched_signals: uniqueOverlap,
      overlap_score: Number(overlapScore.toFixed(3)),
      recency_score: Number(recencyScore.toFixed(3)),
      source_tier_score: Number(sourceTierScore.toFixed(3)),
      verification_alignment: Number(verificationAlignment.toFixed(3)),
      diversity_score: Number(diversityScore.toFixed(3)),
    },
  };
}

async function getFlagsMap(force = false) {
  const now = Date.now();
  if (!force && flagCache.expiresAt > now) {
    return flagCache.map;
  }

  try {
    const response = await queryBridge('/items/feature_flags?limit=300');
    const items = Array.isArray(response?.data) ? response.data : [];
    const mapped = items.reduce((acc, item) => {
      if (item?.name) acc[String(item.name)] = Boolean(item.enabled);
      return acc;
    }, {});

    flagCache.map = mapped;
    flagCache.expiresAt = now + 60 * 1000;
    return mapped;
  } catch (error) {
    logger.warn({ err: error?.message }, 'Failed to read feature flags for conflict ops');
    return flagCache.map || {};
  }
}

async function isFlagEnabled(flagName, defaultValue = false) {
  const flags = await getFlagsMap();
  if (Object.prototype.hasOwnProperty.call(flags, flagName)) {
    return Boolean(flags[flagName]);
  }
  return defaultValue;
}

function getPublicArtifactFlag(artifactType) {
  const key = String(artifactType || '').trim().toLowerCase();
  return PUBLIC_ARTIFACT_FLAGS[key] || null;
}

async function isPublicAnalyticsExposureEnabled(artifactType) {
  const flagName = getPublicArtifactFlag(artifactType);
  if (!flagName) return false;
  return isFlagEnabled(flagName, false);
}

function encode(value) {
  return encodeURIComponent(String(value));
}

async function dbList(pathname) {
  const response = await queryBridge(pathname);
  if (response?.error) {
    throw new Error(`DB list failed for ${pathname}: ${response.error}`);
  }
  return Array.isArray(response?.data) ? response.data : [];
}

async function dbInsert(table, payload) {
  const response = await queryBridge(`/items/${table}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (response?.error) {
    throw new Error(`DB insert failed for ${table}: ${response.error}`);
  }
  const data = response?.data;
  return Array.isArray(data) ? data[0] || null : data || null;
}

async function dbPatch(table, id, payload) {
  const response = await queryBridge(`/items/${table}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (response?.error) {
    throw new Error(`DB patch failed for ${table}/${id}: ${response.error}`);
  }
  const data = response?.data;
  return Array.isArray(data) ? data[0] || null : data || null;
}

async function dbGet(table, id) {
  const response = await queryBridge(`/items/${table}/${id}`);
  if (response?.error) {
    throw new Error(`DB get failed for ${table}/${id}: ${response.error}`);
  }
  return response?.data || null;
}

async function listEventsFromDb(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const verification = normalizeVerification(options.verification, 'verified');
  const sourceTier = normalizeSourceTier(options.source_tier || 'all', 'all');
  const requestedLimit = Math.max(50, Math.min(parseCount(options.limit || 300), 5000));
  const fetchLimit = Math.min(5000, Math.max(requestedLimit * 4, 600));

  const filters = [];
  if (conflict !== 'all') filters.push(`filter[conflict][_eq]=${encode(conflict)}`);
  if (verification !== 'all') filters.push(`filter[verification_status][_eq]=${encode(verification)}`);
  if (sourceTier !== 'all') filters.push(`filter[source_tier][_eq]=${encode(sourceTier)}`);

  const query = `/items/${TABLES.events}?sort=-event_date&limit=${fetchLimit}${filters.length ? `&${filters.join('&')}` : ''}`;
  const rows = await dbList(query);
  const hydrated = rows.map(hydrateEvent);
  return filterEvents(hydrated, options);
}

async function listEventsFromFile(options = {}) {
  const store = await readStore();
  return filterEvents((store.events || []).map(hydrateEvent), options);
}

async function listEvents(options = {}) {
  const includeIdentities = String(options.include_identities || '').toLowerCase() === 'true' || options.include_identities === true;
  try {
    const events = await listEventsFromDb(options);
    return events.map((event) => sanitizeEventForPublic(event, includeIdentities));
  } catch (error) {
    logger.warn({ err: error?.message }, 'Falling back to file-based conflict events store');
    const events = await listEventsFromFile(options);
    return events.map((event) => sanitizeEventForPublic(event, includeIdentities));
  }
}

async function getStats(options = {}) {
  const events = await listEvents({
    ...options,
    include_identities: false,
    limit: Math.min(parseCount(options.limit || 1500), 5000),
  });

  const report = aggregateEvents(events);
  report.comparison = buildComparison(events, options);
  report.filters = {
    conflict: normalizeConflict(options.conflict || 'all'),
    verification: normalizeVerification(options.verification, 'verified'),
    source_tier: normalizeSourceTier(options.source_tier || 'all', 'all'),
    days: parseCount(options.days || 30),
  };
  report.explainability = {
    source_breakdown_available: report.source_breakdown.length > 0,
    note: 'Metrics are aggregated from underlying conflict events with source attribution metadata.',
  };

  return report;
}

function buildConfidenceDistribution(events = []) {
  const buckets = {
    very_low: 0,
    low: 0,
    medium: 0,
    high: 0,
    very_high: 0,
  };

  events.forEach((event) => {
    const confidence = clamp(Number(event.confidence || 0), 0, 1);
    if (confidence < 0.2) buckets.very_low += 1;
    else if (confidence < 0.4) buckets.low += 1;
    else if (confidence < 0.6) buckets.medium += 1;
    else if (confidence < 0.8) buckets.high += 1;
    else buckets.very_high += 1;
  });

  return buckets;
}

function toGapSeverity(score) {
  if (score >= 0.72) return 'high';
  if (score >= 0.42) return 'medium';
  return 'low';
}

function buildIntelGapsFromEvents(events = [], options = {}) {
  const minSignalEvents = Math.max(
    1,
    Math.min(parseCount(options.min_signal_events || INTEL_GAP_DEFAULTS.minSignalEvents), 50)
  );
  const lowVerifiedShare = clamp(
    Number(options.low_verified_share || INTEL_GAP_DEFAULTS.lowVerifiedShare),
    0.05,
    0.98
  );
  const lowConfidence = clamp(
    Number(options.low_confidence || INTEL_GAP_DEFAULTS.lowConfidence),
    0.05,
    0.98
  );
  const staleHours = Math.max(
    1,
    Math.min(parseCount(options.stale_hours || INTEL_GAP_DEFAULTS.staleHours), 720)
  );

  const nowMs = Date.now();
  const dimensions = {
    hit_location: new Map(),
    weapon: new Map(),
    technology: new Map(),
    official_announcement_type: new Map(),
  };

  const registerSignal = (map, signal, event) => {
    const key = String(signal || '').trim();
    if (!key) return;
    const current = map.get(key) || {
      signal: key,
      events: 0,
      verified_events: 0,
      confidence_sum: 0,
      last_seen_ms: 0,
    };
    const confidence = clamp(Number(event.confidence || 0), 0, 1);
    current.events += 1;
    current.verified_events += event.verification_status === 'verified' ? 1 : 0;
    current.confidence_sum += confidence;
    current.last_seen_ms = Math.max(current.last_seen_ms, toDateMs(event.event_date) || 0);
    map.set(key, current);
  };

  events.forEach((event) => {
    ensureArray(event.hit_locations).forEach((signal) => registerSignal(dimensions.hit_location, signal, event));
    ensureArray(event.weapons).forEach((signal) => registerSignal(dimensions.weapon, signal, event));
    ensureArray(event.technologies).forEach((signal) => registerSignal(dimensions.technology, signal, event));
    const eventMetadata = ensureObject(event.metadata);
    const announcementTypes = uniqueStrings([
      ...ensureArray(event.official_announcement_types),
      ...ensureArray(eventMetadata.official_announcement?.type),
    ]);
    announcementTypes.forEach((signal) => registerSignal(dimensions.official_announcement_type, signal, event));
  });

  const items = [];
  const pushGap = (dimension, entry) => {
    if (!entry || entry.events < minSignalEvents) return;

    const verifiedShare = entry.events > 0 ? entry.verified_events / entry.events : 0;
    const avgConfidence = entry.events > 0 ? entry.confidence_sum / entry.events : 0;
    const ageHours = entry.last_seen_ms > 0
      ? Math.max(0, (nowMs - entry.last_seen_ms) / (1000 * 60 * 60))
      : Number.POSITIVE_INFINITY;

    let gapScore = 0;
    const reasons = [];

    if (verifiedShare < lowVerifiedShare) {
      const delta = lowVerifiedShare - verifiedShare;
      gapScore += delta * 1.8;
      reasons.push(`verified-share ${Math.round(verifiedShare * 100)}% below threshold`);
    }
    if (avgConfidence < lowConfidence) {
      const delta = lowConfidence - avgConfidence;
      gapScore += delta * 1.5;
      reasons.push(`average confidence ${avgConfidence.toFixed(2)} below threshold`);
    }
    if (ageHours > staleHours) {
      const staleDelta = Math.min(1.2, (ageHours - staleHours) / Math.max(1, staleHours));
      gapScore += staleDelta * 0.6;
      reasons.push(`signal stale for ${Math.round(ageHours)}h`);
    }

    if (reasons.length === 0) return;

    const normalizedScore = clamp(gapScore, 0, 1);
    items.push({
      gap_type: `${dimension}_coverage_gap`,
      dimension,
      signal: entry.signal,
      severity: toGapSeverity(normalizedScore),
      score: Number(normalizedScore.toFixed(3)),
      event_count: entry.events,
      verified_share: Number(verifiedShare.toFixed(3)),
      average_confidence: Number(avgConfidence.toFixed(3)),
      last_seen_at: entry.last_seen_ms > 0 ? new Date(entry.last_seen_ms).toISOString() : null,
      reasons,
    });
  };

  Object.entries(dimensions).forEach(([dimension, map]) => {
    [...map.values()].forEach((entry) => pushGap(dimension, entry));
  });

  const latestEventMs = events
    .map((event) => toDateMs(event.event_date))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];
  const latestEventAgeHours = Number.isFinite(latestEventMs)
    ? Math.max(0, (nowMs - latestEventMs) / (1000 * 60 * 60))
    : Number.POSITIVE_INFINITY;
  if (latestEventAgeHours > staleHours) {
    const score = clamp(Math.min(1.1, latestEventAgeHours / Math.max(1, staleHours * 2)), 0, 1);
    items.push({
      gap_type: 'event_freshness_gap',
      dimension: 'global',
      signal: normalizeConflict(options.conflict || 'all'),
      severity: toGapSeverity(score),
      score: Number(score.toFixed(3)),
      event_count: events.length,
      verified_share: events.length
        ? Number((events.filter((event) => event.verification_status === 'verified').length / events.length).toFixed(3))
        : 0,
      average_confidence: events.length
        ? Number((events.reduce((acc, event) => acc + Number(event.confidence || 0), 0) / events.length).toFixed(3))
        : 0,
      last_seen_at: Number.isFinite(latestEventMs) ? new Date(latestEventMs).toISOString() : null,
      reasons: [`latest event is ${Math.round(latestEventAgeHours)}h old`],
    });
  }

  return {
    thresholds: {
      min_signal_events: minSignalEvents,
      low_verified_share: lowVerifiedShare,
      low_confidence: lowConfidence,
      stale_hours: staleHours,
    },
    items: items
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.event_count !== a.event_count) return b.event_count - a.event_count;
        return String(a.signal).localeCompare(String(b.signal));
      })
      .slice(0, 120),
  };
}

async function getSignals(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const verification = normalizeVerification(options.verification, 'verified');
  const sourceTier = normalizeSourceTier(options.source_tier || 'all', 'all');
  const days = parseCount(options.days || 30);
  const limit = Math.max(1, Math.min(parseCount(options.limit || 1200), 5000));
  const events = await listEvents({
    conflict,
    verification,
    source_tier: sourceTier,
    days,
    limit,
    include_identities: false,
  });

  const report = aggregateEvents(events);
  const confidenceDistribution = buildConfidenceDistribution(events);
  const verifiedShare = events.length
    ? events.filter((event) => event.verification_status === 'verified').length / events.length
    : 0;
  const averageConfidence = events.length
    ? events.reduce((acc, event) => acc + Number(event.confidence || 0), 0) / events.length
    : 0;

  return {
    generated_at: toIsoDate(new Date()),
    filters: {
      conflict,
      verification,
      source_tier: sourceTier,
      days,
      limit,
    },
    totals: report.totals,
    data_quality: {
      ...report.data_quality,
      verified_share: Number(verifiedShare.toFixed(3)),
      average_confidence: Number(averageConfidence.toFixed(3)),
      confidence_distribution: confidenceDistribution,
    },
    signals: {
      actors: report.actor_comparisons.slice(0, 20),
      locations: report.locations_hit.slice(0, 25),
      weapons: report.weapon_usage.slice(0, 25),
      technologies: report.technology_usage.slice(0, 25),
      official_announcement_types: report.announcement_type_usage.slice(0, 25),
      source_breakdown: report.source_breakdown.slice(0, 20),
    },
    sample_events: events.slice(0, 20).map((event) => ({
      id: event.id,
      event_date: event.event_date,
      conflict: event.conflict,
      source_tier: event.source_tier,
      confidence: Number(event.confidence || 0),
      actors: ensureArray(event.actors).slice(0, 4),
      hit_locations: ensureArray(event.hit_locations).slice(0, 4),
      weapons: ensureArray(event.weapons).slice(0, 4),
      technologies: ensureArray(event.technologies).slice(0, 4),
      official_announcement_types: ensureArray(event.official_announcement_types).slice(0, 4),
      verification_status: event.verification_status,
    })),
  };
}

async function getIntelGaps(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const verification = normalizeVerification(options.verification, 'all');
  const sourceTier = normalizeSourceTier(options.source_tier || 'all', 'all');
  const days = parseCount(options.days || 30);
  const limit = Math.max(1, Math.min(parseCount(options.limit || 1500), 5000));
  const events = await listEvents({
    conflict,
    verification,
    source_tier: sourceTier,
    days,
    limit,
    include_identities: false,
  });

  const gapPayload = buildIntelGapsFromEvents(events, options);

  return {
    generated_at: toIsoDate(new Date()),
    conflict,
    filters: {
      conflict,
      verification,
      source_tier: sourceTier,
      days,
      limit,
    },
    thresholds: gapPayload.thresholds,
    total_gaps: gapPayload.items.length,
    items: gapPayload.items,
  };
}

function withLocationCoordinates(name) {
  if (!name) return null;
  return LOCATION_COORDINATES[name] || null;
}

async function getMonitorLayers(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const verification = normalizeVerification(options.verification, 'verified');
  const sourceTier = normalizeSourceTier(options.source_tier || 'all', 'all');
  const days = parseCount(options.days || 14);
  const limit = Math.max(1, Math.min(parseCount(options.limit || 800), 5000));

  const [events, stats] = await Promise.all([
    listEvents({
      conflict,
      verification,
      source_tier: sourceTier,
      days,
      limit,
      include_identities: false,
    }),
    getStats({
      conflict,
      verification,
      source_tier: sourceTier,
      days,
      limit,
    }),
  ]);

  const eventPoints = events
    .map((event) => {
      const location = ensureArray(event.hit_locations)
        .find((candidate) => withLocationCoordinates(candidate));
      const coords = withLocationCoordinates(location);
      if (!coords) return null;
      return {
        id: event.id,
        event_date: event.event_date,
        conflict: event.conflict,
        location,
        latitude: coords.lat,
        longitude: coords.lng,
        confidence: Number(event.confidence || 0),
        source_tier: event.source_tier || 'other',
        fatalities_total: parseCount(event.fatalities_total),
        injured_total: parseCount(event.injured_total),
        official_announcement_types: ensureArray(event.official_announcement_types).slice(0, 3),
      };
    })
    .filter(Boolean)
    .slice(0, 500);

  const locationIntensity = (stats.locations_hit || [])
    .map((item) => {
      const coords = withLocationCoordinates(item.location);
      if (!coords) return null;
      return {
        location: item.location,
        hits: item.hits,
        latitude: coords.lat,
        longitude: coords.lng,
      };
    })
    .filter(Boolean)
    .slice(0, 100);

  return {
    generated_at: toIsoDate(new Date()),
    conflict,
    filters: {
      verification,
      source_tier: sourceTier,
      days,
      limit,
    },
    layers: {
      event_points: eventPoints,
      location_intensity: locationIntensity,
      official_announcement_ledger: (stats.official_announcements || []).slice(0, 50),
    },
    map_hints: {
      default_center: conflict === 'israel-us-iran'
        ? { latitude: 33.8, longitude: 43.3, zoom: 4.3 }
        : { latitude: 31.5, longitude: 34.7, zoom: 7.8 },
      available_locations: locationIntensity.length,
      unavailable_locations: Math.max(0, (stats.locations_hit || []).length - locationIntensity.length),
    },
  };
}

async function getMonitorNewsDigest(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const verification = normalizeVerification(options.verification, 'verified');
  const sourceTier = normalizeSourceTier(options.source_tier || 'all', 'all');
  const days = parseCount(options.days || 7);
  const limit = Math.max(1, Math.min(parseCount(options.limit || 12), 100));

  const related = await getRelatedNews({
    conflict,
    verification,
    source_tier: sourceTier,
    days,
    limit: Math.max(limit, 12),
  });

  const items = Array.isArray(related.items) ? related.items.slice(0, limit) : [];
  const averageScore = items.length
    ? items.reduce((acc, item) => acc + Number(item.score || 0), 0) / items.length
    : 0;
  const sourceTierBreakdown = items.reduce((acc, item) => {
    const tier = normalizeSourceTier(item.source_tier, 'other');
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  return {
    generated_at: toIsoDate(new Date()),
    conflict,
    digest_text: items.length
      ? items.slice(0, 3).map((item) => item.title).join(' | ')
      : 'No ranked related-news items are currently available for this scope.',
    average_score: Number(averageScore.toFixed(3)),
    source_tier_breakdown: sourceTierBreakdown,
    signals: related.signals || {},
    items,
  };
}

async function getMonitorFreshness(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const days = parseCount(options.days || 14);
  const staleHours = Math.max(1, Math.min(parseCount(options.stale_hours || 18), 240));

  const [events, articles] = await Promise.all([
    listEvents({
      conflict,
      verification: 'all',
      days,
      limit: 2000,
      include_identities: false,
    }),
    contentRepository.getArticles({ limit: 200, status: 'published' }),
  ]);

  const toLatestMs = (list, getter) => (Array.isArray(list) ? list : [])
    .map((item) => toDateMs(getter(item)))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  const nowMs = Date.now();
  const latestEventMs = toLatestMs(events, (event) => event.event_date);
  const latestVerifiedEventMs = toLatestMs(
    events.filter((event) => event.verification_status === 'verified'),
    (event) => event.event_date
  );
  const latestAnnouncementMs = toLatestMs(
    events.filter((event) => String(event.official_announcement_text || '').trim().length > 0),
    (event) => event.event_date
  );
  const latestNewsMs = toLatestMs(articles, (article) => article.published_at || article.date_created);

  const computeAgeHours = (ts) => (Number.isFinite(ts)
    ? Number(((nowMs - ts) / (1000 * 60 * 60)).toFixed(2))
    : null);

  const eventAgeHours = computeAgeHours(latestEventMs);
  const verifiedAgeHours = computeAgeHours(latestVerifiedEventMs);
  const newsAgeHours = computeAgeHours(latestNewsMs);

  const components = [eventAgeHours, verifiedAgeHours, newsAgeHours]
    .filter((value) => typeof value === 'number');
  const avgAge = components.length
    ? components.reduce((acc, value) => acc + value, 0) / components.length
    : staleHours * 2;
  const freshnessScore = Number(clamp(1 - (avgAge / Math.max(1, staleHours * 2)), 0, 1).toFixed(3));

  return {
    generated_at: toIsoDate(new Date()),
    conflict,
    stale_hours_threshold: staleHours,
    freshness_score: freshnessScore,
    status: freshnessScore >= 0.7 ? 'fresh' : freshnessScore >= 0.45 ? 'degrading' : 'stale',
    latest: {
      event_at: Number.isFinite(latestEventMs) ? new Date(latestEventMs).toISOString() : null,
      verified_event_at: Number.isFinite(latestVerifiedEventMs) ? new Date(latestVerifiedEventMs).toISOString() : null,
      official_announcement_at: Number.isFinite(latestAnnouncementMs) ? new Date(latestAnnouncementMs).toISOString() : null,
      news_article_at: Number.isFinite(latestNewsMs) ? new Date(latestNewsMs).toISOString() : null,
    },
    age_hours: {
      event: eventAgeHours,
      verified_event: verifiedAgeHours,
      news_article: newsAgeHours,
    },
  };
}

async function getMonitorSignalsFusion(options = {}) {
  const [signals, gaps, freshness, digest] = await Promise.all([
    getSignals(options),
    getIntelGaps(options),
    getMonitorFreshness(options),
    getMonitorNewsDigest(options),
  ]);

  const highGapCount = gaps.items.filter((item) => item.severity === 'high').length;
  const mediumGapCount = gaps.items.filter((item) => item.severity === 'medium').length;
  const gapPenalty = clamp((highGapCount * 0.18) + (mediumGapCount * 0.08), 0, 0.72);
  const signalStrength = clamp(
    Number(signals.data_quality.verified_share || 0) * 0.45 +
    Number(signals.data_quality.average_confidence || 0) * 0.3 +
    Number(freshness.freshness_score || 0) * 0.25,
    0,
    1
  );
  const digestLift = clamp(Number(digest.average_score || 0) * 0.15, 0, 0.2);
  const fusionScore = Number(clamp(signalStrength - gapPenalty + digestLift, 0, 1).toFixed(3));

  return {
    generated_at: toIsoDate(new Date()),
    conflict: normalizeConflict(options.conflict || 'all'),
    fusion_score: fusionScore,
    confidence_label: fusionScore >= 0.72 ? 'high' : fusionScore >= 0.5 ? 'moderate' : 'low',
    components: {
      signal_strength: Number(signalStrength.toFixed(3)),
      gap_penalty: Number(gapPenalty.toFixed(3)),
      digest_lift: Number(digestLift.toFixed(3)),
      freshness_score: freshness.freshness_score,
    },
    top_gaps: gaps.items.slice(0, 8),
    top_locations: signals.signals.locations.slice(0, 8),
    top_weapons: signals.signals.weapons.slice(0, 8),
    top_technologies: signals.signals.technologies.slice(0, 8),
    digest,
    freshness,
  };
}

async function getMonitorIntelBrief(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const [fusion, forecasts, theories] = await Promise.all([
    getMonitorSignalsFusion(options),
    listForecasts({
      conflict,
      limit: 6,
      include_draft: false,
      verification: 'verified',
      generate_if_missing: false,
    }),
    listTheories({
      conflict,
      limit: 6,
      include_draft: false,
      verification: 'verified',
      generate_if_missing: false,
    }),
  ]);

  const keyFindings = [];
  const primaryGap = fusion.top_gaps[0];
  if (primaryGap) {
    keyFindings.push(`Primary intelligence gap: ${primaryGap.dimension} "${primaryGap.signal}" (${primaryGap.severity}).`);
  }
  const primaryLocation = fusion.top_locations[0];
  if (primaryLocation) {
    keyFindings.push(`Highest monitored location signal: ${primaryLocation.location} (${primaryLocation.hits} hits).`);
  }
  const freshnessStatus = fusion.freshness?.status || 'unknown';
  keyFindings.push(`Freshness status is ${freshnessStatus} with score ${Number(fusion.freshness?.freshness_score || 0).toFixed(2)}.`);

  return {
    generated_at: toIsoDate(new Date()),
    conflict,
    non_deterministic_label: 'Analyst brief is probabilistic and non-deterministic.',
    fusion_score: fusion.fusion_score,
    confidence_label: fusion.confidence_label,
    key_findings: keyFindings,
    recommended_actions: fusion.top_gaps.slice(0, 5).map((gap) => ({
      priority: gap.severity,
      action: `Increase verified coverage for ${gap.dimension} "${gap.signal}"`,
      reason: gap.reasons[0] || 'Coverage threshold not met.',
    })),
    digest_headlines: (fusion.digest?.items || []).slice(0, 5).map((item) => ({
      title: item.title,
      source_name: item.source_name,
      score: item.score,
      published_at: item.published_at,
    })),
    forecasts: (Array.isArray(forecasts) ? forecasts : []).slice(0, 2),
    theories: (Array.isArray(theories) ? theories : []).slice(0, 2).map((item) => ({
      id: item.id,
      thesis: item.thesis,
      confidence: item.confidence,
      uncertainty: item.uncertainty,
      status: item.status,
    })),
  };
}

async function addEvent(eventInput) {
  const event = normalizeEvent(eventInput);

  try {
    const dbPayload = {
      ...event,
      metadata: JSON.stringify(event.metadata || {}),
      actors: JSON.stringify(event.actors || []),
      hit_locations: JSON.stringify(event.hit_locations || []),
      weapons: JSON.stringify(event.weapons || []),
      technologies: JSON.stringify(event.technologies || []),
      official_announcement_types: JSON.stringify(event.official_announcement_types || []),
      identities: JSON.stringify(event.identities || []),
      event_date: event.event_date,
      reported_at: event.reported_at,
      verified_at: event.verified_at,
    };

    if (!isUuid(dbPayload.id)) {
      delete dbPayload.id;
    }

    const created = await dbInsert(TABLES.events, {
      ...dbPayload,
    });
    return hydrateEvent(created || event);
  } catch (error) {
    logger.warn({ err: error?.message }, 'Failed DB insert for conflict event, writing to fallback store');
    const store = await readStore();
    store.events.push(event);
    await writeStore(store);
    return event;
  }
}

async function addEventsBulk(eventInputs = []) {
  const created = [];
  for (const eventInput of eventInputs) {
    const event = await addEvent(eventInput);
    created.push(event);
  }
  return created;
}

async function ingestFromArticles(articles = [], options = {}) {
  const minConfidence = Number.isFinite(Number(options.minConfidence))
    ? clamp(Number(options.minConfidence), 0, 1)
    : 0.35;
  const dryRun = Boolean(options.dryRun);
  const requestedConflict = normalizeConflict(options.conflict || 'all');

  const candidates = articles
    .map(buildEventFromArticle)
    .filter(Boolean)
    .filter((event) => event.confidence >= minConfidence)
    .filter((event) => requestedConflict === 'all' || normalizeConflict(event.conflict) === requestedConflict);

  if (dryRun) {
    return {
      scanned_articles: articles.length,
      candidate_events: candidates.length,
      created_events: 0,
      candidates: candidates.slice(0, 200),
    };
  }

  const existing = await listEvents({
    conflict: requestedConflict,
    verification: 'all',
    days: options.days || 120,
    limit: 5000,
    include_identities: false,
  });
  const existingKeys = new Set(existing.map(eventDedupeKey));
  const deduped = candidates.filter((candidate) => !existingKeys.has(eventDedupeKey(candidate)));

  const created = await addEventsBulk(deduped);

  return {
    scanned_articles: articles.length,
    candidate_events: candidates.length,
    created_events: created.length,
    skipped_duplicates: candidates.length - created.length,
    created_sample: created.slice(0, 100),
  };
}

async function getRelatedNews(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const limit = Math.max(1, Math.min(parseCount(options.limit || 20), 100));

  const events = await listEvents({
    conflict,
    verification: normalizeVerification(options.verification, 'verified'),
    source_tier: normalizeSourceTier(options.source_tier || 'all', 'all'),
    days: parseCount(options.days || 14),
    limit: 400,
    include_identities: false,
  });

  const signals = buildRelatedNewsSignals(events);
  const candidateArticles = await contentRepository.getArticles({
    limit: Math.max(150, limit * 8),
    status: 'published',
  });

  const scored = (Array.isArray(candidateArticles) ? candidateArticles : [])
    .map((article) => scoreRelatedArticle(article, signals, options))
    .filter((item) => item.score >= 0.2)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.tie_breakers.published_ts !== a.tie_breakers.published_ts) {
        return b.tie_breakers.published_ts - a.tie_breakers.published_ts;
      }
      if (b.tie_breakers.tier_rank !== a.tie_breakers.tier_rank) {
        return b.tie_breakers.tier_rank - a.tie_breakers.tier_rank;
      }
      return b.tie_breakers.signal_diversity - a.tie_breakers.signal_diversity;
    })
    .slice(0, limit)
    .map((item) => ({
      id: item.article.id,
      title: item.article.title || 'Untitled',
      summary: item.article.summary || '',
      source_name: item.article.source_name || item.article.source || 'Unknown Source',
      source_url: item.article.source_url || item.article.url || null,
      source_tier: item.source_tier,
      published_at: item.article.published_at || item.article.date_created || null,
      score: item.score,
      explain: item.explain,
    }));

  return {
    conflict,
    total_candidates: scored.length,
    signals,
    items: scored,
  };
}

async function listTheories(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const limit = Math.max(1, Math.min(parseCount(options.limit || 20), 100));
  const includeDraft = Boolean(options.include_draft) || normalizeVerification(options.verification, 'verified') === 'all';

  let rows = [];
  try {
    const filters = [];
    if (conflict !== 'all') filters.push(`filter[conflict][_eq]=${encode(conflict)}`);
    if (!includeDraft) filters.push('filter[status][_eq]=published');

    rows = await dbList(`/items/${TABLES.theories}?sort=-created_at&limit=${Math.max(limit * 2, 40)}${filters.length ? `&${filters.join('&')}` : ''}`);
  } catch (error) {
    logger.warn({ err: error?.message }, 'Failed to query conflict theories');
  }

  let theories = rows.map((row) => ({
    id: row.id,
    conflict: normalizeConflict(row.conflict || 'all'),
    scope_type: normalizeScopeType(row.scope_type || 'conflict'),
    scope_primary: row.scope_primary || '',
    scope_secondary: row.scope_secondary || '',
    thesis: String(row.thesis || ''),
    supporting_evidence: ensureStructuredArray(row.supporting_evidence).map((entry) => {
      if (typeof entry === 'string') return { note: entry };
      return entry;
    }),
    counter_evidence: ensureStructuredArray(row.counter_evidence).map((entry) => {
      if (typeof entry === 'string') return { note: entry };
      return entry;
    }),
    uncertainty: String(row.uncertainty || ''),
    confidence: clamp(Number(row.confidence || 0), 0, 1),
    evidence_count: parseCount(row.evidence_count),
    source_tier_min: normalizeSourceTier(row.source_tier_min || 'other', 'other'),
    status: String(row.status || 'draft'),
    model_version: row.model_version || null,
    model_provider: row.model_provider || null,
    created_at: row.created_at || null,
    published_at: row.published_at || null,
    metadata: ensureObject(row.metadata),
  }));

  if (theories.length === 0 && options.generate_if_missing !== false) {
    const generated = await runTheoryAgent({
      conflict,
      persist: false,
      runType: 'on_demand',
    });
    theories = generated?.items || [];
  }

  return theories.slice(0, limit);
}

async function listForecasts(options = {}) {
  const conflict = normalizeConflict(options.conflict || 'all');
  const limit = Math.max(1, Math.min(parseCount(options.limit || 20), 100));
  const includeDraft = Boolean(options.include_draft) || normalizeVerification(options.verification, 'verified') === 'all';

  let rows = [];
  try {
    const filters = [];
    if (conflict !== 'all') filters.push(`filter[conflict][_eq]=${encode(conflict)}`);
    if (!includeDraft) filters.push('filter[status][_eq]=published');

    rows = await dbList(`/items/${TABLES.forecasts}?sort=-created_at&limit=${Math.max(limit * 2, 40)}${filters.length ? `&${filters.join('&')}` : ''}`);
  } catch (error) {
    logger.warn({ err: error?.message }, 'Failed to query conflict forecasts');
  }

  let forecasts = rows.map((row) => ({
    id: row.id,
    conflict: normalizeConflict(row.conflict || 'all'),
    scope_type: normalizeScopeType(row.scope_type || 'conflict'),
    scope_primary: row.scope_primary || '',
    scope_secondary: row.scope_secondary || '',
    horizon_hours: parseCount(row.horizon_hours),
    scenario_probabilities: normalizeDistribution(ensureObject(row.scenario_probabilities)),
    confidence_band: ensureObject(row.confidence_band),
    calibration_score: clamp(Number(row.calibration_score || 0), 0, 1),
    calibration_note: String(row.calibration_note || ''),
    status: String(row.status || 'draft'),
    model_version: row.model_version || null,
    model_provider: row.model_provider || null,
    created_at: row.created_at || null,
    published_at: row.published_at || null,
    metadata: ensureObject(row.metadata),
  }));

  if (forecasts.length === 0 && options.generate_if_missing !== false) {
    const generated = await runForecastAgent({
      conflict,
      persist: false,
      runType: 'on_demand',
    });
    forecasts = generated?.items || [];
  }

  return forecasts.slice(0, limit);
}

async function listSourceCandidates(options = {}) {
  const limit = Math.max(1, Math.min(parseCount(options.limit || 100), 500));
  const status = String(options.status || 'pending').trim().toLowerCase();

  const filters = [];
  if (status && status !== 'all') {
    filters.push(`filter[status][_eq]=${encode(status)}`);
  }

  let rows = [];
  try {
    rows = await dbList(`/items/${TABLES.candidates}?sort=-discovered_at&limit=${limit}${filters.length ? `&${filters.join('&')}` : ''}`);
  } catch (error) {
    logger.warn({ err: error?.message }, 'Failed to query conflict source candidates');
    return [];
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    source_tier_suggestion: normalizeSourceTier(row.source_tier_suggestion || 'other', 'other'),
    credibility_score: clamp(Number(row.credibility_score || 0), 0, 1),
    relevance_score: clamp(Number(row.relevance_score || 0), 0, 1),
    discovery_method: row.discovery_method || 'agent_scout',
    status: row.status || 'pending',
    notes: row.notes || '',
    discovered_at: row.discovered_at || null,
    reviewed_at: row.reviewed_at || null,
    reviewed_by: row.reviewed_by || null,
    metadata: ensureObject(row.metadata),
  }));
}

async function createSourceCandidate(input = {}) {
  const payload = {
    name: String(input.name || '').trim(),
    url: String(input.url || '').trim(),
    source_tier_suggestion: normalizeSourceTier(input.source_tier_suggestion || 'other', 'other'),
    credibility_score: clamp(parseFloatSafe(input.credibility_score, 0.5), 0, 1),
    relevance_score: clamp(parseFloatSafe(input.relevance_score, 0.5), 0, 1),
    discovery_method: String(input.discovery_method || 'agent_scout').trim(),
    status: String(input.status || 'pending').trim(),
    notes: String(input.notes || '').trim(),
    discovered_at: toIsoDate(input.discovered_at || new Date()),
    metadata: ensureObject(input.metadata),
  };

  if (!payload.name || !payload.url) {
    throw new Error('name and url are required for source candidate');
  }

  const created = await dbInsert(TABLES.candidates, {
    ...payload,
    metadata: JSON.stringify(payload.metadata),
  });

  return {
    ...payload,
    id: created?.id || null,
  };
}

async function reviewSourceCandidate(id, decision, reviewer = 'admin', notes = '') {
  const candidate = await dbGet(TABLES.candidates, id);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  const status = decision === 'approve' ? 'approved' : 'rejected';
  const updated = await dbPatch(TABLES.candidates, id, {
    status,
    reviewed_at: toIsoDate(new Date()),
    reviewed_by: reviewer,
    notes: String(notes || candidate.notes || '').trim(),
  });

  return {
    id,
    status,
    reviewed_by: reviewer,
    reviewed_at: updated?.reviewed_at || toIsoDate(new Date()),
  };
}

async function approveSourceCandidate(id, reviewer, notes) {
  return reviewSourceCandidate(id, 'approve', reviewer, notes);
}

async function rejectSourceCandidate(id, reviewer, notes) {
  return reviewSourceCandidate(id, 'reject', reviewer, notes);
}

async function getReviewQueue(options = {}) {
  const limit = Math.max(1, Math.min(parseCount(options.limit || 100), 500));
  const rows = await listEvents({
    conflict: options.conflict || 'all',
    verification: 'unverified',
    days: options.days || 30,
    limit,
    include_identities: true,
  });

  return rows
    .map((event) => ({
      ...event,
      review_recommendation: ensureObject(event.metadata).verification_suggestion || 'manual_review',
      review_reason_code: ensureObject(event.metadata).verification_reason_code || null,
    }))
    .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0));
}

async function reviewEvent(eventId, payload = {}) {
  const action = String(payload.action || payload.status || '').toLowerCase();
  if (!['verify', 'verified', 'reject', 'rejected'].includes(action)) {
    throw new Error('action must be verify or reject');
  }

  const status = action.startsWith('verify') ? 'verified' : 'rejected';
  const reason = String(payload.reason || '').trim();
  const reviewer = String(payload.reviewer || payload.user || 'admin').trim();

  const event = await dbGet(TABLES.events, eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  const existingMetadata = ensureObject(event.metadata);
  const updated = await dbPatch(TABLES.events, eventId, {
    verification_status: status,
    verification_reason: reason,
    verified_by: reviewer,
    verified_at: toIsoDate(new Date()),
    metadata: JSON.stringify({
      ...existingMetadata,
      reviewed_by_admin: true,
      review_action: status,
      review_reason: reason,
      reviewed_at: toIsoDate(new Date()),
    }),
    date_updated: toIsoDate(new Date()),
  });

  return hydrateEvent(updated || event);
}

async function createAgentRun(agentName, runType, inputPayload = {}) {
  try {
    const created = await dbInsert(TABLES.runs, {
      agent_name: agentName,
      run_type: runType || 'scheduled',
      status: 'running',
      started_at: toIsoDate(new Date()),
      input_payload: JSON.stringify(inputPayload || {}),
      output_payload: JSON.stringify({}),
      decision_trace: JSON.stringify([]),
      model_metadata: JSON.stringify({}),
      metrics: JSON.stringify({}),
    });
    return created?.id || null;
  } catch (error) {
    logger.warn({ err: error?.message, agentName }, 'Failed to create agent run');
    return null;
  }
}

async function finishAgentRun(runId, updates = {}) {
  if (!runId) return;
  try {
    await dbPatch(TABLES.runs, runId, {
      ...updates,
      status: updates.status || 'completed',
      finished_at: updates.finished_at || toIsoDate(new Date()),
      output_payload: JSON.stringify(updates.output_payload || {}),
      decision_trace: JSON.stringify(updates.decision_trace || []),
      model_metadata: JSON.stringify(updates.model_metadata || {}),
      metrics: JSON.stringify(updates.metrics || {}),
    });
  } catch (error) {
    logger.warn({ err: error?.message, runId }, 'Failed to update agent run');
  }
}

async function recordAgentAction(params = {}) {
  const actionType = String(params.action_type || '').trim();
  if (!actionType) return null;

  const allowed = params.allowed !== false;
  try {
    const created = await dbInsert(TABLES.actions, {
      run_id: params.run_id || null,
      incident_id: params.incident_id || null,
      action_type: actionType,
      status: params.status || 'executed',
      allowed,
      reversible: params.reversible !== false,
      details: JSON.stringify(ensureObject(params.details)),
      executed_by: params.executed_by || 'system',
      created_at: toIsoDate(new Date()),
    });
    return created;
  } catch (error) {
    logger.warn({ err: error?.message, actionType }, 'Failed to record agent action');
    return null;
  }
}

async function openIncident(params = {}) {
  const message = String(params.message || '').trim();
  if (!message) return null;

  try {
    const created = await dbInsert(TABLES.incidents, {
      severity: params.severity || 'warning',
      status: params.status || 'open',
      category: params.category || 'pipeline',
      message,
      root_cause_hypothesis: params.root_cause_hypothesis || '',
      source_id: params.source_id || null,
      opened_at: toIsoDate(new Date()),
      last_seen_at: toIsoDate(new Date()),
      metadata: JSON.stringify(ensureObject(params.metadata)),
    });
    return created;
  } catch (error) {
    logger.warn({ err: error?.message }, 'Failed to open incident');
    return null;
  }
}

async function runAgentWithTrace(agentName, runType, input, handler) {
  const runId = await createAgentRun(agentName, runType, input);
  try {
    const result = await handler();
    await finishAgentRun(runId, {
      status: 'completed',
      output_payload: result,
      decision_trace: result?.decision_trace || [],
      model_metadata: result?.model_metadata || {},
      metrics: result?.metrics || {},
    });
    return { run_id: runId, ...result };
  } catch (error) {
    await finishAgentRun(runId, {
      status: 'failed',
      error_message: error.message,
      output_payload: { error: error.message },
      decision_trace: [{ error: error.message }],
    });
    throw error;
  }
}

function createTimeoutError(label, timeoutMs) {
  const error = new Error(`${label} timed out after ${timeoutMs}ms`);
  error.code = 'ETIMEOUT';
  error.timeout_ms = timeoutMs;
  return error;
}

async function runWithTimeout(taskFactory, timeoutMs, label = 'task') {
  const budgetMs = Math.max(1, parseCount(timeoutMs || 0));
  let timedOut = false;
  let timeoutId = null;

  const taskPromise = Promise.resolve().then(taskFactory);
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      reject(createTimeoutError(label, budgetMs));
    }, budgetMs);
  });

  try {
    return await Promise.race([taskPromise, timeoutPromise]);
  } catch (error) {
    if (timedOut) {
      taskPromise.catch((lateError) => {
        logger.warn({ err: lateError?.message, label, timeout_ms: budgetMs }, 'Autonomy task failed after timeout');
      });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runSourceScoutAgent(options = {}) {
  const runType = options.runType || 'scheduled';
  const shadowMode = Boolean(options.shadowMode);

  return runAgentWithTrace(AGENT_NAMES.scout, runType, options, async () => {
    const candidateLimit = Math.max(100, Math.min(parseCount(options.limit || 500), 1000));

    const [articles, rssSources, existingCandidates] = await Promise.all([
      contentRepository.getArticles({ limit: candidateLimit, status: 'published' }),
      queryBridge('/items/rss_sources?limit=500').then((r) => r?.data || []).catch(() => []),
      listSourceCandidates({ status: 'all', limit: 500 }).catch(() => []),
    ]);

    const knownHosts = new Set();
    (Array.isArray(rssSources) ? rssSources : []).forEach((src) => {
      try {
        const host = new URL(src.url).hostname.replace(/^www\./, '');
        knownHosts.add(host);
      } catch {
        // ignore invalid source URL
      }
    });

    (Array.isArray(existingCandidates) ? existingCandidates : []).forEach((candidate) => {
      try {
        const host = new URL(candidate.url).hostname.replace(/^www\./, '');
        knownHosts.add(host);
      } catch {
        // ignore
      }
    });

    const discovered = [];
    const seen = new Set();

    for (const article of (Array.isArray(articles) ? articles : [])) {
      const url = article.source_url || article.url;
      if (!url) continue;

      let host;
      try {
        host = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        continue;
      }

      if (!host || knownHosts.has(host) || seen.has(host)) continue;

      const text = `${article.title || ''} ${article.summary || ''}`.toLowerCase();
      const relevanceHits = Object.values(CONFLICT_KEYWORDS)
        .flat()
        .reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);

      const sourceTier = classifySourceTier(article.source_name, url);
      const relevanceScore = clamp(relevanceHits / 8, 0.15, 0.95);
      const credibilityScore = clamp((SOURCE_TIER_WEIGHTS[sourceTier] || 0.5) * 0.95, 0.2, 0.97);

      const candidate = {
        name: article.source_name || host,
        url,
        source_tier_suggestion: sourceTier,
        credibility_score: Number(credibilityScore.toFixed(3)),
        relevance_score: Number(relevanceScore.toFixed(3)),
        discovery_method: 'source_scout_agent',
        status: 'pending',
        notes: 'Auto-discovered by source scout. Requires admin approval before enabling.',
        metadata: {
          host,
          sample_article_title: article.title || null,
        },
      };

      seen.add(host);
      discovered.push(candidate);
    }

    const queued = [];
    if (!shadowMode) {
      for (const candidate of discovered.slice(0, 50)) {
        try {
          const created = await createSourceCandidate(candidate);
          queued.push(created);
        } catch (error) {
          logger.warn({ err: error?.message, url: candidate.url }, 'Failed to queue source candidate');
        }
      }
    }

    return {
      scanned_articles: (articles || []).length,
      discovered_candidates: discovered.length,
      queued_candidates: queued.length,
      shadow_mode: shadowMode,
      candidates_preview: (shadowMode ? discovered : queued).slice(0, 20),
      decision_trace: [
        { step: 'scan', count: (articles || []).length },
        { step: 'dedupe_known_hosts', known_hosts: knownHosts.size },
        { step: 'queue', queued: queued.length, shadow_mode: shadowMode },
      ],
      metrics: {
        discovered: discovered.length,
        queued: queued.length,
      },
    };
  });
}

async function runIngestionAgent(options = {}) {
  const runType = options.runType || 'scheduled';
  const shadowMode = Boolean(options.shadowMode);
  const dryRun = options.dryRun !== undefined ? Boolean(options.dryRun) : shadowMode;

  return runAgentWithTrace(AGENT_NAMES.ingestion, runType, { ...options, dryRun }, async () => {
    const limit = Math.max(50, Math.min(parseCount(options.limit || 300), 1200));
    const articles = await contentRepository.getArticles({
      limit,
      status: 'published',
    });

    const result = await ingestFromArticles(Array.isArray(articles) ? articles : [], {
      conflict: options.conflict || 'all',
      minConfidence: options.minConfidence || 0.35,
      dryRun,
      days: options.days || 90,
    });

    return {
      ...result,
      shadow_mode: shadowMode,
      dry_run: dryRun,
      decision_trace: [
        { step: 'load_articles', count: (articles || []).length },
        { step: 'extract_conflict_events', candidates: result.candidate_events },
        { step: 'write_or_preview', created: result.created_events, dry_run: dryRun },
      ],
      metrics: {
        scanned_articles: result.scanned_articles,
        created_events: result.created_events,
        skipped_duplicates: result.skipped_duplicates || 0,
      },
    };
  });
}

async function runVerificationAgent(options = {}) {
  const runType = options.runType || 'scheduled';
  const shadowMode = Boolean(options.shadowMode);

  return runAgentWithTrace(AGENT_NAMES.verification, runType, options, async () => {
    const candidates = await listEvents({
      conflict: options.conflict || 'all',
      verification: 'unverified',
      days: options.days || 45,
      limit: Math.max(200, Math.min(parseCount(options.limit || 600), 1500)),
      include_identities: false,
    });

    let suggestedVerify = 0;
    let suggestedReject = 0;
    let unchanged = 0;

    const decisionTrace = [];

    for (const event of candidates.slice(0, 500)) {
      const eventTs = toDateMs(event.event_date) || Date.now();
      const neighborhood = candidates.filter((candidate) => {
        if (candidate.id === event.id) return false;
        if (normalizeConflict(candidate.conflict) !== normalizeConflict(event.conflict)) return false;
        const deltaHours = Math.abs((toDateMs(candidate.event_date) - eventTs) / (1000 * 60 * 60));
        if (deltaHours > 48) return false;
        const sharedLocation = ensureArray(candidate.hit_locations)
          .some((loc) => ensureArray(event.hit_locations).map((v) => v.toLowerCase()).includes(String(loc).toLowerCase()));
        const sharedActor = ensureArray(candidate.actors)
          .some((actor) => ensureArray(event.actors).map((v) => v.toLowerCase()).includes(String(actor).toLowerCase()));
        return sharedLocation || sharedActor;
      });

      const corroborationScore = neighborhood.reduce((acc, candidate) => {
        const tierWeight = SOURCE_TIER_WEIGHTS[normalizeSourceTier(candidate.source_tier, 'other')] || 0.4;
        return acc + tierWeight;
      }, 0);

      let suggestion = 'hold';
      let reasonCode = 'insufficient_signal';

      if (corroborationScore >= 1.8 && Number(event.confidence || 0) >= 0.45) {
        suggestion = 'verify';
        reasonCode = 'cross_source_corroboration';
        suggestedVerify += 1;
      } else if (Number(event.confidence || 0) < 0.22 && corroborationScore < 0.6) {
        suggestion = 'reject';
        reasonCode = 'low_confidence_low_corroboration';
        suggestedReject += 1;
      } else {
        unchanged += 1;
      }

      const metadata = {
        ...ensureObject(event.metadata),
        verification_suggestion: suggestion,
        verification_reason_code: reasonCode,
        verification_checked_at: toIsoDate(new Date()),
        verification_corroboration_score: Number(corroborationScore.toFixed(3)),
      };

      if (!shadowMode) {
        await dbPatch(TABLES.events, event.id, {
          metadata: JSON.stringify(metadata),
          date_updated: toIsoDate(new Date()),
        }).catch((error) => {
          logger.warn({ err: error?.message, eventId: event.id }, 'Failed to persist verification suggestion');
        });
      }

      decisionTrace.push({
        event_id: event.id,
        suggestion,
        reason_code: reasonCode,
        corroboration_score: Number(corroborationScore.toFixed(3)),
      });
    }

    return {
      scanned_events: candidates.length,
      suggested_verify: suggestedVerify,
      suggested_reject: suggestedReject,
      held_for_review: unchanged,
      shadow_mode: shadowMode,
      decision_trace: decisionTrace.slice(0, 100),
      metrics: {
        suggested_verify: suggestedVerify,
        suggested_reject: suggestedReject,
        held: unchanged,
      },
    };
  });
}

async function runTheoryAgent(options = {}) {
  const runType = options.runType || 'scheduled';
  const shadowMode = Boolean(options.shadowMode);
  const persist = options.persist !== false;

  return runAgentWithTrace(AGENT_NAMES.theory, runType, options, async () => {
    const conflict = normalizeConflict(options.conflict || 'all');

    const events = await listEvents({
      conflict,
      verification: 'verified',
      days: options.days || 21,
      limit: 600,
      include_identities: false,
    });

    const stats = aggregateEvents(events);
    const evidence = buildEvidenceFromEvents(events, 8);
    let theory = createDeterministicTheory(conflict, stats, evidence);

    try {
      const aiResult = await aiProviderService.analyzeClaim(
        `Form a cautious conflict operations hypothesis for ${conflict} over the next 24-72 hours.`,
        'auto',
        evidence.map((item) => ({
          source_name: item.source_name,
          title: item.title,
          description: `Fatalities: ${item.fatalities_total}, Injured: ${item.injured_total}`,
          url: item.source_url,
        }))
      );

      if (aiResult && typeof aiResult === 'object') {
        const highTierEvidenceCount = evidence.filter((item) => tierRank(item.source_tier) >= tierRank('major')).length;
        theory = {
          ...theory,
          thesis: String(aiResult.context || aiResult.key_points?.[0] || theory.thesis).slice(0, 1200),
          uncertainty: `Assessment: ${aiResult.assessment || 'mixed'}. ${theory.uncertainty}`.slice(0, 800),
          confidence: clamp(Number(aiResult.confidence_score || theory.confidence), 0.2, 0.9),
          model_provider: aiResult.provider_name || aiResult.provider || 'auto',
          model_version: 'ai-provider-v1',
          metadata: {
            ...theory.metadata,
            provider_assessment: aiResult.assessment || null,
            provider_key_points: ensureArray(aiResult.key_points),
            high_tier_evidence_count: highTierEvidenceCount,
            generated_by: 'ai_provider',
          },
        };
      }
    } catch (error) {
      logger.warn({ err: error?.message }, 'Theory agent AI enrichment failed, using deterministic output');
    }

    const theoryFlag = await isFlagEnabled(FLAGS.theoryPublic, false);
    if (passesTheoryPublishGate(theory) && theoryFlag && !shadowMode) {
      theory.status = 'published';
      theory.published_at = toIsoDate(new Date());
    } else {
      theory.status = 'draft';
    }

    let saved = null;
    if (persist && !shadowMode) {
      saved = await dbInsert(TABLES.theories, {
        ...theory,
        supporting_evidence: JSON.stringify(theory.supporting_evidence || []),
        counter_evidence: JSON.stringify(theory.counter_evidence || []),
        metadata: JSON.stringify(theory.metadata || {}),
        created_at: toIsoDate(new Date()),
      }).catch((error) => {
        logger.warn({ err: error?.message }, 'Failed to persist generated theory');
        return null;
      });
    }

    const item = {
      ...theory,
      id: saved?.id || null,
    };

    return {
      conflict,
      generated: 1,
      published: theory.status === 'published' ? 1 : 0,
      shadow_mode: shadowMode,
      items: [item],
      decision_trace: [
        { step: 'evidence_build', evidence_count: theory.evidence_count },
        { step: 'publish_gate', passed: passesTheoryPublishGate(theory), flag_enabled: theoryFlag },
        { step: 'final_status', status: theory.status },
      ],
      metrics: {
        evidence_count: theory.evidence_count,
        confidence: theory.confidence,
      },
      model_metadata: {
        provider: theory.model_provider,
        version: theory.model_version,
      },
    };
  });
}

async function runForecastAgent(options = {}) {
  const runType = options.runType || 'scheduled';
  const shadowMode = Boolean(options.shadowMode);
  const persist = options.persist !== false;

  return runAgentWithTrace(AGENT_NAMES.forecast, runType, options, async () => {
    const conflict = normalizeConflict(options.conflict || 'all');

    const events = await listEvents({
      conflict,
      verification: 'verified',
      days: options.days || 28,
      limit: 800,
      include_identities: false,
    });

    const calibrationScore = estimateCalibrationScore(events);
    const base24 = deriveScenarioProbabilities(events, 24);
    const base168 = deriveScenarioProbabilities(events, 168);

    let providerName = 'internal';
    let adjustmentFactor = 0;

    try {
      const aiResult = await aiProviderService.analyzeClaim(
        `Estimate directional escalation probabilities for ${conflict} for 24h and 7d horizons.`,
        'auto',
        buildEvidenceFromEvents(events, 6).map((item) => ({
          source_name: item.source_name,
          title: item.title,
          description: `event confidence ${item.confidence}`,
          url: item.source_url,
        }))
      );

      providerName = aiResult?.provider_name || aiResult?.provider || providerName;
      adjustmentFactor = clamp((Number(aiResult?.confidence_score || 0.5) - 0.5) * 0.1, -0.08, 0.08);
    } catch (error) {
      logger.warn({ err: error?.message }, 'Forecast AI enrichment failed, continuing with deterministic model');
    }

    const adjusted24 = normalizeDistribution({
      escalation: base24.escalation + adjustmentFactor,
      stable: base24.stable,
      de_escalation: base24.de_escalation - adjustmentFactor,
    });

    const adjusted168 = normalizeDistribution({
      escalation: base168.escalation + adjustmentFactor * 0.6,
      stable: base168.stable,
      de_escalation: base168.de_escalation - adjustmentFactor * 0.6,
    });

    const confidenceBand = {
      low: Number(clamp(calibrationScore - 0.18, 0.05, 0.95).toFixed(3)),
      high: Number(clamp(calibrationScore + 0.18, 0.1, 0.98).toFixed(3)),
    };

    const templates = [
      {
        conflict,
        scope_type: 'conflict',
        scope_primary: conflict,
        scope_secondary: '',
        horizon_hours: 24,
        scenario_probabilities: adjusted24,
        confidence_band: confidenceBand,
        calibration_score: calibrationScore,
        calibration_note: 'Calibrated from rolling verified-share and confidence signals.',
        status: 'draft',
        model_version: 'forecast-v1',
        model_provider: providerName,
        metadata: {
          generated_at: toIsoDate(new Date()),
          adjustment_factor: Number(adjustmentFactor.toFixed(3)),
        },
      },
      {
        conflict,
        scope_type: 'conflict',
        scope_primary: conflict,
        scope_secondary: '',
        horizon_hours: 168,
        scenario_probabilities: adjusted168,
        confidence_band: confidenceBand,
        calibration_score: calibrationScore,
        calibration_note: 'Calibrated from rolling verified-share and confidence signals.',
        status: 'draft',
        model_version: 'forecast-v1',
        model_provider: providerName,
        metadata: {
          generated_at: toIsoDate(new Date()),
          adjustment_factor: Number((adjustmentFactor * 0.6).toFixed(3)),
        },
      },
    ];

    const forecastFlag = await isFlagEnabled(FLAGS.forecastPublic, false);
    templates.forEach((forecast) => {
      if (passesForecastPublishGate(forecast) && forecastFlag && !shadowMode) {
        forecast.status = 'published';
        forecast.published_at = toIsoDate(new Date());
      }
    });

    const saved = [];
    if (persist && !shadowMode) {
      for (const forecast of templates) {
        const created = await dbInsert(TABLES.forecasts, {
          ...forecast,
          scenario_probabilities: JSON.stringify(forecast.scenario_probabilities),
          confidence_band: JSON.stringify(forecast.confidence_band),
          metadata: JSON.stringify(forecast.metadata || {}),
          created_at: toIsoDate(new Date()),
        }).catch((error) => {
          logger.warn({ err: error?.message }, 'Failed to persist forecast');
          return null;
        });
        if (created) saved.push(created);
      }
    }

    return {
      conflict,
      generated: templates.length,
      published: templates.filter((item) => item.status === 'published').length,
      shadow_mode: shadowMode,
      items: templates.map((item, idx) => ({
        ...item,
        id: saved[idx]?.id || null,
      })),
      decision_trace: [
        { step: 'trend_model', horizons: [24, 168], calibration_score: calibrationScore },
        { step: 'publish_gate', flag_enabled: forecastFlag },
      ],
      metrics: {
        calibration_score: calibrationScore,
      },
      model_metadata: {
        provider: providerName,
        version: 'forecast-v1',
      },
    };
  });
}

async function runReliabilityAgent(options = {}) {
  const runType = options.runType || 'scheduled';
  const shadowMode = Boolean(options.shadowMode);

  return runAgentWithTrace(AGENT_NAMES.reliability, runType, options, async () => {
    const recentRuns = await dbList(`/items/${TABLES.runs}?sort=-started_at&limit=200`).catch(() => []);

    const now = Date.now();
    const lastHourFailures = recentRuns.filter((run) => {
      const started = toDateMs(run.started_at) || 0;
      return run.status === 'failed' && (now - started) <= 60 * 60 * 1000;
    });

    const ingestionFailures = lastHourFailures.filter((run) => run.agent_name === AGENT_NAMES.ingestion);
    const decisionTrace = [];
    const actions = [];
    const freshnessSnapshot = await getMonitorFreshness({
      conflict: options.conflict || 'all',
      days: options.days || 14,
      stale_hours: options.stale_hours || INTEL_GAP_DEFAULTS.staleHours,
    }).catch((error) => {
      logger.warn({ err: error?.message }, 'Reliability agent failed to fetch monitor freshness snapshot');
      return null;
    });
    const gapSnapshot = await getIntelGaps({
      conflict: options.conflict || 'all',
      verification: 'all',
      days: options.days || 21,
      limit: Math.max(600, Math.min(parseCount(options.limit || 1200), 4000)),
    }).catch((error) => {
      logger.warn({ err: error?.message }, 'Reliability agent failed to fetch intel gaps snapshot');
      return { items: [] };
    });
    const highGapCount = (gapSnapshot?.items || []).filter((item) => item.severity === 'high').length;
    const freshnessScore = Number(freshnessSnapshot?.freshness_score || 0);

    decisionTrace.push({
      step: 'monitor_snapshot',
      freshness_score: Number(freshnessScore.toFixed(3)),
      freshness_status: freshnessSnapshot?.status || 'unknown',
      high_gap_count: highGapCount,
      total_gaps: (gapSnapshot?.items || []).length,
    });

    if ((freshnessScore > 0 && freshnessScore < 0.35) || highGapCount >= 4) {
      const incident = await openIncident({
        severity: freshnessScore < 0.2 || highGapCount >= 6 ? 'critical' : 'warning',
        category: 'monitor-freshness',
        message: `Monitor freshness/gap alarm (freshness=${freshnessScore.toFixed(2)}, high_gaps=${highGapCount}).`,
        root_cause_hypothesis: 'Signal freshness or verification coverage degraded.',
        metadata: {
          freshness: freshnessSnapshot,
          top_gaps: (gapSnapshot?.items || []).slice(0, 10),
        },
      });
      if (incident) {
        decisionTrace.push({ step: 'monitor_incident_opened', incident_id: incident.id });
        if (!shadowMode) {
          const action = await recordAgentAction({
            action_type: 'open_incident_record',
            incident_id: incident.id,
            allowed: true,
            reversible: false,
            details: {
              reason: 'monitor_freshness_or_gap_alarm',
              freshness_score: freshnessScore,
              high_gap_count: highGapCount,
            },
          });
          if (action) actions.push(action);
        }
      }
    }

    if (ingestionFailures.length > 0) {
      const incident = await openIncident({
        severity: ingestionFailures.length >= 3 ? 'critical' : 'warning',
        category: 'pipeline',
        message: `Detected ${ingestionFailures.length} ingestion failures in the last hour.`,
        root_cause_hypothesis: 'Upstream source instability or temporary network/API errors.',
        metadata: {
          failed_run_ids: ingestionFailures.map((run) => run.id),
        },
      });

      if (incident) {
        decisionTrace.push({ step: 'incident_opened', incident_id: incident.id });
      }

      if (!shadowMode) {
        if (ALLOWED_AUTO_FIXES.has('retry_ingestion_job')) {
          const retry = await runIngestionAgent({
            runType: 'auto_fix_retry',
            shadowMode: false,
            dryRun: false,
            limit: 120,
            minConfidence: 0.35,
          }).catch((error) => ({ error: error.message }));

          const action = await recordAgentAction({
            action_type: 'retry_ingestion_job',
            run_id: retry?.run_id || null,
            incident_id: incident?.id || null,
            allowed: true,
            reversible: true,
            details: {
              retry_result: retry,
              reason: 'ingestion failure spike',
            },
          });
          if (action) actions.push(action);
          decisionTrace.push({ step: 'auto_fix_retry_ingestion', ok: !retry.error });
        }

        if (ingestionFailures.length >= 3 && ALLOWED_AUTO_FIXES.has('lower_fetch_concurrency')) {
          const action = await recordAgentAction({
            action_type: 'lower_fetch_concurrency',
            incident_id: incident?.id || null,
            allowed: true,
            reversible: true,
            details: {
              previous_concurrency: process.env.INGEST_SOURCE_CONCURRENCY || 'default',
              suggested_concurrency: 2,
              note: 'Operator should apply env/config change if failures persist.',
            },
          });
          if (action) actions.push(action);
          decisionTrace.push({ step: 'auto_fix_lower_concurrency', suggested_concurrency: 2 });
        }
      }
    }

    const openIncidents = await dbList(`/items/${TABLES.incidents}?filter[status][_eq]=open&sort=-opened_at&limit=30`).catch(() => []);
    if (!shadowMode && ingestionFailures.length === 0 && openIncidents.length > 0 && ALLOWED_AUTO_FIXES.has('trigger_backfill_after_recovery')) {
      const backfill = await runIngestionAgent({
        runType: 'auto_fix_backfill',
        shadowMode: false,
        dryRun: false,
        limit: 300,
        minConfidence: 0.32,
      }).catch((error) => ({ error: error.message }));

      const action = await recordAgentAction({
        action_type: 'trigger_backfill_after_recovery',
        run_id: backfill?.run_id || null,
        allowed: true,
        reversible: true,
        details: {
          reason: 'Pipeline appears recovered; running catch-up backfill.',
          backfill_result: backfill,
        },
      });

      if (action) actions.push(action);
      decisionTrace.push({ step: 'auto_fix_backfill_after_recovery', ok: !backfill.error });
    }

    return {
      failed_runs_last_hour: lastHourFailures.length,
      ingestion_failures_last_hour: ingestionFailures.length,
      monitor_freshness_score: Number(freshnessScore.toFixed(3)),
      monitor_high_gap_count: highGapCount,
      open_incidents: openIncidents.length,
      actions_taken: actions.length,
      shadow_mode: shadowMode,
      decision_trace: decisionTrace,
      metrics: {
        failures_last_hour: lastHourFailures.length,
        monitor_freshness_score: Number(freshnessScore.toFixed(3)),
        monitor_high_gap_count: highGapCount,
        actions_taken: actions.length,
      },
    };
  });
}

async function runAutonomousCycle(options = {}) {
  const autonomyEnabled = await isFlagEnabled(FLAGS.autonomy, false);
  if (!autonomyEnabled && !options.force) {
    return {
      enabled: false,
      message: 'Autonomy flag is disabled. Dashboard remains functional in manual mode.',
      timestamp: toIsoDate(new Date()),
    };
  }

  const shadowMode = options.shadowMode !== undefined
    ? Boolean(options.shadowMode)
    : String(process.env.CONFLICT_OPS_SHADOW_MODE || 'true').toLowerCase() !== 'false';

  const envAgentBudgetMs = parseDurationMs(
    process.env.CONFLICT_OPS_AGENT_TIMEOUT_MS,
    AUTONOMY_BUDGET_LIMITS.defaultAgentMs,
    AUTONOMY_BUDGET_LIMITS.minAgentMs,
    AUTONOMY_BUDGET_LIMITS.maxAgentMs
  );
  const envCycleBudgetMs = parseDurationMs(
    process.env.CONFLICT_OPS_CYCLE_TIMEOUT_MS,
    AUTONOMY_BUDGET_LIMITS.defaultCycleMs,
    AUTONOMY_BUDGET_LIMITS.minCycleMs,
    AUTONOMY_BUDGET_LIMITS.maxCycleMs
  );

  const maxAgentMs = parseDurationMs(
    options.maxAgentMs ?? options.max_agent_ms,
    envAgentBudgetMs,
    AUTONOMY_BUDGET_LIMITS.minAgentMs,
    AUTONOMY_BUDGET_LIMITS.maxAgentMs
  );
  const maxCycleMs = parseDurationMs(
    options.maxCycleMs ?? options.max_cycle_ms,
    envCycleBudgetMs,
    AUTONOMY_BUDGET_LIMITS.minCycleMs,
    AUTONOMY_BUDGET_LIMITS.maxCycleMs
  );
  const runType = options.runType || 'scheduled';
  const cycleStartMs = Date.now();

  const summary = {
    enabled: true,
    shadow_mode: shadowMode,
    started_at: toIsoDate(new Date()),
    budgets: {
      max_agent_ms: maxAgentMs,
      max_cycle_ms: maxCycleMs,
    },
    agents: {},
    errors: [],
  };

  const runners = [
    {
      key: 'scout',
      label: AGENT_NAMES.scout,
      run: () => runSourceScoutAgent({ ...options, runType, shadowMode }),
    },
    {
      key: 'ingestion',
      label: AGENT_NAMES.ingestion,
      run: () => runIngestionAgent({ ...options, runType, shadowMode }),
    },
    {
      key: 'verification',
      label: AGENT_NAMES.verification,
      run: () => runVerificationAgent({ ...options, runType, shadowMode }),
    },
    {
      key: 'theory',
      label: AGENT_NAMES.theory,
      run: () => runTheoryAgent({ ...options, runType, shadowMode }),
    },
    {
      key: 'forecast',
      label: AGENT_NAMES.forecast,
      run: () => runForecastAgent({ ...options, runType, shadowMode }),
    },
    {
      key: 'reliability',
      label: AGENT_NAMES.reliability,
      run: () => runReliabilityAgent({ ...options, runType, shadowMode }),
    },
  ];

  for (let idx = 0; idx < runners.length; idx += 1) {
    const runner = runners[idx];
    const elapsedMs = Date.now() - cycleStartMs;
    const remainingMs = maxCycleMs - elapsedMs;

    if (remainingMs <= 0) {
      const message = `Autonomy cycle timed out before ${runner.label}`;
      summary.errors.push(message);
      for (let skipIdx = idx; skipIdx < runners.length; skipIdx += 1) {
        summary.agents[runners[skipIdx].key] = {
          skipped: true,
          reason: 'cycle_timeout',
          message,
        };
      }
      break;
    }

    const agentBudgetMs = Math.max(
      AUTONOMY_BUDGET_LIMITS.minAgentMs,
      Math.min(maxAgentMs, remainingMs)
    );

    try {
      const result = await runWithTimeout(runner.run, agentBudgetMs, runner.label);
      summary.agents[runner.key] = result;
    } catch (error) {
      const isTimeout = error?.code === 'ETIMEOUT';
      const message = isTimeout
        ? `${runner.label} timed out after ${agentBudgetMs}ms`
        : (error?.message || `Autonomy step failed for ${runner.label}`);
      summary.errors.push(message);
      summary.agents[runner.key] = {
        error: message,
        timed_out: isTimeout,
        timeout_ms: isTimeout ? agentBudgetMs : undefined,
      };
      logger.error({ err: error, agent: runner.label, timeout_ms: agentBudgetMs, is_timeout: isTimeout }, 'Conflict autonomous cycle step failed');
    }
  }

  summary.finished_at = toIsoDate(new Date());
  summary.duration_ms = Date.now() - cycleStartMs;
  summary.timeout_count = Object.values(summary.agents)
    .filter((entry) => entry && entry.timed_out)
    .length;
  summary.ok = summary.errors.length === 0;
  return summary;
}

function isStaleRunningRun(run, staleAfterMs, nowMs = Date.now()) {
  if (String(run?.status || '').toLowerCase() !== 'running') return false;
  const startedMs = toDateMs(run?.started_at || run?.created_at || run?.updated_at);
  if (!Number.isFinite(startedMs)) return false;
  return (nowMs - startedMs) >= staleAfterMs;
}

async function reconcileStaleRunningAgentRuns(options = {}) {
  const envStaleMs = parseDurationMs(
    process.env.CONFLICT_OPS_STALE_RUN_MS,
    STALE_AGENT_RUN_LIMITS.defaultMs,
    STALE_AGENT_RUN_LIMITS.minMs,
    STALE_AGENT_RUN_LIMITS.maxMs
  );

  const requestedByMinutes = parseCount(options.stale_after_minutes);
  const requestedMs = requestedByMinutes > 0
    ? requestedByMinutes * 60 * 1000
    : options.stale_after_ms;

  const staleAfterMs = parseDurationMs(
    requestedMs,
    envStaleMs,
    STALE_AGENT_RUN_LIMITS.minMs,
    STALE_AGENT_RUN_LIMITS.maxMs
  );

  const limit = Math.max(
    1,
    Math.min(parseCount(options.limit || STALE_AGENT_RUN_LIMITS.defaultLimit), STALE_AGENT_RUN_LIMITS.maxLimit)
  );
  const dryRun = Boolean(options.dry_run || options.dryRun);
  const nowMs = Date.now();

  const runningRuns = await dbList(`/items/${TABLES.runs}?filter[status][_eq]=running&sort=started_at&limit=${limit}`);

  const staleRuns = (Array.isArray(runningRuns) ? runningRuns : [])
    .filter((run) => isStaleRunningRun(run, staleAfterMs, nowMs));
  const staleIds = staleRuns
    .map((run) => run.id)
    .filter((id) => typeof id === 'string' && id.length > 0);

  if (!dryRun) {
    for (const run of staleRuns) {
      const startedMs = toDateMs(run.started_at || run.created_at || run.updated_at);
      const ageMs = Number.isFinite(startedMs) ? Math.max(0, nowMs - startedMs) : null;
      const reason = `Marked stale after exceeding ${Math.round(staleAfterMs / 60000)} minutes without completion`;

      try {
        await dbPatch(TABLES.runs, run.id, {
          status: 'failed',
          finished_at: toIsoDate(new Date()),
          error_message: reason,
          output_payload: JSON.stringify({ error: reason, stale_reconciliation: true }),
          decision_trace: JSON.stringify([{
            step: 'stale_run_reconciliation',
            reason: 'status_running_beyond_threshold',
            stale_after_ms: staleAfterMs,
            age_ms: ageMs,
          }]),
          metrics: JSON.stringify({
            stale_reconciliation: true,
            stale_after_ms: staleAfterMs,
            age_ms: ageMs,
          }),
        });
      } catch (error) {
        logger.warn({ err: error?.message, runId: run.id }, 'Failed to reconcile stale running run');
      }
    }
  }

  return {
    scanned_running_runs: (Array.isArray(runningRuns) ? runningRuns : []).length,
    stale_after_ms: staleAfterMs,
    stale_candidates: staleIds.length,
    reconciled_runs: dryRun ? 0 : staleIds.length,
    dry_run: dryRun,
    reconciled_run_ids: staleIds.slice(0, 200),
  };
}

async function getAutonomyStatus() {
  const [runs, incidents, actions, flags] = await Promise.all([
    dbList(`/items/${TABLES.runs}?sort=-started_at&limit=200`).catch(() => []),
    dbList(`/items/${TABLES.incidents}?sort=-opened_at&limit=100`).catch(() => []),
    dbList(`/items/${TABLES.actions}?sort=-created_at&limit=200`).catch(() => []),
    getFlagsMap().catch(() => ({})),
  ]);

  const byAgent = {};
  runs.forEach((run) => {
    const key = run.agent_name || 'unknown-agent';
    if (!byAgent[key]) {
      byAgent[key] = {
        last_run_at: run.started_at || null,
        last_status: run.status || 'unknown',
        failures: 0,
        successes: 0,
      };
    }

    if (run.status === 'failed') byAgent[key].failures += 1;
    if (run.status === 'completed') byAgent[key].successes += 1;
  });

  const openIncidents = incidents.filter((incident) => incident.status === 'open');
  const actionSummary = actions.reduce((acc, action) => {
    const key = action.action_type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const toDayKey = (value) => {
    const iso = toIsoDate(value);
    return iso.slice(0, 10);
  };

  const buildWindowDays = (days) => {
    const result = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      result.push(d.toISOString().slice(0, 10));
    }
    return result;
  };

  const runTrendByDay = new Map();
  runs.forEach((run) => {
    const day = toDayKey(run.started_at || run.finished_at || new Date());
    const entry = runTrendByDay.get(day) || {
      date: day,
      total: 0,
      completed: 0,
      failed: 0,
      running: 0,
      other: 0,
    };

    entry.total += 1;
    const status = String(run.status || '').toLowerCase();
    if (status === 'completed') entry.completed += 1;
    else if (status === 'failed') entry.failed += 1;
    else if (status === 'running') entry.running += 1;
    else entry.other += 1;
    runTrendByDay.set(day, entry);
  });

  const incidentTrendByDay = new Map();
  incidents.forEach((incident) => {
    const day = toDayKey(incident.opened_at || incident.last_seen_at || new Date());
    const entry = incidentTrendByDay.get(day) || {
      date: day,
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      open: 0,
      resolved: 0,
    };

    entry.total += 1;
    const severity = String(incident.severity || '').toLowerCase();
    if (severity === 'critical') entry.critical += 1;
    else if (severity === 'warning') entry.warning += 1;
    else entry.info += 1;

    if (String(incident.status || '').toLowerCase() === 'open') entry.open += 1;
    else entry.resolved += 1;
    incidentTrendByDay.set(day, entry);
  });

  const actionTrendByDay = new Map();
  actions.forEach((action) => {
    const day = toDayKey(action.created_at || new Date());
    const entry = actionTrendByDay.get(day) || {
      date: day,
      total: 0,
      allowed: 0,
      blocked: 0,
    };
    entry.total += 1;
    if (action.allowed === false) entry.blocked += 1;
    else entry.allowed += 1;
    actionTrendByDay.set(day, entry);
  });

  const windowDays = buildWindowDays(14);
  const runTrend = windowDays.map((day) => runTrendByDay.get(day) || {
    date: day,
    total: 0,
    completed: 0,
    failed: 0,
    running: 0,
    other: 0,
  });

  const incidentTrend = windowDays.map((day) => incidentTrendByDay.get(day) || {
    date: day,
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    open: 0,
    resolved: 0,
  });

  const actionTrend = windowDays.map((day) => actionTrendByDay.get(day) || {
    date: day,
    total: 0,
    allowed: 0,
    blocked: 0,
  });

  const runOutcomes = {
    total: runs.length,
    completed: runs.filter((run) => String(run.status || '').toLowerCase() === 'completed').length,
    failed: runs.filter((run) => String(run.status || '').toLowerCase() === 'failed').length,
    running: runs.filter((run) => String(run.status || '').toLowerCase() === 'running').length,
  };

  const staleThresholdMs = parseDurationMs(
    process.env.CONFLICT_OPS_STALE_RUN_MS,
    STALE_AGENT_RUN_LIMITS.defaultMs,
    STALE_AGENT_RUN_LIMITS.minMs,
    STALE_AGENT_RUN_LIMITS.maxMs
  );
  const staleRunningCount = runs.filter((run) => isStaleRunningRun(run, staleThresholdMs)).length;

  return {
    enabled: Boolean(flags[FLAGS.autonomy]),
    shadow_mode: String(process.env.CONFLICT_OPS_SHADOW_MODE || 'true').toLowerCase() !== 'false',
    flags: {
      [FLAGS.dashboard]: Boolean(flags[FLAGS.dashboard]),
      [FLAGS.autonomy]: Boolean(flags[FLAGS.autonomy]),
      [FLAGS.theoryPublic]: Boolean(flags[FLAGS.theoryPublic]),
      [FLAGS.forecastPublic]: Boolean(flags[FLAGS.forecastPublic]),
    },
    agent_health: byAgent,
    incidents: {
      open: openIncidents.length,
      recent: incidents.slice(0, 20).map((incident) => ({
        id: incident.id,
        severity: incident.severity,
        category: incident.category,
        message: incident.message,
        status: incident.status,
        opened_at: incident.opened_at,
      })),
    },
    run_outcomes: runOutcomes,
    stale_running_runs: {
      count: staleRunningCount,
      threshold_ms: staleThresholdMs,
      threshold_minutes: Math.round(staleThresholdMs / 60000),
    },
    run_trend: runTrend,
    incident_trend: incidentTrend,
    action_trend: actionTrend,
    action_summaries: actionSummary,
    allowed_auto_fixes: [...ALLOWED_AUTO_FIXES],
    disallowed_auto_fixes: [
      'edit_application_code',
      'change_db_schema',
      'change_auth_policy',
      'enable_new_source_without_approval',
      'publish_unverified_identities',
    ],
  };
}

module.exports = {
  listEvents,
  getStats,
  getSignals,
  getIntelGaps,
  getMonitorLayers,
  getMonitorNewsDigest,
  getMonitorSignalsFusion,
  getMonitorFreshness,
  getMonitorIntelBrief,
  addEvent,
  addEventsBulk,
  ingestFromArticles,
  getRelatedNews,
  listForecasts,
  listTheories,
  getAutonomyStatus,
  listSourceCandidates,
  createSourceCandidate,
  approveSourceCandidate,
  rejectSourceCandidate,
  getReviewQueue,
  reviewEvent,
  runAutonomousCycle,
  reconcileStaleRunningAgentRuns,
  runSourceScoutAgent,
  runIngestionAgent,
  runVerificationAgent,
  runTheoryAgent,
  runForecastAgent,
  runReliabilityAgent,
  isFlagEnabled,
  isPublicAnalyticsExposureEnabled,
  // test exports
  __testables: {
    normalizeConflict,
    normalizeEvent,
    inferConflict,
    buildEventFromArticle,
    extractHitLocations,
    extractIdentitiesFromText,
    classifyOfficialAnnouncement,
    aggregateEvents,
    filterEvents,
    eventDedupeKey,
    buildComparison,
    deriveScenarioProbabilities,
    estimateCalibrationScore,
    buildIntelGapsFromEvents,
    buildConfidenceDistribution,
    buildRelatedNewsSignals,
    scoreRelatedArticle,
    getPublicArtifactFlag,
    parseDurationMs,
    runWithTimeout,
    isStaleRunningRun,
  },
};
