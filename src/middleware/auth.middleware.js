const jwt = require('jsonwebtoken');
const { authConfig } = require('../config/auth.config');
const UserModel = require('../models/user.model');

/**
 * Auth Middleware
 * Enhanced authentication middleware for JWT validation and user context
 */

class AuthMiddleware {
  /**
   * Authenticate JWT token and add user to request
   */
  static authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        errorCode: 'TOKEN_MISSING'
      });
    }

    jwt.verify(token, authConfig.jwt.secret, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Access token expired',
            errorCode: 'TOKEN_EXPIRED'
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid access token',
            errorCode: 'TOKEN_INVALID'
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Token verification failed',
            errorCode: 'TOKEN_VERIFICATION_FAILED'
          });
        }
      }

      try {
        // Verify user still exists and is active
        const user = await UserModel.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found',
            errorCode: 'USER_NOT_FOUND'
          });
        }

        // Add user info to request
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.display_name
        };

        next();
      } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
          success: false,
          message: 'Authentication verification failed',
          errorCode: 'AUTH_VERIFICATION_ERROR'
        });
      }
    });
  }

  /**
   * Optional authentication - adds user to request if token is valid, but doesn't require it
   */
  static optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, authConfig.jwt.secret, async (err, decoded) => {
      if (err) {
        req.user = null;
        return next();
      }

      try {
        const user = await UserModel.findById(decoded.userId);
        if (user) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.display_name
          };
        } else {
          req.user = null;
        }
      } catch (error) {
        console.error('Optional auth error:', error);
        req.user = null;
      }

      next();
    });
  }

  /**
   * Require specific user roles (if implemented)
   */
  static requireRole(roles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          errorCode: 'AUTH_REQUIRED'
        });
      }

      // If roles are implemented in the future
      if (req.user.role && roles.includes(req.user.role)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errorCode: 'INSUFFICIENT_PERMISSIONS'
      });
    };
  }

  /**
   * Rate limiting per user
   */
  static userRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const userRequests = new Map();

    return (req, res, next) => {
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean up old entries
      if (userRequests.has(userId)) {
        const requests = userRequests.get(userId).filter(time => time > windowStart);
        userRequests.set(userId, requests);
      }

      // Get current requests for user
      const currentRequests = userRequests.get(userId) || [];

      if (currentRequests.length >= maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          errorCode: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current request
      currentRequests.push(now);
      userRequests.set(userId, currentRequests);

      next();
    };
  }

  /**
   * Check if user owns resource
   */
  static requireResourceOwnership(resourceIdParam = 'id', userIdField = 'user_id') {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          errorCode: 'AUTH_REQUIRED'
        });
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID required',
          errorCode: 'RESOURCE_ID_REQUIRED'
        });
      }

      // This would need to be implemented based on specific resource types
      // For now, we'll pass it to the next middleware/controller
      next();
    };
  }

  /**
   * Log user activity
   */
  static logActivity(action) {
    return (req, res, next) => {
      if (req.user) {
        // Log user activity for analytics/security
        console.log(`User ${req.user.id} performed action: ${action} at ${new Date().toISOString()}`);
        // In a real app, this would write to a logging service or database
      }
      next();
    };
  }

  /**
   * Validate API key (for API access)
   */
  static validateAPIKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required',
        errorCode: 'API_KEY_MISSING'
      });
    }

    // In a real implementation, validate against stored API keys
    // For now, just check if it exists
    if (apiKey.startsWith('sk_')) {
      req.apiKey = apiKey;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        errorCode: 'API_KEY_INVALID'
      });
    }
  }
}

module.exports = AuthMiddleware; 