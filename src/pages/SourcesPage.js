import React, { useEffect, useState } from 'react';
import newsSourcesService from '../services/newsSourcesService';

export default function SourcesPage() {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await newsSourcesService.getAllSources();
        if (mounted) setSources(data || []);
      } catch (e) {
        if (mounted) setSources([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">News Sources</h1>

        {loading && (
          <div className="text-text-secondary-light dark:text-text-secondary-dark">Loading sources...</div>
        )}

        {!loading && sources.length === 0 && (
          <div className="text-text-secondary-light dark:text-text-secondary-dark">No sources available.</div>
        )}

        {!loading && sources.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((s) => (
              <li key={s.id || s.name} className="p-4 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                <div className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">{s.name}</div>
                {s.description && (
                  <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">{s.description}</p>
                )}
                <div className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {s.bias_rating && (<span className="mr-3">Bias: {s.bias_rating}</span>)}
                  {typeof s.credibility_score === 'number' && (<span>Credibility: {s.credibility_score}</span>)}
                </div>
                {s.website_url && (
                  <a className="mt-3 inline-block text-primary-600 hover:underline" href={s.website_url} target="_blank" rel="noreferrer">
                    Visit website
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
