const COORDINATE_LABEL_PATTERN = /^\s*-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?\s*$/;

const SIGNAL_LABEL_MAP: Record<string, string> = {
  anomaly_type_warm: 'Heat anomaly',
  anomaly_type_cold: 'Cold anomaly',
  anomaly_type_precip: 'Rain anomaly',
  anomaly_type_precipitation: 'Rain anomaly',
  anomaly_type_dry: 'Dry anomaly',
  anomaly_type_fire: 'Fire anomaly',
  anomaly_type_wildfire: 'Wildfire risk',
  anomaly_type_smoke: 'Smoke anomaly',
  anomaly_type_storm: 'Storm anomaly',
  anomaly_type_flood: 'Flood anomaly',
  anomaly_type_dust: 'Dust anomaly',
  anomaly_type_ash: 'Ash anomaly',
  'wx:thunderstorms': 'Thunderstorms',
  'wx:thunderstorm': 'Thunderstorm',
  'snow or ice': 'Winter weather',
  weather: 'Weather alert',
  'weather conditions': 'Weather alert',
  cyber: 'Cyber signal',
  economics: 'Economic signal',
  economic: 'Economic signal',
  maritime: 'Maritime risk',
  conflict: 'Conflict zone',
  geopolitics: 'Geopolitics watch',
  osint: 'Signal',
  breaking: 'Signal',
  general: 'Signal',
  cobaltstrike: 'Cyber threat cluster',
  'cyber threat cluster': 'Cyber threat cluster',
  'unknown location': 'Signal',
  unknown: 'Signal',
};

const UPPERCASE_WORDS = new Set(['ai', 'eu', 'uk', 'un', 'usa', 'uae', 'us']);

function toTitleCaseWords(value: string): string {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const normalized = part.toLowerCase();
      if (UPPERCASE_WORDS.has(normalized)) return normalized.toUpperCase();
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(' ');
}

export function isCoordinateLabel(value: unknown): boolean {
  return COORDINATE_LABEL_PATTERN.test(String(value || '').trim());
}

function normalizeFallbackLabel(fallback: string): string {
  const raw = String(fallback || '').trim();
  if (!raw) return 'Signal';

  const normalized = raw.toLowerCase();
  const mapped = SIGNAL_LABEL_MAP[normalized];
  if (mapped) return mapped === 'Signal' ? 'Signal' : mapped;
  if (isCoordinateLabel(raw)) return 'Signal';

  if (/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i.test(raw)) {
    return toTitleCaseWords(raw.replace(/[_-]+/g, ' '));
  }

  return raw;
}

export function formatSignalLabel(value: unknown, fallback = 'Signal'): string {
  const raw = String(value || '').trim();
  const normalizedFallback = normalizeFallbackLabel(fallback);
  if (!raw) return normalizedFallback;
  if (isCoordinateLabel(raw)) return normalizedFallback;

  const normalized = raw.toLowerCase();
  const mapped = SIGNAL_LABEL_MAP[normalized];
  if (mapped) {
    return mapped === 'Signal' ? normalizedFallback : mapped;
  }

  if (normalized.startsWith('anomaly_type_')) {
    const suffix = normalized.replace('anomaly_type_', '').replace(/[_-]+/g, ' ').trim();
    if (!suffix) return 'Climate anomaly';
    if (suffix.includes('warm')) return 'Heat anomaly';
    if (suffix.includes('cold')) return 'Cold anomaly';
    if (suffix.includes('precip')) return 'Rain anomaly';
    if (suffix.includes('wildfire') || suffix.includes('fire')) return 'Wildfire risk';
    if (suffix.includes('storm')) return 'Storm anomaly';
    if (suffix.includes('flood')) return 'Flood anomaly';
    return `${toTitleCaseWords(suffix)} anomaly`;
  }

  if (normalized.startsWith('wx:')) {
    const suffix = normalized.replace(/^wx:/, '').replace(/[_-]+/g, ' ').trim();
    return suffix ? toTitleCaseWords(suffix) : normalizedFallback;
  }

  if (/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i.test(raw)) {
    return toTitleCaseWords(raw.replace(/[_-]+/g, ' '));
  }

  return raw;
}

export function formatLocationDisplay(value: unknown, fallback = 'Signal'): string {
  const label = formatSignalLabel(value, fallback);
  const normalized = String(label || '').trim().toLowerCase();
  if (!normalized || normalized === 'unknown' || normalized === 'unknown location') {
    return fallback;
  }
  return label;
}
