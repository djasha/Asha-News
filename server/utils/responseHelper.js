/**
 * Response Helper Utility
 * Standardizes API response formats across all endpoints
 */

/**
 * Success response helper
 */
const success = (res, data = null, message = 'Success', meta = {}) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return res.json(response);
};

/**
 * Error response helper
 */
const error = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response helper
 */
const paginated = (res, data, pagination, message = 'Success') => {
  return success(res, data, message, {
    pagination: {
      page: parseInt(pagination.page) || 1,
      limit: parseInt(pagination.limit) || 10,
      total: parseInt(pagination.total) || 0,
      total_pages: Math.ceil(pagination.total / pagination.limit) || 1,
      has_more: (pagination.page - 1) * pagination.limit + data.length < pagination.total,
      has_previous: pagination.page > 1,
      ...pagination
    }
  });
};

/**
 * Created response helper (for POST/PUT operations)
 */
const created = (res, data, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Updated response helper (for PUT/PATCH operations)
 */
const updated = (res, data, message = 'Resource updated successfully') => {
  return res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Deleted response helper (for DELETE operations)
 */
const deleted = (res, message = 'Resource deleted successfully') => {
  return res.json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Validation error helper
 */
const validationError = (res, errors, message = 'Validation failed') => {
  return error(res, message, 400, {
    type: 'validation',
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Not found error helper
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

/**
 * Unauthorized error helper
 */
const unauthorized = (res, message = 'Unauthorized access') => {
  return error(res, message, 401);
};

/**
 * Forbidden error helper
 */
const forbidden = (res, message = 'Access forbidden') => {
  return error(res, message, 403);
};

/**
 * Rate limit error helper
 */
const rateLimit = (res, message = 'Rate limit exceeded') => {
  return error(res, message, 429);
};

/**
 * Server error helper
 */
const serverError = (res, err, message = 'Internal server error', log = null) => {
  // Log the actual error for debugging
  try {
    if (log && typeof log.error === 'function') {
      log.error({ err }, 'Server Error');
    } else {
      // Fallback: avoid crashing if no logger is provided
      // eslint-disable-next-line no-console
      console.error('Server Error:', err);
    }
  } catch (_) {
    // Never let logging crash the handler
  }

  return error(
    res,
    message,
    500,
    process.env.NODE_ENV === 'development' ? err?.stack : null
  );
};

module.exports = {
  success,
  error,
  paginated,
  created,
  updated,
  deleted,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  rateLimit,
  serverError
};
