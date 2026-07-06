import db from '../models/index.js';
import { log } from '../utils/Logger.js';

const { user: UserModel, organization: OrganizationModel } = db;

class UserManagementController {
  /**
   * @swagger
   * /api/admin/users:
   *   get:
   *     summary: Get all users (Admin only)
   *     description: Retrieve all users. Super-admin sees all users, admin sees only users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *                 viewScope:
   *                   type: string
   *                   enum: [all, organization]
   *                   description: Scope of users returned
   *                   example: "organization"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async getAllUsers(req, res) {
    try {
      const currentUserId = req.user?.userId;
      const currentUserRole = req.user?.role;

      let users;

      if (currentUserRole === 'super-admin') {
        // Super-admin can see all users
        users = await UserModel.findAll({
          include: [
            {
              association: 'organization',
              attributes: ['id', 'name'],
            },
          ],
          order: [['created_at', 'DESC']],
        });
      } else if (currentUserRole === 'admin') {
        // Admin can only see users in their organization
        const currentUser = await UserModel.findByPk(currentUserId);
        if (!currentUser || !currentUser.organization_id) {
          return res.status(400).json({
            success: false,
            message: 'Admin user must belong to an organization',
          });
        }
        users = await UserModel.findByOrganization(currentUser.organization_id, true); // Include inactive
      } else {
        // Regular users shouldn't have access (but middleware should prevent this)
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      // Transform the data to flatten organization information for frontend compatibility
      const transformedUsers = users.map(user => {
        const userJson = user.toJSON();
        if (userJson.organization) {
          userJson.organization_name = userJson.organization.name;
          userJson.organization_id = userJson.organization.id;
        }
        return userJson;
      });

      return res.json({
        success: true,
        users: transformedUsers,
        viewScope: currentUserRole === 'super-admin' ? 'all' : 'organization',
      });
    } catch (error) {
      log.auth.error('Get all users error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/admin/users/role:
   *   put:
   *     summary: Update user role (Admin only)
   *     description: Change a user's role/permission level. Admins can only modify users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [userId, newRole]
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: ID of the user to update
   *                 example: 5
   *               newRole:
   *                 type: string
   *                 enum: [user, admin, super-admin]
   *                 description: New role to assign
   *                 example: "admin"
   *     responses:
   *       200:
   *         description: User role updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User role updated successfully"
   *       400:
   *         description: Validation error or cannot change own role
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingFields:
   *                 summary: Missing required fields
   *                 value:
   *                   success: false
   *                   message: "User ID and new role are required"
   *               ownRole:
   *                 summary: Cannot change own role
   *                 value:
   *                   success: false
   *                   message: "Cannot change your own role"
   *               invalidRole:
   *                 summary: Invalid role specified
   *                 value:
   *                   success: false
   *                   message: "Invalid role specified"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async updateUserRole(req, res) {
    try {
      const { userId, newRole } = req.body;
      const currentUserId = req.user?.userId || req.session?.userId;

      if (!userId || !newRole) {
        return res.status(400).json({
          success: false,
          message: 'User ID and new role are required',
        });
      }

      // Prevent users from changing their own role
      if (parseInt(userId) === parseInt(currentUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own role',
        });
      }

      // Validate role
      const validRoles = ['user', 'admin', 'super-admin'];
      if (!validRoles.includes(newRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified',
        });
      }

      const [affectedRows] = await UserModel.update(
        { role: newRole },
        { where: { id: userId, is_active: true } }
      );
      const success = affectedRows > 0;

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User role updated successfully',
      });
    } catch (error) {
      log.auth.error('Update user role error', {
        error: error.message,
        userId: req.body.userId,
        newRole: req.body.newRole,
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/admin/users/{userId}:
   *   delete:
   *     summary: Deactivate user (Admin only)
   *     description: Deactivate a user account (soft delete). Admins can only deactivate users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user to deactivate
   *         example: 5
   *     responses:
   *       200:
   *         description: User deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User deactivated successfully"
   *       400:
   *         description: Cannot deactivate own account
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingUserId:
   *                 summary: Missing user ID
   *                 value:
   *                   success: false
   *                   message: "User ID is required"
   *               ownAccount:
   *                 summary: Cannot deactivate own account
   *                 value:
   *                   success: false
   *                   message: "Cannot deactivate your own account"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.userId || req.session?.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      // Prevent users from deactivating themselves
      if (parseInt(userId) === parseInt(currentUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
      }

      // Deactivate AND revoke: setting the token cutoff kills the user's outstanding app
      // JWTs on their next request (admin force-logout) — is_active alone would leave any
      // already-issued token working until the auth layer's inactive check catches it.
      const [affectedRows] = await UserModel.update(
        { is_active: false, tokens_valid_after: new Date() },
        { where: { id: userId, is_active: true } }
      );
      const success = affectedRows > 0;

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      log.auth.error('Deactivate user error', {
        error: error.message,
        userId: req.params.userId,
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/admin/users/{userId}/reactivate:
   *   put:
   *     summary: Reactivate user (Admin only)
   *     description: Reactivate a previously deactivated user account. Admins can only reactivate users in their organization.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user to reactivate
   *         example: 5
   *     responses:
   *       200:
   *         description: User reactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User reactivated successfully"
   *       400:
   *         description: Missing user ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "User ID is required"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async reactivateUser(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const [affectedRows] = await UserModel.update(
        { is_active: true },
        { where: { id: userId, is_active: false } }
      );
      const success = affectedRows > 0;

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User reactivated successfully',
      });
    } catch (error) {
      log.auth.error('Reactivate user error', {
        error: error.message,
        userId: req.params.userId,
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/admin/users/{userId}/delete:
   *   delete:
   *     summary: Permanently delete user (Super-admin only)
   *     description: Permanently delete a user account (hard delete). This action cannot be undone.
   *     tags: [Admin - User Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the user to permanently delete
   *         example: 5
   *     responses:
   *       200:
   *         description: User permanently deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "User permanently deleted successfully"
   *       400:
   *         description: Cannot delete own account or missing user ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingUserId:
   *                 summary: Missing user ID
   *                 value:
   *                   success: false
   *                   message: "User ID is required"
   *               ownAccount:
   *                 summary: Cannot delete own account
   *                 value:
   *                   success: false
   *                   message: "Cannot delete your own account"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Only super administrators can permanently delete users"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "User not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.userId || req.session?.userId;
      const currentUserRole = req.user?.role;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      // Only super-admin can permanently delete users
      if (currentUserRole !== 'super-admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super administrators can permanently delete users',
        });
      }

      // Prevent users from deleting themselves
      if (parseInt(userId) === parseInt(currentUserId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }

      const success = await UserModel.destroy({
        where: { id: userId },
      });

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        message: 'User permanently deleted successfully',
      });
    } catch (error) {
      log.auth.error('Delete user error', {
        error: error.message,
        userId: req.params.userId,
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/auth/delete-account:
   *   delete:
   *     summary: Delete own account (self-deletion)
   *     description: Permanently delete the authenticated user's account with password confirmation
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [password, confirmText]
   *             properties:
   *               password:
   *                 type: string
   *                 description: Current password for verification
   *                 example: "currentPassword123"
   *               confirmText:
   *                 type: string
   *                 description: Must be exactly "DELETE" to confirm deletion
   *                 example: "DELETE"
   *     responses:
   *       200:
   *         description: Account deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Account deleted successfully"
   *                 organizationDeleted:
   *                   type: boolean
   *                   description: Whether user's organization was also deleted (if they were the last member)
   *                   example: false
   *       400:
   *         description: Validation error or cannot delete last super-admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingFields:
   *                 summary: Missing required fields
   *                 value:
   *                   success: false
   *                   message: "Password and confirmation text are required"
   *               wrongConfirm:
   *                 summary: Wrong confirmation text
   *                 value:
   *                   success: false
   *                   message: "Confirmation text must be \"DELETE\""
   *               lastSuperAdmin:
   *                 summary: Cannot delete last super-admin
   *                 value:
   *                   success: false
   *                   message: "Cannot delete the last super administrator account"
   *               invalidPassword:
   *                 summary: Invalid password
   *                 value:
   *                   success: false
   *                   message: "Invalid password"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async deleteSelfAccount(req, res) {
    try {
      const { password, confirmText } = req.body;
      const userId = req.user?.userId || req.session?.userId;
      const currentUser = req.user;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      // Validation
      if (!password || !confirmText) {
        return res.status(400).json({
          success: false,
          message: 'Password and confirmation text are required',
        });
      }

      if (confirmText !== 'DELETE') {
        return res.status(400).json({
          success: false,
          message: 'Confirmation text must be "DELETE"',
        });
      }

      // Verify password (defaultScope hides password_hash, so load it explicitly)
      const user = await UserModel.withScope('withPassword').findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Authenticate with current password
      const bcrypt = (await import('bcrypt')).default;
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password',
        });
      }

      // Super-admins cannot delete themselves if they're the only super-admin
      if (currentUser.role === 'super-admin') {
        const allSuperAdmins = await UserModel.findByRole('super-admin');
        if (allSuperAdmins.length === 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete the last super administrator account',
          });
        }
      }

      // Check if user is the last member of their organization
      let shouldDeleteOrganization = false;
      if (user.organization_id) {
        const orgUsers = await UserModel.findByOrganization(user.organization_id, false); // active users only
        if (orgUsers.length === 1) {
          shouldDeleteOrganization = true;
        }
      }

      // Delete the user
      const deletedCount = await UserModel.destroy({ where: { id: userId } });

      if (!deletedCount) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete account',
        });
      }

      // Delete organization if user was the last member.
      // Use an instance destroy (not a bulk destroy) so the model's beforeDestroy hook
      // fires and cascades to the organization's remaining users and invitations.
      if (shouldDeleteOrganization) {
        try {
          const organization = await OrganizationModel.withScope('withInactive').findByPk(
            user.organization_id
          );
          if (organization) {
            await organization.destroy();
            log.auth.info('Organization deleted as user was the last member', {
              organizationId: user.organization_id,
            });
          }
        } catch (orgError) {
          log.auth.error('Error deleting organization after user deletion', {
            error: orgError.message,
            organizationId: user.organization_id,
          });
          // Don't fail the user deletion if org deletion fails
        }
      }

      // Destroy session
      if (req.session) {
        req.session.destroy(err => {
          if (err) {
            log.auth.error('Session destruction error after account deletion', {
              error: err.message,
            });
          }
        });
      }

      return res.json({
        success: true,
        message: 'Account deleted successfully',
        organizationDeleted: shouldDeleteOrganization,
      });
    } catch (error) {
      log.auth.error('Self-deletion error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error during account deletion',
      });
    }
  }
}

export default UserManagementController;
