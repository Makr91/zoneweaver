import db from '../../models/index.js';
import jwt from 'jsonwebtoken';
import { config } from '../../index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel } = db;

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
/**
 * Verifies the Bearer token against fresh user data: deactivated accounts fail
 * immediately (their JWTs must not live out the remaining lifetime, mirroring the jwt
 * strategy) and tokens issued before the user's revocation cutoff are rejected (real
 * SLO). The aggregate-root label is always delivered post-login (C6,
 * toggle-independent) so the UI has the real name even when public_datacenter_label
 * suppresses it pre-auth. auth_provider prefers the JWT's specific value (C1, e.g.
 * `oidc-<name>`), falling back to the stored base provider for pre-existing tokens.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, config.authentication.jwt_secret.value);

    const user = await UserModel.findByPk(decoded.userId);

    if (!user || user.is_active === false) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found',
      });
    }

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
      datacenter_label: config.branding?.datacenter_label?.value || 'Hyperweaver',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
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
};

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
/**
 * Lists the enabled auth methods for the login form. local_registration_enabled tells
 * the UI whether to show the local self-service /register form; when false, the UI
 * routes "Register" to the identity provider (?register → prompt=create).
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAuthMethods = (req, res) => {
  try {
    void req;
    const methods = [];

    if (config.authentication?.local_enabled?.value !== false) {
      methods.push({
        id: 'local',
        name: 'Local Account',
        enabled: true,
      });
    }

    if (config.authentication?.ldap_enabled?.value === true) {
      let ldapDisplayName = 'LDAP Directory';
      try {
        const ldapUrl = config.authentication.ldap_url?.value;
        if (ldapUrl) {
          const urlMatch = ldapUrl.match(/^ldaps?:\/\/(?<host>[^:/]+)/i);
          if (urlMatch) {
            const { host: hostname } = urlMatch.groups;
            const domainParts = hostname.split('.');
            if (domainParts.length >= 2) {
              const domain = domainParts.slice(-2).join('.');
              ldapDisplayName = `LDAP - ${domain}`;
            } else {
              ldapDisplayName = `LDAP - ${hostname}`;
            }
          }
        }
      } catch (error) {
        log.auth.error('Error parsing LDAP URL for display name', { error: error.message });
      }

      methods.push({
        id: 'ldap',
        name: ldapDisplayName,
        enabled: true,
      });
    }

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
};
