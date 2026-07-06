import db from '../models/index.js';
import MailController from './MailController.js';
import jwt from 'jsonwebtoken';
import { config } from '../index.js';
import { log } from '../utils/Logger.js';
import { buildRpLogoutUrl, revokeOidcGrant } from '../auth/oidcLogout.js';

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
 * Authentication controller for Hyperweaver Server user management
 */
class AuthController {
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
   * /api/auth/login:
   *   post:
   *     summary: Authenticate user and get JWT token
   *     description: Login with username/email and password to receive JWT authentication token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *           examples:
   *             withUsername:
   *               summary: Login with username
   *               value:
   *                 identifier: "admin"
   *                 password: "securePassword123"
   *             withEmail:
   *               summary: Login with email
   *               value:
   *                 identifier: "admin@example.com"
   *                 password: "securePassword123"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Missing credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "Username/email and password are required"
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Invalid credentials"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async login(req, res) {
    try {
      const { identifier, password } = req.body;

      // Validation
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username/email and password are required',
        });
      }

      // Authenticate user - find user with password hash
      const user = await UserModel.withScope('withPassword').findByIdentifier(identifier);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const bcrypt = (await import('bcrypt')).default;
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate JWT token. auth_provider (C1) is the user-identity axis, carried as a
      // non-sensitive claim so /api/auth/verify can surface it without a DB round-trip.
      const authProvider = user.auth_provider || 'local';
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_provider: authProvider,
        },
        config.authentication.jwt_secret.value,
        { expiresIn: '24h' }
      );

      // Fresh session id at the login privilege boundary (session-fixation guard).
      // Regeneration also drops any OIDC token stash a previous login left in this browser
      // session — otherwise the new identity could read the previous user's IdP claims.
      if (req.session) {
        await new Promise((resolve, reject) => {
          req.session.regenerate(err => (err ? reject(err) : resolve()));
        });
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
      }

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_provider: authProvider,
          organizationId: user.organization_id,
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      log.auth.error('Login error', {
        error: error.message,
        identifier: req.body.identifier,
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error during login',
      });
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     description: Logout user and destroy session (for session-based auth)
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Logout successful"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async logout(req, res) {
    try {
      const userId = req.user?.userId || req.session?.userId;
      const sessionOidc = req.session?.oidc;
      // Two modes (BoxVault-style toggle): FEDERATED (default) logs out of the IdP too —
      // revokes the OIDC grant + returns the RP-initiated end-session URL, ending SSO everywhere;
      // LOCAL logs out of Hyperweaver only and leaves the STARTcloud SSO session intact for a
      // seamless re-login. Selected by `local` (POST body or ?local=true). The UI wires the toggle.
      const localOnly = req.body?.local === true || req.query?.local === 'true';

      // BOTH modes revoke this user's app JWTs (real SLO — set the revocation cutoff so every
      // token issued before now is rejected next request; session.destroy alone would not, since
      // app-auth is stateless Bearer JWT). This is what actually ends the Hyperweaver session.
      if (userId) {
        try {
          await UserModel.update({ tokens_valid_after: new Date() }, { where: { id: userId } });
        } catch (revokeError) {
          log.auth.warn('Failed to set token revocation cutoff on logout', {
            error: revokeError.message,
            userId,
          });
        }
      }

      // FEDERATED only: best-effort revoke the grant at the provider + build the RP-initiated
      // end-session URL (returned as redirect_url). LOCAL skips both, so the IdP SSO survives.
      // The session's OIDC stash is only acted on when it belongs to THIS user — a shared
      // browser session can hold another account's tokens (JWT user ≠ session OIDC user).
      let redirectUrl = null;
      if (!localOnly && sessionOidc?.provider && sessionOidc.userId === userId) {
        await revokeOidcGrant(sessionOidc);
        redirectUrl = buildRpLogoutUrl(sessionOidc);
      }

      // Destroy the app session (clears req.session.oidc + local session state) in both modes.
      if (req.session) {
        await new Promise(resolve => {
          req.session.destroy(err => {
            if (err) {
              log.auth.error('Session destruction error', { error: err.message });
            }
            resolve();
          });
        });
      }

      return res.json({
        success: true,
        message: localOnly ? 'Logged out of Hyperweaver' : 'Logout successful',
        scope: localOnly ? 'local' : 'federated',
        redirect_url: redirectUrl,
      });
    } catch (error) {
      log.auth.error('Logout error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error during logout',
      });
    }
  }

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

  /**
   * @swagger
   * /api/auth/verify:
   *   get:
   *     summary: Verify JWT token validity
   *     description: Verify if the provided JWT token is valid and get user info
   *     tags: [Authentication]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Token is valid
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 valid:
   *                   type: boolean
   *                   example: true
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Token is invalid or expired
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               noToken:
   *                 summary: No token provided
   *                 value:
   *                   success: false
   *                   message: "No token provided"
   *               invalidToken:
   *                 summary: Invalid token
   *                 value:
   *                   success: false
   *                   message: "Invalid token"
   *               expiredToken:
   *                 summary: Expired token
   *                 value:
   *                   success: false
   *                   message: "Token expired"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided',
        });
      }

      const decoded = jwt.verify(token, config.authentication.jwt_secret.value);

      // Get fresh user data. Deactivated accounts fail verification immediately — their
      // JWTs must not live out the remaining lifetime (mirrors the jwt strategy).
      const user = await UserModel.findByPk(decoded.userId);

      if (!user || user.is_active === false) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - user not found',
        });
      }

      // Real SLO: reject tokens issued before the user's revocation cutoff (set on logout).
      if (
        user.tokens_valid_after &&
        decoded.iat &&
        decoded.iat * 1000 < new Date(user.tokens_valid_after).getTime()
      ) {
        return res.status(401).json({
          success: false,
          message: 'Token revoked',
        });
      }

      return res.json({
        success: true,
        valid: true,
        // C6: always deliver the aggregate-root label post-login (toggle-independent), so the
        // UI has the real name even when public_datacenter_label suppresses it pre-auth.
        datacenter_label: config.branding?.datacenter_label?.value || 'Hyperweaver',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          // C1: prefer the JWT's specific value (e.g. `oidc-<name>`); fall back to the user's
          // stored base provider for pre-existing tokens minted before this claim existed.
          auth_provider: decoded.auth_provider || user.auth_provider || 'local',
        },
      });
    } catch (error) {
      log.auth.error('Token verification error', {
        error: error.message,
        errorName: error.name,
      });

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
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

  /**
   * @swagger
   * /api/auth/methods:
   *   get:
   *     summary: Get available authentication methods (Public)
   *     description: Retrieve list of enabled authentication methods for the login form
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Authentication methods retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 methods:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: Method identifier
   *                         example: "ldap"
   *                       name:
   *                         type: string
   *                         description: Human-readable method name
   *                         example: "LDAP - somedomain.com"
   *                       enabled:
   *                         type: boolean
   *                         description: Whether method is enabled
   *                         example: true
   *                   example:
   *                     - id: "local"
   *                       name: "Local Account"
   *                       enabled: true
   *                     - id: "ldap"
   *                       name: "LDAP - somedomain.com"
   *                       enabled: true
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static getAuthMethods(req, res) {
    try {
      void req;
      const methods = [];

      // Local authentication - always available
      if (config.authentication?.local_enabled?.value !== false) {
        methods.push({
          id: 'local',
          name: 'Local Account',
          enabled: true,
        });
      }

      // LDAP authentication
      if (config.authentication?.ldap_enabled?.value === true) {
        // Extract domain from LDAP URL for display
        let ldapDisplayName = 'LDAP Directory';
        try {
          const ldapUrl = config.authentication.ldap_url?.value;
          if (ldapUrl) {
            // Extract hostname from LDAP URL
            const urlMatch = ldapUrl.match(/^ldaps?:\/\/(?<host>[^:/]+)/i);
            if (urlMatch) {
              const { host: hostname } = urlMatch.groups;
              // Extract domain (remove subdomain if present)
              const domainParts = hostname.split('.');
              if (domainParts.length >= 2) {
                // Get last two parts for domain
                const domain = domainParts.slice(-2).join('.');
                ldapDisplayName = `LDAP - ${domain}`;
              } else {
                ldapDisplayName = `LDAP - ${hostname}`;
              }
            }
          }
        } catch (error) {
          log.auth.error('Error parsing LDAP URL for display name', { error: error.message });
          // Fall back to generic name
        }

        methods.push({
          id: 'ldap',
          name: ldapDisplayName,
          enabled: true,
        });
      }

      // OIDC providers
      try {
        const oidcProvidersConfig = config.authentication?.oidc_providers?.value || {};

        Object.entries(oidcProvidersConfig).forEach(([providerName, providerConfig]) => {
          if (providerConfig.enabled?.value && providerConfig.display_name?.value) {
            methods.push({
              id: `oidc-${providerName}`,
              name: providerConfig.display_name.value,
              enabled: true,
            });
          }
        });
      } catch (error) {
        log.auth.error('Error processing OIDC providers for auth methods', {
          error: error.message,
        });
      }

      res.json({
        success: true,
        methods,
        // Whether the local self-service /register form should be shown. When false, the UI
        // routes "Register" to the identity provider (?register → prompt=create). Defaults true.
        local_registration_enabled:
          config.authentication?.local_registration_enabled?.value !== false,
      });
    } catch (error) {
      log.auth.error('Get auth methods error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

export default AuthController;