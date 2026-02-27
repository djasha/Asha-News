const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { listTools, listResources, callTool } = require('../services/mcpGatewayClient');

// Optional API key check for security
function requireApiKey(req, res, next) {
  const requiredKey = process.env.MCP_PROXY_API_KEY;
  if (!requiredKey) return next();
  const provided = req.header('X-API-Key') || req.header('x-api-key');
  if (provided && provided === requiredKey) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

router.use(requireApiKey);

// Health check -> tries a lightweight list-tools
router.get('/health', async (req, res) => {
  try {
    const resp = await listTools();
    const ok = !!resp && (!!resp.result || !!resp.tools || !!resp.error === false);
    return res.json({ status: ok ? 'ok' : 'unknown', raw: resp });
  } catch (err) {
    return res.status(502).json({ status: 'error', message: err.message });
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
