import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import StoryClusterPage from '../../StoryCluster/StoryClusterPage';

const makeCluster = () => ({
  success: true,
  data: {
    id: 'test-cluster-1',
    cluster_title: 'Test Story Title',
    cluster_summary: 'This is a detailed summary that should be clamped when settings require it.',
    expanded_summary: 'This is an expanded summary used for read more.',
    article_count: 3,
    updated_at: new Date().toISOString(),
    topic_category: 'general',
    bias_distribution: { left: 30, center: 40, right: 30 },
    coverage_quality: { completeness: 80, accuracy: 85, timeliness: 90 },
    key_facts: ['Fact A', 'Fact B'],
    suggested_questions: ['Q1?', 'Q2?'],
    suggested_answers: ['A1', 'A2'],
    articles: [
      { id: 'a1', title: 'Article 1', source_name: 'Reuters', political_bias: 'center', similarity_score: 0.9, is_primary_source: true, published_at: new Date().toISOString(), excerpt: 'E1' },
      { id: 'a2', title: 'Article 2', source_name: 'BBC', political_bias: 'lean_left', similarity_score: 0.8, is_primary_source: false, published_at: new Date().toISOString(), excerpt: 'E2' },
      { id: 'a3', title: 'Article 3', source_name: 'Fox News', political_bias: 'right', similarity_score: 0.7, is_primary_source: false, published_at: new Date().toISOString(), excerpt: 'E3' },
    ]
  }
});

function renderWithRouter(route = '/story/test-cluster-1') {
  return render(
    <HelmetProvider>
      <MemoryRouter
        initialEntries={[route]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/story/:clusterId" element={<StoryClusterPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('StoryClusterPage presentation toggles', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes('/api/admin-settings')) {
        return {
          ok: true,
          json: async () => ({
            settings: {
              clusterSettings: {
                showBiasCharts: false,
                showPerspectives: false,
                showQA: false,
                showKeyFacts: false,
                sourcesPerCluster: 2,
                summaryMaxChars: 30,
                keepIndividualArticles: false,
              }
            }
          })
        };
      }
      if (String(url).includes('/api/clusters/')) {
        return { ok: true, json: async () => makeCluster() };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  test('hides bias chart, Q&A, Key Facts, clamps summary, limits sources, disables article links', async () => {
    renderWithRouter();

    // Wait for title to appear
    await waitFor(() => expect(screen.getByText('Test Story Title')).toBeInTheDocument());

    // Summary is clamped with ellipsis
    const summary = screen.getByText((content) => content.startsWith('This is a detailed summary'));
    expect(summary.textContent.endsWith('…')).toBe(true);

    // Bias chart container title should not exist when toggled off
    expect(screen.queryByText('Source Perspectives')).toBeNull();

    // Key Facts header should be hidden
    expect(screen.queryByText('Key Facts')).toBeNull();

    // Q&A header should be hidden
    expect(screen.queryByText('Questions & Answers')).toBeNull();

    // Check that only 2 sources are shown (sourcesPerCluster=2)
    // Look for article titles in the "All Sources" section specifically
    const allSourcesSection = screen.getByText('All Sources').closest('div').parentElement;
    
    // Find article titles within the sources section
    const articleTitles = await screen.findAllByText(/Article \d/, { 
      selector: 'h3 span, h3 a' 
    });
    
    // Should only show 2 articles due to sourcesPerCluster=2
    const visibleArticles = articleTitles.filter(el => 
      el.textContent.match(/^Article [12]$/)
    );
    expect(visibleArticles.length).toBe(2);
    
    // Check that links are disabled (should be spans, not links)
    visibleArticles.forEach(article => {
      expect(article.tagName.toLowerCase()).toBe('span');
    });
  });
});
