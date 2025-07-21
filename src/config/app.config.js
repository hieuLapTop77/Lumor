/**
 * Application Configuration
 * Centralized app settings and environment configuration
 */

const appConfig = {
  // Server settings
  server: {
    port: parseInt(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiVersion: process.env.API_VERSION || 'v2'
  },

  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Key']
  },

  // Request limits
  limits: {
    jsonPayload: process.env.JSON_LIMIT || '10mb',
    urlEncoded: process.env.URL_ENCODED_LIMIT || '10mb',
    fileUpload: process.env.FILE_UPLOAD_LIMIT || '50mb',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000 // 30 seconds
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
    logDir: process.env.LOG_DIR || 'logs',
    maxFileSize: process.env.LOG_MAX_FILE_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },

  // Security settings
  security: {
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    trustProxy: process.env.TRUST_PROXY === 'true',
    contentSecurityPolicy: process.env.ENABLE_CSP === 'true',
    httpsOnly: process.env.HTTPS_ONLY === 'true'
  },

  // Cache settings
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    type: process.env.CACHE_TYPE || 'memory', // memory, redis
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0
    }
  },

  // API settings
  api: {
    prefix: process.env.API_PREFIX || '/api',
    v1Prefix: process.env.API_V1_PREFIX || '/api',
    v2Prefix: process.env.API_V2_PREFIX || '/api/v2',
    enableV1: process.env.ENABLE_API_V1 !== 'false',
    enableV2: process.env.ENABLE_API_V2 !== 'false',
    enableDocs: process.env.ENABLE_API_DOCS === 'true',
    docsPath: process.env.API_DOCS_PATH || '/docs'
  },

  // Features flags
  features: {
    enablePhotos: process.env.ENABLE_PHOTOS !== 'false',
    enableSharing: process.env.ENABLE_SHARING !== 'false',
    enableFriends: process.env.ENABLE_FRIENDS !== 'false',
    enableDeviceSync: process.env.ENABLE_DEVICE_SYNC !== 'false',
    enablePermissions: process.env.ENABLE_PERMISSIONS !== 'false',
    enableRealtime: process.env.ENABLE_REALTIME === 'true',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true'
  },

  // Performance settings
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    compressionLevel: parseInt(process.env.COMPRESSION_LEVEL) || 6,
    enableEtag: process.env.ENABLE_ETAG !== 'false',
    staticCacheMaxAge: parseInt(process.env.STATIC_CACHE_MAX_AGE) || 86400000 // 24 hours
  },

  // Monitoring
  monitoring: {
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
    healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics',
    enableStatusPage: process.env.ENABLE_STATUS_PAGE === 'true'
  },

  // Maintenance
  maintenance: {
    enabled: process.env.MAINTENANCE_MODE === 'true',
    message: process.env.MAINTENANCE_MESSAGE || 'System is under maintenance. Please try again later.',
    allowedIPs: process.env.MAINTENANCE_ALLOWED_IPS ? process.env.MAINTENANCE_ALLOWED_IPS.split(',') : [],
    endTime: process.env.MAINTENANCE_END_TIME
  }
};

/**
 * Get environment-specific configuration
 */
const getEnvironmentConfig = () => {
  const { environment } = appConfig.server;
  
  const configs = {
    development: {
      debug: true,
      hotReload: true,
      detailedErrors: true,
      enableCORS: true,
      trustProxy: false
    },
    
    production: {
      debug: false,
      hotReload: false,
      detailedErrors: false,
      enableCORS: false,
      trustProxy: true,
      compression: true,
      secureHeaders: true
    },
    
    testing: {
      debug: false,
      hotReload: false,
      detailedErrors: true,
      enableCORS: true,
      silentLogs: true
    }
  };
  
  return configs[environment] || configs.development;
};

/**
 * Validate configuration
 */
const validateConfig = () => {
  const errors = [];
  
  // Required environment variables
  const required = ['JWT_SECRET'];
  
  for (const env of required) {
    if (!process.env[env]) {
      errors.push(`Missing required environment variable: ${env}`);
    }
  }
  
  // Port validation
  if (appConfig.server.port < 1 || appConfig.server.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }
  
  // Environment validation
  const validEnvironments = ['development', 'production', 'testing', 'staging'];
  if (!validEnvironments.includes(appConfig.server.environment)) {
    errors.push(`Invalid environment: ${appConfig.server.environment}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get configuration summary for logging
 */
const getConfigSummary = () => {
  const { server, features, security } = appConfig;
  
  return {
    environment: server.environment,
    port: server.port,
    apiVersion: server.apiVersion,
    features: Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature),
    security: {
      helmet: security.enableHelmet,
      rateLimit: security.enableRateLimit,
      https: security.httpsOnly
    }
  };
};

/**
 * Check if feature is enabled
 */
const isFeatureEnabled = (featureName) => {
  return appConfig.features[featureName] === true;
};

/**
 * Get API URL
 */
const getApiUrl = (version = 'v2', path = '') => {
  const { baseUrl } = appConfig.server;
  const prefix = version === 'v1' ? appConfig.api.v1Prefix : appConfig.api.v2Prefix;
  
  return `${baseUrl}${prefix}${path}`;
};

/**
 * Check if in production
 */
const isProduction = () => {
  return appConfig.server.environment === 'production';
};

/**
 * Check if in development
 */
const isDevelopment = () => {
  return appConfig.server.environment === 'development';
};

/**
 * Check if in testing
 */
const isTesting = () => {
  return appConfig.server.environment === 'testing';
};

module.exports = {
  appConfig,
  getEnvironmentConfig,
  validateConfig,
  getConfigSummary,
  isFeatureEnabled,
  getApiUrl,
  isProduction,
  isDevelopment,
  isTesting
}; 