jest.mock('../db/queryBridge', () => jest.fn());
jest.mock('../db', () => ({
  getPool: jest.fn(),
  isUsingSupabase: jest.fn(),
}));

const queryBridge = require('../db/queryBridge');
const { getPool, isUsingSupabase } = require('../db');
const { __testables } = require('../routes/agentApi');

describe('agentApi public token lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses direct DB token lookup when postgres pool is available', async () => {
    const dbUser = { id: 'user-1', preferences: { public_digest: true, public_digest_token: 'tok-1' } };
    const query = jest.fn().mockResolvedValue({ rows: [dbUser] });

    isUsingSupabase.mockReturnValue(false);
    getPool.mockReturnValue({ query });

    const result = await __testables.findPublicDigestUserByToken('tok-1');

    expect(result).toEqual(dbUser);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual(['tok-1']);
    expect(queryBridge).not.toHaveBeenCalled();
  });

  test('falls back to paginated scan and finds token beyond first page', async () => {
    isUsingSupabase.mockReturnValue(true);
    getPool.mockReturnValue(null);

    const firstPage = Array.from({ length: 200 }, (_, idx) => ({
      id: `user-${idx + 1}`,
      preferences: { public_digest: false, public_digest_token: `other-${idx + 1}` },
    }));

    queryBridge
      .mockResolvedValueOnce({
        data: firstPage,
      })
      .mockResolvedValueOnce({
        data: [
          { id: 'user-c', preferences: { digest: { public: true, public_token: 'tok-2' } } },
        ],
      });

    const result = await __testables.findPublicDigestUserByToken('tok-2');

    expect(result).toEqual({ id: 'user-c', preferences: { digest: { public: true, public_token: 'tok-2' } } });
    expect(queryBridge).toHaveBeenCalledTimes(2);
    expect(queryBridge.mock.calls[0][0]).toBe('/items/users?limit=200&offset=0');
    expect(queryBridge.mock.calls[1][0]).toBe('/items/users?limit=200&offset=200');
  });
});
