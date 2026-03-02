import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import { API_BASE, API_SERVER } from '../config/api';

const CONFLICT_OPTIONS = [
  { value: 'gaza-israel', label: 'Gaza vs Israel' },
  { value: 'israel-us-iran', label: 'Israel/US vs Iran' },
  { value: 'all', label: 'All tracked conflicts' },
];

const COMPARE_MODES = [
  { value: 'conflict-vs-conflict', label: 'Conflict vs Conflict' },
  { value: 'actor-vs-actor', label: 'Actor vs Actor' },
];

const ACTOR_OPTIONS = [
  'Israel',
  'Hamas',
  'Gaza Authorities',
  'Iran',
  'United States',
  'Hezbollah',
  'UN',
];

const DAYS_OPTIONS = [7, 14, 30, 90, 180];
const VERIFICATION_OPTIONS = [
  { value: 'verified', label: 'Verified Only' },
  { value: 'all', label: 'All Reports' },
  { value: 'unverified', label: 'Unverified Only' },
];

const SOURCE_TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'official', label: 'Official' },
  { value: 'wire', label: 'Wire' },
  { value: 'major', label: 'Major' },
  { value: 'other', label: 'Other' },
];

const OVERLAY_METRICS = [
  { value: 'events', label: 'Events' },
  { value: 'fatalities_total', label: 'Fatalities' },
  { value: 'injured_total', label: 'Injured' },
  { value: 'ids_released_count', label: 'IDs Released' },
  { value: 'official_announcements', label: 'Official Announcements' },
];

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const fmt = (value) => Number(value || 0).toLocaleString();
const fmtPct = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const scoreToPct = (value, max) => {
  const safeMax = Math.max(1, Number(max || 0));
  const safeVal = Math.max(0, Number(value || 0));
  return Math.min(100, (safeVal / safeMax) * 100);
};

const aggregateActorTimeline = (events = [], actor = '') => {
  const normalizedActor = String(actor || '').trim().toLowerCase();
  if (!normalizedActor) return [];

  const byDate = new Map();
  events.forEach((event) => {
    const actors = Array.isArray(event?.actors) ? event.actors : [];
    const match = actors.some((item) => String(item || '').toLowerCase() === normalizedActor);
    if (!match) return;

    const date = String(event?.event_date || '').slice(0, 10);
    if (!date) return;

    const entry = byDate.get(date) || {
      date,
      events: 0,
      fatalities_total: 0,
      injured_total: 0,
      ids_released_count: 0,
      official_announcements: 0,
    };
    entry.events += 1;
    entry.fatalities_total += Number(event?.fatalities_total || 0);
    entry.injured_total += Number(event?.injured_total || 0);
    entry.ids_released_count += Number(event?.ids_released_count || 0);
    entry.official_announcements += event?.official_announcement_text ? 1 : 0;
    byDate.set(date, entry);
  });

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const themeMap = {
  dark: {
    background: 'linear-gradient(120deg, #080d15 0%, #0e1724 38%, #0c1b2d 100%)',
    panel: 'rgba(16, 27, 41, 0.92)',
    panelAlt: 'rgba(11, 22, 35, 0.95)',
    border: 'rgba(69, 95, 126, 0.45)',
    text: '#d8e6ff',
    subtext: '#8fa7c7',
    accent: '#2dd4bf',
    accentSoft: 'rgba(45, 212, 191, 0.2)',
    warning: '#f59e0b',
  },
  light: {
    background: 'linear-gradient(125deg, #edf2fa 0%, #f7fbff 45%, #e8f4f1 100%)',
    panel: 'rgba(255, 255, 255, 0.95)',
    panelAlt: 'rgba(247, 252, 255, 0.95)',
    border: 'rgba(81, 101, 127, 0.24)',
    text: '#10243c',
    subtext: '#526783',
    accent: '#0f766e',
    accentSoft: 'rgba(15, 118, 110, 0.14)',
    warning: '#b45309',
  },
};

async function fetchJson(url, fallback = null) {
  try {
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

const LegacyConflictMonitor = () => {
  const [conflict, setConflict] = useState('gaza-israel');
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        conflict,
        days: String(days),
        verification: 'verified',
        limit: '300',
      });

      const [statsJson, eventsJson] = await Promise.all([
        fetchJson(`${API_BASE}/conflicts/stats?${params.toString()}`, null),
        fetchJson(`${API_BASE}/conflicts/events?${params.toString()}`, []),
      ]);

      if (!statsJson) {
        throw new Error('Failed to load conflict analytics');
      }

      setStats(statsJson || null);
      setEvents(Array.isArray(eventsJson) ? eventsJson : []);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to load conflict analytics');
      setStats(null);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [conflict, days]);

  useEffect(() => {
    load();
  }, [load]);

  const topActors = useMemo(
    () => Array.isArray(stats?.actor_comparisons) ? stats.actor_comparisons.slice(0, 8) : [],
    [stats]
  );
  const maxActorEvents = useMemo(
    () => Math.max(1, ...topActors.map((actor) => Number(actor.events || 0))),
    [topActors]
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4">
      <section className="rounded-2xl border border-border-light dark:border-border-dark bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white">
        <h1 className="text-2xl font-bold">Conflict Monitor (Legacy)</h1>
        <p className="mt-2 text-sm opacity-90">
          Tactical dashboard feature flag is off. This is the legacy verified monitor view.
        </p>
        <div className="mt-3">
          <a
            href="/wiki/conflict-ops"
            className="inline-flex rounded-md border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
          >
            Methodology and Documentation
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">Conflict</span>
            <select
              value={conflict}
              onChange={(e) => setConflict(e.target.value)}
              className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm"
            >
              {CONFLICT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">Window</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm"
            >
              {DAYS_OPTIONS.map((d) => (
                <option key={d} value={d}>Last {d} days</option>
              ))}
            </select>
          </label>

          <button
            onClick={load}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Refresh
          </button>

          <div className="ml-auto text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Last refresh: {lastRefresh ? formatDate(lastRefresh) : 'Not yet'}
          </div>
        </div>
      </section>

      {loading && (
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-6">
          Loading conflict analytics...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">Events</div>
              <div className="mt-2 text-2xl font-bold">{fmt(stats?.totals?.events)}</div>
            </div>
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">Fatalities</div>
              <div className="mt-2 text-2xl font-bold">{fmt(stats?.totals?.fatalities_total)}</div>
            </div>
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">Injured</div>
              <div className="mt-2 text-2xl font-bold">{fmt(stats?.totals?.injured_total)}</div>
            </div>
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">IDs Released</div>
              <div className="mt-2 text-2xl font-bold">{fmt(stats?.totals?.ids_released_count)}</div>
            </div>
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">Official Statements</div>
              <div className="mt-2 text-2xl font-bold">{fmt(stats?.totals?.official_announcements)}</div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <h2 className="text-lg font-semibold">Actor Comparison</h2>
              <div className="mt-3 space-y-3">
                {topActors.length === 0 && (
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">No actor comparison data.</div>
                )}
                {topActors.map((actor) => (
                  <div key={actor.actor} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{actor.actor}</span>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">
                        {fmt(actor.events)} events | {fmt(actor.fatalities_total)} fatalities
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-primary-600"
                        style={{ width: `${scoreToPct(actor.events, maxActorEvents)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <h2 className="text-lg font-semibold">Timeline</h2>
              <div className="mt-3 max-h-[320px] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-secondary-light dark:text-text-secondary-dark">
                      <th className="py-1">Date</th>
                      <th className="py-1">Events</th>
                      <th className="py-1">Fatalities</th>
                      <th className="py-1">Injured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.timeline || []).slice(-30).map((row) => (
                      <tr key={row.date} className="border-t border-border-light dark:border-border-dark">
                        <td className="py-1">{row.date}</td>
                        <td className="py-1">{fmt(row.events)}</td>
                        <td className="py-1">{fmt(row.fatalities_total)}</td>
                        <td className="py-1">{fmt(row.injured_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <h3 className="text-base font-semibold">Hit Locations</h3>
              <div className="mt-2 space-y-1 text-sm">
                {(stats?.locations_hit || []).slice(0, 10).map((item) => (
                  <div key={item.location} className="flex items-center justify-between">
                    <span>{item.location}</span>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">{fmt(item.hits)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <h3 className="text-base font-semibold">Weapons Mentioned</h3>
              <div className="mt-2 space-y-1 text-sm">
                {(stats?.weapon_usage || []).slice(0, 10).map((item) => (
                  <div key={item.weapon} className="flex items-center justify-between">
                    <span className="capitalize">{item.weapon}</span>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">{fmt(item.count)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
              <h3 className="text-base font-semibold">Technologies Mentioned</h3>
              <div className="mt-2 space-y-1 text-sm">
                {(stats?.technology_usage || []).slice(0, 10).map((item) => (
                  <div key={item.technology} className="flex items-center justify-between">
                    <span className="capitalize">{item.technology}</span>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">{fmt(item.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
            <h2 className="text-lg font-semibold">Recent Event Log</h2>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="text-left text-text-secondary-light dark:text-text-secondary-dark">
                    <th className="py-1">Date</th>
                    <th className="py-1">Conflict</th>
                    <th className="py-1">Actors</th>
                    <th className="py-1">Fatalities</th>
                    <th className="py-1">Injured</th>
                    <th className="py-1">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 40).map((event) => (
                    <tr key={event.id} className="border-t border-border-light dark:border-border-dark align-top">
                      <td className="py-2">{formatDate(event.event_date)}</td>
                      <td className="py-2">{event.conflict}</td>
                      <td className="py-2">{(event.actors || []).join(', ') || '—'}</td>
                      <td className="py-2">{fmt(event.fatalities_total)}</td>
                      <td className="py-2">{fmt(event.injured_total)}</td>
                      <td className="py-2">{event.source_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const TacticalConflictDashboard = () => {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('overview');
  const [conflict, setConflict] = useState('gaza-israel');
  const [days, setDays] = useState(30);
  const [verification, setVerification] = useState('verified');
  const [sourceTier, setSourceTier] = useState('all');
  const [compareMode, setCompareMode] = useState('conflict-vs-conflict');
  const [compareLeft, setCompareLeft] = useState('gaza-israel');
  const [compareRight, setCompareRight] = useState('israel-us-iran');
  const [overlayMetric, setOverlayMetric] = useState('fatalities_total');

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [compareSeries, setCompareSeries] = useState({ left: [], right: [] });
  const [relatedNews, setRelatedNews] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [theories, setTheories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState('');

  const palette = themeMap[theme] || themeMap.dark;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const baseParams = new URLSearchParams({
        conflict,
        days: String(days),
        verification,
        source_tier: sourceTier,
        limit: '300',
      });

      const statsParams = new URLSearchParams(baseParams);
      statsParams.set('compare_mode', compareMode);
      statsParams.set('compare_left', compareLeft);
      statsParams.set('compare_right', compareRight);

      const [statsData, eventsData, newsData, forecastData, theoryData] = await Promise.all([
        fetchJson(`${API_BASE}/conflicts/stats?${statsParams.toString()}`, null),
        fetchJson(`${API_BASE}/conflicts/events?${baseParams.toString()}&include_identities=true`, []),
        fetchJson(`${API_BASE}/conflicts/related-news?${baseParams.toString()}&limit=24`, { items: [] }),
        fetchJson(`${API_BASE}/conflicts/forecasts?conflict=${encodeURIComponent(conflict)}&limit=8`, []),
        fetchJson(`${API_BASE}/conflicts/theories?conflict=${encodeURIComponent(conflict)}&limit=8`, []),
      ]);

      if (!statsData) {
        throw new Error('Conflict stats are unavailable');
      }

      let leftSeries = [];
      let rightSeries = [];
      if (compareMode === 'conflict-vs-conflict') {
        const buildScopeParams = (scope) => {
          const scoped = new URLSearchParams({
            conflict: scope,
            days: String(days),
            verification,
            source_tier: sourceTier,
            limit: '600',
          });
          return scoped.toString();
        };

        const [leftStats, rightStats] = await Promise.all([
          fetchJson(`${API_BASE}/conflicts/stats?${buildScopeParams(compareLeft)}`, null),
          fetchJson(`${API_BASE}/conflicts/stats?${buildScopeParams(compareRight)}`, null),
        ]);

        leftSeries = Array.isArray(leftStats?.timeline) ? leftStats.timeline : [];
        rightSeries = Array.isArray(rightStats?.timeline) ? rightStats.timeline : [];
      } else {
        const safeEvents = Array.isArray(eventsData) ? eventsData : [];
        leftSeries = aggregateActorTimeline(safeEvents, compareLeft);
        rightSeries = aggregateActorTimeline(safeEvents, compareRight);
      }

      setStats(statsData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setCompareSeries({ left: leftSeries, right: rightSeries });
      setRelatedNews(Array.isArray(newsData?.items) ? newsData.items : []);
      setForecasts(Array.isArray(forecastData) ? forecastData : []);
      setTheories(Array.isArray(theoryData) ? theoryData : []);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to load conflict operations dashboard');
      setStats(null);
      setEvents([]);
      setCompareSeries({ left: [], right: [] });
      setRelatedNews([]);
      setForecasts([]);
      setTheories([]);
    } finally {
      setLoading(false);
    }
  }, [conflict, days, verification, sourceTier, compareMode, compareLeft, compareRight]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        load();
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load();
      }
    }, REFRESH_INTERVAL_MS);

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  useEffect(() => {
    if (compareMode === 'conflict-vs-conflict') {
      if (!CONFLICT_OPTIONS.some((opt) => opt.value === compareLeft)) {
        setCompareLeft('gaza-israel');
      }
      if (!CONFLICT_OPTIONS.some((opt) => opt.value === compareRight)) {
        setCompareRight('israel-us-iran');
      }
    } else {
      if (!ACTOR_OPTIONS.includes(compareLeft)) {
        setCompareLeft('Israel');
      }
      if (!ACTOR_OPTIONS.includes(compareRight)) {
        setCompareRight('Iran');
      }
    }
  }, [compareMode, compareLeft, compareRight]);

  const topActors = useMemo(
    () => Array.isArray(stats?.actor_comparisons) ? stats.actor_comparisons.slice(0, 10) : [],
    [stats]
  );

  const maxActorEvents = useMemo(
    () => Math.max(1, ...topActors.map((actor) => Number(actor.events || 0))),
    [topActors]
  );

  const timeline = useMemo(
    () => Array.isArray(stats?.timeline) ? stats.timeline.slice(-24) : [],
    [stats]
  );

  const maxTimelineEvents = useMemo(
    () => Math.max(1, ...timeline.map((row) => Number(row.events || 0))),
    [timeline]
  );

  const comparison = stats?.comparison || null;
  const overlayRows = useMemo(() => {
    const leftRows = Array.isArray(compareSeries?.left) ? compareSeries.left : [];
    const rightRows = Array.isArray(compareSeries?.right) ? compareSeries.right : [];
    const byDate = new Map();

    leftRows.forEach((row) => {
      const date = String(row?.date || '').slice(0, 10);
      if (!date) return;
      const entry = byDate.get(date) || { date, left: 0, right: 0 };
      entry.left = Number(row?.[overlayMetric] || 0);
      byDate.set(date, entry);
    });

    rightRows.forEach((row) => {
      const date = String(row?.date || '').slice(0, 10);
      if (!date) return;
      const entry = byDate.get(date) || { date, left: 0, right: 0 };
      entry.right = Number(row?.[overlayMetric] || 0);
      byDate.set(date, entry);
    });

    return [...byDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-24);
  }, [compareSeries, overlayMetric]);

  const overlayMax = useMemo(
    () => Math.max(1, ...overlayRows.map((row) => Math.max(row.left, row.right))),
    [overlayRows]
  );

  return (
    <div
      className="mx-auto w-full max-w-[1500px] space-y-4 px-3 py-4 md:px-5"
      style={{
        background: palette.background,
        color: palette.text,
        borderRadius: '1.25rem',
        fontFamily: '"Chakra Petch", "Space Grotesk", "IBM Plex Sans", sans-serif',
      }}
    >
      <section
        className="overflow-hidden rounded-2xl border p-5"
        style={{ borderColor: palette.border, background: palette.panelAlt }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em]" style={{ color: palette.subtext }}>
              Conflict Operations Command
            </div>
            <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Tactical Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm" style={{ color: palette.subtext }}>
              Verified-first intelligence board for conflict comparisons, source-attributed metrics, and analyst hypotheses.
            </p>
            <a
              href="/wiki/conflict-ops"
              className="mt-3 inline-flex rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{
                border: `1px solid ${palette.border}`,
                color: palette.text,
                background: palette.accentSoft,
              }}
            >
              Methodology and Wiki
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                border: `1px solid ${palette.border}`,
                background: activeTab === 'overview' ? palette.accentSoft : 'transparent',
                color: palette.text,
              }}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('analyst')}
              className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                border: `1px solid ${palette.border}`,
                background: activeTab === 'analyst' ? palette.accentSoft : 'transparent',
                color: palette.text,
              }}
            >
              Analyst
            </button>
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border p-4"
        style={{ borderColor: palette.border, background: palette.panel }}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: palette.subtext }}>Conflict Scope</span>
            <select
              value={conflict}
              onChange={(e) => setConflict(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
            >
              {CONFLICT_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: palette.subtext }}>Comparison</span>
            <select
              value={compareMode}
              onChange={(e) => setCompareMode(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
            >
              {COMPARE_MODES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: palette.subtext }}>Left</span>
            <select
              value={compareLeft}
              onChange={(e) => setCompareLeft(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
            >
              {(compareMode === 'actor-vs-actor' ? ACTOR_OPTIONS : CONFLICT_OPTIONS.map((item) => item.value)).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: palette.subtext }}>Right</span>
            <select
              value={compareRight}
              onChange={(e) => setCompareRight(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
            >
              {(compareMode === 'actor-vs-actor' ? ACTOR_OPTIONS : CONFLICT_OPTIONS.map((item) => item.value)).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: palette.subtext }}>Verification</span>
            <select
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
            >
              {VERIFICATION_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: palette.subtext }}>Window</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
            >
              {DAYS_OPTIONS.map((d) => (
                <option key={d} value={d}>Last {d} days</option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              onClick={load}
              className="rounded-lg px-3 py-2 text-sm font-semibold"
              style={{ border: `1px solid ${palette.accent}`, background: palette.accentSoft, color: palette.text }}
            >
              Refresh
            </button>
            <button
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${palette.border}`, background: 'transparent', color: palette.text }}
            >
              {theme === 'dark' ? 'Light Board' : 'Dark Command'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs" style={{ color: palette.subtext }}>
          <span>Source Tier Filter</span>
          <select
            value={sourceTier}
            onChange={(e) => setSourceTier(e.target.value)}
            className="rounded-md px-2 py-1 text-xs"
            style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
          >
            {SOURCE_TIER_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <span>Auto-refresh every 10 min (visibility-aware)</span>
          <span>Last refresh: {lastRefresh ? formatDate(lastRefresh) : 'Not yet'}</span>
        </div>
      </section>

      {loading && (
        <section className="rounded-2xl border p-5 text-sm" style={{ borderColor: palette.border, background: palette.panel }}>
          Loading tactical dataset...
        </section>
      )}

      {error && (
        <section className="rounded-2xl border p-4 text-sm" style={{ borderColor: '#ef4444', background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
          {error}
        </section>
      )}

      {!loading && !error && activeTab === 'overview' && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: 'Events', value: fmt(stats?.totals?.events) },
              { label: 'Fatalities', value: fmt(stats?.totals?.fatalities_total) },
              { label: 'Injured', value: fmt(stats?.totals?.injured_total) },
              { label: 'IDs Released', value: fmt(stats?.totals?.ids_released_count) },
              { label: 'Official Announcements', value: fmt(stats?.totals?.official_announcements) },
              {
                label: 'Verified Share',
                value: stats?.data_quality?.verified_events
                  ? `${Math.round((stats.data_quality.verified_events / Math.max(1, stats.totals.events)) * 100)}%`
                  : '0%',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border p-4"
                style={{ borderColor: palette.border, background: palette.panel }}
              >
                <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: palette.subtext }}>{item.label}</div>
                <div className="mt-2 text-2xl font-semibold">{item.value}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
              <h2 className="text-lg font-semibold">Timeline Intensity</h2>
              <div className="mt-3 space-y-2">
                {timeline.map((row) => (
                  <div key={row.date} className="grid grid-cols-[96px_1fr_auto] items-center gap-2 text-xs">
                    <span style={{ color: palette.subtext }}>{row.date}</span>
                    <div className="h-2 rounded-full" style={{ background: palette.accentSoft }}>
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${scoreToPct(row.events, maxTimelineEvents)}%`, background: palette.accent }}
                      />
                    </div>
                    <span>{fmt(row.events)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
              <h2 className="text-lg font-semibold">Comparison Snapshot</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border p-3" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                  <div className="text-xs uppercase" style={{ color: palette.subtext }}>{comparison?.left || 'Left'}</div>
                  <div className="mt-1 text-sm">Events: {fmt(comparison?.left_metrics?.events)}</div>
                  <div className="text-sm">Fatalities: {fmt(comparison?.left_metrics?.fatalities_total)}</div>
                  <div className="text-sm">Injured: {fmt(comparison?.left_metrics?.injured_total)}</div>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                  <div className="text-xs uppercase" style={{ color: palette.subtext }}>{comparison?.right || 'Right'}</div>
                  <div className="mt-1 text-sm">Events: {fmt(comparison?.right_metrics?.events)}</div>
                  <div className="text-sm">Fatalities: {fmt(comparison?.right_metrics?.fatalities_total)}</div>
                  <div className="text-sm">Injured: {fmt(comparison?.right_metrics?.injured_total)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Comparative Trend Overlay</h2>
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: palette.subtext }}>Metric</span>
                <select
                  value={overlayMetric}
                  onChange={(e) => setOverlayMetric(e.target.value)}
                  className="rounded-md px-2 py-1 text-xs"
                  style={{ border: `1px solid ${palette.border}`, background: palette.panelAlt, color: palette.text }}
                >
                  {OVERLAY_METRICS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: palette.subtext }}>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: '#22d3ee' }} />
                {comparison?.left || compareLeft}
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: '#fb923c' }} />
                {comparison?.right || compareRight}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {overlayRows.length === 0 && (
                <div className="text-sm" style={{ color: palette.subtext }}>
                  No comparative trend points available for this scope.
                </div>
              )}
              {overlayRows.map((row) => (
                <div key={row.date} className="grid grid-cols-[88px_1fr] gap-3 text-xs">
                  <span style={{ color: palette.subtext }}>{row.date}</span>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full" style={{ background: palette.accentSoft }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${scoreToPct(row.left, overlayMax)}%`, background: '#22d3ee' }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: palette.accentSoft }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${scoreToPct(row.right, overlayMax)}%`, background: '#fb923c' }}
                      />
                    </div>
                    <div className="flex justify-between" style={{ color: palette.subtext }}>
                      <span>{fmt(row.left)}</span>
                      <span>{fmt(row.right)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
              <h3 className="text-base font-semibold">Actor Comparison</h3>
              <div className="mt-3 space-y-2">
                {topActors.slice(0, 8).map((actor) => (
                  <div key={actor.actor}>
                    <div className="flex items-center justify-between text-xs">
                      <span>{actor.actor}</span>
                      <span style={{ color: palette.subtext }}>{fmt(actor.events)} events</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full" style={{ background: palette.accentSoft }}>
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${scoreToPct(actor.events, maxActorEvents)}%`, background: palette.accent }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
              <h3 className="text-base font-semibold">Location Intensity</h3>
              <div className="mt-3 space-y-2 text-sm">
                {(stats?.locations_hit || []).slice(0, 12).map((item) => (
                  <div key={item.location} className="flex items-center justify-between">
                    <span>{item.location}</span>
                    <span style={{ color: palette.subtext }}>{fmt(item.hits)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
              <h3 className="text-base font-semibold">Weapon / Tech Ranking</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="mb-1 text-xs uppercase" style={{ color: palette.subtext }}>Weapons</div>
                  {(stats?.weapon_usage || []).slice(0, 8).map((item) => (
                    <div key={item.weapon} className="flex items-center justify-between py-0.5">
                      <span className="capitalize">{item.weapon}</span>
                      <span>{fmt(item.count)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase" style={{ color: palette.subtext }}>Technology</div>
                  {(stats?.technology_usage || []).slice(0, 8).map((item) => (
                    <div key={item.technology} className="flex items-center justify-between py-0.5">
                      <span className="capitalize">{item.technology}</span>
                      <span>{fmt(item.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
              <h3 className="text-base font-semibold">Official Announcements</h3>
              <div className="mt-3 space-y-3">
                {(stats?.official_announcements || []).slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-xl border p-3" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                    <div className="text-xs" style={{ color: palette.subtext }}>
                      {formatDate(item.date)} | {item.actor || 'Unknown'} | {item.source_tier || 'other'}
                    </div>
                    <p className="mt-1 text-sm">{item.text}</p>
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs"
                        style={{ color: palette.accent }}
                      >
                        {item.source_name || 'Source'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
              <h3 className="text-base font-semibold">Latest Related News</h3>
              <div className="mt-3 space-y-3">
                {relatedNews.slice(0, 10).map((item) => (
                  <div key={item.id || item.title} className="rounded-xl border p-3" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                    <div className="flex items-center justify-between text-xs" style={{ color: palette.subtext }}>
                      <span>{item.source_name} | {item.source_tier}</span>
                      <span>Score {item.score?.toFixed ? item.score.toFixed(2) : item.score}</span>
                    </div>
                    <a
                      href={item.source_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm font-medium"
                      style={{ color: palette.text }}
                    >
                      {item.title}
                    </a>
                    {item.explain?.matched_signals?.length > 0 && (
                      <div className="mt-1 text-xs" style={{ color: palette.subtext }}>
                        Match signals: {item.explain.matched_signals.slice(0, 5).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
            <h3 className="text-base font-semibold">Event Log</h3>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr style={{ color: palette.subtext }}>
                    <th className="py-1 text-left">Date</th>
                    <th className="py-1 text-left">Conflict</th>
                    <th className="py-1 text-left">Actors</th>
                    <th className="py-1 text-left">Fatalities</th>
                    <th className="py-1 text-left">Injured</th>
                    <th className="py-1 text-left">IDs</th>
                    <th className="py-1 text-left">Identities</th>
                    <th className="py-1 text-left">Location</th>
                    <th className="py-1 text-left">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(0, 60).map((event) => (
                    <tr key={event.id} className="align-top" style={{ borderTop: `1px solid ${palette.border}` }}>
                      <td className="py-2">{formatDate(event.event_date)}</td>
                      <td className="py-2">{event.conflict}</td>
                      <td className="py-2">{(event.actors || []).join(', ') || '—'}</td>
                      <td className="py-2">{fmt(event.fatalities_total)}</td>
                      <td className="py-2">{fmt(event.injured_total)}</td>
                      <td className="py-2">{fmt(event.ids_released_count)}</td>
                      <td className="py-2">
                        {Array.isArray(event.identities) && event.identities.length > 0
                          ? event.identities.map((item) => item.name || item.id).filter(Boolean).join(', ')
                          : event.identity_count
                            ? `${fmt(event.identity_count)} withheld`
                            : '—'}
                      </td>
                      <td className="py-2">{(event.hit_locations || []).slice(0, 2).join(', ') || '—'}</td>
                      <td className="py-2">
                        {event.source_url ? (
                          <a href={event.source_url} target="_blank" rel="noopener noreferrer" style={{ color: palette.accent }}>
                            {event.source_name || 'Source'}
                          </a>
                        ) : event.source_name || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!loading && !error && activeTab === 'analyst' && (
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
            <h3 className="text-base font-semibold">Analyst Theories</h3>
            <div className="mt-1 text-xs" style={{ color: palette.warning }}>
              Hypothesis, not fact. Evidence-linked and uncertainty-labeled.
            </div>
            <div className="mt-3 space-y-3">
              {theories.length === 0 && (
                <div className="rounded-xl border p-3 text-sm" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                  No theory cards available yet.
                </div>
              )}
              {theories.map((theory) => (
                <div key={theory.id || theory.thesis} className="rounded-xl border p-3" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                  <div className="flex items-center justify-between text-xs" style={{ color: palette.subtext }}>
                    <span>{theory.status || 'draft'}</span>
                    <span>Confidence {fmtPct(theory.confidence)}</span>
                  </div>
                  <p className="mt-1 text-sm">{theory.thesis}</p>
                  <p className="mt-1 text-xs" style={{ color: palette.subtext }}>{theory.uncertainty}</p>
                  <div className="mt-2 text-xs" style={{ color: palette.subtext }}>
                    Evidence refs: {Array.isArray(theory.supporting_evidence) ? theory.supporting_evidence.length : 0} | Counter-evidence: {Array.isArray(theory.counter_evidence) ? theory.counter_evidence.length : 0}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, background: palette.panel }}>
            <h3 className="text-base font-semibold">Forecasts (24h + 7d)</h3>
            <div className="mt-1 text-xs" style={{ color: palette.warning }}>
              Probabilities only. Non-deterministic scenario model.
            </div>
            <div className="mt-3 space-y-3">
              {forecasts.length === 0 && (
                <div className="rounded-xl border p-3 text-sm" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                  No forecast cards available yet.
                </div>
              )}
              {forecasts.map((forecast) => {
                const probs = forecast.scenario_probabilities || {};
                const escalation = clamp(Number(probs.escalation || 0), 0, 1);
                const stable = clamp(Number(probs.stable || 0), 0, 1);
                const deEscalation = clamp(Number(probs.de_escalation || 0), 0, 1);

                return (
                  <div key={forecast.id || `${forecast.horizon_hours}`} className="rounded-xl border p-3" style={{ borderColor: palette.border, background: palette.panelAlt }}>
                    <div className="flex items-center justify-between text-xs" style={{ color: palette.subtext }}>
                      <span>{forecast.horizon_hours === 24 ? '24h Horizon' : forecast.horizon_hours === 168 ? '7d Horizon' : `${forecast.horizon_hours}h`}</span>
                      <span>Calibration {fmtPct(forecast.calibration_score)}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      <div>Escalation {fmtPct(escalation)}</div>
                      <div className="h-2 rounded-full" style={{ background: palette.accentSoft }}>
                        <div className="h-2 rounded-full" style={{ width: `${escalation * 100}%`, background: '#ef4444' }} />
                      </div>

                      <div>Stable {fmtPct(stable)}</div>
                      <div className="h-2 rounded-full" style={{ background: palette.accentSoft }}>
                        <div className="h-2 rounded-full" style={{ width: `${stable * 100}%`, background: '#22c55e' }} />
                      </div>

                      <div>De-escalation {fmtPct(deEscalation)}</div>
                      <div className="h-2 rounded-full" style={{ background: palette.accentSoft }}>
                        <div className="h-2 rounded-full" style={{ width: `${deEscalation * 100}%`, background: '#38bdf8' }} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs" style={{ color: palette.subtext }}>
                      {forecast.calibration_note || 'Confidence band reflects model calibration quality.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const ConflictMonitorPage = () => {
  const [flagResolved, setFlagResolved] = useState(false);
  const [dashboardEnabled, setDashboardEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadFlags = async () => {
      const data = await fetchJson(`${API_SERVER}/api/cms/feature-flags?map=true`, {});
      if (!mounted) return;
      const enabled = Boolean(data?.conflict_ops_dashboard_v1);
      setDashboardEnabled(enabled);
      setFlagResolved(true);
    };

    loadFlags();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1520px] space-y-6 px-2 py-4 md:px-4">
      <SEOHead
        title="Asha News - Conflict Operations Dashboard"
        description="Tactical conflict operations dashboard with verified-first metrics, comparisons, related news ranking, and analyst hypotheses/forecasts."
      />

      {!flagResolved ? (
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-6 text-sm">
          Loading dashboard configuration...
        </div>
      ) : dashboardEnabled ? (
        <TacticalConflictDashboard />
      ) : (
        <LegacyConflictMonitor />
      )}
    </div>
  );
};

export default ConflictMonitorPage;
