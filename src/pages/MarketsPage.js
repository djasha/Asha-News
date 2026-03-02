import React, { useEffect, useMemo, useState } from 'react';
import SEOHead from '../components/SEO/SEOHead';
import UnifiedFiltersBar from '../components/Filters/UnifiedFiltersBar';
import MarketsTickerStrip from '../components/Markets/MarketsTickerStrip';
import { API_BASE } from '../config/api';
import { CORE_INSTRUMENTS } from '../config/v1';
import { useUnifiedFilters } from '../hooks/useUnifiedFilters';
import { applyUnifiedFilters, formatTimeAgo } from '../utils/feedFilters';

const TV_SYMBOL_MAP = {
  BTCUSD: 'BINANCE:BTCUSDT',
  ETHUSD: 'BINANCE:ETHUSDT',
  XAUUSD: 'OANDA:XAUUSD',
  XAGUSD: 'OANDA:XAGUSD',
  EURUSD: 'FX:EURUSD',
  OIL: 'TVC:USOIL',
  SPX: 'SP:SPX',
  NASDAQ: 'NASDAQ:NDX',
};

const MarketsPage = () => {
  const defaultSymbol = CORE_INSTRUMENTS[0].symbol;
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { filters, updateFilter, resetFilters } = useUnifiedFilters({
    timeframe: '7d',
    topic: '',
  });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/v1/instruments/${encodeURIComponent(symbol)}/news?limit=30`);
        const json = await res.json().catch(() => ({}));
        if (!alive) return;
        setNews(Array.isArray(json?.results) ? json.results : []);
      } catch (_) {
        if (!alive) return;
        setError('Failed to load instrument news');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [symbol]);

  const filteredNews = useMemo(
    () => applyUnifiedFilters(news, filters),
    [news, filters]
  );

  const tvSymbol = TV_SYMBOL_MAP[symbol] || 'BINANCE:BTCUSDT';
  const selectedLabel = CORE_INSTRUMENTS.find((item) => item.symbol === symbol)?.name || symbol;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-4">
      <SEOHead
        title="Asha News - Markets"
        description="Track major markets and see related cluster-backed news in one page."
      />

      <section className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-6">
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Instrument charts with related market news and clustering context.
        </p>
      </section>

      <MarketsTickerStrip selectedSymbol={symbol} onSelect={setSymbol} />

      <UnifiedFiltersBar
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      <section className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
        <div className="mb-3 text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
          {selectedLabel} Chart
        </div>
        <iframe
          title={`${symbol} chart`}
          className="h-[420px] w-full rounded-lg"
          src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=60&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&theme=light`}
          frameBorder="0"
          scrolling="no"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Related News for {selectedLabel}</h2>
        {loading && (
          <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4">
            Loading market news...
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>
        )}
        {!loading && !error && filteredNews.length === 0 && (
          <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            No market news matched current filters.
          </div>
        )}
        <div className="space-y-2">
          {filteredNews.map((item) => (
            <a
              key={item.id}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark p-4 hover:border-primary-500"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                <span>{item.source || 'Unknown source'}</span>
                <span>•</span>
                <span>{formatTimeAgo(item.published_at)}</span>
              </div>
              <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
              {item.summary && (
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {item.summary}
                </p>
              )}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MarketsPage;
