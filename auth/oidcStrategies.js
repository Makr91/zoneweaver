import passport from 'passport';
import * as client from 'openid-client';
import { Strategy as OidcStrategy } from 'openid-client/passport';
import { loadConfig } from '../utils/config.js';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';
import { handleExternalUser } from './externalUser.js';

const config = loadConfig();

/**
 * Discovered OIDC provider Configurations (openid-client), keyed by provider name.
 * Populated at setup; read by the oidcTokenRefresh middleware for the token endpoint +
 * server metadata.
 */
const oidcConfigurations = new Map();

/**
 * Setup a single OIDC provider strategy.
 *
 * Token-endpoint auth is explicit client_secret_basic (HTTP Basic): the STARTcloud IdP
 * registers every secret'd client as CLIENT_SECRET_BASIC only, and relying on
 * openid-client's default auth method yields an invalid_client "authentication_method"
 * mismatch at the token exchange. Matches the refresh/revoke middleware (also Basic).
 *
 * SAFE token model (contract §4): the verify callback stashes the OIDC tokens SERVER-SIDE
 * in the session — NEVER in the app JWT. FavoritesController + the oidcTokenRefresh
 * middleware read req.session.oidc; the browser only ever receives its normal app JWT.
 * The session id is regenerated at the login privilege boundary (fixation guard); the
 * stash is bound to the user it was minted for (userId) so a shared browser session can
 * never serve one account's IdP tokens to another account's app JWT; `sid` is kept for
 * OIDC back-channel-logout correlation; `expires_at` drives the refresh check.
 * @param {string} providerName - Provider identifier
 * @param {Object} providerConfig - Provider configuration object
 */
const setupSingleOidcProvider = async (providerName, providerConfig) => {
  const displayName = providerConfig.display_name?.value;
  const issuer = providerConfig.issuer?.value;
  const clientId = providerConfig.client_id?.value;
  const clientSecret = providerConfig.client_secret?.value;
  const scope = providerConfig.scope?.value || 'openid profile email';
  const responseType = providerConfig.response_type?.value || 'code';

  log.auth.info('Setting up OIDC provider', {
    providerName,
    displayName,
    issuer,
    clientId,
    scope,
    responseType,
  });

  const oidcConfig = await client.discovery(
    new URL(issuer),
    clientId,
    clientSecret,
    client.ClientSecretBasic(clientSecret)
  );
  oidcConfigurations.set(providerName, oidcConfig);

  const strategyName = `oidc-${providerName}`;
  passport.use(
    strategyName,
    new OidcStrategy(
      {
        name: strategyName,
        config: oidcConfig,
        scope,
        callbackURL: `${config.frontend.frontend_url.value}/api/auth/oidc/callback`,
        passReqToCallback: true,
      },
      async (req, tokens, verified) => {
        try {
          log.auth.info('OIDC authentication successful for provider', { providerName });

          const userinfo = tokens.claims();
          log.auth.debug('OIDC User Claims', {
            providerName,
            subject: userinfo.sub,
            email: userinfo.email,
            name: userinfo.name || `${userinfo.given_name} ${userinfo.family_name}`,
            profileKeys: Object.keys(userinfo),
          });

          const result = await handleExternalUser(`oidc-${providerName}`, userinfo);
          log.auth.info('OIDC user processing complete', {
            providerName,
            username: result.username,
          });

          if (req.session) {
            await new Promise((resolve, reject) => {
              req.session.regenerate(err => (err ? reject(err) : resolve()));
            });
            let expiresAt = Date.now() + 30 * 60 * 1000;
            if (typeof tokens.expires_in === 'number') {
              expiresAt = Date.now() + tokens.expires_in * 1000;
            } else if (typeof userinfo.exp === 'number') {
              expiresAt = userinfo.exp * 1000;
            }
            req.session.oidc = {
              userId: result.id,
              provider: strategyName,
              access_token: tokens.access_token,
              id_token: tokens.id_token,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt,
              sid: userinfo.sid,
              organizations: Array.isArray(userinfo.organizations) ? userinfo.organizations : [],
            };
          }

          return verified(null, result);
        } catch (error) {
          log.auth.error('OIDC Strategy error during user processing', {
            providerName,
            error: error.message,
            stack: error.stack,
          });
          return verified(error, false);
        }
      }
    )
  );

  log.auth.info('OIDC provider configured successfully', {
    providerName,
    strategyName,
  });
};

/**
 * OIDC Multiple Providers Strategy Setup
 */
export const setupOidcProviders = async () => {
  try {
    const { user: UserModel } = db;
    await UserModel.findOne({ limit: 1 });
  } catch {
    log.database.info('Database not ready yet, waiting for migrations to complete');
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  }

  const oidcProvidersConfig = config.authentication?.oidc_providers?.value || {};

  if (!oidcProvidersConfig || Object.keys(oidcProvidersConfig).length === 0) {
    log.auth.info('No OIDC providers configured');
    return;
  }

  log.auth.info('Setting up OIDC authentication providers', {
    providerCount: Object.keys(oidcProvidersConfig).length,
  });

  const providerEntries = Object.entries(oidcProvidersConfig).filter(
    ([providerName, providerConfig]) => {
      if (!providerConfig.enabled?.value) {
        log.auth.info('Skipping disabled OIDC provider', { providerName });
        return false;
      }
      const issuer = providerConfig.issuer?.value;
      const clientId = providerConfig.client_id?.value;
      const clientSecret = providerConfig.client_secret?.value;
      if (!issuer || !clientId || !clientSecret) {
        log.auth.error('Invalid OIDC provider configuration: missing required fields', {
          providerName,
          missingFields: ['issuer', 'client_id', 'client_secret'],
        });
        return false;
      }
      return true;
    }
  );

  const results = await Promise.allSettled(
    providerEntries.map(([providerName, providerConfig]) =>
      setupSingleOidcProvider(providerName, providerConfig)
    )
  );

  results.forEach((result, idx) => {
    const [providerName] = providerEntries[idx];
    if (result.status === 'rejected') {
      log.auth.error('Failed to setup OIDC provider', {
        providerName,
        error: result.reason.message,
      });
    }
  });

  log.auth.info('OIDC provider setup completed');
};

/**
 * Get the discovered OIDC Configuration for a provider (used by the token-refresh middleware
 * to reach the token endpoint + server metadata).
 * @param {string} providerName - Provider identifier (without the `oidc-` prefix)
 * @returns {import('openid-client').Configuration|undefined}
 */
export const getOidcConfiguration = providerName => oidcConfigurations.get(providerName);
