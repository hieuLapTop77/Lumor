const { validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Handles express-validator results and provides enhanced validation utilities
 */

class ValidationMiddleware {
  /**
   * Handle validation results from express-validator
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        errors: errorDetails
      });
    }

    next();
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(req, res, next) {
    const { limit, offset, page } = req.query;

    // Set defaults
    req.pagination = {
      limit: 20,
      offset: 0,
      page: 1
    };

    // Validate and parse limit
    if (limit !== undefined) {
      const parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be a number between 1 and 100',
          errorCode: 'INVALID_LIMIT'
        });
      }
      req.pagination.limit = parsedLimit;
    }

    // Validate and parse offset
    if (offset !== undefined) {
      const parsedOffset = parseInt(offset, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({
          success: false,
          message: 'Offset must be a non-negative number',
          errorCode: 'INVALID_OFFSET'
        });
      }
      req.pagination.offset = parsedOffset;
    }

    // Validate and parse page (alternative to offset)
    if (page !== undefined) {
      const parsedPage = parseInt(page, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          success: false,
          message: 'Page must be a positive number',
          errorCode: 'INVALID_PAGE'
        });
      }
      req.pagination.page = parsedPage;
      req.pagination.offset = (parsedPage - 1) * req.pagination.limit;
    }

    next();
  }

  /**
   * Validate sort parameters
   */
  static validateSort(allowedFields = []) {
    return (req, res, next) => {
      const { sort, order } = req.query;

      req.sort = {
        field: 'created_at',
        order: 'DESC'
      };

      if (sort) {
        if (allowedFields.length > 0 && !allowedFields.includes(sort)) {
          return res.status(400).json({
            success: false,
            message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`,
            errorCode: 'INVALID_SORT_FIELD'
          });
        }
        req.sort.field = sort;
      }

      if (order) {
        const upperOrder = order.toUpperCase();
        if (!['ASC', 'DESC'].includes(upperOrder)) {
          return res.status(400).json({
            success: false,
            message: 'Order must be ASC or DESC',
            errorCode: 'INVALID_SORT_ORDER'
          });
        }
        req.sort.order = upperOrder;
      }

      next();
    };
  }

  /**
   * Validate ID parameters
   */
  static validateId(paramName = 'id') {
    return (req, res, next) => {
      const id = req.params[paramName];
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: `${paramName} parameter is required`,
          errorCode: 'MISSING_PARAMETER'
        });
      }

      const parsedId = parseInt(id, 10);
      if (isNaN(parsedId) || parsedId < 1) {
        return res.status(400).json({
          success: false,
          message: `${paramName} must be a positive integer`,
          errorCode: 'INVALID_ID'
        });
      }

      req.params[paramName] = parsedId;
      next();
    };
  }

  /**
   * Validate UUID parameters
   */
  static validateUUID(paramName = 'id') {
    return (req, res, next) => {
      const uuid = req.params[paramName];
      
      if (!uuid) {
        return res.status(400).json({
          success: false,
          message: `${paramName} parameter is required`,
          errorCode: 'MISSING_PARAMETER'
        });
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(uuid)) {
        return res.status(400).json({
          success: false,
          message: `${paramName} must be a valid UUID`,
          errorCode: 'INVALID_UUID'
        });
      }

      next();
    };
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(req, res, next) {
    // Remove any null bytes that could cause issues
    const sanitizeString = (str) => {
      if (typeof str === 'string') {
        return str.replace(/\0/g, '');
      }
      return str;
    };

    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    sanitizeObject(req.body);
    sanitizeObject(req.query);
    sanitizeObject(req.params);

    next();
  }

  /**
   * Validate request content type
   */
  static requireContentType(expectedType = 'application/json') {
    return (req, res, next) => {
      if (req.method === 'GET' || req.method === 'DELETE') {
        return next();
      }

      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes(expectedType)) {
        return res.status(400).json({
          success: false,
          message: `Content-Type must be ${expectedType}`,
          errorCode: 'INVALID_CONTENT_TYPE'
        });
      }

      next();
    };
  }

  /**
   * Validate request size
   */
  static validateRequestSize(maxSizeInBytes = 1024 * 1024) { // 1MB default
    return (req, res, next) => {
      const contentLength = req.headers['content-length'];
      
      if (contentLength && parseInt(contentLength) > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          message: `Request too large. Maximum size: ${maxSizeInBytes} bytes`,
          errorCode: 'REQUEST_TOO_LARGE'
        });
      }

      next();
    };
  }

  /**
   * Trim string fields in request body
   */
  static trimStrings(req, res, next) {
    const trimObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          trimObject(obj[key]);
        }
      }
    };

    if (req.body && typeof req.body === 'object') {
      trimObject(req.body);
    }

    next();
  }
}

module.exports = ValidationMiddleware; 