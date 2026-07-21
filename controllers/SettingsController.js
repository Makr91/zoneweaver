/**
 * @fileoverview Settings Controller - Manages Hyperweaver Server system settings.
 * Only accessible by super-admin users.
 */

import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';
import {
  writeConfigWithBackup,
  updateConfigValues,
  requiresRestart,
} from './settings/configWriter.js';

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
 *                 config:
 *                   type: object
 *                   description: The complete configuration structure (metadata included) — the frontend generates forms from it
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
const getSettings = (req, res) => {
  void req;
  try {
    const config = loadConfig();

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
};

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update Hyperweaver Server system settings (Super-admin only)
 *     description: Update system configuration settings and save to config.yaml. The body is flat dotted-path key-value pairs; values update in place while the metadata structure is preserved.
 *     tags: [System Settings]
 *     security:
 *       - JwtAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *             description: Flat dotted-path keys (e.g. "frontend.name") mapping to new values
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
const updateSettings = (req, res) => {
  try {
    const newValues = req.body;

    const currentConfig = loadConfig();

    const updatedConfig = updateConfigValues(currentConfig, newValues);

    const backupPath = writeConfigWithBackup(updatedConfig);

    log.settings.info('Settings updated', {
      user: req.user.username,
      role: req.user.role,
      backupPath,
    });

    res.json({
      success: true,
      message:
        'Settings updated successfully. Some changes may require a server restart to take effect.',
      requiresRestart: requiresRestart(newValues),
      backupPath,
    });
  } catch (error) {
    log.settings.error('Error updating settings', { error: error.message });
    res.status(500).json({
      success: false,
      message: `Failed to update settings: ${error.message}`,
    });
  }
};

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
/**
 * Reset the tunable defaults while preserving critical settings (network, SSL, database,
 * auth providers). Keys follow this config's real metadata layout; frontend.version is
 * release-managed and deliberately not reset.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetSettings = (req, res) => {
  try {
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
    const updatedConfig = updateConfigValues(currentConfig, defaults);
    const backupPath = writeConfigWithBackup(updatedConfig);

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
};

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
/**
 * Sends the response first, then SIGTERMs itself after a delay long enough for the
 * response to flush — the process manager restarts the app.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const restartServer = (req, res) => {
  try {
    log.settings.info('Server restart requested', {
      user: req.user.username,
      role: req.user.role,
    });

    res.json({
      success: true,
      message: 'Server restart initiated. Please monitor the page for automatic reload.',
    });

    setTimeout(() => {
      log.settings.info('Restarting server...');
      process.kill(process.pid, 'SIGTERM');
    }, 2500);
  } catch (error) {
    log.settings.error('Error restarting server', { error: error.message });
    res.status(500).json({
      success: false,
      message: `Failed to restart server: ${error.message}`,
    });
  }
};

const SettingsController = {
  getSettings,
  updateSettings,
  resetSettings,
  restartServer,
  writeConfigWithBackup,
  updateConfigValues,
  requiresRestart,
};

export default SettingsController;
