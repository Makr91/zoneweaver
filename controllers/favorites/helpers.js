import { loadConfig } from '../../utils/config.js';
import { log } from '../../utils/Logger.js';

/**
 * Resolve the OIDC provider's base URL (scheme + host of its issuer) for the current session.
 * The IdP's userinfo + favorites endpoints hang off this base (`/userinfo`, `/user/favorites/save`).
 * @param {import('express').Request} req
 * @returns {string} Auth-server base URL (e.g. https://auth.example.com)
 */
const getAuthServerUrl = req => {
  const providerName = req.session?.oidc?.provider?.replace('oidc-', '');
  if (!providerName) {
    throw new Error('No OIDC provider in session');
  }

  const config = loadConfig();
  const issuer = config.authentication?.oidc_providers?.value?.[providerName]?.issuer?.value;
  if (!issuer) {
    throw new Error(`OIDC provider '${providerName}' not found in configuration`);
  }

  const issuerUrl = new URL(issuer);
  return `${issuerUrl.protocol}//${issuerUrl.host}`;
};

/**
 * Extract the current OIDC access token from the SERVER-SIDE session (never the app JWT —
 * contract §4). The oidcTokenRefresh middleware keeps req.session.oidc.access_token fresh.
 * The stash must belong to the JWT identity making this request — a shared browser session
 * can hold another account's OIDC tokens (e.g. a local login after an OIDC login), and
 * serving those would leak the other user's IdP claims/favorites.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
const extractOidcAccessToken = req => {
  const oidc = req.session?.oidc;
  if (!oidc || oidc.userId !== req.user?.userId) {
    return null;
  }
  return oidc.access_token || null;
};

/**
 * Shared logger for favorites/claims errors (keeps the controllers terse).
 * @param {string} message
 * @param {Error} error
 */
const logFavoritesError = (message, error) => {
  log.auth.error(message, {
    error: error.message,
    status: error.response?.status,
  });
};

export { getAuthServerUrl, extractOidcAccessToken, logFavoritesError };
