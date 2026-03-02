export const V1_CORE_ONLY = (process.env.REACT_APP_V1_CORE_ONLY ?? 'true') !== 'false';

export const CORE_NAV_ITEMS_DESKTOP = [
  { label: 'Home', path: '/', fontSize: '16', fontWeight: '600' },
  { label: 'AI Checker', path: '/ai-checker', fontSize: '16', fontWeight: '600' },
  { label: 'Markets', path: '/markets', fontSize: '16', fontWeight: '600' },
  { label: 'Digest', path: '/digest', fontSize: '16', fontWeight: '600' },
];

export const CORE_NAV_ITEMS_MOBILE = [
  { label: 'Home', path: '/', icon: 'newspaper', enabled: true, sort_order: 1 },
  { label: 'AI', path: '/ai-checker', icon: 'eye', enabled: true, sort_order: 2 },
  { label: 'Markets', path: '/markets', icon: 'chart', enabled: true, sort_order: 3 },
  { label: 'Digest', path: '/digest', icon: 'document', enabled: true, sort_order: 4 },
];

export const CORE_SIDE_MENU = [
  {
    id: 1,
    title: 'Core',
    enabled: true,
    sort_order: 1,
    items: CORE_NAV_ITEMS_DESKTOP.map((item, idx) => ({
      label: item.label,
      path: item.path,
      enabled: true,
      sort_order: idx + 1,
    })),
  },
];

export const CORE_INSTRUMENTS = [
  { symbol: 'XAUUSD', name: 'Gold' },
  { symbol: 'XAGUSD', name: 'Silver' },
  { symbol: 'OIL', name: 'Oil (Brent/WTI)' },
  { symbol: 'EURUSD', name: 'EUR/USD' },
  { symbol: 'BTCUSD', name: 'Bitcoin' },
  { symbol: 'ETHUSD', name: 'Ethereum' },
  { symbol: 'SPX', name: 'S&P 500' },
  { symbol: 'NASDAQ', name: 'Nasdaq 100' },
];

