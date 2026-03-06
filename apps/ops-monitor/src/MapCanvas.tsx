import { useMemo } from 'react';
import { ColumnLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { DeckGL } from '@deck.gl/react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

import type { HomeSnapshotMC } from './types';
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

type MapCanvasProps = {
  home: HomeSnapshotMC;
  compact?: boolean;
  isMobile?: boolean;
  activeLayers: Set<string>;
  severityFilter: string;
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

export default function MapCanvas({
  home,
  compact = false,
  isMobile = false,
  activeLayers,
  severityFilter,
  viewState,
  deckUnavailable,
  onDeckUnavailable,
  onViewStateChange,
}: MapCanvasProps) {
  const mapStyle = useMemo(
    () => resolveMissionControlMapStyle(import.meta.env.VITE_MC_MAP_STYLE_URL as string | undefined),
    []
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
    const maxTotalMarkers = compact ? 96 : 170;
    const layerCap = {
      hotspots: compact ? 40 : 80,
      flight: compact ? 36 : 70,
      maritime: compact ? 18 : 40,
      cyber: compact ? 24 : 48,
      weather: compact ? 18 : 40,
      economic: compact ? 16 : 32,
    };

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
      home.map.event_points
        .filter((point) => {
          const pointSeverity = severityFromMapPoint(point);
          return severityFilter === 'ALL' ? true : pointSeverity === severityFilter;
        })
        .slice(0, layerCap.hotspots)
        .forEach((point, index) => {
          const severity = severityFromMapPoint(point);
          const color =
            severity === 'CRITICAL'
              ? '#ef4444'
              : severity === 'HIGH'
                ? '#f59e0b'
                : severity === 'ELEVATED'
                  ? '#eab308'
                  : '#94a3b8';
          const size = severity === 'CRITICAL' ? 14 : severity === 'HIGH' ? 12 : 10;
          addMarker(
            `fallback-hotspot-${point.id || index}`,
            Number(point.latitude),
            Number(point.longitude),
            color,
            size,
            formatLocationDisplay(point.location, 'Verified hotspot')
          );
        });
    }

    if (activeLayers.has('flight-radar')) {
      (home.map.optional_feeds.flight_radar || []).slice(0, layerCap.flight).forEach((item, index) => {
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

    if (activeLayers.has('maritime-risk')) {
      (home.map.optional_feeds.maritime_risk || []).slice(0, layerCap.maritime).forEach((item, index) => {
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

    if (activeLayers.has('cyber-comms')) {
      (home.map.optional_feeds.cyber_comms || []).slice(0, layerCap.cyber).forEach((item, index) => {
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

    if (activeLayers.has('weather-alerts')) {
      (home.map.optional_feeds.weather_alerts || []).slice(0, layerCap.weather).forEach((item, index) => {
        const level = String(item.level || '').toUpperCase();
        const color = level === 'CRITICAL' ? '#ef4444' : level === 'HIGH' ? '#f59e0b' : '#3b82f6';
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

    if (activeLayers.has('economic-shocks')) {
      (home.map.optional_feeds.economic_shocks || []).slice(0, layerCap.economic).forEach((item, index) => {
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
  }, [activeLayers, compact, home.map.event_points, home.map.optional_feeds, severityFilter]);

  const focusClusters = useMemo(
    () => buildMapFocusClusters(home, activeLayers, severityFilter, viewState.zoom, compact),
    [activeLayers, compact, home, severityFilter, viewState.zoom]
  );
  const visibleFocusClusters = useMemo(
    () => (isMobile ? focusClusters.slice(0, 1) : focusClusters),
    [focusClusters, isMobile]
  );

  const deckLayers = useMemo(() => {
    const list: any[] = [];
    const weatherPoints = dedupeByPoint(
      home.map.optional_feeds.weather_alerts || [],
      compact ? 36 : 72,
      (item) => String(item.event || item.level || '')
    );
    const flightPoints = dedupeByPoint(
      home.map.optional_feeds.flight_radar || [],
      compact ? 48 : 96,
      (item) => String(item.callsign || item.id || '')
    );
    const maritimePoints = dedupeByPoint(
      home.map.optional_feeds.maritime_risk || [],
      compact ? 24 : 48,
      (item) => String(item.corridor || item.id || '')
    );
    const cyberPoints = dedupeByPoint(
      home.map.optional_feeds.cyber_comms || [],
      compact ? 32 : 64,
      (item) => String(item.impact || item.id || '')
    );
    const economicPoints = dedupeByPoint(
      home.map.optional_feeds.economic_shocks || [],
      compact ? 24 : 48,
      (item) => String(item.id || '')
    );

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
      const points = home.map.event_points.filter((point) => {
        const pointSeverity = severityFromMapPoint(point);
        return severityFilter === 'ALL' ? true : pointSeverity === severityFilter;
      });

      list.push(
        new ScatterplotLayer({
          id: 'mc-verified-hotspots',
          data: points,
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

    if (activeLayers.has('critical-infrastructure')) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-infrastructure',
          data: home.map.infrastructure_points,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { risk: number }) => 2100 + Number(d.risk || 0) * 3200,
          radiusMinPixels: 2,
          radiusMaxPixels: 18,
          getFillColor: [14, 165, 233, 145],
          getLineColor: [6, 182, 212, 220],
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
          getColor: (d: { risk: number }) => [34, 211, 238, Math.round(130 + Number(d.risk || 0) * 80)],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('weather-alerts')) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-weather-alerts',
          data: weatherPoints,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: 4200,
          radiusMinPixels: 4,
          radiusMaxPixels: 14,
          getFillColor: (d: { level: string }) => {
            const level = String(d.level || '').toUpperCase();
            if (level === 'HIGH') return [245, 158, 11, 180];
            if (level === 'CRITICAL') return [239, 68, 68, 185];
            return [59, 130, 246, 170];
          },
          pickable: true,
        })
      );
    }

    if (activeLayers.has('flight-radar')) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-flight-radar',
          data: flightPoints,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: 3200,
          radiusMinPixels: 2,
          radiusMaxPixels: 12,
          getFillColor: [16, 185, 129, 175],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('maritime-risk')) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-maritime-risk',
          data: maritimePoints,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: (d: { risk: number }) => 2500 + Number(d.risk || 0) * 2800,
          radiusMinPixels: 3,
          radiusMaxPixels: 15,
          getFillColor: [251, 113, 133, 185],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('cyber-comms')) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-cyber-comms',
          data: cyberPoints,
          getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
          getRadius: 2800,
          radiusMinPixels: 3,
          radiusMaxPixels: 14,
          getFillColor: [168, 85, 247, 165],
          pickable: true,
        })
      );
    }

    if (activeLayers.has('economic-shocks')) {
      list.push(
        new ScatterplotLayer({
          id: 'mc-economic-shocks',
          data: economicPoints,
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
  }, [activeLayers, compact, home, severityFilter]);

  const renderMapAnnotations = () => (
    <>
      {viewState.zoom <= 5.4 && visibleFocusClusters.map((cluster) => (
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
