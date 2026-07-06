import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';

/**
 * SSL Controller - Manages SSL certificate uploads for Hyperweaver Server settings
 * Only accessible by super-admin users
 */
class SslController {
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
   *                   example: "/etc/hyperweaver-server/ssl/certificate.crt"
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
      SslController.sslUpload(req, res, err => {
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
          let sslDir = '/etc/hyperweaver-server/ssl';

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
}

export default SslController;
