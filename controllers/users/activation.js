import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel } = db;

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
/**
 * Deactivate AND revoke: setting tokens_valid_after kills the user's outstanding app
 * JWTs on their next request (admin force-logout) — is_active alone would leave any
 * already-issued token working until the auth layer's inactive check catches it.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId || req.session?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    if (parseInt(userId) === parseInt(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
      });
    }

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
};

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
export const reactivateUser = async (req, res) => {
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
};
