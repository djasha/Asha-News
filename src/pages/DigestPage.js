import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import UnifiedFiltersBar from '../components/Filters/UnifiedFiltersBar';
import { API_BASE } from '../config/api';
import { firebaseAuthService } from '../services/firebase';
import { useUnifiedFilters } from '../hooks/useUnifiedFilters';
import { applyUnifiedFilters, formatTimeAgo } from '../utils/feedFilters';
import { buildAuthHeaders } from '../utils/authHeaders';

const DigestPage = () => {
  const { filters, updateFilter, resetFilters } = useUnifiedFilters({ timeframe: '24h' });
  const [digest, setDigest] = useState(null);
  const [scope, setScope] = useState('public');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareInfo, setShareInfo] = useState({ token: '', url: '' });
  const [shareLoading, setShareLoading] = useState(false);

  const fetchDigest = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await firebaseAuthService.getUserToken();
      const topic = filters.topic ? `&topic=${encodeURIComponent(filters.topic)}` : '';
      const chosenScope = token ? 'personal' : 'public';
      const headers = await buildAuthHeaders({}, token);
      const res = await fetch(`${API_BASE}/v1/digest?scope=${chosenScope}&limit=20${topic}`, {
        headers
      });
      if (!res.ok) throw new Error(`Digest request failed (${res.status})`);
      const json = await res.json();
      setScope(chosenScope);
      setDigest(json);
    } catch (err) {
      setError('Failed to load digest data');
      setDigest(null);
    } finally {
      setLoading(false);
    }
  }, [filters.topic]);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  const filteredClusters = useMemo(
    () => applyUnifiedFilters(Array.isArray(digest?.clusters) ? digest.clusters : [], filters),
    [digest, filters]
  );

  const updateShareToken = async ({ enabled = true, rotate = false } = {}) => {
    try {
      setShareLoading(true);
      const token = await firebaseAuthService.getUserToken();
      if (!token) {
        setError('Sign in required to manage public digest token');
        return;
      }

      const res = await fetch(`${API_BASE}/v1/digest/share-token`, {
        method: 'POST',
        headers: await buildAuthHeaders({ 'Content-Type': 'application/json' }, token),
        body: JSON.stringify({ enabled, rotate }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Share token request failed (${res.status})`);
      }

      const publicPath = json.public_path || '';
      const fullUrl = publicPath ? `${window.location.origin}${publicPath}` : '';
      setShareInfo({ token: json.token || '', url: fullUrl });
    } catch (err) {
      setError(err.message || 'Failed to update share token');
    } finally {
      setShareLoading(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareInfo.url) return;
    try {
      await navigator.clipboard.writeText(shareInfo.url);
    } catch (_) {
      // no-op
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4">
      <SEOHead
        title="Asha News - Digest"
        description="Personal and public digest views with clustering summaries and share-token controls."
      />

      <section className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-6">
        <h1 className="text-2xl font-bold">Digest</h1>
        <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Current scope: <span className="font-semibold">{scope}</span>
        </p>
      </section>

      <UnifiedFiltersBar filters={filters} onChange={updateFilter} onReset={resetFilters} />

      <section className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            disabled={shareLoading}
            onClick={() => updateShareToken({ enabled: true, rotate: false })}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            Enable Public Digest
          </button>
          <button
            disabled={shareLoading}
            onClick={() => updateShareToken({ enabled: true, rotate: true })}
            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Rotate Token
          </button>
          <button
            disabled={shareLoading}
            onClick={() => updateShareToken({ enabled: false })}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            Disable Public Digest
          </button>
        </div>

        {shareInfo.token && (
          <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-3">
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Public token</div>
            <div className="mt-1 break-all font-mono text-sm">{shareInfo.token}</div>
            {shareInfo.url && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={shareInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline"
                >
                  {shareInfo.url}
                </a>
                <button
                  onClick={copyShareUrl}
                  className="rounded-md border border-border-light dark:border-border-dark px-2 py-1 text-xs"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {loading && (
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
          Loading digest...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
            <h2 className="text-lg font-semibold">Digest Text</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {digest?.digest_text || 'No digest text available.'}
            </pre>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Clusters</h2>
            {filteredClusters.length === 0 && (
              <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                No clusters match current filters.
              </div>
            )}
            {filteredClusters.map((cluster) => (
              <div
                key={cluster.id}
                className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  <span>{cluster.topic || 'general'}</span>
                  <span>•</span>
                  <span>{cluster.source_count || 0} sources</span>
                  <span>•</span>
                  <span>{formatTimeAgo(cluster.created_at)}</span>
                </div>
                <h3 className="mt-1 text-base font-semibold">{cluster.title}</h3>
                <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {cluster.summary}
                </p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
};

export default DigestPage;
