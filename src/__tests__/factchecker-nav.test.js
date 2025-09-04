import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '../contexts/ThemeContext';
import Navigation from '../components/Navigation/Navigation';
import BottomNavigation from '../components/Layout/BottomNavigation';
import FactCheckerPage from '../pages/FactCheckerPage';

const Providers = ({ children, initialEntries = ['/'] }) => (
  <HelmetProvider>
    <ThemeProvider>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </ThemeProvider>
  </HelmetProvider>
);

describe('Fact Checker Navigation and Page', () => {
  test('Navigation includes a Fact Checker link pointing to /fact-check', () => {
    render(
      <Providers>
        <Navigation />
      </Providers>
    );

    const link = screen.getByRole('link', { name: /fact checker/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('/fact-check'));
  });

  test('BottomNavigation displays Fact Checker tab', () => {
    render(
      <Providers>
        <BottomNavigation />
      </Providers>
    );

    // Button has both aria-label and visible text
    const btn = screen.getByRole('button', { name: /fact checker/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText(/fact checker/i)).toBeInTheDocument();
  });

  test('FactCheckerPage renders its H1 title', () => {
    render(
      <Providers initialEntries={["/fact-check"]}>
        <FactCheckerPage />
      </Providers>
    );

    expect(screen.getByRole('heading', { level: 1, name: /fact checker/i })).toBeInTheDocument();
  });
});
