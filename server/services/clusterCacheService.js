const fs = require('fs');
const logger = require('../utils/logger');
const path = require('path');

class ClusterCacheService {
  constructor() {
    this.baseDir = path.join(__dirname, '..', 'data', 'cluster_cache');
    try {
      fs.mkdirSync(this.baseDir, { recursive: true });
    } catch {}
  }

  _filePath(clusterId) {
    const id = String(clusterId);
    return path.join(this.baseDir, `${id}.json`);
  }

  get(clusterId) {
    try {
      const fp = this._filePath(clusterId);
      if (!fs.existsSync(fp)) return null;
      const raw = fs.readFileSync(fp, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getHash(clusterId) {
    const data = this.get(clusterId);
    return data && data.content_hash ? data.content_hash : null;
  }

  set(clusterId, payload) {
    try {
      const fp = this._filePath(clusterId);
      const data = {
        ...payload,
        updated_at: new Date().toISOString(),
      };
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      logger.error('ClusterCacheService.set error:', e.message);
      return false;
    }
  }

  setHash(clusterId, contentHash) {
    const current = this.get(clusterId) || {};
    return this.set(clusterId, { ...current, content_hash: contentHash });
  }
}

module.exports = ClusterCacheService;
