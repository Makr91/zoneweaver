import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { authenticateLdapUser } from './ldapClient.js';
import * as client from 'openid-client';
import { Strategy as OidcStrategy } from 'openid-client/passport';
import { Op } from '@sequelize/core';
import { loadConfig } from '../utils/config.js';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';

// Load config directly to avoid circular dependency with index.js
const config = loadConfig();

// Discovered OIDC provider Configurations (openid-client), keyed by provider name. Populated at
// setup; read by the oidcTokenRefresh middleware for the token endpoint + server metadata.
const oidcConfigurations = new Map();

/**
 * Passport.js configuration for ZoneWeaver
 */

// JWT Strategy - matches existing custom middleware behavior exactly
passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.authentication.jwt_secret.value,
      // Note: Not setting issuer/audience initially to maintain compatibility
    },
    async (payload, done) => {
      try {
        // Get fresh user data to ensure user is still active (matches existing logic)
        const { user: UserModel } = db;
        const user = await UserModel.findByPk(payload.userId);

        // Reject missing AND deactivated users — a deactivated account's JWT must die
        // immediately, not live out its 24h (this is the "still active" check the fresh
        // findByPk exists for).
        if (!user || user.is_active === false) {
          return done(null, false, { message: 'Invalid token - user not found' });
        }

        // Real SLO: reject any token issued before the user's revocation cutoff (set to now()
        // on every logout). payload.iat is seconds since epoch; tokens_valid_after is a Date.
        if (
          user.tokens_valid_after &&
          payload.iat &&
          payload.iat * 1000 < new Date(user.tokens_valid_after).getTime()
        ) {
          return done(null, false, { message: 'Token revoked' });
        }

        // Return user object in same format as existing middleware (+ auth_provider, C1:
        // prefer the JWT claim, fall back to the user's stored base provider for legacy tokens).
        return done(null, {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          auth_provider: payload.auth_provider || user.auth_provider || 'local',
        });
      } catch (error) {
        log.auth.error('JWT Strategy error', { error: error.message });
        return done(error, false);
      }
    }
  )
);

// Serialize/deserialize functions (required by passport but not used for JWT)
passport.serializeUser((user, done) => {
  done(null, user.userId);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const { user: UserModel } = db;
    const user = await UserModel.findByPk(userId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Generate a random organization code (hexcode format)
 * @returns {string} Random 6-character hexcode
 */
const generateOrgCode = () => Math.random().toString(16).substring(2, 8).toUpperCase();

/**
 * Determine organization for external user
 * @param {string} email - User email address
 * @returns {Promise<number>} Organization ID
 */
const determineUserOrganization = async email => {
  const { organization: OrganizationModel, invitation: InvitationModel } = db;
  const [, domain] = email.split('@');
  let mappedOrgCode = null;

  log.auth.debug('Determining organization for domain', { domain });

  // 1. Check pending invitation (highest priority)
  const invitation = await InvitationModel.findOne({
    where: {
      email,
      used_at: null,
      expires_at: {
        [Op.gt]: new Date(),
      },
    },
    attributes: [
      'id',
      'organization_id',
      'email',
      'invite_code',
      'invited_by_user_id',
      'expires_at',
      'used_at',
    ],
  });

  if (invitation) {
    log.auth.info('Found pending invitation, using organization', {
      email,
      organizationId: invitation.organization_id,
    });

    await invitation.markAsUsed();
    return invitation.organization_id;
  }

  // 2. Check domain mapping
  if (config.authentication?.external_domain_mapping_enabled?.value) {
    try {
      const mappingsJson = config.authentication.external_domain_mappings?.value || '{}';
      log.auth.debug('Raw domain mappings config', { mappingsJson });

      const mappings = JSON.parse(mappingsJson);
      log.auth.debug('Parsed domain mappings', { mappings });

      const matchedEntry = Object.entries(mappings).find(([orgCode, domains]) => {
        log.auth.debug('Checking org code with domains', { orgCode, domains });
        return Array.isArray(domains) && domains.includes(domain);
      });

      if (matchedEntry) {
        const [matchedOrgCode] = matchedEntry;
        log.auth.info('Found domain mapping', { domain, orgCode: matchedOrgCode });
        mappedOrgCode = matchedOrgCode;

        const orgName = `${matchedOrgCode} - ${domain.toUpperCase()}`;
        log.auth.debug('Looking for organization by name', { orgName });

        const org = await OrganizationModel.findByName(orgName);
        if (org) {
          log.auth.info('Using existing mapped organization', {
            orgName: org.name,
            orgId: org.id,
          });
          return org.id;
        }
        log.auth.debug('Organization not found, will create new one', { orgName });
      }
    } catch (error) {
      log.auth.error('Failed to parse domain mappings JSON', {
        error: error.message,
        rawValue: config.authentication.external_domain_mappings?.value,
      });
    }
  }

  // 3. Apply fallback policy
  const fallbackAction =
    config.authentication?.external_provisioning_fallback_action?.value || 'require_invite';
  log.auth.debug('Applying fallback policy', { fallbackAction });

  switch (fallbackAction) {
    case 'require_invite':
      throw new Error(`Access denied: Invitation required for domain ${domain}`);

    case 'create_org': {
      log.auth.info('Creating new organization for domain', { domain });
      const orgCode = mappedOrgCode || generateOrgCode();
      const orgName = `${orgCode} - ${domain.toUpperCase()}`;

      if (mappedOrgCode) {
        log.auth.info('Using configured organization code', { orgCode });
      } else {
        log.auth.info('Using generated organization code', { orgCode });
      }

      const newOrg = await OrganizationModel.create({
        name: orgName,
        description: `Auto-created organization for domain ${domain}`,
        is_active: true,
      });
      log.auth.info('Created organization', { orgName, orgId: newOrg.id });
      return newOrg.id;
    }

    case 'deny_access':
      throw new Error(`Access denied: Domain ${domain} is not allowed`);

    default:
      throw new Error(`Access denied: No provisioning policy match for domain ${domain}`);
  }
};

/**
 * Extract email from an external provider profile
 * @param {Object} profile - User profile from external provider
 * @param {string} provider - Provider name for error messaging
 * @returns {string} Extracted email address
 */
const extractProfileEmail = (profile, provider) => {
  const email = profile.mail || profile.email || profile.emails?.[0]?.value;
  if (!email) {
    throw new Error(`No email found in ${provider} profile`);
  }
  return email;
};

/**
 * Extract subject identifier from an external provider profile
 * @param {Object} profile - User profile from external provider
 * @param {string} provider - Provider name for error messaging
 * @returns {string} Extracted subject identifier
 */
const extractProfileSubject = (profile, provider) => {
  let subject = profile.uid || profile.sub || profile.id || profile.cn;

  if (!subject && profile.dn) {
    log.auth.debug('No direct identifier found, extracting from DN', { dn: profile.dn });
    const dnMatch = profile.dn.match(/^uid=(?<id>[^,]+)/i) || profile.dn.match(/^cn=(?<id>[^,]+)/i);
    if (dnMatch) {
      ({ id: subject } = dnMatch.groups);
      log.auth.info('Extracted identifier from DN', { subject });
    }
  }

  if (!subject) {
    log.auth.error('No user identifier found in profile', {
      provider,
      availableFields: Object.keys(profile),
      profileDn: profile.dn,
    });
    throw new Error(`No user identifier found in ${provider} profile`);
  }

  return subject;
};

/**
 * Get the base provider name (strips oidc- prefix)
 * @param {string} provider - Full provider name
 * @returns {string} Base provider name
 */
const getBaseProvider = provider => (provider.startsWith('oidc-') ? 'oidc' : provider);

/**
 * Ensure user has an organization, assigning one if missing
 * @param {Object} user - User model instance
 * @param {string} email - User email for org determination
 * @param {Object} extraFields - Additional fields to update
 */
const ensureUserOrganization = async (user, email, extraFields = {}) => {
  if (!user.organization_id) {
    log.auth.debug('User has no organization, determining organization', { email });
    const organizationId = await determineUserOrganization(email);
    log.auth.info('Assigning user to organization', { organizationId });

    await user.update({
      organization_id: organizationId,
      last_login: new Date(),
      ...extraFields,
    });

    log.auth.info('Updated user with organization_id', {
      organizationId: user.organization_id,
    });
  } else {
    await user.update({ last_login: new Date(), ...extraFields });
  }
};

/**
 * Handle external user authentication and provisioning
 * @param {string} provider - Authentication provider (ldap, oidc, etc.)
 * @param {Object} profile - User profile from external provider
 * @returns {Promise<Object>} User object for authentication
 */
const handleExternalUser = async (provider, profile) => {
  const { user: UserModel, credential: CredentialModel } = db;

  try {
    log.auth.debug('Processing external user', { provider, profile });

    const email = extractProfileEmail(profile, provider);
    const subject = extractProfileSubject(profile, provider);

    // Credentials are stored under the FULL provider identity — 'ldap' or 'oidc-<name>' (the
    // configured oidc_providers yaml key) — so each provider gets its own subject namespace:
    // two IdPs issuing the same `sub` must NOT resolve to the same credential (cross-provider
    // login-as / wrong-user back-channel revocation). users.auth_provider keeps the BASE type
    // (contract C1); only the credential rows carry the specific provider.

    log.auth.debug('External user identified', { provider, email, subject });

    // 1. Check if credential already exists (existing external user)
    log.auth.debug('Looking for existing credential', { provider, subject });

    const credential = await CredentialModel.findByProviderAndSubject(provider, subject);
    log.auth.debug('Credential search result', {
      found: !!credential,
      credentialId: credential?.id,
    });

    if (credential) {
      log.auth.info('Found existing credential, updating profile', { provider });
      await credential.updateProfile(profile);

      const user = await UserModel.findByPk(credential.user_id);
      if (!user || !user.is_active) {
        throw new Error('User account is inactive');
      }

      await ensureUserOrganization(user, email);
      return user;
    }

    // 2. Check if user exists by email (link external account to existing user)
    let user = await UserModel.findByEmail(email);
    if (user) {
      // §4 (do-NOT-copy from BoxVault): require a provider-verified email before linking an
      // OIDC identity onto an existing account — otherwise an attacker who registers an OIDC
      // account with the victim's (unverified) email could take over the victim's local account.
      // Subject-based linking (branch 1 above) is unaffected; this gate guards only email linking.
      if (provider.startsWith('oidc-') && profile.email_verified !== true) {
        log.auth.warn('Refusing to link OIDC identity to existing account: email not verified', {
          provider,
          email,
        });
        throw new Error('Cannot link this identity: the provider did not verify the email address');
      }

      log.auth.info('Linking external account to existing user', { provider, email });

      const baseProvider = getBaseProvider(provider);
      await ensureUserOrganization(user, email, {
        auth_provider: baseProvider,
        external_id: subject,
        linked_at: new Date(),
      });

      // Create credential link if not exists
      try {
        await CredentialModel.linkToUser(user.id, provider, { ...profile, subject });
      } catch {
        log.auth.debug('Credential may already exist, updating profile');
      }

      return user;
    }

    // 3. New external user - apply provisioning policy
    const organizationId = await determineUserOrganization(email);

    log.auth.info('Creating new external user', { provider, email });
    log.auth.info('Assigning user to organization', { organizationId });

    const baseProvider = getBaseProvider(provider);

    user = await UserModel.create({
      username: profile.displayName || profile.cn || email.split('@')[0],
      email,
      password_hash: 'external',
      role: config.authentication?.external_provisioning_default_role?.value || 'user',
      organization_id: organizationId,
      auth_provider: baseProvider,
      external_id: subject,
      linked_at: new Date(),
      last_login: new Date(),
      is_active: true,
    });

    log.auth.info('Created user with organization_id', { organizationId: user.organization_id });

    // Create credential record
    log.auth.debug('Creating credential', { userId: user.id, provider, subject });
    try {
      const newCredential = await CredentialModel.linkToUser(user.id, provider, {
        ...profile,
        subject,
      });
      log.auth.info('Created credential successfully', {
        credentialId: newCredential.id,
        subject: newCredential.subject,
      });
    } catch (credentialError) {
      log.auth.error('Failed to create credential', { error: credentialError.message });
      throw credentialError;
    }

    // Verify what's actually in the database
    const dbUser = await UserModel.findByPk(user.id, {
      include: [
        {
          association: 'organization',
        },
      ],
    });
    log.auth.debug('Database verification', {
      userId: dbUser.id,
      email: dbUser.email,
      organizationId: dbUser.organization_id,
    });
    if (dbUser.organization) {
      log.auth.debug('Database verification - Organization found', {
        orgName: dbUser.organization.name,
        orgId: dbUser.organization.id,
      });
    } else {
      log.auth.warn('Database verification - NO ORGANIZATION FOUND IN DATABASE');
    }

    log.auth.info('Created new external user', {
      provider,
      username: user.username,
      email: user.email,
    });
    return user;
  } catch (error) {
    log.auth.error('External user handling failed', { error: error.message });
    throw error;
  }
};

/**
 * LDAP passport strategy backed by ldapts (search-then-bind).
 *
 * Replaces passport-ldapauth, whose underlying ldapjs is decommissioned. Reads
 * `username`/`password` from the request body (the shape ldapLogin sends),
 * verifies them via ldapClient.authenticateLdapUser, then provisions the user
 * through the shared handleExternalUser flow. Implements just the surface
 * passport needs (`name` + `authenticate`, using the success/fail/error helpers
 * passport injects onto the strategy per request).
 */
class LdapStrategy {
  constructor() {
    this.name = 'ldap';
  }

  authenticate(req) {
    const username = req.body?.username;
    const password = req.body?.password;

    if (!username || !password) {
      this.fail({ message: 'Missing LDAP credentials' }, 400);
      return;
    }

    authenticateLdapUser(username, password)
      .then(async ldapUser => {
        log.auth.info('LDAP authentication successful for user', {
          user: ldapUser.uid || ldapUser.cn || username,
        });
        const result = await handleExternalUser('ldap', ldapUser);
        log.auth.info('LDAP user processing complete', { username: result.username });
        this.success(result);
      })
      .catch(error => {
        if (error.ldapAuthFailure) {
          log.auth.info('LDAP authentication failed', { user: username });
          this.fail({ message: 'LDAP authentication failed' });
        } else {
          log.auth.error('LDAP Strategy error', { error: error.message, stack: error.stack });
          this.error(error);
        }
      });
  }
}

/**
 * LDAP Strategy - External authentication via LDAP
 */
const setupLdapStrategy = async () => {
  // Wait for database to be ready before setting up strategies
  try {
    // Test database access with new schema
    const { user: UserModel } = db;
    await UserModel.findOne({ limit: 1 }); // Test query to ensure schema is ready
  } catch {
    log.database.info('Database not ready yet, waiting for migrations to complete');
    // Wait a bit for migrations to finish
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  }

  // Only setup LDAP if enabled in configuration
  if (!config.authentication?.ldap_enabled?.value) {
    log.auth.info('LDAP authentication disabled in configuration');
    return;
  }

  log.auth.info('Setting up LDAP authentication strategy (ldapts)');
  passport.use('ldap', new LdapStrategy());
  log.auth.info('LDAP authentication strategy configured successfully');
};

/**
 * Setup a single OIDC provider strategy
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

  // Authenticate to the token endpoint with client_secret_basic (HTTP Basic). Be explicit:
  // the STARTcloud IdP registers every secret'd client as CLIENT_SECRET_BASIC only, and relying
  // on openid-client's default auth method yields an invalid_client "authentication_method"
  // mismatch at the token exchange. Matches the refresh/revoke middleware (also Basic).
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
        // Pass req so the verify callback can stash the OIDC tokens in express-session.
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

          // SAFE token model (contract §4): stash the OIDC tokens SERVER-SIDE in the session —
          // NEVER in the app JWT. FavoritesController + the oidcTokenRefresh middleware read
          // req.session.oidc; the browser only ever receives its normal app JWT. `sid` is kept for
          // OIDC back-channel-logout correlation (T9); `expires_at` drives the refresh check.
          if (req.session) {
            // Fresh session id at the login privilege boundary (fixation guard). Safe here:
            // the openid-client state key was already consumed before the verify callback,
            // and the oidcProvider/oidcSilent flags were read by the controller beforehand.
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
              // Bind the stash to the user it was minted for. Every consumer (favorites,
              // refresh, logout) verifies this against the requesting JWT's userId — without
              // it, a shared browser session could serve one account's IdP tokens to another
              // account's app JWT (cross-account claims/favorites leak).
              userId: result.id,
              provider: strategyName,
              access_token: tokens.access_token,
              id_token: tokens.id_token,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt,
              sid: userinfo.sid,
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
const setupOidcProviders = async () => {
  // Wait for database to be ready before setting up strategies
  try {
    // Test database access with new schema
    const { user: UserModel } = db;
    await UserModel.findOne({ limit: 1 }); // Test query to ensure schema is ready
  } catch {
    log.database.info('Database not ready yet, waiting for migrations to complete');
    // Wait a bit for migrations to finish
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  }

  // Get OIDC providers from nested configuration structure
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

// Initialize strategies if enabled
await setupLdapStrategy();
await setupOidcProviders();

/**
 * Get the discovered OIDC Configuration for a provider (used by the token-refresh middleware
 * to reach the token endpoint + server metadata).
 * @param {string} providerName - Provider identifier (without the `oidc-` prefix)
 * @returns {import('openid-client').Configuration|undefined}
 */
export const getOidcConfiguration = providerName => oidcConfigurations.get(providerName);

export default passport;
