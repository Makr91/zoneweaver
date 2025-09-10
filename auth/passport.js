import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LdapStrategy } from 'passport-ldapauth';
import * as client from 'openid-client';
import { Strategy as OidcStrategy } from 'openid-client/passport';
import { loadConfig } from '../utils/config.js';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';

// Load config directly to avoid circular dependency with index.js
const config = loadConfig();

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

        if (!user) {
          return done(null, false, { message: 'Invalid token - user not found' });
        }

        // Return user object in same format as existing middleware
        return done(null, {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
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
 * LDAP Strategy - External authentication via LDAP
 */
async function setupLdapStrategy() {
  // Wait for database to be ready before setting up strategies
  try {
    // Test database access with new schema
    const { user: UserModel } = db;
    await UserModel.findOne({ limit: 1 }); // Test query to ensure schema is ready
  } catch {
    log.database.info('Database not ready yet, waiting for migrations to complete');
    // Wait a bit for migrations to finish
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Only setup LDAP if enabled in configuration
  if (!config.authentication?.ldap_enabled?.value) {
    log.auth.info('LDAP authentication disabled in configuration');
    return;
  }

  log.auth.info('Setting up LDAP authentication strategy');
  log.auth.debug('LDAP Configuration', {
    url: config.authentication.ldap_url.value,
    bindDn: config.authentication.ldap_bind_dn.value,
    searchBase: config.authentication.ldap_search_base.value,
    searchFilter: config.authentication.ldap_search_filter.value,
    searchAttributes: config.authentication.ldap_search_attributes.value,
    tlsRejectUnauthorized: config.authentication.ldap_tls_reject_unauthorized?.value
  });

  passport.use(
    'ldap',
    new LdapStrategy(
      {
        server: {
          url: config.authentication.ldap_url.value,
          bindDN: config.authentication.ldap_bind_dn.value,
          bindCredentials: config.authentication.ldap_bind_credentials.value,
          searchBase: config.authentication.ldap_search_base.value,
          searchFilter: config.authentication.ldap_search_filter.value,
          searchAttributes: config.authentication.ldap_search_attributes.value
            .split(',')
            .map(s => s.trim()) || ['displayName', 'mail', 'memberOf'],
          tlsOptions: {
            rejectUnauthorized: config.authentication.ldap_tls_reject_unauthorized?.value || false,
          },
        },
      },
      async (ldapUser, done) => {
        try {
          log.auth.info('LDAP authentication successful for user', { 
            user: ldapUser.uid || ldapUser.cn || 'unknown' 
          });
          log.auth.debug('LDAP User Profile', {
            uid: ldapUser.uid,
            cn: ldapUser.cn,
            displayName: ldapUser.displayName,
            mail: ldapUser.mail,
            memberOf: ldapUser.memberOf,
            profileKeys: Object.keys(ldapUser)
          });

          // Handle external user authentication and provisioning
          const result = await handleExternalUser('ldap', ldapUser);
          log.auth.info('LDAP user processing complete', { username: result.username });
          return done(null, result);
        } catch (error) {
          log.auth.error('LDAP Strategy error during user processing', { 
            error: error.message,
            stack: error.stack 
          });
          return done(error, false);
        }
      }
    )
  );

  log.auth.info('LDAP authentication strategy configured successfully');
}

/**
 * OIDC Multiple Providers Strategy Setup
 */
async function setupOidcProviders() {
  // Wait for database to be ready before setting up strategies
  try {
    // Test database access with new schema
    const { user: UserModel } = db;
    await UserModel.findOne({ limit: 1 }); // Test query to ensure schema is ready
  } catch {
    log.database.info('Database not ready yet, waiting for migrations to complete');
    // Wait a bit for migrations to finish
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Get OIDC providers from nested configuration structure
  const oidcProvidersConfig = config.authentication?.oidc_providers?.value || {};

  if (!oidcProvidersConfig || Object.keys(oidcProvidersConfig).length === 0) {
    log.auth.info('No OIDC providers configured');
    return;
  }

  log.auth.info('Setting up OIDC authentication providers', { 
    providerCount: Object.keys(oidcProvidersConfig).length 
  });

  for (const [providerName, providerConfig] of Object.entries(oidcProvidersConfig)) {
    try {
      // Extract values from metadata structure
      const enabled = providerConfig.enabled?.value;
      const displayName = providerConfig.display_name?.value;
      const issuer = providerConfig.issuer?.value;
      const clientId = providerConfig.client_id?.value;
      const clientSecret = providerConfig.client_secret?.value;
      const scope = providerConfig.scope?.value || 'openid profile email';
      const responseType = providerConfig.response_type?.value || 'code';
      // Note: prompt is configured but not currently used in the strategy
      // const prompt = providerConfig.prompt?.value || '';

      // Skip disabled providers
      if (!enabled) {
        log.auth.info('Skipping disabled OIDC provider', { providerName });
        continue;
      }

      // Validate required fields
      if (!issuer || !clientId || !clientSecret) {
        log.auth.error('Invalid OIDC provider configuration: missing required fields', { 
          providerName,
          missingFields: ['issuer', 'client_id', 'client_secret']
        });
        continue;
      }

      log.auth.info('Setting up OIDC provider', { 
        providerName,
        displayName,
        issuer,
        clientId,
        scope,
        responseType
      });

      // Use discovery for automatic configuration (best practice)
      const oidcConfig = await client.discovery(new URL(issuer), clientId, clientSecret);

      const strategyName = `oidc-${providerName}`;
      passport.use(
        strategyName,
        new OidcStrategy(
          {
            name: strategyName,
            config: oidcConfig,
            scope,
            callbackURL: `${config.frontend.frontend_url.value}/api/auth/oidc/callback`,
          },
          async (tokens, verified) => {
            try {
              log.auth.info('OIDC authentication successful for provider', { providerName });

              // Extract user info from tokens
              const userinfo = tokens.claims();
              log.auth.debug('OIDC User Claims', {
                providerName,
                subject: userinfo.sub,
                email: userinfo.email,
                name: userinfo.name || `${userinfo.given_name} ${userinfo.family_name}`,
                profileKeys: Object.keys(userinfo)
              });

              // Handle external user authentication and provisioning with provider info
              const result = await handleExternalUser(`oidc-${providerName}`, userinfo);
              log.auth.info('OIDC user processing complete', { 
                providerName, 
                username: result.username 
              });

              return verified(null, result);
            } catch (error) {
              log.auth.error('OIDC Strategy error during user processing', {
                providerName,
                error: error.message,
                stack: error.stack
              });
              return verified(error, false);
            }
          }
        )
      );

      log.auth.info('OIDC provider configured successfully', { 
        providerName, 
        strategyName 
      });
    } catch (error) {
      log.auth.error('Failed to setup OIDC provider', { 
        providerName, 
        error: error.message 
      });
      continue; // Continue with other providers even if one fails
    }
  }

  log.auth.info('OIDC provider setup completed');
}

/**
 * Handle external user authentication and provisioning
 * @param {string} provider - Authentication provider (ldap, oidc, etc.)
 * @param {Object} profile - User profile from external provider
 * @returns {Promise<Object>} User object for authentication
 */
async function handleExternalUser(provider, profile) {
  const { user: UserModel, credential: CredentialModel, organization: OrganizationModel } = db;

  try {
    log.auth.debug('Processing external user', { provider, profile });

    // Extract email from profile (different providers have different structures)
    const email = profile.mail || profile.email || profile.emails?.[0]?.value;
    if (!email) {
      throw new Error(`No email found in ${provider} profile`);
    }

    // Extract user identifier (subject) - handle different LDAP server formats
    let subject = profile.uid || profile.sub || profile.id || profile.cn;

    // If no direct identifier, try to extract from DN (Distinguished Name)
    if (!subject && profile.dn) {
      log.auth.debug('No direct identifier found, extracting from DN', { dn: profile.dn });
      const dnMatch = profile.dn.match(/^uid=([^,]+)/i) || profile.dn.match(/^cn=([^,]+)/i);
      if (dnMatch) {
        subject = dnMatch[1];
        log.auth.info('Extracted identifier from DN', { subject });
      }
    }

    if (!subject) {
      log.auth.error('No user identifier found in profile', { 
        provider,
        availableFields: Object.keys(profile),
        profileDn: profile.dn 
      });
      throw new Error(`No user identifier found in ${provider} profile`);
    }

    log.auth.debug('External user identified', { provider, email, subject });

    // 1. Check if credential already exists (existing external user)
    log.auth.debug('Looking for existing credential', { provider, subject });

    // Debug: Show all credentials for this provider
    const allCredentials = await CredentialModel.findAll({
      where: { provider },
      attributes: ['id', 'provider', 'subject', 'user_id', 'external_email'],
    });
    log.auth.debug('All credentials in DB for provider', {
      provider,
      credentials: allCredentials.map(c => ({
        id: c.id,
        subject: c.subject,
        email: c.external_email
      }))
    });

    const credential = await CredentialModel.findByProviderAndSubject(provider, subject);
    log.auth.debug('Credential search result', {
      found: !!credential,
      credentialId: credential?.id
    });

    if (credential) {
      log.auth.info('Found existing credential, updating profile', { provider });
      await credential.updateProfile(profile);

      const user = await UserModel.findByPk(credential.user_id);
      if (!user || !user.is_active) {
        throw new Error('User account is inactive');
      }

      // If user doesn't have an organization, assign one
      if (!user.organization_id) {
        log.auth.debug('Credential user has no organization, determining organization', { email });
        const organizationId = await determineUserOrganization(email, profile);
        log.auth.info('Assigning credential user to organization', { organizationId });

        await user.update({
          organization_id: organizationId,
          last_login: new Date(),
        });

        log.auth.info('Updated credential user with organization_id', { 
          organizationId: user.organization_id 
        });
      } else {
        // Update last login
        await user.update({ last_login: new Date() });
      }

      return user;
    }

    // 2. Check if user exists by email (link external account to existing user)
    let user = await UserModel.findByEmail(email);
    if (user) {
      log.auth.info('Linking external account to existing user', { provider, email });

      const baseProvider = provider.startsWith('oidc-') ? 'oidc' : provider;

      // If user doesn't have an organization, assign one
      if (!user.organization_id) {
        log.auth.debug('User has no organization, determining organization', { email });
        const organizationId = await determineUserOrganization(email, profile);
        log.auth.info('Assigning existing user to organization', { organizationId });

        await user.update({
          organization_id: organizationId,
          auth_provider: baseProvider,
          external_id: subject,
          linked_at: new Date(),
          last_login: new Date(),
        });

        log.auth.info('Updated existing user with organization_id', { 
          organizationId: user.organization_id 
        });
      } else {
        // Update user's auth provider and linked timestamp
        await user.update({
          auth_provider: baseProvider,
          external_id: subject,
          linked_at: new Date(),
          last_login: new Date(),
        });
      }

      // Create credential link if not exists
      try {
        await CredentialModel.linkToUser(user.id, provider, { ...profile, subject });
      } catch {
        // Credential might already exist, just update profile
        log.auth.debug('Credential may already exist, updating profile');
      }

      return user;
    }

    // 3. New external user - apply provisioning policy
    const organizationId = await determineUserOrganization(email, profile);

    log.auth.info('Creating new external user', { provider, email });
    log.auth.info('Assigning user to organization', { organizationId });

    const baseProvider = provider.startsWith('oidc-') ? 'oidc' : provider;

    // Create new user
    user = await UserModel.create({
      username: profile.displayName || profile.cn || email.split('@')[0],
      email,
      password_hash: 'external', // External users don't have passwords
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
      const credential = await CredentialModel.linkToUser(user.id, provider, {
        ...profile,
        subject,
      });
      log.auth.info('Created credential successfully', { 
        credentialId: credential.id, 
        subject: credential.subject 
      });
    } catch (credentialError) {
      log.auth.error('Failed to create credential', { error: credentialError.message });
      throw credentialError;
    }

    // Verify what's actually in the database
    const dbUser = await UserModel.findByPk(user.id, {
      include: [
        {
          model: OrganizationModel,
          as: 'organization',
        },
      ],
    });
    log.auth.debug('Database verification', {
      userId: dbUser.id,
      email: dbUser.email,
      organizationId: dbUser.organization_id
    });
    if (dbUser.organization) {
      log.auth.debug('Database verification - Organization found', {
        orgName: dbUser.organization.name,
        orgId: dbUser.organization.id
      });
    } else {
      log.auth.warn('Database verification - NO ORGANIZATION FOUND IN DATABASE');
    }

    log.auth.info('Created new external user', { 
      provider, 
      username: user.username, 
      email: user.email 
    });
    return user;
  } catch (error) {
    log.auth.error('External user handling failed', { error: error.message });
    throw error;
  }
}

/**
 * Determine organization for external user
 * @param {string} email - User email address
 * @param {Object} _profile - External user profile (currently unused)
 * @returns {Promise<number>} Organization ID
 */
async function determineUserOrganization(email, _profile) {
  const { organization: OrganizationModel, invitation: InvitationModel } = db;
  const domain = email.split('@')[1];
  let mappedOrgCode = null; // Track if we found a domain mapping

  log.auth.debug('Determining organization for domain', { domain });

  // 1. Check pending invitation (highest priority)
  const invitation = await InvitationModel.findOne({
    where: {
      email,
      used_at: null,
      expires_at: {
        [db.Sequelize.Op.gt]: new Date(),
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
      organizationId: invitation.organization_id 
    });

    // Mark invitation as used
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

      for (const [orgCode, domains] of Object.entries(mappings)) {
        log.auth.debug('Checking org code with domains', { orgCode, domains });
        if (Array.isArray(domains) && domains.includes(domain)) {
          log.auth.info('Found domain mapping', { domain, orgCode });
          mappedOrgCode = orgCode; // Store the found mapping

          // Construct organization name from code and domain
          const orgName = `${orgCode} - ${domain.toUpperCase()}`;
          log.auth.debug('Looking for organization by name', { orgName });

          const org = await OrganizationModel.findByName(orgName);
          if (org) {
            log.auth.info('Using existing mapped organization', { 
              orgName: org.name, 
              orgId: org.id 
            });
            return org.id;
          } else {
            log.auth.debug('Organization not found, will create new one', { orgName });
            // No existing org found, but we have a domain mapping - break to use create_org with mapped code
            break;
          }
        }
      }
    } catch (error) {
      log.auth.error('Failed to parse domain mappings JSON', { 
        error: error.message,
        rawValue: config.authentication.external_domain_mappings?.value 
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
      // Use mapped organization code if found, otherwise generate random code
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
}

/**
 * Generate a random organization code (hexcode format)
 * @returns {string} Random 6-character hexcode
 */
function generateOrgCode() {
  return Math.random().toString(16).substr(2, 6).toUpperCase();
}

// Initialize strategies if enabled
await setupLdapStrategy();
await setupOidcProviders();

export default passport;
