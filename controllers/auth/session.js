import db from '../../models/index.js';
import jwt from 'jsonwebtoken';
import { config } from '../../index.js';
import { log } from '../../utils/Logger.js';
import { buildRpLogoutUrl, revokeOidcGrant } from '../../auth/oidcLogout.js';

const { user: UserModel } = db;

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
/**
 * Local login. auth_provider (C1) is the user-identity axis, carried as a non-sensitive
 * JWT claim so /api/auth/verify can surface it without a DB round-trip. The session id is
 * regenerated at the login privilege boundary (session-fixation guard) — regeneration also
 * drops any OIDC token stash a previous login left in this browser session, otherwise the
 * new identity could read the previous user's IdP claims.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required',
      });
    }

    const user = await UserModel.withScope('withPassword').findByIdentifier(identifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const bcrypt = (await import('bcrypt')).default;
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await user.update({ last_login: new Date() });

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
};

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
/**
 * Two modes (BoxVault-style toggle): FEDERATED (default) logs out of the IdP too —
 * revokes the OIDC grant + returns the RP-initiated end-session URL, ending SSO
 * everywhere; LOCAL (`local` in POST body or ?local=true) logs out of Hyperweaver only
 * and leaves the IdP SSO session intact for a seamless re-login. BOTH modes revoke this
 * user's app JWTs (real SLO — the revocation cutoff rejects every token issued before
 * now; session.destroy alone would not, since app-auth is stateless Bearer JWT). The
 * session's OIDC stash is only acted on when it belongs to THIS user — a shared browser
 * session can hold another account's tokens.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    const userId = req.user?.userId || req.session?.userId;
    const sessionOidc = req.session?.oidc;
    const localOnly = req.body?.local === true || req.query?.local === 'true';

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

    let redirectUrl = null;
    if (!localOnly && sessionOidc?.provider && sessionOidc.userId === userId) {
      await revokeOidcGrant(sessionOidc);
      redirectUrl = buildRpLogoutUrl(sessionOidc);
    }

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
};
