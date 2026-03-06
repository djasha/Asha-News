import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../components/UI/Card";
import InfoIcon from "../components/UI/InfoIcon";

function resolveMissionControlUrl() {
  const configured = process.env.REACT_APP_MC_URL;
  if (configured && configured.trim()) return configured.trim();
  if (typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname)) {
    return "http://localhost:4175";
  }
  return "https://mc.asha.news";
}

const MissionControlPage = () => {
  const [opsHealth, setOpsHealth] = useState(null);
  const [opsError, setOpsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInlinePreview, setShowInlinePreview] = useState(true);
  const missionControlUrl = useMemo(() => resolveMissionControlUrl(), []);

  useEffect(() => {
    let mounted = true;
    const loadOps = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/mc/ops/health?profile=default", {
          credentials: "include",
        });
        const payload = await response.json();
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.error || `Request failed (${response.status})`);
        }
        if (!mounted) return;
        setOpsHealth(payload.data || null);
        setOpsError("");
      } catch (error) {
        if (!mounted) return;
        setOpsError(error instanceof Error ? error.message : "Failed to fetch Mission Control status");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOps();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 py-10 grid gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Mission Control
              </h1>
              <InfoIcon content="Map-first operational workspace with alerts, ticker, leaks lane, and notification actions." />
            </div>
            <a
              href={missionControlUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Open Full Mission Control
            </a>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              This launcher points to the standalone Mission Control app:
              <span className="ml-1 font-mono text-xs">{missionControlUrl}</span>.
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Inline preview helps verify availability without leaving this page.
              </p>
              <button
                type="button"
                onClick={() => setShowInlinePreview((value) => !value)}
                className="px-3 py-2 rounded-md border border-border-light dark:border-border-dark text-xs font-medium text-text-primary-light dark:text-text-primary-dark hover:bg-surface-elevated-light dark:hover:bg-surface-elevated-dark"
              >
                {showInlinePreview ? "Hide Inline Preview" : "Show Inline Preview"}
              </button>
            </div>
          </CardContent>
        </Card>

        {showInlinePreview && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                Mission Control Inline Preview
              </h2>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-border-light dark:border-border-dark bg-black">
                <iframe
                  title="Mission Control"
                  src={missionControlUrl}
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                If your browser blocks embedding, use the “Open Full Mission Control” button above.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
              Ops Health Snapshot
            </h2>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {loading && <p className="text-text-secondary-light dark:text-text-secondary-dark">Checking health...</p>}
            {!loading && opsError && (
              <p className="text-red-600 dark:text-red-400">{opsError}</p>
            )}
            {!loading && !opsError && opsHealth && (
              <>
                <p>
                  <span className="font-medium">Worker:</span>{" "}
                  {opsHealth.dispatch_worker?.running ? "running" : "stopped"}
                </p>
                <p>
                  <span className="font-medium">Queue Lag:</span>{" "}
                  {opsHealth.dispatch_queue?.lag_ms ?? 0} ms
                </p>
                <p>
                  <span className="font-medium">Cache Mode:</span>{" "}
                  {opsHealth.cache?.mode || "unknown"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MissionControlPage;
