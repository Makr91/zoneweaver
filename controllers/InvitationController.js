import db from '../models/index.js';
import MailController from './MailController.js';
import { log } from '../utils/Logger.js';

const { user: UserModel, organization: OrganizationModel, invitation: InvitationModel } = db;

class InvitationController {
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
  static async sendInvitation(req, res) {
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

      // Email validation (ReDoS-safe with input length limit)
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

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists',
        });
      }

      // Determine target organization
      let targetOrgId = organizationId;

      if (currentUserRole === 'admin') {
        // Admins can only invite to their own organization
        const currentUser = await UserModel.findByPk(currentUserId);
        if (!currentUser || !currentUser.organization_id) {
          return res.status(400).json({
            success: false,
            message: 'Admin user must belong to an organization to send invitations',
          });
        }
        targetOrgId = currentUser.organization_id;
      } else if (currentUserRole === 'super-admin') {
        // Super-admins can specify organization or leave null for system-level invitation
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

      // Check for existing active invitation
      const existingInvitation = await InvitationModel.withScope('pending').findOne({
        where: { email },
      });
      if (existingInvitation) {
        return res.status(409).json({
          success: false,
          message: 'An active invitation for this email already exists',
        });
      }

      // Create invitation
      const invitation = await InvitationModel.createInvitation({
        organizationId: targetOrgId,
        email,
        invitedByUserId: currentUserId,
        expirationDays: 7,
      });

      // Get organization name for email
      let organizationName = 'the system';
      if (targetOrgId) {
        const org = await OrganizationModel.findByPk(targetOrgId);
        organizationName = org?.name || 'the organization';
      }

      // Send invitation email
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
  }

  /**
   * @swagger
   * /api/invitations/validate/{code}:
   *   get:
   *     summary: Validate invitation code
   *     description: Check if an invitation code is valid and retrieve invitation details (public endpoint)
   *     tags: [Invitations]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Invitation code to validate
   *         example: "inv_abc123def456"
   *     responses:
   *       200:
   *         description: Invitation validation result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               oneOf:
   *                 - type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                       example: true
   *                     invitation:
   *                       type: object
   *                       properties:
   *                         email:
   *                           type: string
   *                           example: "invited@example.com"
   *                         organizationId:
   *                           type: integer
   *                           example: 1
   *                         organizationName:
   *                           type: string
   *                           example: "Acme Corporation"
   *                 - type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                       example: false
   *                     message:
   *                       type: string
   *                       example: "Invalid or expired invitation code"
   *       400:
   *         description: Missing invitation code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "Invitation code is required"
   *       404:
   *         description: Invalid or expired invitation code
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Invalid or expired invitation code"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async validateInvitation(req, res) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Invitation code is required',
        });
      }

      const validation = await InvitationModel.validateCode(code);

      if (!validation.valid) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired invitation code',
        });
      }

      const { invitation } = validation;

      return res.json({
        success: true,
        invitation: {
          email: invitation.email,
          organizationId: invitation.organizationId,
          organizationName: invitation.organizationName,
        },
      });
    } catch (error) {
      log.auth.error('Validate invitation error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error during invitation validation',
      });
    }
  }

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
  static async createInvitation(req, res) {
    try {
      const { email, expirationDays = 7 } = req.body;
      const currentUser = req.user;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required',
        });
      }

      // Email validation (ReDoS-safe with input length limit)
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

      // Get current user's organization
      const user = await UserModel.findByPk(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to send invitations',
        });
      }

      const organizationId = user.organization_id;

      // Create invitation
      const invitation = await InvitationModel.createInvitation({
        organizationId,
        email,
        invitedByUserId: currentUser.userId,
        expirationDays: parseInt(expirationDays),
      });

      // Send invitation email
      try {
        const emailResult = await MailController.sendInvitationEmail(invitation);
        if (!emailResult.success) {
          log.mail.error('Failed to send invitation email', { error: emailResult.error });
        }
      } catch (emailError) {
        log.mail.error('Failed to send invitation email', { error: emailError.message });
        // Continue with response even if email fails
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
  }

  /**
   * @swagger
   * /api/invitations:
   *   get:
   *     summary: Get invitations for organization (Admin only)
   *     description: Retrieve all invitations for the current user's organization with filtering options
   *     tags: [Invitation Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: query
   *         name: includePending
   *         required: false
   *         schema:
   *           type: boolean
   *           default: true
   *         description: Include pending invitations
   *         example: true
   *       - in: query
   *         name: includeUsed
   *         required: false
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include used invitations
   *         example: false
   *       - in: query
   *         name: includeExpired
   *         required: false
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include expired invitations
   *         example: false
   *     responses:
   *       200:
   *         description: Invitations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 invitations:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Invitation'
   *       400:
   *         description: Must belong to organization
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "You must belong to an organization to view invitations"
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
  static async getInvitations(req, res) {
    try {
      const {
        includePending = 'true',
        includeUsed = 'false',
        includeExpired = 'false',
      } = req.query;
      const currentUser = req.user;

      // Get current user's organization
      const user = await UserModel.findByPk(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to view invitations',
        });
      }

      const organizationId = user.organization_id;

      const invitations = await InvitationModel.findByOrganization(organizationId, {
        includePending: includePending === 'true',
        includeUsed: includeUsed === 'true',
        includeExpired: includeExpired === 'true',
      });

      return res.json({
        success: true,
        invitations,
      });
    } catch (error) {
      log.auth.error('Get invitations error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

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
  static async resendInvitation(req, res) {
    try {
      const { id } = req.params;
      const { expirationDays = 7 } = req.body;
      const currentUser = req.user;

      // Get current user's organization
      const user = await UserModel.findByPk(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to resend invitations',
        });
      }

      const organizationId = user.organization_id;

      // Find the invitation (scoped to the admin's organization; super-admins may resend any)
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

      // Issue a fresh invite code and expiry
      await invitation.resend(parseInt(expirationDays));

      // Reload with organization + inviter details for the email and response
      const detailed = await InvitationModel.withScope(['all', 'withDetails']).findByPk(
        invitation.id
      );

      // Send invitation email
      try {
        const emailResult = await MailController.sendInvitationEmail(detailed);
        if (!emailResult.success) {
          log.mail.error('Failed to send invitation email', { error: emailResult.error });
        }
      } catch (emailError) {
        log.mail.error('Failed to send invitation email', { error: emailError.message });
        // Continue with response even if email fails
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
  }

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
  static async revokeInvitation(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Get current user's organization
      const user = await UserModel.findByPk(currentUser.userId);
      if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
        return res.status(400).json({
          success: false,
          message: 'You must belong to an organization to revoke invitations',
        });
      }

      const organizationId = user.organization_id;

      // Find the invitation (scoped to the admin's organization; super-admins may revoke any)
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
  }
}

export default InvitationController;
