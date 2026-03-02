import React from 'react';

const UnifiedFiltersBar = ({ filters, onChange, onReset }) => {
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <select
          className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm"
          value={filters.topic}
          onChange={(e) => onChange('topic', e.target.value)}
        >
          <option value="">All Topics</option>
          <option value="politics">Politics</option>
          <option value="business">Business</option>
          <option value="technology">Technology</option>
          <option value="international">International</option>
          <option value="markets">Markets</option>
          <option value="crypto">Crypto</option>
        </select>

        <input
          className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm"
          value={filters.source}
          onChange={(e) => onChange('source', e.target.value)}
          placeholder="Source filter"
        />

        <select
          className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm"
          value={filters.bias}
          onChange={(e) => onChange('bias', e.target.value)}
        >
          <option value="all">All Bias</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>

        <select
          className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm"
          value={filters.timeframe}
          onChange={(e) => onChange('timeframe', e.target.value)}
        >
          <option value="6h">Last 6h</option>
          <option value="24h">Last 24h</option>
          <option value="3d">Last 3 days</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>

        <select
          className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2 text-sm"
          value={filters.contentType}
          onChange={(e) => onChange('contentType', e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="article">Articles</option>
          <option value="post">Posts</option>
          <option value="video">Videos</option>
          <option value="podcast">Podcasts</option>
        </select>

        <button
          onClick={onReset}
          className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default UnifiedFiltersBar;

