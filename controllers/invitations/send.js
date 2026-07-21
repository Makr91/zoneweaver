import db from '../../models/index.js';
import MailController from '../MailController.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, organization: OrganizationModel, invitation: InvitationModel } = db;

/**
 * @swagger
 * /api/invitations/send:
 *   post:
 *     summary: Send invitation email (Admin only)
 *     description: Send an invitation email to join an organization. Admins can only invite to their own organization.
 *     tags: [Invitations]
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
 *               organizationId:
 *                 type: integer
 *                 description: Organization ID (super-admin only, admins use their own org)
 *                 example: 2
 *     responses:
 *       200:
 *         description: Invitation sent successfully
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
 *                   example: "Invitation sent successfully to newuser@example.com"
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
 *                   message: "Email is required"
 *               invalidEmail:
 *                 summary: Invalid email format
 *                 value:
 *                   success: false
 *                   message: "Invalid email format"
 *               noOrganization:
 *                 summary: Admin must belong to organization
 *                 value:
 *                   success: false
 *                   message: "Admin user must belong to an organization to send invitations"
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
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists or active invitation exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               userExists:
 *                 summary: User already exists
 *                 value:
 *                   success: false
 *                   message: "A user with this email already exists"
 *               inviteExists:
 *                 summary: Active invitation exists
 *                 value:
 *                   success: false
 *                   message: "An active invitation for this email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const sendInvitation = async (req, res) => {
  try {
    const { email, organizationId } = req.body;
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
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

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    let targetOrgId = organizationId;

    if (currentUserRole === 'admin') {
      const currentUser = await UserModel.findByPk(currentUserId);
      if (!currentUser || !currentUser.organization_id) {
        return res.status(400).json({
          success: false,
          message: 'Admin user must belong to an organization to send invitations',
        });
      }
      targetOrgId = currentUser.organization_id;
    } else if (currentUserRole === 'super-admin') {
      if (organizationId) {
        const org = await OrganizationModel.findByPk(organizationId);
        if (!org) {
          return res.status(404).json({
            success: false,
            message: 'Specified organization not found',
          });
        }
      }
    }

    const existingInvitation = await InvitationModel.withScope('pending').findOne({
      where: { email },
    });
    if (existingInvitation) {
      return res.status(409).json({
        success: false,
        message: 'An active invitation for this email already exists',
      });
    }

    const invitation = await InvitationModel.createInvitation({
      organizationId: targetOrgId,
      email,
      invitedByUserId: currentUserId,
      expirationDays: 7,
    });

    let organizationName = 'the system';
    if (targetOrgId) {
      const org = await OrganizationModel.findByPk(targetOrgId);
      organizationName = org?.name || 'the organization';
    }

    await MailController.sendInvitationEmail(invitation);

    return res.json({
      success: true,
      message: `Invitation sent successfully to ${email}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        organizationName,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    log.auth.error('Send invitation error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during invitation sending',
    });
  }
};
