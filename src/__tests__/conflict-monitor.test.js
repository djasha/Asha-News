import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HelmetProvider } from 'react-helmet-async';
import ConflictMonitorPage from '../pages/ConflictMonitorPage';

beforeEach(() => {
  global.fetch = jest.fn(async (input) => {
    const url = String(input || '');

    if (url.includes('/api/conflicts/stats')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            totals: {
              events: 2,
              fatalities_total: 15,
              injured_total: 29,
              ids_released_count: 5,
              official_announcements: 1,
            },
            actor_comparisons: [
              { actor: 'Israel', events: 1, fatalities_total: 10, injured_total: 20 },
              { actor: 'Hamas', events: 1, fatalities_total: 5, injured_total: 9 },
            ],
            locations_hit: [{ location: 'Rafah', hits: 2 }],
            weapon_usage: [{ weapon: 'missile', count: 1 }],
            technology_usage: [{ technology: 'iron dome', count: 1 }],
            timeline: [{ date: '2026-02-27', events: 2, fatalities_total: 15, injured_total: 29 }],
            official_announcements: [{
              id: 'evt-1',
              date: '2026-02-27T10:00:00Z',
              conflict: 'gaza-israel',
              actor: 'Israel',
              text: 'Official statement text',
              source_name: 'Test Wire',
              source_url: 'https://example.com/report-1',
            }],
          },
        }),
      };
    }

    if (url.includes('/api/conflicts/events')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'evt-1',
              conflict: 'gaza-israel',
              event_date: '2026-02-27T10:00:00Z',
              actors: ['Israel'],
              fatalities_total: 10,
              injured_total: 20,
              ids_released_count: 4,
              hit_locations: ['Rafah'],
              weapons: ['missile'],
              technologies: ['iron dome'],
              source_name: 'Test Wire',
              source_url: 'https://example.com/report-1',
            },
          ],
        }),
      };
    }

    if (url.includes('/api/cms/feature-flags?map=true')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            conflict_ops_dashboard_v1: true,
            cod_war_monitor_v1: true,
          },
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({}),
    };
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ConflictMonitorPage', () => {
  test('renders tactical dashboard totals and actor section', async () => {
    render(
      <HelmetProvider>
        <ConflictMonitorPage />
      </HelmetProvider>
    );

    expect(await screen.findByRole('heading', { name: /tactical dashboard/i })).toBeInTheDocument();
    const [fatalitiesLabel] = await screen.findAllByText('Fatalities');
    const fatalitiesCard = fatalitiesLabel?.closest('div')?.parentElement;
    expect(fatalitiesCard).toBeTruthy();
    expect(within(fatalitiesCard).getByText('15')).toBeInTheDocument();
    expect(await screen.findByText(/actor comparison/i)).toBeInTheDocument();
    expect((await screen.findAllByText('Rafah')).length).toBeGreaterThan(0);
  });

  test('keeps advanced controls hidden by default and reveals on toggle', async () => {
    render(
      <HelmetProvider>
        <ConflictMonitorPage />
      </HelmetProvider>
    );

    await screen.findByRole('heading', { name: /tactical dashboard/i });
    expect(screen.queryByText(/advanced comparison controls/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /advanced/i }));
    expect(await screen.findByText(/advanced comparison controls/i)).toBeInTheDocument();
    expect(screen.getByText('Comparison')).toBeInTheDocument();
  });
});
