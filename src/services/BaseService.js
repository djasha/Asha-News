/**
 * Base Service Class
 * Provides standardized patterns for all service classes
 */

import logger from '../utils/logger';

class BaseService {
  constructor(name) {
    this.serviceName = name;
    this.cache = new Map();
    this.defaultTimeout = 10000; // 10 seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Standardized error handling
   */
  handleError(error, context = '') {
    const errorMessage = `${this.serviceName}${context ? ` - ${context}` : ''}: ${error.message}`;
    logger.error(errorMessage, error);
    
    // Return standardized error object
    return {
      success: false,
      error: errorMessage,
      details: error.details || null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Standardized success response
   */
  createSuccessResponse(data, message = '') {
    return {
      success: true,
      data,
      message,
      service: this.serviceName,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Standardized HTTP request with timeout and retries
   */
  async makeRequest(url, options = {}, timeout = this.defaultTimeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Retry mechanism for failed requests
   */
  async withRetry(fn, attempts = this.retryAttempts, initialDelay = this.retryDelay) {
    let lastError;
    let delay = initialDelay;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i < attempts - 1) {
          const currentDelay = delay;
          logger.warn(`${this.serviceName} - Attempt ${i + 1} failed, retrying in ${currentDelay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Cache management
   */
  setCache(key, data, ttlMs = 300000) { // Default 5 minutes TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Input validation helper
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Performance logging
   */
  async withPerformanceLogging(label, fn) {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      logger.performance(`${this.serviceName} - ${label}`, Math.round(duration));
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.performance(`${this.serviceName} - ${label} (failed)`, Math.round(duration));
      throw error;
    }
  }

  /**
   * Service health check
   */
  async healthCheck() {
    return {
      service: this.serviceName,
      status: 'healthy',
      cacheSize: this.cache.size,
      timestamp: new Date().toISOString()
    };
  }
}

export default BaseService;
