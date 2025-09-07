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
  secretOrKey: config.authentication.jwt_secret.value,
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
  // Wait for database to be ready before setting up strategies
  try {
    // Test database access with new schema
    const { user: UserModel } = db;
    await UserModel.findOne({ limit: 1 }); // Test query to ensure schema is ready
  } catch (error) {
    console.log('⏳ Database not ready yet, waiting for migrations to complete...');
    // Wait a bit for migrations to finish
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Only setup LDAP if enabled in configuration
  if (!config.authentication?.ldap_enabled?.value) {
    console.log('🔧 LDAP authentication disabled in configuration');
    return;
  }

  console.log('🔧 Setting up LDAP authentication strategy...');
  console.log('📋 LDAP Configuration:');
  console.log('  URL:', config.authentication.ldap_url.value);
  console.log('  Bind DN:', config.authentication.ldap_bind_dn.value);
  console.log('  Search Base:', config.authentication.ldap_search_base.value);
  console.log('  Search Filter:', config.authentication.ldap_search_filter.value);
  console.log('  Search Attributes:', config.authentication.ldap_search_attributes.value);
  console.log('  TLS Reject Unauthorized:', config.authentication.ldap_tls_reject_unauthorized?.value);

  passport.use('ldap', new LdapStrategy({
    server: {
      url: config.authentication.ldap_url.value,
      bindDN: config.authentication.ldap_bind_dn.value,
      bindCredentials: config.authentication.ldap_bind_credentials.value,
      searchBase: config.authentication.ldap_search_base.value,
      searchFilter: config.authentication.ldap_search_filter.value,
      searchAttributes: config.authentication.ldap_search_attributes.value.split(',').map(s => s.trim()) || ['displayName', 'mail', 'memberOf'],
      tlsOptions: {
        rejectUnauthorized: config.authentication.ldap_tls_reject_unauthorized?.value || false
      }
    }
  }, async (ldapUser, done) => {
    try {
      console.log('🔐 LDAP authentication successful for user:', ldapUser.uid || ldapUser.cn || 'unknown');
      console.log('📄 LDAP User Profile:');
      console.log('  UID:', ldapUser.uid);
      console.log('  CN:', ldapUser.cn);
      console.log('  Display Name:', ldapUser.displayName);
      console.log('  Mail:', ldapUser.mail);
      console.log('  Member Of:', ldapUser.memberOf);
      console.log('  Raw Profile Keys:', Object.keys(ldapUser));
      
      // Handle external user authentication and provisioning
      const result = await handleExternalUser('ldap', ldapUser);
      console.log('✅ LDAP user processing complete:', result.username);
      return done(null, result);
      
    } catch (error) {
      console.error('❌ LDAP Strategy error during user processing:', error.message);
      console.error('❌ Error stack:', error.stack);
      return done(error, false);
    }
  }));

  console.log('✅ LDAP authentication strategy configured successfully');
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

    // Extract user identifier (subject) - handle different LDAP server formats
    let subject = profile.uid || profile.sub || profile.id || profile.cn;
    
    // If no direct identifier, try to extract from DN (Distinguished Name)
    if (!subject && profile.dn) {
      console.log(`🔍 No direct identifier found, extracting from DN: ${profile.dn}`);
      const dnMatch = profile.dn.match(/^uid=([^,]+)/i) || profile.dn.match(/^cn=([^,]+)/i);
      if (dnMatch) {
        subject = dnMatch[1];
        console.log(`✅ Extracted identifier from DN: ${subject}`);
      }
    }
    
    if (!subject) {
      console.error('❌ Available profile fields:', Object.keys(profile));
      console.error('❌ Profile DN:', profile.dn);
      throw new Error(`No user identifier found in ${provider} profile`);
    }

    console.log(`🔍 ${provider} user - email: ${email}, subject: ${subject}`);

    // 1. Check if credential already exists (existing external user)
    console.log(`🔍 Looking for existing credential: provider=${provider}, subject=${subject}`);
    
    // Debug: Show all credentials for this provider
    const allCredentials = await CredentialModel.findAll({ 
      where: { provider: provider },
      attributes: ['id', 'provider', 'subject', 'user_id', 'external_email']
    });
    console.log(`🔍 All ${provider} credentials in DB:`, allCredentials.map(c => `ID:${c.id} subject:${c.subject} email:${c.external_email}`));
    
    let credential = await CredentialModel.findByProviderAndSubject(provider, subject);
    console.log(`🔍 Credential search result:`, credential ? `Found credential ID ${credential.id}` : 'No credential found');
    
    if (credential) {
      console.log(`✅ Found existing ${provider} credential, updating profile...`);
      await credential.updateProfile(profile);
      
      const user = await UserModel.findByPk(credential.user_id);
      if (!user || !user.is_active) {
        throw new Error('User account is inactive');
      }
      
      // If user doesn't have an organization, assign one
      if (!user.organization_id) {
        console.log(`🔍 Credential user ${email} has no organization, determining organization...`);
        const organizationId = await determineUserOrganization(email, profile);
        console.log(`🏢 Assigning credential user to organization ID: ${organizationId}`);
        
        await user.update({
          organization_id: organizationId,
          last_login: new Date()
        });
        
        console.log(`✅ Updated credential user with organization_id: ${user.organization_id}`);
      } else {
        // Update last login
        await user.update({ last_login: new Date() });
      }
      
      return user;
    }

    // 2. Check if user exists by email (link external account to existing user)
    let user = await UserModel.findByEmail(email);
    if (user) {
      console.log(`🔗 Linking ${provider} account to existing user: ${email}`);
      
      // If user doesn't have an organization, assign one
      if (!user.organization_id) {
        console.log(`🔍 User ${email} has no organization, determining organization...`);
        const organizationId = await determineUserOrganization(email, profile);
        console.log(`🏢 Assigning existing user to organization ID: ${organizationId}`);
        
        await user.update({
          organization_id: organizationId,
          auth_provider: provider,
          external_id: subject,
          linked_at: new Date(),
          last_login: new Date()
        });
        
        console.log(`✅ Updated existing user with organization_id: ${user.organization_id}`);
      } else {
        // Update user's auth provider and linked timestamp
        await user.update({
          auth_provider: provider,
          external_id: subject,
          linked_at: new Date(),
          last_login: new Date()
        });
      }
      
      // Create credential link if not exists
      try {
        await CredentialModel.linkToUser(user.id, provider, { ...profile, subject });
      } catch (error) {
        // Credential might already exist, just update profile
        console.log(`🔄 Credential may already exist, updating profile...`);
      }
      
      return user;
    }

    // 3. New external user - apply provisioning policy
    const organizationId = await determineUserOrganization(email, profile);
    
    console.log(`👤 Creating new ${provider} user: ${email}`);
    console.log(`🏢 Assigning user to organization ID: ${organizationId}`);
    
    // Create new user
    user = await UserModel.create({
      username: profile.displayName || profile.cn || email.split('@')[0],
      email: email,
      password_hash: 'external', // External users don't have passwords
      role: config.authentication?.external_provisioning_default_role?.value || 'user',
      organization_id: organizationId,
      auth_provider: provider,
      external_id: subject,
      linked_at: new Date(),
      last_login: new Date(),
      is_active: true
    });

    console.log(`✅ Created user with organization_id: ${user.organization_id}`);

    // Create credential record
    console.log(`🔗 Creating credential: userId=${user.id}, provider=${provider}, subject=${subject}`);
    try {
      const credential = await CredentialModel.linkToUser(user.id, provider, { ...profile, subject });
      console.log(`✅ Created credential: ID=${credential.id}, subject=${credential.subject}`);
    } catch (credentialError) {
      console.error(`❌ Failed to create credential:`, credentialError.message);
      throw credentialError;
    }

    // Verify what's actually in the database
    const dbUser = await UserModel.findByPk(user.id, {
      include: [{
        model: OrganizationModel,
        as: 'organization'
      }]
    });
    console.log(`🔍 Database verification - User ID: ${dbUser.id}, Email: ${dbUser.email}, Organization ID: ${dbUser.organization_id}`);
    if (dbUser.organization) {
      console.log(`🔍 Database verification - Organization: ${dbUser.organization.name} (ID: ${dbUser.organization.id})`);
    } else {
      console.log(`🔍 Database verification - NO ORGANIZATION FOUND IN DATABASE!`);
    }

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
  let mappedOrgCode = null; // Track if we found a domain mapping
  
  console.log(`🏢 Determining organization for domain: ${domain}`);

  // 1. Check pending invitation (highest priority)
  const invitation = await InvitationModel.findOne({
    where: { 
      email: email,
      used_at: null,
      expires_at: {
        [db.Sequelize.Op.gt]: new Date()
      }
    },
    attributes: ['id', 'organization_id', 'email', 'invite_code', 'invited_by_user_id', 'expires_at', 'used_at']
  });
  
  if (invitation) {
    console.log(`📧 Found pending invitation for ${email}, using organization: ${invitation.organization_id}`);
    
    // Mark invitation as used
    await invitation.markAsUsed();
    return invitation.organization_id;
  }

  // 2. Check domain mapping
  if (config.authentication?.external_domain_mapping_enabled?.value) {
    try {
      const mappingsJson = config.authentication.external_domain_mappings?.value || '{}';
      console.log(`🔍 Raw domain mappings config: ${mappingsJson}`);
      
      const mappings = JSON.parse(mappingsJson);
      console.log(`🔍 Parsed domain mappings:`, mappings);
      
      for (const [orgCode, domains] of Object.entries(mappings)) {
        console.log(`🔍 Checking org code ${orgCode} with domains:`, domains);
        if (Array.isArray(domains) && domains.includes(domain)) {
          console.log(`🗺️ Found domain mapping: ${domain} -> ${orgCode}`);
          mappedOrgCode = orgCode; // Store the found mapping
          
          // Construct organization name from code and domain
          const orgName = `${orgCode} - ${domain.toUpperCase()}`;
          console.log(`🔍 Looking for organization by name: ${orgName}`);
          
          let org = await OrganizationModel.findByName(orgName);
          if (org) {
            console.log(`✅ Using existing mapped organization: ${org.name} (${org.id})`);
            return org.id;
          } else {
            console.log(`❌ Organization "${orgName}" not found, will create new one`);
            // No existing org found, but we have a domain mapping - break to use create_org with mapped code
            break;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to parse domain mappings JSON:`, error.message);
      console.error(`❌ Raw value:`, config.authentication.external_domain_mappings?.value);
    }
  }

  // 3. Apply fallback policy
  const fallbackAction = config.authentication?.external_provisioning_fallback_action?.value || 'require_invite';
  console.log(`📋 Applying fallback policy: ${fallbackAction}`);
  
  switch (fallbackAction) {
    case 'require_invite':
      throw new Error(`Access denied: Invitation required for domain ${domain}`);
      
    case 'create_org':
      console.log(`🏗️ Creating new organization for domain: ${domain}`);
      // Use mapped organization code if found, otherwise generate random code
      const orgCode = mappedOrgCode || generateOrgCode();
      const orgName = `${orgCode} - ${domain.toUpperCase()}`;
      
      if (mappedOrgCode) {
        console.log(`🗺️ Using configured organization code: ${orgCode}`);
      } else {
        console.log(`🎲 Using generated organization code: ${orgCode}`);
      }
      
      const newOrg = await OrganizationModel.create({
        name: orgName,
        description: `Auto-created organization for domain ${domain}`,
        is_active: true
      });
      console.log(`✅ Created organization: ${orgName} (${newOrg.id})`);
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
