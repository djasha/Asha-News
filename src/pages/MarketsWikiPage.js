import React, { useMemo } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import ReportDocsIssueButton from '../components/Wiki/ReportDocsIssueButton';
import WikiStatusBanner from '../components/Wiki/WikiStatusBanner';
import wikiChangelog from '../data/wikiChangelog.json';

const DOC_VERSION = 'v1.0.0';
const LAST_UPDATED = '2026-03-02';

const endpoints = [
  'GET /api/v1/instruments/:symbol/news?limit=30',
  'GET /api/v1/instruments/prices?symbols=BTCUSD,ETHUSD,XAUUSD,...',
  'GET /api/v1/clusters/search?q=market+query&limit=20',
  'GET /api/v1/digest?scope=public&topic=markets&timeframe=24h',
  'GET /api/v1/openapi',
];

const workflows = [
  'UI flow: /markets selects a core symbol, renders TradingView chart, and loads symbol-related news.',
  'News matching: server maps each symbol to alias terms and scans recent article content.',
  'Price flow: market quotes are fetched from Yahoo Finance with cached fallback when upstream fails.',
  'Filtering: unified filters apply timeframe/topic/source constraints to instrument news results.',
];

const guardrails = [
  'Instrument-to-alias matching is keyword based and may include edge-case false positives.',
  'Price endpoint can return cached or partial values when live quote providers fail.',
  'Chart rendering is external (TradingView iframe) and should be treated as third-party content.',
  'Related news panels should preserve source attribution and publication timestamps.',
];

const MarketsWikiPage = () => {
  const changes = useMemo(
    () => wikiChangelog.filter((entry) => ['markets', 'wiki'].includes(entry.scope)).slice(0, 6),
    []
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <SEOHead
        title="Asha News - Markets Wiki"
        description="Documentation for markets instrument workflows, endpoint contracts, and operational guardrails."
      />

      <section className="rounded-2xl border border-border-light bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg dark:border-border-dark">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Asha News Wiki</p>
        <h1 className="mt-2 text-3xl font-bold">Markets Wiki</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          Implementation and operations guide for the markets intelligence surface (`/markets`) and related `/api/v1` endpoints.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/wiki" className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40">Wiki Home</a>
          <a href="/markets" className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">Open Markets</a>
          <a href="/api/v1/openapi" target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-400/50 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/40">Agent OpenAPI</a>
          <ReportDocsIssueButton context="markets-wiki" className="border-slate-400/50 bg-transparent text-slate-100 hover:bg-slate-700/40 dark:border-slate-400/50 dark:bg-transparent dark:text-slate-100 dark:hover:bg-slate-700/40" />
        </div>
      </section>

      <WikiStatusBanner
        version={DOC_VERSION}
        lastUpdated={LAST_UPDATED}
        owner="Markets team"
        flagKeys={['wiki_markets_v1']}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Core Workflows</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {workflows.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-border-light bg-surface-elevated-light p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
          <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Safety and Reliability</h2>
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

export default MarketsWikiPage;
