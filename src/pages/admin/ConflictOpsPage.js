import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CpuChipIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { buildAuthHeaders } from '../../utils/authHeaders';

const STATUS_TABS = [
  { key: 'status', label: 'Autonomy Status' },
  { key: 'sources', label: 'Source Candidates' },
  { key: 'reviews', label: 'Review Queue' },
];

const SOURCE_FILTERS = ['pending', 'approved', 'rejected', 'all'];

const formatDate = (value) => {
  if (!value) return '—';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleString();
};

const fmt = (value) => Number(value || 0).toLocaleString();
const toPercent = (value, total) => {
  const denominator = Math.max(1, Number(total || 0));
  return `${Math.max(0, Math.min(100, (Number(value || 0) / denominator) * 100)).toFixed(1)}%`;
};
const compactDay = (value) => String(value || '').slice(5);

const Badge = ({ children, tone = 'neutral' }) => {
  const toneClasses = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone] || toneClasses.neutral}`}>
      {children}
    </span>
  );
};

const SummaryCard = ({ title, value, icon: Icon, tone = 'info' }) => {
  const iconTone = {
    info: 'text-blue-500',
    success: 'text-emerald-500',
    danger: 'text-red-500',
    warning: 'text-amber-500',
  };

  return (
    <div className="rounded-lg border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 ${iconTone[tone] || iconTone.info}`} />
        <div>
          <div className="text-xs uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">{title}</div>
          <div className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">{value}</div>
        </div>
      </div>
    </div>
  );
};

const TrendRow = ({ label, segments, rightLabel }) => {
  const total = segments.reduce((acc, segment) => acc + Number(segment.value || 0), 0);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary-light dark:text-text-secondary-dark">{label}</span>
        <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{rightLabel || fmt(total)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        {total > 0 ? (
          <div className="flex h-full w-full">
            {segments.map((segment) => (
              <div
                key={segment.key}
                className="h-full"
                title={`${segment.label}: ${fmt(segment.value)} (${toPercent(segment.value, total)})`}
                style={{
                  width: toPercent(segment.value, total),
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ConflictOpsPage = () => {
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [statusData, setStatusData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('pending');
  const [shadowMode, setShadowMode] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [activeRun, setActiveRun] = useState(null);

  const runPollTimerRef = useRef(null);
  const runPollAttemptsRef = useRef(0);

  const authorizedFetch = useCallback(async (url, options = {}) => {
    const headers = await buildAuthHeaders({
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || `Request failed (${response.status})`);
    }

    return payload;
  }, []);

  const clearRunPoller = useCallback(() => {
    if (runPollTimerRef.current) {
      clearTimeout(runPollTimerRef.current);
      runPollTimerRef.current = null;
    }
    runPollAttemptsRef.current = 0;
  }, []);

  const loadStatus = useCallback(async () => {
    const payload = await authorizedFetch('/api/conflicts/autonomy/status');
    const data = payload?.data || null;
    setStatusData(data);
    if (typeof data?.shadow_mode === 'boolean') {
      setShadowMode(data.shadow_mode);
    }
  }, [authorizedFetch]);

  const loadCandidates = useCallback(async () => {
    const query = new URLSearchParams({ status: sourceFilter, limit: '200' });
    const payload = await authorizedFetch(`/api/conflicts/sources/candidates?${query.toString()}`);
    setCandidates(Array.isArray(payload?.data) ? payload.data : []);
  }, [authorizedFetch, sourceFilter]);

  const loadReviews = useCallback(async () => {
    const payload = await authorizedFetch('/api/conflicts/reviews/queue?limit=200');
    setReviews(Array.isArray(payload?.data) ? payload.data : []);
  }, [authorizedFetch]);

  const loadRuns = useCallback(async () => {
    const payload = await authorizedFetch('/api/conflicts/autonomy/runs?limit=20');
    setRecentRuns(Array.isArray(payload?.data) ? payload.data : []);
  }, [authorizedFetch]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadStatus(), loadCandidates(), loadReviews(), loadRuns()]);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Failed to load conflict operations data');
    } finally {
      setLoading(false);
    }
  }, [loadStatus, loadCandidates, loadReviews, loadRuns]);

  const pollRunStatus = useCallback(async (triggerId) => {
    if (!triggerId) return;

    const payload = await authorizedFetch(`/api/conflicts/autonomy/runs/${encodeURIComponent(triggerId)}`);
    const run = payload?.data || null;
    if (!run) {
      throw new Error(`Autonomy run ${triggerId} not found`);
    }

    setActiveRun(run);
    const status = String(run.status || '').toLowerCase();

    if (status === 'queued' || status === 'running') {
      runPollAttemptsRef.current += 1;
      if (runPollAttemptsRef.current >= 120) {
        clearRunPoller();
        setError(`Autonomy run ${triggerId} is still in progress. Refresh to continue tracking.`);
        return;
      }

      runPollTimerRef.current = setTimeout(() => {
        pollRunStatus(triggerId).catch((err) => {
          clearRunPoller();
          setError(err.message || 'Failed to poll autonomy run status');
        });
      }, 2000);
      return;
    }

    clearRunPoller();
    await loadAll();

    if (status === 'completed') {
      const ok = run?.ok !== false;
      setNotice(ok
        ? `Autonomy cycle completed (${triggerId}).`
        : `Autonomy cycle completed with warnings (${triggerId}).`);
      return;
    }

    if (status === 'failed') {
      setError(run?.error?.message || `Autonomy cycle failed (${triggerId}).`);
    }
  }, [authorizedFetch, clearRunPoller, loadAll]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => () => {
    clearRunPoller();
  }, [clearRunPoller]);

  useEffect(() => {
    if (activeTab === 'sources') {
      loadCandidates().catch((err) => setError(err.message || 'Failed to load candidates'));
    }
  }, [activeTab, sourceFilter, loadCandidates]);

  const handleRunAutonomy = async () => {
    setNotice('');
    setError('');
    try {
      setLoading(true);
      const payload = await authorizedFetch('/api/conflicts/autonomy/run', {
        method: 'POST',
        body: JSON.stringify({
          force: true,
          shadowMode,
          async: true,
          maxAgentMs: 45000,
          maxCycleMs: 180000,
        }),
      });
      if (payload?.data?.accepted) {
        const triggerId = payload?.data?.trigger_id || '';
        const trigger = triggerId ? ` (${triggerId})` : '';
        clearRunPoller();
        runPollAttemptsRef.current = 0;

        setActiveRun({
          trigger_id: triggerId,
          status: 'queued',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setNotice(`Autonomy cycle started in background${trigger}. Tracking status...`);

        if (triggerId) {
          runPollTimerRef.current = setTimeout(() => {
            pollRunStatus(triggerId).catch((err) => {
              clearRunPoller();
              setError(err.message || 'Failed to poll autonomy run status');
            });
          }, 1200);
        } else {
          await loadAll();
        }
      } else {
        const ok = payload?.data?.ok !== false;
        setNotice(ok ? 'Autonomy cycle completed.' : 'Autonomy cycle finished with warnings.');
        await loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to run autonomy cycle');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateDecision = async (id, decision) => {
    const notes = window.prompt(`Optional note for ${decision}:`, '');
    if (notes === null && decision === 'reject') return;

    setNotice('');
    setError('');

    try {
      await authorizedFetch(`/api/conflicts/sources/candidates/${id}/${decision}`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes || '' }),
      });
      setNotice(`Candidate ${decision}d.`);
      await loadCandidates();
    } catch (err) {
      setError(err.message || `Failed to ${decision} candidate`);
    }
  };

  const handleReviewDecision = async (eventId, action) => {
    const reason = window.prompt(`Reason for ${action}:`, action === 'verify' ? 'Cross-source corroboration' : 'Insufficient corroboration');
    if (reason === null) return;

    setNotice('');
    setError('');
    try {
      await authorizedFetch(`/api/conflicts/reviews/${eventId}`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      });
      setNotice(`Event ${action}d successfully.`);
      await loadReviews();
    } catch (err) {
      setError(err.message || `Failed to ${action} event`);
    }
  };

  const agentHealth = useMemo(() => {
    if (!statusData?.agent_health || typeof statusData.agent_health !== 'object') return [];
    return Object.entries(statusData.agent_health).map(([name, item]) => ({
      name,
      ...item,
    }));
  }, [statusData]);

  const runTrend = Array.isArray(statusData?.run_trend) ? statusData.run_trend : [];
  const incidentTrend = Array.isArray(statusData?.incident_trend) ? statusData.incident_trend : [];
  const actionTrend = Array.isArray(statusData?.action_trend) ? statusData.action_trend : [];

  const actionSummaryRows = useMemo(() => {
    const summary = statusData?.action_summaries || {};
    return Object.entries(summary)
      .map(([key, count]) => ({ key, count: Number(count || 0) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [statusData]);

  const runRows = useMemo(() => {
    const rows = Array.isArray(recentRuns) ? [...recentRuns] : [];
    if (activeRun?.trigger_id) {
      const existingIndex = rows.findIndex((item) => item.trigger_id === activeRun.trigger_id);
      if (existingIndex >= 0) {
        rows[existingIndex] = { ...rows[existingIndex], ...activeRun };
      } else {
        rows.unshift(activeRun);
      }
    }
    return rows
      .filter((item) => item?.trigger_id)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 12);
  }, [recentRuns, activeRun]);

  const activeRunTone = useMemo(() => {
    const status = String(activeRun?.status || '').toLowerCase();
    if (status === 'running') return 'info';
    if (status === 'completed') return activeRun?.ok === false ? 'warning' : 'success';
    if (status === 'failed') return 'danger';
    return 'neutral';
  }, [activeRun]);

  const toneByStatus = useCallback((status, ok) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'running') return 'info';
    if (normalized === 'completed') return ok === false ? 'warning' : 'success';
    if (normalized === 'failed') return 'danger';
    if (normalized === 'queued') return 'warning';
    return 'neutral';
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark">Conflict Ops</h1>
          <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Admin command center for autonomy status, source approval queue, and event verification actions.
          </p>
          <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Last updated: {lastUpdated ? formatDate(lastUpdated) : 'Not loaded'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border-light px-3 py-2 text-sm text-text-primary-light hover:bg-background-light disabled:cursor-not-allowed disabled:opacity-60 dark:border-border-dark dark:text-text-primary-dark dark:hover:bg-background-dark"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleRunAutonomy}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BoltIcon className="h-4 w-4" />
            Run Autonomy Cycle
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-text-primary-light dark:text-text-primary-dark">
            <input
              type="checkbox"
              checked={shadowMode}
              onChange={(event) => setShadowMode(event.target.checked)}
              className="h-4 w-4 rounded border-border-light text-primary-600 focus:ring-primary-500 dark:border-border-dark"
            />
            Run in shadow mode
          </label>

          {statusData?.enabled ? <Badge tone="success">Autonomy Enabled</Badge> : <Badge tone="warning">Autonomy Disabled</Badge>}
          {statusData?.flags?.conflict_ops_theory_public_v1 ? <Badge tone="info">Theory Public ON</Badge> : <Badge tone="neutral">Theory Public OFF</Badge>}
          {statusData?.flags?.conflict_ops_forecast_public_v1 ? <Badge tone="info">Forecast Public ON</Badge> : <Badge tone="neutral">Forecast Public OFF</Badge>}
        </div>
      </div>

      {activeRun?.trigger_id && (
        <div className="rounded-lg border border-border-light bg-surface-light p-4 text-sm dark:border-border-dark dark:bg-surface-dark">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-text-primary-light dark:text-text-primary-dark">Latest Manual Run</span>
            <Badge tone={activeRunTone}>{String(activeRun.status || 'unknown')}</Badge>
            <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {activeRun.trigger_id}
            </code>
          </div>
          <div className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Started: {formatDate(activeRun.started_at || activeRun.created_at)} | Finished: {formatDate(activeRun.finished_at)}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === tab.key
              ? 'bg-primary-600 text-white'
              : 'bg-surface-light text-text-primary-light hover:bg-background-light dark:bg-surface-dark dark:text-text-primary-dark dark:hover:bg-background-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'status' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Agents" value={fmt(agentHealth.length)} icon={CpuChipIcon} tone="info" />
            <SummaryCard title="Open Incidents" value={fmt(statusData?.incidents?.open)} icon={ExclamationTriangleIcon} tone="warning" />
            <SummaryCard title="Allowed Auto-Fixes" value={fmt((statusData?.allowed_auto_fixes || []).length)} icon={ShieldCheckIcon} tone="success" />
            <SummaryCard title="Actions Logged" value={fmt(Object.values(statusData?.action_summaries || {}).reduce((acc, count) => acc + Number(count || 0), 0))} icon={CheckCircleIcon} tone="info" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Run Trend (14d)</h2>
              <div className="mt-3 space-y-2">
                {runTrend.slice(-10).map((day) => (
                  <TrendRow
                    key={day.date}
                    label={compactDay(day.date)}
                    rightLabel={fmt(day.total)}
                    segments={[
                      { key: 'completed', label: 'Completed', value: day.completed, color: '#10b981' },
                      { key: 'failed', label: 'Failed', value: day.failed, color: '#ef4444' },
                      { key: 'running', label: 'Running', value: day.running, color: '#3b82f6' },
                      { key: 'other', label: 'Other', value: day.other, color: '#a855f7' },
                    ]}
                  />
                ))}
                {runTrend.length === 0 && (
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">No run trend data.</div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Incident Trend (14d)</h2>
              <div className="mt-3 space-y-2">
                {incidentTrend.slice(-10).map((day) => (
                  <TrendRow
                    key={day.date}
                    label={compactDay(day.date)}
                    rightLabel={fmt(day.total)}
                    segments={[
                      { key: 'critical', label: 'Critical', value: day.critical, color: '#ef4444' },
                      { key: 'warning', label: 'Warning', value: day.warning, color: '#f59e0b' },
                      { key: 'info', label: 'Info', value: day.info, color: '#3b82f6' },
                    ]}
                  />
                ))}
                {incidentTrend.length === 0 && (
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">No incident trend data.</div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Action Trend (14d)</h2>
              <div className="mt-3 space-y-2">
                {actionTrend.slice(-10).map((day) => (
                  <TrendRow
                    key={day.date}
                    label={compactDay(day.date)}
                    rightLabel={fmt(day.total)}
                    segments={[
                      { key: 'allowed', label: 'Allowed', value: day.allowed, color: '#22c55e' },
                      { key: 'blocked', label: 'Blocked', value: day.blocked, color: '#ef4444' },
                    ]}
                  />
                ))}
                {actionTrend.length === 0 && (
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">No action trend data.</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Agent Health</h2>
              <div className="mt-3 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-text-secondary-light dark:text-text-secondary-dark">
                    <tr>
                      <th className="py-1">Agent</th>
                      <th className="py-1">Last Status</th>
                      <th className="py-1">Success</th>
                      <th className="py-1">Failures</th>
                      <th className="py-1">Last Run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentHealth.map((agent) => (
                      <tr key={agent.name} className="border-t border-border-light dark:border-border-dark">
                        <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{agent.name}</td>
                        <td className="py-2">
                          <Badge tone={agent.last_status === 'completed' ? 'success' : agent.last_status === 'failed' ? 'danger' : 'neutral'}>
                            {agent.last_status || 'unknown'}
                          </Badge>
                        </td>
                        <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{fmt(agent.successes)}</td>
                        <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{fmt(agent.failures)}</td>
                        <td className="py-2 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(agent.last_run_at)}</td>
                      </tr>
                    ))}
                    {agentHealth.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-3 text-center text-text-secondary-light dark:text-text-secondary-dark">
                          No agent runs recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Recent Incidents</h2>
              <div className="mt-3 space-y-3">
                {(statusData?.incidents?.recent || []).slice(0, 8).map((incident) => (
                  <div key={incident.id} className="rounded-md border border-border-light p-3 dark:border-border-dark">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={incident.severity === 'critical' ? 'danger' : incident.severity === 'warning' ? 'warning' : 'info'}>
                        {incident.severity}
                      </Badge>
                      <Badge tone={incident.status === 'open' ? 'warning' : 'success'}>
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-text-primary-light dark:text-text-primary-dark">{incident.message}</p>
                    <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">{formatDate(incident.opened_at)}</p>
                  </div>
                ))}
                {(!statusData?.incidents?.recent || statusData.incidents.recent.length === 0) && (
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">No incidents recorded.</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Recent Manual Runs</h2>
              <button
                onClick={loadRuns}
                className="rounded border border-border-light px-2 py-1 text-xs text-text-secondary-light hover:bg-background-light dark:border-border-dark dark:text-text-secondary-dark dark:hover:bg-background-dark"
              >
                Refresh Runs
              </button>
            </div>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="text-left text-text-secondary-light dark:text-text-secondary-dark">
                  <tr>
                    <th className="py-1">Trigger</th>
                    <th className="py-1">Status</th>
                    <th className="py-1">Requested By</th>
                    <th className="py-1">Source</th>
                    <th className="py-1">Started</th>
                    <th className="py-1">Finished</th>
                    <th className="py-1">Agent Runs</th>
                  </tr>
                </thead>
                <tbody>
                  {runRows.map((run) => (
                    <tr key={run.trigger_id} className="border-t border-border-light dark:border-border-dark">
                      <td className="py-2 font-mono text-xs text-text-primary-light dark:text-text-primary-dark">{run.trigger_id}</td>
                      <td className="py-2">
                        <Badge tone={toneByStatus(run.status, run.ok)}>{String(run.status || 'unknown')}</Badge>
                      </td>
                      <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{run.requested_by || '—'}</td>
                      <td className="py-2 text-text-secondary-light dark:text-text-secondary-dark">{run.request_source || '—'}</td>
                      <td className="py-2 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(run.started_at || run.created_at)}</td>
                      <td className="py-2 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(run.finished_at)}</td>
                      <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{fmt(run.run_count)}</td>
                    </tr>
                  ))}
                  {runRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
                        No manual runs tracked yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
            <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Action Type Summary</h2>
            <div className="mt-3 space-y-2">
              {actionSummaryRows.map((row) => {
                const maxCount = Math.max(1, ...actionSummaryRows.map((item) => item.count));
                return (
                  <div key={row.key} className="grid grid-cols-[220px_1fr_auto] items-center gap-3 text-sm">
                    <span className="truncate text-text-primary-light dark:text-text-primary-dark">{row.key}</span>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${(row.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">{fmt(row.count)}</span>
                  </div>
                );
              })}
              {actionSummaryRows.length === 0 && (
                <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">No actions logged yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Filter</label>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="rounded-md border border-border-light bg-surface-light px-2 py-1 text-sm dark:border-border-dark dark:bg-surface-dark"
            >
              {SOURCE_FILTERS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
            <div className="overflow-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="text-left text-text-secondary-light dark:text-text-secondary-dark">
                  <tr>
                    <th className="py-1">Source</th>
                    <th className="py-1">URL</th>
                    <th className="py-1">Tier</th>
                    <th className="py-1">Credibility</th>
                    <th className="py-1">Relevance</th>
                    <th className="py-1">Status</th>
                    <th className="py-1">Discovered</th>
                    <th className="py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="border-t border-border-light dark:border-border-dark">
                      <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{candidate.name}</td>
                      <td className="py-2">
                        <a href={candidate.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline dark:text-primary-400">
                          {candidate.url}
                        </a>
                      </td>
                      <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{candidate.source_tier_suggestion}</td>
                      <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{(Number(candidate.credibility_score || 0) * 100).toFixed(0)}%</td>
                      <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{(Number(candidate.relevance_score || 0) * 100).toFixed(0)}%</td>
                      <td className="py-2">
                        <Badge tone={candidate.status === 'approved' ? 'success' : candidate.status === 'rejected' ? 'danger' : 'warning'}>
                          {candidate.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(candidate.discovered_at)}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCandidateDecision(candidate.id, 'approve')}
                            disabled={candidate.status !== 'pending'}
                            className="inline-flex items-center gap-1 rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 disabled:opacity-50 dark:border-emerald-700/60 dark:text-emerald-300"
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleCandidateDecision(candidate.id, 'reject')}
                            disabled={candidate.status !== 'pending'}
                            className="inline-flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-50 dark:border-red-700/60 dark:text-red-300"
                          >
                            <XCircleIcon className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
                        No source candidates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="rounded-lg border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark">
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="text-left text-text-secondary-light dark:text-text-secondary-dark">
                <tr>
                  <th className="py-1">Date</th>
                  <th className="py-1">Conflict</th>
                  <th className="py-1">Actors</th>
                  <th className="py-1">Fatalities</th>
                  <th className="py-1">Injured</th>
                  <th className="py-1">Confidence</th>
                  <th className="py-1">Suggestion</th>
                  <th className="py-1">Source</th>
                  <th className="py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((item) => (
                  <tr key={item.id} className="border-t border-border-light dark:border-border-dark">
                    <td className="py-2 text-text-secondary-light dark:text-text-secondary-dark">{formatDate(item.event_date)}</td>
                    <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{item.conflict}</td>
                    <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{(item.actors || []).join(', ') || '—'}</td>
                    <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{fmt(item.fatalities_total)}</td>
                    <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{fmt(item.injured_total)}</td>
                    <td className="py-2 text-text-primary-light dark:text-text-primary-dark">{(Number(item.confidence || 0) * 100).toFixed(0)}%</td>
                    <td className="py-2">
                      <Badge tone={item.review_recommendation === 'verify' ? 'success' : item.review_recommendation === 'reject' ? 'danger' : 'warning'}>
                        {item.review_recommendation || 'manual_review'}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {item.source_url ? (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline dark:text-primary-400">
                          {item.source_name || 'Source'}
                        </a>
                      ) : (item.source_name || '—')}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewDecision(item.id, 'verify')}
                          className="inline-flex items-center gap-1 rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 dark:border-emerald-700/60 dark:text-emerald-300"
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5" /> Verify
                        </button>
                        <button
                          onClick={() => handleReviewDecision(item.id, 'reject')}
                          className="inline-flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-700/60 dark:text-red-300"
                        >
                          <XCircleIcon className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      Review queue is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConflictOpsPage;
