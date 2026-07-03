import fs from 'fs';
import path from 'path';
import multer from 'multer';
import * as YAML from 'yaml';
import { loadConfig, getConfigFilePath } from '../utils/config.js';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';

// Access Sequelize models
const { server: ServerModel } = db;

/**
 * Settings Controller - Manages Hyperweaver Server system settings
 * Only accessible by super-admin users
 */
class SettingsController {
  static get configPath() {
    return getConfigFilePath();
  }

  static async getZoneweaverAPIServerInfo() {
    // Get first server from database instead of config
    const server = await ServerModel.findOne({
      order: [['created_at', 'ASC']],
    });
    if (!server) {
      throw new Error('No Zoneweaver API servers found in database');
    }
    return {
      hostname: server.hostname,
      port: server.port,
      protocol: server.protocol,
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
  static resetSettings(req, res) {
    try {
      // Create backup first
      const backupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
      fs.copyFileSync(SettingsController.configPath, backupPath);

      // Load current config to preserve server-specific settings
      const configFile = fs.readFileSync(SettingsController.configPath, 'utf8');
      const config = YAML.parse(configFile);

      // Reset to defaults while preserving critical server settings
      config.app = {
        name: 'Zoneweaver',
        version: '2.0.0',
      };

      config.limits = {
        maxServersPerUser: 10,
      };

      config.frontend = {
        autoRefreshInterval: 5,
        enableNotifications: true,
        enableDarkMode: true,
      };

      // Reset authentication settings to defaults while preserving structure
      if (config.authentication) {
        config.authentication.strategies = config.authentication.strategies || {};
        config.authentication.strategies.local = config.authentication.strategies.local || {};
        config.authentication.strategies.local.session_timeout = 24;
        config.authentication.strategies.local.allow_new_organizations = true;
      }

      config.logging = {
        level: 'info',
        enabled: true,
      };

      // Write reset config
      const resetYaml = YAML.stringify(config, {
        indent: 2,
        lineWidth: 120,
      });

      fs.writeFileSync(SettingsController.configPath, resetYaml, 'utf8');

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
   * Configure multer for SSL file uploads
   */
  static get sslUpload() {
    const storage = multer.memoryStorage(); // Store in memory temporarily
    return multer({
      storage,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for SSL files
      },
      fileFilter: (filterReq, file, cb) => {
        void filterReq;
        // Validate SSL file types
        const allowedExtensions = ['.pem', '.crt', '.key', '.cer', '.ca'];
        const fileExtension = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`), false);
        }
      },
    }).single('sslFile');
  }

  /**
   * @swagger
   * /api/settings/ssl/upload:
   *   post:
   *     summary: Upload SSL certificate file (Super-admin only)
   *     description: Upload SSL certificate, private key, or CA certificate file
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               sslFile:
   *                 type: string
   *                 format: binary
   *                 description: SSL certificate file (.pem, .crt, .key, .cer, .ca)
   *               fieldPath:
   *                 type: string
   *                 description: Configuration field path (e.g., server.ssl_cert_path, server.ssl_key_path, server.ssl_ca_path)
   *                 example: "server.ssl_cert_path"
   *     responses:
   *       200:
   *         description: SSL file uploaded successfully
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
   *                   example: "SSL certificate uploaded successfully"
   *                 filePath:
   *                   type: string
   *                   description: Path where the file was saved
   *                   example: "/etc/zoneweaver/ssl/certificate.crt"
   *       400:
   *         description: Invalid file or missing parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
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
   *       413:
   *         description: File too large (max 5MB)
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
  static uploadSSLFile(req, res) {
    try {
      // Use multer middleware to handle file upload
      SettingsController.sslUpload(req, res, err => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              success: false,
              message: 'File too large. Maximum size is 5MB.',
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        // Validate required parameters
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
        }

        const { fieldPath } = req.body;
        if (!fieldPath) {
          return res.status(400).json({
            success: false,
            message: 'fieldPath is required',
          });
        }

        try {
          // Load current config to get SSL directory
          const config = loadConfig();

          // Determine SSL directory - use configured path or default
          let sslDir = '/etc/zoneweaver/ssl';

          // Try to infer SSL directory from existing config paths
          if (config.server?.ssl_cert_path?.value) {
            sslDir = path.dirname(config.server.ssl_cert_path.value);
          } else if (config.server?.ssl_key_path?.value) {
            sslDir = path.dirname(config.server.ssl_key_path.value);
          }

          // Ensure SSL directory exists
          if (!fs.existsSync(sslDir)) {
            fs.mkdirSync(sslDir, { recursive: true, mode: 0o700 });
            log.settings.info('Created SSL directory', { sslDir });
          }

          // Generate secure filename based on field type and timestamp
          let filename = '';
          if (fieldPath.includes('ssl_key_path')) {
            filename = `private-key-${Date.now()}.pem`;
          } else if (fieldPath.includes('ssl_cert_path')) {
            filename = `certificate-${Date.now()}.crt`;
          } else if (fieldPath.includes('ssl_ca_path')) {
            filename = `ca-certificate-${Date.now()}.pem`;
          } else {
            // Fallback: use original filename with timestamp
            const ext = path.extname(req.file.originalname);
            const baseName = path.basename(req.file.originalname, ext);
            filename = `${baseName}-${Date.now()}${ext}`;
          }

          const filePath = path.join(sslDir, filename);

          // Validate SSL file content (basic check for PEM/certificate format)
          const fileContent = req.file.buffer.toString();
          const isPEMFormat =
            fileContent.includes('-----BEGIN') && fileContent.includes('-----END');

          if (!isPEMFormat) {
            return res.status(400).json({
              success: false,
              message: 'Invalid SSL file format. File must be in PEM format.',
            });
          }

          // Save file to SSL directory
          fs.writeFileSync(filePath, req.file.buffer, { mode: 0o600 });
          log.settings.info('SSL file uploaded', {
            user: req.user.username,
            filename,
            filePath,
          });

          // Return success response
          return res.json({
            success: true,
            message: `SSL certificate uploaded successfully: ${filename}`,
            filePath,
          });
        } catch (uploadError) {
          log.settings.error('SSL file upload error', { error: uploadError.message });
          return res.status(500).json({
            success: false,
            message: `Failed to save SSL file: ${uploadError.message}`,
          });
        }
      });
    } catch (error) {
      log.settings.error('SSL upload handler error', { error: error.message });
      res.status(500).json({
        success: false,
        message: `SSL file upload failed: ${error.message}`,
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
  static getBackups(req, res) {
    void req;
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
            size: stats.size,
          };
        })
        .sort((a, b) => b.created - a.created);

      res.json({
        success: true,
        backups,
      });
    } catch (error) {
      log.settings.error('Error listing backups', { error: error.message });
      res.status(500).json({
        success: false,
        message: `Failed to list backups: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/restore/{filename}:
   *   post:
   *     summary: Restore configuration from backup (Super-admin only)
   *     description: Restore Zoneweaver configuration from a specific backup file
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: filename
   *         required: true
   *         schema:
   *           type: string
   *         description: Backup filename to restore
   *         example: "config.yaml.backup.1641234567890"
   *     responses:
   *       200:
   *         description: Configuration restored successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       404:
   *         description: Backup file not found
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
  static restoreFromBackup(req, res) {
    try {
      const { filename } = req.params;
      const configDir = path.dirname(SettingsController.configPath);

      // Sanitize with basename + strict allowlist to block path traversal
      const safeName = path.basename(filename);
      if (!/^config\.yaml\.backup\.\d+$/.test(safeName)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found',
        });
      }

      const backupPath = path.join(configDir, safeName);
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found',
        });
      }

      // Create backup of current config before restore
      const restoreBackupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
      fs.copyFileSync(SettingsController.configPath, restoreBackupPath);

      // Restore from backup
      fs.copyFileSync(backupPath, SettingsController.configPath);

      log.settings.info('Configuration restored from backup', {
        filename: safeName,
        user: req.user.username,
        role: req.user.role,
        backupCreated: path.basename(restoreBackupPath),
      });

      return res.json({
        success: true,
        message:
          'Configuration restored successfully. Settings will take effect after next page reload.',
        backupPath: path.basename(restoreBackupPath),
      });
    } catch (error) {
      log.settings.error('Error restoring backup', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to restore backup: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/backups/{filename}:
   *   delete:
   *     summary: Delete a configuration backup (Super-admin only)
   *     description: Delete a specific configuration backup file
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: filename
   *         required: true
   *         schema:
   *           type: string
   *         description: Backup filename to delete
   *         example: "config.yaml.backup.1641234567890"
   *     responses:
   *       200:
   *         description: Backup deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       404:
   *         description: Backup file not found
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
  static deleteBackup(req, res) {
    try {
      const { filename } = req.params;
      const configDir = path.dirname(SettingsController.configPath);

      // Sanitize with basename + strict allowlist to block path traversal
      const safeName = path.basename(filename);
      if (!/^config\.yaml\.backup\.\d+$/.test(safeName)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found',
        });
      }

      const backupPath = path.join(configDir, safeName);
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found',
        });
      }

      // Delete the backup file
      fs.unlinkSync(backupPath);

      log.settings.info('Backup deleted', {
        filename: safeName,
        user: req.user.username,
        role: req.user.role,
      });

      return res.json({
        success: true,
        message: 'Backup deleted successfully',
      });
    } catch (error) {
      log.settings.error('Error deleting backup', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to delete backup: ${error.message}`,
      });
    }
  }

  /**
   * Resolve a dotted config path (e.g. "authentication.oidc_providers") to the
   * collection field object it points at. Guards against prototype-pollution keys
   * and verifies the target is actually a `type: collection` field.
   * @param {Object} config - Full loaded config
   * @param {string} dottedPath - Dotted path to the collection field
   * @returns {{ field?: Object, error?: string }}
   */
  static resolveCollectionField(config, dottedPath) {
    const segments = String(dottedPath || '').split('.');

    if (segments.length === 0 || segments.some(seg => !seg)) {
      return { error: 'Invalid collection path' };
    }

    let node = config;
    for (const seg of segments) {
      if (seg === '__proto__' || seg === 'constructor' || seg === 'prototype') {
        return { error: 'Invalid collection path' };
      }
      if (!node || typeof node !== 'object') {
        return { error: `Collection not found: ${dottedPath}` };
      }
      node = node[seg];
    }

    if (!node || typeof node !== 'object' || node.type !== 'collection') {
      return { error: `Not a managed collection: ${dottedPath}` };
    }

    return { field: node };
  }

  /**
   * Coerce and validate a single incoming value against its item-schema field
   * metadata (type, options, min/max).
   * @returns {{ value?: *, error?: string }}
   */
  static coerceCollectionValue(fieldKey, meta, raw) {
    const label = meta.label || fieldKey;

    if (meta.type === 'boolean') {
      return { value: raw === true || raw === 'true' };
    }

    if (meta.type === 'integer') {
      const num = typeof raw === 'number' ? raw : parseInt(raw, 10);
      if (Number.isNaN(num)) {
        return { error: `${label} must be a number` };
      }
      const { validation = {} } = meta;
      const min = validation.min !== undefined ? validation.min : meta.min;
      const max = validation.max !== undefined ? validation.max : meta.max;
      if (min !== undefined && num < min) {
        return { error: `${label} must be at least ${min}` };
      }
      if (max !== undefined && num > max) {
        return { error: `${label} must be at most ${max}` };
      }
      return { value: num };
    }

    if (meta.type === 'select' && Array.isArray(meta.options) && meta.options.length > 0) {
      const options = meta.options.map(opt => (opt && typeof opt === 'object' ? opt.value : opt));
      if (!options.includes(raw)) {
        return { error: `${label} must be one of: ${options.join(', ')}` };
      }
      return { value: raw };
    }

    return { value: raw === null || raw === undefined ? '' : String(raw) };
  }

  /**
   * Build a fully {value}-wrapped collection item from incoming flat values,
   * driven entirely by the field's item_schema. Only schema-declared fields are
   * written (unknown input keys are dropped). Secret fields left blank on update
   * keep their existing value. Enforces required fields, defaults, and coercion.
   * @param {Object} field - The collection field (with item_schema/secret_fields)
   * @param {Object} incoming - Flat { fieldKey: value } from the request
   * @param {Object|null} existingItem - Current stored item when updating
   * @returns {{ item?: Object, error?: string }}
   */
  static buildCollectionItem(field, incoming, existingItem = null) {
    const itemSchema = field.item_schema || {};
    const secretFields = field.secret_fields || [];
    const isUpdate = Boolean(existingItem);
    const values = incoming && typeof incoming === 'object' ? incoming : {};
    const item = isUpdate ? { ...existingItem } : {};

    for (const [fieldKey, meta] of Object.entries(itemSchema)) {
      const label = meta.label || fieldKey;
      const provided = Object.hasOwn(values, fieldKey);
      const isSecret = secretFields.includes(fieldKey);
      let raw = values[fieldKey];

      // Secret left blank: keep existing on update, require on create.
      if (isSecret && (!provided || raw === '' || raw === null || raw === undefined)) {
        if (isUpdate && existingItem[fieldKey] !== undefined) {
          item[fieldKey] = existingItem[fieldKey];
          continue;
        }
        if (meta.required) {
          return { error: `${label} is required` };
        }
        item[fieldKey] = { type: meta.type, value: '' };
        continue;
      }

      if (!provided) {
        if (isUpdate && existingItem[fieldKey] !== undefined) {
          item[fieldKey] = existingItem[fieldKey];
          continue;
        }
        if (meta.value !== undefined) {
          raw = meta.value;
        } else if (meta.type === 'boolean') {
          raw = false;
        } else {
          raw = '';
        }
      }

      const coerced = SettingsController.coerceCollectionValue(fieldKey, meta, raw);
      if (coerced.error) {
        return { error: coerced.error };
      }

      if (
        meta.required &&
        meta.type !== 'boolean' &&
        (coerced.value === '' || coerced.value === null || coerced.value === undefined)
      ) {
        return { error: `${label} is required` };
      }

      item[fieldKey] = { type: meta.type, value: coerced.value };
    }

    return { item };
  }

  /**
   * @swagger
   * /api/settings/collections/{path}:
   *   get:
   *     summary: List items in a keyed config collection (Super-admin only)
   *     description: Returns the items of a collection config field. Secret fields are never returned (a has-flag is sent instead).
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Collection items retrieved successfully
   */
  static getCollection(req, res) {
    try {
      const config = loadConfig();
      const { field, error } = SettingsController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      const itemSchema = field.item_schema || {};
      const secretFields = field.secret_fields || [];
      const stored = field.value && typeof field.value === 'object' ? field.value : {};

      const items = Object.entries(stored).map(([key, entry]) => {
        const out = { _key: key };
        for (const [fieldKey, meta] of Object.entries(itemSchema)) {
          if (secretFields.includes(fieldKey)) {
            out[`__has_${fieldKey}`] = Boolean(entry?.[fieldKey]?.value);
            continue;
          }
          let outValue = entry?.[fieldKey]?.value;
          if (outValue === undefined) {
            outValue = meta.value;
          }
          if (outValue === undefined) {
            outValue = '';
          }
          out[fieldKey] = outValue;
        }
        return out;
      });

      return res.json({ success: true, items });
    } catch (error) {
      log.settings.error('Error listing collection', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to list collection: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/collections/{path}:
   *   post:
   *     summary: Create an item in a keyed config collection (Super-admin only)
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Item created
   */
  static createCollectionItem(req, res) {
    try {
      const { key, values } = req.body;

      if (
        !key ||
        typeof key !== 'string' ||
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype' ||
        !/^[a-z0-9_]+$/i.test(key)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Item key must contain only letters, numbers, and underscores',
        });
      }

      const config = loadConfig();
      const { field, error } = SettingsController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      if (!field.value || typeof field.value !== 'object') {
        field.value = {};
      }
      if (field.value[key]) {
        return res.status(409).json({ success: false, message: `'${key}' already exists` });
      }

      const built = SettingsController.buildCollectionItem(field, values, null);
      if (built.error) {
        return res.status(400).json({ success: false, message: built.error });
      }

      field.value[key] = built.item;
      const backupPath = SettingsController.writeConfigWithBackup(config);

      log.settings.info('Collection item created', {
        user: req.user.username,
        collection: req.params.path,
        key,
        backupPath,
      });

      return res.json({
        success: true,
        message: `'${key}' created${field.requires_restart ? '. Restart the server to apply changes.' : '.'}`,
        requiresRestart: field.requires_restart === true,
      });
    } catch (error) {
      log.settings.error('Error creating collection item', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to create item: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/collections/{path}/{key}:
   *   put:
   *     summary: Update an item in a keyed config collection (Super-admin only)
   *     description: Only provided fields change. Blank secret fields keep their current value.
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Item updated
   */
  static updateCollectionItem(req, res) {
    try {
      const { key } = req.params;
      if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return res.status(400).json({ success: false, message: 'Invalid item key' });
      }
      const { values } = req.body;
      const config = loadConfig();
      const { field, error } = SettingsController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      if (!field.value || !field.value[key]) {
        return res.status(404).json({ success: false, message: `'${key}' not found` });
      }

      const built = SettingsController.buildCollectionItem(field, values, field.value[key]);
      if (built.error) {
        return res.status(400).json({ success: false, message: built.error });
      }

      field.value[key] = built.item;
      const backupPath = SettingsController.writeConfigWithBackup(config);

      log.settings.info('Collection item updated', {
        user: req.user.username,
        collection: req.params.path,
        key,
        backupPath,
      });

      return res.json({
        success: true,
        message: `'${key}' updated${field.requires_restart ? '. Restart the server to apply changes.' : '.'}`,
        requiresRestart: field.requires_restart === true,
      });
    } catch (error) {
      log.settings.error('Error updating collection item', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to update item: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/collections/{path}/{key}:
   *   delete:
   *     summary: Delete an item from a keyed config collection (Super-admin only)
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Item deleted
   */
  static deleteCollectionItem(req, res) {
    try {
      const { key } = req.params;
      if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return res.status(400).json({ success: false, message: 'Invalid item key' });
      }
      const config = loadConfig();
      const { field, error } = SettingsController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      if (!field.value || !field.value[key]) {
        return res.status(404).json({ success: false, message: `'${key}' not found` });
      }

      delete field.value[key];
      const backupPath = SettingsController.writeConfigWithBackup(config);

      log.settings.info('Collection item deleted', {
        user: req.user.username,
        collection: req.params.path,
        key,
        backupPath,
      });

      return res.json({
        success: true,
        message: `'${key}' deleted${field.requires_restart ? '. Restart the server to apply changes.' : '.'}`,
        requiresRestart: field.requires_restart === true,
      });
    } catch (error) {
      log.settings.error('Error deleting collection item', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to delete item: ${error.message}`,
      });
    }
  }
}

export default SettingsController;
