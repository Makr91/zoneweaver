import db from '../models/index.js';
import { log } from '../utils/Logger.js';

// Access Sequelize models
const { user: UserModel } = db;

/**
 * Self-service account endpoints (profile, password) for authenticated users
 */
class AccountController {
  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     description: Retrieve the authenticated user's profile information
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Not authenticated"
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
  static async getProfile(req, res) {
    try {
      const userId = req.user?.userId || req.session?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const user = await UserModel.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organizationId: user.organization_id,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      log.auth.error('Get profile error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change user password
   *     description: Change the authenticated user's password
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [currentPassword, newPassword, confirmPassword]
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 description: Current password for verification
   *                 example: "oldPassword123"
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *                 description: New password (minimum 8 characters)
   *                 example: "newSecurePassword456"
   *               confirmPassword:
   *                 type: string
   *                 description: Confirm new password (must match newPassword)
   *                 example: "newSecurePassword456"
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Password changed successfully"
   *       400:
   *         description: Validation error or incorrect current password
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingFields:
   *                 summary: Missing required fields
   *                 value:
   *                   success: false
   *                   message: "All password fields are required"
   *               passwordMismatch:
   *                 summary: New passwords don't match
   *                 value:
   *                   success: false
   *                   message: "New passwords do not match"
   *               incorrectCurrent:
   *                 summary: Incorrect current password
   *                 value:
   *                   success: false
   *                   message: "Current password is incorrect"
   *       401:
   *         description: Not authenticated
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
  static async changePassword(req, res) {
    try {
      const userId = req.user?.userId || req.session?.userId;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'All password fields are required',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New passwords do not match',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
        });
      }

      // Get user with password hash
      const user = await UserModel.withScope('withPassword').findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const bcrypt = (await import('bcrypt')).default;
      const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidCurrentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash and update new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await user.update({ password_hash: newPasswordHash });

      return res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      const userId = req.user?.userId || req.session?.userId;
      log.auth.error('Change password error', {
        error: error.message,
        userId,
      });

      if (error.message.includes('Current password is incorrect')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default AccountController;
