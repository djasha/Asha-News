import { useMemo } from 'react';
import { ColumnLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { DeckGL } from '@deck.gl/react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

import type { HomeSnapshotMC, MapFallbackSignalMC, MissionAccentTheme, SeverityLevel } from './types';
import { formatLocationDisplay, formatSignalLabel } from './labelUtils';
import { buildMapFocusClusters, severityFromMapPoint } from './mapUtils';
import { resolveMissionControlMapStyle } from './mapStyle';

type ViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

type LayerVisibilityProfile = {
  showFocusClusters: boolean;
  hotspotCap: number;
  showInfrastructure: boolean;
  infrastructureCap: number;
  showWeather: boolean;
  weatherCap: number;
  showFlights: boolean;
  flightCap: number;
  showMaritime: boolean;
  maritimeCap: number;
  showCyber: boolean;
  cyberCap: number;
  showEconomic: boolean;
  economicCap: number;
};

type MapCanvasProps = {
  home: HomeSnapshotMC;
  compact?: boolean;
  isMobile?: boolean;
  accentTheme: MissionAccentTheme;
  activeLayers: Set<string>;
  severityFilter: string;
  fallbackSignals?: MapFallbackSignalMC[];
  viewState: ViewState;
  deckUnavailable: boolean;
  onDeckUnavailable: () => void;
  onViewStateChange: (next: ViewState) => void;
};

function buildPointKey(latitude: number, longitude: number, extra = ''): string {
  const lat = Number.isFinite(latitude) ? Math.round(latitude * 2) / 2 : 0;
  const lon = Number.isFinite(longitude) ? Math.round(longitude * 2) / 2 : 0;
  return `${lat}:${lon}:${String(extra || '').toLowerCase().slice(0, 40)}`;
}

function dedupeByPoint<T extends { latitude?: number | null; longitude?: number | null }>(
  items: T[],
  maxItems: number,
  extraKey: (item: T) => string
): T[] {
  const seen = new Set<string>();
  const next: T[] = [];
  for (const item of items || []) {
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    const key = buildPointKey(latitude, longitude, extraKey(item));
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(item);
    if (next.length >= maxItems) break;
  }
  return next;
}

const SEVERITY_WEIGHT = {
  CRITICAL: 4,
  HIGH: 3,
  ELEVATED: 2,
  INFO: 1,
} as const;

function resolveLayerVisibilityProfile(zoom: number, compact: boolean, isMobile: boolean): LayerVisibilityProfile {
  const strategicView = zoom <= 4.85;
  const theaterView = zoom > 4.85 && zoom <= 6.15;
  const mobilePenalty = isMobile ? 0.72 : 1;
  const scale = (value: number) => Math.max(1, Math.round(value * mobilePenalty));

  if (strategicView) {
    return {
      showFocusClusters: true,
      hotspotCap: scale(compact ? 10 : 16),
      showInfrastructure: false,
      infrastructureCap: 0,
      showWeather: false,
      weatherCap: 0,
      showFlights: false,
      flightCap: 0,
      showMaritime: true,
      maritimeCap: scale(compact ? 3 : 5),
      showCyber: false,
      cyberCap: 0,
      showEconomic: false,
      economicCap: 0,
    };
  }

  if (theaterView) {
    return {
      showFocusClusters: true,
      hotspotCap: scale(compact ? 18 : 28),
      showInfrastructure: true,
      infrastructureCap: scale(compact ? 8 : 14),
      showWeather: true,
      weatherCap: scale(compact ? 10 : 18),
      showFlights: zoom >= 5.35,
      flightCap: zoom >= 5.35 ? scale(compact ? 10 : 18) : 0,
      showMaritime: true,
      maritimeCap: scale(compact ? 6 : 10),
      showCyber: zoom >= 5.4,
      cyberCap: zoom >= 5.4 ? scale(compact ? 10 : 18) : 0,
      showEconomic: zoom >= 5.15,
      economicCap: zoom >= 5.15 ? scale(compact ? 5 : 9) : 0,
    };
  }

  return {
    showFocusClusters: zoom <= 6.8,
    hotspotCap: scale(compact ? 30 : 52),
    showInfrastructure: true,
    infrastructureCap: scale(compact ? 14 : 22),
    showWeather: true,
    weatherCap: scale(compact ? 18 : 30),
    showFlights: true,
    flightCap: scale(compact ? 18 : 34),
    showMaritime: true,
    maritimeCap: scale(compact ? 10 : 18),
    showCyber: true,
    cyberCap: scale(compact ? 16 : 28),
    showEconomic: true,
    economicCap: scale(compact ? 8 : 14),
  };
}

function resolveSeverityColor(severity: SeverityLevel): string {
  if (severity === 'CRITICAL') return '#ef4444';
  if (severity === 'HIGH') return '#f59e0b';
  if (severity === 'ELEVATED') return '#eab308';
  return '#94a3b8';
}

function resolveSeverityMarkerSize(severity: SeverityLevel): number {
  if (severity === 'CRITICAL') return 14;
  if (severity === 'HIGH') return 12;
  if (severity === 'ELEVATED') return 10;
  return 9;
}

function buildFallbackSurfaceClusters(
  signals: MapFallbackSignalMC[],
  zoom: number,
  compact: boolean,
  isMobile: boolean
): Array<MapFallbackSignalMC & { signalCount: number }> {
  if (!signals.length) return [];

  const latStep = zoom <= 3.2 ? 18 : zoom <= 4.5 ? 14 : 10;
  const lonStep = zoom <= 3.2 ? 24 : zoom <= 4.5 ? 18 : 12;
  const buckets = new globalThis.Map<
    string,
    {
      latitudeSum: number;
      longitudeSum: number;
      signals: MapFallbackSignalMC[];
    }
  >();

  signals.forEach((signal) => {
    const latitude = Number(signal.latitude);
    const longitude = Number(signal.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const key = `${Math.round(latitude / latStep)}:${Math.round(longitude / lonStep)}`;
    const bucket = buckets.get(key) || {
      latitudeSum: 0,
      longitudeSum: 0,
      signals: [],
    };
    bucket.latitudeSum += latitude;
    bucket.longitudeSum += longitude;
    bucket.signals.push(signal);
    buckets.set(key, bucket);
  });

  return [...buckets.values()]
    .map((bucket) => {
      const ordered = [...bucket.signals].sort(
        (a, b) => (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0)
      );
      const primary = ordered[0];
      return {
        ...primary,
        latitude: Number((bucket.latitudeSum / bucket.signals.length).toFixed(3)),
        longitude: Number((bucket.longitudeSum / bucket.signals.length).toFixed(3)),
        summary: bucket.signals.length > 1 ? `${bucket.signals.length} verified feed signals` : primary.summary,
        signalCount: bucket.signals.length,
      };
    })
    .sort((a, b) => {
      const severityDelta = (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
      if (severityDelta !== 0) return severityDelta;
      return b.signalCount - a.signalCount;
    })
    .slice(0, isMobile ? 1 : compact ? 2 : 4);
}

export default function MapCanvas({
  home,
  compact = false,
  isMobile = false,
  accentTheme,
  activeLayers,
  severityFilter,
  fallbackSignals = [],
  viewState,
  deckUnavailable,
  onDeckUnavailable,
  onViewStateChange,
}: MapCanvasProps) {
  const focusClusterZoomLimit = isMobile ? 6.1 : 5.4;
  const mapTone = useMemo(
    () =>
      accentTheme === 'palestine'
        ? {
            weatherHex: '#38bdf8',
            weatherFill: [56, 189, 248, 170] as [number, number, number, number],
            infrastructureFill: [34, 197, 94, 150] as [number, number, number, number],
            infrastructureLine: [187, 247, 208, 220] as [number, number, number, number],
            waterways: [74, 222, 128] as [number, number, number],
          }
        : {
            weatherHex: '#38bdf8',
            weatherFill: [56, 189, 248, 170] as [number, number, number, number],
            infrastructureFill: [14, 165, 233, 145] as [number, number, number, number],
            infrastructureLine: [6, 182, 212, 220] as [number, number, number, number],
            waterways: [34, 211, 238] as [number, number, number],
          },
    [accentTheme]
  );
  const mapStyle = useMemo(
    () => resolveMissionControlMapStyle(import.meta.env.VITE_MC_MAP_STYLE_URL as string | undefined, accentTheme),
    [accentTheme]
  );
  const visibilityProfile = useMemo(
    () => resolveLayerVisibilityProfile(viewState.zoom, compact, isMobile),
    [compact, isMobile, viewState.zoom]
  );
  const prioritizedHotspots = useMemo(
    () =>
      [...home.map.event_points]
        .filter((point) => {
          const pointSeverity = severityFromMapPoint(point);
          return severityFilter === 'ALL' ? true : pointSeverity === severityFilter;
        })
        .sort((a, b) => {
          const severityDiff =
            (SEVERITY_WEIGHT[severityFromMapPoint(b)] || 0) - (SEVERITY_WEIGHT[severityFromMapPoint(a)] || 0);
          if (severityDiff !== 0) return severityDiff;
          const casualtyDiff =
            Number(b.fatalities_total || 0) + Number(b.injured_total || 0) - (Number(a.fatalities_total || 0) + Number(a.injured_total || 0));
          if (casualtyDiff !== 0) return casualtyDiff;
          return Number(b.confidence || 0) - Number(a.confidence || 0);
        })
        .slice(0, visibilityProfile.hotspotCap),
    [home.map.event_points, severityFilter, visibilityProfile.hotspotCap]
  );
  const prioritizedInfrastructure = useMemo(
    () =>
      visibilityProfile.showInfrastructure
        ? dedupeByPoint(
            [...home.map.infrastructure_points].sort((a, b) => Number(b.risk || 0) - Number(a.risk || 0)),
            visibilityProfile.infrastructureCap,
            (item) => String(item.name || item.id || '')
          )
        : [],
    [home.map.infrastructure_points, visibilityProfile.infrastructureCap, visibilityProfile.showInfrastructure]
  );
  const prioritizedWeather = useMemo(
    () =>
      visibilityProfile.showWeather
        ? dedupeByPoint(
            [...(home.map.optional_feeds.weather_alerts || [])].sort((a, b) => {
              const severityDiff =
                (SEVERITY_WEIGHT[String(b.level || '').toUpperCase() as keyof typeof SEVERITY_WEIGHT] || 1)
                - (SEVERITY_WEIGHT[String(a.level || '').toUpperCase() as keyof typeof SEVERITY_WEIGHT] || 1);
              if (severityDiff !== 0) return severityDiff;
              return String(a.event || '').localeCompare(String(b.event || ''));
            }),
            visibilityProfile.weatherCap,
            (item) => String(item.event || item.level || '')
          )
        : [],
    [home.map.optional_feeds.weather_alerts, visibilityProfile.showWeather, visibilityProfile.weatherCap]
  );
  const prioritizedFlights = useMemo(
    () =>
      visibilityProfile.showFlights
        ? dedupeByPoint(
            [...(home.map.optional_feeds.flight_radar || [])].sort((a, b) => Number(b.speed_kts || 0) - Number(a.speed_kts || 0)),
            visibilityProfile.flightCap,
            (item) => String(item.callsign || item.id || '')
          )
        : [],
    [home.map.optional_feeds.flight_radar, visibilityProfile.flightCap, visibilityProfile.showFlights]
  );
  const prioritizedMaritime = useMemo(
    () =>
      visibilityProfile.showMaritime
        ? dedupeByPoint(
            [...(home.map.optional_feeds.maritime_risk || [])].sort((a, b) => Number(b.risk || 0) - Number(a.risk || 0)),
            visibilityProfile.maritimeCap,
            (item) => String(item.corridor || item.id || '')
          )
        : [],
    [home.map.optional_feeds.maritime_risk, visibilityProfile.maritimeCap, visibilityProfile.showMaritime]
  );
  const prioritizedCyber = useMemo(
    () =>
      visibilityProfile.showCyber
        ? dedupeByPoint(
            [...(home.map.optional_feeds.cyber_comms || [])].sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0)),
            visibilityProfile.cyberCap,
            (item) => String(item.impact || item.id || '')
          )
        : [],
    [home.map.optional_feeds.cyber_comms, visibilityProfile.cyberCap, visibilityProfile.showCyber]
  );
  const prioritizedEconomic = useMemo(
    () =>
      visibilityProfile.showEconomic
        ? dedupeByPoint(
            [...(home.map.optional_feeds.economic_shocks || [])].sort((a, b) => Number(b.intensity || 0) - Number(a.intensity || 0)),
            visibilityProfile.economicCap,
            (item) => String(item.id || '')
          )
        : [],
    [home.map.optional_feeds.economic_shocks, visibilityProfile.economicCap, visibilityProfile.showEconomic]
  );
  const fallbackMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      latitude: number;
      longitude: number;
      color: string;
      size: number;
      label: string;
    }> = [];
    const markerKeySet = new Set<string>();
    const maxTotalMarkers = compact ? 56 : 104;

    const addMarker = (
      id: string,
      latitude: number,
      longitude: number,
      color: string,
      size: number,
      label: string
    ) => {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      if (markers.length >= maxTotalMarkers) return;
      const latBucket = Math.round(latitude * 4) / 4;
      const lonBucket = Math.round(longitude * 4) / 4;
      const key = `${latBucket}:${lonBucket}`;
      if (markerKeySet.has(key)) return;
      markerKeySet.add(key);
      markers.push({
        id,
        latitude,
        longitude,
        color,
        size,
        label,
      });
    };

    if (activeLayers.has('verified-hotspots')) {
      prioritizedHotspots.forEach((point, index) => {
          const severity = severityFromMapPoint(point);
          addMarker(
            `fallback-hotspot-${point.id || index}`,
            Number(point.latitude),
            Number(point.longitude),
            resolveSeverityColor(severity),
            resolveSeverityMarkerSize(severity),
            formatLocationDisplay(point.location, 'Verified hotspot')
          );
        });
    }

    if (activeLayers.has('flight-radar') && visibilityProfile.showFlights) {
      prioritizedFlights.forEach((item, index) => {
        addMarker(
          `fallback-flight-${item.id || index}`,
          Number(item.latitude),
          Number(item.longitude),
          '#10b981',
          8,
          formatSignalLabel(item.callsign, 'Flight track')
        );
      });
    }

    if (activeLayers.has('maritime-risk') && visibilityProfile.showMaritime) {
      prioritizedMaritime.forEach((item, index) => {
        addMarker(
          `fallback-maritime-${item.id || index}`,
          Number(item.latitude),
          Number(item.longitude),
          '#fb7185',
          9,
          formatLocationDisplay(item.corridor, 'Maritime risk')
        );
      });
    }

    if (activeLayers.has('cyber-comms') && visibilityProfile.showCyber) {
      prioritizedCyber.forEach((item, index) => {
        addMarker(
          `fallback-cyber-${item.id || index}`,
          Number(item.latitude),
          Number(item.longitude),
          '#a855f7',
          9,
          formatSignalLabel(item.impact, 'Cyber signal')
        );
      });
    }

    if (activeLayers.has('weather-alerts') && visibilityProfile.showWeather) {
      prioritizedWeather.forEach((item, index) => {
        const level = String(item.level || '').toUpperCase();
        const color = level === 'CRITICAL' ? '#ef4444' : level === 'HIGH' ? '#f59e0b' : mapTone.weatherHex;
        addMarker(
          `fallback-weather-${item.id || index}`,
          Number(item.latitude),
          Number(item.longitude),
          color,
          10,
          formatSignalLabel(item.event, 'Weather alert')
        );
      });
    }

    if (activeLayers.has('economic-shocks') && visibilityProfile.showEconomic) {
      prioritizedEconomic.forEach((item, index) => {
        addMarker(
          `fallback-economic-${item.id || index}`,
          Number(item.latitude),
          Number(item.longitude),
          '#f97316',
          9,
          'Economic shock'
        );
      });
    }

    return markers;
  }, [
    activeLayers,
    compact,
    mapTone.weatherHex,
    prioritizedCyber,
    prioritizedEconomic,
    prioritizedFlights,
    prioritizedHotspots,
    prioritizedMaritime,
    prioritizedWeather,
    visibilityProfile.showCyber,
    visibilityProfile.showEconomic,
    visibilityProfile.showFlights,
    visibilityProfile.showMaritime,
    visibilityProfile.showWeather,
  ]);

  const focusClusters = useMemo(
    () => buildMapFocusClusters(home, activeLayers, severityFilter, viewState.zoom, compact),
    [activeLayers, compact, home, severityFilter, viewState.zoom]
  );
  const visibleFocusClusters = useMemo(
    () => (visibilityProfile.showFocusClusters ? (isMobile ? focusClusters.slice(0, 1) : focusClusters) : []),
    [focusClusters, isMobile, visibilityProfile.showFocusClusters]
  );
  const needsFocusFallback = visibleFocusClusters.length === 0 && fallbackSignals.length > 0;
  const fallbackSurfaceClusters = useMemo(
    () => (
      visibilityProfile.showFocusClusters && needsFocusFallback
        ? buildFallbackSurfaceClusters(fallbackSignals, viewState.zoom, compact, isMobile)
        : []
    ),
    [compact, fallbackSignals, isMobile, needsFocusFallback, viewState.zoom, visibilityProfile.showFocusClusters]
  );
  const renderedFocusClusters = needsFocusFallback ? fallbackSurfaceClusters : visibleFocusClusters;
  const fallbackSurfaceMarkers = useMemo(
    () => (
      needsFocusFallback
        ? dedupeByPoint(
            [...fallbackSignals].sort((a, b) => (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0)),
            compact ? 5 : 9,
            (item) => `${item.label}:${item.severity}`
          )
        : []
    ),
    [compact, fallbackSignals, needsFocusFallback]
  );

  const deckLayers = useMemo(() => {
    const list: any[] = [];

    if (activeLayers.has('conflict-zones')) {
      list.push(
        new ColumnLayer({
          id: 'mc-conflict-zones',
          data: home.map.location_intensity,
          radius: 5200,
          diskResolution: 20,
          extruded: true,
          elevationScale: 110,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getElevation: (d: { hits: number }) => Math.max(1, Number(d.hits || 0)),
          getFillColor: (d: { hits: number }) => {
            const alpha = Math.min(220, 80 + Number(d.hits || 0) * 8);
            return [245, 158, 11, alpha];
          },
          pickable: true,
        })
      );
    }

    if (activeLayers.has('verified-hotspots')) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-verified-hotspots',
          data: prioritizedHotspots,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { fatalities_total: number; injured_total: number; confidence: number }) => {
            const scale =
              Number(d.fatalities_total || 0) * 140 + Number(d.injured_total || 0) * 28 + Number(d.confidence || 0) * 1100;
            return 1500 + scale;
          },
          radiusMinPixels: 3,
          radiusMaxPixels: 36,
          stroked: true,
          lineWidthMinPixels: 1,
          getFillColor: (
            d: {
              confidence: number;
              fatalities_total: number;
              injured_total: number;
              source_tier?: string;
              official_announcement_types?: string[];
            }
          ) => {
            const level = severityFromMapPoint({
              ...d,
            });
            const alpha = Math.min(235, 100 + Number(d.confidence || 0) * 120);
            if (level === 'CRITICAL') return [239, 68, 68, alpha];
            if (level === 'HIGH') return [245, 158, 11, alpha];
            if (level === 'ELEVATED') return [234, 179, 8, alpha];
            return [148, 163, 184, alpha];
          },
          getLineColor: [8, 20, 32, 180],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('critical-infrastructure') && visibilityProfile.showInfrastructure) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-infrastructure',
          data: prioritizedInfrastructure,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { risk: number }) => 2100 + Number(d.risk || 0) * 3200,
          radiusMinPixels: 2,
          radiusMaxPixels: 18,
          getFillColor: mapTone.infrastructureFill,
          getLineColor: mapTone.infrastructureLine,
          stroked: true,
          lineWidthMinPixels: 1,
          pickable: true,
        })
      );
    }

    if (activeLayers.has('strategic-waterways')) {
      list.push(
        new PathLayer({
          id: 'mc-waterways',
          data: home.map.waterways,
          getPath: (d: { points: [number, number][] }) => d.points,
          getWidth: (d: { risk: number }) => 2 + Number(d.risk || 0) * 5,
          widthMinPixels: 1,
          widthMaxPixels: 6,
          getColor: (d: { risk: number }) =>
            [
              mapTone.waterways[0],
              mapTone.waterways[1],
              mapTone.waterways[2],
              Math.round(130 + Number(d.risk || 0) * 80),
            ] as [number, number, number, number],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('weather-alerts') && visibilityProfile.showWeather) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-weather-alerts',
          data: prioritizedWeather,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: 4200,
          radiusMinPixels: 4,
          radiusMaxPixels: 14,
          getFillColor: (d: { level: string }) => {
            const level = String(d.level || '').toUpperCase();
            if (level === 'HIGH') return [245, 158, 11, 180];
            if (level === 'CRITICAL') return [239, 68, 68, 185];
            return mapTone.weatherFill;
          },
          pickable: true,
        })
      );
    }

    if (activeLayers.has('flight-radar') && visibilityProfile.showFlights) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-flight-radar',
          data: prioritizedFlights,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: 3200,
          radiusMinPixels: 2,
          radiusMaxPixels: 12,
          getFillColor: [16, 185, 129, 175],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('maritime-risk') && visibilityProfile.showMaritime) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-maritime-risk',
          data: prioritizedMaritime,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { risk: number }) => 2500 + Number(d.risk || 0) * 2800,
          radiusMinPixels: 3,
          radiusMaxPixels: 15,
          getFillColor: [251, 113, 133, 185],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('cyber-comms') && visibilityProfile.showCyber) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-cyber-comms',
          data: prioritizedCyber,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: 2800,
          radiusMinPixels: 3,
          radiusMaxPixels: 14,
          getFillColor: [168, 85, 247, 165],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('economic-shocks') && visibilityProfile.showEconomic) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-economic-shocks',
          data: prioritizedEconomic,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { intensity: number }) => 2400 + Number(d.intensity || 0) * 2600,
          radiusMinPixels: 3,
          radiusMaxPixels: 14,
          getFillColor: [249, 115, 22, 170],
          pickable: true,
        })
      );
    }

    return list;
  }, [
    activeLayers,
    home.map.location_intensity,
    mapTone,
    prioritizedCyber,
    prioritizedEconomic,
    prioritizedFlights,
    prioritizedHotspots,
    prioritizedInfrastructure,
    prioritizedMaritime,
    prioritizedWeather,
    visibilityProfile.showCyber,
    visibilityProfile.showEconomic,
    visibilityProfile.showFlights,
    visibilityProfile.showInfrastructure,
    visibilityProfile.showMaritime,
    visibilityProfile.showWeather,
  ]);

  const renderMapAnnotations = () => (
    <>
      {viewState.zoom <= focusClusterZoomLimit && renderedFocusClusters.map((cluster) => (
        <Marker
          key={cluster.id}
          latitude={cluster.latitude}
          longitude={cluster.longitude}
          anchor="bottom"
        >
          <button
            type="button"
            className={`map-focus-cluster tone-${cluster.severity.toLowerCase()}`}
            title={`${cluster.label} · ${cluster.summary}`}
            onClick={() => {
              onViewStateChange({
                latitude: cluster.latitude,
                longitude: cluster.longitude,
                zoom: Math.max(viewState.zoom + 1.15, 5.8),
                pitch: viewState.pitch,
                bearing: viewState.bearing,
              });
            }}
          >
            <span className="focus-cluster-kicker">{cluster.summary}</span>
            <strong>{formatLocationDisplay(cluster.label, 'Focus zone')}</strong>
            <span className="focus-cluster-count">{cluster.signalCount}</span>
          </button>
        </Marker>
      ))}
      {!deckUnavailable && viewState.zoom > focusClusterZoomLimit - 0.2 && fallbackSurfaceMarkers.map((point) => (
        <Marker
          key={`supplemental-${point.id}`}
          latitude={point.latitude}
          longitude={point.longitude}
          anchor="center"
        >
          <span
            title={`${point.label} · ${point.summary}`}
            style={{
              width: `${resolveSeverityMarkerSize(point.severity)}px`,
              height: `${resolveSeverityMarkerSize(point.severity)}px`,
              borderRadius: '999px',
              border: '1px solid rgba(15, 23, 42, 0.85)',
              display: 'inline-block',
              background: resolveSeverityColor(point.severity),
              boxShadow: `0 0 0 3px ${resolveSeverityColor(point.severity)}33`,
            }}
          />
        </Marker>
      ))}
      {(deckUnavailable ? fallbackMarkers : []).map((point) => (
        <Marker
          key={point.id}
          latitude={point.latitude}
          longitude={point.longitude}
          anchor="center"
        >
          <span
            title={point.label}
            style={{
              width: `${point.size}px`,
              height: `${point.size}px`,
              borderRadius: '999px',
              border: '1px solid rgba(15, 23, 42, 0.85)',
              display: 'inline-block',
              background: point.color,
              boxShadow: `0 0 0 3px ${point.color}33`,
            }}
          />
        </Marker>
      ))}
      <NavigationControl position="bottom-right" />
    </>
  );

  if (!deckUnavailable) {
    return (
      <DeckGL
        viewState={viewState}
        controller
        layers={deckLayers}
        onError={() => {
          onDeckUnavailable();
          return true;
        }}
        onViewStateChange={({ viewState: nextView }) => {
          const next = nextView as Record<string, number>;
          onViewStateChange({
            latitude: Number(next.latitude ?? viewState.latitude),
            longitude: Number(next.longitude ?? viewState.longitude),
            zoom: Number(next.zoom ?? viewState.zoom),
            pitch: Number(next.pitch ?? viewState.pitch),
            bearing: Number(next.bearing ?? viewState.bearing),
          });
        }}
        getTooltip={({ object }) => {
          if (!object) return null;
          const obj = object as Record<string, unknown>;
          if (typeof obj.location === 'string' && typeof obj.hits === 'number') {
            return `${formatLocationDisplay(obj.location, 'Conflict zone')} · ${String(obj.hits)} intensity hits`;
          }
          if (typeof obj.callsign === 'string') {
            return `${formatSignalLabel(obj.callsign, 'Flight track')} · ${String(obj.speed_kts || 0)} kts`;
          }
          if (typeof obj.name === 'string') {
            return `${formatLocationDisplay(obj.name, 'Infrastructure point')}`;
          }
          if (typeof obj.event === 'string') {
            return `${formatSignalLabel(obj.event, 'Weather alert')}`;
          }
          if (typeof obj.corridor === 'string') {
            return `${formatLocationDisplay(obj.corridor, 'Maritime risk')}`;
          }
          if (typeof obj.impact === 'string') {
            return `${formatSignalLabel(obj.impact, 'Cyber signal')}`;
          }
          return null;
        }}
      >
        <Map
          mapLib={maplibregl}
          mapStyle={mapStyle}
          attributionControl={false}
        >
          {renderMapAnnotations()}
        </Map>
      </DeckGL>
    );
  }

  return (
    <Map
      mapLib={maplibregl}
      mapStyle={mapStyle}
      attributionControl={false}
      latitude={viewState.latitude}
      longitude={viewState.longitude}
      zoom={viewState.zoom}
      pitch={viewState.pitch}
      bearing={viewState.bearing}
      onMove={(event) => {
        const next = event.viewState;
        onViewStateChange({
          latitude: Number(next.latitude ?? viewState.latitude),
          longitude: Number(next.longitude ?? viewState.longitude),
          zoom: Number(next.zoom ?? viewState.zoom),
          pitch: Number(next.pitch ?? viewState.pitch),
          bearing: Number(next.bearing ?? viewState.bearing),
        });
      }}
    >
      {renderMapAnnotations()}
    </Map>
  );
}
