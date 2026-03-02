/**
 * DirectusService compatibility shim.
 *
 * All data access now goes through the canonical content repository.
 * This file exists so that every `require('./directusService')` / `new DirectusService()`
 * call across the codebase keeps working without touching 17+ import sites.
 *
 * The constructor returns the shared content repository singleton.
 */
const contentRepository = require('./contentRepository');

class DirectusService {
  constructor() {
    // Return the singleton — `new DirectusService()` gives back contentRepository
    return contentRepository;
  }
}

module.exports = DirectusService;
