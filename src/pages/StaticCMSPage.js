import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import PageBuilderRenderer from "../components/PageBuilder/PageBuilderRenderer";

/**
 * StaticCMSPage
 * Renders CMS-managed content for a given slug via backend page builder endpoint.
 * Falls back to a simple placeholder when CMS content is unavailable.
 */
export default function StaticCMSPage({ slug, title: heading, fallback = 'Content coming soon...' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(null);
  const params = useParams();
  const effectiveSlug = slug || params.slug;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!effectiveSlug) throw new Error("Missing page slug");
        const res = await fetch(
          `/api/page-builder/pages/${encodeURIComponent(effectiveSlug)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setPage(data.data);
        }
      } catch (e) {
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [effectiveSlug]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
          {page?.title || heading}
        </h1>

        {loading && (
          <div className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading content...
          </div>
        )}

        {!loading && error && (
          <div className="text-text-secondary-light dark:text-text-secondary-dark">
            {fallback}
          </div>
        )}

        {!loading &&
          !error &&
          page &&
          (Array.isArray(page.components) && page.components.length > 0 ? (
            <PageBuilderRenderer
              components={page.components}
              layoutSettings={page.layout_settings || {}}
            />
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <div className="text-text-secondary-light dark:text-text-secondary-dark">
                {fallback}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
