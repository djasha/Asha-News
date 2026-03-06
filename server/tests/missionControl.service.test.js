jest.mock('../db/queryBridge', () => jest.fn());
jest.mock('../db', () => ({
  getPool: jest.fn(),
  isUsingSupabase: jest.fn(),
}));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));
jest.mock('../services/conflictAnalyticsService', () => ({
  getConflictAnalytics: jest.fn(async () => ({
    summaries: {},
    analystNotes: [],
    events: [],
  })),
}));

const ORIGINAL_ENV = { ...process.env };

function applyBaseEnv(overrides = {}) {
  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
  process.env.MC_PG_STATE_ENABLED = 'true';
  process.env.MC_PG_SHADOW_WRITE_ENABLED = 'false';
  process.env.MC_DISPATCH_ENGINE_ENABLED = 'true';
  process.env.MC_DISPATCH_WORKER_ENABLED = 'true';
  process.env.MC_SMTP_HOST = 'smtp.test.local';
  process.env.MC_SMTP_PORT = '587';
  process.env.MC_SMTP_FROM = 'alerts@test.local';
  process.env.MC_ALERT_EMAIL_TO = 'ops@test.local';
  process.env.ALERT_EMAIL_TO = '';
  process.env.GROQ_API_KEY = '';
  process.env.OPENAI_API_KEY = '';
  Object.assign(process.env, overrides);
}

function queueRow(id = 'q-1') {
  return {
    id,
    scope_id: 'profile:default',
    user_id: null,
    alert_id: 'alert-a',
    channel: 'email',
    payload_json: {
      alert: {
        id: 'alert-a',
        title: 'Critical event in Gaza',
        severity: 'CRITICAL',
        location: 'Gaza',
        confidence_score: 0.91,
        updated_at: '2026-03-04T00:00:00.000Z',
        summary: 'Critical verified incident',
      },
      qualified_at: '2026-03-04T00:00:00.000Z',
    },
    attempts: 0,
    created_at: '2026-03-04T00:00:00.000Z',
  };
}

function patchPayloadFromCall(call) {
  const init = call?.[1] || {};
  return JSON.parse(String(init.body || '{}'));
}

describe('missionControl service dispatch worker', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('runDispatchWorkerTick claims and sends queued email once', async () => {
    applyBaseEnv();

    const queryBridge = require('../db/queryBridge');
    const db = require('../db');
    const nodemailer = require('nodemailer');

    const poolQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [queueRow('q-send-1')] })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 });
    db.getPool.mockReturnValue({ query: poolQuery });
    db.isUsingSupabase.mockReturnValue(false);

    const sendMail = jest.fn().mockResolvedValue({ messageId: 'msg-1' });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    queryBridge.mockImplementation(async (pathname, init = {}) => {
      const method = String(init.method || 'GET').toUpperCase();
      if (pathname.startsWith('/items/mc_dispatch_queue/') && method === 'PATCH') {
        const payload = JSON.parse(String(init.body || '{}'));
        return { data: { id: 'q-send-1', ...payload } };
      }
      if (pathname.startsWith('/items/mc_dispatch_log') && method === 'POST') {
        return { data: { id: 'log-1' } };
      }
      if (pathname.startsWith('/items/mc_dispatch_metrics') && method === 'POST') {
        return { data: { id: 'metric-1' } };
      }
      return { data: [] };
    });

    const service = require('../services/missionControlService');
    const result = await service.runDispatchWorkerTick();

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(sendMail).toHaveBeenCalledTimes(1);

    const queuePatchCalls = queryBridge.mock.calls.filter(
      (call) => String(call[0]).startsWith('/items/mc_dispatch_queue/') && String(call[1]?.method || 'GET').toUpperCase() === 'PATCH'
    );
    expect(queuePatchCalls.length).toBeGreaterThan(0);
    expect(patchPayloadFromCall(queuePatchCalls[0])).toEqual(
      expect.objectContaining({
        status: 'sent',
        last_error_code: null,
      })
    );
  });

  test('runDispatchWorkerTick dead-letters item when recipient is missing', async () => {
    applyBaseEnv({
      MC_ALERT_EMAIL_TO: '',
      ALERT_EMAIL_TO: '',
    });

    const queryBridge = require('../db/queryBridge');
    const db = require('../db');
    const nodemailer = require('nodemailer');

    const poolQuery = jest.fn()
      .mockResolvedValueOnce({ rows: [queueRow('q-dead-1')] })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 });
    db.getPool.mockReturnValue({ query: poolQuery });
    db.isUsingSupabase.mockReturnValue(false);

    const sendMail = jest.fn().mockResolvedValue({ messageId: 'msg-2' });
    nodemailer.createTransport.mockReturnValue({ sendMail });

    queryBridge.mockImplementation(async (pathname, init = {}) => {
      const method = String(init.method || 'GET').toUpperCase();
      if (pathname.startsWith('/items/mc_dispatch_queue/') && method === 'PATCH') {
        const payload = JSON.parse(String(init.body || '{}'));
        return { data: { id: 'q-dead-1', ...payload } };
      }
      if (pathname.startsWith('/items/mc_dispatch_log') && method === 'POST') {
        return { data: { id: 'log-2' } };
      }
      if (pathname.startsWith('/items/mc_dispatch_metrics') && method === 'POST') {
        return { data: { id: 'metric-2' } };
      }
      return { data: [] };
    });

    const service = require('../services/missionControlService');
    const result = await service.runDispatchWorkerTick();

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.dead_letter).toBe(1);
    expect(sendMail).not.toHaveBeenCalled();

    const queuePatchCalls = queryBridge.mock.calls.filter(
      (call) => String(call[0]).startsWith('/items/mc_dispatch_queue/') && String(call[1]?.method || 'GET').toUpperCase() === 'PATCH'
    );
    expect(queuePatchCalls.length).toBeGreaterThan(0);
    expect(patchPayloadFromCall(queuePatchCalls[0])).toEqual(
      expect.objectContaining({
        status: 'dead_letter',
        last_error_code: 'missing_recipient',
      })
    );
  });

  test('notification preference writes keep critical instant and support audio preferences', async () => {
    applyBaseEnv();

    const queryBridge = require('../db/queryBridge');
    const db = require('../db');

    db.getPool.mockReturnValue({ query: jest.fn().mockResolvedValue({ rows: [] }) });
    db.isUsingSupabase.mockReturnValue(false);

    queryBridge.mockImplementation(async (pathname, init = {}) => {
      const method = String(init.method || 'GET').toUpperCase();
      if (pathname.startsWith('/items/mc_user_preferences') && method === 'GET') {
        return { data: [] };
      }
      if (pathname.startsWith('/items/mc_user_preferences') && method === 'POST') {
        const payload = JSON.parse(String(init.body || '{}'));
        return { data: { id: 'pref-1', ...payload } };
      }
      return { data: [] };
    });

    const service = require('../services/missionControlService');

    const savedDispatch = await service.updateNotificationPreferences(
      { profile: 'default' },
      {
        dispatch: {
          verified_critical_instant: false,
          verified_high_instant: true,
        },
      }
    );

    expect(savedDispatch.dispatch.verified_critical_instant).toBe(true);
    expect(savedDispatch.alert_tier_policy.critical_delay_allowed).toBe(false);

    const savedAudio = await service.updateAlertAudioPreferences(
      { profile: 'default' },
      {
        mode: 'silent',
        vibration: false,
        severity_profiles: {
          CRITICAL: 'alarm-critical',
          HIGH: 'tone-high',
          ELEVATED: 'tone-elevated',
          INFO: 'tone-soft',
        },
      }
    );

    expect(savedAudio.audio.mode).toBe('silent');
    expect(savedAudio.audio.vibration).toBe(false);
    expect(savedAudio.dispatch.verified_critical_instant).toBe(true);
  });
});
