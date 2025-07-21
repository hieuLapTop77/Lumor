const multer = require('multer');

/**
 * Upload Middleware - Handles file upload configuration
 */

// Configure multer for file uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

/**
 * Single photo upload middleware
 */
const uploadSinglePhoto = upload.single('photo');

/**
 * Enhanced upload middleware with error handling
 */
const photoUploadMiddleware = (req, res, next) => {
  uploadSinglePhoto(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.',
            error: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name. Use "photo" as field name.',
            error: 'INVALID_FIELD_NAME'
          });
        }
      }
      
      // Custom file type error
      if (err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'INVALID_FILE_TYPE'
        });
      }
      
      // Generic upload error
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    }
    
    next();
  });
};

module.exports = {
  photoUploadMiddleware,
  uploadSinglePhoto
}; 