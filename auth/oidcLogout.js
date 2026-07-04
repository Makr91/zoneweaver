import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';
import { getOidcConfiguration } from './passport.js';

const BACKCHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout';

/**
 * Build the OIDC RP-Initiated Logout URL for the current session's provider: the provider's
 * end_session_endpoint with id_token_hint + post_logout_redirect_uri. Returns null when the
 * provider isn't configured, lacks an end_session_endpoint, or the session has no OIDC state.
 * @param {Object} sessionOidc - req.session.oidc ({ provider, id_token, ... })
 * @returns {string|null} RP-initiated logout URL, or null if unsupported
 */
const buildRpLogoutUrl = sessionOidc => {
  const providerName = sessionOidc?.provider?.replace('oidc-', '');
  if (!providerName) {
    return null;
  }

  const oidcConfig = getOidcConfiguration(providerName);
  const endSessionEndpoint = oidcConfig?.serverMetadata()?.end_session_endpoint;
  if (!endSessionEndpoint) {
    log.auth.info('Provider does not support RP-initiated logout (no end_session_endpoint)', {
      providerName,
    });
    return null;
  }

  const config = loadConfig();
  const url = new URL(endSessionEndpoint);
  if (sessionOidc.id_token) {
    url.searchParams.set('id_token_hint', sessionOidc.id_token);
  }
  url.searchParams.set(
    'post_logout_redirect_uri',
    `${config.frontend.frontend_url.value}/ui/login?logout=success`
  );
  return url.toString();
};

/**
 * Best-effort revoke the session's OIDC grant at the provider's revocation endpoint (defense
 * in depth alongside app-JWT revocation + RP-initiated logout). Never throws — a failure here
 * must not block logout.
 * @param {Object} sessionOidc - req.session.oidc ({ provider, refresh_token, ... })
 * @returns {Promise<void>}
 */
const revokeOidcGrant = async sessionOidc => {
  const providerName = sessionOidc?.provider?.replace('oidc-', '');
  if (!providerName || !sessionOidc.refresh_token) {
    return;
  }

  const oidcConfig = getOidcConfiguration(providerName);
  const revocationEndpoint = oidcConfig?.serverMetadata()?.revocation_endpoint;
  if (!revocationEndpoint) {
    return;
  }

  const config = loadConfig();
  const providerConfig = config.authentication?.oidc_providers?.value?.[providerName];
  const clientId = providerConfig?.client_id?.value;
  const clientSecret = providerConfig?.client_secret?.value;
  const authMethod = providerConfig?.token_endpoint_auth_method?.value || 'client_secret_basic';

  try {
    // Revoke the refresh token — at most providers this revokes the whole grant.
    const params = new URLSearchParams({
      token: sessionOidc.refresh_token,
      token_type_hint: 'refresh_token',
    });
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if (authMethod === 'client_secret_post') {
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
    } else {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${basic}`;
    }

    await axios.post(revocationEndpoint, params.toString(), { headers, timeout: 10000 });
    log.auth.info('Revoked OIDC grant at provider', { providerName });
  } catch (error) {
    log.auth.warn('OIDC grant revocation failed (best-effort, ignored)', {
      providerName,
      error: error.message,
      status: error.response?.status,
    });
  }
};

/**
 * Verify an OIDC Back-Channel Logout `logout_token` (OIDC Back-Channel Logout 1.0 §2.4).
 * Identifies which configured provider it targets by `aud` (= our client_id), verifies the
 * RS256 signature against that provider's JWKS, checks issuer origin, and enforces the
 * back-channel-logout event + sub/sid presence + nonce absence. Throws on any failure.
 * @param {string} logoutToken - the raw JWT from the form-encoded `logout_token` field
 * @returns {Promise<{ providerName: string, sub: string|undefined, sid: string|undefined }>}
 */
const verifyLogoutToken = async logoutToken => {
  if (!logoutToken) {
    throw new Error('Missing logout_token');
  }

  // Decode (unverified) to read the header kid + the aud/iss needed to select the provider.
  const decoded = jwt.decode(logoutToken, { complete: true });
  if (!decoded || !decoded.payload) {
    throw new Error('Malformed logout_token');
  }
  const { aud, iss } = decoded.payload;
  const audiences = Array.isArray(aud) ? aud : [aud];

  // Select our provider by matching aud against the configured client_ids (each provider's
  // client_id is distinct — this identifies which of our OIDC clients the token is for).
  const config = loadConfig();
  const providers = config.authentication?.oidc_providers?.value || {};
  const entry = Object.entries(providers).find(([, providerConfig]) =>
    audiences.includes(providerConfig.client_id?.value)
  );
  if (!entry) {
    throw new Error('logout_token audience does not match any configured OIDC client');
  }
  const [providerName, providerConfig] = entry;

  const oidcConfig = getOidcConfiguration(providerName);
  const meta = oidcConfig?.serverMetadata();
  if (!meta?.jwks_uri) {
    throw new Error(`OIDC provider '${providerName}' is not configured (no JWKS)`);
  }

  // Issuer is REQUIRED (spec §2.4) and its origin must match the configured provider
  // (tolerates the dynamic per-hostname issuer at the origin level; the signature below is
  // the authoritative proof of origin).
  const configuredIssuer = providerConfig.issuer?.value;
  if (!iss || !configuredIssuer || new URL(iss).origin !== new URL(configuredIssuer).origin) {
    throw new Error('logout_token issuer does not match the provider');
  }

  // Fetch the JWKS and find the signing key for this token's kid, then verify RS256 + aud.
  const jwksResponse = await axios.get(meta.jwks_uri, { timeout: 10000 });
  const jwk = (jwksResponse.data?.keys || []).find(key => key.kid === decoded.header.kid);
  if (!jwk) {
    throw new Error('No matching JWKS key for the logout_token kid');
  }
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const claims = jwt.verify(logoutToken, publicKey, {
    algorithms: ['RS256'],
    audience: providerConfig.client_id.value,
  });

  // Back-channel-specific validation (spec §2.4).
  if (!claims.events || !claims.events[BACKCHANNEL_LOGOUT_EVENT]) {
    throw new Error('logout_token is missing the back-channel logout event');
  }
  if (!claims.sub && !claims.sid) {
    throw new Error('logout_token must contain sub and/or sid');
  }
  if (claims.nonce !== undefined) {
    throw new Error('logout_token must not contain a nonce');
  }

  return { providerName, sub: claims.sub, sid: claims.sid };
};

export { buildRpLogoutUrl, revokeOidcGrant, verifyLogoutToken };
