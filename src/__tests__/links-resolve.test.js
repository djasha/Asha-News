import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock fetch so CMS-backed pages show fallback text instead of making network calls
let originalFetch;
const fallbackStub = async () => ({ ok: false, status: 404, json: async () => ({}) });

beforeAll(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn(async (url) => {
    // Return 404 for any /api/* request to trigger fallbacks
    if (typeof url === 'string' && url.startsWith('/api/')) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
});

afterAll(() => {
  // Restore to original if present, otherwise provide a safe stub
  global.fetch = originalFetch || fallbackStub;
});

const routes = [
  { path: '/about', pattern: /about page coming soon/i },
  { path: '/features', pattern: /features page coming soon/i },
  { path: '/contact', pattern: /contact page coming soon/i },
  { path: '/api', pattern: /api docs coming soon/i },
  { path: '/privacy', pattern: /privacy policy coming soon/i },
  { path: '/terms', pattern: /terms of service coming soon/i },
  { path: '/cookies', pattern: /cookie policy coming soon/i },
  { path: '/gdpr', pattern: /gdpr page coming soon/i },
  { path: '/rss', pattern: /subscribe to our rss feed/i },
  { path: '/careers', pattern: /careers page coming soon/i },
  { path: '/subscribe', pattern: /sign in required/i }
];

describe('Header/Footer links resolve to defined routes', () => {
  test.each(routes)('navigates to %s and renders expected content', async ({ path, pattern }) => {
    window.history.pushState({}, 'Test', path);
    render(<App />);
    const el = await screen.findByText(pattern, {}, { timeout: 3000 });
    expect(el).toBeInTheDocument();
  });
});
