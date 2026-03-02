import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../config/api';
import { CORE_INSTRUMENTS } from '../../config/v1';

const MarketsTickerStrip = ({ onSelect, selectedSymbol }) => {
  const [prices, setPrices] = useState([]);

  const symbolsParam = useMemo(
    () => CORE_INSTRUMENTS.map((item) => item.symbol).join(','),
    []
  );

  useEffect(() => {
    let alive = true;
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/instruments/prices?symbols=${encodeURIComponent(symbolsParam)}`);
        const json = await res.json();
        if (!alive) return;
        setPrices(Array.isArray(json?.results) ? json.results : []);
      } catch (_) {
        if (!alive) return;
        setPrices([]);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60 * 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [symbolsParam]);

  const merged = CORE_INSTRUMENTS.map((instrument) => {
    const found = prices.find((row) => row.symbol === instrument.symbol);
    return {
      ...instrument,
      ...found,
    };
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-border-light dark:border-border-dark bg-surface-elevated-light dark:bg-surface-elevated-dark">
      <div className="flex min-w-max items-center gap-2 p-2">
        {merged.map((item) => {
          const isActive = selectedSymbol === item.symbol;
          const change = Number(item.change_pct || 0);
          return (
            <button
              key={item.symbol}
              onClick={() => onSelect?.(item.symbol)}
              className={`rounded-lg px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-light text-text-primary-light dark:bg-surface-dark dark:text-text-primary-dark hover:bg-primary-50 dark:hover:bg-primary-900/30'
              }`}
            >
              <div className="text-xs font-semibold">{item.name}</div>
              <div className="text-sm">{item.price ? Number(item.price).toLocaleString() : '--'}</div>
              <div className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Number.isFinite(change) ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '--'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MarketsTickerStrip;

