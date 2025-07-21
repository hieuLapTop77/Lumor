const express = require('express');
const { appConfig, isFeatureEnabled } = require('../config/app.config');

// Import all route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const photoRoutes = require('./photo.routes');
const friendRoutes = require('./friend.routes');
const sharingRoutes = require('./sharing.routes');
const deviceSyncRoutes = require('./device-sync.routes');
const permissionRoutes = require('./permission.routes');

// Import middleware
const AuthMiddleware = require('../middleware/auth.middleware');
const ValidationMiddleware = require('../middleware/validation.middleware');
const ErrorMiddleware = require('../middleware/error.middleware');

/**
 * Main Router for API v2
 * Organizes and manages all API routes with feature flags
 */

const router = express.Router();

// Apply global middleware for API v2
router.use(ValidationMiddleware.sanitizeInput);
router.use(ValidationMiddleware.trimStrings);

// API v2 info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Photo Sharing API v2',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: '/auth',
      users: '/users',
      photos: isFeatureEnabled('enablePhotos') ? '/photos' : 'disabled',
      friends: isFeatureEnabled('enableFriends') ? '/friends' : 'disabled',
      sharing: isFeatureEnabled('enableSharing') ? '/sharing' : 'disabled',
      deviceSync: isFeatureEnabled('enableDeviceSync') ? '/device-sync' : 'disabled',
      permissions: isFeatureEnabled('enablePermissions') ? '/permissions' : 'disabled'
    },
    documentation: isFeatureEnabled('enableDocs') ? `${appConfig.api.docsPath}` : 'disabled'
  });
});

// Authentication routes (always enabled)
router.use('/auth', authRoutes);

// User management routes (always enabled)
router.use('/users', userRoutes);

// Photo management routes (feature flag controlled)
if (isFeatureEnabled('enablePhotos')) {
  router.use('/photos', photoRoutes);
} else {
  router.all('/photos/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Photo management feature is currently disabled',
      errorCode: 'FEATURE_DISABLED'
    });
  });
}

// Friend management routes (feature flag controlled)
if (isFeatureEnabled('enableFriends')) {
  router.use('/friends', friendRoutes);
} else {
  router.all('/friends/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Friend management feature is currently disabled',
      errorCode: 'FEATURE_DISABLED'
    });
  });
}

// Sharing routes (feature flag controlled)
if (isFeatureEnabled('enableSharing')) {
  router.use('/sharing', sharingRoutes);
} else {
  router.all('/sharing/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Sharing feature is currently disabled',
      errorCode: 'FEATURE_DISABLED'
    });
  });
}

// Device sync routes (feature flag controlled)
if (isFeatureEnabled('enableDeviceSync')) {
  router.use('/device-sync', deviceSyncRoutes);
} else {
  router.all('/device-sync/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Device sync feature is currently disabled',
      errorCode: 'FEATURE_DISABLED'
    });
  });
}

// Permission management routes (feature flag controlled)
if (isFeatureEnabled('enablePermissions')) {
  router.use('/permissions', permissionRoutes);
} else {
  router.all('/permissions/*', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Permission management feature is currently disabled',
      errorCode: 'FEATURE_DISABLED'
    });
  });
}

// Health check endpoint for API v2
router.get('/health', async (req, res) => {
  try {
    const { healthCheck } = require('../config/database.config');
    const { getStorageStats } = require('../config/storage.config');
    
    const [dbHealth, storageStats] = await Promise.all([
      healthCheck(),
      getStorageStats()
    ]);
    
    const health = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbHealth,
      storage: storageStats,
      features: {
        photos: isFeatureEnabled('enablePhotos'),
        friends: isFeatureEnabled('enableFriends'),
        sharing: isFeatureEnabled('enableSharing'),
        deviceSync: isFeatureEnabled('enableDeviceSync'),
        permissions: isFeatureEnabled('enablePermissions')
      }
    };
    
    const overallHealthy = dbHealth.status === 'healthy';
    res.status(overallHealthy ? 200 : 503).json(health);
    
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API stats endpoint (protected)
router.get('/stats', 
  AuthMiddleware.authenticateToken,
  async (req, res) => {
    try {
      // This would typically require admin privileges
      const stats = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version,
        platform: process.platform,
        features: Object.entries(appConfig.features)
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {})
      };
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve stats',
        error: error.message
      });
    }
  }
);

// Rate limit info endpoint
router.get('/rate-limit', (req, res) => {
  res.json({
    success: true,
    message: 'Rate limit information',
    limits: {
      window: appConfig.rateLimit?.windowMs || '15 minutes',
      maxRequests: appConfig.rateLimit?.maxAttempts || 100,
      current: req.rateLimit || 'not available'
    }
  });
});

// API documentation endpoint (if enabled)
if (isFeatureEnabled('enableDocs')) {
  router.get('/docs', (req, res) => {
    res.json({
      success: true,
      message: 'API Documentation',
      version: '2.0.0',
      baseUrl: appConfig.server.baseUrl,
      endpoints: {
        authentication: {
          register: 'POST /auth/register',
          login: 'POST /auth/login',
          logout: 'POST /auth/logout',
          refresh: 'POST /auth/refresh-token',
          changePassword: 'PUT /auth/change-password',
          forgotPassword: 'POST /auth/forgot-password',
          resetPassword: 'POST /auth/reset-password'
        },
        users: {
          profile: 'GET /users/me',
          updateProfile: 'PUT /users/me',
          statistics: 'GET /users/me/statistics',
          activity: 'GET /users/me/activity',
          search: 'GET /users/search',
          deleteAccount: 'DELETE /users/me'
        },
        photos: isFeatureEnabled('enablePhotos') ? {
          upload: 'POST /photos/upload',
          myPhotos: 'GET /photos/my-photos',
          getPhoto: 'GET /photos/:photoId',
          updatePhoto: 'PUT /photos/:photoId',
          deletePhoto: 'DELETE /photos/:photoId',
          timeline: 'GET /photos/timeline',
          userPhotos: 'GET /photos/user/:userId',
          storageStats: 'GET /photos/storage-stats'
        } : 'disabled',
        // Add other endpoint documentation as needed
      }
    });
  });
}

// Handle 404 for unmatched API v2 routes
router.use('*', ErrorMiddleware.handleNotFound);

module.exports = router; 