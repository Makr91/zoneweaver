import axios from 'axios';
import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';
import { getOidcConfiguration } from './passport.js';

/**
 * Refresh the OIDC access token BEFORE it expires, storing the result server-side in
 * express-session (never the app JWT — contract §4 / I2D-6). Ported from BoxVault's
 * refresh logic but rebuilt around req.session.oidc: reads the refresh token from the
 * session, and on success writes the new tokens back to the session. There is no
 * X-Refreshed-Token header and no token in the client JWT.
 *
 * No-ops (calls next) for non-OIDC sessions, sessions without a refresh token, or tokens
 * that are not near expiry. On refresh failure it drops req.session.oidc so downstream
 * favorites/claims degrade to "empty" rather than erroring with a stale token.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const oidcTokenRefresh = async (req, res, next) => {
  // `res` is unused: this middleware never responds — on any failure it degrades gracefully
  // (drops stale session OIDC state and calls next), so favorites/claims return empty rather
  // than 401. Kept in the signature because Express identifies middleware by arity.
  void res;
  // Skip when there's nothing to refresh — or when the stash doesn't belong to the JWT
  // identity making this request (shared browser session holding another account's tokens);
  // refreshing on their behalf would keep a foreign grant alive.
  const oidc = req.session?.oidc;
  if (!oidc || !oidc.refresh_token || !oidc.provider || oidc.userId !== req.user?.userId) {
    return next();
  }

  const config = loadConfig();
  const refreshThresholdMinutes =
    config.authentication?.oidc_token_refresh_threshold_minutes?.value || 5;
  const refreshThreshold = refreshThresholdMinutes * 60 * 1000;

  // Still comfortably valid — nothing to do.
  if (oidc.expires_at && oidc.expires_at - Date.now() > refreshThreshold) {
    return next();
  }

  const providerName = oidc.provider.replace('oidc-', '');
  const oidcConfig = getOidcConfiguration(providerName);
  const providerConfig = config.authentication?.oidc_providers?.value?.[providerName];

  if (!oidcConfig || !providerConfig) {
    log.auth.warn('OIDC token refresh skipped: provider config unavailable', { providerName });
    return next();
  }

  try {
    const tokenEndpoint = oidcConfig.serverMetadata().token_endpoint;
    const clientId = providerConfig.client_id?.value;
    const clientSecret = providerConfig.client_secret?.value;
    const authMethod = providerConfig.token_endpoint_auth_method?.value || 'client_secret_basic';

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: oidc.refresh_token,
      client_id: clientId,
    });
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if (authMethod === 'client_secret_post') {
      params.append('client_secret', clientSecret);
    } else {
      // client_secret_basic (default): credentials in the Authorization header
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${basic}`;
    }

    const response = await axios.post(tokenEndpoint, params.toString(), {
      headers,
      timeout: 10000,
    });
    const newTokens = response.data;

    const expiresAt =
      typeof newTokens.expires_in === 'number'
        ? Date.now() + newTokens.expires_in * 1000
        : Date.now() + 30 * 60 * 1000;

    // Persist refreshed tokens back into the session (server-side only).
    req.session.oidc = {
      ...oidc,
      access_token: newTokens.access_token,
      id_token: newTokens.id_token || oidc.id_token,
      // Some providers don't return a new refresh token on refresh — keep the old one.
      refresh_token: newTokens.refresh_token || oidc.refresh_token,
      expires_at: expiresAt,
    };

    log.auth.info('OIDC access token refreshed', { providerName });
  } catch (error) {
    log.auth.warn('OIDC token refresh failed; clearing session OIDC state', {
      providerName,
      error: error.message,
      status: error.response?.status,
    });
    // Drop the stale OIDC token — favorites/claims will degrade to empty, not error.
    delete req.session.oidc;
  }

  return next();
};

export { oidcTokenRefresh };
