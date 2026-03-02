const express = require('express');
const router = express.Router();
const { listTools, listResources, callTool } = require('../services/mcpGatewayClient');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';

// Access control:
// 1) If MCP_PROXY_API_KEY is configured, require it.
// 2) Otherwise, require authenticated admin in production/strict mode.
// 3) In non-strict local development, allow access.
function requireMcpAccess(req, res, next) {
  const requiredKey = process.env.MCP_PROXY_API_KEY;
  if (requiredKey) {
    const provided = req.header('X-API-Key') || req.header('x-api-key');
    if (provided && provided === requiredKey) return next();
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!strictAuth) return next();

  return authenticateToken(req, res, () => requireAdmin(req, res, next));
}

router.use(requireMcpAccess);

// Health check -> tries a lightweight list-tools
router.get('/health', async (req, res) => {
  const checkedAt = new Date().toISOString();
  try {
    const resp = await listTools();
    const tools = Array.isArray(resp?.tools)
      ? resp.tools
      : Array.isArray(resp?.result?.tools)
        ? resp.result.tools
        : [];
    return res.json({
      status: 'ok',
      gateway: 'reachable',
      checked_at: checkedAt,
      tool_count: tools.length,
      raw: resp
    });
  } catch (err) {
    // Health should still be readable for operators when upstream MCP tooling is unavailable.
    return res.json({
      status: 'degraded',
      gateway: 'unreachable',
      checked_at: checkedAt,
      message: err.message
    });
  }
});

router.get('/tools', async (req, res) => {
  try {
    const resp = await listTools();
    return res.json(resp);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to list tools', message: err.message });
  }
});

router.get('/resources', async (req, res) => {
  try {
    const resp = await listResources();
    return res.json(resp);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to list resources', message: err.message });
  }
});

router.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Missing tool name' });
    const resp = await callTool(name, args || {});
    return res.json(resp);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to call tool', message: err.message });
  }
});

module.exports = router;
