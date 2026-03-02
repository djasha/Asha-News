import React, { useMemo } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import ReportDocsIssueButton from '../components/Wiki/ReportDocsIssueButton';
import WikiStatusBanner from '../components/Wiki/WikiStatusBanner';
import wikiChangelog from '../data/wikiChangelog.json';

const DOC_VERSION = 'v1.0.0';
const LAST_UPDATED = '2026-03-02';

const endpointGroups = [
  {
    title: 'Schema and Discovery',
    items: [
      'GET /api/v1/openapi',
      'GET /api/conflicts/openapi',
    ],
  },
  {
    title: 'Digest Surface',
    items: [
      'GET /api/v1/digest (optional auth, personal or public scope)',
      'POST /api/v1/digest/share-token (auth required)',
      'GET /api/v1/public/:userId',
      'GET /api/v1/public/token/:token',
    ],
  },
  {
    title: 'Search and Markets Surface',
    items: [
      'GET /api/v1/clusters/search?q=...&limit=...',
      'GET /api/v1/instruments/:symbol/news?limit=...',
      'GET /api/v1/instruments/prices?symbols=...',
    ],
  },
];

const authModel = [
  'Optional bearer auth on digest enables personal scope; unauthenticated calls default to public scope.',
  'Share token management requires authenticated user context and updates user preference fields.',
  'Public digest by userId/token endpoints only return data when public sharing is enabled.',
  'Per-request limit caps (max 50) prevent oversized payloads and reduce ingestion pressure.',
];

const implementationNotes = [
  'Agent API lives under `/api/v1` and is read-focused for automation and feed consumers.',
  'Digest payloads include normalized cluster objects plus a markdown digest text view.',
  'Instrument price source uses Yahoo Finance with in-memory cache fallback for resilience.',
  'OpenAPI files are served directly from `server/openapi/` for contract stability.',
];

const AgentApiWikiPage = () => {
  const changes = useMemo(
    () => wikiChangelog.filter((entry) => ['agent-api', 'wiki'].includes(entry.scope)).slice(0, 6),
    []
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <SEOHead
        title="Asha News - Agent API Wiki"
        description="Reference for /api/v1 endpoint groups, auth model, and AI agent integration patterns."
      />

      <section className="rounded-2xl border border-border-light bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg dark:border-border-dark">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Asha News Wiki</p>
        <h1 className="mt-2 text-3xl font-bold">Agent API Wiki</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          Contract-first documentation for `/api/v1` consumers, automation jobs, and external AI agents.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/wiki" className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40">Wiki Home</a>
          <a href="/api/v1/openapi" target="_blank" rel="noopener noreferrer" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">Open Agent OpenAPI</a>
          <a href="/api/conflicts/openapi" target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40">Conflict OpenAPI</a>
          <ReportDocsIssueButton context="agent-api-wiki" className="border-slate-400/50 bg-transparent text-slate-100 hover:bg-slate-700/40 dark:border-slate-400/50 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-700/40" />
        </div>
      </section>

      <WikiStatusBanner
        version={DOC_VERSION}
        lastUpdated={LAST_UPDATED}
        owner="API platform team"
        flagKeys={['wiki_agent_api_v1']}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Auth Model</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {authModel.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Implementation Notes</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {implementationNotes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {endpointGroups.map((group) => (
          <div key={group.title} className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
            <h2 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">{group.title}</h2>
            <ul className="mt-3 space-y-1 font-mono text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
        <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Recent Changes</h2>
        <div className="mt-3 space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {changes.map((entry) => (
            <div key={`${entry.date}-${entry.change}`}>
              <div className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">{entry.date}</div>
              <div>{entry.change}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AgentApiWikiPage;
