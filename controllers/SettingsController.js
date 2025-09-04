
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

  static async getZoneweaverAPIServerInfo() {
    // Get first server from database instead of config
    const server = await ServerModel.findOne({ 
      order: [['created_at', 'ASC']] 
    });
    if (!server) {
      throw new Error('No Zoneweaver API servers found in database');
    }
    return {
      hostname: server.hostname,
      port: server.port,
      protocol: server.protocol
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
      const newConfig = req.body;
      
      // Create backup of current config
      const backupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
      fs.copyFileSync(SettingsController.configPath, backupPath);

      // Write updated config directly - config.yaml is now the definitive source!
      const updatedYaml = YAML.stringify(newConfig, {
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
        requiresRestart: SettingsController.requiresRestart(newConfig),
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
        // Update allow_insecure setting in database instead since servers are now stored there
        if (allow_insecure !== undefined) {
          await ServerModel.update(
            { allow_insecure: allow_insecure },
            { where: { hostname, port, protocol } }
          );
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
