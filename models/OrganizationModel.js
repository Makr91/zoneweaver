import database from './Database.js';

/**
 * Organization model for managing multi-tenant organizations
 */
class OrganizationModel {
  /**
   * Create a new organization
   * @param {Object} orgData - Organization data
   * @param {string} orgData.name - Organization name
   * @param {string} [orgData.description] - Organization description
   * @returns {Promise<Object>} Created organization object
   */
  static async createOrganization({ name, description }) {
    try {
      const db = database.getDb();
      
      // Check if organization already exists
      const existingOrg = await db.get(
        'SELECT id FROM organizations WHERE name = ? COLLATE NOCASE',
        [name]
      );
      
      if (existingOrg) {
        throw new Error('Organization with this name already exists');
      }

      // Insert organization
      const result = await db.run(
        'INSERT INTO organizations (name, description) VALUES (?, ?)',
        [name, description || null]
      );

      // Return created organization
      const newOrg = await db.get(
        'SELECT * FROM organizations WHERE id = ?',
        [result.lastID]
      );

      return newOrg;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Get organization by name (case insensitive)
   * @param {string} name - Organization name
   * @returns {Promise<Object|null>} Organization object or null
   */
  static async getOrganizationByName(name) {
    try {
      const db = database.getDb();
      
      const organization = await db.get(
        'SELECT * FROM organizations WHERE name = ? COLLATE NOCASE AND is_active = 1',
        [name]
      );

      return organization || null;
    } catch (error) {
      console.error('Error getting organization by name:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<Object|null>} Organization object or null
   */
  static async getOrganizationById(orgId) {
    try {
      const db = database.getDb();
      
      const organization = await db.get(
        'SELECT * FROM organizations WHERE id = ? AND is_active = 1',
        [orgId]
      );

      return organization || null;
    } catch (error) {
      console.error('Error getting organization by ID:', error);
      throw error;
    }
  }

  /**
   * Get organization statistics
   * @param {number} organizationId - Organization ID
   * @returns {Promise<Object>} Organization statistics
   */
  static async getOrganizationStats(organizationId) {
    try {
      const db = database.getDb();
      
      const stats = await db.get(
        `SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
          COUNT(CASE WHEN role = 'admin' AND is_active = 1 THEN 1 END) as admin_users
         FROM users 
         WHERE organization_id = ?`,
        [organizationId]
      );

      return stats || { total_users: 0, active_users: 0, admin_users: 0 };
    } catch (error) {
      console.error('Error getting organization stats:', error);
      throw error;
    }
  }

  /**
   * Get all organizations (super-admin only)
   * @returns {Promise<Array>} Array of organization objects with stats
   */
  static async getAllOrganizations() {
    try {
      const db = database.getDb();
      
      const organizations = await db.all(
        `SELECT o.*, 
         COUNT(u.id) as total_users,
         COUNT(CASE WHEN u.is_active = 1 THEN 1 END) as active_users,
         COUNT(CASE WHEN u.role = 'admin' AND u.is_active = 1 THEN 1 END) as admin_users
         FROM organizations o
         LEFT JOIN users u ON o.id = u.organization_id
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      );

      return organizations;
    } catch (error) {
      console.error('Error getting all organizations:', error);
      throw error;
    }
  }

  /**
   * Deactivate organization (soft delete)
   * @param {number} organizationId - Organization ID
   * @returns {Promise<boolean>} Success status
   */
  static async deactivateOrganization(organizationId) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'UPDATE organizations SET is_active = 0 WHERE id = ?',
        [organizationId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deactivating organization:', error);
      throw error;
    }
  }

  /**
   * Delete organization (hard delete) with cascading user deletion
   * @param {number} organizationId - Organization ID
   * @returns {Promise<Object>} Result object with success and message
   */
  static async deleteOrganization(organizationId) {
    try {
      const db = database.getDb();
      
      // Check if organization exists
      const organization = await db.get(
        'SELECT * FROM organizations WHERE id = ?',
        [organizationId]
      );

      if (!organization) {
        return {
          success: false,
          message: 'Organization not found'
        };
      }

      // Get count of users in this organization
      const userCount = await db.get(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = ?',
        [organizationId]
      );

      // Delete all users in this organization first (cascading delete)
      if (userCount.count > 0) {
        console.log(`Deleting ${userCount.count} users from organization ${organization.name} before deleting organization`);
        
        const deleteUsersResult = await db.run(
          'DELETE FROM users WHERE organization_id = ?',
          [organizationId]
        );

        console.log(`Deleted ${deleteUsersResult.changes} users from organization ${organization.name}`);
      }

      // Delete any pending invitations for this organization
      const deleteInvitationsResult = await db.run(
        'DELETE FROM invitations WHERE organization_id = ?',
        [organizationId]
      );

      if (deleteInvitationsResult.changes > 0) {
        console.log(`Deleted ${deleteInvitationsResult.changes} pending invitations for organization ${organization.name}`);
      }

      // Delete the organization
      const result = await db.run(
        'DELETE FROM organizations WHERE id = ?',
        [organizationId]
      );

      if (result.changes > 0) {
        return {
          success: true,
          message: userCount.count > 0 
            ? `Organization deleted successfully. ${userCount.count} users were also removed.`
            : 'Organization deleted successfully'
        };
      } else {
        return {
          success: false,
          message: 'Failed to delete organization'
        };
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      return {
        success: false,
        message: `Error deleting organization: ${error.message}`
      };
    }
  }

  /**
   * Update organization details
   * @param {number} orgId - Organization ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} Success status
   */
  static async updateOrganization(orgId, updates) {
    try {
      const db = database.getDb();
      
      const allowedFields = ['name', 'description'];
      const updateFields = [];
      const updateValues = [];
      
      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push(value);
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateValues.push(orgId);
      
      const result = await db.run(
        `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }
}

export default OrganizationModel;
