const multer = require('multer');

/**
 * Device Sync Upload Middleware
 * Configures multer for bulk photo uploads from devices
 */

// Configure multer for device sync uploads
const storage = multer.memoryStorage();

const deviceSyncUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file for high-res photos
    files: 100 // Maximum 100 files at once for device sync
  },
  fileFilter: (req, file, cb) => {
    // Extended file types for device sync including RAW formats
    const allowedTypes = [
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
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only image files are allowed for device sync.`), false);
    }
  }
});

// Middleware for handling multiple file uploads for device sync
const deviceSyncMultipleUpload = deviceSyncUpload.array('photos', 100);

// Enhanced error handling middleware for device sync uploads
const handleDeviceSyncUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 50MB per file.',
          errorCode: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 100 files per upload.',
          errorCode: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Use "photos" field for file uploads.',
          errorCode: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message,
          errorCode: 'UPLOAD_ERROR'
        });
    }
  }

  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errorCode: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
};

module.exports = {
  deviceSyncMultipleUpload,
  handleDeviceSyncUploadErrors
}; 