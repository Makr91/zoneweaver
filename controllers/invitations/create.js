import db from '../../models/index.js';
import MailController from '../MailController.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, invitation: InvitationModel } = db;

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Create invitation (Admin only)
 *     description: Create and send an invitation to join the current user's organization
 *     tags: [Invitation Management]
 *     security:
 *       - JwtAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to send invitation to
 *                 example: "newuser@example.com"
 *               expirationDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 30
 *                 description: Number of days until invitation expires
 *                 example: 7
 *                 default: 7
 *     responses:
 *       201:
 *         description: Invitation created and sent successfully
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
 *                   example: "Invitation created and sent successfully"
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
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               missingEmail:
 *                 summary: Missing email
 *                 value:
 *                   success: false
 *                   message: "Email address is required"
 *               invalidEmail:
 *                 summary: Invalid email format
 *                 value:
 *                   success: false
 *                   message: "Invalid email format"
 *               noOrganization:
 *                 summary: Must belong to organization
 *                 value:
 *                   success: false
 *                   message: "You must belong to an organization to send invitations"
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
 *       409:
 *         description: User already exists or is already a member
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
export const createInvitation = async (req, res) => {
  try {
    const { email, expirationDays = 7 } = req.body;
    const currentUser = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    if (email.length > 254) {
      return res.status(400).json({
        success: false,
        message: 'Email address too long',
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const user = await UserModel.findByPk(currentUser.userId);
    if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
      return res.status(400).json({
        success: false,
        message: 'You must belong to an organization to send invitations',
      });
    }

    const organizationId = user.organization_id;

    const invitation = await InvitationModel.createInvitation({
      organizationId,
      email,
      invitedByUserId: currentUser.userId,
      expirationDays: parseInt(expirationDays),
    });

    try {
      const emailResult = await MailController.sendInvitationEmail(invitation);
      if (!emailResult.success) {
        log.mail.error('Failed to send invitation email', { error: emailResult.error });
      }
    } catch (emailError) {
      log.mail.error('Failed to send invitation email', { error: emailError.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation created and sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        organizationName: invitation.organization?.name || null,
        expiresAt: invitation.expires_at,
        invitedBy: invitation.invitedBy?.username || null,
      },
    });
  } catch (error) {
    log.auth.error('Create invitation error', { error: error.message });

    if (error.message.includes('already exists') || error.message.includes('already a member')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
