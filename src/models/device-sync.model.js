const { pool } = require('../config/database.config');

/**
 * Device Sync Model
 * Handles database operations for device synchronization
 */

class DeviceSyncModel {
  /**
   * Register or update a device for sync
   */
  static async registerDevice(userId, deviceData) {
    const { deviceId, deviceName, deviceType } = deviceData;

    // Check if device already exists
    const existingQuery = `
      SELECT id, device_name, device_type, sync_enabled, total_photos_synced, last_sync_at
      FROM device_sync_status
      WHERE user_id = $1 AND device_id = $2
    `;
    
    const existingResult = await pool.query(existingQuery, [userId, deviceId]);

    if (existingResult.rows.length > 0) {
      // Update existing device
      const updateQuery = `
        UPDATE device_sync_status
        SET device_name = COALESCE($3, device_name),
            device_type = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND device_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [userId, deviceId, deviceName, deviceType]);
      return { isNew: false, device: result.rows[0] };
    } else {
      // Create new device
      const insertQuery = `
        INSERT INTO device_sync_status 
        (user_id, device_id, device_name, device_type, sync_enabled, total_photos_synced)
        VALUES ($1, $2, $3, $4, true, 0)
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [userId, deviceId, deviceName, deviceType]);
      return { isNew: true, device: result.rows[0] };
    }
  }

  /**
   * Get device sync status
   */
  static async getDeviceStatus(userId, deviceId) {
    const query = `
      SELECT * FROM device_sync_status
      WHERE user_id = $1 AND device_id = $2
    `;
    
    const result = await pool.query(query, [userId, deviceId]);
    return result.rows[0] || null;
  }

  /**
   * Get all user devices
   */
  static async getUserDevices(userId) {
    const query = `
      SELECT device_id, device_name, device_type, sync_enabled, 
             total_photos_synced, last_sync_at, created_at, updated_at
      FROM device_sync_status
      WHERE user_id = $1
      ORDER BY last_sync_at DESC, created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Update device sync settings
   */
  static async updateSyncSettings(userId, deviceId, settings) {
    const { syncEnabled } = settings;
    
    const query = `
      UPDATE device_sync_status
      SET sync_enabled = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND device_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, deviceId, syncEnabled]);
    return result.rows[0] || null;
  }

  /**
   * Log sync session
   */
  static async logSyncSession(userId, deviceId, sessionData) {
    const { 
      sessionType = 'manual_sync', 
      photosProcessed = 0, 
      photosUploaded = 0, 
      photosFailed = 0,
      status = 'completed'
    } = sessionData;

    const query = `
      INSERT INTO sync_sessions 
      (user_id, device_id, session_type, photos_processed, photos_uploaded, photos_failed, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId, deviceId, sessionType, photosProcessed, photosUploaded, photosFailed, status
    ]);

    // Update device sync status
    if (photosUploaded > 0) {
      await this.updateDeviceStats(userId, deviceId, photosUploaded);
    }

    return result.rows[0];
  }

  /**
   * Update device statistics
   */
  static async updateDeviceStats(userId, deviceId, photosUploaded) {
    const query = `
      UPDATE device_sync_status
      SET total_photos_synced = total_photos_synced + $3,
          last_sync_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND device_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, deviceId, photosUploaded]);
    return result.rows[0] || null;
  }

  /**
   * Check if file hash already exists for user
   */
  static async findPhotoByHash(userId, fileHash) {
    const query = `
      SELECT id, filename, file_url, caption, permission_type
      FROM photos
      WHERE user_id = $1 AND file_hash = $2
    `;
    
    const result = await pool.query(query, [userId, fileHash]);
    return result.rows[0] || null;
  }

  /**
   * Store device file mapping
   */
  static async storeDeviceFileMapping(data) {
    const { userId, deviceId, deviceFilePath, photoId, fileHash } = data;
    
    const query = `
      INSERT INTO device_file_mappings 
      (user_id, device_id, device_file_path, photo_id, file_hash)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, device_id, device_file_path) 
      DO UPDATE SET 
        photo_id = EXCLUDED.photo_id,
        file_hash = EXCLUDED.file_hash,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, deviceId, deviceFilePath, photoId, fileHash]);
    return result.rows[0];
  }

  /**
   * Get device file mappings
   */
  static async getDeviceFileMappings(userId, deviceId, limit = 100, offset = 0) {
    const query = `
      SELECT dfm.*, p.filename, p.file_url, p.caption
      FROM device_file_mappings dfm
      LEFT JOIN photos p ON dfm.photo_id = p.id
      WHERE dfm.user_id = $1 AND dfm.device_id = $2
      ORDER BY dfm.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await pool.query(query, [userId, deviceId, limit, offset]);
    return result.rows;
  }

  /**
   * Get sync history for device
   */
  static async getSyncHistory(userId, deviceId, limit = 20, offset = 0) {
    const query = `
      SELECT session_type, photos_processed, photos_uploaded, photos_failed, 
             status, started_at, completed_at, created_at
      FROM sync_sessions
      WHERE user_id = $1 AND device_id = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await pool.query(query, [userId, deviceId, limit, offset]);
    return result.rows;
  }

  /**
   * Delete device and related data
   */
  static async deleteDevice(userId, deviceId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete sync sessions
      await client.query(
        'DELETE FROM sync_sessions WHERE user_id = $1 AND device_id = $2',
        [userId, deviceId]
      );

      // Delete file mappings
      await client.query(
        'DELETE FROM device_file_mappings WHERE user_id = $1 AND device_id = $2',
        [userId, deviceId]
      );

      // Delete device sync status
      const deleteResult = await client.query(
        'DELETE FROM device_sync_status WHERE user_id = $1 AND device_id = $2 RETURNING *',
        [userId, deviceId]
      );

      await client.query('COMMIT');
      return deleteResult.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = DeviceSyncModel; 