import db from '../models/index.js';
import jwt from 'jsonwebtoken';
import { config } from '../index.js';
import { log } from '../utils/Logger.js';
import { buildRpLogoutUrl, revokeOidcGrant } from '../auth/oidcLogout.js';

// Access Sequelize models
const { user: UserModel } = db;

/**
 * Authentication controller for Hyperweaver Server user management
 */
class AuthController {
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
