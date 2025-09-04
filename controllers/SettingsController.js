
import fs from 'fs';
import path from 'path';
import * as YAML from 'yaml';
import { loadConfig, getConfigFilePath } from '../utils/config.js';
import db from '../models/index.js';

// Access Sequelize models
const { server: ServerModel } = db;

/**
 * Settings Controller - Manages Zoneweaver system settings
 * Only accessible by super-admin users
 */
class SettingsController {
  static get configPath() {
    return getConfigFilePath();
  }

  static getZoneweaverAPIServerInfo() {
    const config = loadConfig();
    const zapi = config.backend_servers[0];
    if (!zapi) {
      throw new Error('Zoneweaver API server not found in config.yaml');
    }
    return {
      hostname: zapi.hostname,
      port: zapi.port,
      protocol: zapi.protocol
    };
  }

  /**
   * @swagger
   * /api/settings:
   *   get:
   *     summary: Get Zoneweaver system settings (Super-admin only)
   *     description: Retrieve current system configuration settings from config.yaml
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Settings retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 settings:
   *                   type: object
   *                   properties:
   *                     appName:
   *                       type: string
   *                       example: "Zoneweaver"
   *                     appVersion:
   *                       type: string
   *                       example: "2.0.0"
   *                     maxServersPerUser:
   *                       type: integer
   *                       example: 10
   *                     autoRefreshInterval:
   *                       type: integer
   *                       example: 5
   *                     enableNotifications:
   *                       type: boolean
   *                       example: true
   *                     enableDarkMode:
   *                       type: boolean
   *                       example: true
   *                     sessionTimeout:
   *                       type: integer
   *                       example: 24
   *                     allowNewOrganizations:
   *                       type: boolean
   *                       example: true
   *                     enableLogging:
   *                       type: boolean
   *                       example: true
   *                     debugMode:
   *                       type: boolean
   *                       example: false
   *                     serverHostname:
   *                       type: string
   *                       example: "localhost"
   *                     serverPort:
   *                       type: integer
   *                       example: 3001
   *                     frontendPort:
   *                       type: integer
   *                       example: 443
   *                     sslEnabled:
   *                       type: boolean
   *                       example: true
   *                     corsWhitelist:
   *                       type: array
   *                       items:
   *                         type: string
   *                       example: ["https://localhost:3000"]
   *                     backendServers:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           hostname:
   *                             type: string
   *                           port:
   *                             type: integer
   *                           protocol:
   *                             type: string
   *                     databasePath:
   *                       type: string
   *                       example: "./data/zoneweaver.db"
   *                     gravatarApiKey:
   *                       type: string
   *                       example: ""
   *                     mailSmtpHost:
   *                       type: string
   *                       example: "smtp.gmail.com"
   *                     mailSmtpPort:
   *                       type: integer
   *                       example: 587
   *                     mailSmtpSecure:
   *                       type: boolean
   *                       example: false
   *                     mailSmtpUser:
   *                       type: string
   *                       example: "noreply@example.com"
   *                     mailSmtpPassword:
   *                       type: string
   *                       example: ""
   *                     mailFromAddress:
   *                       type: string
   *                       example: "noreply@example.com"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async getSettings(req, res) {
    try {
      const config = loadConfig();
      
      // Return the entire configuration structure
      // Frontend can dynamically generate forms from metadata
      res.json({
        success: true,
        config: config
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load settings: ' + error.message
      });
    }
  }

  /**
   * @swagger
   * /api/settings:
   *   put:
   *     summary: Update Zoneweaver system settings (Super-admin only)
   *     description: Update system configuration settings and save to config.yaml
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               appName:
   *                 type: string
   *                 example: "Zoneweaver"
   *               appVersion:
   *                 type: string
   *                 example: "2.0.0"
   *               maxServersPerUser:
   *                 type: integer
   *                 example: 10
   *               autoRefreshInterval:
   *                 type: integer
   *                 example: 5
   *               enableNotifications:
   *                 type: boolean
   *                 example: true
   *               enableDarkMode:
   *                 type: boolean
   *                 example: true
   *               sessionTimeout:
   *                 type: integer
   *                 example: 24
   *               allowNewOrganizations:
   *                 type: boolean
   *                 example: true
   *               enableLogging:
   *                 type: boolean
   *                 example: true
   *               debugMode:
   *                 type: boolean
   *                 example: false
   *               serverHostname:
   *                 type: string
   *                 example: "localhost"
   *               serverPort:
   *                 type: integer
   *                 example: 3001
   *               frontendPort:
   *                 type: integer
   *                 example: 443
   *               sslEnabled:
   *                 type: boolean
   *                 example: true
   *               corsWhitelist:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["https://localhost:3000"]
   *               databasePath:
   *                 type: string
   *                 example: "./data/zoneweaver.db"
   *               gravatarApiKey:
   *                 type: string
   *                 example: ""
   *               mailSmtpHost:
   *                 type: string
   *                 example: "smtp.gmail.com"
   *               mailSmtpPort:
   *                 type: integer
   *                 example: 587
   *               mailSmtpSecure:
   *                 type: boolean
   *                 example: false
   *               mailSmtpUser:
   *                 type: string
   *                 example: "noreply@example.com"
   *               mailSmtpPassword:
   *                 type: string
   *                 example: "password123"
   *               mailFromAddress:
   *                 type: string
   *                 example: "noreply@example.com"
   *     responses:
   *       200:
   *         description: Settings updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Settings updated successfully. Some changes may require a server restart to take effect."
   *                 requiresRestart:
   *                   type: boolean
   *                   description: Whether the changes require a server restart
   *                   example: false
   *                 backupPath:
   *                   type: string
   *                   description: Path to backup file created before update
   *                   example: "./config.yaml.backup.1641234567890"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async updateSettings(req, res) {
    try {
      const newSettings = req.body;
      
      // Load current config
      const configFile = fs.readFileSync(SettingsController.configPath, 'utf8');
      let config = YAML.parse(configFile);

      // Update config with new settings - preserve existing structure
      config.app = config.app || {};
      if (newSettings.appName !== undefined) config.app.name = newSettings.appName;
      if (newSettings.appVersion !== undefined) config.app.version = newSettings.appVersion;
      if (newSettings.frontendUrl !== undefined) config.app.frontend_url = newSettings.frontendUrl;

      // Limits
      config.limits = config.limits || {};
      if (newSettings.maxServersPerUser !== undefined) config.limits.maxServersPerUser = newSettings.maxServersPerUser;

      // Frontend settings
      config.frontend = config.frontend || {};
      if (newSettings.autoRefreshInterval !== undefined) config.frontend.autoRefreshInterval = newSettings.autoRefreshInterval;
      if (newSettings.enableNotifications !== undefined) config.frontend.enableNotifications = newSettings.enableNotifications;
      if (newSettings.enableDarkMode !== undefined) config.frontend.enableDarkMode = newSettings.enableDarkMode;
      if (newSettings.frontendPort !== undefined) config.frontend.port = newSettings.frontendPort;

      // Environment
      config.environment = config.environment || {};
      if (newSettings.trustProxy !== undefined) config.environment.trust_proxy = newSettings.trustProxy;

      // Logging
      config.logging = config.logging || {};
      if (newSettings.enableLogging !== undefined) config.logging.enabled = newSettings.enableLogging;
      if (newSettings.loggingLevel !== undefined) config.logging.level = newSettings.loggingLevel;
      if (newSettings.debugMode !== undefined) {
        config.logging.level = newSettings.debugMode ? 'debug' : 'info';
      }

      // Server settings
      config.server = config.server || {};
      config.server.ssl = config.server.ssl || {};
      if (newSettings.serverHostname !== undefined) config.server.hostname = newSettings.serverHostname;
      if (newSettings.serverPort !== undefined) config.server.port = newSettings.serverPort;
      if (newSettings.sslEnabled !== undefined) config.server.ssl.enabled = newSettings.sslEnabled;
      if (newSettings.sslGenerateEnabled !== undefined) config.server.ssl.generate_ssl = newSettings.sslGenerateEnabled;
      if (newSettings.sslKeyPath !== undefined) config.server.ssl.key = newSettings.sslKeyPath;
      if (newSettings.sslCertPath !== undefined) config.server.ssl.cert = newSettings.sslCertPath;

      // CORS settings
      config.cors = config.cors || {};
      config.cors.options = config.cors.options || {};
      if (newSettings.corsWhitelist !== undefined) config.cors.whitelist = newSettings.corsWhitelist;
      if (newSettings.corsOrigin !== undefined) config.cors.options.origin = newSettings.corsOrigin;
      if (newSettings.corsPreflightContinue !== undefined) config.cors.options.preflightContinue = newSettings.corsPreflightContinue;
      if (newSettings.corsCredentials !== undefined) config.cors.options.credentials = newSettings.corsCredentials;

      // Authentication settings (be careful with these)
      config.authentication = config.authentication || {};
      config.authentication.strategies = config.authentication.strategies || {};
      
      if (newSettings.authEnabledStrategies !== undefined) config.authentication.enabled_strategies = newSettings.authEnabledStrategies;
      if (newSettings.authDefaultStrategy !== undefined) config.authentication.default_strategy = newSettings.authDefaultStrategy;

      // JWT settings
      config.authentication.strategies.jwt = config.authentication.strategies.jwt || {};
      if (newSettings.jwtSecret !== undefined) config.authentication.strategies.jwt.secret = newSettings.jwtSecret;
      if (newSettings.jwtExpiration !== undefined) config.authentication.strategies.jwt.expiration = newSettings.jwtExpiration;
      if (newSettings.jwtIssuer !== undefined) config.authentication.strategies.jwt.issuer = newSettings.jwtIssuer;
      if (newSettings.jwtAudience !== undefined) config.authentication.strategies.jwt.audience = newSettings.jwtAudience;

      // Local auth settings
      config.authentication.strategies.local = config.authentication.strategies.local || {};
      config.authentication.strategies.local.password_policy = config.authentication.strategies.local.password_policy || {};
      if (newSettings.localEnabled !== undefined) config.authentication.strategies.local.enabled = newSettings.localEnabled;
      if (newSettings.localRequireEmailVerification !== undefined) config.authentication.strategies.local.require_email_verification = newSettings.localRequireEmailVerification;
      if (newSettings.localPasswordMinLength !== undefined) config.authentication.strategies.local.password_policy.min_length = newSettings.localPasswordMinLength;
      if (newSettings.localPasswordRequireUppercase !== undefined) config.authentication.strategies.local.password_policy.require_uppercase = newSettings.localPasswordRequireUppercase;
      if (newSettings.localPasswordRequireLowercase !== undefined) config.authentication.strategies.local.password_policy.require_lowercase = newSettings.localPasswordRequireLowercase;
      if (newSettings.localPasswordRequireNumbers !== undefined) config.authentication.strategies.local.password_policy.require_numbers = newSettings.localPasswordRequireNumbers;
      if (newSettings.localPasswordRequireSymbols !== undefined) config.authentication.strategies.local.password_policy.require_symbols = newSettings.localPasswordRequireSymbols;
      if (newSettings.localBcryptRounds !== undefined) config.authentication.strategies.local.bcrypt_rounds = newSettings.localBcryptRounds;
      if (newSettings.sessionTimeout !== undefined) config.authentication.strategies.local.session_timeout = newSettings.sessionTimeout;
      if (newSettings.allowNewOrganizations !== undefined) config.authentication.strategies.local.allow_new_organizations = newSettings.allowNewOrganizations;

      // LDAP settings
      config.authentication.strategies.ldap = config.authentication.strategies.ldap || {};
      config.authentication.strategies.ldap.tls_options = config.authentication.strategies.ldap.tls_options || {};
      if (newSettings.ldapEnabled !== undefined) config.authentication.strategies.ldap.enabled = newSettings.ldapEnabled;
      if (newSettings.ldapUrl !== undefined) config.authentication.strategies.ldap.url = newSettings.ldapUrl;
      if (newSettings.ldapBindDn !== undefined) config.authentication.strategies.ldap.bind_dn = newSettings.ldapBindDn;
      if (newSettings.ldapBindCredentials !== undefined) config.authentication.strategies.ldap.bind_credentials = newSettings.ldapBindCredentials;
      if (newSettings.ldapSearchBase !== undefined) config.authentication.strategies.ldap.search_base = newSettings.ldapSearchBase;
      if (newSettings.ldapSearchFilter !== undefined) config.authentication.strategies.ldap.search_filter = newSettings.ldapSearchFilter;
      if (newSettings.ldapSearchAttributes !== undefined) {
        config.authentication.strategies.ldap.search_attributes = newSettings.ldapSearchAttributes.split(',').map(s => s.trim());
      }
      if (newSettings.ldapTlsRejectUnauthorized !== undefined) config.authentication.strategies.ldap.tls_options.reject_unauthorized = newSettings.ldapTlsRejectUnauthorized;

      // External provider settings
      config.authentication.external_provider_settings = config.authentication.external_provider_settings || {};
      config.authentication.external_provider_settings.domain_organization_mapping = config.authentication.external_provider_settings.domain_organization_mapping || {};
      config.authentication.external_provider_settings.dynamic_provisioning = config.authentication.external_provider_settings.dynamic_provisioning || {};
      config.authentication.external_provider_settings.profile_sync = config.authentication.external_provider_settings.profile_sync || {};
      
      if (newSettings.externalDomainMappingEnabled !== undefined) config.authentication.external_provider_settings.domain_organization_mapping.enabled = newSettings.externalDomainMappingEnabled;
      if (newSettings.externalDomainMappings !== undefined) config.authentication.external_provider_settings.domain_organization_mapping.mappings = newSettings.externalDomainMappings;
      if (newSettings.externalProvisioningEnabled !== undefined) config.authentication.external_provider_settings.dynamic_provisioning.enabled = newSettings.externalProvisioningEnabled;
      if (newSettings.externalProvisioningPolicy !== undefined) config.authentication.external_provider_settings.dynamic_provisioning.policy = newSettings.externalProvisioningPolicy;
      if (newSettings.externalProvisioningDefaultRole !== undefined) config.authentication.external_provider_settings.dynamic_provisioning.default_role = newSettings.externalProvisioningDefaultRole;
      if (newSettings.externalProvisioningFallbackAction !== undefined) config.authentication.external_provider_settings.dynamic_provisioning.fallback_action = newSettings.externalProvisioningFallbackAction;
      if (newSettings.externalProfileSyncEnabled !== undefined) config.authentication.external_provider_settings.profile_sync.enabled = newSettings.externalProfileSyncEnabled;
      if (newSettings.externalProfileUpdateOnLogin !== undefined) config.authentication.external_provider_settings.profile_sync.update_on_login = newSettings.externalProfileUpdateOnLogin;
      if (newSettings.externalProfileSyncFields !== undefined) {
        config.authentication.external_provider_settings.profile_sync.sync_fields = newSettings.externalProfileSyncFields.split(',').map(s => s.trim());
      }

      // Database settings
      config.database = config.database || {};
      config.database.dialect = config.database.dialect || { type: 'select', value: 'sqlite' };
      config.database.storage = config.database.storage || { type: 'string', value: '/var/lib/zoneweaver/database/zoneweaver.db' };
      config.database.host = config.database.host || { type: 'host', value: 'localhost' };
      config.database.port = config.database.port || { type: 'integer', value: 3306 };
      config.database.user = config.database.user || { type: 'string', value: '' };
      config.database.password = config.database.password || { type: 'password', value: '' };
      config.database.database_name = config.database.database_name || { type: 'string', value: 'zoneweaver' };
      config.database.logging = config.database.logging || { type: 'boolean', value: false };
      config.database.pool = config.database.pool || {};
      config.database.pool.max = config.database.pool.max || { type: 'integer', value: 5 };
      config.database.pool.min = config.database.pool.min || { type: 'integer', value: 0 };
      config.database.pool.acquire = config.database.pool.acquire || { type: 'integer', value: 30000 };
      config.database.pool.idle = config.database.pool.idle || { type: 'integer', value: 10000 };

      if (newSettings.databaseDialect !== undefined) config.database.dialect.value = newSettings.databaseDialect;
      if (newSettings.databaseStorage !== undefined) config.database.storage.value = newSettings.databaseStorage;
      if (newSettings.databaseHost !== undefined) config.database.host.value = newSettings.databaseHost;
      if (newSettings.databasePort !== undefined) config.database.port.value = newSettings.databasePort;
      if (newSettings.databaseUser !== undefined) config.database.user.value = newSettings.databaseUser;
      if (newSettings.databasePassword !== undefined) config.database.password.value = newSettings.databasePassword;
      if (newSettings.databaseName !== undefined) config.database.database_name.value = newSettings.databaseName;
      if (newSettings.databaseLogging !== undefined) config.database.logging.value = newSettings.databaseLogging;
      if (newSettings.databasePoolMax !== undefined) config.database.pool.max.value = newSettings.databasePoolMax;
      if (newSettings.databasePoolMin !== undefined) config.database.pool.min.value = newSettings.databasePoolMin;
      if (newSettings.databasePoolAcquire !== undefined) config.database.pool.acquire.value = newSettings.databasePoolAcquire;
      if (newSettings.databasePoolIdle !== undefined) config.database.pool.idle.value = newSettings.databasePoolIdle;

      // Legacy database path for compatibility
      if (newSettings.databasePath !== undefined) config.database.path = newSettings.databasePath;

      // Gravatar
      config.gravatar = config.gravatar || {};
      config.gravatar.api_key = config.gravatar.api_key || { type: 'string', value: '' };
      if (newSettings.gravatarApiKey !== undefined) config.gravatar.api_key.value = newSettings.gravatarApiKey;

      // Rate limiting settings
      config.rateLimiting = config.rateLimiting || {};
      
      // Rate limiting - Authentication
      config.rateLimiting.authentication = config.rateLimiting.authentication || {};
      config.rateLimiting.authentication.windowMs = config.rateLimiting.authentication.windowMs || { type: 'integer', value: 900000 };
      config.rateLimiting.authentication.max = config.rateLimiting.authentication.max || { type: 'integer', value: 25 };
      config.rateLimiting.authentication.message = config.rateLimiting.authentication.message || { type: 'string', value: 'Too many authentication attempts' };
      if (newSettings.rateLimitAuthWindowMs !== undefined) config.rateLimiting.authentication.windowMs.value = newSettings.rateLimitAuthWindowMs;
      if (newSettings.rateLimitAuthMax !== undefined) config.rateLimiting.authentication.max.value = newSettings.rateLimitAuthMax;
      if (newSettings.rateLimitAuthMessage !== undefined) config.rateLimiting.authentication.message.value = newSettings.rateLimitAuthMessage;

      // Rate limiting - Admin
      config.rateLimiting.admin = config.rateLimiting.admin || {};
      config.rateLimiting.admin.windowMs = config.rateLimiting.admin.windowMs || { type: 'integer', value: 900000 };
      config.rateLimiting.admin.max = config.rateLimiting.admin.max || { type: 'integer', value: 500 };
      config.rateLimiting.admin.message = config.rateLimiting.admin.message || { type: 'string', value: 'Too many admin requests' };
      if (newSettings.rateLimitAdminWindowMs !== undefined) config.rateLimiting.admin.windowMs.value = newSettings.rateLimitAdminWindowMs;
      if (newSettings.rateLimitAdminMax !== undefined) config.rateLimiting.admin.max.value = newSettings.rateLimitAdminMax;
      if (newSettings.rateLimitAdminMessage !== undefined) config.rateLimiting.admin.message.value = newSettings.rateLimitAdminMessage;

      // Rate limiting - API Proxy
      config.rateLimiting.apiProxy = config.rateLimiting.apiProxy || {};
      config.rateLimiting.apiProxy.windowMs = config.rateLimiting.apiProxy.windowMs || { type: 'integer', value: 60000 };
      config.rateLimiting.apiProxy.max = config.rateLimiting.apiProxy.max || { type: 'integer', value: 100 };
      config.rateLimiting.apiProxy.message = config.rateLimiting.apiProxy.message || { type: 'string', value: 'Too many API proxy requests' };
      if (newSettings.rateLimitApiProxyWindowMs !== undefined) config.rateLimiting.apiProxy.windowMs.value = newSettings.rateLimitApiProxyWindowMs;
      if (newSettings.rateLimitApiProxyMax !== undefined) config.rateLimiting.apiProxy.max.value = newSettings.rateLimitApiProxyMax;
      if (newSettings.rateLimitApiProxyMessage !== undefined) config.rateLimiting.apiProxy.message.value = newSettings.rateLimitApiProxyMessage;

      // Rate limiting - Realtime
      config.rateLimiting.realtime = config.rateLimiting.realtime || {};
      config.rateLimiting.realtime.windowMs = config.rateLimiting.realtime.windowMs || { type: 'integer', value: 60000 };
      config.rateLimiting.realtime.max = config.rateLimiting.realtime.max || { type: 'integer', value: 250 };
      config.rateLimiting.realtime.message = config.rateLimiting.realtime.message || { type: 'string', value: 'Too many real-time requests' };
      if (newSettings.rateLimitRealtimeWindowMs !== undefined) config.rateLimiting.realtime.windowMs.value = newSettings.rateLimitRealtimeWindowMs;
      if (newSettings.rateLimitRealtimeMax !== undefined) config.rateLimiting.realtime.max.value = newSettings.rateLimitRealtimeMax;
      if (newSettings.rateLimitRealtimeMessage !== undefined) config.rateLimiting.realtime.message.value = newSettings.rateLimitRealtimeMessage;

      // Rate limiting - Standard
      config.rateLimiting.standard = config.rateLimiting.standard || {};
      config.rateLimiting.standard.windowMs = config.rateLimiting.standard.windowMs || { type: 'integer', value: 900000 };
      config.rateLimiting.standard.max = config.rateLimiting.standard.max || { type: 'integer', value: 1000 };
      config.rateLimiting.standard.message = config.rateLimiting.standard.message || { type: 'string', value: 'Too many requests' };
      if (newSettings.rateLimitStandardWindowMs !== undefined) config.rateLimiting.standard.windowMs.value = newSettings.rateLimitStandardWindowMs;
      if (newSettings.rateLimitStandardMax !== undefined) config.rateLimiting.standard.max.value = newSettings.rateLimitStandardMax;
      if (newSettings.rateLimitStandardMessage !== undefined) config.rateLimiting.standard.message.value = newSettings.rateLimitStandardMessage;

      // Rate limiting - Static Files
      config.rateLimiting.staticFiles = config.rateLimiting.staticFiles || {};
      config.rateLimiting.staticFiles.windowMs = config.rateLimiting.staticFiles.windowMs || { type: 'integer', value: 900000 };
      config.rateLimiting.staticFiles.max = config.rateLimiting.staticFiles.max || { type: 'integer', value: 5000 };
      config.rateLimiting.staticFiles.message = config.rateLimiting.staticFiles.message || { type: 'string', value: 'Too many static file requests' };
      if (newSettings.rateLimitStaticFilesWindowMs !== undefined) config.rateLimiting.staticFiles.windowMs.value = newSettings.rateLimitStaticFilesWindowMs;
      if (newSettings.rateLimitStaticFilesMax !== undefined) config.rateLimiting.staticFiles.max.value = newSettings.rateLimitStaticFilesMax;
      if (newSettings.rateLimitStaticFilesMessage !== undefined) config.rateLimiting.staticFiles.message.value = newSettings.rateLimitStaticFilesMessage;

      // Update mail settings
      if (newSettings.mailSmtpHost !== undefined || newSettings.mailSmtpPort !== undefined || 
          newSettings.mailSmtpSecure !== undefined || newSettings.mailSmtpUser !== undefined || 
          newSettings.mailSmtpPassword !== undefined || newSettings.mailFromAddress !== undefined) {
        
        config.mail = config.mail || {};
        config.mail.smtp_host = config.mail.smtp_host || { type: 'host', value: '' };
        config.mail.smtp_port = config.mail.smtp_port || { type: 'integer', value: 587 };
        config.mail.smtp_secure = config.mail.smtp_secure || { type: 'boolean', value: false };
        config.mail.smtp_user = config.mail.smtp_user || { type: 'string', value: '' };
        config.mail.smtp_password = config.mail.smtp_password || { type: 'password', value: '' };
        config.mail.from_address = config.mail.from_address || { type: 'email', value: '' };

        if (newSettings.mailSmtpHost !== undefined) config.mail.smtp_host.value = newSettings.mailSmtpHost;
        if (newSettings.mailSmtpPort !== undefined) config.mail.smtp_port.value = newSettings.mailSmtpPort;
        if (newSettings.mailSmtpSecure !== undefined) config.mail.smtp_secure.value = newSettings.mailSmtpSecure;
        if (newSettings.mailSmtpUser !== undefined) config.mail.smtp_user.value = newSettings.mailSmtpUser;
        if (newSettings.mailSmtpPassword !== undefined) config.mail.smtp_password.value = newSettings.mailSmtpPassword;
        if (newSettings.mailFromAddress !== undefined) config.mail.from_address.value = newSettings.mailFromAddress;
      }

      // Preserve backend_servers
      const backendServers = config.backend_servers;

      // Create backup of current config
      const backupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
      fs.copyFileSync(SettingsController.configPath, backupPath);

      // Write updated config
      if (backendServers) {
        config.backend_servers = backendServers;
      }
      const updatedYaml = YAML.stringify(config, {
        indent: 2,
        lineWidth: 120
      });

      fs.writeFileSync(SettingsController.configPath, updatedYaml, 'utf8');

      // Log the change
      console.log(`Settings updated by user ${req.user.username} (${req.user.role})`);
      console.log(`Backup created: ${backupPath}`);

      res.json({
        success: true,
        message: 'Settings updated successfully. Some changes may require a server restart to take effect.',
        requiresRestart: SettingsController.requiresRestart(newSettings),
        backupPath: backupPath
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings: ' + error.message
      });
    }
  }

  /**
   * @swagger
   * /api/settings/reset:
   *   post:
   *     summary: Reset system settings to defaults (Super-admin only)
   *     description: Reset all Zoneweaver system settings to default values while preserving critical server configurations
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Settings reset successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Settings reset to defaults successfully."
   *                 backupPath:
   *                   type: string
   *                   description: Path to backup file created before reset
   *                   example: "./config.yaml.backup.1641234567890"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async resetSettings(req, res) {
    try {
      // Create backup first
      const backupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
      fs.copyFileSync(SettingsController.configPath, backupPath);

      // Load current config to preserve server-specific settings
      const configFile = fs.readFileSync(SettingsController.configPath, 'utf8');
      let config = YAML.parse(configFile);

      // Reset to defaults while preserving critical server settings
      config.app = {
        name: "Zoneweaver",
        version: "2.0.0"
      };

      config.limits = {
        maxServersPerUser: 10
      };

      config.frontend = {
        autoRefreshInterval: 5,
        enableNotifications: true,
        enableDarkMode: true
      };

      // Reset authentication settings to defaults while preserving structure
      if (config.authentication) {
        config.authentication.strategies = config.authentication.strategies || {};
        config.authentication.strategies.local = config.authentication.strategies.local || {};
        config.authentication.strategies.local.session_timeout = 24;
        config.authentication.strategies.local.allow_new_organizations = true;
      }

      config.logging = {
        level: "info",
        enabled: true
      };

      // Write reset config
      const resetYaml = YAML.stringify(config, {
        indent: 2,
        lineWidth: 120
      });

      fs.writeFileSync(SettingsController.configPath, resetYaml, 'utf8');

      console.log(`Settings reset to defaults by user ${req.user.username} (${req.user.role})`);
      console.log(`Backup created: ${backupPath}`);

      res.json({
        success: true,
        message: 'Settings reset to defaults successfully.',
        backupPath: backupPath
      });

    } catch (error) {
      console.error('Error resetting settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset settings: ' + error.message
      });
    }
  }

  /**
   * @swagger
   * /api/settings/restart:
   *   post:
   *     summary: Restart Zoneweaver server (Super-admin only)
   *     description: Restart the Zoneweaver application server (requires process manager like PM2)
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Server restart initiated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Server restart initiated. Please wait for the application to reload."
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async restartServer(req, res) {
    try {
      console.log(`Server restart requested by user ${req.user.username} (${req.user.role})`);
      
      res.json({
        success: true,
        message: 'Server restart initiated. Please wait for the application to reload.'
      });

      // Delay the restart to allow response to be sent
      setTimeout(() => {
        console.log('Restarting server...');
        process.exit(0); // Let process manager restart the app
      }, 1000);

    } catch (error) {
      console.error('Error restarting server:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restart server: ' + error.message
      });
    }
  }

  /**
   * Check if settings changes require a server restart
   */
  static requiresRestart(newSettings) {
    // Settings that require restart
    const restartRequired = [
      'serverPort',
      'sslEnabled',
      'corsWhitelist',
      'sessionTimeout'
    ];

    return Object.keys(newSettings).some(key => restartRequired.includes(key));
  }

  /**
   * @swagger
   * /api/settings/backups:
   *   get:
   *     summary: Get list of configuration backups (Super-admin only)
   *     description: Retrieve list of available configuration backup files with timestamps and sizes
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Backup list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 backups:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       filename:
   *                         type: string
   *                         description: Backup filename
   *                         example: "config.yaml.backup.1641234567890"
   *                       created:
   *                         type: string
   *                         format: date-time
   *                         description: Backup creation timestamp
   *                         example: "2025-01-04T17:18:00.324Z"
   *                       size:
   *                         type: integer
   *                         description: File size in bytes
   *                         example: 2048
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async getBackups(req, res) {
    try {
      const configDir = path.dirname(SettingsController.configPath);
      const files = fs.readdirSync(configDir);
      
      const backups = files
        .filter(file => file.startsWith('config.yaml.backup.'))
        .map(file => {
          const stats = fs.statSync(path.join(configDir, file));
          const timestamp = file.split('.').pop();
          return {
            filename: file,
            created: new Date(parseInt(timestamp)),
            size: stats.size
          };
        })
        .sort((a, b) => b.created - a.created);

      res.json({
        success: true,
        backups: backups
      });

    } catch (error) {
      console.error('Error listing backups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list backups: ' + error.message
      });
    }
  }

  /**
   * @swagger
   * /api/zapi/{protocol}/{hostname}/{port}/settings:
   *   get:
   *     summary: Get Zoneweaver API Server settings (Super-admin only)
   *     description: Retrieve configuration settings from a specific Zoneweaver API server
   *     tags: [Zoneweaver API Settings]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Server port
   *         example: 5001
   *     responses:
   *       200:
   *         description: Zoneweaver API settings retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 settings:
   *                   type: object
   *                   properties:
   *                     serverName:
   *                       type: string
   *                       example: "Zoneweaver API Production"
   *                     version:
   *                       type: string
   *                       example: "1.0.0"
   *                     port:
   *                       type: integer
   *                       example: 5001
   *                     debugMode:
   *                       type: boolean
   *                       example: false
   *                     maxZones:
   *                       type: integer
   *                       example: 100
   *                     autoBackup:
   *                       type: boolean
   *                       example: true
   *                     backupRetention:
   *                       type: integer
   *                       example: 30
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Zoneweaver API Server not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error or Zoneweaver API Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async getZoneweaverAPISettings(req, res) {
    try {
      const { hostname, port, protocol } = req.params;
      const result = await ServerModel.makeRequest(
        hostname,
        port,
        protocol,
        'settings',
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, settings: result.data });
      } else {
        res.status(result.status || 500).json({ 
          success: false, 
          message: result.error || 'Failed to get settings' 
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @swagger
   * /api/zapi/{protocol}/{hostname}/{port}/settings:
   *   put:
   *     summary: Update Zoneweaver API Server settings (Super-admin only)
   *     description: Update configuration settings on a specific Zoneweaver API server
   *     tags: [Zoneweaver API Settings]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Server port
   *         example: 5001
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               serverName:
   *                 type: string
   *                 example: "Zoneweaver API Production"
   *               debugMode:
   *                 type: boolean
   *                 example: false
   *               maxZones:
   *                 type: integer
   *                 example: 100
   *               autoBackup:
   *                 type: boolean
   *                 example: true
   *               backupRetention:
   *                 type: integer
   *                 example: 30
   *               allow_insecure:
   *                 type: boolean
   *                 description: Allow insecure connections (updates Zoneweaver config)
   *                 example: false
   *     responses:
   *       200:
   *         description: Zoneweaver API settings updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Settings updated successfully"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Zoneweaver API Server not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error or Zoneweaver API Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async updateZoneweaverAPISettings(req, res) {
    try {
      const { hostname, port, protocol } = req.params;
      const { allow_insecure, ...settings } = req.body;
      
      const result = await ServerModel.makeRequest(
        hostname,
        port,
        protocol,
        'settings',
        { 
          method: 'PUT',
          data: settings
        }
      );

      if (result.success) {
        // Update the allow_insecure setting in the config.yaml file
        const configFile = fs.readFileSync(SettingsController.configPath, 'utf8');
        let config = YAML.parse(configFile);
        const zapi = config.backend_servers.find(s => s.hostname === hostname && s.port === port && s.protocol === protocol);
        if (zapi && allow_insecure !== undefined) {
          zapi.allow_insecure = allow_insecure;
          const updatedYaml = YAML.stringify(config, {
            indent: 2,
            lineWidth: 120
          });
          fs.writeFileSync(SettingsController.configPath, updatedYaml, 'utf8');
        }

        res.json({ success: true, message: 'Settings updated successfully' });
      } else {
        res.status(result.status || 500).json({ 
          success: false, 
          message: result.error || 'Failed to update settings' 
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @swagger
   * /api/zapi/{protocol}/{hostname}/{port}/settings/backups:
   *   get:
   *     summary: Get Zoneweaver API configuration backups (Super-admin only)
   *     description: Retrieve list of available configuration backup files from a specific Zoneweaver API server
   *     tags: [Zoneweaver API Settings]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Server port
   *         example: 5001
   *     responses:
   *       200:
   *         description: Zoneweaver API backup list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 backups:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       filename:
   *                         type: string
   *                         description: Backup filename
   *                         example: "config.yaml.backup.1641234567890"
   *                       created:
   *                         type: string
   *                         format: date-time
   *                         description: Backup creation timestamp
   *                         example: "2025-01-04T17:18:00.324Z"
   *                       size:
   *                         type: integer
   *                         description: File size in bytes
   *                         example: 2048
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Zoneweaver API Server not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error or Zoneweaver API Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async getZoneweaverAPIBackups(req, res) {
    try {
      const { hostname, port, protocol } = req.params;
      const result = await ServerModel.makeRequest(
        hostname,
        port,
        protocol,
        'settings/backups',
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, backups: result.data });
      } else {
        res.status(result.status || 500).json({ 
          success: false, 
          message: result.error || 'Failed to get backups' 
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @swagger
   * /api/zapi/{protocol}/{hostname}/{port}/settings/restore/{filename}:
   *   post:
   *     summary: Restore Zoneweaver API configuration backup (Super-admin only)
   *     description: Restore a Zoneweaver API Server configuration from a backup file
   *     tags: [Zoneweaver API Settings]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Server port
   *         example: 5001
   *       - in: path
   *         name: filename
   *         required: true
   *         schema:
   *           type: string
   *         description: Backup filename to restore
   *         example: "config.yaml.backup.1641234567890"
   *     responses:
   *       200:
   *         description: Backup restored successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Backup restored successfully"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Zoneweaver API Server or backup file not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               serverNotFound:
   *                 summary: Server not found
   *                 value:
   *                   success: false
   *                   message: "Zoneweaver API Server not found"
   *               backupNotFound:
   *                 summary: Backup file not found
   *                 value:
   *                   success: false
   *                   message: "Backup file not found"
   *       500:
   *         description: Internal server error or Zoneweaver API Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async restoreZoneweaverAPIBackup(req, res) {
    try {
      const { hostname, port, protocol, filename } = req.params;
      
      const result = await ServerModel.makeRequest(
        hostname,
        port,
        protocol,
        `settings/restore/${filename}`,
        { 
          method: 'POST',
          data: {}
        }
      );

      if (result.success) {
        res.json({ success: true, message: 'Backup restored successfully' });
      } else {
        res.status(result.status || 500).json({ 
          success: false, 
          message: result.error || 'Failed to restore backup' 
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * @swagger
   * /api/zapi/{protocol}/{hostname}/{port}/server/restart:
   *   post:
   *     summary: Restart Zoneweaver API Server (Super-admin only)
   *     description: Restart a specific Zoneweaver API server (requires process manager like PM2)
   *     tags: [Zoneweaver API Settings]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Server port
   *         example: 5001
   *     responses:
   *       200:
   *         description: Zoneweaver API Server restart initiated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Server restart initiated"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Super-admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Zoneweaver API Server not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error or Zoneweaver API Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async restartZoneweaverAPIServer(req, res) {
    try {
      const { hostname, port, protocol } = req.params;
      
      const result = await ServerModel.makeRequest(
        hostname,
        port,
        protocol,
        'server/restart',
        { 
          method: 'POST',
          data: {}
        }
      );

      if (result.success) {
        res.json({ success: true, message: 'Server restart initiated' });
      } else {
        res.status(result.status || 500).json({ 
          success: false, 
          message: result.error || 'Failed to restart server' 
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default SettingsController;
