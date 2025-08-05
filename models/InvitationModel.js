import database from './Database.js';
import crypto from 'crypto';

/**
 * Invitation model for managing organization user invitations
 */
class InvitationModel {
  /**
   * Create a new invitation
   * @param {Object} inviteData - Invitation data
   * @param {number} inviteData.organizationId - Organization ID
   * @param {string} inviteData.email - Email address to invite
   * @param {number} inviteData.invitedByUserId - User ID who sent the invitation
   * @param {number} [inviteData.expirationDays=7] - Days until expiration
   * @returns {Promise<Object>} Created invitation object
   */
  static async createInvitation({ organizationId, email, invitedByUserId, expirationDays = 7 }) {
    try {
      const db = database.getDb();
      
      // Check if user already exists with this email
      const existingUser = await db.get(
        'SELECT id, organization_id FROM users WHERE email = ? AND is_active = 1',
        [email]
      );
      
      if (existingUser) {
        if (existingUser.organization_id === organizationId) {
          throw new Error('User with this email is already a member of this organization');
        } else {
          throw new Error('User with this email already exists in another organization');
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await db.get(
        'SELECT id FROM invitations WHERE organization_id = ? AND email = ? AND used_at IS NULL AND expires_at > datetime("now")',
        [organizationId, email]
      );
      
      if (existingInvitation) {
        throw new Error('A pending invitation already exists for this email address');
      }

      // Generate unique invite code
      const inviteCode = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Insert invitation
      const result = await db.run(
        'INSERT INTO invitations (organization_id, email, invite_code, invited_by_user_id, expires_at) VALUES (?, ?, ?, ?, ?)',
        [organizationId, email, inviteCode, invitedByUserId, expiresAt.toISOString()]
      );

      // Return created invitation with organization info
      const newInvitation = await db.get(
        `SELECT i.*, o.name as organization_name, u.username as invited_by_username, u.email as invited_by_email
         FROM invitations i
         JOIN organizations o ON i.organization_id = o.id
         JOIN users u ON i.invited_by_user_id = u.id
         WHERE i.id = ?`,
        [result.lastID]
      );

      return newInvitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  /**
   * Get invitation by invite code
   * @param {string} inviteCode - Invitation code
   * @returns {Promise<Object|null>} Invitation object or null
   */
  static async getInvitationByCode(inviteCode) {
    try {
      const db = database.getDb();
      
      const invitation = await db.get(
        `SELECT i.*, o.name as organization_name, o.description as organization_description
         FROM invitations i
         JOIN organizations o ON i.organization_id = o.id
         WHERE i.invite_code = ? AND o.is_active = 1`,
        [inviteCode]
      );

      return invitation || null;
    } catch (error) {
      console.error('Error getting invitation by code:', error);
      throw error;
    }
  }

  /**
   * Validate an invitation code
   * @param {string} inviteCode - Invitation code
   * @returns {Promise<Object>} Validation result
   */
  static async validateInvitationCode(inviteCode) {
    try {
      const invitation = await this.getInvitationByCode(inviteCode);
      
      if (!invitation) {
        return {
          valid: false,
          reason: 'Invalid invitation code'
        };
      }

      if (invitation.used_at) {
        return {
          valid: false,
          reason: 'Invitation has already been used'
        };
      }

      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      
      if (now > expiresAt) {
        return {
          valid: false,
          reason: 'Invitation has expired'
        };
      }

      return {
        valid: true,
        invitation: {
          id: invitation.id,
          organizationId: invitation.organization_id,
          organizationName: invitation.organization_name,
          organizationDescription: invitation.organization_description,
          email: invitation.email,
          expiresAt: invitation.expires_at
        }
      };
    } catch (error) {
      console.error('Error validating invitation code:', error);
      throw error;
    }
  }

  /**
   * Mark invitation as used
   * @param {string} inviteCode - Invitation code
   * @param {number} userId - User ID who used the invitation
   * @returns {Promise<boolean>} Success status
   */
  static async markInvitationAsUsed(inviteCode, userId) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'UPDATE invitations SET used_at = datetime("now") WHERE invite_code = ? AND used_at IS NULL',
        [inviteCode]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      throw error;
    }
  }

  /**
   * Get invitations for an organization
   * @param {number} organizationId - Organization ID
   * @param {boolean} [includePending=true] - Include pending invitations
   * @param {boolean} [includeUsed=false] - Include used invitations
   * @param {boolean} [includeExpired=false] - Include expired invitations
   * @returns {Promise<Array>} Array of invitation objects
   */
  static async getOrganizationInvitations(organizationId, includePending = true, includeUsed = false, includeExpired = false) {
    try {
      const db = database.getDb();
      
      let whereConditions = ['i.organization_id = ?'];
      const params = [organizationId];
      
      // Build filters
      const statusFilters = [];
      
      if (includePending) {
        statusFilters.push('(i.used_at IS NULL AND i.expires_at > datetime("now"))');
      }
      
      if (includeUsed) {
        statusFilters.push('(i.used_at IS NOT NULL)');
      }
      
      if (includeExpired) {
        statusFilters.push('(i.used_at IS NULL AND i.expires_at <= datetime("now"))');
      }
      
      if (statusFilters.length > 0) {
        whereConditions.push(`(${statusFilters.join(' OR ')})`);
      }
      
      const invitations = await db.all(
        `SELECT i.*, 
         u.username as invited_by_username,
         u.email as invited_by_email,
         CASE 
           WHEN i.used_at IS NOT NULL THEN 'used'
           WHEN i.expires_at <= datetime("now") THEN 'expired'
           ELSE 'pending'
         END as status
         FROM invitations i
         JOIN users u ON i.invited_by_user_id = u.id
         WHERE ${whereConditions.join(' AND ')}
         ORDER BY i.created_at DESC`,
        params
      );

      return invitations;
    } catch (error) {
      console.error('Error getting organization invitations:', error);
      throw error;
    }
  }

  /**
   * Revoke an invitation (mark as expired)
   * @param {number} invitationId - Invitation ID
   * @param {number} organizationId - Organization ID (for security)
   * @returns {Promise<boolean>} Success status
   */
  static async revokeInvitation(invitationId, organizationId) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'UPDATE invitations SET expires_at = datetime("now") WHERE id = ? AND organization_id = ? AND used_at IS NULL',
        [invitationId, organizationId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error revoking invitation:', error);
      throw error;
    }
  }

  /**
   * Clean up expired invitations (optional maintenance task)
   * @param {number} [olderThanDays=30] - Delete invitations older than this many days
   * @returns {Promise<number>} Number of invitations cleaned up
   */
  static async cleanupExpiredInvitations(olderThanDays = 30) {
    try {
      const db = database.getDb();
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const result = await db.run(
        'DELETE FROM invitations WHERE expires_at < ? AND used_at IS NULL',
        [cutoffDate.toISOString()]
      );

      if (result.changes > 0) {
        console.log(`Cleaned up ${result.changes} expired invitations`);
      }

      return result.changes;
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
      throw error;
    }
  }

  /**
   * Get invitation statistics for an organization
   * @param {number} organizationId - Organization ID
   * @returns {Promise<Object>} Invitation statistics
   */
  static async getInvitationStats(organizationId) {
    try {
      const db = database.getDb();
      
      const stats = await db.get(
        `SELECT 
           COUNT(*) as total_invitations,
           COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as used_invitations,
           COUNT(CASE WHEN used_at IS NULL AND expires_at > datetime("now") THEN 1 END) as pending_invitations,
           COUNT(CASE WHEN used_at IS NULL AND expires_at <= datetime("now") THEN 1 END) as expired_invitations
         FROM invitations 
         WHERE organization_id = ?`,
        [organizationId]
      );

      return stats;
    } catch (error) {
      console.error('Error getting invitation stats:', error);
      throw error;
    }
  }

  /**
   * Resend invitation (extend expiration)
   * @param {number} invitationId - Invitation ID
   * @param {number} organizationId - Organization ID (for security)
   * @param {number} [expirationDays=7] - Days until expiration
   * @returns {Promise<Object|null>} Updated invitation or null
   */
  static async resendInvitation(invitationId, organizationId, expirationDays = 7) {
    try {
      const db = database.getDb();
      
      // Check if invitation exists and is not used
      const invitation = await db.get(
        'SELECT * FROM invitations WHERE id = ? AND organization_id = ? AND used_at IS NULL',
        [invitationId, organizationId]
      );
      
      if (!invitation) {
        return null;
      }

      // Generate new invite code and extend expiration
      const newInviteCode = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const result = await db.run(
        'UPDATE invitations SET invite_code = ?, expires_at = ? WHERE id = ?',
        [newInviteCode, expiresAt.toISOString(), invitationId]
      );

      if (result.changes > 0) {
        // Return updated invitation with organization info
        const updatedInvitation = await db.get(
          `SELECT i.*, o.name as organization_name, u.username as invited_by_username, u.email as invited_by_email
           FROM invitations i
           JOIN organizations o ON i.organization_id = o.id
           JOIN users u ON i.invited_by_user_id = u.id
           WHERE i.id = ?`,
          [invitationId]
        );

        return updatedInvitation;
      }

      return null;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }
}

export default InvitationModel;
