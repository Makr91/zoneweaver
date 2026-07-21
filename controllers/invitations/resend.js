import db from '../../models/index.js';
import MailController from '../MailController.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, invitation: InvitationModel } = db;

/**
 * @swagger
 * /api/invitations/{id}/resend:
 *   post:
 *     summary: Resend invitation (Admin only)
 *     description: Resend an existing invitation with a new expiration date
 *     tags: [Invitation Management]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invitation ID to resend
 *         example: 15
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expirationDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *                 description: Number of days until invitation expires
 *                 example: 7
 *                 default: 7
 *     responses:
 *       200:
 *         description: Invitation resent successfully
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
 *                   example: "Invitation resent successfully"
 *                 invitation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 15
 *                     email:
 *                       type: string
 *                       example: "newuser@example.com"
 *                     organizationName:
 *                       type: string
 *                       example: "Acme Corporation"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-11T17:18:00.324Z"
 *                     invitedBy:
 *                       type: string
 *                       example: "admin"
 *       400:
 *         description: Must belong to organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "You must belong to an organization to resend invitations"
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
export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { expirationDays = 7 } = req.body;
    const currentUser = req.user;

    const user = await UserModel.findByPk(currentUser.userId);
    if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
      return res.status(400).json({
        success: false,
        message: 'You must belong to an organization to resend invitations',
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

    await invitation.resend(parseInt(expirationDays));

    const detailed = await InvitationModel.withScope(['all', 'withDetails']).findByPk(
      invitation.id
    );

    try {
      const emailResult = await MailController.sendInvitationEmail(detailed);
      if (!emailResult.success) {
        log.mail.error('Failed to send invitation email', { error: emailResult.error });
      }
    } catch (emailError) {
      log.mail.error('Failed to send invitation email', { error: emailError.message });
    }

    return res.json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: {
        id: detailed.id,
        email: detailed.email,
        organizationName: detailed.organization?.name || null,
        expiresAt: detailed.expires_at,
        invitedBy: detailed.invitedBy?.username || null,
      },
    });
  } catch (error) {
    log.auth.error('Resend invitation error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
