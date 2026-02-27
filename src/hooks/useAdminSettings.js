import { useEffect, useMemo, useState } from 'react';

// Simple in-memory cache with TTL to avoid duplicate fetches across components
let cachedSettings = null;
let cachedAt = 0;
const TTL_MS = 60 * 1000; // 60s

export default function useAdminSettings() {
  const [settings, setSettings] = useState(() => cachedSettings);
  const [loading, setLoading] = useState(() => !cachedSettings);
  const [error, setError] = useState(null);

  useEffect(() => {
    const now = Date.now();
    if (cachedSettings && now - cachedAt < TTL_MS) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch('/api/admin-settings');
        const json = await resp.json().catch(() => ({}));
        const next = json?.settings || json || {};
        if (!cancelled) {
          cachedSettings = next;
          cachedAt = Date.now();
          setSettings(next);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const clusterSettings = useMemo(() => ({
    enabled: true,
    similarityThreshold: 0.88,
    maxClusterSize: 20,
    minArticlesToPublish: 2,
    minUniqueSources: 2,
    saveToDirectus: true,
    keepIndividualArticles: true,
    showBiasCharts: true,
    showPerspectives: true,
    showQA: true,
    showKeyFacts: true,
    sourcesPerCluster: 6,
    summaryMaxChars: 500,
    enableContentHashCache: true,
    clusteringAlgorithm: 'dbscan',
    dbscanEps: 1.05,
    dbscanMinSamples: 3,
    // Override from server if present
    ...(settings?.clusterSettings || settings?.cluster_settings || {})
  }), [settings]);

  return {
    settings,
    clusterSettings,
    loading,
    error
  };
}
