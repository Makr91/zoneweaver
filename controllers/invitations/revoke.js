import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, invitation: InvitationModel } = db;

/**
 * @swagger
 * /api/invitations/{id}:
 *   delete:
 *     summary: Revoke invitation (Admin only)
 *     description: Revoke an existing invitation, preventing it from being used
 *     tags: [Invitation Management]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invitation ID to revoke
 *         example: 15
 *     responses:
 *       200:
 *         description: Invitation revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Invitation revoked successfully"
 *       400:
 *         description: Must belong to organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "You must belong to an organization to revoke invitations"
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
 *         description: Invitation not found or already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invitation not found or already used"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const revokeInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const user = await UserModel.findByPk(currentUser.userId);
    if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
      return res.status(400).json({
        success: false,
        message: 'You must belong to an organization to revoke invitations',
      });
    }

    const organizationId = user.organization_id;

    const where = { id: parseInt(id) };
    if (currentUser.role !== 'super-admin') {
      where.organization_id = organizationId;
    }
    const invitation = await InvitationModel.withScope('all').findOne({ where });

    if (!invitation || invitation.used_at) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already used',
      });
    }

    await invitation.revoke();

    return res.json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  } catch (error) {
    log.auth.error('Revoke invitation error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
