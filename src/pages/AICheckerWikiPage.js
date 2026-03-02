import React, { useMemo } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import ReportDocsIssueButton from '../components/Wiki/ReportDocsIssueButton';
import WikiStatusBanner from '../components/Wiki/WikiStatusBanner';
import wikiChangelog from '../data/wikiChangelog.json';

const DOC_VERSION = 'v1.0.0';
const LAST_UPDATED = '2026-03-02';

const endpoints = [
  'GET /api/fact-check/recent-claims',
  'GET /api/fact-check/google-search?query=...&pageSize=...',
  'POST /api/fact-check/google-image-search',
  'POST /api/fact-check/perplexity-search',
  'POST /api/fact-check/analyze',
];

const workflows = [
  'Search-first: query claim text or image URL and retrieve claim matches.',
  'Provider fallback: Google Fact Check paths with Perplexity fallback as needed.',
  'AI assessment: request additional analysis for confidence/context summarization.',
  'User actions: save claim history and inspect supporting sources/reviews.',
];

const guardrails = [
  'Treat AI outputs as assistive summaries, not authoritative verdicts.',
  'Always display source links and review metadata where available.',
  'Avoid deterministic language when confidence is low or evidence is sparse.',
  'Preserve user privacy and avoid storing sensitive user-entered data unnecessarily.',
];

const AICheckerWikiPage = () => {
  const changes = useMemo(
    () => wikiChangelog.filter((entry) => ['ai-checker', 'wiki'].includes(entry.scope)).slice(0, 6),
    []
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <SEOHead
        title="Asha News - AI Checker Wiki"
        description="Documentation for AI Checker workflows, endpoints, and safety constraints."
      />

      <section className="rounded-2xl border border-border-light bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg dark:border-border-dark">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Asha News Wiki</p>
        <h1 className="mt-2 text-3xl font-bold">AI Checker Wiki</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          Operational and developer documentation for the AI Checker surface (`/ai-checker`) and its fact-checking APIs.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/wiki" className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40">Wiki Home</a>
          <a href="/ai-checker" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">Open AI Checker</a>
          <ReportDocsIssueButton context="ai-checker-wiki" className="border-slate-400/50 bg-transparent text-slate-100 hover:bg-slate-700/40 dark:border-slate-400/50 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-700/40" />
        </div>
      </section>

      <WikiStatusBanner
        version={DOC_VERSION}
        lastUpdated={LAST_UPDATED}
        owner="AI Checker team"
        flagKeys={['wiki_ai_checker_v1']}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Core Workflows</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {workflows.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Safety Guardrails</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {guardrails.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
        <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Endpoint Reference</h2>
        <ul className="mt-3 space-y-1 font-mono text-xs text-text-secondary-light dark:text-text-secondary-dark">
          {endpoints.map((endpoint) => <li key={endpoint}>{endpoint}</li>)}
        </ul>
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

export default AICheckerWikiPage;
