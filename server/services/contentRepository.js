/**
 * Content repository alias for canonical content persistence.
 *
 * This wraps the shared db service and is used by active routes so code no longer
 * advertises Directus-specific naming while we keep backward-compatible shims.
 */
const dbService = require('../db/dbService');

module.exports = dbService;
