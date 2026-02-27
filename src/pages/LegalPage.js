import React, { useEffect, useState } from 'react';

/**
 * LegalPage
 * Fetches legal page content from backend CMS endpoint and renders it.
 * Falls back to provided placeholder if CMS content is unavailable.
 */
export default function LegalPage({ slug, title: heading, fallback }) {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/cms/legal/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && isMounted) {
          setPage(data.data);
        }
      } catch (e) {
        // swallow and fall back below
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [slug]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
          {page?.title || heading}
        </h1>
        {loading && (
          <div className="text-text-secondary-light dark:text-text-secondary-dark">Loading content...</div>
        )}
        {!loading && !page && (
          <div className="text-text-secondary-light dark:text-text-secondary-dark">{fallback}</div>
        )}
        {!loading && page && (
          <article className="prose dark:prose-invert max-w-none">
            {page.content ? (
              <div dangerouslySetInnerHTML={{ __html: page.content }} />
            ) : (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">{fallback}</p>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
