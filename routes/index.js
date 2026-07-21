import express from 'express';
import path from 'path';
import { authenticate, optionalAuth, requireAdmin, requireSuperAdmin } from '../auth/auth.js';
import AuthController from '../controllers/AuthController.js';
import RegistrationController from '../controllers/RegistrationController.js';
import AccountController from '../controllers/AccountController.js';
import LdapController from '../controllers/LdapController.js';
import OidcController from '../controllers/OidcController.js';
import UserManagementController from '../controllers/UserManagementController.js';
import OrganizationController from '../controllers/OrganizationController.js';
import InvitationController from '../controllers/InvitationController.js';
import MailController from '../controllers/MailController.js';
import ServerController from '../controllers/ServerController.js';
import SettingsController from '../controllers/SettingsController.js';
import SslController from '../controllers/SslController.js';
import BackupController from '../controllers/BackupController.js';
import CollectionController from '../controllers/CollectionController.js';
import StatusController from '../controllers/StatusController.js';
import * as FavoritesController from '../controllers/FavoritesController.js';
import ConfigController from '../controllers/ConfigController.js';
import { oidcTokenRefresh } from '../auth/oidcTokenRefresh.js';
import { orgAuthorizeAgent } from '../utils/orgAccess.js';
import {
  getServerOrgs,
  setServerOrgs,
  getMachineOrgs,
  setMachineOrgs,
} from '../controllers/OrgAccessController.js';
import { proxyToBoxVault } from '../controllers/BoxVaultController.js';
import {
  authLimiter,
  adminLimiter,
  apiProxyLimiter,
  standardLimiter,
  staticFileLimiter,
} from './limiters.js';
import gravatarRouter from './gravatar.js';

const router = express.Router();

router.post('/api/auth/register', authLimiter, RegistrationController.register);
router.post('/api/auth/login', authLimiter, AuthController.login);
router.post('/api/auth/ldap', authLimiter, LdapController.ldapLogin);
router.get('/api/auth/oidc/callback', standardLimiter, OidcController.handleOidcCallback);
/**
 * OIDC Back-Channel Logout receiver (server-to-server; IdP POSTs a signed logout_token).
 * Public — trust is the token signature/aud, not an app session. Needs its own urlencoded
 * parser because the app only mounts express.json() globally. Registered before the GET
 * :provider route for clarity (no collision — this is POST).
 */
router.post(
  '/api/auth/oidc/backchannel-logout',
  standardLimiter,
  express.urlencoded({ extended: false }),
  OidcController.handleBackchannelLogout
);
/**
 * Trusted OIDC issuers (C5, public). MUST precede the GET :provider route so 'issuers'
 * isn't captured as a provider name.
 */
router.get('/api/auth/oidc/issuers', standardLimiter, OidcController.getOidcIssuers);
router.get('/api/auth/oidc/:provider', standardLimiter, OidcController.startOidcLogin);
router.post('/api/auth/logout', standardLimiter, optionalAuth, AuthController.logout);
router.get('/api/auth/profile', standardLimiter, authenticate, AccountController.getProfile);
router.post(
  '/api/auth/change-password',
  authLimiter,
  authenticate,
  AccountController.changePassword
);
router.delete(
  '/api/auth/delete-account',
  authLimiter,
  authenticate,
  UserManagementController.deleteSelfAccount
);
router.get('/api/auth/verify', standardLimiter, AuthController.verifyToken);
router.get('/api/auth/setup-status', standardLimiter, RegistrationController.checkSetupStatus);
router.get('/api/auth/methods', standardLimiter, AuthController.getAuthMethods);

/**
 * Favorites + OIDC userinfo claims (profile dropdown). The OIDC access token is read
 * server-side from req.session.oidc (never the app JWT, §4); oidcTokenRefresh refreshes it
 * when near expiry. authenticate first (valid app session), then the refresh middleware.
 */
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
  LdapController.testLdap
);

router.use(gravatarRouter);

router.get(
  '/api/admin/users',
  adminLimiter,
  authenticate,
  requireAdmin,
  UserManagementController.getAllUsers
);
router.put(
  '/api/admin/users/role',
  adminLimiter,
  authenticate,
  requireAdmin,
  UserManagementController.updateUserRole
);
router.delete(
  '/api/admin/users/:userId',
  adminLimiter,
  authenticate,
  requireAdmin,
  UserManagementController.deactivateUser
);
router.put(
  '/api/admin/users/:userId/reactivate',
  adminLimiter,
  authenticate,
  requireAdmin,
  UserManagementController.reactivateUser
);
router.delete(
  '/api/admin/users/:userId/delete',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  UserManagementController.deleteUser
);

router.get(
  '/api/organizations',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  OrganizationController.getAllOrganizations
);
router.get(
  '/api/organizations/:id',
  adminLimiter,
  authenticate,
  requireAdmin,
  OrganizationController.getOrganization
);
router.put(
  '/api/organizations/:id',
  adminLimiter,
  authenticate,
  requireAdmin,
  OrganizationController.updateOrganization
);
router.get(
  '/api/organizations/:id/users',
  adminLimiter,
  authenticate,
  requireAdmin,
  OrganizationController.getOrganizationUsers
);
router.get(
  '/api/organizations/:id/stats',
  adminLimiter,
  authenticate,
  requireAdmin,
  OrganizationController.getOrganizationStats
);
router.get(
  '/api/organizations/check/:name',
  standardLimiter,
  OrganizationController.checkOrganizationExists
);
router.put(
  '/api/organizations/:orgId/deactivate',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  OrganizationController.deactivateOrganization
);
router.delete(
  '/api/organizations/:orgId',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  OrganizationController.deleteOrganization
);

router.post(
  '/api/invitations/send',
  adminLimiter,
  authenticate,
  requireAdmin,
  InvitationController.sendInvitation
);
router.post(
  '/api/invitations',
  adminLimiter,
  authenticate,
  requireAdmin,
  InvitationController.createInvitation
);
router.get(
  '/api/invitations',
  adminLimiter,
  authenticate,
  requireAdmin,
  InvitationController.getInvitations
);
router.post(
  '/api/invitations/:id/resend',
  adminLimiter,
  authenticate,
  requireAdmin,
  InvitationController.resendInvitation
);
router.delete(
  '/api/invitations/:id',
  adminLimiter,
  authenticate,
  requireAdmin,
  InvitationController.revokeInvitation
);
router.get(
  '/api/invitations/validate/:code',
  standardLimiter,
  InvitationController.validateInvitation
);

router.post('/api/servers', adminLimiter, authenticate, requireAdmin, ServerController.addServer);
router.get(
  '/api/servers',
  adminLimiter,
  authenticate,
  oidcTokenRefresh,
  ServerController.getAllServers
);
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

/**
 * Org assignment (D15 self-service): guarded in the controller — local admins always,
 * otherwise OWNER/ADMIN of an owning org (agent orgs), or agent-org/machine-org managers
 * (machine orgs). oidcTokenRefresh keeps the session's org claims current.
 */
router.get(
  '/api/servers/:serverId/orgs',
  adminLimiter,
  authenticate,
  oidcTokenRefresh,
  getServerOrgs
);
router.put(
  '/api/servers/:serverId/orgs',
  adminLimiter,
  authenticate,
  oidcTokenRefresh,
  setServerOrgs
);
router.get(
  '/api/servers/:serverId/machines/:machineName/orgs',
  adminLimiter,
  authenticate,
  oidcTokenRefresh,
  getMachineOrgs
);
router.put(
  '/api/servers/:serverId/machines/:machineName/orgs',
  adminLimiter,
  authenticate,
  oidcTokenRefresh,
  setMachineOrgs
);

/**
 * BoxVault proxy: forwards with the LOGGED-IN USER's OIDC access token — BoxVault
 * authorizes org-private boxes from the token's organizations claim. No server-wide
 * BoxVault credential exists anywhere.
 */
router.all(
  '/api/boxvault/*splat',
  apiProxyLimiter,
  authenticate,
  oidcTokenRefresh,
  proxyToBoxVault
);

/**
 * Unified agent proxy (dual-mode plan §4): ALL /api/agents/:id/:path → resolve the agent
 * by registry id → forward to it. Sub-path authorization: the sensitive admin/superadmin
 * surfaces that used to sit on explicit (but catch-all-shadowed, so never enforced)
 * /api/zapi sub-routes are gated here for real, before the generic proxy runs.
 * Host power actions are admin per Mark's ruling: admins may power hosts, plain users may
 * not (matches the UI's canPowerOffHosts level); read-only /system/host/status and /uptime
 * stay ungated. Hosts-file read/write and database maintenance are system configuration
 * surfaces, admin like the rest.
 */
const AGENT_SUPERADMIN_PREFIXES = ['settings', 'server/restart'];
const AGENT_ADMIN_PREFIXES = [
  'system/zfs/arc',
  'system/fault-management',
  'system/logs',
  'system/syslog',
  'system/host/shutdown',
  'system/host/restart',
  'system/host/poweroff',
  'system/host/halt',
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
  oidcTokenRefresh,
  authorizeAgentSubPath,
  orgAuthorizeAgent,
  ServerController.proxyToAgent
);

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
  SslController.uploadSSLFile
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
  BackupController.getBackups
);
router.post(
  '/api/settings/restore/:filename',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  BackupController.restoreFromBackup
);
router.delete(
  '/api/settings/backups/:filename',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  BackupController.deleteBackup
);

router.get(
  '/api/settings/collections/:path',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  CollectionController.getCollection
);
router.post(
  '/api/settings/collections/:path',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  CollectionController.createCollectionItem
);
router.put(
  '/api/settings/collections/:path/:key',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  CollectionController.updateCollectionItem
);
router.delete(
  '/api/settings/collections/:path/:key',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  CollectionController.deleteCollectionItem
);

router.post(
  '/api/mail/test',
  adminLimiter,
  authenticate,
  requireSuperAdmin,
  MailController.testMail
);

router.get('/api/status', standardLimiter, StatusController.getServerStatus);

router.get('/api/config/ticket', standardLimiter, ConfigController.getTicketConfig);

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

/**
 * Docs ship inside the Hyperweaver UI artifact (as ui/docs) and are served by the root
 * static mount in index.js. Static wins for every existing file, so this handler only
 * fires when the docs are NOT bundled (e.g. a dev checkout, or a UI artifact built before
 * docs bundling) — say so plainly instead of falling through to the SPA catch-all, which
 * would render a blank app shell.
 */
router.use('/docs', staticFileLimiter, (req, res) => {
  void req;
  res.status(503).json({
    error: 'Documentation not bundled in this build',
    details:
      'The docs site is bundled into the Hyperweaver UI artifact (ui/docs) at UI build time; serve a UI artifact that includes it (hyperweaverUiVersion >= 0.10.5).',
  });
});

router.use('/ui', staticFileLimiter, express.static(path.join(process.cwd(), 'ui')));

router.get('/ui/*splat', staticFileLimiter, (req, res) => {
  void req;
  res.sendFile(path.join(process.cwd(), 'ui/index.html'));
});

export default router;
