const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const logger = require('../utils/logger');

const isLocalAddress = (value) => {
  if (!value) return false;
  const normalized = String(value).trim();
  return normalized === '127.0.0.1'
    || normalized === '::1'
    || normalized === '::ffff:127.0.0.1'
    || normalized === 'localhost';
};

const shouldSkipRateLimit = (req) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const forwardedFor = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [
    req.ip,
    req.socket?.remoteAddress,
    req.connection?.remoteAddress,
    ...forwardedFor,
  ].some(isLocalAddress);
};

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkipRateLimit,
  });
};

// General API rate limit
const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  1000, // increased for development/testing
  'Too many requests from this IP, please try again later.'
);

// Strict rate limit for AI analysis endpoints
const aiLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 AI requests per minute
  'Too many AI analysis requests, please try again later.'
);

// Clustering rate limit
const clusterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased for development/testing
  message: {
    error: 'Too many clustering requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
});

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https:",
        "https://api.openai.com",
        "https://api.groq.com",
        "https://generativelanguage.googleapis.com",
        "https://api.stripe.com"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https:", "data:"]
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input validation helpers
const validateArticleInput = (req, res, next) => {
  const { title, content, url } = req.body;
  
  const errors = [];
  
  if (!title || typeof title !== 'string' || title.length > 500) {
    errors.push('Title must be a string with max 500 characters');
  }
  
  if (content && typeof content !== 'string') {
    errors.push('Content must be a string');
  }
  
  if (url && !validator.isURL(url)) {
    errors.push('URL must be a valid URL');
  }
  
  // Sanitize HTML content
  if (content) {
    req.body.content = validator.escape(content);
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  next();
};

// Validate clustering input
const validateClusterInput = (req, res, next) => {
  const { articles, threshold } = req.body;
  
  const errors = [];
  
  if (!Array.isArray(articles) || articles.length < 2) {
    errors.push('Articles must be an array with at least 2 items');
  }
  
  if (articles && articles.length > 50) {
    errors.push('Cannot cluster more than 50 articles at once');
  }
  
  if (threshold && (typeof threshold !== 'number' || threshold < 0 || threshold > 1)) {
    errors.push('Threshold must be a number between 0 and 1');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  next();
};

// Validate AI prompt input
const validatePromptInput = (req, res, next) => {
  const { prompt, max_tokens, temperature } = req.body;
  
  const errors = [];
  
  if (!prompt || typeof prompt !== 'string' || prompt.length > 10000) {
    errors.push('Prompt must be a string with max 10000 characters');
  }
  
  if (max_tokens && (typeof max_tokens !== 'number' || max_tokens < 1 || max_tokens > 4000)) {
    errors.push('max_tokens must be a number between 1 and 4000');
  }
  
  if (temperature && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
    errors.push('temperature must be a number between 0 and 2');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  next();
};

// Centralized error handling middleware
const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  logger.error({ err, method: req.method, path: req.path, status }, 'Unhandled error');

  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
};

// Request logging for security monitoring
const securityLogger = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Log suspicious patterns
  if (req.path.includes('..') || req.path.includes('<script>')) {
    logger.warn({ ip, path: req.path, ua: req.get('User-Agent') }, 'Suspicious request');
  }

  next();
};

module.exports = {
  apiLimiter,
  aiLimiter,
  clusterLimiter,
  securityHeaders,
  validateArticleInput,
  validateClusterInput,
  validatePromptInput,
  errorHandler,
  securityLogger
};
