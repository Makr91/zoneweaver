/**
 * @fileoverview Favorites + OIDC userinfo-claims proxy (profile dropdown).
 * @description Thin proxy to the OIDC provider's /userinfo + favorites endpoints. The OIDC
 * access token is read SERVER-SIDE from req.session.oidc (never the app JWT — contract §4);
 * the oidcTokenRefresh middleware keeps it fresh. Implementations live in ./favorites/*; this
 * top-level module re-exports them so swagger-jsdoc (which scans ./controllers/*.js, not
 * subdirectories) can pick up the route docs below.
 */

import { getUserInfoClaims } from './favorites/claims.js';
import { getFavorites } from './favorites/get.js';
import { saveFavorites } from './favorites/save.js';
import { getEnrichedFavorites } from './favorites/enriched.js';

/**
 * @swagger
 * /api/userinfo/claims:
 *   get:
 *     summary: Get enriched OIDC user claims (incl. favorite_apps)
 *     description: Proxies the OIDC provider's /userinfo using the session-stored OIDC access token. Non-OIDC sessions receive minimal claims.
 *     tags: [Favorites]
 *     security:
 *       - JwtAuth: []
 *     responses:
 *       200:
 *         description: Claims retrieved (or minimal claims for non-OIDC sessions)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sub:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 favorite_apps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       clientId: { type: string }
 *                       clientName: { type: string }
 *                       customLabel: { type: string }
 *                       icon: { type: string }
 *                       iconUrl: { type: string }
 *                       homeUrl: { type: string }
 *                       order: { type: integer }
 *       401:
 *         description: Not authenticated (app JWT required)
 */

/**
 * @swagger
 * /api/userinfo/favorites:
 *   get:
 *     summary: Get enriched favorite apps only (lightweight)
 *     description: Returns the enriched favorite_apps array from the OIDC provider. Empty array for non-OIDC sessions.
 *     tags: [Favorites]
 *     security:
 *       - JwtAuth: []
 *     responses:
 *       200:
 *         description: Enriched favorite apps
 *       401:
 *         description: Not authenticated (app JWT required)
 */

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get the user's favorites (raw form)
 *     description: Returns the raw favorites list ([{clientId, customLabel, order}]). Empty array for non-OIDC sessions.
 *     tags: [Favorites]
 *     security:
 *       - JwtAuth: []
 *     responses:
 *       200:
 *         description: Raw favorites list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   clientId: { type: string }
 *                   customLabel: { type: string }
 *                   order: { type: integer }
 *       401:
 *         description: Not authenticated (app JWT required)
 */

/**
 * @swagger
 * /api/favorites/save:
 *   post:
 *     summary: Save the user's favorites
 *     description: Persists the favorites list to the OIDC provider. Requires an OIDC session.
 *     tags: [Favorites]
 *     security:
 *       - JwtAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 clientId: { type: string }
 *                 customLabel: { type: string }
 *                 order: { type: integer }
 *     responses:
 *       200:
 *         description: Favorites saved
 *       401:
 *         description: OIDC authentication required (non-OIDC session)
 *       500:
 *         description: Failed to save favorites to the auth server
 */

export { getUserInfoClaims, getFavorites, saveFavorites, getEnrichedFavorites };
