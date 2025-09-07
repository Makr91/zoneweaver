
import fs from 'fs';
import path from 'path';
import multer from 'multer';
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
      const newValues = req.body; // Flat key-value pairs from frontend
      
      // Create backup of current config
      const backupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
      fs.copyFileSync(SettingsController.configPath, backupPath);

      // Load current config with metadata structure
      const currentConfig = loadConfig();
      
      // Update values while preserving metadata structure
      const updatedConfig = SettingsController.updateConfigValues(currentConfig, newValues);

      // Write updated config with preserved metadata
      const updatedYaml = YAML.stringify(updatedConfig, {
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
        requiresRestart: SettingsController.requiresRestart(newValues),
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
        message: 'Server restart initiated. Please monitor the page for automatic reload.'
      });

      // Increased delay to ensure response is fully sent
      setTimeout(() => {
        console.log('Restarting server...');
        process.exit(0); // Let process manager restart the app
      }, 2500);

    } catch (error) {
      console.error('Error restarting server:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restart server: ' + error.message
      });
    }
  }

  /**
   * Configure multer for SSL file uploads
   */
  static get sslUpload() {
    const storage = multer.memoryStorage(); // Store in memory temporarily
    return multer({
      storage: storage,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for SSL files
      },
      fileFilter: (req, file, cb) => {
        // Validate SSL file types
        const allowedExtensions = ['.pem', '.crt', '.key', '.cer', '.ca'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`), false);
        }
      }
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
  static async uploadSSLFile(req, res) {
    try {
      // Use multer middleware to handle file upload
      SettingsController.sslUpload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
              success: false,
              message: 'File too large. Maximum size is 5MB.'
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        // Validate required parameters
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        const { fieldPath } = req.body;
        if (!fieldPath) {
          return res.status(400).json({
            success: false,
            message: 'fieldPath is required'
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
            console.log(`Created SSL directory: ${sslDir}`);
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
          const isPEMFormat = fileContent.includes('-----BEGIN') && fileContent.includes('-----END');
          
          if (!isPEMFormat) {
            return res.status(400).json({
              success: false,
              message: 'Invalid SSL file format. File must be in PEM format.'
            });
          }

          // Save file to SSL directory
          fs.writeFileSync(filePath, req.file.buffer, { mode: 0o600 });
          console.log(`SSL file uploaded by user ${req.user.username}: ${filename} -> ${filePath}`);

          // Return success response
          res.json({
            success: true,
            message: `SSL certificate uploaded successfully: ${filename}`,
            filePath: filePath
          });

        } catch (uploadError) {
          console.error('SSL file upload error:', uploadError);
          res.status(500).json({
            success: false,
            message: `Failed to save SSL file: ${uploadError.message}`
          });
        }
      });

    } catch (error) {
      console.error('SSL upload handler error:', error);
      res.status(500).json({
        success: false,
        message: 'SSL file upload failed: ' + error.message
      });
    }
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
    const setNestedValue = (obj, path, value) => {
      const keys = path.split('.');
      let current = obj;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
      
      const finalKey = keys[keys.length - 1];
      
      // If the target is a metadata object with a 'value' property, update it
      if (current[finalKey] && typeof current[finalKey] === 'object' && current[finalKey].hasOwnProperty('value')) {
        current[finalKey].value = value;
      } else {
        // Otherwise, set the value directly
        current[finalKey] = value;
      }
    };
    
    // Update each value in the config structure
    for (const [path, value] of Object.entries(newValues)) {
      try {
        setNestedValue(updatedConfig, path, value);
      } catch (error) {
        console.warn(`Failed to update config path ${path}:`, error.message);
      }
    }
    
    return updatedConfig;
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
  static async restoreFromBackup(req, res) {
    try {
      const { filename } = req.params;
      const configDir = path.dirname(SettingsController.configPath);
      const backupPath = path.join(configDir, filename);

      // Verify backup file exists and is a valid backup
      if (!filename.startsWith('config.yaml.backup.') || !fs.existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }

      // Create backup of current config before restore
      const restoreBackupPath = `${SettingsController.configPath}.backup.${Date.now()}`;
      fs.copyFileSync(SettingsController.configPath, restoreBackupPath);

      // Restore from backup
      fs.copyFileSync(backupPath, SettingsController.configPath);

      console.log(`Configuration restored from ${filename} by user ${req.user.username} (${req.user.role})`);
      console.log(`Current config backed up to: ${path.basename(restoreBackupPath)}`);

      res.json({
        success: true,
        message: 'Configuration restored successfully. Settings will take effect after next page reload.',
        backupPath: path.basename(restoreBackupPath)
      });

    } catch (error) {
      console.error('Error restoring backup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore backup: ' + error.message
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
  static async deleteBackup(req, res) {
    try {
      const { filename } = req.params;
      const configDir = path.dirname(SettingsController.configPath);
      const backupPath = path.join(configDir, filename);

      // Verify backup file exists and is a valid backup
      if (!filename.startsWith('config.yaml.backup.') || !fs.existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }

      // Delete the backup file
      fs.unlinkSync(backupPath);

      console.log(`Backup ${filename} deleted by user ${req.user.username} (${req.user.role})`);

      res.json({
        success: true,
        message: 'Backup deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete backup: ' + error.message
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
