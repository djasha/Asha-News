/**
 * DirectusService compatibility shim.
 *
 * All data access now goes through dbService (direct PostgreSQL via Drizzle ORM).
 * This file exists so that every `require('./directusService')` / `new DirectusService()`
 * call across the codebase keeps working without touching 17+ import sites.
 *
 * The constructor returns the shared dbService singleton.
 */
const dbService = require('../db/dbService');

class DirectusService {
  constructor() {
    // Return the singleton — `new DirectusService()` gives back dbService
    return dbService;
  }
}

module.exports = DirectusService;
