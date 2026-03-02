import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import useFeatureFlagMap from '../hooks/useFeatureFlagMap';
import { defaultMonitorSettings, loadMonitorBundlePartial } from '../features/codMonitor/api';
import { isCodWarPreviewEnabled } from '../utils/codWarPreview';
import './CodWarMonitorPage.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const REFRESH_MS = 3 * 60 * 1000;
const QUERY_DEBOUNCE_MS = 260;

const CONFLICT_OPTIONS = [
  { value: 'all', label: 'All tracked conflicts' },
  { value: 'gaza-israel', label: 'Gaza vs Israel' },
  { value: 'israel-us-iran', label: 'Israel/US vs Iran' },
];

const VERIFICATION_OPTIONS = [
  { value: 'verified', label: 'Verified only' },
  { value: 'all', label: 'All reports' },
  { value: 'unverified', label: 'Unverified only' },
];

const SOURCE_TIER_OPTIONS = [
  { value: 'all', label: 'All tiers' },
  { value: 'official', label: 'Official' },
  { value: 'wire', label: 'Wire' },
  { value: 'major', label: 'Major' },
  { value: 'other', label: 'Other' },
];

const DAY_OPTIONS = [7, 14, 30, 90, 180];
const PRESETS = ['map-signals', 'map-brief', 'dense-grid'];
const MONITOR_MODES = [
  {
    value: 'world',
    label: 'World',
    description: 'Global conflict and geopolitical lens',
  },
  {
    value: 'tech',
    label: 'Tech',
    description: 'Weapons systems, platforms, and cyber lens',
  },
  {
    value: 'finance',
    label: 'Finance',
    description: 'Markets, sanctions, and energy-impact lens',
  },
];

const TECH_KEYWORDS = [
  'tech',
  'technology',
  'cyber',
  'drone',
  'uav',
  'missile',
  'air defense',
  'radar',
  'satellite',
  'electronic warfare',
  'f-35',
  'f-16',
  'iron dome',
];

const FINANCE_KEYWORDS = [
  'finance',
  'financial',
  'market',
  'markets',
  'economy',
  'economic',
  'inflation',
  'rate',
  'rates',
  'bank',
  'bonds',
  'stocks',
  'equity',
  'oil',
  'gas',
  'energy',
  'trade',
  'shipping',
  'sanction',
  'sanctions',
];

const TECH_SOURCE_HINTS = ['techcrunch', 'the verge', 'ars technica', 'wired'];
const FINANCE_SOURCE_HINTS = ['bloomberg', 'financial times', 'reuters', 'wsj', 'wall street journal', 'cnbc', 'marketwatch'];

const fmtPct = (value) => `${(Math.max(0, Number(value || 0)) * 100).toFixed(1)}%`;
const fmtNum = (value) => Number(value || 0).toLocaleString();

const normalizeMode = (value) => (MONITOR_MODES.some((item) => item.value === value) ? value : 'world');

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

function computeModeScore(item, mode) {
  const baseScore = Number(item?.score || 0);
  if (mode === 'world') return baseScore;

  const haystack = `${item?.title || ''} ${item?.summary || ''} ${item?.source_name || ''}`.toLowerCase();
  const source = String(item?.source_name || '').toLowerCase();
  if (mode === 'tech') {
    const keywordBoost = includesAny(haystack, TECH_KEYWORDS) ? 0.7 : 0;
    const sourceBoost = includesAny(source, TECH_SOURCE_HINTS) ? 0.3 : 0;
    return baseScore + keywordBoost + sourceBoost;
  }

  const keywordBoost = includesAny(haystack, FINANCE_KEYWORDS) ? 0.7 : 0;
  const sourceBoost = includesAny(source, FINANCE_SOURCE_HINTS) ? 0.3 : 0;
  return baseScore + keywordBoost + sourceBoost;
}

class CodWarMonitorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="cod-war-shell">
          <div className="cod-war-unavailable">
            <div className="cod-war-unavailable-card">
              <h1>COD - War Monitor encountered an unexpected error</h1>
              <p>This route is protected with a page-level safety boundary. Please reload or return to Tactical Monitor.</p>
              <div className="mt-3">
                <a className="cod-war-link" href="/monitor">Back to Tactical Monitor</a>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class MapSafetyBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

function VirtualList({ items, rowHeight, height, keyField, renderRow, emptyText }) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = Math.max(items.length * rowHeight, rowHeight);
  const visibleCount = Math.ceil(height / rowHeight) + 6;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 3);
  const end = Math.min(items.length, start + visibleCount);
  const visible = items.slice(start, end);

  if (!items.length) {
    return (
      <div className="cod-war-map-fallback">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="cod-war-virtual" style={{ height }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visible.map((item, offset) => {
          const index = start + offset;
          return (
            <div
              key={String(item?.[keyField] || index)}
              className="cod-war-row"
              style={{ top: index * rowHeight, height: rowHeight }}
            >
              {renderRow(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CodWarMonitorCore = () => {
  const { flags, loading: flagsLoading } = useFeatureFlagMap();
  const previewOverrideEnabled = useMemo(() => isCodWarPreviewEnabled(), []);
  const codWarMonitorEnabled = Boolean(flags?.cod_war_monitor_v1) || previewOverrideEnabled;

  const [isPhone, setIsPhone] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const [settings, setSettings] = useState(defaultMonitorSettings);
  const [preset, setPreset] = useState('map-signals');
  const [monitorMode, setMonitorMode] = useState(() => {
    if (typeof window === 'undefined') return 'world';
    const params = new URLSearchParams(window.location.search);
    return normalizeMode(params.get('mode') || 'world');
  });
  const [commandOpen, setCommandOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [panelErrors, setPanelErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');

  const [layers, setLayers] = useState(null);
  const [digest, setDigest] = useState(null);
  const [fusion, setFusion] = useState(null);
  const [freshness, setFreshness] = useState(null);
  const [brief, setBrief] = useState(null);
  const [mapRenderDisabled, setMapRenderDisabled] = useState(false);

  const [viewState, setViewState] = useState({
    latitude: 32.2,
    longitude: 36.2,
    zoom: 4.6,
    pitch: 44,
    bearing: 0,
  });

  const requestRef = useRef(0);
  const activeAbortRef = useRef(null);

  const [mapRuntime, setMapRuntime] = useState({
    ready: false,
    loading: true,
    error: '',
    Map: null,
    Source: null,
    Layer: null,
    NavigationControl: null,
    maplibregl: null,
  });

  useEffect(() => {
    const onResize = () => setIsPhone(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('mode', monitorMode);
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  }, [monitorMode]);

  useEffect(() => {
    let mounted = true;

    const loadMapRuntime = async () => {
      if (!codWarMonitorEnabled) return;
      setMapRenderDisabled(false);
      const isHeadlessAutomation = typeof navigator !== 'undefined'
        && (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent || ''));
      if (isHeadlessAutomation) {
        if (mounted) {
          setMapRuntime((prev) => ({
            ...prev,
            ready: false,
            loading: false,
            error: 'Map rendering disabled in automation/headless mode. Using list fallback.',
          }));
        }
        return;
      }
      if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
        if (mounted) {
          setMapRuntime((prev) => ({
            ...prev,
            ready: false,
            loading: false,
            error: 'WebGL is unavailable on this browser/device. Showing list fallback.',
          }));
        }
        return;
      }

      try {
        const [mapModule, maplibreModule] = await Promise.all([
          import('react-map-gl/maplibre'),
          import('maplibre-gl'),
        ]);

        if (!mounted) return;
        setMapRuntime({
          ready: true,
          loading: false,
          error: '',
          Map: mapModule.default,
          Source: mapModule.Source,
          Layer: mapModule.Layer,
          NavigationControl: mapModule.NavigationControl,
          maplibregl: maplibreModule.default || maplibreModule,
        });
      } catch (error) {
        if (!mounted) return;
        setMapRuntime((prev) => ({
          ...prev,
          ready: false,
          loading: false,
          error: error?.message || 'Map runtime failed to initialize. Showing list fallback.',
        }));
      }
    };

    loadMapRuntime();
    return () => {
      mounted = false;
    };
  }, [codWarMonitorEnabled]);

  const loadMonitor = useCallback(async () => {
    if (!codWarMonitorEnabled) return;

    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortRef.current = controller;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!layers) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const bundle = await loadMonitorBundlePartial(settings, { signal: controller.signal });
      if (controller.signal.aborted || requestRef.current !== requestId) return;

      if (bundle.data.layers) {
        setLayers(bundle.data.layers);
        const center = bundle.data.layers?.map_hints?.default_center;
        if (center) {
          setViewState((prev) => ({
            ...prev,
            latitude: Number(center.latitude),
            longitude: Number(center.longitude),
            zoom: Number(center.zoom),
          }));
        }
      }
      if (bundle.data.digest) setDigest(bundle.data.digest);
      if (bundle.data.fusion) setFusion(bundle.data.fusion);
      if (bundle.data.freshness) setFreshness(bundle.data.freshness);
      if (bundle.data.brief) setBrief(bundle.data.brief);

      setPanelErrors(bundle.errors || {});
      if (Object.keys(bundle.data || {}).length > 0) {
        setLastUpdated(new Date().toISOString());
        setGlobalError('');
      }

      if (bundle.hasCriticalFailure && !bundle.data?.layers && !bundle.data?.fusion) {
        setGlobalError('Core monitor data is temporarily unavailable. Retry in a moment.');
      }
    } catch (error) {
      if (controller.signal.aborted || requestRef.current !== requestId) return;
      setGlobalError(error?.message || 'Failed to load COD monitor data.');
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [codWarMonitorEnabled, settings, layers]);

  useEffect(() => {
    if (!codWarMonitorEnabled) return undefined;
    const timer = setTimeout(() => {
      loadMonitor();
    }, QUERY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [codWarMonitorEnabled, loadMonitor]);

  useEffect(() => {
    if (!codWarMonitorEnabled) return undefined;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadMonitor();
      }
    }, REFRESH_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadMonitor();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [codWarMonitorEnabled, loadMonitor]);

  useEffect(() => () => {
    if (activeAbortRef.current) {
      activeAbortRef.current.abort();
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
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

  const eventPoints = useMemo(
    () => (Array.isArray(layers?.layers?.event_points) ? layers.layers.event_points.slice(0, 450) : []),
    [layers]
  );
  const locationIntensity = useMemo(
    () => (Array.isArray(layers?.layers?.location_intensity) ? layers.layers.location_intensity.slice(0, 120) : []),
    [layers]
  );
  const announcementLedger = useMemo(
    () => (Array.isArray(layers?.layers?.official_announcement_ledger) ? layers.layers.official_announcement_ledger.slice(0, 80) : []),
    [layers]
  );

  const eventPointGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: eventPoints.map((point) => ({
        type: 'Feature',
        properties: {
          id: point.id,
          location: point.location,
          confidence: Number(point.confidence || 0),
          fatalities_total: Number(point.fatalities_total || 0),
          injured_total: Number(point.injured_total || 0),
        },
        geometry: {
          type: 'Point',
          coordinates: [Number(point.longitude), Number(point.latitude)],
        },
      })),
    }),
    [eventPoints]
  );

  const locationIntensityGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: locationIntensity.map((row) => ({
        type: 'Feature',
        properties: {
          location: row.location,
          hits: Number(row.hits || 0),
        },
        geometry: {
          type: 'Point',
          coordinates: [Number(row.longitude), Number(row.latitude)],
        },
      })),
    }),
    [locationIntensity]
  );

  const activeModeMeta = MONITOR_MODES.find((item) => item.value === monitorMode) || MONITOR_MODES[0];
  const topGaps = useMemo(
    () => (Array.isArray(fusion?.top_gaps) ? fusion.top_gaps.slice(0, 8) : []),
    [fusion]
  );
  const topLocations = useMemo(
    () => (Array.isArray(fusion?.top_locations) ? fusion.top_locations.slice(0, 8) : []),
    [fusion]
  );
  const topTechnologies = useMemo(
    () => (Array.isArray(fusion?.top_technologies) ? fusion.top_technologies.slice(0, 8) : []),
    [fusion]
  );
  const topWeapons = useMemo(
    () => (Array.isArray(fusion?.top_weapons) ? fusion.top_weapons.slice(0, 8) : []),
    [fusion]
  );
  const digestItems = useMemo(
    () => (Array.isArray(digest?.items) ? digest.items : []),
    [digest]
  );
  const digestLens = useMemo(() => {
    if (monitorMode === 'world') {
      return {
        items: digestItems,
        matchedCount: digestItems.length,
        digestText: digest?.digest_text || 'No digest available for this scope.',
      };
    }

    const scored = digestItems
      .map((item) => ({
        item,
        modeScore: computeModeScore(item, monitorMode),
      }))
      .sort((a, b) => b.modeScore - a.modeScore);

    const threshold = monitorMode === 'tech' ? 0.65 : 0.7;
    const focused = scored
      .filter((row) => row.modeScore >= threshold)
      .map((row) => row.item);
    const fallback = scored.slice(0, Math.min(12, scored.length)).map((row) => row.item);
    const items = focused.length ? focused : fallback;

    const digestText = monitorMode === 'tech'
      ? `Tech lens active. Prioritizing systems, cyber, and platform-related intelligence (${focused.length} high-signal matches).`
      : `Finance lens active. Prioritizing market, sanctions, and energy-impact intelligence (${focused.length} high-signal matches).`;

    return {
      items,
      matchedCount: focused.length,
      digestText,
    };
  }, [digest?.digest_text, digestItems, monitorMode]);

  const filteredGaps = useMemo(() => {
    if (monitorMode === 'world') return topGaps;
    const terms = monitorMode === 'tech' ? TECH_KEYWORDS : FINANCE_KEYWORDS;
    const focused = topGaps.filter((gap) => {
      const haystack = `${gap?.dimension || ''} ${gap?.signal || ''} ${(gap?.reasons || []).join(' ')}`.toLowerCase();
      return includesAny(haystack, terms);
    });
    return focused.length ? focused : topGaps;
  }, [monitorMode, topGaps]);

  const secondarySignalRows = useMemo(() => {
    if (monitorMode === 'world') {
      return {
        title: 'Top locations',
        rows: topLocations.map((row) => ({
          key: `loc-${row.location}`,
          label: row.location,
          value: fmtNum(row.hits),
        })),
      };
    }

    if (monitorMode === 'tech') {
      const techRows = topTechnologies.map((row) => ({
        key: `tech-${row.technology}`,
        label: row.technology,
        value: fmtNum(row.count),
      }));
      const weaponRows = topWeapons.map((row) => ({
        key: `weapon-${row.weapon}`,
        label: row.weapon,
        value: fmtNum(row.count),
      }));
      return {
        title: 'Top technologies and weapons',
        rows: [...techRows, ...weaponRows].slice(0, 12),
      };
    }

    return {
      title: 'Top finance headlines',
      rows: digestLens.items.slice(0, 10).map((row, idx) => ({
        key: `fin-${row.id || idx}`,
        label: row.title || 'Untitled',
        value: row.source_name || row.source_tier || 'Source',
      })),
    };
  }, [digestLens.items, monitorMode, topLocations, topTechnologies, topWeapons]);

  const modeAnnouncementLedger = useMemo(() => {
    if (monitorMode === 'world') return announcementLedger;
    const terms = monitorMode === 'tech' ? TECH_KEYWORDS : FINANCE_KEYWORDS;
    const filtered = announcementLedger.filter((row) => {
      const haystack = `${row?.actor || ''} ${row?.text || ''} ${row?.source_name || ''}`.toLowerCase();
      return includesAny(haystack, terms);
    });
    return filtered.length ? filtered : announcementLedger;
  }, [announcementLedger, monitorMode]);

  const modeDigestItems = digestLens.items;
  const briefActions = Array.isArray(brief?.recommended_actions) ? brief.recommended_actions.slice(0, 8) : [];
  const briefFindings = Array.isArray(brief?.key_findings) ? brief.key_findings.slice(0, 8) : [];

  if (flagsLoading) {
    return (
      <div className="cod-war-shell">
        <div className="cod-war-unavailable">
          <div className="cod-war-unavailable-card">
            <h1>Loading COD monitor launch gates…</h1>
            <p>Checking feature availability.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!codWarMonitorEnabled) {
    return (
      <div className="cod-war-shell">
        <SEOHead
          title="Asha News - COD War Monitor"
          description="Immersive map-first conflict monitoring surface."
        />
        <div className="cod-war-unavailable">
          <div className="cod-war-unavailable-card">
            <h1>COD - War Monitor is not enabled yet</h1>
            <p>This feature is gated behind <code>cod_war_monitor_v1</code>. Tactical monitor remains available now.</p>
            <p className="mt-2">Local preview is available via <code>/cod-war-monitor?preview=1</code>.</p>
            <div className="mt-3">
              <a className="cod-war-link" href="/monitor">Back to Tactical Monitor</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const MonitorMap = mapRuntime.Map;
  const Source = mapRuntime.Source;
  const Layer = mapRuntime.Layer;
  const NavigationControl = mapRuntime.NavigationControl;
  const mapReady = mapRuntime.ready && MonitorMap && Source && Layer && NavigationControl;

  return (
    <div className="cod-war-shell">
      <SEOHead
        title="Asha News - COD War Monitor"
        description="Immersive full-page conflict operations monitor with map layers, signal fusion, freshness, digest, and analyst brief."
      />

      <header className="cod-war-topbar">
        <div className="cod-war-brand">
          <div>
            <p className="cod-war-kicker">Conflict Operations Command</p>
            <h1 className="cod-war-title">COD - War Monitor</h1>
            <p className="cod-war-subline">
              Web-first immersive monitor surface optimized for both big screens and mobile operations.
            </p>
            <div className="cod-war-mode-hover">
              <button
                type="button"
                className="cod-war-mode-trigger"
                aria-haspopup="menu"
                aria-label="Monitor sections"
              >
                {activeModeMeta.label} Monitor
              </button>
              <div className="cod-war-mode-flyout" role="menu" aria-label="WorldMonitor tabs">
                {MONITOR_MODES.map((mode) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={monitorMode === mode.value}
                    key={mode.value}
                    className={`cod-war-mode-item ${monitorMode === mode.value ? 'active' : ''}`}
                    onClick={() => setMonitorMode(mode.value)}
                  >
                    <span>{mode.label}</span>
                    <small>{mode.description}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="cod-war-quick-stats">
            <div className="cod-war-chip">
              <div className="cod-war-chip-label">Fusion</div>
              <div className="cod-war-chip-value">{fmtPct(fusion?.fusion_score || 0)}</div>
            </div>
            <div className="cod-war-chip">
              <div className="cod-war-chip-label">Freshness</div>
              <div className="cod-war-chip-value">{fmtPct(freshness?.freshness_score || 0)}</div>
            </div>
          </div>
        </div>

        <div className="cod-war-controls">
          <div className="cod-war-control-grid">
            <label className="cod-war-field">
              <span className="cod-war-field-label">Conflict Scope</span>
              <select
                className="cod-war-select"
                value={settings.conflict}
                onChange={(event) => setSettings((prev) => ({ ...prev, conflict: event.target.value }))}
              >
                {CONFLICT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="cod-war-field">
              <span className="cod-war-field-label">Verification</span>
              <select
                className="cod-war-select"
                value={settings.verification}
                onChange={(event) => setSettings((prev) => ({ ...prev, verification: event.target.value }))}
              >
                {VERIFICATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="cod-war-field">
              <span className="cod-war-field-label">Window</span>
              <select
                className="cod-war-select"
                value={settings.days}
                onChange={(event) => setSettings((prev) => ({ ...prev, days: Number(event.target.value) }))}
              >
                {DAY_OPTIONS.map((value) => (
                  <option key={value} value={value}>Last {value} days</option>
                ))}
              </select>
            </label>

            <label className="cod-war-field">
              <span className="cod-war-field-label">Source Tier</span>
              <select
                className="cod-war-select"
                value={settings.sourceTier}
                onChange={(event) => setSettings((prev) => ({ ...prev, sourceTier: event.target.value }))}
              >
                {SOURCE_TIER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="cod-war-field">
              <span className="cod-war-field-label">Actions</span>
              <div className="flex flex-wrap gap-2">
                <button className="cod-war-button solid" onClick={loadMonitor} disabled={loading || refreshing}>
                  {loading || refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                <button className="cod-war-button ghost" onClick={() => setCommandOpen(true)}>
                  Command Palette
                </button>
                <Link className="cod-war-link" to="/monitor">
                  Back to Tactical Monitor
                </Link>
              </div>
            </div>
          </div>

          <div className="cod-war-meta">
            <span>Mode: {activeModeMeta.label}</span>
            <span>Preset: {preset}</span>
            <span>Auto-refresh: 3 min (visibility-aware)</span>
            <span>Last refresh: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not yet'}</span>
            <span>Map points: {fmtNum(eventPoints.length)}</span>
            {(monitorMode === 'tech' || monitorMode === 'finance') && (
              <span>Lens matches: {fmtNum(digestLens.matchedCount)}</span>
            )}
          </div>
        </div>

        {globalError && <div className="cod-war-feedback">{globalError}</div>}
      </header>

      <main className={`cod-war-workspace preset-${preset}`}>
        <section className="cod-war-panel cod-war-map-panel">
          <div className="cod-war-panel-head">
            <h2>Monitor Layers</h2>
            <span className={`cod-war-tag ${freshness?.status || 'low'}`}>{(freshness?.status || 'unknown').toUpperCase()}</span>
          </div>

          {mapReady && !mapRenderDisabled ? (
            <div className="cod-war-map-wrap">
              <MapSafetyBoundary
                onError={(error) => {
                  setMapRenderDisabled(true);
                  setMapRuntime((prev) => ({
                    ...prev,
                    error: error?.message || 'Map rendering failed in this environment. Using list fallback.',
                  }));
                }}
                fallback={<div className="cod-war-map-fallback">Map rendering failed. Using list fallback.</div>}
              >
                <MonitorMap
                  mapLib={mapRuntime.maplibregl}
                  mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                  attributionControl={false}
                  latitude={viewState.latitude}
                  longitude={viewState.longitude}
                  zoom={viewState.zoom}
                  pitch={viewState.pitch}
                  bearing={viewState.bearing}
                  onMove={(event) => {
                    const nextView = event.viewState || {};
                    setViewState((prev) => ({
                      ...prev,
                      latitude: Number(nextView?.latitude ?? prev.latitude),
                      longitude: Number(nextView?.longitude ?? prev.longitude),
                      zoom: Number(nextView?.zoom ?? prev.zoom),
                      pitch: Number(nextView?.pitch ?? prev.pitch),
                      bearing: Number(nextView?.bearing ?? prev.bearing),
                    }));
                  }}
                  reuseMaps
                >
                  <Source id="cod-location-intensity-source" type="geojson" data={locationIntensityGeoJson}>
                    <Layer
                      id="cod-location-intensity-layer"
                      type="circle"
                      paint={{
                        'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'hits'], 0], 1, 4, 8, 10, 20, 16, 50, 22],
                        'circle-color': '#f97316',
                        'circle-opacity': 0.34,
                        'circle-stroke-color': '#fdba74',
                        'circle-stroke-width': 1.2,
                      }}
                    />
                  </Source>

                  <Source id="cod-event-points-source" type="geojson" data={eventPointGeoJson}>
                    <Layer
                      id="cod-event-points-layer"
                      type="circle"
                      paint={{
                        'circle-radius': [
                          '+',
                          4,
                          ['*', 0.55, ['coalesce', ['get', 'fatalities_total'], 0]],
                          ['*', 0.15, ['coalesce', ['get', 'injured_total'], 0]],
                        ],
                        'circle-color': [
                          'case',
                          ['>=', ['coalesce', ['get', 'confidence'], 0], 0.8], '#2dd4bf',
                          ['>=', ['coalesce', ['get', 'confidence'], 0], 0.5], '#38bdf8',
                          '#0ea5e9',
                        ],
                        'circle-opacity': [
                          'interpolate',
                          ['linear'],
                          ['coalesce', ['get', 'confidence'], 0],
                          0, 0.35,
                          1, 0.86,
                        ],
                        'circle-stroke-color': '#082033',
                        'circle-stroke-width': 1,
                      }}
                    />
                  </Source>

                  <NavigationControl position="bottom-right" />
                </MonitorMap>
              </MapSafetyBoundary>
            </div>
          ) : (
            <div className="cod-war-map-fallback">
              {mapRuntime.loading
                ? 'Loading map runtime…'
                : mapRuntime.error || 'Map disabled. Showing list fallback.'}
            </div>
          )}

          {(panelErrors.layers || panelErrors.freshness) && (
            <div className="cod-war-panel-error">
              {panelErrors.layers || panelErrors.freshness}
            </div>
          )}

          <details className="cod-war-mobile-details" open={!isPhone}>
            <summary>Official announcement ledger ({activeModeMeta.label})</summary>
            <VirtualList
              items={modeAnnouncementLedger}
              rowHeight={56}
              height={isPhone ? 240 : 290}
              keyField="id"
              emptyText="No official announcements for this scope."
              renderRow={(item) => (
                <>
                  <span>{item?.actor || 'Actor'} · {String(item?.date || '').slice(0, 10)}</span>
                  <span>{item?.source_name || '—'}</span>
                </>
              )}
            />
          </details>
        </section>

        <section className="cod-war-panel cod-war-panel-fusion">
          <div className="cod-war-panel-head">
            <h2>Signal Fusion</h2>
            <span className={`cod-war-tag ${fusion?.confidence_label || 'low'}`}>
              {(fusion?.confidence_label || 'unknown').toUpperCase()}
            </span>
          </div>

          <div className="cod-war-stat-grid">
            <div className="cod-war-stat-card">
              <div className="cod-war-stat-label">Signal Strength</div>
              <div className="cod-war-stat-value">{fmtPct(fusion?.components?.signal_strength || 0)}</div>
            </div>
            <div className="cod-war-stat-card">
              <div className="cod-war-stat-label">Gap Penalty</div>
              <div className="cod-war-stat-value">{fmtPct(fusion?.components?.gap_penalty || 0)}</div>
            </div>
          </div>

          <h3 className="cod-war-kicker mt-3">{monitorMode === 'world' ? 'Top Gaps' : `${activeModeMeta.label} Gaps`}</h3>
          <ul className="cod-war-list">
            {filteredGaps.map((gap) => (
              <li key={`${gap.dimension}-${gap.signal}`}>
                <span>{gap.dimension}: {gap.signal}</span>
                <span className={`cod-war-tag ${gap.severity}`}>{gap.severity}</span>
              </li>
            ))}
            {!filteredGaps.length && <li><span>No high-priority gaps detected.</span></li>}
          </ul>

          <details className="cod-war-mobile-details" open={!isPhone}>
            <summary>{secondarySignalRows.title}</summary>
            <ul className="cod-war-list">
              {secondarySignalRows.rows.map((row) => (
                <li key={row.key}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </li>
              ))}
              {!secondarySignalRows.rows.length && <li><span>No signals detected for this lens yet.</span></li>}
            </ul>
          </details>

          {panelErrors.fusion && <div className="cod-war-panel-error">{panelErrors.fusion}</div>}
        </section>

        <section className="cod-war-panel cod-war-panel-digest">
          <div className="cod-war-panel-head">
            <h2>Ranked News Digest</h2>
            <span>{fmtNum(modeDigestItems.length)} items</span>
          </div>
          <p className="cod-war-digest-text">{digestLens.digestText}</p>

          <VirtualList
            items={modeDigestItems}
            rowHeight={70}
            height={isPhone ? 260 : 340}
            keyField="id"
            emptyText="No ranked digest items are available."
            renderRow={(item) => (
              <>
                <span>
                  <a href={item?.source_url || '#'} target="_blank" rel="noreferrer">
                    {item?.title || 'Untitled'}
                  </a>
                </span>
                <span>{item?.source_name || item?.source_tier || 'Source'}</span>
              </>
            )}
          />

          {panelErrors.digest && <div className="cod-war-panel-error">{panelErrors.digest}</div>}
        </section>

        <section className="cod-war-panel cod-war-panel-brief">
          <div className="cod-war-panel-head">
            <h2>Intel Brief</h2>
            <span className={`cod-war-tag ${brief?.confidence_label || 'low'}`}>
              {(brief?.confidence_label || 'unknown').toUpperCase()}
            </span>
          </div>

          <p className="cod-war-digest-text">{brief?.non_deterministic_label || 'Analyst outputs are probabilistic and non-deterministic.'}</p>

          <details className="cod-war-mobile-details" open={!isPhone}>
            <summary>Key findings</summary>
            <ul className="cod-war-list">
              {briefFindings.map((finding) => (
                <li key={finding}>
                  <span>{finding}</span>
                </li>
              ))}
              {!briefFindings.length && <li><span>No findings generated for this scope.</span></li>}
            </ul>
          </details>

          <details className="cod-war-mobile-details" open={!isPhone}>
            <summary>Recommended actions</summary>
            <ul className="cod-war-list">
              {briefActions.map((action) => (
                <li key={`${action.priority}-${action.action}`}>
                  <span>{action.action}</span>
                  <span className={`cod-war-tag ${action.priority}`}>{action.priority}</span>
                </li>
              ))}
              {!briefActions.length && <li><span>No recommended actions available.</span></li>}
            </ul>
          </details>

          {panelErrors.brief && <div className="cod-war-panel-error">{panelErrors.brief}</div>}
        </section>
      </main>

      {commandOpen && (
        <div className="cod-war-command-overlay" onClick={() => setCommandOpen(false)}>
          <div className="cod-war-command-panel" onClick={(event) => event.stopPropagation()}>
            <h3>Docking Presets</h3>
            {PRESETS.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setPreset(item);
                  setCommandOpen(false);
                }}
              >
                {item === 'map-signals' ? 'Map + Signals' : item === 'map-brief' ? 'Map + Intel Brief' : 'Dense Grid'}
              </button>
            ))}
            <h3>WorldMonitor Tabs</h3>
            {MONITOR_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => {
                  setMonitorMode(mode.value);
                  setCommandOpen(false);
                }}
              >
                {mode.label}
              </button>
            ))}
            <h3>Quick Scope</h3>
            {CONFLICT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSettings((prev) => ({ ...prev, conflict: option.value }));
                  setCommandOpen(false);
                }}
              >
                Scope: {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CodWarMonitorPage = () => (
  <CodWarMonitorBoundary>
    <CodWarMonitorCore />
  </CodWarMonitorBoundary>
);

export default CodWarMonitorPage;
