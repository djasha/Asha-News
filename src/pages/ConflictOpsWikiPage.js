import React, { useMemo, useState } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import ReportDocsIssueButton from '../components/Wiki/ReportDocsIssueButton';
import WikiStatusBanner from '../components/Wiki/WikiStatusBanner';
import wikiChangelog from '../data/wikiChangelog.json';

const DOC_VERSION = 'v1.3.0';
const LAST_UPDATED = '2026-03-02';

const docsSections = [
  {
    title: 'Audience Tracks',
    items: [
      'Public readers: what the dashboard shows and what it does not claim.',
      'Operators: how to review incidents, source queues, and verification backlog.',
      'Developers: architecture, data model, APIs, and rollout controls.',
      'AI agents: autonomy boundaries and traceability requirements.',
    ],
  },
  {
    title: 'Safety Baseline',
    items: [
      'Verified-first data mode by default.',
      'Identity data withheld unless verified and policy-allowed.',
      'Theories are hypotheses, not facts.',
      'Forecasts are probabilities, not deterministic predictions.',
      'Autonomous fixes are bounded to pipeline operations only.',
    ],
  },
  {
    title: 'Operational Bootstrap',
    items: [
      'Seed articles via POST /api/rss-processing/ingest-from-content before expecting dashboard activity.',
      'Extract conflict events via POST /api/conflicts/ingest/from-articles.',
      'Ingestion now classifies weapon/technology taxonomy, hit locations, identity signals, and official announcement type metadata.',
      'Process review queue via GET/POST /api/conflicts/reviews/* to populate verified-first views.',
      'Run scripts/smoke-conflict-ops-functional.sh for end-to-end pipeline verification.',
      'Supabase REST mode and direct DATABASE_URL mode both support RSS/article/conflict write paths.',
    ],
  },
];

const featureFlags = [
  { key: 'conflict_ops_dashboard_v1', description: 'Enables tactical dashboard UX on /conflicts.' },
  { key: 'cod_war_monitor_v1', description: 'Legacy flag for prior in-app COD prototype (current COD launcher opens upstream WorldMonitor).' },
  { key: 'conflict_ops_autonomy_v1', description: 'Enables scheduled autonomous agent cycle.' },
  { key: 'conflict_ops_theory_public_v1', description: 'Allows theory cards to be publicly visible when gates pass.' },
  { key: 'conflict_ops_forecast_public_v1', description: 'Allows forecast cards to be publicly visible when gates pass.' },
];

const publicEndpoints = [
  'GET /api/conflicts/openapi',
  'GET /api/conflicts/events',
  'GET /api/conflicts/stats',
  'GET /api/conflicts/related-news',
  'GET /api/conflicts/theories',
  'GET /api/conflicts/forecasts',
];

const adminEndpoints = [
  'GET /api/conflicts/autonomy/status',
  'POST /api/conflicts/autonomy/run',
  'GET /api/conflicts/autonomy/runs',
  'GET /api/conflicts/autonomy/runs/:triggerId',
  'POST /api/conflicts/autonomy/runs/reconcile',
  'GET /api/conflicts/sources/candidates',
  'POST /api/conflicts/sources/candidates/:id/approve',
  'POST /api/conflicts/sources/candidates/:id/reject',
  'GET /api/conflicts/reviews/queue',
  'POST /api/conflicts/reviews/:eventId',
  'POST /api/conflicts/ingest/from-articles',
];

const dataModel = [
  'conflict_events',
  'conflict_source_candidates',
  'conflict_theories',
  'conflict_forecasts',
  'agent_runs',
  'agent_incidents',
  'agent_actions',
];

const rolloutPhases = [
  'Phase 1: Migrate DB and validate API read/write flows.',
  'Phase 2: Enable autonomy in shadow mode and monitor trend charts.',
  'Phase 3: Validate source/review queues via /admin/conflicts.',
  'Phase 4: Enable dashboard publicly with verified-first mode.',
  'Phase 5: Enable theory/forecast public flags after quality gates pass.',
];

const normalize = (value) => String(value || '').toLowerCase();

const SectionCard = ({ title, children }) => (
  <section className="rounded-xl border border-border-light bg-surface-elevated-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-elevated-dark">
    <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">{title}</h2>
    <div className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">{children}</div>
  </section>
);

const ConflictOpsWikiPage = () => {
  const [query, setQuery] = useState('');
  const changelog = useMemo(
    () => wikiChangelog.filter((entry) => ['conflict-ops', 'wiki'].includes(entry.scope)).slice(0, 12),
    []
  );

  const filtered = useMemo(() => {
    const q = normalize(query).trim();
    if (!q) {
      return {
        docsSections,
        featureFlags,
        publicEndpoints,
        adminEndpoints,
        dataModel,
        rolloutPhases,
        changelog,
      };
    }

    const filteredSections = docsSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => normalize(item).includes(q)),
      }))
      .filter((section) => section.items.length > 0 || normalize(section.title).includes(q));

    return {
      docsSections: filteredSections,
      featureFlags: featureFlags.filter((item) => normalize(item.key).includes(q) || normalize(item.description).includes(q)),
      publicEndpoints: publicEndpoints.filter((item) => normalize(item).includes(q)),
      adminEndpoints: adminEndpoints.filter((item) => normalize(item).includes(q)),
      dataModel: dataModel.filter((item) => normalize(item).includes(q)),
      rolloutPhases: rolloutPhases.filter((item) => normalize(item).includes(q)),
      changelog: changelog.filter((item) => normalize(item.change).includes(q) || normalize(item.date).includes(q)),
    };
  }, [query, changelog]);

  const hasAnyResults =
    filtered.docsSections.length > 0 ||
    filtered.featureFlags.length > 0 ||
    filtered.publicEndpoints.length > 0 ||
    filtered.adminEndpoints.length > 0 ||
    filtered.dataModel.length > 0 ||
    filtered.rolloutPhases.length > 0 ||
    filtered.changelog.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <SEOHead
        title="Asha News - Conflict Ops Wiki"
        description="Conflict operations documentation wiki for public users, operators, developers, and AI agents."
      />

      <section className="rounded-2xl border border-border-light bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg dark:border-border-dark">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Asha News Knowledge Base</p>
        <h1 className="mt-2 text-3xl font-bold">Conflict Ops Wiki</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          Living documentation for the autonomous conflict dashboard, review operations, API contracts, and governance controls.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/wiki"
            className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40"
          >
            Wiki Home
          </a>
          <a
            href="/conflicts"
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Open Dashboard
          </a>
          <a
            href="/admin/conflicts"
            className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40"
          >
            Open Admin Ops
          </a>
          <a
            href="/api/conflicts/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40"
          >
            OpenAPI JSON
          </a>
          <ReportDocsIssueButton
            context="conflict-ops-wiki"
            className="border-slate-400/50 bg-transparent text-slate-100 hover:bg-slate-700/40 dark:border-slate-400/50 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-700/40"
          />
        </div>
      </section>

      <WikiStatusBanner
        version={DOC_VERSION}
        lastUpdated={LAST_UPDATED}
        owner="Conflict Ops (engineering + editorial ops)"
        flagKeys={[
          'wiki_conflict_ops_v1',
          'conflict_ops_dashboard_v1',
          'conflict_ops_autonomy_v1',
          'conflict_ops_theory_public_v1',
          'conflict_ops_forecast_public_v1',
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Documentation Metadata">
          <div className="space-y-2">
            <p><span className="font-semibold">Version:</span> {DOC_VERSION}</p>
            <p><span className="font-semibold">Last Updated:</span> {LAST_UPDATED}</p>
            <p><span className="font-semibold">Owner:</span> Conflict Ops team (engineering + editorial ops)</p>
            <p><span className="font-semibold">Scope:</span> /conflicts, /admin/conflicts, /api/conflicts</p>
          </div>
        </SectionCard>

        <SectionCard title="Search Wiki Content">
          <label htmlFor="wiki-search" className="mb-2 block text-xs uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">
            Search Sections, Endpoints, Flags, and Changelog
          </label>
          <input
            id="wiki-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: forecast, review queue, conflict_events, shadow mode"
            className="w-full rounded-md border border-border-light bg-surface-light px-3 py-2 text-sm text-text-primary-light outline-none focus:border-primary-500 dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark"
          />
          <p className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {query ? `Filtering results for "${query}"` : 'No filter active.'}
          </p>
        </SectionCard>

        <SectionCard title="Latest Changes">
          <ul className="space-y-2">
            {filtered.changelog.slice(0, 4).map((entry) => (
              <li key={`${entry.date}-${entry.change}`}>
                <p className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">{entry.date}</p>
                <p className="text-sm">{entry.change}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>

      {!hasAnyResults && (
        <section className="rounded-xl border border-border-light bg-surface-elevated-light p-5 text-sm text-text-secondary-light dark:border-border-dark dark:bg-surface-elevated-dark dark:text-text-secondary-dark">
          No wiki content matched your search. Try broader terms.
        </section>
      )}

      {hasAnyResults && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.docsSections.map((section) => (
              <SectionCard key={section.title} title={section.title}>
                <ul className="list-disc space-y-1 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </SectionCard>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Public API Surface">
              <ul className="space-y-1 font-mono text-xs">
                {filtered.publicEndpoints.map((endpoint) => (
                  <li key={endpoint}>{endpoint}</li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title="Admin API Surface">
              <ul className="space-y-1 font-mono text-xs">
                {filtered.adminEndpoints.map((endpoint) => (
                  <li key={endpoint}>{endpoint}</li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SectionCard title="Core Data Model">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.dataModel.map((table) => (
                <div key={table} className="rounded-md border border-border-light bg-surface-light px-3 py-2 font-mono text-xs text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark">
                  {table}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Release Flags">
            <div className="space-y-2">
              {filtered.featureFlags.map((flag) => (
                <div key={flag.key} className="rounded-md border border-border-light bg-surface-light px-3 py-2 dark:border-border-dark dark:bg-surface-dark">
                  <div className="font-mono text-xs text-text-primary-light dark:text-text-primary-dark">{flag.key}</div>
                  <div className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">{flag.description}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Suggested Rollout">
            <ol className="list-decimal space-y-1 pl-5">
              {filtered.rolloutPhases.map((phase) => (
                <li key={phase}>{phase}</li>
              ))}
            </ol>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default ConflictOpsWikiPage;
