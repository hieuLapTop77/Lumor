const { pool } = require('../config/database.config');

/**
 * Permission Model
 * Handles database operations for permission groups and settings
 */

class PermissionModel {
  /**
   * Create a new permission group
   */
  static async createPermissionGroup(userId, groupData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { name, description, userIds } = groupData;

      // Create the permission group
      const groupQuery = `
        INSERT INTO permission_groups (owner_id, name, description, is_active)
        VALUES ($1, $2, $3, true)
        RETURNING *
      `;
      
      const groupResult = await client.query(groupQuery, [userId, name, description]);
      const group = groupResult.rows[0];

      // Add users to the group if provided
      if (userIds && userIds.length > 0) {
        const memberValues = userIds.map((userId, index) => {
          const offset = index * 2;
          return `($${offset + 1}, $${offset + 2})`;
        }).join(',');

        const memberQuery = `
          INSERT INTO permission_group_members (group_id, user_id)
          VALUES ${memberValues}
        `;
        
        const memberParams = [];
        userIds.forEach(userId => {
          memberParams.push(group.id, userId);
        });

        await client.query(memberQuery, memberParams);
      }

      await client.query('COMMIT');
      return group;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's permission groups
   */
  static async getUserPermissionGroups(userId) {
    const query = `
      SELECT 
        pg.id,
        pg.name,
        pg.description,
        pg.is_active,
        pg.created_at,
        pg.updated_at,
        COUNT(pgm.user_id) as member_count
      FROM permission_groups pg
      LEFT JOIN permission_group_members pgm ON pg.id = pgm.group_id
      WHERE pg.owner_id = $1 AND pg.is_active = true
      GROUP BY pg.id, pg.name, pg.description, pg.is_active, pg.created_at, pg.updated_at
      ORDER BY pg.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get permission group by ID with members
   */
  static async getPermissionGroupById(groupId, ownerId) {
    const groupQuery = `
      SELECT * FROM permission_groups
      WHERE id = $1 AND owner_id = $2 AND is_active = true
    `;
    
    const membersQuery = `
      SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        pgm.added_at
      FROM permission_group_members pgm
      JOIN users u ON pgm.user_id = u.id
      WHERE pgm.group_id = $1
      ORDER BY pgm.added_at DESC
    `;
    
    const [groupResult, membersResult] = await Promise.all([
      pool.query(groupQuery, [groupId, ownerId]),
      pool.query(membersQuery, [groupId])
    ]);

    if (groupResult.rows.length === 0) {
      return null;
    }

    return {
      ...groupResult.rows[0],
      members: membersResult.rows
    };
  }

  /**
   * Update permission group
   */
  static async updatePermissionGroup(groupId, ownerId, updateData) {
    const { name, description, userIds } = updateData;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update group basic info
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramCounter}`);
        updateValues.push(name);
        paramCounter++;
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramCounter}`);
        updateValues.push(description);
        paramCounter++;
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(groupId, ownerId);
        
        const updateQuery = `
          UPDATE permission_groups
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCounter} AND owner_id = $${paramCounter + 1} AND is_active = true
          RETURNING *
        `;
        
        const updateResult = await client.query(updateQuery, updateValues);
        
        if (updateResult.rows.length === 0) {
          throw new Error('Permission group not found');
        }
      }

      // Update members if provided
      if (userIds !== undefined) {
        // Remove all existing members
        await client.query(
          'DELETE FROM permission_group_members WHERE group_id = $1',
          [groupId]
        );

        // Add new members
        if (userIds.length > 0) {
          const memberValues = userIds.map((userId, index) => {
            const offset = index * 2;
            return `($${offset + 1}, $${offset + 2})`;
          }).join(',');

          const memberQuery = `
            INSERT INTO permission_group_members (group_id, user_id)
            VALUES ${memberValues}
          `;
          
          const memberParams = [];
          userIds.forEach(userId => {
            memberParams.push(groupId, userId);
          });

          await client.query(memberQuery, memberParams);
        }
      }

      await client.query('COMMIT');
      
      // Return updated group with members
      return await this.getPermissionGroupById(groupId, ownerId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete permission group (soft delete)
   */
  static async deletePermissionGroup(groupId, ownerId) {
    const query = `
      UPDATE permission_groups
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND owner_id = $2 AND is_active = true
      RETURNING *
    `;
    
    const result = await pool.query(query, [groupId, ownerId]);
    return result.rows[0] || null;
  }

  /**
   * Add users to permission group
   */
  static async addUsersToGroup(groupId, ownerId, userIds) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify group ownership
      const groupCheck = await client.query(
        'SELECT 1 FROM permission_groups WHERE id = $1 AND owner_id = $2 AND is_active = true',
        [groupId, ownerId]
      );

      if (groupCheck.rows.length === 0) {
        throw new Error('Permission group not found');
      }

      // Get existing members
      const existingMembers = await client.query(
        'SELECT user_id FROM permission_group_members WHERE group_id = $1',
        [groupId]
      );
      
      const existingUserIds = existingMembers.rows.map(row => row.user_id);
      const newUserIds = userIds.filter(userId => !existingUserIds.includes(userId));

      if (newUserIds.length > 0) {
        const memberValues = newUserIds.map((userId, index) => {
          const offset = index * 2;
          return `($${offset + 1}, $${offset + 2})`;
        }).join(',');

        const memberQuery = `
          INSERT INTO permission_group_members (group_id, user_id)
          VALUES ${memberValues}
        `;
        
        const memberParams = [];
        newUserIds.forEach(userId => {
          memberParams.push(groupId, userId);
        });

        await client.query(memberQuery, memberParams);
      }

      await client.query('COMMIT');
      return { addedCount: newUserIds.length, skippedCount: userIds.length - newUserIds.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove users from permission group
   */
  static async removeUsersFromGroup(groupId, ownerId, userIds) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify group ownership
      const groupCheck = await client.query(
        'SELECT 1 FROM permission_groups WHERE id = $1 AND owner_id = $2 AND is_active = true',
        [groupId, ownerId]
      );

      if (groupCheck.rows.length === 0) {
        throw new Error('Permission group not found');
      }

      const placeholders = userIds.map((_, index) => `$${index + 2}`).join(',');
      const removeQuery = `
        DELETE FROM permission_group_members
        WHERE group_id = $1 AND user_id IN (${placeholders})
      `;
      
      const removeResult = await client.query(removeQuery, [groupId, ...userIds]);

      await client.query('COMMIT');
      return { removedCount: removeResult.rowCount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's default permission settings
   */
  static async getUserDefaultPermissions(userId) {
    const query = `
      SELECT 
        default_sharing_enabled,
        auto_sync_permission_type,
        auto_sync_custom_group_id
      FROM users
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update user's default permission settings
   */
  static async updateUserDefaultPermissions(userId, permissionData) {
    const { permissionType, customGroupId } = permissionData;
    
    const query = `
      UPDATE users
      SET auto_sync_permission_type = $2,
          auto_sync_custom_group_id = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING auto_sync_permission_type, auto_sync_custom_group_id
    `;
    
    const result = await pool.query(query, [userId, permissionType, customGroupId]);
    return result.rows[0] || null;
  }

  /**
   * Check if users are friends with the current user
   */
  static async validateFriendships(currentUserId, userIds) {
    if (userIds.length === 0) return { valid: true, validIds: [], invalidIds: [] };
    
    // Check if users exist
    const userExistsQuery = 'SELECT id FROM users WHERE id = ANY($1)';
    const userExistsResult = await pool.query(userExistsQuery, [userIds]);
    const existingUserIds = userExistsResult.rows.map(row => row.id);
    
    // Check which users are friends with current user
    const friendshipQuery = `
      SELECT 
        CASE 
          WHEN requester_id = $1 THEN addressee_id
          WHEN addressee_id = $1 THEN requester_id
        END as friend_id
      FROM friendships 
      WHERE ((requester_id = $1 AND addressee_id = ANY($2)) OR (addressee_id = $1 AND requester_id = ANY($2)))
      AND status = 'accepted'
    `;
    const friendshipResult = await pool.query(friendshipQuery, [currentUserId, userIds]);
    const friendIds = friendshipResult.rows.map(row => row.friend_id);
    
    const nonExistentIds = userIds.filter(id => !existingUserIds.includes(id));
    const nonFriendIds = existingUserIds.filter(id => !friendIds.includes(id));
    
    return {
      valid: nonExistentIds.length === 0 && nonFriendIds.length === 0,
      validIds: friendIds,
      invalidIds: [...nonExistentIds, ...nonFriendIds],
      nonExistentIds,
      nonFriendIds
    };
  }
}

module.exports = PermissionModel; 