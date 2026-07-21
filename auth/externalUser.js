import { Op } from '@sequelize/core';
import { loadConfig } from '../utils/config.js';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';

const config = loadConfig();

/**
 * Generate a random organization code (hexcode format)
 * @returns {string} Random 6-character hexcode
 */
const generateOrgCode = () => Math.random().toString(16).substring(2, 8).toUpperCase();

/**
 * Determine organization for external user. Priority: pending invitation, then domain
 * mapping, then the configured fallback policy.
 * @param {string} email - User email address
 * @returns {Promise<number>} Organization ID
 */
const determineUserOrganization = async email => {
  const { organization: OrganizationModel, invitation: InvitationModel } = db;
  const [, domain] = email.split('@');
  let mappedOrgCode = null;

  log.auth.debug('Determining organization for domain', { domain });

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
 * Handle external user authentication and provisioning.
 *
 * Credentials are stored under the FULL provider identity — 'ldap' or 'oidc-<name>' (the
 * configured oidc_providers yaml key) — so each provider gets its own subject namespace:
 * two IdPs issuing the same `sub` must NOT resolve to the same credential (cross-provider
 * login-as / wrong-user back-channel revocation). users.auth_provider keeps the BASE type
 * (contract C1); only the credential rows carry the specific provider.
 *
 * Email-based account linking requires a provider-verified email (§4, do-NOT-copy from
 * BoxVault) — otherwise an attacker who registers an OIDC account with the victim's
 * (unverified) email could take over the victim's local account. Subject-based linking
 * is unaffected; the gate guards only email linking.
 * @param {string} provider - Authentication provider (ldap, oidc, etc.)
 * @param {Object} profile - User profile from external provider
 * @returns {Promise<Object>} User object for authentication
 */
export const handleExternalUser = async (provider, profile) => {
  const { user: UserModel, credential: CredentialModel } = db;

  try {
    log.auth.debug('Processing external user', { provider, profile });

    const email = extractProfileEmail(profile, provider);
    const subject = extractProfileSubject(profile, provider);

    log.auth.debug('External user identified', { provider, email, subject });

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

    let user = await UserModel.findByEmail(email);
    if (user) {
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

      try {
        await CredentialModel.linkToUser(user.id, provider, { ...profile, subject });
      } catch {
        log.auth.debug('Credential may already exist, updating profile');
      }

      return user;
    }

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
