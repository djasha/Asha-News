import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

jest.mock('../contexts/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    useAuth: () => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
  };
});

jest.mock('../services/firebase', () => ({
  firebaseAuthService: {
    getUserToken: jest.fn(async () => null),
  },
}));

jest.mock('../components/BreakingNews/BreakingNewsAlert', () => () => null);
jest.mock('../components/Layout/MobileLayout', () => ({ children }) => <>{children}</>);
jest.mock('../components/Markets/MarketsTickerStrip', () => () => <div data-testid="markets-ticker-stub" />);
jest.mock('../components/Filters/UnifiedFiltersBar', () => () => <div data-testid="unified-filters-stub" />);

const jsonResponse = (payload) => ({
  ok: true,
  status: 200,
  json: async () => payload,
});

beforeEach(() => {
  global.fetch = jest.fn(async (input) => {
    const url = String(input || '');

    if (url.includes('/api/v1/digest')) {
      return jsonResponse({
        digest_text: 'Digest text sample',
        clusters: [
          {
            id: 'cluster-1',
            title: 'Energy update',
            summary: 'Cluster summary',
            topic: 'markets',
            source_count: 3,
            created_at: new Date().toISOString(),
          },
        ],
      });
    }

    if (url.includes('/api/articles')) {
      return jsonResponse({
        data: [
          {
            id: 'article-1',
            title: 'Gold rises on risk demand',
            source_name: 'Reuters',
            published_at: new Date().toISOString(),
            summary: 'Article summary',
          },
        ],
      });
    }

    if (url.includes('/api/v1/instruments/') && url.includes('/news')) {
      return jsonResponse({
        results: [
          {
            id: 'news-1',
            title: 'Bitcoin steady near resistance',
            source: 'Bloomberg',
            published_at: new Date().toISOString(),
            url: 'https://example.com/news-1',
            summary: 'Market news summary',
          },
        ],
      });
    }

    if (url.includes('/api/v1/instruments/prices')) {
      return jsonResponse({ results: [] });
    }

    return jsonResponse({ data: [] });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('v1 core routes render expected shells', () => {
  test('home route renders Home Feed shell', async () => {
    window.history.pushState({}, 'Home', '/');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /home feed/i })).toBeInTheDocument();
  });

  test('markets route renders Markets shell', async () => {
    window.history.pushState({}, 'Markets', '/markets');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /markets/i })).toBeInTheDocument();
  });

  test('digest route renders Digest shell', async () => {
    window.history.pushState({}, 'Digest', '/digest');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /digest/i })).toBeInTheDocument();
  });

  test('monitor route renders Conflict Monitor shell', async () => {
    window.history.pushState({}, 'Monitor', '/monitor');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /conflict monitor/i })).toBeInTheDocument();
  });

  test('cod war monitor route renders launcher shell', async () => {
    window.history.pushState({}, 'COD War Monitor', '/cod-war-monitor');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /opening world monitor/i })).toBeInTheDocument();
  });

  test('wiki route renders Wiki shell', async () => {
    window.history.pushState({}, 'Wiki', '/wiki');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /^wiki$/i })).toBeInTheDocument();
  });

  test('markets wiki route renders Markets Wiki shell', async () => {
    window.history.pushState({}, 'Markets Wiki', '/wiki/markets');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /markets wiki/i })).toBeInTheDocument();
  });

  test('ai checker wiki route renders AI Checker Wiki shell', async () => {
    window.history.pushState({}, 'AI Checker Wiki', '/wiki/ai-checker');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /ai checker wiki/i })).toBeInTheDocument();
  });

  test('agent api wiki route renders Agent API Wiki shell', async () => {
    window.history.pushState({}, 'Agent API Wiki', '/wiki/agent-api');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /agent api wiki/i })).toBeInTheDocument();
  });
});
