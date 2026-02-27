/**
 * Frontend Logger Utility
 * Provides consistent logging with environment-aware output
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  /**
   * Log debug information (development only)
   */
  debug(...args) {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(...args) {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * Log warnings
   */
  warn(...args) {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  }

  /**
   * Log errors (always logged)
   */
  error(...args) {
    console.error('[ERROR]', ...args);
  }

  /**
   * Log API request/response (development only)
   */
  api(method, url, status, data = null) {
    if (isDevelopment) {
      console.info(`[API] ${method} ${url} - ${status}`, data ? data : '');
    }
  }

  /**
   * Log performance metrics (development only)
   */
  performance(label, duration) {
    if (isDevelopment) {
      console.info(`[PERF] ${label}: ${duration}ms`);
    }
  }

  /**
   * Log user actions (development only)
   */
  user(action, details = null) {
    if (isDevelopment) {
      console.info(`[USER] ${action}`, details ? details : '');
    }
  }
}

const logger = new Logger();
export default logger;
