import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import UnifiedFiltersBar from '../components/Filters/UnifiedFiltersBar';
import MarketsTickerStrip from '../components/Markets/MarketsTickerStrip';
import { API_BASE } from '../config/api';
import { firebaseAuthService } from '../services/firebase';
import { useUnifiedFilters } from '../hooks/useUnifiedFilters';
import { applyUnifiedFilters, formatTimeAgo } from '../utils/feedFilters';
import { buildAuthHeaders } from '../utils/authHeaders';
import { WORLDMONITOR_URL } from '../config/worldMonitor';

const HomeV1 = () => {
  const { filters, updateFilter, resetFilters } = useUnifiedFilters({ timeframe: '24h' });
  const codWarMonitorEnabled = true;
  const [digestScope, setDigestScope] = useState('public');
  const [digest, setDigest] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const token = await firebaseAuthService.getUserToken();

        const scope = token ? 'personal' : 'public';
        const digestHeaders = await buildAuthHeaders({}, token);
        const digestRes = await fetch(`${API_BASE}/v1/digest?scope=${scope}&limit=10`, {
          headers: digestHeaders
        });
        const digestJson = await digestRes.json().catch(() => ({}));

        const articlesRes = await fetch(`${API_BASE}/articles?limit=120`);
        const articlesJson = await articlesRes.json().catch(() => ({}));

        if (!alive) return;

        setDigestScope(scope);
        setDigest(digestRes.ok ? digestJson : null);
        setArticles(Array.isArray(articlesJson?.data) ? articlesJson.data : []);
      } catch (err) {
        if (!alive) return;
        setError('Failed to load feed data');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, []);

  const filteredArticles = useMemo(
    () => applyUnifiedFilters(articles, filters).slice(0, 24),
    [articles, filters]
  );

  const filteredClusters = useMemo(
    () => applyUnifiedFilters(Array.isArray(digest?.clusters) ? digest.clusters : [], filters).slice(0, 8),
    [digest, filters]
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4">
      <SEOHead
        title="Asha News - Personal Feed"
        description="Your personalized, filterable Asha News feed with clusters and market context."
      />

      <section className="rounded-2xl border border-border-light dark:border-border-dark bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
        <h1 className="text-2xl font-bold">Home Feed</h1>
        <p className="mt-2 text-sm opacity-90">
          Scope: <span className="font-semibold">{digestScope}</span>. Use filters to tailor clusters and latest updates.
        </p>
      </section>

      <MarketsTickerStrip />

      <UnifiedFiltersBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {loading && (
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-6">
          Loading feed...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {codWarMonitorEnabled && (
            <section className="rounded-xl border border-border-light dark:border-border-dark bg-gradient-to-r from-slate-900 to-teal-900 p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-teal-200">Conflict Operations Command</div>
                  <h2 className="mt-1 text-lg font-semibold">COD - War Monitor</h2>
                  <p className="mt-1 text-sm text-slate-200">
                    Open the full map-first immersive monitor for multi-conflict situational awareness.
                  </p>
                </div>
                <a
                  href={WORLDMONITOR_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-lg border border-teal-300/80 bg-teal-400/20 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400/30"
                >
                  Open COD - War Monitor
                </a>
              </div>
            </section>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Top Clusters</h2>
              <div className="flex items-center gap-4">
                <Link to="/conflicts" className="text-sm text-primary-600 hover:underline">
                  Open conflict monitor
                </Link>
                {codWarMonitorEnabled && (
                  <a
                    href={WORLDMONITOR_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Open COD - War Monitor
                  </a>
                )}
                <Link to="/digest" className="text-sm text-primary-600 hover:underline">
                  Open full digest
                </Link>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {filteredClusters.length === 0 && (
                <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  No clusters match current filters.
                </div>
              )}
              {filteredClusters.map((cluster) => (
                <Link
                  key={cluster.id}
                  to={`/story/${cluster.id}`}
                  className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4 hover:border-primary-500"
                >
                  <div className="text-xs uppercase tracking-wide text-primary-600">{cluster.topic || 'general'}</div>
                  <h3 className="mt-1 text-base font-semibold">{cluster.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {cluster.summary || 'No summary available.'}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Latest</h2>
            <div className="space-y-2">
              {filteredArticles.length === 0 && (
                <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  No articles match current filters.
                </div>
              )}
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="block rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4 hover:border-primary-500"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    <span>{article.source_name || article.source || 'Unknown source'}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(article.published_at || article.publication_date)}</span>
                    {article.political_bias && (
                      <>
                        <span>•</span>
                        <span>{article.political_bias}</span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{article.title}</h3>
                  {article.summary && (
                    <p className="mt-2 line-clamp-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {article.summary}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomeV1;
