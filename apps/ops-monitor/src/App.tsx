import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScatterplotLayer, ColumnLayer } from '@deck.gl/layers';
import { DeckGL } from '@deck.gl/react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

import { loadMonitorBundle } from './api';
import type {
  MonitorBriefResponse,
  MonitorDigestResponse,
  MonitorFreshnessResponse,
  MonitorFusionResponse,
  MonitorLayerResponse,
  MonitorSettings,
} from './types';

type DockPreset = 'map-signals' | 'map-brief' | 'dense-grid';

const REFRESH_MS = 3 * 60 * 1000;

const CONFLICT_OPTIONS = ['gaza-israel', 'israel-us-iran', 'all'];
const VERIFICATION_OPTIONS = ['verified', 'all', 'unverified'];
const SOURCE_TIER_OPTIONS = ['all', 'official', 'wire', 'major', 'other'];
const DAY_OPTIONS = [7, 14, 30, 90];

const defaultSettings: MonitorSettings = {
  conflict: 'gaza-israel',
  days: 14,
  verification: 'verified',
  sourceTier: 'all',
  limit: 600,
};

const fmtPct = (value: number) => `${(Math.max(0, value) * 100).toFixed(1)}%`;

function App() {
  const [settings, setSettings] = useState<MonitorSettings>(defaultSettings);
  const [preset, setPreset] = useState<DockPreset>('map-signals');
  const [commandOpen, setCommandOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const [layers, setLayers] = useState<MonitorLayerResponse | null>(null);
  const [digest, setDigest] = useState<MonitorDigestResponse | null>(null);
  const [fusion, setFusion] = useState<MonitorFusionResponse | null>(null);
  const [freshness, setFreshness] = useState<MonitorFreshnessResponse | null>(null);
  const [brief, setBrief] = useState<MonitorBriefResponse | null>(null);

  const [viewState, setViewState] = useState({
    latitude: 31.5,
    longitude: 34.7,
    zoom: 6.8,
    pitch: 45,
    bearing: 0,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await loadMonitorBundle(settings);
      setLayers(result.layers);
      setDigest(result.digest);
      setFusion(result.fusion);
      setFreshness(result.freshness);
      setBrief(result.brief);
      setLastUpdated(new Date().toISOString());

      const center = result.layers?.map_hints?.default_center;
      if (center) {
        setViewState((prev) => ({
          ...prev,
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: center.zoom,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitor data');
    } finally {
      setLoading(false);
    }
  }, [settings]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load();
      }
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (event.key === 'Escape') {
        setCommandOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const deckLayers = useMemo(() => {
    const points = layers?.layers?.event_points || [];
    const intensity = layers?.layers?.location_intensity || [];

    const signalLayer = new ScatterplotLayer({
      id: 'event-signal-layer',
      data: points,
      getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
      getFillColor: (d: { confidence: number }) => {
        const confidence = Math.max(0, Math.min(1, Number(d.confidence || 0)));
        return [20, 184, 166, Math.round(90 + (confidence * 150))];
      },
      getRadius: (d: { fatalities_total: number; injured_total: number }) =>
        2000 + (Math.max(0, Number(d.fatalities_total || 0)) * 110) + (Math.max(0, Number(d.injured_total || 0)) * 20),
      radiusMinPixels: 3,
      radiusMaxPixels: 34,
      pickable: true,
      stroked: true,
      getLineColor: [7, 28, 39, 180],
      lineWidthMinPixels: 1,
    });

    const intensityLayer = new ColumnLayer({
      id: 'location-intensity-layer',
      data: intensity,
      diskResolution: 20,
      radius: 5500,
      extruded: true,
      elevationScale: 120,
      getPosition: (d: { longitude: number; latitude: number }) => [d.longitude, d.latitude],
      getElevation: (d: { hits: number }) => Math.max(1, Number(d.hits || 0)),
      getFillColor: [251, 146, 60, 170],
      pickable: true,
    });

    return [intensityLayer, signalLayer];
  }, [layers]);

  return (
    <div className={`app-shell preset-${preset}`}>
      <header className="command-strip">
        <div className="brand">
          <h1>Ops Monitor</h1>
          <div className="subline">Map-first monitoring surface for layered conflict signals</div>
        </div>
        <div className="controls">
          <label>
            Conflict
            <select
              value={settings.conflict}
              onChange={(event) => setSettings((prev) => ({ ...prev, conflict: event.target.value }))}
            >
              {CONFLICT_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Days
            <select
              value={settings.days}
              onChange={(event) => setSettings((prev) => ({ ...prev, days: Number(event.target.value) }))}
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Verification
            <select
              value={settings.verification}
              onChange={(event) => setSettings((prev) => ({ ...prev, verification: event.target.value }))}
            >
              {VERIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Source Tier
            <select
              value={settings.sourceTier}
              onChange={(event) => setSettings((prev) => ({ ...prev, sourceTier: event.target.value }))}
            >
              {SOURCE_TIER_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <button className="solid" onClick={load} disabled={loading}>
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
          <button onClick={() => setCommandOpen(true)}>Command Palette</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="workspace">
        <section className="panel map-panel">
          <div className="panel-head">
            <h2>Monitor Layers</h2>
            <span>Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}</span>
          </div>
          <div className="map-wrap">
            <DeckGL
              viewState={viewState}
              controller
              layers={deckLayers}
              onViewStateChange={({ viewState: nextViewState }) => {
                const next = nextViewState as Record<string, number>;
                setViewState((prev) => ({
                  ...prev,
                  latitude: Number(next.latitude ?? prev.latitude),
                  longitude: Number(next.longitude ?? prev.longitude),
                  zoom: Number(next.zoom ?? prev.zoom),
                  pitch: Number(next.pitch ?? prev.pitch),
                  bearing: Number(next.bearing ?? prev.bearing),
                }));
              }}
              getTooltip={({ object }) => {
                if (!object) return null;
                if ('hits' in object) {
                  return `${String((object as { location: string }).location)} | hits: ${String((object as { hits: number }).hits)}`;
                }
                return `${String((object as { location: string }).location)} | confidence ${(Number((object as { confidence: number }).confidence || 0) * 100).toFixed(0)}%`;
              }}
            >
              <Map
                mapLib={maplibregl}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                attributionControl={false}
              >
                <NavigationControl position="bottom-right" />
              </Map>
            </DeckGL>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Signal Fusion</h2>
            <span className={`tag tag-${fusion?.confidence_label || 'low'}`}>
              {(fusion?.confidence_label || 'unknown').toUpperCase()}
            </span>
          </div>
          <div className="kpi-grid">
            <div>
              <div className="kpi-label">Fusion Score</div>
              <div className="kpi-value">{fmtPct(fusion?.fusion_score || 0)}</div>
            </div>
            <div>
              <div className="kpi-label">Freshness</div>
              <div className="kpi-value">{fmtPct(freshness?.freshness_score || 0)}</div>
            </div>
          </div>
          <h3>Top Gaps</h3>
          <ul className="list">
            {(fusion?.top_gaps || []).slice(0, 5).map((gap) => (
              <li key={`${gap.dimension}-${gap.signal}`}>
                <span>{gap.dimension}: {gap.signal}</span>
                <span className={`tag tag-${gap.severity}`}>{gap.severity}</span>
              </li>
            ))}
          </ul>
          <h3>Top Locations</h3>
          <ul className="list compact">
            {(fusion?.top_locations || []).slice(0, 6).map((row) => (
              <li key={row.location}>
                <span>{row.location}</span>
                <span>{row.hits}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Ranked News Digest</h2>
            <span>{digest?.items?.length || 0} items</span>
          </div>
          <p className="digest">{digest?.digest_text || 'No digest available.'}</p>
          <ul className="list">
            {(digest?.items || []).slice(0, 8).map((item) => (
              <li key={item.id || item.title}>
                <a href={item.source_url || '#'} target="_blank" rel="noreferrer">{item.title}</a>
                <span>{item.source_name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Analyst Brief</h2>
            <span>{brief?.confidence_label || 'unknown'}</span>
          </div>
          <p className="note">{brief?.non_deterministic_label || ''}</p>
          <h3>Findings</h3>
          <ul className="list">
            {(brief?.key_findings || []).map((finding) => (
              <li key={finding}>{finding}</li>
            ))}
          </ul>
          <h3>Recommended Actions</h3>
          <ul className="list">
            {(brief?.recommended_actions || []).slice(0, 5).map((action) => (
              <li key={action.action}>
                <strong>{action.priority}</strong> {action.action}
              </li>
            ))}
          </ul>
        </section>
      </main>

      {commandOpen && (
        <div className="command-overlay" onClick={() => setCommandOpen(false)}>
          <div className="command-panel" onClick={(event) => event.stopPropagation()}>
            <h2>Command Palette</h2>
            <button onClick={() => { setPreset('map-signals'); setCommandOpen(false); }}>
              Docking Preset: Map + Signals
            </button>
            <button onClick={() => { setPreset('map-brief'); setCommandOpen(false); }}>
              Docking Preset: Map + Intel Brief
            </button>
            <button onClick={() => { setPreset('dense-grid'); setCommandOpen(false); }}>
              Docking Preset: Dense Grid
            </button>
            <button onClick={() => { setSettings((prev) => ({ ...prev, conflict: 'gaza-israel' })); setCommandOpen(false); }}>
              Scope: Gaza-Israel
            </button>
            <button onClick={() => { setSettings((prev) => ({ ...prev, conflict: 'israel-us-iran' })); setCommandOpen(false); }}>
              Scope: Israel-US-Iran
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
