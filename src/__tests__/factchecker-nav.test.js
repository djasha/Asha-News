import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SiteConfigProvider } from '../contexts/SiteConfigContext';
import Navigation from '../components/Navigation/Navigation';
import BottomNavigation from '../components/Layout/BottomNavigation';
import FactCheckerPage from '../pages/FactCheckerPage';

const Providers = ({ children, initialEntries = ['/'] }) => (
  <HelmetProvider>
    <ThemeProvider>
      <SiteConfigProvider>
        <MemoryRouter
          initialEntries={initialEntries}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          {children}
        </MemoryRouter>
      </SiteConfigProvider>
    </ThemeProvider>
  </HelmetProvider>
);

describe('Fact Checker Navigation and Page', () => {
  test('Navigation includes an AI Checker link pointing to /ai-checker', async () => {
    render(
      <Providers>
        <Navigation />
      </Providers>
    );

    const link = await screen.findByRole('link', { name: /ai checker/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('/ai-checker'));
  });

  test('BottomNavigation displays AI Checker tab for v1 nav', () => {
    render(
      <Providers>
        <BottomNavigation />
      </Providers>
    );

    const btn = screen.getByRole('button', { name: /ai/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText(/ai/i)).toBeInTheDocument();
  });

  test('FactCheckerPage renders its H1 title', () => {
    render(
      <Providers initialEntries={["/fact-check"]}>
        <FactCheckerPage />
      </Providers>
    );

    // Accept either "AI Fact Check" (current) or generic "Fact Checker"
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/(ai fact check|fact checker)/i);
  });
});
