const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const strictAuth = process.env.NODE_ENV === 'production' || process.env.STRICT_AUTH === 'true';

const MENU_SETTINGS_FILE = path.join(__dirname, '../data/menu-settings.json');

const requireAdminIfStrict = (req, res, next) => {
  if (!strictAuth) return next();
  return authenticateToken(req, res, () => requireAdmin(req, res, next));
};

// Ensure the data directory exists
const ensureDataDir = async () => {
  const dir = path.dirname(MENU_SETTINGS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Default menu settings
const DEFAULT_MENU_SETTINGS = {
  desktop: [
    { id: 1, label: 'Home', path: '/', enabled: true, sort_order: 1, fontSize: '16', fontWeight: '500' },
    { id: 2, label: 'Stories', path: '/stories', enabled: true, sort_order: 2, fontSize: '16', fontWeight: '500' },
    { id: 3, label: 'For You', path: '/for-you', enabled: true, sort_order: 3, fontSize: '16', fontWeight: '500' },
    { id: 4, label: 'Local', path: '/local', enabled: true, sort_order: 4, fontSize: '16', fontWeight: '500' },
    { id: 5, label: 'Fact Checker', path: '/fact-check', enabled: true, sort_order: 5, fontSize: '16', fontWeight: '500' }
  ],
  mobile: [
    { id: 1, label: 'News', path: '/', icon: 'newspaper', enabled: true, sort_order: 1 },
    { id: 2, label: 'Stories', path: '/stories', icon: 'layers', enabled: true, sort_order: 2 },
    { id: 3, label: 'Search', path: '/search', icon: 'search', enabled: true, sort_order: 3 },
    { id: 4, label: 'Fact Checker', path: '/fact-check', icon: 'eye', enabled: true, sort_order: 4 },
    { id: 5, label: 'Local', path: '/local', icon: 'location', enabled: true, sort_order: 5 }
  ],
  sideMenuCategories: [
    { 
      id: 1, 
      title: 'Topics', 
      enabled: true, 
      sort_order: 1, 
      items: [],
      description: 'Topics are managed in the Topics section'
    },
    { 
      id: 2, 
      title: 'Features', 
      enabled: true, 
      sort_order: 2, 
      items: [
        { label: 'Sources', path: '/sources', enabled: true, sort_order: 1 },
        { label: 'Bias Analysis', path: '/bias-methodology', enabled: true, sort_order: 2 },
        { label: 'Fact Checker', path: '/fact-check', enabled: true, sort_order: 3 },
        { label: 'Trending', path: '/trending', enabled: true, sort_order: 4 }
      ]
    }
  ]
};

// Load menu settings from file
const loadMenuSettings = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(MENU_SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return defaults if file doesn't exist
    return DEFAULT_MENU_SETTINGS;
  }
};

// Save menu settings to file
const saveMenuSettings = async (settings) => {
  await ensureDataDir();
  await fs.writeFile(MENU_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
};

// GET /api/menu-settings/desktop - Get desktop menu items
router.get('/desktop', async (req, res) => {
  try {
    const settings = await loadMenuSettings();
    res.json({ items: settings.desktop || DEFAULT_MENU_SETTINGS.desktop });
  } catch (error) {
    logger.error({ err: error }, 'Error loading desktop menu');
    res.status(500).json({ error: 'Failed to load desktop menu settings' });
  }
});

// POST /api/menu-settings/desktop - Save desktop menu items
router.post('/desktop', requireAdminIfStrict, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const settings = await loadMenuSettings();
    settings.desktop = items;
    await saveMenuSettings(settings);

    res.json({ success: true, items: settings.desktop });
  } catch (error) {
    logger.error({ err: error }, 'Error saving desktop menu');
    res.status(500).json({ error: 'Failed to save desktop menu settings' });
  }
});

// GET /api/menu-settings/mobile - Get mobile menu items
router.get('/mobile', async (req, res) => {
  try {
    const settings = await loadMenuSettings();
    res.json({ items: settings.mobile || DEFAULT_MENU_SETTINGS.mobile });
  } catch (error) {
    logger.error({ err: error }, 'Error loading mobile menu');
    res.status(500).json({ error: 'Failed to load mobile menu settings' });
  }
});

// POST /api/menu-settings/mobile - Save mobile menu items
router.post('/mobile', requireAdminIfStrict, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const settings = await loadMenuSettings();
    settings.mobile = items;
    await saveMenuSettings(settings);

    res.json({ success: true, items: settings.mobile });
  } catch (error) {
    logger.error({ err: error }, 'Error saving mobile menu');
    res.status(500).json({ error: 'Failed to save mobile menu settings' });
  }
});

// GET /api/menu-settings/side - Get side menu categories
router.get('/side', async (req, res) => {
  try {
    const settings = await loadMenuSettings();
    res.json({ categories: settings.sideMenuCategories || DEFAULT_MENU_SETTINGS.sideMenuCategories });
  } catch (error) {
    logger.error({ err: error }, 'Error loading side menu');
    res.status(500).json({ error: 'Failed to load side menu settings' });
  }
});

// POST /api/menu-settings/side - Save side menu categories
router.post('/side', requireAdminIfStrict, async (req, res) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Categories must be an array' });
    }

    const settings = await loadMenuSettings();
    settings.sideMenuCategories = categories;
    await saveMenuSettings(settings);

    res.json({ success: true, categories: settings.sideMenuCategories });
  } catch (error) {
    logger.error({ err: error }, 'Error saving side menu');
    res.status(500).json({ error: 'Failed to save side menu settings' });
  }
});

// GET /api/menu-settings/all - Get all menu settings
router.get('/all', async (req, res) => {
  try {
    const settings = await loadMenuSettings();
    res.json(settings);
  } catch (error) {
    logger.error({ err: error }, 'Error loading menu settings');
    res.status(500).json({ error: 'Failed to load menu settings' });
  }
});

// POST /api/menu-settings/reset - Reset to defaults
router.post('/reset', requireAdminIfStrict, async (req, res) => {
  try {
    await saveMenuSettings(DEFAULT_MENU_SETTINGS);
    res.json({ success: true, message: 'Menu settings reset to defaults' });
  } catch (error) {
    logger.error({ err: error }, 'Error resetting menu settings');
    res.status(500).json({ error: 'Failed to reset menu settings' });
  }
});

module.exports = router;
