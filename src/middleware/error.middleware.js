/**
 * Error Middleware
 * Centralized error handling for the application
 */

class ErrorMiddleware {
  /**
   * Global error handler
   */
  static handleErrors(err, req, res, next) {
    console.error('Error caught by error middleware:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      errorCode = 'VALIDATION_ERROR';
      details = err.details;
    } else if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
      statusCode = 401;
      message = 'Unauthorized access';
      errorCode = 'UNAUTHORIZED';
    } else if (err.name === 'ForbiddenError' || err.message === 'Forbidden') {
      statusCode = 403;
      message = 'Access forbidden';
      errorCode = 'FORBIDDEN';
    } else if (err.name === 'NotFoundError' || err.message === 'Not Found') {
      statusCode = 404;
      message = 'Resource not found';
      errorCode = 'NOT_FOUND';
    } else if (err.name === 'ConflictError') {
      statusCode = 409;
      message = 'Resource conflict';
      errorCode = 'CONFLICT';
    } else if (err.code === '23505') { // PostgreSQL unique violation
      statusCode = 409;
      message = 'Resource already exists';
      errorCode = 'DUPLICATE_RESOURCE';
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
      statusCode = 400;
      message = 'Invalid reference';
      errorCode = 'INVALID_REFERENCE';
    } else if (err.code === '23502') { // PostgreSQL not null violation
      statusCode = 400;
      message = 'Required field missing';
      errorCode = 'REQUIRED_FIELD_MISSING';
    } else if (err.code === 'ENOENT') {
      statusCode = 404;
      message = 'File not found';
      errorCode = 'FILE_NOT_FOUND';
    } else if (err.code === 'EACCES') {
      statusCode = 403;
      message = 'File access denied';
      errorCode = 'FILE_ACCESS_DENIED';
    } else if (err.type === 'entity.too.large') {
      statusCode = 413;
      message = 'Request payload too large';
      errorCode = 'PAYLOAD_TOO_LARGE';
    } else if (err.type === 'entity.parse.failed') {
      statusCode = 400;
      message = 'Invalid JSON format';
      errorCode = 'INVALID_JSON';
    }

    // Custom application errors
    if (err.statusCode) {
      statusCode = err.statusCode;
    }
    if (err.errorCode) {
      errorCode = err.errorCode;
    }
    if (err.customMessage) {
      message = err.customMessage;
    }

    // Don't expose internal error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    const errorResponse = {
      success: false,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };

    // Add details if available and not in production
    if (details && !isProduction) {
      errorResponse.details = details;
    }

    // Add stack trace in development
    if (!isProduction && err.stack) {
      errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
  }

  /**
   * Handle 404 errors for unmatched routes
   */
  static handleNotFound(req, res, next) {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    error.errorCode = 'ROUTE_NOT_FOUND';
    next(error);
  }

  /**
   * Handle async errors (wrapper for async route handlers)
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Custom error classes
   */
  static createError(message, statusCode = 500, errorCode = 'CUSTOM_ERROR') {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.errorCode = errorCode;
    return error;
  }

  /**
   * Validation error
   */
  static validationError(message, details = null) {
    const error = new Error(message);
    error.statusCode = 400;
    error.errorCode = 'VALIDATION_ERROR';
    error.details = details;
    return error;
  }

  /**
   * Unauthorized error
   */
  static unauthorizedError(message = 'Unauthorized access') {
    const error = new Error(message);
    error.statusCode = 401;
    error.errorCode = 'UNAUTHORIZED';
    return error;
  }

  /**
   * Forbidden error
   */
  static forbiddenError(message = 'Access forbidden') {
    const error = new Error(message);
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN';
    return error;
  }

  /**
   * Not found error
   */
  static notFoundError(message = 'Resource not found') {
    const error = new Error(message);
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    return error;
  }

  /**
   * Conflict error
   */
  static conflictError(message = 'Resource conflict') {
    const error = new Error(message);
    error.statusCode = 409;
    error.errorCode = 'CONFLICT';
    return error;
  }

  /**
   * Rate limit error
   */
  static rateLimitError(message = 'Too many requests') {
    const error = new Error(message);
    error.statusCode = 429;
    error.errorCode = 'RATE_LIMIT_EXCEEDED';
    return error;
  }

  /**
   * Log errors to external service (placeholder)
   */
  static logToExternalService(error, req) {
    // In a real application, this would send errors to services like:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - CloudWatch
    
    const errorLog = {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    // For now, just console.log (replace with actual service)
    console.log('External error log:', JSON.stringify(errorLog, null, 2));
  }
}

module.exports = ErrorMiddleware; 