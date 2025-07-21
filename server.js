const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger.config');
const { appConfig } = require('./src/config/app.config');
const dbConfig = require('./src/config/database.config');

// Import refactored v2 main router
const v2Router = require('./src/routes/index');

// Import individual refactored routes
const newAuthRoutes = require('./src/routes/auth.routes');
const newPhotoRoutes = require('./src/routes/photo.routes');
const newFriendRoutes = require('./src/routes/friend.routes');
const newSharingRoutes = require('./src/routes/sharing.routes');
const newUserRoutes = require('./src/routes/user.routes');
const newDeviceSyncRoutes = require('./src/routes/device-sync.routes');
const newPermissionRoutes = require('./src/routes/permission.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await dbConfig.pool.query('SELECT NOW()');
    
    res.json({
      success: true,
      message: 'Server is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Server is running but database is not available',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the server and database are running properly
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 *                 database:
 *                   type: string
 *                   example: "connected"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Server is running but database is unavailable
 */

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TrustApp API Documentation',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
  },
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes - Main v2 Router (recommended)
app.use('/api/v2', v2Router);

// API Routes - Individual v2 Routes (for specific access)
app.use('/api/v2/auth', newAuthRoutes);
app.use('/api/v2/photos', newPhotoRoutes);
app.use('/api/v2/friends', newFriendRoutes);
app.use('/api/v2/sharing', newSharingRoutes);
app.use('/api/v2/users', newUserRoutes);
app.use('/api/v2/device-sync', newDeviceSyncRoutes);
app.use('/api/v2/permissions', newPermissionRoutes);

// Legacy API redirect (v1 -> v2)
app.use('/api/auth/*', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API version has been deprecated. Please use v2 APIs.',
    newEndpoint: req.originalUrl.replace('/api/', '/api/v2/'),
    documentation: `http://localhost:${appConfig.server.port}/docs/API.md`
  });
});

// Generic legacy redirect
app.use('/api/*', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This API version has been deprecated. Please use v2 APIs.',
    suggestion: req.originalUrl.replace('/api/', '/api/v2/'),
    documentation: `http://localhost:${appConfig.server.port}/docs/API.md`
  });
});

// API Documentation endpoints
app.get('/docs', (req, res) => {
  res.json({
    title: 'Photo Sharing Backend API',
    version: '2.0.0',
    description: 'RESTful API for photo sharing application',
    endpoints: {
      v2: {
        auth: '/api/v2/auth',
        photos: '/api/v2/photos', 
        friends: '/api/v2/friends',
        sharing: '/api/v2/sharing',
        users: '/api/v2/users',
        deviceSync: '/api/v2/device-sync',
        permissions: '/api/v2/permissions'
      }
    },
    documentation: {
      setup: '/docs/SETUP.md',
      api: '/docs/API.md',
      deployment: '/docs/DEPLOYMENT.md'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: {
      v2: ['/api/v2/auth', '/api/v2/photos', '/api/v2/friends', '/api/v2/sharing', '/api/v2/users', '/api/v2/device-sync', '/api/v2/permissions'],
      health: '/health',
      docs: '/docs'
    },
    suggestion: 'Check /docs for complete API documentation'
  });
});

// Database connection test with retry logic
const testDatabaseConnection = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await dbConfig.pool.query('SELECT NOW()');
      console.log('✅ Database connection successful');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        throw error;
      }
      const delay = Math.min(1000 * Math.pow(2, i), 30000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Start server
const startServer = async () => {
  try {
    await testDatabaseConnection();
    
    app.listen(appConfig.server.port, () => {
      console.log(`🚀 Server is running on port ${appConfig.server.port}`);
      console.log(`🌍 Environment: ${appConfig.server.environment}`);
      console.log(`📍 Health check: http://localhost:${appConfig.server.port}/health`);
      console.log(`📚 API documentation: http://localhost:${appConfig.server.port}/docs`);
      console.log(`🔧 Database admin: http://localhost:8081 (if using Docker)`);
      console.log(`📁 Photo uploads: http://localhost:${appConfig.server.port}/uploads`);
      console.log('');
      console.log('🎉 Photo Sharing Backend is ready!');
      console.log('   Use /api/v2/* endpoints for the latest API version');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  dbConfig.pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  dbConfig.pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

startServer(); 