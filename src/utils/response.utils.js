/**
 * Standard response utilities for consistent API responses
 */

class ResponseUtils {
  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {Object} data - Response data
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(res, message, data = null, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 400)
   * @param {Object} errors - Validation errors or additional error details
   */
  static error(res, message, statusCode = 400, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors from express-validator
   */
  static validationError(res, errors) {
    return this.error(res, 'Validation failed', 400, errors);
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource that was not found
   */
  static notFound(res, resource = 'Resource') {
    return this.error(res, `${resource} not found`, 404);
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Custom message (optional)
   */
  static unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Custom message (optional)
   */
  static forbidden(res, message = 'Access denied') {
    return this.error(res, message, 403);
  }

  /**
   * Internal server error response
   * @param {Object} res - Express response object
   * @param {string} message - Custom message (optional)
   */
  static serverError(res, message = 'Internal server error') {
    return this.error(res, message, 500);
  }

  /**
   * Paginated response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {Array} items - Paginated items
   * @param {Object} pagination - Pagination metadata
   */
  static paginated(res, message, items, pagination) {
    const data = {
      items,
      pagination: {
        currentPage: parseInt(pagination.page),
        totalPages: Math.ceil(pagination.totalCount / pagination.limit),
        totalCount: pagination.totalCount,
        limit: parseInt(pagination.limit),
        hasNext: (pagination.page * pagination.limit) < pagination.totalCount,
        hasPrev: pagination.page > 1
      }
    };

    return this.success(res, message, data);
  }

  /**
   * Created response (201)
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   * @param {Object} data - Created resource data
   */
  static created(res, message, data) {
    return this.success(res, message, data, 201);
  }

  /**
   * No content response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ResponseUtils; 