const { __testables } = require('../services/conflictAnalyticsService');

describe('conflictAnalyticsService', () => {
  test('buildEventFromArticle extracts conflict signals and counts', () => {
    const event = __testables.buildEventFromArticle({
      id: 'art-1',
      title: 'Gaza health ministry says 25 killed after Israel airstrike in Rafah',
      summary: 'Officials announced that 40 were injured and 12 identified as John Doe and Jane Smith.',
      content: 'A spokesperson said the strike involved missile systems.',
      source_name: 'Test Wire',
      url: 'https://example.com/report-1',
      published_at: '2026-02-28T12:00:00Z',
    });

    expect(event).toBeTruthy();
    expect(event.conflict).toBe('gaza-israel');
    expect(event.fatalities_total).toBe(25);
    expect(event.injured_total).toBe(40);
    expect(event.ids_released_count).toBe(12);
    expect(event.hit_locations).toContain('Rafah');
    expect(event.weapons).toContain('airstrike');
    expect(Array.isArray(event.identities)).toBe(true);
    expect(event.identities.length).toBeGreaterThan(0);
    expect(event.official_announcement_text).toBeTruthy();
    expect(event.metadata).toEqual(expect.objectContaining({
      weapon_categories: expect.arrayContaining(['air_power', 'missile_systems']),
      official_announcement: expect.objectContaining({
        type: expect.any(String),
        confidence: expect.any(Number),
      }),
    }));
  });

  test('extractIdentitiesFromText and announcement classification provide structured outputs', () => {
    const identities = __testables.extractIdentitiesFromText(
      'Officials announced victim identified as Adam Khalil. Another victim named Nora Saad. casualty ID: A-1029.'
    );
    const announcement = __testables.classifyOfficialAnnouncement(
      'The ministry announced a military operation after a strike.'
    );

    expect(identities).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Adam Khalil', status: 'reported' }),
      expect.objectContaining({ name: 'Nora Saad', status: 'reported' }),
      expect.objectContaining({ id: 'A-1029' }),
    ]));
    expect(announcement).toEqual(expect.objectContaining({
      type: expect.any(String),
      confidence: expect.any(Number),
    }));
  });

  test('aggregateEvents returns totals and grouped comparisons', () => {
    const report = __testables.aggregateEvents([
      {
        id: 'evt-1',
        conflict: 'gaza-israel',
        event_date: '2026-02-27T10:00:00Z',
        actors: ['Israel'],
        hit_locations: ['Rafah'],
        weapons: ['missile'],
        technologies: ['iron dome'],
        fatalities_total: 10,
        injured_total: 20,
        ids_released_count: 4,
        official_announcement_text: 'Ministry announced an update.',
        official_announcement_actor: 'Israel',
        identities: [{ name: 'John Doe', id: '', status: 'reported' }],
        metadata: {
          weapon_categories: ['missile_systems'],
          technology_categories: ['air_defense_platforms'],
          official_announcement: { type: 'military_operation', confidence: 0.7 },
        },
        confidence: 0.8,
        verification_status: 'unverified',
      },
      {
        id: 'evt-2',
        conflict: 'gaza-israel',
        event_date: '2026-02-27T14:00:00Z',
        actors: ['Hamas'],
        hit_locations: ['Rafah'],
        weapons: ['rocket'],
        technologies: [],
        fatalities_total: 5,
        injured_total: 9,
        ids_released_count: 1,
        official_announcement_text: '',
        official_announcement_actor: '',
        identities: [{ name: 'Jane Smith', id: '', status: 'confirmed' }],
        metadata: {
          weapon_categories: ['rocket_artillery'],
          technology_categories: [],
        },
        confidence: 0.5,
        verification_status: 'verified',
      },
    ]);

    expect(report.totals.events).toBe(2);
    expect(report.totals.fatalities_total).toBe(15);
    expect(report.totals.injured_total).toBe(29);
    expect(report.totals.ids_released_count).toBe(5);
    expect(report.totals.identity_records).toBe(2);
    expect(report.totals.official_announcements).toBe(1);
    expect(report.locations_hit[0]).toEqual(expect.objectContaining({ location: 'Rafah', hits: 2 }));
    expect(report.weapon_usage[0]).toEqual(expect.objectContaining({ count: 1 }));
    expect(report.weapon_category_usage).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'missile_systems', count: 1 }),
      expect.objectContaining({ category: 'rocket_artillery', count: 1 }),
    ]));
    expect(report.technology_category_usage).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'air_defense_platforms', count: 1 }),
    ]));
    expect(report.announcement_type_usage).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'military_operation', count: 1 }),
    ]));
    expect(report.identity_status_breakdown).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'reported', count: 1 }),
      expect.objectContaining({ status: 'confirmed', count: 1 }),
    ]));
    expect(report.actor_comparisons).toHaveLength(2);
  });

  test('buildComparison supports actor-vs-actor mode', () => {
    const events = [
      {
        id: 'evt-a',
        conflict: 'gaza-israel',
        event_date: '2026-02-28T08:00:00Z',
        actors: ['Israel'],
        fatalities_total: 4,
        injured_total: 6,
        ids_released_count: 1,
      },
      {
        id: 'evt-b',
        conflict: 'israel-us-iran',
        event_date: '2026-02-28T09:00:00Z',
        actors: ['Iran'],
        fatalities_total: 2,
        injured_total: 3,
        ids_released_count: 0,
      },
      {
        id: 'evt-c',
        conflict: 'gaza-israel',
        event_date: '2026-02-28T10:00:00Z',
        actors: ['Israel'],
        fatalities_total: 1,
        injured_total: 1,
        ids_released_count: 0,
      },
    ];

    const comparison = __testables.buildComparison(events, {
      compare_mode: 'actor-vs-actor',
      compare_left: 'Israel',
      compare_right: 'Iran',
    });

    expect(comparison.mode).toBe('actor-vs-actor');
    expect(comparison.left_metrics.events).toBe(2);
    expect(comparison.right_metrics.events).toBe(1);
  });

  test('deriveScenarioProbabilities returns bounded probability distribution', () => {
    const probabilities = __testables.deriveScenarioProbabilities([
      { event_date: '2026-02-28T10:00:00Z', fatalities_total: 10, injured_total: 15, ids_released_count: 2 },
      { event_date: '2026-02-27T10:00:00Z', fatalities_total: 8, injured_total: 12, ids_released_count: 1 },
      { event_date: '2026-02-20T10:00:00Z', fatalities_total: 3, injured_total: 4, ids_released_count: 0 },
    ], 24);

    const total = probabilities.escalation + probabilities.stable + probabilities.de_escalation;

    expect(probabilities.escalation).toBeGreaterThanOrEqual(0);
    expect(probabilities.stable).toBeGreaterThanOrEqual(0);
    expect(probabilities.de_escalation).toBeGreaterThanOrEqual(0);
    expect(total).toBeGreaterThan(0.99);
    expect(total).toBeLessThan(1.01);
  });

  test('parseDurationMs applies bounds and fallback', () => {
    expect(__testables.parseDurationMs(undefined, 45000, 1000, 300000)).toBe(45000);
    expect(__testables.parseDurationMs('900000', 45000, 1000, 300000)).toBe(300000);
    expect(__testables.parseDurationMs('250', 45000, 1000, 300000)).toBe(1000);
    expect(__testables.parseDurationMs('20000', 45000, 1000, 300000)).toBe(20000);
  });

  test('runWithTimeout rejects with ETIMEOUT when task exceeds budget', async () => {
    await expect(
      __testables.runWithTimeout(
        () => new Promise(() => {}),
        25,
        'test-agent'
      )
    ).rejects.toMatchObject({ code: 'ETIMEOUT' });
  });

  test('runWithTimeout returns result when task completes in budget', async () => {
    const result = await __testables.runWithTimeout(async () => 'ok', 100, 'test-agent');
    expect(result).toBe('ok');
  });

  test('isStaleRunningRun detects only aged running entries', () => {
    const now = Date.parse('2026-03-02T12:00:00.000Z');
    const thresholdMs = 30 * 60 * 1000;

    const stale = __testables.isStaleRunningRun(
      { status: 'running', started_at: '2026-03-02T11:00:00.000Z' },
      thresholdMs,
      now
    );
    const recent = __testables.isStaleRunningRun(
      { status: 'running', started_at: '2026-03-02T11:50:00.000Z' },
      thresholdMs,
      now
    );
    const completed = __testables.isStaleRunningRun(
      { status: 'completed', started_at: '2026-03-02T10:00:00.000Z' },
      thresholdMs,
      now
    );

    expect(stale).toBe(true);
    expect(recent).toBe(false);
    expect(completed).toBe(false);
  });

  test('getPublicArtifactFlag maps supported artifact names', () => {
    expect(__testables.getPublicArtifactFlag('theory')).toBe('conflict_ops_theory_public_v1');
    expect(__testables.getPublicArtifactFlag('forecast')).toBe('conflict_ops_forecast_public_v1');
    expect(__testables.getPublicArtifactFlag('unknown')).toBeNull();
  });
});
