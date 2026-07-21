import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, organization: OrganizationModel } = db;

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
export const deleteUser = async (req, res) => {
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

    if (currentUserRole !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super administrators can permanently delete users',
      });
    }

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
};

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
/**
 * Self-deletion with password confirmation. The organization cleanup uses an INSTANCE
 * destroy (not a bulk destroy) so the model's beforeDestroy hook fires and cascades to
 * the organization's remaining users and invitations.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteSelfAccount = async (req, res) => {
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

    const user = await UserModel.withScope('withPassword').findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const bcrypt = (await import('bcrypt')).default;
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      });
    }

    if (currentUser.role === 'super-admin') {
      const allSuperAdmins = await UserModel.findByRole('super-admin');
      if (allSuperAdmins.length === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last super administrator account',
        });
      }
    }

    let shouldDeleteOrganization = false;
    if (user.organization_id) {
      const orgUsers = await UserModel.findByOrganization(user.organization_id, false);
      if (orgUsers.length === 1) {
        shouldDeleteOrganization = true;
      }
    }

    const deletedCount = await UserModel.destroy({ where: { id: userId } });

    if (!deletedCount) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete account',
      });
    }

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
      }
    }

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
};
