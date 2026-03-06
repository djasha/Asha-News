const express = require('express');

jest.mock('../services/missionControlService', () => ({
  getHomeSnapshot: jest.fn(),
  getTicker: jest.fn(),
  getFeedHome: jest.fn(),
  getFeedItems: jest.fn(),
  getFeedFiltersCatalog: jest.fn(),
  getFeedTopics: jest.fn(),
  getFeedCategories: jest.fn(),
  getFeedCountries: jest.fn(),
  getAlertsInbox: jest.fn(),
  getAlertActions: jest.fn(),
  applyAlertAction: jest.fn(),
  getLeaks: jest.fn(),
  getLayersCatalog: jest.fn(),
  getHazardsCatalog: jest.fn(),
  getSafetyGuides: jest.fn(),
  getExplainers: jest.fn(),
  updateWorkspaceLayout: jest.fn(),
  getNotificationPreferences: jest.fn(),
  getNotificationTelemetry: jest.fn(),
  getOpsHealth: jest.fn(),
  getMapLayers: jest.fn(),
  getMapSession: jest.fn(),
  getWorldMonitorResources: jest.fn(),
  updateNotificationPreferences: jest.fn(),
  updateAlertAudioPreferences: jest.fn(),
}));

const missionControlService = require('../services/missionControlService');

const buildApp = () => {
  const routePath = require.resolve('../routes/missionControl');
  delete require.cache[routePath];
  // eslint-disable-next-line global-require
  const router = require('../routes/missionControl');
  const app = express();
  app.use(express.json());
  app.use('/api/mc', router);
  return app;
};

const startServer = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });

describe('mission control routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/mc/home returns mission snapshot', async () => {
    missionControlService.getHomeSnapshot.mockResolvedValue({
      posture: { level: 'ELEVATED' },
      critical_now: [{ id: 'alert-1' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/home?conflict=gaza-israel`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.critical_now).toHaveLength(1);
    expect(missionControlService.getHomeSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ conflict: 'gaza-israel' })
    );
  });

  test('GET /api/mc/ticker returns ticker payload', async () => {
    missionControlService.getTicker.mockResolvedValue({
      items: [{ id: 'ticker-1', kind: 'verified' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/ticker`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items[0].kind).toBe('verified');
    expect(missionControlService.getTicker).toHaveBeenCalled();
  });

  test('GET /api/mc/feed/home returns feed summary payload', async () => {
    missionControlService.getFeedHome.mockResolvedValue({
      tab_counts: { feed: 12, whale: 3, flights: 7 },
      items: [{ id: 'feed-1' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/feed/home`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.tab_counts.feed).toBe(12);
    expect(missionControlService.getFeedHome).toHaveBeenCalled();
  });

  test('GET /api/mc/feed/items returns paginated feed items', async () => {
    missionControlService.getFeedItems.mockResolvedValue({
      tab: 'feed',
      items: [{ id: 'feed-1', source_type: 'telegram' }],
      page: { cursor: 0, next_cursor: 1, has_more: true, total_filtered: 25 },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/feed/items?tab=feed&limit=1`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items[0].source_type).toBe('telegram');
    expect(missionControlService.getFeedItems).toHaveBeenCalled();
  });

  test('GET /api/mc/feed/items forwards multi-value filter query params', async () => {
    missionControlService.getFeedItems.mockResolvedValue({
      tab: 'feed',
      items: [],
      page: { cursor: 0, next_cursor: null, has_more: false, total_filtered: 0 },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/mc/feed/items?tab=feed&topic=conflict,cyber&category=security,markets&country_filter=IL,US&source_type=telegram,news`
    );
    await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(missionControlService.getFeedItems).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'conflict,cyber',
        category: 'security,markets',
        country_filter: 'IL,US',
        source_type: 'telegram,news',
      })
    );
  });

  test('GET /api/mc/feed/filters/catalog returns filter catalog', async () => {
    missionControlService.getFeedFiltersCatalog.mockResolvedValue({
      severities: ['ALL', 'CRITICAL'],
      source_types: ['telegram', 'news'],
      topics: ['conflict'],
      categories: ['security'],
      countries: ['US'],
      verification_statuses: ['verified', 'unverified'],
      time_ranges: ['all', '24h'],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/feed/filters/catalog`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.source_types).toEqual(['telegram', 'news']);
    expect(missionControlService.getFeedFiltersCatalog).toHaveBeenCalled();
  });

  test('GET /api/mc/feed/topics returns topics list', async () => {
    missionControlService.getFeedTopics.mockResolvedValue({
      items: ['conflict', 'maritime'],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/feed/topics`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items).toEqual(['conflict', 'maritime']);
    expect(missionControlService.getFeedTopics).toHaveBeenCalled();
  });

  test('GET /api/mc/feed/categories returns categories list', async () => {
    missionControlService.getFeedCategories.mockResolvedValue({
      items: ['security', 'economic-shock'],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/feed/categories`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items).toEqual(['security', 'economic-shock']);
    expect(missionControlService.getFeedCategories).toHaveBeenCalled();
  });

  test('GET /api/mc/feed/countries returns countries list', async () => {
    missionControlService.getFeedCountries.mockResolvedValue({
      items: ['US', 'IL'],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/feed/countries`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items).toEqual(['US', 'IL']);
    expect(missionControlService.getFeedCountries).toHaveBeenCalled();
  });

  test('GET /api/mc/alerts/inbox returns inbox sections', async () => {
    missionControlService.getAlertsInbox.mockResolvedValue({
      critical: [{ id: 'alert-1' }],
      assigned: [],
      following: [],
      resolved: [],
      unread_total: 1,
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/alerts/inbox`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.unread_total).toBe(1);
    expect(missionControlService.getAlertsInbox).toHaveBeenCalled();
  });

  test('GET /api/mc/alerts/actions returns persisted action state', async () => {
    missionControlService.getAlertActions.mockResolvedValue({
      acknowledged_alert_ids: ['alert-1'],
      followed_regions: ['gaza'],
      muted_signatures: [],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/alerts/actions`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.acknowledged_alert_ids[0]).toBe('alert-1');
    expect(missionControlService.getAlertActions).toHaveBeenCalled();
  });

  test('POST /api/mc/alerts/:id/acknowledge persists action', async () => {
    missionControlService.applyAlertAction.mockResolvedValue({
      action: 'acknowledge',
      state: { acknowledged_alert_ids: ['alert-1'] },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/alerts/alert-1/acknowledge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: 'gaza' }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.action).toBe('acknowledge');
    expect(missionControlService.applyAlertAction).toHaveBeenCalledWith(
      'acknowledge',
      expect.any(Object),
      expect.objectContaining({ alert_id: 'alert-1' })
    );
  });

  test('POST /api/mc/alerts/:id/mute-similar persists mute signature', async () => {
    missionControlService.applyAlertAction.mockResolvedValue({
      action: 'mute_similar',
      state: { muted_signatures: ['gaza::ACLED'] },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/alerts/alert-2/mute-similar`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ signature: 'gaza::ACLED' }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.action).toBe('mute_similar');
    expect(missionControlService.applyAlertAction).toHaveBeenCalledWith(
      'mute_similar',
      expect.any(Object),
      expect.objectContaining({ alert_id: 'alert-2', signature: 'gaza::ACLED' })
    );
  });

  test('POST /api/mc/alerts/:id/follow-region persists followed region', async () => {
    missionControlService.applyAlertAction.mockResolvedValue({
      action: 'follow_region',
      state: { followed_regions: ['Rafah'] },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/alerts/alert-3/follow-region`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ region: 'Rafah' }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.action).toBe('follow_region');
    expect(missionControlService.applyAlertAction).toHaveBeenCalledWith(
      'follow_region',
      expect.any(Object),
      expect.objectContaining({ alert_id: 'alert-3', region: 'Rafah' })
    );
  });

  test('GET /api/mc/leaks returns leak lane payload', async () => {
    missionControlService.getLeaks.mockResolvedValue({
      items: [{ id: 'leak-1', unverified_reason: 'Awaiting verification' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/leaks`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items[0].id).toBe('leak-1');
    expect(missionControlService.getLeaks).toHaveBeenCalled();
  });

  test('GET /api/mc/layers/catalog returns layer descriptors', async () => {
    missionControlService.getLayersCatalog.mockResolvedValue({
      items: [{ id: 'flight-radar' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/layers/catalog`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items).toHaveLength(1);
    expect(missionControlService.getLayersCatalog).toHaveBeenCalled();
  });

  test('GET /api/mc/map/layers returns map packs payload', async () => {
    missionControlService.getMapLayers.mockResolvedValue({
      packs: [{ id: 'mission-core', layer_ids: ['conflict-zones'] }],
      defaults: ['conflict-zones'],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/map/layers?mode=simple`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.packs[0].id).toBe('mission-core');
    expect(missionControlService.getMapLayers).toHaveBeenCalled();
  });

  test('GET /api/mc/wm/resources returns WM resource health', async () => {
    missionControlService.getWorldMonitorResources.mockResolvedValue({
      resources: [{ key: 'telegramFeed', family: 'intel_news', status: 'ok' }],
      families: [{ family: 'intel_news', total: 1, ok: 1, degraded: 0, circuit_open: 0 }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/wm/resources`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.resources[0].key).toBe('telegramFeed');
    expect(missionControlService.getWorldMonitorResources).toHaveBeenCalled();
  });

  test('GET /api/mc/hazards/catalog returns hazard taxonomy', async () => {
    missionControlService.getHazardsCatalog.mockResolvedValue({
      items: [{ id: 'earthquake', label: 'Earthquake' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/hazards/catalog`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items[0].id).toBe('earthquake');
    expect(missionControlService.getHazardsCatalog).toHaveBeenCalled();
  });

  test('GET /api/mc/safety-guides returns incident guide cards', async () => {
    missionControlService.getSafetyGuides.mockResolvedValue({
      incident_type: 'drone',
      items: [{ id: 'guide-drone', incident_type: 'drone' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/mc/safety-guides?incident_type=drone&profile=default`
    );
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.incident_type).toBe('drone');
    expect(missionControlService.getSafetyGuides).toHaveBeenCalledWith(
      expect.objectContaining({ incident_type: 'drone', profile: 'default' })
    );
  });

  test('GET /api/mc/explainers returns explainer entries', async () => {
    missionControlService.getExplainers.mockResolvedValue({
      items: [{ id: 'posture-chip' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/explainers`);
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.items[0].id).toBe('posture-chip');
    expect(missionControlService.getExplainers).toHaveBeenCalled();
  });

  test('PUT /api/mc/layouts/:id saves layout preset', async () => {
    missionControlService.updateWorkspaceLayout.mockResolvedValue({
      id: 'ops-commander',
      mode: 'simple',
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/layouts/ops-commander`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        description: 'Updated',
        layout: { right_rail: true },
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.id).toBe('ops-commander');
    expect(missionControlService.updateWorkspaceLayout).toHaveBeenCalledWith(
      'ops-commander',
      expect.objectContaining({
        description: 'Updated',
      }),
      expect.any(Object)
    );
  });

  test('GET /api/mc/notifications/preferences returns preferences', async () => {
    missionControlService.getNotificationPreferences.mockResolvedValue({
      profile: 'default',
      dispatch: { verified_critical_instant: true },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/mc/notifications/preferences?profile=default`
    );
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.profile).toBe('default');
    expect(missionControlService.getNotificationPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'default' })
    );
  });

  test('GET /api/mc/notifications/telemetry returns dispatch metrics', async () => {
    missionControlService.getNotificationTelemetry.mockResolvedValue({
      scope_id: 'profile:default',
      qualification_to_inbox_ms: { avg_ms: 1400, p95_ms: 2200, samples: 18 },
      qualification_to_email_ms: { avg_ms: 3200, p95_ms: 4900, samples: 12 },
      dispatch_success_rate: { rate: 0.97, sent: 34, failed: 1, queued: 2, total_completed: 35 },
      action_persistence_errors: 0,
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/mc/notifications/telemetry?profile=default`
    );
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.dispatch_success_rate.rate).toBe(0.97);
    expect(missionControlService.getNotificationTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'default' })
    );
  });

  test('GET /api/mc/ops/health returns diagnostics payload', async () => {
    missionControlService.getOpsHealth.mockResolvedValue({
      cache: { mode: 'redis' },
      dispatch_queue: { queued: 2, processing: 1, dead_letter: 0, sent: 14, lag_ms: 1800 },
      source_health_recent: [{ source: 'acled', status: 'ok' }],
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/mc/ops/health?profile=default`
    );
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.cache.mode).toBe('redis');
    expect(missionControlService.getOpsHealth).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'default' })
    );
  });

  test('PUT /api/mc/notifications/preferences updates preferences', async () => {
    missionControlService.updateNotificationPreferences.mockResolvedValue({
      profile: 'default',
      channels: { push: true },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/notifications/preferences`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profile: 'default',
        channels: { push: true, email: false },
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.profile).toBe('default');
    expect(missionControlService.updateNotificationPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'default' }),
      expect.objectContaining({
        channels: expect.objectContaining({ push: true }),
      })
    );
  });

  test('PUT /api/mc/alerts/audio-preferences updates alert audio settings', async () => {
    missionControlService.updateAlertAudioPreferences.mockResolvedValue({
      profile: 'default',
      audio: { mode: 'vibration-only', vibration: true },
      dispatch: { verified_critical_instant: true },
    });

    const app = buildApp();
    const server = await startServer(app);
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mc/alerts/audio-preferences`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        profile: 'default',
        mode: 'vibration-only',
        vibration: true,
      }),
    });
    const payload = await response.json();
    await new Promise((resolve) => server.close(resolve));

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.audio.mode).toBe('vibration-only');
    expect(missionControlService.updateAlertAudioPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ profile: 'default' }),
      expect.objectContaining({
        mode: 'vibration-only',
        vibration: true,
      })
    );
  });
});
