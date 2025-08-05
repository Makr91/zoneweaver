import express from "express";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import fs from "fs";
import YAML from "yaml";
import AuthController from "../controllers/AuthController.js";
import ServerController from "../controllers/ServerController.js";
import SettingsController from "../controllers/SettingsController.js";
import { authenticate, requireAdmin, requireSuperAdmin, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Authentication endpoints
router.post("/api/auth/register", AuthController.register);
router.post("/api/auth/login", AuthController.login);
router.post("/api/auth/logout", AuthController.logout);
router.get("/api/auth/profile", authenticate, AuthController.getProfile);
router.post("/api/auth/change-password", authenticate, AuthController.changePassword);
router.delete("/api/auth/delete-account", authenticate, AuthController.deleteSelfAccount);
router.get("/api/auth/verify", AuthController.verifyToken);
router.get("/api/auth/setup-status", AuthController.checkSetupStatus);

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
router.get( '/api/profile/:identifier', async ( req, res ) => {
    const { identifier } = req.params;
 
    try {
        const configFile = fs.readFileSync('./config.yaml', 'utf8');
        const config = YAML.parse(configFile);
        const apiKey = config.gravatar.apiKey;

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

// Admin endpoints
router.get("/api/admin/users", authenticate, requireAdmin, AuthController.getAllUsers);
router.put("/api/admin/users/role", authenticate, requireAdmin, AuthController.updateUserRole);
router.delete("/api/admin/users/:userId", authenticate, requireAdmin, AuthController.deactivateUser);
router.put("/api/admin/users/:userId/reactivate", authenticate, requireAdmin, AuthController.reactivateUser);
router.delete("/api/admin/users/:userId/delete", authenticate, requireSuperAdmin, AuthController.deleteUser);

// Organization endpoints (super-admin only)
router.get("/api/organizations", authenticate, requireSuperAdmin, AuthController.getAllOrganizations);
router.put("/api/organizations/:orgId/deactivate", authenticate, requireSuperAdmin, AuthController.deactivateOrganization);
router.delete("/api/organizations/:orgId", authenticate, requireSuperAdmin, AuthController.deleteOrganization);

// Invitation endpoints
router.post("/api/invitations/send", authenticate, requireAdmin, AuthController.sendInvitation);
router.get("/api/invitations/validate/:code", AuthController.validateInvitation);

// Server management endpoints
router.post("/api/servers", authenticate, requireAdmin, ServerController.addServer);
router.get("/api/servers", authenticate, ServerController.getAllServers);
router.post("/api/servers/test", authenticate, ServerController.testServer);
router.delete("/api/servers/:serverId", authenticate, requireAdmin, ServerController.removeServer);

// WebHyve proxy endpoints
router.all("/api/webhyve/:protocol/:hostname/:port/*", authenticate, ServerController.proxyToWebHyve);

// WebHyve settings endpoints
router.get("/api/webhyve/:protocol/:hostname/:port/settings", authenticate, requireSuperAdmin, SettingsController.getWebhyveSettings);
router.put("/api/webhyve/:protocol/:hostname/:port/settings", authenticate, requireSuperAdmin, SettingsController.updateWebhyveSettings);
router.get("/api/webhyve/:protocol/:hostname/:port/settings/backups", authenticate, requireSuperAdmin, SettingsController.getWebhyveBackups);
router.post("/api/webhyve/:protocol/:hostname/:port/settings/restore/:filename", authenticate, requireSuperAdmin, SettingsController.restoreWebhyveBackup);
router.post("/api/webhyve/:protocol/:hostname/:port/server/restart", authenticate, requireSuperAdmin, SettingsController.restartWebhyveServer);

// VNC proxy endpoints (use optional auth for iframe compatibility)
// Specific VNC Console proxy endpoint (must come BEFORE general route)
router.get("/api/servers/:serverAddress/zones/:zoneName/vnc/console", optionalAuth, ServerController.proxyVncConsole);

// General VNC proxy for all VNC-related paths (WebSocket, static assets, etc.)
router.all("/api/servers/:serverAddress/zones/:zoneName/vnc/*", optionalAuth, ServerController.proxyVncGeneral);

// Zlogin proxy endpoints
router.post("/api/servers/:serverAddress/zones/:zoneName/zlogin/start", authenticate, ServerController.startZloginSession);
router.get("/api/servers/:serverAddress/zlogin/sessions", authenticate, ServerController.getZloginSessions);
router.get("/api/servers/:serverAddress/zlogin/sessions/:sessionId", authenticate, ServerController.getZloginSession);
router.delete("/api/servers/:serverAddress/zlogin/sessions/:sessionId/stop", authenticate, ServerController.stopZloginSession);

// Terminal proxy endpoints
router.post("/api/terminal/start", authenticate, ServerController.startTerminalSession);

// Settings endpoints (super-admin only)
router.get("/api/settings", authenticate, requireSuperAdmin, SettingsController.getSettings);
router.put("/api/settings", authenticate, requireSuperAdmin, SettingsController.updateSettings);
router.post("/api/settings/reset", authenticate, requireSuperAdmin, SettingsController.resetSettings);
router.post("/api/settings/restart", authenticate, requireSuperAdmin, SettingsController.restartServer);
router.get("/api/settings/backups", authenticate, requireSuperAdmin, SettingsController.getBackups);

// Serve static files from the Vite app build directory
router.use('/ui', express.static(path.join(process.cwd(), 'web/dist')));

// Catch all handler: send back Vite's index.html file for client-side routing
router.get('/ui/*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'web/dist/index.html'));
});

export default router;
