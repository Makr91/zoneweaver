import express from "express";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import rateLimit from "express-rate-limit";
import AuthController from "../controllers/AuthController.js";
import ServerController from "../controllers/ServerController.js";
import SettingsController from "../controllers/SettingsController.js";
import { authenticate, requireAdmin, requireSuperAdmin, optionalAuth } from "../auth/auth.js";
import { loadConfig } from "../utils/config.js";

const router = express.Router();

// 🛡️ Rate Limiting Configuration (CodeQL Security Fix)
// Configurable tiered approach based on endpoint sensitivity and resource usage

// Load configuration from config.yaml
const config = loadConfig();

// Authentication - Strict (prevent brute force attacks)
const authLimiter = rateLimit({
  windowMs: config.limits?.authentication?.windowMs?.value || 15 * 60 * 1000,
  max: config.limits?.authentication?.max?.value || 25,
  message: { error: config.limits?.authentication?.message?.value || 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations - Moderate (protect admin functions)
const adminLimiter = rateLimit({
  windowMs: config.limits?.admin?.windowMs?.value || 15 * 60 * 1000,
  max: config.limits?.admin?.max?.value || 500,
  message: { error: config.limits?.admin?.message?.value || 'Too many admin requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// External API proxy - Restrictive (protect downstream Zoneweaver servers)
const apiProxyLimiter = rateLimit({
  windowMs: config.limits?.apiProxy?.windowMs?.value || 60 * 1000,
  max: config.limits?.apiProxy?.max?.value || 2000,
  message: { error: config.limits?.apiProxy?.message?.value || 'Too many API proxy requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Real-time operations - Lenient (maintain VNC/terminal functionality)
const realtimeLimiter = rateLimit({
  windowMs: config.limits?.realtime?.windowMs?.value || 60 * 1000,
  max: config.limits?.realtime?.max?.value || 250,
  message: { error: config.limits?.realtime?.message?.value || 'Too many real-time requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard operations - Normal (general purpose)
const standardLimiter = rateLimit({
  windowMs: config.limits?.standard?.windowMs?.value || 15 * 60 * 1000,
  max: config.limits?.standard?.max?.value || 1000,
  message: { error: config.limits?.standard?.message?.value || 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Static file serving - High limit (prevent file system abuse, CodeQL flagged endpoints)
const staticFileLimiter = rateLimit({
  windowMs: config.limits?.staticFiles?.windowMs?.value || 15 * 60 * 1000,
  max: config.limits?.staticFiles?.max?.value || 5000,
  message: { error: config.limits?.staticFiles?.message?.value || 'Too many static file requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication endpoints - Protected with strict rate limiting
router.post("/api/auth/register", authLimiter, AuthController.register);
router.post("/api/auth/login", authLimiter, AuthController.login);
router.post("/api/auth/ldap", authLimiter, AuthController.ldapLogin);
router.post("/api/auth/logout", standardLimiter, AuthController.logout);
router.get("/api/auth/profile", standardLimiter, authenticate, AuthController.getProfile);
router.post("/api/auth/change-password", authLimiter, authenticate, AuthController.changePassword);
router.delete("/api/auth/delete-account", authLimiter, authenticate, AuthController.deleteSelfAccount);
router.get("/api/auth/verify", standardLimiter, AuthController.verifyToken);
router.get("/api/auth/setup-status", standardLimiter, AuthController.checkSetupStatus);
router.get("/api/auth/methods", standardLimiter, AuthController.getAuthMethods);
router.post("/api/auth/ldap/test", adminLimiter, authenticate, requireSuperAdmin, AuthController.testLdap);

/**
 * @swagger
 * /api/profile/{identifier}:
 *   get:
 *     summary: Get Gravatar profile information
 *     description: Retrieve Gravatar profile data for a given email address or username
 *     tags: [Utilities]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address or username to lookup
 *         example: "user@example.com"
 *     responses:
 *       200:
 *         description: Gravatar profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                   description: Gravatar hash for the profile
 *                   example: "abc123def456..."
 *                 display_name:
 *                   type: string
 *                   description: Display name from Gravatar
 *                   example: "John Doe"
 *                 profile_url:
 *                   type: string
 *                   description: Gravatar profile URL
 *                   example: "https://gravatar.com/johndoe"
 *                 avatar_url:
 *                   type: string
 *                   description: Avatar image URL
 *                   example: "https://secure.gravatar.com/avatar/abc123def456"
 *                 avatar_alt_text:
 *                   type: string
 *                   description: Alt text for avatar
 *                   example: "John Doe's avatar"
 *       400:
 *         description: Invalid identifier
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid identifier format"
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile not found"
 *       500:
 *         description: Internal server error or Gravatar API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Gravatar API request failed"
 */
router.get( '/api/profile/:identifier', standardLimiter, async ( req, res ) => {
    const { identifier } = req.params;
 
    try {
        const config = loadConfig();
        const apiKey = config.integrations?.gravatar?.api_key?.value;

        const hash = crypto.createHash( 'sha256' ).update( identifier.trim().toLowerCase() ).digest( 'hex' );
 
        const response = await axios.get( `https://api.gravatar.com/v3/profiles/${ hash }`, {
            headers: {
                Authorization: `Bearer ${ apiKey }`,
            },
        } );
 
        res.json( response.data );
    } catch ( error ) {
        res.status( error.response ? error.response.status : 500 ).json( {
            error: error.message
        } );
    }
} );

// Admin endpoints - Protected with admin rate limiting
router.get("/api/admin/users", adminLimiter, authenticate, requireAdmin, AuthController.getAllUsers);
router.put("/api/admin/users/role", adminLimiter, authenticate, requireAdmin, AuthController.updateUserRole);
router.delete("/api/admin/users/:userId", adminLimiter, authenticate, requireAdmin, AuthController.deactivateUser);
router.put("/api/admin/users/:userId/reactivate", adminLimiter, authenticate, requireAdmin, AuthController.reactivateUser);
router.delete("/api/admin/users/:userId/delete", adminLimiter, authenticate, requireSuperAdmin, AuthController.deleteUser);

// Organization endpoints - Protected with admin rate limiting
router.get("/api/organizations", adminLimiter, authenticate, requireSuperAdmin, AuthController.getAllOrganizations);
router.get("/api/organizations/:id", adminLimiter, authenticate, requireAdmin, AuthController.getOrganization);
router.put("/api/organizations/:id", adminLimiter, authenticate, requireAdmin, AuthController.updateOrganization);
router.get("/api/organizations/:id/users", adminLimiter, authenticate, requireAdmin, AuthController.getOrganizationUsers);
router.get("/api/organizations/:id/stats", adminLimiter, authenticate, requireAdmin, AuthController.getOrganizationStats);
router.get("/api/organizations/check/:name", standardLimiter, AuthController.checkOrganizationExists);
router.put("/api/organizations/:orgId/deactivate", adminLimiter, authenticate, requireSuperAdmin, AuthController.deactivateOrganization);
router.delete("/api/organizations/:orgId", adminLimiter, authenticate, requireSuperAdmin, AuthController.deleteOrganization);

// Invitation endpoints - Protected with admin rate limiting
router.post("/api/invitations/send", adminLimiter, authenticate, requireAdmin, AuthController.sendInvitation);
router.post("/api/invitations", adminLimiter, authenticate, requireAdmin, AuthController.createInvitation);
router.get("/api/invitations", adminLimiter, authenticate, requireAdmin, AuthController.getInvitations);
router.post("/api/invitations/:id/resend", adminLimiter, authenticate, requireAdmin, AuthController.resendInvitation);
router.delete("/api/invitations/:id", adminLimiter, authenticate, requireAdmin, AuthController.revokeInvitation);
router.get("/api/invitations/validate/:code", standardLimiter, AuthController.validateInvitation);

// Server management endpoints - Protected with admin rate limiting
router.post("/api/servers", adminLimiter, authenticate, requireAdmin, ServerController.addServer);
router.get("/api/servers", adminLimiter, authenticate, ServerController.getAllServers);
router.post("/api/servers/test", adminLimiter, authenticate, ServerController.testServer);
router.delete("/api/servers/:serverId", adminLimiter, authenticate, requireAdmin, ServerController.removeServer);

// Zoneweaver API proxy endpoints - Protected with API proxy rate limiting
router.all("/api/zapi/:protocol/:hostname/:port/*splat", apiProxyLimiter, authenticate, ServerController.proxyToZoneweaverAPI);

// Zoneweaver API settings endpoints - Protected with admin rate limiting
router.get("/api/zapi/:protocol/:hostname/:port/settings", adminLimiter, authenticate, requireSuperAdmin, SettingsController.getZoneweaverAPISettings);
router.put("/api/zapi/:protocol/:hostname/:port/settings", adminLimiter, authenticate, requireSuperAdmin, SettingsController.updateZoneweaverAPISettings);
router.get("/api/zapi/:protocol/:hostname/:port/settings/backups", adminLimiter, authenticate, requireSuperAdmin, SettingsController.getZoneweaverAPIBackups);
router.post("/api/zapi/:protocol/:hostname/:port/settings/restore/:filename", adminLimiter, authenticate, requireSuperAdmin, SettingsController.restoreZoneweaverAPIBackup);
router.post("/api/zapi/:protocol/:hostname/:port/server/restart", adminLimiter, authenticate, requireSuperAdmin, SettingsController.restartZoneweaverAPIServer);

// VNC proxy endpoints - Protected with real-time rate limiting
router.all("/api/servers/:serverAddress/zones/:zoneName/vnc/*splat", realtimeLimiter, optionalAuth, ServerController.proxyVncGeneral);

// Zlogin proxy endpoints - Protected with real-time rate limiting
router.post("/api/servers/:serverAddress/zones/:zoneName/zlogin/start", realtimeLimiter, authenticate, ServerController.startZloginSession);
router.get("/api/servers/:serverAddress/zlogin/sessions", realtimeLimiter, authenticate, ServerController.getZloginSessions);
router.get("/api/servers/:serverAddress/zlogin/sessions/:sessionId", realtimeLimiter, authenticate, ServerController.getZloginSession);
router.delete("/api/servers/:serverAddress/zlogin/sessions/:sessionId/stop", realtimeLimiter, authenticate, ServerController.stopZloginSession);

// Terminal proxy endpoints - Protected with real-time rate limiting
router.post("/api/terminal/start", realtimeLimiter, authenticate, ServerController.startTerminalSession);

// Server-specific terminal proxy endpoints - Protected with real-time rate limiting (CodeQL flagged these)
router.post("/api/servers/:serverAddress/terminal/start", realtimeLimiter, authenticate, ServerController.startServerTerminalSession);
router.get("/api/servers/:serverAddress/terminal/sessions", realtimeLimiter, authenticate, ServerController.getServerTerminalSessions);
router.get("/api/servers/:serverAddress/terminal/sessions/:terminalCookie/health", realtimeLimiter, authenticate, ServerController.checkServerTerminalHealth);
router.get("/api/servers/:serverAddress/terminal/sessions/:sessionId", realtimeLimiter, authenticate, ServerController.getServerTerminalSession);
router.delete("/api/servers/:serverAddress/terminal/sessions/:sessionId/stop", realtimeLimiter, authenticate, ServerController.stopServerTerminalSession);

// Settings endpoints - Protected with admin rate limiting
router.get("/api/settings", adminLimiter, authenticate, requireSuperAdmin, SettingsController.getSettings);
router.put("/api/settings", adminLimiter, authenticate, requireSuperAdmin, SettingsController.updateSettings);
router.post("/api/settings/ssl/upload", adminLimiter, authenticate, requireSuperAdmin, SettingsController.uploadSSLFile);
router.post("/api/settings/reset", adminLimiter, authenticate, requireSuperAdmin, SettingsController.resetSettings);
router.post("/api/settings/restart", adminLimiter, authenticate, requireSuperAdmin, SettingsController.restartServer);
router.get("/api/settings/backups", adminLimiter, authenticate, requireSuperAdmin, SettingsController.getBackups);
router.post("/api/settings/restore/:filename", adminLimiter, authenticate, requireSuperAdmin, SettingsController.restoreFromBackup);
router.delete("/api/settings/backups/:filename", adminLimiter, authenticate, requireSuperAdmin, SettingsController.deleteBackup);

// Mail testing endpoint - Protected with admin rate limiting
router.post("/api/mail/test", adminLimiter, authenticate, requireSuperAdmin, AuthController.testMail);

// Serve static files from the Vite app build directory - Protected with static file rate limiting (CodeQL flagged)
router.use('/ui', staticFileLimiter, express.static(path.join(process.cwd(), 'web/dist')));

// Catch all handler: send back Vite's index.html file for client-side routing - Protected with static file rate limiting (CodeQL flagged)
router.get('/ui/*splat', staticFileLimiter, (req, res) => {
  res.sendFile(path.join(process.cwd(), 'web/dist/index.html'));
});

export default router;
