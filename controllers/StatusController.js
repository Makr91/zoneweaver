/**
 * @fileoverview Server status / identity controller
 * @description Public dual-mode probe (dual-mode plan §3.2). The SPA hits
 * GET /api/status against its origin to pin Axis 1 (serving mode). For the
 * Hyperweaver Server this reports role=server plus the enabled auth methods,
 * pre-auth — the login screen depends on it.
 */

import { readFileSync } from 'fs';
import { loadConfig } from '../utils/config.js';

// Server version — single source of truth is the root package.json
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/**
 * Derive the enabled auth method tokens from config. Mirrors the enable logic in
 * AuthController.getAuthMethods, but returns the slim token array the status
 * contract wants (§3.2): local is on unless explicitly disabled; ldap/oidc reflect config.
 * @param {Object} config - Loaded configuration
 * @returns {string[]} Enabled auth method tokens
 */
const enabledAuthMethods = config => {
  const auth = config.authentication || {};
  const methods = [];

  if (auth.local_enabled?.value !== false) {
    methods.push('local');
  }
  if (auth.ldap_enabled?.value === true) {
    methods.push('ldap');
  }

  const oidcProviders = auth.oidc_providers?.value || {};
  if (Object.values(oidcProviders).some(provider => provider?.enabled?.value)) {
    methods.push('oidc');
  }

  return methods;
};

/**
 * Server status controller
 */
class StatusController {
  /**
   * @swagger
   * /api/status:
   *   get:
   *     summary: Server identity and enabled auth methods (public)
   *     description: Public dual-mode probe. Pins the SPA to Aggregated mode and reports which authentication methods are enabled, before login.
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Server status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 role:
   *                   type: string
   *                   example: server
   *                 version:
   *                   type: string
   *                   example: 0.8.1
   *                 auth:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ['local', 'oidc']
   */
  static getServerStatus(req, res) {
    void req;
    const config = loadConfig();
    const payload = {
      role: 'server',
      version,
      auth: enabledAuthMethods(config),
    };
    // C6: expose the aggregate-root label pre-auth ONLY when the operator opts in
    // (public_datacenter_label). When off, the UI falls back to a generic label pre-auth and
    // reads the real one post-login from /api/auth/verify.
    if (config.branding?.public_datacenter_label?.value) {
      payload.datacenter_label = config.branding?.datacenter_label?.value || 'Hyperweaver';
    }
    res.json(payload);
  }
}

export default StatusController;
