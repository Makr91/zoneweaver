import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { authenticate, optionalAuth, requireAdmin, requireSuperAdmin } from '../auth/auth.js';
import AuthController from '../controllers/AuthController.js';
import ServerController from '../controllers/ServerController.js';
import SettingsController from '../controllers/SettingsController.js';
import StatusController from '../controllers/StatusController.js';
import * as FavoritesController from '../controllers/FavoritesController.js';
import ConfigController from '../controllers/ConfigController.js';
import { oidcTokenRefresh } from '../auth/oidcTokenRefresh.js';
import { loadConfig } from '../utils/config.js';

const router = express.Router();

// Only Routes should be defined here!

// 🛡️ Rate Limiting Configuration (CodeQL Security Fix)
// Configurable tiered approach based on endpoint sensitivity and resource usage

// Load configuration from config.yaml
const config = loadConfig();

// Authentication - Strict (prevent brute force attacks)
const authLimiter = rateLimit({
  windowMs: config.limits?.authentication?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.authentication?.max?.value || 25,
  message: {
    error:
      config.limits?.authentication?.message?.value ||
      'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin operations - Moderate (protect admin functions)
const adminLimiter = rateLimit({
  windowMs: config.limits?.admin?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.admin?.max?.value || 500,
  message: {
    error:
      config.limits?.admin?.message?.value || 'Too many admin requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// External API proxy - Restrictive (protect downstream agents)
const apiProxyLimiter = rateLimit({
  windowMs: config.limits?.apiProxy?.windowMs?.value || 60 * 1000,
  limit: config.limits?.apiProxy?.max?.value || 2000,
  message: {
    error:
      config.limits?.apiProxy?.message?.value ||
      'Too many API proxy requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard operations - Normal (general purpose)
const standardLimiter = rateLimit({
  windowMs: config.limits?.standard?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.standard?.max?.value || 1000,
  message: {
    error: config.limits?.standard?.message?.value || 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Static file serving - High limit (prevent file system abuse, CodeQL flagged endpoints)
const staticFileLimiter = rateLimit({
  windowMs: config.limits?.staticFiles?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.staticFiles?.max?.value || 5000,
  message: {
    error:
      config.limits?.staticFiles?.message?.value ||
      'Too many static file requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication endpoints - Protected with strict rate limiting
router.post('/api/auth/register', authLimiter, AuthController.register);
router.post('/api/auth/login', authLimiter, AuthController.login);
router.post('/api/auth/ldap', authLimiter, AuthController.ldapLogin);
// Multiple OIDC provider routes
router.get('/api/auth/oidc/callback', standardLimiter, AuthController.handleOidcCallback);
// OIDC Back-Channel Logout receiver (server-to-server; IdP POSTs a signed logout_token). Public
// — trust is the token signature/aud, not an app session. Needs its own urlencoded parser
// because the app only mounts express.json() globally. Registered before the GET :provider
// route for clarity (no collision — this is POST).
router.post(
  '/api/auth/oidc/backchannel-logout',
  standardLimiter,
  express.urlencoded({ extended: false }),
  AuthController.handleBackchannelLogout
);
// Trusted OIDC issuers (C5, public). MUST precede the GET :provider route so 'issuers' isn't
// captured as a provider name.
router.get('/api/auth/oidc/issuers', standardLimiter, AuthController.getOidcIssuers);
router.get('/api/auth/oidc/:provider', standardLimiter, AuthController.startOidcLogin);
router.post('/api/auth/logout', standardLimiter, optionalAuth, AuthController.logout);
router.get('/api/auth/profile', standardLimiter, authenticate, AuthController.getProfile);
router.post('/api/auth/change-password', authLimiter, authenticate, AuthController.changePassword);
router.delete(
  '/api/auth/delete-account',
  authLimiter,
  authenticate,
  AuthController.deleteSelfAccount
);
router.get('/api/auth/verify', standardLimiter, AuthController.verifyToken);
router.get('/api/auth/setup-status', standardLimiter, AuthController.checkSetupStatus);
router.get('/api/auth/methods', standardLimiter, AuthController.getAuthMethods);

// Favorites + OIDC userinfo claims (profile dropdown). The OIDC access token is read
// server-side from req.session.oidc (never the app JWT, §4); oidcTokenRefresh refreshes it
// when near expiry. authenticate first (valid app session), then the refresh middleware.
router.get(
  '/api/userinfo/claims',
  standardLimiter,
  authenticate,
  oidcTokenRefresh,
  FavoritesController.getUserInfoClaims
);
router.get(
  '/api/userinfo/favorites',
  standardLimiter,
  authenticate,
  oidcTokenRefresh,
  FavoritesController.getEnrichedFavorites
);
router.get(
  '/api/favorites',
  standardLimiter,
  authenticate,
  oidcTokenRefresh,
  FavoritesController.getFavorites
);
router.post(
  '/api/favorites/save',
  standardLimiter,
  authenticate,
  oidcTokenRefresh,
  FavoritesController.saveFavorites
);
router.post(
  '/api/auth/ldap/test',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  AuthController.testLdap
);

// This needs to be moved out of this file!
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
router.get('/api/profile/:identifier', standardLimiter, async (req, res) => {
  const { identifier } = req.params;

  try {
    const appConfig = loadConfig();
    const apiKey = appConfig.integrations?.gravatar?.api_key?.value;

    const hash = crypto.createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');

    const response = await axios.get(`https://api.gravatar.com/v3/profiles/${hash}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json({
      error: error.message,
    });
  }
});

// Admin endpoints - Protected with admin rate limiting
router.get(
  '/api/admin/users',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.getAllUsers
);
router.put(
  '/api/admin/users/role',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.updateUserRole
);
router.delete(
  '/api/admin/users/:userId',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.deactivateUser
);
router.put(
  '/api/admin/users/:userId/reactivate',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.reactivateUser
);
router.delete(
  '/api/admin/users/:userId/delete',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  AuthController.deleteUser
);

// Organization endpoints - Protected with admin rate limiting
router.get(
  '/api/organizations',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  AuthController.getAllOrganizations
);
router.get(
  '/api/organizations/:id',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.getOrganization
);
router.put(
  '/api/organizations/:id',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.updateOrganization
);
router.get(
  '/api/organizations/:id/users',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.getOrganizationUsers
);
router.get(
  '/api/organizations/:id/stats',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.getOrganizationStats
);
router.get(
  '/api/organizations/check/:name',
  standardLimiter,
  AuthController.checkOrganizationExists
);
router.put(
  '/api/organizations/:orgId/deactivate',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  AuthController.deactivateOrganization
);
router.delete(
  '/api/organizations/:orgId',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  AuthController.deleteOrganization
);

// Invitation endpoints - Protected with admin rate limiting
router.post(
  '/api/invitations/send',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.sendInvitation
);
router.post(
  '/api/invitations',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.createInvitation
);
router.get(
  '/api/invitations',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.getInvitations
);
router.post(
  '/api/invitations/:id/resend',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.resendInvitation
);
router.delete(
  '/api/invitations/:id',
  adminLimiter,
  authenticate,
  requireAdmin,
  AuthController.revokeInvitation
);
router.get('/api/invitations/validate/:code', standardLimiter, AuthController.validateInvitation);

// Server management endpoints - Protected with admin rate limiting
router.post('/api/servers', adminLimiter, authenticate, requireAdmin, ServerController.addServer);
router.get('/api/servers', adminLimiter, authenticate, ServerController.getAllServers);
router.post('/api/servers/test', adminLimiter, authenticate, ServerController.testServer);
router.patch(
  '/api/servers/:serverId',
  adminLimiter,
  authenticate,
  requireAdmin,
  ServerController.updateServer
);
router.delete(
  '/api/servers/:serverId',
  adminLimiter,
  authenticate,
  requireAdmin,
  ServerController.removeServer
);

// ── Unified agent proxy (dual-mode plan §4) ────────────────────────────────
// ALL /api/agents/:id/:path → resolve the agent by registry id → forward to it.
// Sub-path authorization: the sensitive admin/superadmin surfaces that used to sit on
// explicit (but catch-all-shadowed, so never enforced) /api/zapi sub-routes are gated
// here for real, before the generic proxy runs.
const AGENT_SUPERADMIN_PREFIXES = ['settings', 'server/restart'];
const AGENT_ADMIN_PREFIXES = [
  'system/zfs/arc',
  'system/fault-management',
  'system/logs',
  'system/syslog',
  // Host power actions (the host-power surface) — admin per Mark's ruling (2026-07-05):
  // admins may power hosts, plain users may not. Matches the UI's canPowerOffHosts level.
  // Read-only /system/host/status and /uptime stay ungated.
  'system/host/shutdown',
  'system/host/restart',
  'system/host/poweroff',
  'system/host/halt',
  // Hosts-file read/write and database maintenance (vacuum/analyze/cleanup) — system
  // configuration surfaces, admin like the rest of this list.
  'system/hosts',
  'database',
];

const matchesAgentPrefix = (subPath, prefix) =>
  subPath === prefix || subPath.startsWith(`${prefix}/`);

const authorizeAgentSubPath = (req, res, next) => {
  const subPath = Array.isArray(req.params.splat)
    ? req.params.splat.join('/')
    : req.params.splat || '';

  if (AGENT_SUPERADMIN_PREFIXES.some(prefix => matchesAgentPrefix(subPath, prefix))) {
    return requireSuperAdmin(req, res, next);
  }
  if (AGENT_ADMIN_PREFIXES.some(prefix => matchesAgentPrefix(subPath, prefix))) {
    return requireAdmin(req, res, next);
  }
  return next();
};

router.all(
  '/api/agents/:id/*splat',
  apiProxyLimiter,
  authenticate,
  authorizeAgentSubPath,
  ServerController.proxyToAgent
);

// Settings endpoints - Protected with admin rate limiting
router.get(
  '/api/settings',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.getSettings
);
router.put(
  '/api/settings',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.updateSettings
);
router.post(
  '/api/settings/ssl/upload',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.uploadSSLFile
);
router.post(
  '/api/settings/reset',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.resetSettings
);
router.post(
  '/api/settings/restart',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.restartServer
);
router.get(
  '/api/settings/backups',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.getBackups
);
router.post(
  '/api/settings/restore/:filename',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.restoreFromBackup
);
router.delete(
  '/api/settings/backups/:filename',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.deleteBackup
);

// Config collection management endpoints (keyed maps, e.g. OIDC providers)
// - Protected with admin rate limiting. :path is a dotted config path.
router.get(
  '/api/settings/collections/:path',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.getCollection
);
router.post(
  '/api/settings/collections/:path',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.createCollectionItem
);
router.put(
  '/api/settings/collections/:path/:key',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.updateCollectionItem
);
router.delete(
  '/api/settings/collections/:path/:key',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  SettingsController.deleteCollectionItem
);

// Mail testing endpoint - Protected with admin rate limiting
router.post(
  '/api/mail/test',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  AuthController.testMail
);

// Server identity/status — PUBLIC (login screen + dual-mode probe depend on it) [dual-mode plan §3.2]
router.get('/api/status', standardLimiter, StatusController.getServerStatus);

// Ticket-system config (C4) — PUBLIC (profile dropdown help-desk link)
router.get('/api/config/ticket', standardLimiter, ConfigController.getTicketConfig);

// Health check endpoint - Simple health status for restart monitoring
router.get('/api/health', standardLimiter, (req, res) => {
  void req;
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
  });
});

// Docs ship inside the Hyperweaver UI artifact (as ui/docs) and are served by the
// root static mount in index.js. Static wins for every existing file, so this
// handler only fires when the docs are NOT bundled (e.g. a dev checkout, or a UI
// artifact built before docs bundling) — say so plainly instead of falling through
// to the SPA catch-all, which would render a blank app shell.
router.use('/docs', staticFileLimiter, (req, res) => {
  void req;
  res.status(503).json({
    error: 'Documentation not bundled in this build',
    details:
      'The docs site is bundled into the Hyperweaver UI artifact (ui/docs) at UI build time; serve a UI artifact that includes it (hyperweaverUiVersion >= 0.10.5).',
  });
});

// Serve the Hyperweaver UI build artifact (fetched into ./ui) - Protected with static file rate limiting (CodeQL flagged)
router.use('/ui', staticFileLimiter, express.static(path.join(process.cwd(), 'ui')));

// Catch all handler: send back Vite's index.html file for client-side routing - Protected with static file rate limiting (CodeQL flagged)
router.get('/ui/*splat', staticFileLimiter, (req, res) => {
  void req;
  res.sendFile(path.join(process.cwd(), 'ui/index.html'));
});

export default router;
