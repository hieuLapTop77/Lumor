const DeviceSyncModel = require('../models/device-sync.model');
const PhotoService = require('./photo.service');
const { createSuccessResponse, createErrorResponse } = require('../utils/response.utils');
const crypto = require('crypto');

/**
 * Device Sync Service
 * Contains business logic for device synchronization
 */

class DeviceSyncService {
  /**
   * Register or update a device
   */
  static async registerDevice(userId, deviceData) {
    try {
      const result = await DeviceSyncModel.registerDevice(userId, deviceData);
      
      const message = result.isNew 
        ? 'Device registered successfully' 
        : 'Device updated successfully';
      
      return createSuccessResponse(message, { 
        device: result.device,
        isNewDevice: result.isNew 
      });
    } catch (error) {
      console.error('Register device error:', error);
      return createErrorResponse('Failed to register device');
    }
  }

  /**
   * Get device sync status
   */
  static async getDeviceStatus(userId, deviceId) {
    try {
      const device = await DeviceSyncModel.getDeviceStatus(userId, deviceId);
      
      if (!device) {
        return createErrorResponse('Device not found', 404);
      }
      
      return createSuccessResponse('Device status retrieved successfully', { device });
    } catch (error) {
      console.error('Get device status error:', error);
      return createErrorResponse('Failed to retrieve device status');
    }
  }

  /**
   * Get all user devices
   */
  static async getUserDevices(userId) {
    try {
      const devices = await DeviceSyncModel.getUserDevices(userId);
      
      return createSuccessResponse('Devices retrieved successfully', { 
        devices,
        total: devices.length 
      });
    } catch (error) {
      console.error('Get user devices error:', error);
      return createErrorResponse('Failed to retrieve devices');
    }
  }

  /**
   * Update device sync settings
   */
  static async updateSyncSettings(userId, deviceId, settings) {
    try {
      const device = await DeviceSyncModel.updateSyncSettings(userId, deviceId, settings);
      
      if (!device) {
        return createErrorResponse('Device not found', 404);
      }
      
      return createSuccessResponse('Sync settings updated successfully', { device });
    } catch (error) {
      console.error('Update sync settings error:', error);
      return createErrorResponse('Failed to update sync settings');
    }
  }

  /**
   * Process bulk photo upload from device
   */
  static async processBulkUpload(userId, files, uploadData) {
    try {
      const { deviceId, permissionType, customGroupId, sessionType = 'manual_sync' } = uploadData;
      
      // Verify device exists
      const device = await DeviceSyncModel.getDeviceStatus(userId, deviceId);
      if (!device) {
        return createErrorResponse('Device not found', 404);
      }

      const results = {
        processed: 0,
        uploaded: 0,
        skipped: 0,
        failed: 0,
        photos: []
      };

      // Process each file
      for (const file of files) {
        results.processed++;
        
        try {
          // Generate file hash for deduplication
          const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
          
          // Check if photo already exists
          const existingPhoto = await DeviceSyncModel.findPhotoByHash(userId, fileHash);
          
          if (existingPhoto) {
            results.skipped++;
            results.photos.push({
              filename: file.originalname,
              status: 'skipped',
              reason: 'File already exists',
              existingPhotoId: existingPhoto.id
            });
            continue;
          }

          // Upload photo using photo service
          const uploadResult = await PhotoService.uploadPhoto(userId, file, {
            caption: '',
            permissionType,
            customGroupId,
            fileHash
          });

          if (uploadResult.success) {
            results.uploaded++;
            const photoId = uploadResult.data.photo.id;
            
            // Store device file mapping if deviceFilePath is provided
            const deviceFilePath = uploadData.photos?.find(p => p.fileName === file.originalname)?.deviceFilePath;
            if (deviceFilePath) {
              await DeviceSyncModel.storeDeviceFileMapping({
                userId,
                deviceId,
                deviceFilePath,
                photoId,
                fileHash
              });
            }
            
            results.photos.push({
              filename: file.originalname,
              status: 'uploaded',
              photoId,
              fileUrl: uploadResult.data.photo.fileUrl
            });
          } else {
            results.failed++;
            results.photos.push({
              filename: file.originalname,
              status: 'failed',
              reason: uploadResult.message
            });
          }
        } catch (fileError) {
          console.error('File processing error:', fileError);
          results.failed++;
          results.photos.push({
            filename: file.originalname,
            status: 'failed',
            reason: 'Processing error'
          });
        }
      }

      // Log sync session
      await DeviceSyncModel.logSyncSession(userId, deviceId, {
        sessionType,
        photosProcessed: results.processed,
        photosUploaded: results.uploaded,
        photosFailed: results.failed,
        status: results.failed > 0 ? 'completed_with_errors' : 'completed'
      });

      return createSuccessResponse('Bulk upload completed', { results });
    } catch (error) {
      console.error('Process bulk upload error:', error);
      return createErrorResponse('Failed to process bulk upload');
    }
  }

  /**
   * Get device file mappings
   */
  static async getDeviceFileMappings(userId, deviceId, limit, offset) {
    try {
      const mappings = await DeviceSyncModel.getDeviceFileMappings(userId, deviceId, limit, offset);
      
      return createSuccessResponse('Device file mappings retrieved successfully', {
        mappings,
        pagination: {
          limit,
          offset,
          hasMore: mappings.length === limit
        }
      });
    } catch (error) {
      console.error('Get device file mappings error:', error);
      return createErrorResponse('Failed to retrieve device file mappings');
    }
  }

  /**
   * Get sync history for device
   */
  static async getSyncHistory(userId, deviceId, limit, offset) {
    try {
      const history = await DeviceSyncModel.getSyncHistory(userId, deviceId, limit, offset);
      
      return createSuccessResponse('Sync history retrieved successfully', {
        history,
        pagination: {
          limit,
          offset,
          hasMore: history.length === limit
        }
      });
    } catch (error) {
      console.error('Get sync history error:', error);
      return createErrorResponse('Failed to retrieve sync history');
    }
  }

  /**
   * Delete device and all related data
   */
  static async deleteDevice(userId, deviceId) {
    try {
      const deletedDevice = await DeviceSyncModel.deleteDevice(userId, deviceId);
      
      if (!deletedDevice) {
        return createErrorResponse('Device not found', 404);
      }
      
      return createSuccessResponse('Device deleted successfully', { device: deletedDevice });
    } catch (error) {
      console.error('Delete device error:', error);
      return createErrorResponse('Failed to delete device');
    }
  }

  /**
   * Generate file hash for deduplication
   */
  static generateFileHash(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }
}

module.exports = DeviceSyncService; 