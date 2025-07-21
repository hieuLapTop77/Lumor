const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * File Utilities
 * Contains utility functions for file operations
 */

class FileUtils {
  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const uuid = crypto.randomUUID();
    return `${uuid}${ext}`;
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Validate file type
   */
  static isValidImageType(mimetype) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/tiff',
      'image/bmp'
    ];
    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   */
  static isValidFileSize(size, maxSizeInBytes = 10 * 1024 * 1024) { // 10MB default
    return size <= maxSizeInBytes;
  }

  /**
   * Generate file hash for deduplication
   */
  static generateFileHash(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Generate SHA256 hash
   */
  static generateSHA256Hash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Ensure directory exists
   */
  static async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete file if exists
   */
  static async deleteFileIfExists(filePath) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get MIME type from extension
   */
  static getMimeTypeFromExtension(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
      '.tiff': 'image/tiff',
      '.bmp': 'image/bmp'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create upload path for user
   */
  static createUploadPath(userId, category = 'photos') {
    const userIdStr = userId.toString();
    return path.join('uploads', category, userIdStr);
  }

  /**
   * Generate local upload path and filename for file storage
   */
  static generateLocalUploadPath(userId, originalFilename, mimetype) {
    // Create user-specific directory path
    const uploadDir = this.createUploadPath(userId, 'photos');
    
    // Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(originalFilename);
    
    // Create full file path
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Create relative path for URL and storage reference
    const relativePath = path.join('uploads', 'photos', userId.toString(), uniqueFilename);
    
    // Create relative URL for access
    const fileUrl = `/uploads/photos/${userId}/${uniqueFilename}`;
    
    return {
      directory: uploadDir,
      filename: uniqueFilename,
      filePath: filePath,
      relativePath: relativePath,
      fileUrl: fileUrl,
      originalName: originalFilename,
      mimetype: mimetype
    };
  }

  /**
   * Save file buffer to local storage
   */
  static async saveFileToLocal(buffer, filePath) {
    try {
      // Ensure directory exists
      const directory = path.dirname(filePath);
      await this.ensureDirectoryExists(directory);
      
      // Write file to disk
      await fs.writeFile(filePath, buffer);
      
      return {
        success: true,
        filePath: filePath,
        size: buffer.length
      };
    } catch (error) {
      console.error('Save file to local error:', error);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Generate local file URL for accessing stored files
   */
  static generateLocalFileUrl(relativePath) {
    // Ensure path starts with /
    if (!relativePath.startsWith('/')) {
      relativePath = '/' + relativePath;
    }
    return relativePath;
  }

  /**
   * Delete file from local storage
   */
  static async deleteFileFromLocal(relativePath) {
    try {
      // Convert relative path to absolute
      const fullPath = path.join(process.cwd(), relativePath);
      await this.deleteFileIfExists(fullPath);
      
      return {
        success: true,
        deletedPath: relativePath
      };
    } catch (error) {
      console.error('Delete file from local error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Check if local storage is available and has space
   */
  static checkLocalStorageAvailable() {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // Check if uploads directory exists or can be created
      return {
        available: true,
        uploadsDir: uploadsDir,
        freeSpace: 'unlimited', // For local storage, we assume unlimited space
        message: 'Local storage is available'
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        message: 'Local storage is not available'
      };
    }
  }

  /**
   * Validate and sanitize filename
   */
  static sanitizeFilename(filename) {
    // Remove dangerous characters and limit length
    const sanitized = filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 255);
    
    return sanitized || 'unnamed_file';
  }

  /**
   * Check if file is corrupted (basic check)
   */
  static async isFileCorrupted(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size === 0; // Basic check - empty file
    } catch (error) {
      return true; // If can't access, consider corrupted
    }
  }
}

module.exports = FileUtils; 