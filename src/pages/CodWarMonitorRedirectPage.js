import { useEffect, useMemo } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import { buildWorldMonitorUrl } from '../config/worldMonitor';

const CodWarMonitorRedirectPage = () => {
  const targetUrl = useMemo(
    () => (typeof window !== 'undefined' ? buildWorldMonitorUrl(window.location.search) : buildWorldMonitorUrl('')),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'test') return;
    window.location.assign(targetUrl);
  }, [targetUrl]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
      <SEOHead
        title="Asha News - Opening World Monitor"
        description="Redirecting to the hosted World Monitor dashboard."
      />
      <h1 className="text-2xl font-bold">Opening World Monitor</h1>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
        Launching the original World Monitor dashboard in this tab.
      </p>
      <a
        href={targetUrl}
        className="inline-flex rounded-lg border border-border-light dark:border-border-dark px-4 py-2 text-sm font-semibold hover:border-primary-500"
      >
        Open World Monitor
      </a>
    </div>
  );
};

export default CodWarMonitorRedirectPage;

