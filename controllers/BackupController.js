import fs from 'fs';
import path from 'path';
import { log } from '../utils/Logger.js';
import SettingsController from './SettingsController.js';

/**
 * Backup Controller - Manages Hyperweaver Server configuration backups
 * Only accessible by super-admin users
 */
class BackupController {
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
   *     description: Restore Hyperweaver Server configuration from a specific backup file
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
}

export default BackupController;
