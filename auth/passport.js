import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LdapStrategy } from 'passport-ldapauth';
import { loadConfig } from '../utils/config.js';
import db from '../models/index.js';

// Load config directly to avoid circular dependency with index.js
const config = loadConfig();

/**
 * Passport.js configuration for ZoneWeaver
 * Phase 1: JWT Strategy (replacement for custom JWT middleware)
 */

// JWT Strategy - matches existing custom middleware behavior exactly
passport.use('jwt', new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.authentication?.strategies?.jwt?.secret || 'fallback-secret',
  // Note: Not setting issuer/audience initially to maintain compatibility
}, async (payload, done) => {
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
      role: user.role
    });
  } catch (error) {
    console.error('JWT Strategy error:', error);
    return done(error, false);
  }
}));

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
 * Phase 3: LDAP Authentication
 */
async function setupLdapStrategy() {
  // Only setup LDAP if enabled in configuration
  if (!config.authentication?.strategies?.ldap?.enabled) {
    console.log('LDAP authentication disabled in configuration');
    return;
  }

  console.log('🔧 Setting up LDAP authentication strategy...');

  passport.use('ldap', new LdapStrategy({
    server: {
      url: config.authentication.strategies.ldap.url,
      bindDN: config.authentication.strategies.ldap.bind_dn,
      bindCredentials: config.authentication.strategies.ldap.bind_credentials,
      searchBase: config.authentication.strategies.ldap.search_base,
      searchFilter: config.authentication.strategies.ldap.search_filter,
      searchAttributes: config.authentication.strategies.ldap.search_attributes || ['displayName', 'mail', 'memberOf']
    }
  }, async (ldapUser, done) => {
    try {
      console.log('🔐 LDAP authentication attempt for user:', ldapUser.uid || ldapUser.cn);
      
      // Handle external user authentication and provisioning
      const result = await handleExternalUser('ldap', ldapUser, done);
      return done(null, result);
      
    } catch (error) {
      console.error('❌ LDAP Strategy error:', error.message);
      return done(error, false);
    }
  }));

  console.log('✅ LDAP authentication strategy configured');
}

/**
 * Handle external user authentication and provisioning
 * @param {string} provider - Authentication provider (ldap, oidc, etc.)
 * @param {Object} profile - User profile from external provider
 * @returns {Promise<Object>} User object for authentication
 */
async function handleExternalUser(provider, profile) {
  const { user: UserModel, credential: CredentialModel, organization: OrganizationModel, invitation: InvitationModel } = db;
  
  try {
    console.log(`🔍 Processing ${provider} user:`, profile);
    
    // Extract email from profile (different providers have different structures)
    const email = profile.mail || profile.email || profile.emails?.[0]?.value;
    if (!email) {
      throw new Error(`No email found in ${provider} profile`);
    }

    // Extract user identifier (subject)
    const subject = profile.uid || profile.sub || profile.id || profile.cn;
    if (!subject) {
      throw new Error(`No user identifier found in ${provider} profile`);
    }

    console.log(`🔍 ${provider} user - email: ${email}, subject: ${subject}`);

    // 1. Check if credential already exists (existing external user)
    let credential = await CredentialModel.findByProviderAndSubject(provider, subject);
    if (credential) {
      console.log(`✅ Found existing ${provider} credential, updating profile...`);
      await credential.updateProfile(profile);
      
      const user = await UserModel.findByPk(credential.user_id);
      if (!user || !user.is_active) {
        throw new Error('User account is inactive');
      }
      
      // Update last login
      await user.update({ last_login: new Date() });
      return user;
    }

    // 2. Check if user exists by email (link external account to existing user)
    let user = await UserModel.findByEmail(email);
    if (user) {
      console.log(`🔗 Linking ${provider} account to existing user: ${email}`);
      
      // Create credential link
      await CredentialModel.linkToUser(user.id, provider, profile);
      
      // Update user's auth provider and linked timestamp
      await user.update({
        auth_provider: provider,
        external_id: subject,
        linked_at: new Date(),
        last_login: new Date()
      });
      
      return user;
    }

    // 3. New external user - apply provisioning policy
    const organizationId = await determineUserOrganization(email, profile);
    
    console.log(`👤 Creating new ${provider} user: ${email}`);
    
    // Create new user
    user = await UserModel.create({
      username: profile.displayName || profile.cn || email.split('@')[0],
      email: email,
      password_hash: 'external', // External users don't have passwords
      role: config.authentication?.external_provider_settings?.dynamic_provisioning?.default_role || 'user',
      organization_id: organizationId,
      auth_provider: provider,
      external_id: subject,
      linked_at: new Date(),
      last_login: new Date(),
      is_active: true
    });

    // Create credential record
    await CredentialModel.linkToUser(user.id, provider, profile);

    console.log(`✅ Created new ${provider} user: ${user.username} (${user.email})`);
    return user;

  } catch (error) {
    console.error(`❌ External user handling failed:`, error.message);
    throw error;
  }
}

/**
 * Determine organization for external user
 * @param {string} email - User email address
 * @param {Object} profile - External user profile
 * @returns {Promise<number>} Organization ID
 */
async function determineUserOrganization(email, profile) {
  const { organization: OrganizationModel, invitation: InvitationModel } = db;
  const domain = email.split('@')[1];
  
  console.log(`🏢 Determining organization for domain: ${domain}`);

  // 1. Check pending invitation (highest priority)
  const invitation = await InvitationModel.findOne({
    where: { 
      email: email,
      status: 'pending'
    }
  });
  
  if (invitation) {
    console.log(`📧 Found pending invitation for ${email}, using organization: ${invitation.organization_id}`);
    
    // Mark invitation as used
    await invitation.update({ status: 'accepted' });
    return invitation.organization_id;
  }

  // 2. Check domain mapping
  if (config.authentication?.external_provider_settings?.domain_organization_mapping?.enabled) {
    const mappings = config.authentication.external_provider_settings.domain_organization_mapping.mappings || {};
    
    for (const [orgCode, domains] of Object.entries(mappings)) {
      if (Array.isArray(domains) && domains.includes(domain)) {
        console.log(`🗺️ Found domain mapping: ${domain} -> ${orgCode}`);
        
        const org = await OrganizationModel.findByOrganizationCode(orgCode);
        if (org) {
          console.log(`✅ Using mapped organization: ${org.name} (${org.id})`);
          return org.id;
        }
      }
    }
  }

  // 3. Apply fallback policy
  const fallbackAction = config.authentication?.external_provider_settings?.dynamic_provisioning?.fallback_action || 'require_invite';
  console.log(`📋 Applying fallback policy: ${fallbackAction}`);
  
  switch (fallbackAction) {
    case 'require_invite':
      throw new Error(`Access denied: Invitation required for domain ${domain}`);
      
    case 'create_org':
      console.log(`🏗️ Creating new organization for domain: ${domain}`);
      const newOrg = await OrganizationModel.create({
        name: `${domain} Organization`,
        description: `Auto-created organization for domain ${domain}`,
        organization_code: generateOrgCode(),
        is_active: true
      });
      console.log(`✅ Created organization: ${newOrg.name} (${newOrg.id})`);
      return newOrg.id;
      
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

// Initialize LDAP strategy if enabled
await setupLdapStrategy();

export default passport;
