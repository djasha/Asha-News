import React, { useMemo } from 'react';
import useFeatureFlagMap from '../../hooks/useFeatureFlagMap';

const toneClass = {
  active: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
  restricted: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
  unknown: 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-500/40 dark:bg-slate-500/10 dark:text-slate-200',
};

const badgeClass = {
  on: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
  off: 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200',
  unknown: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/40 dark:bg-slate-500/10 dark:text-slate-200',
};

const normalizeFlag = (value) => {
  if (value === true) return 'on';
  if (value === false) return 'off';
  return 'unknown';
};

const WikiStatusBanner = ({
  version,
  lastUpdated,
  owner = 'Asha News team',
  flagKeys = [],
  title = 'Doc Status',
}) => {
  const { flags, loading } = useFeatureFlagMap();

  const status = useMemo(() => {
    const values = flagKeys.map((key) => normalizeFlag(flags[key]));

    if (values.length === 0) {
      return {
        mode: 'active',
        text: 'Published',
      };
    }

    if (values.some((v) => v === 'unknown')) {
      return {
        mode: 'unknown',
        text: loading ? 'Resolving Flags' : 'Partial Flag Visibility',
      };
    }

    if (values.every((v) => v === 'on')) {
      return {
        mode: 'active',
        text: 'Flagged Active',
      };
    }

    return {
      mode: 'restricted',
      text: 'Flagged Restricted',
    };
  }, [flags, flagKeys, loading]);

  return (
    <section className="rounded-xl border border-border-light bg-surface-elevated-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-elevated-dark">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary-light dark:text-text-primary-dark">{title}</h2>
          <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Version {version} · Last updated {lastUpdated} · Owner {owner}
          </p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass[status.mode]}`}>
          {status.text}
        </div>
      </div>

      {flagKeys.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {flagKeys.map((flagKey) => {
            const state = normalizeFlag(flags[flagKey]);
            const label = state === 'on' ? 'ON' : state === 'off' ? 'OFF' : loading ? 'LOADING' : 'UNKNOWN';

            return (
              <div key={flagKey} className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${badgeClass[state]}`}>
                <span className="font-mono">{flagKey}</span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default WikiStatusBanner;
