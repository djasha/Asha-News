import type { HomeSnapshotMC, SeverityLevel } from './types';

export type MapSignalCategoryMC =
  | 'hotspot'
  | 'weather'
  | 'cyber'
  | 'maritime'
  | 'flight'
  | 'economic';

export type MapFocusClusterMC = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  signalCount: number;
  summary: string;
};

type ActiveSignal = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  category: MapSignalCategoryMC;
  rank: number;
};

const SEVERITY_SCORE: Record<SeverityLevel, number> = {
  CRITICAL: 4,
  HIGH: 3,
  ELEVATED: 2,
  INFO: 1,
};

const CATEGORY_WEIGHT: Record<MapSignalCategoryMC, number> = {
  hotspot: 1.4,
  maritime: 1.15,
  weather: 1,
  cyber: 0.95,
  economic: 0.88,
  flight: 0.72,
};

const CATEGORY_LABEL: Record<MapSignalCategoryMC, string> = {
  hotspot: 'hotspots',
  maritime: 'maritime',
  weather: 'weather',
  cyber: 'cyber',
  economic: 'econ',
  flight: 'flight',
};

const GENERIC_SIGNAL_LABELS = new Set([
  'cyber threat cluster',
  'weather alert',
  'verified hotspot',
  'economic shock',
  'flight track',
]);

const SIGNAL_LABEL_ALIASES: Record<string, string> = {
  middleeast: 'Middle East',
};

function isDerivedSourceTier(sourceTier: string): boolean {
  return sourceTier.startsWith('derived-');
}

function hasOfficialSignal(sourceTier: string, officialAnnouncementTypes?: string[]): boolean {
  if (Array.isArray(officialAnnouncementTypes) && officialAnnouncementTypes.length > 0) return true;
  return /(official|verified|trusted|curated)/i.test(sourceTier);
}

export function severityFromMapPoint(point: {
  fatalities_total?: number;
  injured_total?: number;
  confidence?: number;
  source_tier?: string;
  official_announcement_types?: string[];
}): SeverityLevel {
  const fatalities = Number(point.fatalities_total || 0);
  const injured = Number(point.injured_total || 0);
  const confidence = Number(point.confidence || 0);
  const sourceTier = String(point.source_tier || '').toLowerCase();
  const derived = isDerivedSourceTier(sourceTier);
  const official = hasOfficialSignal(sourceTier, point.official_announcement_types);

  if (fatalities >= 20 || injured >= 60) return 'CRITICAL';
  if (fatalities >= 5 || injured >= 20) return 'HIGH';
  if (official && confidence >= 0.9) return 'CRITICAL';
  if ((official || !derived) && confidence >= 0.78) return 'HIGH';
  if (confidence >= (derived ? 0.55 : 0.42)) return 'ELEVATED';
  return 'INFO';
}

function normalizeFeedSeverity(level: string | null | undefined, fallback: SeverityLevel = 'ELEVATED'): SeverityLevel {
  const value = String(level || '').toUpperCase();
  if (value === 'CRITICAL') return 'CRITICAL';
  if (value === 'HIGH') return 'HIGH';
  if (value === 'ELEVATED') return 'ELEVATED';
  return fallback;
}

function inferRegionLabel(latitude: number, longitude: number): string {
  if (latitude >= 24 && latitude <= 42 && longitude >= 25 && longitude <= 52) return 'Levant';
  if (latitude >= 35 && latitude <= 62 && longitude >= -10 && longitude <= 40) return 'Europe';
  if (latitude >= 8 && latitude <= 34 && longitude >= 42 && longitude <= 67) return 'Arabian Sea';
  if (latitude >= -5 && latitude <= 24 && longitude >= 32 && longitude <= 54) return 'Red Sea Arc';
  if (latitude >= 18 && latitude <= 52 && longitude >= 95 && longitude <= 150) return 'East Asia';
  if (latitude >= -45 && latitude <= 12 && longitude >= 105 && longitude <= 178) return 'Pacific Rim';
  if (latitude >= -35 && latitude <= 10 && longitude >= -84 && longitude <= -34) return 'South America';
  if (latitude >= 12 && latitude <= 60 && longitude >= -135 && longitude <= -52) return 'North America';
  if (latitude >= -35 && latitude <= 20 && longitude >= 10 && longitude <= 42) return 'Africa';
  if (latitude >= 5 && latitude <= 38 && longitude >= 62 && longitude <= 92) return 'South Asia';
  return latitude >= 0 ? 'Northern Watch' : 'Southern Watch';
}

function resolveClusterLabel(signal: ActiveSignal, latitude: number, longitude: number): string {
  const label = String(signal.label || '').trim();
  if (!label) return inferRegionLabel(latitude, longitude);
  const normalizedLabel = SIGNAL_LABEL_ALIASES[label.toLowerCase()];
  if (normalizedLabel) return normalizedLabel;
  if (GENERIC_SIGNAL_LABELS.has(label.toLowerCase())) {
    return inferRegionLabel(latitude, longitude);
  }
  return label;
}

function buildClusterKey(latitude: number, longitude: number, zoom: number): string {
  const latStep = zoom <= 4.6 ? 11 : zoom <= 5.5 ? 8 : 5;
  const lonStep = zoom <= 4.6 ? 14 : zoom <= 5.5 ? 10 : 6;
  const latBucket = Math.round(latitude / latStep);
  const lonBucket = Math.round(longitude / lonStep);
  return `${latBucket}:${lonBucket}`;
}

function summarizeCluster(counts: Partial<Record<MapSignalCategoryMC, number>>, totalSignals: number): string {
  const topGroups = Object.entries(counts)
    .filter((entry): entry is [MapSignalCategoryMC, number] => Number(entry[1] || 0) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 2)
    .map(([category, count]) => `${count} ${CATEGORY_LABEL[category]}`);

  if (!topGroups.length) return `${totalSignals} signals`;
  return topGroups.join(' · ');
}

export function buildMapFocusClusters(
  home: HomeSnapshotMC,
  activeLayers: Set<string>,
  severityFilter: string,
  zoom: number,
  compact = false
): MapFocusClusterMC[] {
  const signals: ActiveSignal[] = [];

  if (activeLayers.has('verified-hotspots')) {
    home.map.event_points.forEach((point) => {
      const severity = severityFromMapPoint(point);
      if (severityFilter !== 'ALL' && severity !== severityFilter) return;
      signals.push({
        id: `event-${point.id}`,
        label: point.location,
        latitude: Number(point.latitude),
        longitude: Number(point.longitude),
        severity,
        category: 'hotspot',
        rank: (SEVERITY_SCORE[severity] || 1) * CATEGORY_WEIGHT.hotspot + Number(point.confidence || 0),
      });
    });
  }

  if (activeLayers.has('weather-alerts')) {
    home.map.optional_feeds.weather_alerts.forEach((item) => {
      const severity = normalizeFeedSeverity(item.level);
      signals.push({
        id: `weather-${item.id}`,
        label: item.event,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        severity,
        category: 'weather',
        rank: (SEVERITY_SCORE[severity] || 1) * CATEGORY_WEIGHT.weather,
      });
    });
  }

  if (activeLayers.has('maritime-risk')) {
    home.map.optional_feeds.maritime_risk.forEach((item) => {
      const severity = Number(item.risk || 0) >= 0.76 ? 'HIGH' : 'ELEVATED';
      signals.push({
        id: `maritime-${item.id}`,
        label: item.corridor,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        severity,
        category: 'maritime',
        rank: (SEVERITY_SCORE[severity] || 1) * CATEGORY_WEIGHT.maritime + Number(item.risk || 0),
      });
    });
  }

  if (activeLayers.has('cyber-comms')) {
    home.map.optional_feeds.cyber_comms.forEach((item) => {
      const severity = Number(item.confidence || 0) >= 0.82 ? 'ELEVATED' : 'INFO';
      signals.push({
        id: `cyber-${item.id}`,
        label: item.impact,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        severity,
        category: 'cyber',
        rank: (SEVERITY_SCORE[severity] || 1) * CATEGORY_WEIGHT.cyber + Number(item.confidence || 0),
      });
    });
  }

  if (activeLayers.has('economic-shocks')) {
    home.map.optional_feeds.economic_shocks.forEach((item) => {
      const severity = Number(item.intensity || 0) >= 0.72 ? 'HIGH' : 'ELEVATED';
      signals.push({
        id: `economic-${item.id}`,
        label: 'Economic shock',
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        severity,
        category: 'economic',
        rank: (SEVERITY_SCORE[severity] || 1) * CATEGORY_WEIGHT.economic + Number(item.intensity || 0),
      });
    });
  }

  if (activeLayers.has('flight-radar')) {
    home.map.optional_feeds.flight_radar.slice(0, compact ? 18 : 30).forEach((item) => {
      signals.push({
        id: `flight-${item.id}`,
        label: item.callsign,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        severity: 'INFO',
        category: 'flight',
        rank: CATEGORY_WEIGHT.flight,
      });
    });
  }

  const buckets = new Map<
    string,
    {
      latitudeSum: number;
      longitudeSum: number;
      signalCount: number;
      rank: number;
      signals: ActiveSignal[];
      counts: Partial<Record<MapSignalCategoryMC, number>>;
    }
  >();

  signals.forEach((signal) => {
    if (!Number.isFinite(signal.latitude) || !Number.isFinite(signal.longitude)) return;
    const key = buildClusterKey(signal.latitude, signal.longitude, zoom);
    const bucket = buckets.get(key) || {
      latitudeSum: 0,
      longitudeSum: 0,
      signalCount: 0,
      rank: 0,
      signals: [],
      counts: {},
    };
    bucket.latitudeSum += signal.latitude;
    bucket.longitudeSum += signal.longitude;
    bucket.signalCount += 1;
    bucket.rank += signal.rank;
    bucket.signals.push(signal);
    bucket.counts[signal.category] = Number(bucket.counts[signal.category] || 0) + 1;
    buckets.set(key, bucket);
  });

  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const latitude = bucket.latitudeSum / bucket.signalCount;
      const longitude = bucket.longitudeSum / bucket.signalCount;
      const strongestSignal = [...bucket.signals].sort((a, b) => b.rank - a.rank)[0];
      const severity = bucket.signals.reduce<SeverityLevel>((current, signal) => {
        return (SEVERITY_SCORE[signal.severity] || 0) > (SEVERITY_SCORE[current] || 0) ? signal.severity : current;
      }, 'INFO');

      return {
        id: `focus-${key}`,
        label: resolveClusterLabel(strongestSignal, latitude, longitude),
        latitude,
        longitude,
        severity,
        signalCount: bucket.signalCount,
        summary: summarizeCluster(bucket.counts, bucket.signalCount),
        rank: bucket.rank + bucket.signalCount * 0.35,
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, compact ? 3 : 4)
    .map(({ rank: _rank, ...cluster }) => cluster);
}
