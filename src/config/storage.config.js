const path = require('path');
const fs = require('fs').promises;

/**
 * Storage Configuration
 * Centralized storage settings and utilities
 */

const storageConfig = {
  // Local storage settings
  local: {
    uploadsDir: process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'),
    photosDir: process.env.PHOTOS_DIR || 'photos',
    tempDir: process.env.TEMP_DIR || 'temp',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/tiff',
      'image/bmp'
    ],
    // Extended types for device sync
    deviceSyncMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/tiff',
      'image/bmp',
      // RAW formats
      'image/x-canon-cr2',
      'image/x-canon-crw',
      'image/x-nikon-nef',
      'image/x-sony-arw',
      'image/x-adobe-dng',
      'image/x-panasonic-raw',
      'image/x-olympus-orf',
      'image/x-fuji-raf',
      'image/x-kodak-dcr',
      'image/x-sigma-x3f'
    ]
  },

  // Cloud storage settings (for future implementation)
  cloud: {
    provider: process.env.CLOUD_PROVIDER || 'aws', // aws, gcp, azure
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'photo-sharing-bucket',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      endpoint: process.env.AWS_ENDPOINT // for S3-compatible services
    },
    gcp: {
      projectId: process.env.GCP_PROJECT_ID,
      bucketName: process.env.GCP_BUCKET_NAME,
      keyFilename: process.env.GCP_KEY_FILENAME
    },
    azure: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName: process.env.AZURE_CONTAINER_NAME || 'photos'
    }
  },

  // CDN settings
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    baseUrl: process.env.CDN_BASE_URL,
    cacheTimeout: parseInt(process.env.CDN_CACHE_TIMEOUT) || 86400 // 24 hours
  }
};

/**
 * Initialize storage directories
 */
const initializeStorage = async () => {
  try {
    const { uploadsDir, photosDir, tempDir } = storageConfig.local;
    
    // Create main uploads directory
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Create photos subdirectory
    const photosPath = path.join(uploadsDir, photosDir);
    await fs.mkdir(photosPath, { recursive: true });
    
    // Create temp subdirectory
    const tempPath = path.join(uploadsDir, tempDir);
    await fs.mkdir(tempPath, { recursive: true });
    
    console.log('✅ Storage directories initialized successfully');
    console.log(`   Uploads: ${uploadsDir}`);
    console.log(`   Photos: ${photosPath}`);
    console.log(`   Temp: ${tempPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize storage directories:', error);
    throw error;
  }
};

/**
 * Get user storage path
 */
const getUserStoragePath = (userId, category = 'photos') => {
  const { uploadsDir } = storageConfig.local;
  return path.join(uploadsDir, category, userId.toString());
};

/**
 * Ensure user directory exists
 */
const ensureUserDirectory = async (userId, category = 'photos') => {
  const userPath = getUserStoragePath(userId, category);
  
  try {
    await fs.mkdir(userPath, { recursive: true });
    return userPath;
  } catch (error) {
    console.error('Failed to create user directory:', error);
    throw error;
  }
};

/**
 * Get storage statistics
 */
const getStorageStats = async () => {
  try {
    const { uploadsDir } = storageConfig.local;
    
    const getDirectorySize = async (dirPath) => {
      try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        let totalSize = 0;
        let fileCount = 0;
        
        for (const file of files) {
          const filePath = path.join(dirPath, file.name);
          
          if (file.isDirectory()) {
            const subStats = await getDirectorySize(filePath);
            totalSize += subStats.size;
            fileCount += subStats.count;
          } else {
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
            fileCount++;
          }
        }
        
        return { size: totalSize, count: fileCount };
      } catch (error) {
        return { size: 0, count: 0 };
      }
    };
    
    const stats = await getDirectorySize(uploadsDir);
    
    return {
      totalSize: stats.size,
      totalFiles: stats.count,
      formattedSize: formatBytes(stats.size),
      uploadsDir
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      totalSize: 0,
      totalFiles: 0,
      formattedSize: '0 B',
      error: error.message
    };
  }
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Clean up old temporary files
 */
const cleanupTempFiles = async (maxAge = 24 * 60 * 60 * 1000) => { // 24 hours
  try {
    const tempDir = path.join(storageConfig.local.uploadsDir, storageConfig.local.tempDir);
    const files = await fs.readdir(tempDir);
    
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleanedCount} temporary files`);
    return cleanedCount;
  } catch (error) {
    console.error('Failed to cleanup temp files:', error);
    return 0;
  }
};

/**
 * Validate file type
 */
const isValidFileType = (mimetype, category = 'photos') => {
  const allowedTypes = category === 'device-sync' 
    ? storageConfig.local.deviceSyncMimeTypes 
    : storageConfig.local.allowedMimeTypes;
    
  return allowedTypes.includes(mimetype);
};

/**
 * Get file URL
 */
const getFileUrl = (filePath, category = 'photos') => {
  const { cdn, local } = storageConfig;
  
  if (cdn.enabled && cdn.baseUrl) {
    // Return CDN URL
    const relativePath = path.relative(local.uploadsDir, filePath);
    return `${cdn.baseUrl}/${relativePath.replace(/\\/g, '/')}`;
  } else {
    // Return local URL
    const relativePath = path.relative(local.uploadsDir, filePath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }
};

module.exports = {
  storageConfig,
  initializeStorage,
  getUserStoragePath,
  ensureUserDirectory,
  getStorageStats,
  formatBytes,
  cleanupTempFiles,
  isValidFileType,
  getFileUrl
}; 