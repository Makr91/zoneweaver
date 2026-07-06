import db from '../models/index.js';
import MailController from './MailController.js';
import { config } from '../index.js';
import { log } from '../utils/Logger.js';

// Access Sequelize models
const { user: UserModel, organization: OrganizationModel, invitation: InvitationModel } = db;

/**
 * Resolve organization context for registration.
 * Determines the organization, role, and any validation errors based on
 * whether this is the first user, an invite-based registration, or a new org creation.
 * @returns {{ organizationId: number|null, userRole: string, organization: object|null, error: { status: number, message: string }|null }}
 */
const resolveRegistrationOrganization = async (
  isFirstUser,
  inviteCode,
  organizationName,
  email,
  username
) => {
  if (isFirstUser) {
    log.auth.info('Creating first user as super-admin');

    const organization = await OrganizationModel.create({
      name: 'Default Organization',
      description: 'Auto-created organization for system administrators',
    });

    log.auth.info('Created Default Organization for super admin');
    return { organizationId: organization.id, userRole: 'super-admin', organization, error: null };
  }

  if (inviteCode) {
    log.auth.debug('Processing registration with invite code');

    const inviteValidation = await InvitationModel.validateCode(inviteCode);

    if (!inviteValidation.valid) {
      return {
        organizationId: null,
        userRole: 'user',
        organization: null,
        error: { status: 400, message: inviteValidation.reason },
      };
    }

    if (inviteValidation.invitation.email.toLowerCase() !== email.toLowerCase()) {
      return {
        organizationId: null,
        userRole: 'user',
        organization: null,
        error: { status: 400, message: 'This invitation is for a different email address' },
      };
    }

    const orgId = inviteValidation.invitation.organization_id;
    const organization = await OrganizationModel.findByPk(orgId);

    if (!organization) {
      return {
        organizationId: null,
        userRole: 'user',
        organization: null,
        error: { status: 400, message: 'Invalid organization in invitation' },
      };
    }

    return { organizationId: orgId, userRole: 'user', organization, error: null };
  }

  if (organizationName) {
    log.auth.debug('Processing registration with organization name', { organizationName });

    const existingOrg = await OrganizationModel.findByName(organizationName);

    if (existingOrg) {
      return {
        organizationId: null,
        userRole: 'user',
        organization: null,
        error: {
          status: 400,
          message: 'This organization already exists. You need an invitation to join it.',
        },
      };
    }

    if (!config.authentication?.local_allow_new_organizations?.value) {
      return {
        organizationId: null,
        userRole: 'user',
        organization: null,
        error: {
          status: 403,
          message:
            'New organization registration is currently disabled. Please contact an administrator or join with an invitation code.',
        },
      };
    }

    const existingUserByEmail = await UserModel.findByEmail(email);
    const existingUserByUsername = await UserModel.findByUsername(username);

    if (existingUserByEmail || existingUserByUsername) {
      return {
        organizationId: null,
        userRole: 'user',
        organization: null,
        error: { status: 409, message: 'User with this username or email already exists' },
      };
    }

    log.auth.info('Creating new organization', { organizationName });

    const organization = await OrganizationModel.create({
      name: organizationName,
      description: `Organization created by ${username}`,
    });

    return { organizationId: organization.id, userRole: 'admin', organization, error: null };
  }

  return {
    organizationId: null,
    userRole: 'user',
    organization: null,
    error: {
      status: 400,
      message: 'Organization name or invitation code is required for registration',
    },
  };
};

/**
 * User registration and first-run setup for Hyperweaver Server
 */
class RegistrationController {
  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account with organization support. First user becomes super-admin.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterRequest'
   *           examples:
   *             firstUser:
   *               summary: First user (becomes super-admin)
   *               value:
   *                 username: "admin"
   *                 email: "admin@example.com"
   *                 password: "securePassword123"
   *                 confirmPassword: "securePassword123"
   *                 organizationName: "Default Organization"
   *             withInvite:
   *               summary: User with invitation code
   *               value:
   *                 username: "john_doe"
   *                 email: "john@example.com"
   *                 password: "securePassword123"
   *                 confirmPassword: "securePassword123"
   *                 inviteCode: "inv_abc123def456"
   *             newOrg:
   *               summary: User creating new organization
   *               value:
   *                 username: "jane_admin"
   *                 email: "jane@company.com"
   *                 password: "securePassword123"
   *                 confirmPassword: "securePassword123"
   *                 organizationName: "Jane's Company"
   *     responses:
   *       201:
   *         description: User registered successfully
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
   *                   example: "User registered successfully in organization: Acme Corp"
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *       409:
   *         description: User already exists
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
  static async register(req, res) {
    try {
      const { username, email, password, confirmPassword, organizationName, inviteCode } = req.body;

      // Basic validation
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, password, and confirm password are required',
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
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

      // Check if this is the first user (super-admin)
      const isFirstUser = await UserModel.isFirstUser();

      // Local self-service registration gate. When local_registration_enabled is explicitly
      // false, refuse the local /register path so users register through the identity provider
      // instead (the UI routes "Register" to ?register → prompt=create). Exempt: the first-user
      // (super-admin) bootstrap, and INVITED registrations — the gate targets self-service
      // signups only, and a bogus inviteCode still fails invite validation downstream (400).
      if (
        !isFirstUser &&
        !inviteCode &&
        config.authentication?.local_registration_enabled?.value === false
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Local registration is disabled. Please register through your identity provider.',
        });
      }

      // Resolve organization context for registration
      const orgResult = await resolveRegistrationOrganization(
        isFirstUser,
        inviteCode,
        organizationName,
        email,
        username
      );

      if (orgResult.error) {
        return res.status(orgResult.error.status).json({
          success: false,
          message: orgResult.error.message,
        });
      }

      const { organizationId, userRole, organization } = orgResult;

      // Create the user
      log.auth.info('Creating user with organization', { organizationId });

      // Hash password before creating user
      const bcrypt = (await import('bcrypt')).default;
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const newUser = await UserModel.create({
        username,
        email,
        password_hash,
        role: userRole,
        organization_id: organizationId,
      });

      // Mark invitation as used if applicable
      if (inviteCode) {
        const invitation = await InvitationModel.findByCode(inviteCode);
        if (invitation) {
          await invitation.markAsUsed();
          log.auth.debug('Marked invitation as used');
        }
      }

      // Send welcome email (optional - don't fail registration if email fails).
      // sendWelcomeEmail logs its own success/failure and returns a result object instead
      // of throwing, so inspect the result rather than assuming success.
      try {
        if (organization) {
          const emailResult = await MailController.sendWelcomeEmail(newUser, organization.name);
          if (!emailResult.success) {
            log.mail.error('Failed to send welcome email', {
              error: emailResult.error,
              email: newUser.email,
            });
          }
        }
      } catch (emailError) {
        log.mail.error('Failed to send welcome email', {
          error: emailError.message,
          email: newUser.email,
        });
        // Continue with registration even if email fails
      }

      // Build registration success message
      let registrationMessage = 'User registered successfully';
      if (isFirstUser) {
        registrationMessage = 'Super admin account created successfully';
      } else if (organization) {
        registrationMessage = `User registered successfully in organization: ${organization.name}`;
      }

      // Response
      const response = {
        success: true,
        message: registrationMessage,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          organizationId: newUser.organization_id,
          organizationName: organization?.name || null,
        },
      };

      if (inviteCode) {
        response.message += ' (invitation accepted)';
      }

      return res.status(201).json(response);
    } catch (error) {
      log.auth.error('Registration error', {
        error: error.message,
        username: req.body.username,
        email: req.body.email,
      });

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * @swagger
   * /api/auth/setup-status:
   *   get:
   *     summary: Check if system needs initial setup
   *     description: Check if the system has been initialized with the first user (super-admin)
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Setup status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 needsSetup:
   *                   type: boolean
   *                   description: Whether system needs initial setup (first user)
   *                   example: false
   *                 userCount:
   *                   type: integer
   *                   description: Total number of users in the system
   *                   example: 3
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async checkSetupStatus(req, res) {
    try {
      void req;
      const users = await UserModel.findAll();
      const needsSetup = users.length === 0;

      res.json({
        success: true,
        needsSetup,
        userCount: users.length,
      });
    } catch (error) {
      log.auth.error('Check setup status error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default RegistrationController;
