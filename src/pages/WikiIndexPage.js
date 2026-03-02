import React, { useMemo } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import ReportDocsIssueButton from '../components/Wiki/ReportDocsIssueButton';
import WikiStatusBanner from '../components/Wiki/WikiStatusBanner';
import wikiChangelog from '../data/wikiChangelog.json';

const DOC_VERSION = 'v1.2.0';
const LAST_UPDATED = '2026-03-02';

const wikiCards = [
  {
    title: 'Conflict Ops Wiki',
    path: '/wiki/conflict-ops',
    description: 'Autonomy architecture, dashboards, queues, safety gates, and rollout playbooks.',
    tag: 'Operations',
  },
  {
    title: 'AI Checker Wiki',
    path: '/wiki/ai-checker',
    description: 'Fact-checking workflow, API usage patterns, and safety guardrails.',
    tag: 'Product',
  },
  {
    title: 'Markets Wiki',
    path: '/wiki/markets',
    description: 'Instrument news flow, price sources, and dashboard integration points.',
    tag: 'Product',
  },
  {
    title: 'Agent API Wiki',
    path: '/wiki/agent-api',
    description: 'Read-focused /api/v1 contract, auth modes, and public sharing model.',
    tag: 'API',
  },
  {
    title: 'Conflict OpenAPI',
    path: '/api/conflicts/openapi',
    description: 'Machine-readable API contract for conflict operations endpoints.',
    tag: 'API',
    external: true,
  },
  {
    title: 'Agent API OpenAPI',
    path: '/api/v1/openapi',
    description: 'Versioned read-focused API schema for AI agents and digest consumers.',
    tag: 'API',
    external: true,
  },
  {
    title: 'Conflicts Dashboard',
    path: '/conflicts',
    description: 'Tactical conflict dashboard with verified-first metrics and analyst tab.',
    tag: 'Product',
  },
  {
    title: 'Admin Conflict Ops',
    path: '/admin/conflicts',
    description: 'Admin command center for autonomy trends, source queue, and review queue.',
    tag: 'Admin',
  },
];

const WikiIndexPage = () => {
  const updates = useMemo(() => wikiChangelog.slice(0, 8), []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <SEOHead
        title="Asha News - Wiki"
        description="Asha News product and technical documentation index."
      />

      <section className="rounded-2xl border border-border-light bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg dark:border-border-dark">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Asha News Knowledge Base</p>
        <h1 className="mt-2 text-3xl font-bold">Wiki</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          Central entry point for product documentation, API specs, and operational runbooks.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/"
            className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40"
          >
            Home
          </a>
          <ReportDocsIssueButton
            context="wiki-index"
            className="border-slate-400/50 bg-transparent text-slate-100 hover:bg-slate-700/40 dark:border-slate-400/50 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-700/40"
          />
        </div>
      </section>

      <WikiStatusBanner
        version={DOC_VERSION}
        lastUpdated={LAST_UPDATED}
        owner="Platform + Documentation"
        flagKeys={['wiki_index_v1']}
      />

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wikiCards.map((card) => (
          <a
            key={card.title}
            href={card.path}
            target={card.external ? '_blank' : undefined}
            rel={card.external ? 'noopener noreferrer' : undefined}
            className="rounded-xl border border-border-light bg-surface-elevated-light p-5 shadow-sm transition hover:shadow-md dark:border-border-dark dark:bg-surface-elevated-dark"
          >
            <div className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {card.tag}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">{card.title}</h2>
            <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">{card.description}</p>
          </a>
        ))}
      </section>

      <section className="rounded-xl border border-border-light bg-surface-elevated-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-elevated-dark">
        <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Latest Documentation Updates</h2>
        <div className="mt-3 space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          {updates.map((entry) => (
            <div key={`${entry.date}-${entry.scope}-${entry.change}`}>
              <div className="text-xs font-semibold uppercase tracking-wide text-text-primary-light dark:text-text-primary-dark">
                {entry.date} · {entry.scope}
              </div>
              <div>{entry.change}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default WikiIndexPage;
