import fs from 'fs';
import * as YAML from 'yaml';
import { loadConfig, getConfigFilePath } from '../utils/config.js';
import { log } from '../utils/Logger.js';

/**
 * Settings Controller - Manages Hyperweaver Server system settings
 * Only accessible by super-admin users
 */
class SettingsController {
  static get configPath() {
    return getConfigFilePath();
  }

  /**
   * @swagger
   * /api/settings:
   *   get:
   *     summary: Get Hyperweaver Server system settings (Super-admin only)
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
   *                       example: "Hyperweaver"
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
   *                       example: "/var/lib/hyperweaver-server/database/hyperweaver-server.db"
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
  static getSettings(req, res) {
    void req;
    try {
      const config = loadConfig();

      // Return the entire configuration structure
      // Frontend can dynamically generate forms from metadata
      res.json({
        success: true,
        config,
      });
    } catch (error) {
      log.settings.error('Error loading settings', { error: error.message });
      res.status(500).json({
        success: false,
        message: `Failed to load settings: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings:
   *   put:
   *     summary: Update Hyperweaver Server system settings (Super-admin only)
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
   *                 example: "Hyperweaver"
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
   *                 example: "/var/lib/hyperweaver-server/database/hyperweaver-server.db"
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
  static updateSettings(req, res) {
    try {
      const newValues = req.body; // Flat key-value pairs from frontend

      // Load current config with metadata structure
      const currentConfig = loadConfig();

      // Update values while preserving metadata structure
      const updatedConfig = SettingsController.updateConfigValues(currentConfig, newValues);

      // Persist (creates a timestamped backup of the current file first)
      const backupPath = SettingsController.writeConfigWithBackup(updatedConfig);

      // Log the change
      log.settings.info('Settings updated', {
        user: req.user.username,
        role: req.user.role,
        backupPath,
      });

      res.json({
        success: true,
        message:
          'Settings updated successfully. Some changes may require a server restart to take effect.',
        requiresRestart: SettingsController.requiresRestart(newValues),
        backupPath,
      });
    } catch (error) {
      log.settings.error('Error updating settings', { error: error.message });
      res.status(500).json({
        success: false,
        message: `Failed to update settings: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/reset:
   *   post:
   *     summary: Reset system settings to defaults (Super-admin only)
   *     description: Reset all Hyperweaver Server system settings to default values while preserving critical server configurations
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
  static resetSettings(req, res) {
    try {
      // Reset the tunable defaults while preserving critical settings (network, SSL,
      // database, auth providers). Keys follow this config's real metadata layout —
      // updateConfigValues sets the .value on each metadata field, and
      // writeConfigWithBackup snapshots the current file first. frontend.version is
      // release-managed and deliberately not reset.
      const defaults = {
        'frontend.name': 'Hyperweaver',
        'frontend.auto_refresh_interval': 5,
        'frontend.enable_notifications': true,
        'frontend.enable_dark_mode': true,
        'limits.max_servers_per_user': 10,
        'authentication.local_session_timeout': 24,
        'authentication.local_allow_new_organizations': true,
        'logging.level': 'info',
        'logging.console_enabled': true,
      };

      const currentConfig = loadConfig();
      const updatedConfig = SettingsController.updateConfigValues(currentConfig, defaults);
      const backupPath = SettingsController.writeConfigWithBackup(updatedConfig);

      log.settings.info('Settings reset to defaults', {
        user: req.user.username,
        role: req.user.role,
        backupPath,
      });

      res.json({
        success: true,
        message: 'Settings reset to defaults successfully.',
        backupPath,
      });
    } catch (error) {
      log.settings.error('Error resetting settings', { error: error.message });
      res.status(500).json({
        success: false,
        message: `Failed to reset settings: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/restart:
   *   post:
   *     summary: Restart Hyperweaver Server (Super-admin only)
   *     description: Restart the Hyperweaver Server application (requires a process manager such as systemd)
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
  static restartServer(req, res) {
    try {
      log.settings.info('Server restart requested', {
        user: req.user.username,
        role: req.user.role,
      });

      res.json({
        success: true,
        message: 'Server restart initiated. Please monitor the page for automatic reload.',
      });

      // Increased delay to ensure response is fully sent
      setTimeout(() => {
        log.settings.info('Restarting server...');
        process.kill(process.pid, 'SIGTERM'); // Let process manager restart the app
      }, 2500);
    } catch (error) {
      log.settings.error('Error restarting server', { error: error.message });
      res.status(500).json({
        success: false,
        message: `Failed to restart server: ${error.message}`,
      });
    }
  }

  /**
   * Write a config object to disk, creating a timestamped backup of the current
   * file first. Shared by the flat settings save and the OIDC provider CRUD so
   * every writer backs up identically.
   * @param {Object} updatedConfig - Full config object (with metadata) to persist
   * @returns {string} Path to the backup that was created
   */
  static writeConfigWithBackup(updatedConfig) {
    const backupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
    fs.copyFileSync(SettingsController.configPath, backupPath);

    const updatedYaml = YAML.stringify(updatedConfig, {
      indent: 2,
      lineWidth: 120,
    });
    fs.writeFileSync(SettingsController.configPath, updatedYaml, 'utf8');

    return backupPath;
  }

  /**
   * Update config values while preserving metadata structure
   * @param {Object} currentConfig - Current config with metadata structure
   * @param {Object} newValues - Flat key-value pairs from frontend
   * @returns {Object} Updated config with preserved metadata
   */
  static updateConfigValues(currentConfig, newValues) {
    // Create a deep copy to avoid modifying original
    const updatedConfig = JSON.parse(JSON.stringify(currentConfig));

    // Helper function to set nested value by path
    const setNestedValue = (obj, keyPath, value) => {
      const keys = keyPath.split('.');
      let current = obj;

      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          throw new Error(`Unsafe config key path: ${keyPath}`);
        }
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }

      const finalKey = keys[keys.length - 1];
      if (finalKey === '__proto__' || finalKey === 'constructor' || finalKey === 'prototype') {
        throw new Error(`Unsafe config key path: ${keyPath}`);
      }

      // If the target is a metadata object with a 'value' property, update it
      if (
        current[finalKey] &&
        typeof current[finalKey] === 'object' &&
        Object.hasOwn(current[finalKey], 'value')
      ) {
        current[finalKey].value = value;
      } else {
        // Otherwise, set the value directly
        current[finalKey] = value;
      }
    };

    // Update each value in the config structure
    for (const [keyPath, value] of Object.entries(newValues)) {
      try {
        setNestedValue(updatedConfig, keyPath, value);
      } catch (error) {
        log.settings.warn('Failed to update config path', { keyPath, error: error.message });
      }
    }

    return updatedConfig;
  }

  /**
   * Check if settings changes require a server restart
   */
  static requiresRestart(newSettings) {
    // Settings that require restart
    const restartRequired = ['serverPort', 'sslEnabled', 'corsWhitelist', 'sessionTimeout'];

    return Object.keys(newSettings).some(key => restartRequired.includes(key));
  }
}

export default SettingsController;
