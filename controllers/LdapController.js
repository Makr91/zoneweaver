import jwt from 'jsonwebtoken';
import { config } from '../index.js';
import { log } from '../utils/Logger.js';
import { testLdapConnection } from '../auth/ldapClient.js';

class LdapController {
  /**
   * @swagger
   * /api/auth/ldap:
   *   post:
   *     summary: Authenticate via LDAP
   *     description: Login using LDAP credentials and receive JWT authentication token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, password]
   *             properties:
   *               username:
   *                 type: string
   *                 description: LDAP username (uid)
   *                 example: "jdoe"
   *               password:
   *                 type: string
   *                 description: LDAP password
   *                 example: "ldapPassword123"
   *     responses:
   *       200:
   *         description: LDAP login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         description: Missing credentials or LDAP disabled
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *       401:
   *         description: Invalid LDAP credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Access denied - provisioning policy rejection
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error or LDAP server unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async ldapLogin(req, res) {
    try {
      // Check if LDAP is enabled
      if (!config.authentication?.ldap_enabled?.value) {
        return res.status(400).json({
          success: false,
          message: 'LDAP authentication is not enabled',
        });
      }

      const { username, password } = req.body;

      // Validation
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
        });
      }

      // Use passport to authenticate with LDAP
      const passport = (await import('passport')).default;

      // Wrap passport.authenticate in Promise for async/await
      const authenticatePromise = new Promise((resolve, reject) => {
        passport.authenticate('ldap', { session: false }, (err, user, info) => {
          if (err) {
            reject(err);
          } else if (!user) {
            reject(new Error(info?.message || 'LDAP authentication failed'));
          } else {
            resolve(user);
          }
        })({ body: { username, password } }, res, () => {});
      });

      const user = await authenticatePromise;

      // Generate JWT token (auth_provider = 'ldap' — the user-identity axis, C1)
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_provider: 'ldap',
        },
        config.authentication.jwt_secret.value,
        { expiresIn: '24h' }
      );

      // Fresh session id at the login privilege boundary (fixation guard); also drops any
      // OIDC token stash a previous login left behind (cross-account guard — same reasoning
      // as the local login path).
      if (req.session) {
        await new Promise((resolve, reject) => {
          req.session.regenerate(err => (err ? reject(err) : resolve()));
        });
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
      }

      log.auth.info('LDAP login successful', {
        username: user.username,
        email: user.email,
        authProvider: 'ldap',
      });

      return res.json({
        success: true,
        message: 'LDAP login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_provider: 'ldap',
          organizationId: user.organization_id,
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      log.auth.error('LDAP login error', { error: error.message });

      // Handle specific LDAP errors
      if (
        error.message.includes('Access denied') ||
        error.message.includes('Invitation required')
      ) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message.includes('LDAP authentication failed') ||
        error.message.includes('Invalid credentials')
      ) {
        return res.status(401).json({
          success: false,
          message: 'Invalid LDAP credentials',
        });
      }

      if (error.message.includes('LDAP server') || error.message.includes('connection')) {
        return res.status(500).json({
          success: false,
          message: 'LDAP server unavailable',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error during LDAP authentication',
      });
    }
  }

  /**
   * @swagger
   * /api/auth/ldap/test:
   *   post:
   *     summary: Test LDAP connection (Super-admin only)
   *     description: Test the LDAP configuration by attempting to connect and authenticate
   *     tags: [Authentication Testing]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               testUsername:
   *                 type: string
   *                 description: Optional test username for authentication test
   *                 example: "testuser"
   *               testPassword:
   *                 type: string
   *                 description: Optional test password for authentication test
   *                 example: "testpass"
   *     responses:
   *       200:
   *         description: LDAP connection test completed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Whether LDAP connection was successful
   *                   example: true
   *                 message:
   *                   type: string
   *                   description: Result message
   *                   example: "LDAP connection successful"
   *                 details:
   *                   type: object
   *                   description: Connection details
   *                   properties:
   *                     connectionTest:
   *                       type: boolean
   *                       description: Whether basic connection succeeded
   *                       example: true
   *                     bindTest:
   *                       type: boolean
   *                       description: Whether bind with service account succeeded
   *                       example: true
   *                     searchTest:
   *                       type: boolean
   *                       description: Whether search test succeeded
   *                       example: true
   *                     authTest:
   *                       type: boolean
   *                       description: Whether user authentication test succeeded (if credentials provided)
   *                       example: true
   *       400:
   *         description: LDAP not enabled or connection failed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "LDAP connection failed"
   *                 error:
   *                   type: string
   *                   description: Detailed error message
   *                   example: "Connection timeout"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
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
  static async testLdap(req, res) {
    try {
      // Check if LDAP is enabled
      if (!config.authentication?.ldap_enabled?.value) {
        return res.status(400).json({
          success: false,
          message: 'LDAP authentication is not enabled',
        });
      }

      log.auth.info('Starting LDAP connection test');

      const { testUsername, testPassword } = req.body || {};
      const testResults = await testLdapConnection({ testUsername, testPassword });

      // Determine overall success
      const overallSuccess =
        testResults.connectionTest && testResults.bindTest && testResults.searchTest;

      let message = 'LDAP connection test completed';
      if (overallSuccess) {
        message = 'LDAP connection successful - all tests passed';
        if (testResults.authTest === true) {
          message += ' (including user authentication)';
        } else if (testResults.authTest === false) {
          message += ' (user authentication failed - check credentials)';
        }
      } else {
        message = 'LDAP connection test failed - check configuration';
      }

      return res.json({
        success: overallSuccess,
        message,
        details: testResults,
      });
    } catch (error) {
      log.auth.error('LDAP test error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'LDAP connection test failed',
        error: error.message,
      });
    }
  }
}

export default LdapController;
