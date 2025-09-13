import axios from 'axios';
import Busboy from 'busboy';
import { PassThrough } from 'stream';
import FormData from 'form-data';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';
import { loadConfig } from '../utils/config.js';

// Access Sequelize models
const { server: ServerModel } = db;

// Cache for server lookups to avoid database hits on every asset request
const serverCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Server controller for managing Zoneweaver API connections
 * This replaces the per-user API key system with application-level server management
 */
class ServerController {
  /**
   * Get server with caching to improve performance
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Object|null} - Cached server object or null
   */
  static async getCachedServer(hostname, port, protocol) {
    const cacheKey = `${hostname}:${port}:${protocol}`;
    const cached = serverCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.server;
    }

    // Fetch from database
    const server = await ServerModel.getServer(hostname, port, protocol);

    // Cache the result
    serverCache.set(cacheKey, {
      server,
      timestamp: Date.now(),
    });

    return server;
  }
  /**
   * @swagger
   * /api/servers:
   *   post:
   *     summary: Add a new Zoneweaver API Server
   *     description: Add a Zoneweaver API server for zone management (Admin only)
   *     tags: [Server Management]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [hostname, port, protocol, entityName]
   *             properties:
   *               hostname:
   *                 type: string
   *                 description: Server hostname or IP address
   *                 example: "zoneweaver-api-host.example.com"
   *               port:
   *                 type: integer
   *                 description: Server port number
   *                 example: 5001
   *               protocol:
   *                 type: string
   *                 enum: [http, https]
   *                 description: Connection protocol
   *                 example: "https"
   *               entityName:
   *                 type: string
   *                 description: Display name for the server
   *                 example: "Production Zoneweaver API Server"
   *               description:
   *                 type: string
   *                 description: Optional server description
   *                 example: "Main production server for zone management"
   *               apiKey:
   *                 type: string
   *                 description: Existing Zoneweaver API API key (optional - will bootstrap if not provided)
   *                 example: "wh_abc123def456..."
   *     responses:
   *       200:
   *         description: Server added successfully
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
   *                   example: "Server added successfully"
   *                 server:
   *                   $ref: '#/components/schemas/Server'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
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
  static async addServer(req, res) {
    try {
      const { hostname, port, protocol, entityName, description, apiKey } = req.body;

      // Validation
      if (!hostname || !port || !protocol || !entityName) {
        return res.status(400).json({
          success: false,
          message: 'Hostname, port, protocol, and entity name are required',
        });
      }

      // Add server with bootstrap or existing API key
      const server = await ServerModel.addServer({
        hostname,
        port: parseInt(port),
        protocol,
        entityName,
        description,
        apiKey,
      });

      res.json({
        success: true,
        message: 'Server added successfully',
        server: {
          id: server.id,
          hostname: server.hostname,
          port: server.port,
          protocol: server.protocol,
          entityName: server.entity_name,
          description: server.description,
        },
      });
    } catch (error) {
      log.server.error('Add server error', {
        error: error.message,
        hostname: req.body.hostname,
        port: req.body.port,
      });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add server',
      });
    }
  }

  /**
   * @swagger
   * /api/servers:
   *   get:
   *     summary: Get all Zoneweaver API Servers
   *     description: Retrieve list of all configured Zoneweaver API servers
   *     tags: [Server Management]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Servers retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 servers:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Server'
   *       401:
   *         description: Not authenticated
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
  static async getAllServers(req, res) {
    try {
      const servers = await ServerModel.getAllServers();

      res.json({
        success: true,
        servers,
      });
    } catch (error) {
      log.server.error('Get servers error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve servers',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/test:
   *   post:
   *     summary: Test Zoneweaver API Server connectivity
   *     description: Test connection to a Zoneweaver API server
   *     tags: [Server Management]
   *     security:
   *       - JwtAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [hostname, port, protocol]
   *             properties:
   *               hostname:
   *                 type: string
   *                 description: Server hostname or IP address
   *                 example: "zoneweaver-api-host.example.com"
   *               port:
   *                 type: integer
   *                 description: Server port number
   *                 example: 5001
   *               protocol:
   *                 type: string
   *                 enum: [http, https]
   *                 description: Connection protocol
   *                 example: "https"
   *     responses:
   *       200:
   *         description: Connection test results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   description: Whether connection test succeeded
   *                 message:
   *                   type: string
   *                   example: "Connection successful"
   *                 serverInfo:
   *                   type: object
   *                   description: Server information (if successful)
   *                 error:
   *                   type: string
   *                   description: Error message (if failed)
   *       400:
   *         description: Missing required parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *       401:
   *         description: Not authenticated
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
  static async testServer(req, res) {
    try {
      const { hostname, port, protocol } = req.body;

      // Validation
      if (!hostname || !port || !protocol) {
        return res.status(400).json({
          success: false,
          message: 'Hostname, port, and protocol are required',
        });
      }

      // Test the server
      const testResult = await ServerModel.testServer(hostname, parseInt(port), protocol);

      res.json({
        success: testResult.success,
        message: testResult.success ? 'Connection successful' : 'Connection failed',
        error: testResult.error || null,
        serverInfo: testResult.success ? testResult.data : null,
      });
    } catch (error) {
      log.server.error('Test server error', {
        error: error.message,
        hostname: req.body.hostname,
        port: req.body.port,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to test server connection',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverId}:
   *   delete:
   *     summary: Remove a Zoneweaver API Server
   *     description: Remove a Zoneweaver API server from Zoneweaver (Admin only)
   *     tags: [Server Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Server ID to remove
   *         example: 1
   *     responses:
   *       200:
   *         description: Server removed successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Server removed successfully"
   *       400:
   *         description: Server ID is required
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       403:
   *         description: Insufficient permissions (Admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Server not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Server not found or already removed"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async removeServer(req, res) {
    try {
      const { serverId } = req.params;

      if (!serverId) {
        return res.status(400).json({
          success: false,
          message: 'Server ID is required',
        });
      }

      const success = await ServerModel.removeServer(parseInt(serverId));

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Server not found or already removed',
        });
      }

      res.json({
        success: true,
        message: 'Server removed successfully',
      });
    } catch (error) {
      log.server.error('Remove server error', {
        error: error.message,
        serverId: req.params.serverId,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to remove server',
      });
    }
  }

  /**
   * @swagger
   * /api/zapi/{protocol}/{hostname}/{port}/{path}:
   *   get:
   *     summary: Proxy request to Zoneweaver API (General API proxy)
   *     description: Forward API requests to a specific Zoneweaver API server with authentication
   *     tags: [Zoneweaver API Server]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Zoneweaver API Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Zoneweaver API Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Zoneweaver API Server port
   *         example: 5001
   *       - in: path
   *         name: path
   *         required: true
   *         schema:
   *           type: string
   *         description: API path to proxy to Zoneweaver API
   *         example: "zones"
   *     responses:
   *       200:
   *         description: Successful proxy response from Zoneweaver API
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               description: Response from Zoneweaver API (varies by endpoint)
   *       400:
   *         description: Bad request or validation error
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
   *       404:
   *         description: Zoneweaver API Server not found or endpoint not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Proxy error or Zoneweaver API error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *   post:
   *     summary: Proxy POST request to Zoneweaver API
   *     description: Forward POST requests to Zoneweaver API with authentication
   *     tags: [Zoneweaver API Server]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Zoneweaver API Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Zoneweaver API Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Zoneweaver API Server port
   *         example: 5001
   *       - in: path
   *         name: path
   *         required: true
   *         schema:
   *           type: string
   *         description: API path to proxy to Zoneweaver API
   *         example: "zones/create"
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             description: Request body to forward to Zoneweaver API
   *     responses:
   *       200:
   *         description: Successful proxy response from Zoneweaver API
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               description: Response from Zoneweaver API (varies by endpoint)
   *       400:
   *         description: Bad request or validation error
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
   *       404:
   *         description: Zoneweaver API Server not found or endpoint not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Proxy error or Zoneweaver API error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *   put:
   *     summary: Proxy PUT request to Zoneweaver API
   *     description: Forward PUT requests to Zoneweaver API with authentication
   *     tags: [Zoneweaver API Server]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Zoneweaver API Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Zoneweaver API Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Zoneweaver API Server port
   *         example: 5001
   *       - in: path
   *         name: path
   *         required: true
   *         schema:
   *           type: string
   *         description: API path to proxy to Zoneweaver API
   *         example: "zones/zone-name/update"
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             description: Request body to forward to Zoneweaver API
   *     responses:
   *       200:
   *         description: Successful proxy response from Zoneweaver API
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               description: Response from Zoneweaver API (varies by endpoint)
   *       400:
   *         description: Bad request or validation error
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
   *       404:
   *         description: Zoneweaver API Server not found or endpoint not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Proxy error or Zoneweaver API error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *   delete:
   *     summary: Proxy DELETE request to Zoneweaver API
   *     description: Forward DELETE requests to Zoneweaver API with authentication
   *     tags: [Zoneweaver API Server]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: protocol
   *         required: true
   *         schema:
   *           type: string
   *           enum: [http, https]
   *         description: Zoneweaver API Server protocol
   *         example: "https"
   *       - in: path
   *         name: hostname
   *         required: true
   *         schema:
   *           type: string
   *         description: Zoneweaver API Server hostname
   *         example: "zoneweaver-api-host.example.com"
   *       - in: path
   *         name: port
   *         required: true
   *         schema:
   *           type: integer
   *         description: Zoneweaver API Server port
   *         example: 5001
   *       - in: path
   *         name: path
   *         required: true
   *         schema:
   *           type: string
   *         description: API path to proxy to Zoneweaver API
   *         example: "zones/zone-name"
   *     responses:
   *       200:
   *         description: Successful proxy response from Zoneweaver API
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               description: Response from Zoneweaver API (varies by endpoint)
   *       400:
   *         description: Bad request or validation error
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
   *       404:
   *         description: Zoneweaver API Server not found or endpoint not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Proxy error or Zoneweaver API error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async proxyToZoneweaverAPI(req, res) {
    try {
      const { hostname, port, protocol } = req.params;
      const path = Array.isArray(req.params.splat)
        ? req.params.splat.join('/')
        : req.params.splat || ''; // Express 5.x compatibility fix

      // Enhanced debug logging for file operations
      const isFileUpload = path === 'filesystem/upload' && req.method === 'POST';
      const isFileDownload = path === 'filesystem/download' && req.method === 'GET';
      const isFileOperation = path.startsWith('filesystem');

      if (isFileOperation) {
        log.proxy.info('FILE OP: Proxying file operation through zoneweaver proxy', {
          operation: isFileUpload ? 'UPLOAD' : isFileDownload ? 'DOWNLOAD' : 'OTHER',
          method: req.method,
          path,
          server: `${protocol}://${hostname}:${port}`,
          query: req.query,
          contentType: req.headers['content-type'] || 'none',
          contentLength: req.headers['content-length'] || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          hasAuth: !!req.headers.authorization,
        });

        if (isFileUpload) {
          log.proxy.info('UPLOAD: Processing file upload through proxy', {
            contentType: req.headers['content-type'],
            contentLength: req.headers['content-length'],
            boundary: req.headers['content-type']?.includes('boundary') ? 'present' : 'missing',
            query: req.query,
            bodyKeys: req.body ? Object.keys(req.body) : 'no body',
          });
        }

        if (isFileDownload) {
          log.proxy.info('DOWNLOAD: Processing file download through proxy', {
            filePath: req.query.path || 'unknown',
            query: req.query,
            accept: req.headers.accept || 'none',
          });
        }
      }

      // Create clean headers for Zoneweaver API request - explicitly exclude problematic headers
      const cleanHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        // Skip headers that should not be forwarded to Zoneweaver API
        if (!['host', 'authorization', 'cookie'].includes(key.toLowerCase())) {
          cleanHeaders[key] = value;
        }
      }

      // Note: Multipart uploads now handled through standard ServerModel.makeRequest() flow
      // This ensures consistent timeout configuration, progress reporting, and error handling

      const startTime = Date.now();

      // Special handler for artifact uploads (two-step process)
      if (path === 'artifacts/upload' && req.method === 'POST' && req.headers['content-type']?.includes('multipart/form-data')) {
        return ServerController.handleArtifactUpload(req, res, hostname, parseInt(port || 5001), protocol, cleanHeaders, startTime);
      }

      // For other multipart data, use pure streaming (proxy pattern)
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        log.proxy.info('STREAM: Using pure streaming for multipart upload', {
          path,
          contentType: req.headers['content-type'],
          contentLength: req.headers['content-length'],
          method: req.method,
        });

        const serverUrl = `${protocol}://${hostname}:${port}`;
        const targetUrl = `${serverUrl}/${path}`;

        // Get server for API key
        const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), protocol);
        if (!server || !server.api_key) {
          return res.status(500).json({
            success: false,
            message: 'Server configuration not found',
          });
        }

        try {
          // Prepare headers for backend request
          const streamHeaders = {
            ...cleanHeaders,
            'Authorization': `Bearer ${server.api_key}`,
            'User-Agent': 'Zoneweaver-Proxy/1.0',
          };

          // Stream the request directly to the backend
          const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req, // Stream the incoming request directly
            headers: streamHeaders,
            params: req.query,
            timeout: 1800000, // 30 minutes for large uploads
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            responseType: 'stream',
          });

          // Set response headers from backend
          Object.keys(response.headers).forEach(key => {
            if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
              res.set(key, response.headers[key]);
            }
          });

          res.status(response.status);
          
          // Stream the response back to client
          response.data.pipe(res);

          const duration = Date.now() - startTime;
          log.proxy.info('STREAM: Upload completed successfully', {
            duration: `${duration}ms`,
            status: response.status,
          });

        } catch (error) {
          const duration = Date.now() - startTime;
          log.proxy.error('STREAM: Upload failed', {
            error: error.message,
            duration: `${duration}ms`,
            isTimeout: error.code === 'ECONNABORTED',
          });

          const status = error.response?.status || 500;
          res.status(status).json({
            success: false,
            message: error.response?.data?.message || error.message || 'Upload failed',
          });
        }

        return; // Exit early for streaming uploads
      }

      // For non-multipart requests, use standard ServerModel flow
      let requestData = undefined;
      let requestOptions = {
        method: req.method,
        params: req.query,
        headers: cleanHeaders,
      };

      if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        requestData = req.body;
        requestOptions.data = requestData;
      }

      // Make request through ServerModel for JSON/regular requests
      const result = await ServerModel.makeRequest(hostname, parseInt(port), protocol, path, requestOptions);

      const duration = Date.now() - startTime;

      // Enhanced logging for file operations
      if (isFileOperation) {
        log.proxy.info('FILE OP: Proxy request completed', {
          operation: isFileUpload ? 'UPLOAD' : isFileDownload ? 'DOWNLOAD' : 'OTHER',
          success: result.success,
          status: result.status,
          duration: `${duration}ms`,
          responseSize: result.data ? JSON.stringify(result.data).length : 0,
          error: result.error || null,
        });

        if (isFileUpload && result.success) {
          log.proxy.info('UPLOAD: File uploaded successfully through proxy', {
            fileName: result.data?.file?.name || 'unknown',
            filePath: result.data?.file?.path || 'unknown',
            fileSize: result.data?.file?.size || 'unknown',
            duration: `${duration}ms`,
          });
        }

        if (isFileDownload && result.success) {
          log.proxy.info('DOWNLOAD: File download prepared through proxy', {
            filePath: req.query.path,
            duration: `${duration}ms`,
            hasData: !!result.data,
          });
        }

        if (!result.success) {
          log.proxy.error('FILE OP: File operation failed through proxy', {
            operation: isFileUpload ? 'UPLOAD' : isFileDownload ? 'DOWNLOAD' : 'OTHER',
            error: result.error,
            status: result.status,
            duration: `${duration}ms`,
            requestData,
            query: req.query,
          });
        }
      }

      if (result.success) {
        res.status(result.status || 200).json(result.data);
      } else {
        const status = result.status || 500;
        res.status(status).json({
          success: false,
          message: result.error || 'Proxy request failed',
        });
      }
    } catch (error) {
      log.proxy.error('PROXY: Zoneweaver API proxy error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        path: req.params.splat,
        hostname: req.params.hostname,
        port: req.params.port,
      });

      res.status(500).json({
        success: false,
        message: 'Proxy request failed',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/zones/{zoneName}/vnc/websockify:
   *   get:
   *     summary: Proxy VNC WebSocket connections
   *     description: WebSocket proxy for react-vnc connections (websockify endpoint only)
   *     tags: [VNC Console]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *       - in: path
   *         name: zoneName
   *         required: true
   *         schema:
   *           type: string
   *         description: Name of the zone
   *         example: "my-zone"
   *     responses:
   *       200:
   *         description: WebSocket connection established
   *       401:
   *         description: Not authenticated (optional auth)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Server, zone, or VNC session not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Proxy error or Zoneweaver API error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  /**
   * Security function to validate VNC paths and prevent SSRF attacks
   * Only allows websockify endpoint for react-vnc WebSocket connections
   * @param {string} vncPath - The VNC path to validate
   * @returns {boolean} - True if path is valid, false otherwise
   */
  static isValidVncPath(vncPath) {
    if (!vncPath || typeof vncPath !== 'string') {
      return false;
    }

    // Remove path traversal attempts and normalize
    const cleanPath = vncPath
      .replace(/\.\./g, '') // Remove .. sequences
      .replace(/\/+/g, '/') // Normalize multiple slashes
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .trim();

    // Only allow websockify endpoint (used by react-vnc)
    return cleanPath === 'websockify';
  }

  /**
   * 🛡️ SECURITY: Build server allowlist from database (CodeQL SSRF fix)
   * Implements CodeQL recommended pattern: user input selects server-controlled value
   * Step 1: Get all allowed servers from database (server-controlled)
   * @returns {Object} - Map of server addresses to server configs
   */
  static async buildServerAllowlist() {
    try {
      const servers = await ServerModel.getAllServers();
      const allowlist = {};

      servers.forEach(server => {
        const key = `${server.hostname}:${server.port}`;
        allowlist[key] = {
          protocol: server.protocol,
          hostname: server.hostname,
          port: server.port,
          api_key: server.api_key,
        };
      });

      log.security.info('Built server allowlist', {
        entries: Object.keys(allowlist).length,
      });
      return allowlist;
    } catch (error) {
      log.security.error('Failed to build server allowlist', {
        error: error.message,
      });
      return {};
    }
  }

  /**
   * 🛡️ SECURITY: Validate server using CodeQL recommended pattern
   * Step 2: User input selects from server-controlled allowlist
   * Step 3: Return server-controlled value only
   * @param {string} serverAddress - User input (selector only)
   * @returns {Object|null} - Server-controlled value or null
   */
  static async validateServerAddress(serverAddress) {
    try {
      // Step 1: Build server-controlled allowlist
      const allowedServers = await ServerController.buildServerAllowlist();

      // Step 2: User input selects from allowlist (like CodeQL's "EU" → "europe" example)
      const allowedServer = allowedServers[serverAddress];

      if (!allowedServer) {
        log.security.error('Server not in allowlist', { serverAddress });
        return null;
      }

      // Step 3: Return server-controlled values only (like CodeQL's subdomain example)
      log.security.info('Server selected from allowlist', {
        hostname: allowedServer.hostname,
        port: allowedServer.port,
      });
      return allowedServer;
    } catch (error) {
      log.security.error('Server validation error', { error: error.message });
      return null;
    }
  }

  static async proxyVncGeneral(req, res) {
    try {
      const { serverAddress, zoneName } = req.params;
      const userVncPath = Array.isArray(req.params.splat)
        ? req.params.splat.join('/')
        : req.params.splat || ''; // Express 5.x compatibility fix

      // 🛡️ SECURITY FIX: Validate VNC path to prevent SSRF attacks
      if (!ServerController.isValidVncPath(userVncPath)) {
        log.security.warn('Invalid VNC path blocked', { vncPath: userVncPath });
        return res.status(400).json({
          success: false,
          message: 'Invalid VNC path. Only websockify endpoint is allowed.',
          blocked_path: userVncPath,
        });
      }

      // Use server-controlled constant to break CodeQL data flow tracing
      const allowedVncPath = 'websockify';

      // Use same validation pattern as other methods in this file
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        log.security.error('Server not found', { serverAddress });
        return res.status(403).json({
          success: false,
          message: 'Server not found. Only configured servers are permitted.',
          rejected_address: serverAddress,
        });
      }

      log.security.info('Server validated', {
        hostname: server.hostname,
        port: server.port,
      });


      // Check if this is a WebSocket upgrade request
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        log.vnc.debug('WebSocket upgrade request for VNC websockify');
        // This will be handled by the WebSocket upgrade handler in index.js
        return;
      }

      // Handle regular HTTP requests to websockify endpoint
      const queryString = req.url.split('?')[1];

      // Build URL using validated server properties and server-controlled path constant
      let zapiUrl = `${server.protocol}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/${allowedVncPath}`;

      if (queryString) {
        zapiUrl += `?${queryString}`;
      }

      log.vnc.info('VNC: Proxying websockify', { zapiUrl });

      try {
        // Make authenticated request to Zoneweaver API
        const requestHeaders = {
          Authorization: `Bearer ${server.api_key}`,
          'User-Agent': 'Zoneweaver-Proxy/1.0',
        };

        // Forward relevant headers from original request
        if (req.headers.accept) requestHeaders.Accept = req.headers.accept;
        if (req.headers['accept-encoding'])
          requestHeaders['Accept-Encoding'] = req.headers['accept-encoding'];
        if (req.headers['accept-language'])
          requestHeaders['Accept-Language'] = req.headers['accept-language'];

        const response = await axios({
          method: req.method,
          url: zapiUrl,
          headers: requestHeaders,
          data: req.method !== 'GET' && req.method !== 'DELETE' ? req.body : undefined,
          responseType: 'stream',
          timeout: 30000,
          maxRedirects: 0, // 🛡️ SECURITY FIX: Disable redirects to prevent SSRF bypass
        });

        // Set security headers
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
          'X-Proxied-By': 'Zoneweaver-VNC',
          'X-Frame-Options': 'SAMEORIGIN',
        });

        // Forward response headers except caching ones
        Object.keys(response.headers).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (
            ![
              'transfer-encoding',
              'connection',
              'cache-control',
              'pragma',
              'expires',
              'etag',
              'last-modified',
            ].includes(lowerKey)
          ) {
            res.set(key, response.headers[key]);
          }
        });

        // Pipe response directly
        res.status(response.status);
        response.data.pipe(res);
      } catch (proxyError) {
        log.vnc.error('VNC proxy failed for websockify', {
          error: proxyError.message,
        });

        if (proxyError.response) {
          const statusCode = proxyError.response.status;
          res.status(statusCode).json({
            success: false,
            message: `VNC proxy error: ${statusCode}`,
            error: 'VNC session may not be active',
          });
        } else {
          res.status(500).json({
            success: false,
            message: `VNC proxy connection error: ${proxyError.message}`,
          });
        }
      }
    } catch (error) {
      log.vnc.error('VNC proxy error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'VNC proxy request failed',
        error: error.message,
      });
    }
  }

  /**
   * @swagger
   * /api/terminal/start:
   *   post:
   *     summary: Start a new terminal session
   *     description: Create a new terminal session on the default Zoneweaver API Server
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Terminal session started successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 session:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: Terminal session ID
   *                       example: "term_abc123def456"
   *                     status:
   *                       type: string
   *                       description: Session status
   *                       example: "active"
   *                     created:
   *                       type: string
   *                       format: date-time
   *                       description: Session creation timestamp
   *                       example: "2025-01-04T17:18:00.324Z"
   *                     websocketUrl:
   *                       type: string
   *                       description: WebSocket URL for terminal connection
   *                       example: "wss://localhost:3000/term/term_abc123def456"
   *       400:
   *         description: No servers configured
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "No servers configured."
   *       401:
   *         description: Not authenticated
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
  static async startTerminalSession(req, res) {
    try {
      // For now, we'll just use the most recent server.
      // In the future, we might want to pass the server info from the client.
      const servers = await ServerModel.getAllServers();
      if (servers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No servers configured.',
        });
      }
      const server = await ServerModel.getServer(
        servers[0].hostname,
        servers[0].port,
        servers[0].protocol
      );

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'terminal/start',
        { method: 'POST' }
      );

      if (result.success) {
        res.json({ success: true, session: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to start terminal session',
        });
      }
    } catch (error) {
      log.terminal.error('Start terminal session error', {
        error: error.message,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to start terminal session',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/terminal/start:
   *   post:
   *     summary: Start a new terminal session on specific server
   *     description: Create a new terminal session on the specified Zoneweaver API Server
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [terminal_cookie]
   *             properties:
   *               terminal_cookie:
   *                 type: string
   *                 description: Terminal session cookie for session reuse
   *                 example: "terminal_host1_5001_browser123_1234567890"
   *               zone_name:
   *                 type: string
   *                 description: Zone name (optional for host terminal)
   *                 example: "my-zone"
   *     responses:
   *       200:
   *         description: Terminal session started successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: Terminal session ID
   *                       example: "term_abc123def456"
   *                     status:
   *                       type: string
   *                       description: Session status
   *                       example: "active"
   *                     reused:
   *                       type: boolean
   *                       description: Whether session was reused
   *                       example: true
   *                     websocket_url:
   *                       type: string
   *                       description: WebSocket URL for terminal connection
   *                       example: "/api/servers/host:5001/terminal/sessions/term_abc123def456/ws"
   *                     buffer:
   *                       type: string
   *                       description: Terminal buffer content for reconnection
   *                       example: "root@host:~# ls\nfile1.txt file2.txt\nroot@host:~# "
   *       400:
   *         description: Bad request - missing terminal_cookie
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Server not found
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
  static async startServerTerminalSession(req, res) {
    try {
      const { serverAddress } = req.params;
      const { terminal_cookie, zone_name } = req.body;

      log.terminal.info('TERMINAL START: Received request', {
        serverAddress,
        terminal_cookie,
        zone_name,
      });

      if (!terminal_cookie) {
        return res.status(400).json({
          success: false,
          error: 'terminal_cookie is required',
        });
      }

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        log.terminal.error('TERMINAL START: Server not found', { serverAddress, hostname, port });
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      log.terminal.info('TERMINAL START: Server found', {
        hostname: server.hostname,
        port: server.port,
        protocol: server.protocol,
        hasApiKey: !!server.api_key,
      });

      log.terminal.debug('TERMINAL START: Creating/reusing session', {
        endpoint: 'terminal/start',
        method: 'POST',
        terminal_cookie,
      });

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'terminal/start',
        {
          method: 'POST',
          data: {
            terminal_cookie,
            zone_name,
          },
        }
      );

      // Extract session data from nested response structure (matches frontend parsing pattern)
      const sessionData = result.data?.data || result.data;

      log.terminal.debug('TERMINAL START: Session result', {
        success: result.success,
        status: result.status,
        hasData: !!result.data,
        sessionId: sessionData?.id,
        reused: sessionData?.reused,
        websocket_url: sessionData?.websocket_url,
        error: result.error,
      });

      if (result.success) {
        log.terminal.info('TERMINAL START: Session created/reused successfully', {
          sessionId: sessionData.id,
          reused: sessionData.reused,
          status: sessionData.status,
          websocket_url: sessionData.websocket_url,
        });

        res.json({ success: true, data: sessionData });
      } else {
        log.terminal.error('TERMINAL START: Session creation failed', {
          status: result.status,
          error: result.error,
          message: result.message,
        });

        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to start terminal session',
        });
      }
    } catch (error) {
      log.terminal.error('TERMINAL START: Exception occurred', {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start terminal session',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/terminal/sessions:
   *   get:
   *     summary: Get all terminal sessions on specific server
   *     description: Retrieve all active terminal sessions on the specified Zoneweaver API Server
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *     responses:
   *       200:
   *         description: Terminal sessions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 sessions:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "term_abc123def456"
   *                       terminal_cookie:
   *                         type: string
   *                         example: "terminal_host1_5001_browser123_1234567890"
   *                       status:
   *                         type: string
   *                         example: "active"
   *                       created:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-01-04T17:18:00.324Z"
   *       404:
   *         description: Server not found
   *       500:
   *         description: Internal server error
   */
  static async getServerTerminalSessions(req, res) {
    try {
      const { serverAddress } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'terminal/sessions',
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, sessions: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to get terminal sessions',
        });
      }
    } catch (error) {
      log.terminal.error('Get terminal sessions error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get terminal sessions',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/terminal/sessions/{terminalCookie}/health:
   *   get:
   *     summary: Check terminal session health
   *     description: Check if a terminal session is healthy and active
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *       - in: path
   *         name: terminalCookie
   *         required: true
   *         schema:
   *           type: string
   *         description: Terminal session cookie
   *         example: "terminal_host1_5001_browser123_1234567890"
   *     responses:
   *       200:
   *         description: Health check result
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 healthy:
   *                   type: boolean
   *                   description: Whether session is healthy
   *                   example: true
   *       404:
   *         description: Server or session not found
   *       500:
   *         description: Internal server error
   */
  static async checkServerTerminalHealth(req, res) {
    try {
      const { serverAddress, terminalCookie } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `terminal/sessions/${terminalCookie}/health`,
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, healthy: result.data.healthy });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to check terminal session health',
        });
      }
    } catch (error) {
      log.terminal.error('Check terminal health error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to check terminal session health',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/terminal/sessions/{sessionId}:
   *   get:
   *     summary: Get specific terminal session details
   *     description: Retrieve details of a specific terminal session by session ID
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Terminal session ID
   *         example: "term_abc123def456"
   *     responses:
   *       200:
   *         description: Terminal session details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 session:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "term_abc123def456"
   *                     terminal_cookie:
   *                       type: string
   *                       example: "terminal_host1_5001_browser123_1234567890"
   *                     status:
   *                       type: string
   *                       example: "active"
   *                     created:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-01-04T17:18:00.324Z"
   *       404:
   *         description: Server or session not found
   *       500:
   *         description: Internal server error
   */
  static async getServerTerminalSession(req, res) {
    try {
      const { serverAddress, sessionId } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `terminal/sessions/${sessionId}`,
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, session: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to get terminal session',
        });
      }
    } catch (error) {
      log.terminal.error('Get terminal session error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get terminal session',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/terminal/sessions/{sessionId}/stop:
   *   delete:
   *     summary: Stop a terminal session
   *     description: Stop and terminate a terminal session by session ID
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Terminal session ID to stop
   *         example: "term_abc123def456"
   *     responses:
   *       200:
   *         description: Terminal session stopped successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Terminal session stopped"
   *       404:
   *         description: Server or session not found
   *       500:
   *         description: Internal server error
   */
  static async stopServerTerminalSession(req, res) {
    try {
      const { serverAddress, sessionId } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `terminal/sessions/${sessionId}/stop`,
        { method: 'DELETE' }
      );

      if (result.success) {
        res.json({ success: true, message: 'Terminal session stopped' });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to stop terminal session',
        });
      }
    } catch (error) {
      log.terminal.error('Stop terminal session error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to stop terminal session',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/zones/{zoneName}/zlogin/start:
   *   post:
   *     summary: Start a new zlogin session for zone
   *     description: Create a new zlogin (zone login) shell session for the specified zone on a Zoneweaver API Server
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *       - in: path
   *         name: zoneName
   *         required: true
   *         schema:
   *           type: string
   *         description: Name of the zone to login to
   *         example: "my-zone"
   *     responses:
   *       200:
   *         description: Zlogin session started successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 session:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: Zlogin session ID
   *                       example: "zlogin_abc123def456"
   *                     zone_name:
   *                       type: string
   *                       description: Zone name
   *                       example: "my-zone"
   *                     status:
   *                       type: string
   *                       description: Session status
   *                       example: "active"
   *                     created:
   *                       type: string
   *                       format: date-time
   *                       description: Session creation timestamp
   *                       example: "2025-01-04T17:18:00.324Z"
   *                     websocketUrl:
   *                       type: string
   *                       description: WebSocket URL for shell connection
   *                       example: "wss://localhost:3000/zlogin/zlogin_abc123def456"
   *       404:
   *         description: Server not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Server not found"
   *       401:
   *         description: Not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: Internal server error or zone not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async startZloginSession(req, res) {
    try {
      const { serverAddress, zoneName } = req.params;
      log.zlogin.info('ZLOGIN START: Received request', {
        serverAddress,
        zoneName,
      });

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        log.zlogin.error('ZLOGIN START: Server not found', { serverAddress, hostname, port });
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      log.zlogin.info('ZLOGIN START: Server found', {
        hostname: server.hostname,
        port: server.port,
        protocol: server.protocol,
        hasApiKey: !!server.api_key,
      });

      // First, get all zlogin sessions and stop any that are for the same zone
      log.zlogin.debug('ZLOGIN START: Checking for existing sessions');
      const sessionsResult = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'zlogin/sessions',
        { method: 'GET' }
      );

      log.zlogin.debug('ZLOGIN START: Existing sessions response', {
        success: sessionsResult.success,
        status: sessionsResult.status,
        sessionCount: sessionsResult.success ? sessionsResult.data?.length : 'unknown',
      });

      if (sessionsResult.success) {
        const sessions = sessionsResult.data;
        const existingSession = sessions.find(session => session.zone_name === zoneName);
        if (existingSession) {
          log.zlogin.info('ZLOGIN START: Found existing session, stopping it', {
            sessionId: existingSession.id,
            zoneName: existingSession.zone_name,
            status: existingSession.status,
          });

          const stopResult = await ServerModel.makeRequest(
            server.hostname,
            server.port,
            server.protocol,
            `zlogin/sessions/${existingSession.id}/stop`,
            { method: 'DELETE' }
          );

          log.zlogin.debug('ZLOGIN START: Stop existing session result', {
            success: stopResult.success,
            status: stopResult.status,
            message: stopResult.message || stopResult.error,
          });
        } else {
          log.zlogin.debug('ZLOGIN START: No existing session found for zone');
        }
      }

      log.zlogin.debug('ZLOGIN START: Creating new session', {
        endpoint: `zones/${zoneName}/zlogin/start`,
        method: 'POST',
      });

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zones/${zoneName}/zlogin/start`,
        { method: 'POST' }
      );

      log.zlogin.debug('ZLOGIN START: Session creation result', {
        success: result.success,
        status: result.status,
        hasData: !!result.data,
        sessionId: result.data?.id,
        error: result.error,
      });

      if (result.success) {
        log.zlogin.info('ZLOGIN START: Session created successfully', {
          sessionId: result.data.id,
          zoneName: result.data.zone_name || zoneName,
          status: result.data.status,
        });

        // Add websocket_url field that frontend expects for WebSocket connection
        res.json({
          success: true,
          session: {
            ...result.data,
            websocket_url: `/zlogin/${result.data.id}`,
          },
        });
      } else {
        log.zlogin.error('ZLOGIN START: Session creation failed', {
          status: result.status,
          error: result.error,
          message: result.message,
        });

        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to start zlogin session',
        });
      }
    } catch (error) {
      log.zlogin.error('ZLOGIN START: Exception occurred', {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start zlogin session',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/zlogin/sessions:
   *   get:
   *     summary: Get all zlogin sessions
   *     description: Retrieve all active zlogin sessions on the specified Zoneweaver API Server
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *     responses:
   *       200:
   *         description: Zlogin sessions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 sessions:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: Zlogin session ID
   *                         example: "zlogin_abc123def456"
   *                       zone_name:
   *                         type: string
   *                         description: Zone name
   *                         example: "my-zone"
   *                       status:
   *                         type: string
   *                         description: Session status
   *                         example: "active"
   *                       created:
   *                         type: string
   *                         format: date-time
   *                         description: Session creation timestamp
   *                         example: "2025-01-04T17:18:00.324Z"
   *                       last_activity:
   *                         type: string
   *                         format: date-time
   *                         description: Last activity timestamp
   *                         example: "2025-01-04T17:19:00.324Z"
   *       404:
   *         description: Server not found
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
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async getZloginSessions(req, res) {
    try {
      const { serverAddress } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'zlogin/sessions',
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, sessions: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to get zlogin sessions',
        });
      }
    } catch (error) {
      log.zlogin.error('Get zlogin sessions error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get zlogin sessions',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/zlogin/sessions/{sessionId}:
   *   get:
   *     summary: Get a specific zlogin session
   *     description: Retrieve details of a specific zlogin session by session ID
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Zlogin session ID
   *         example: "zlogin_abc123def456"
   *     responses:
   *       200:
   *         description: Zlogin session details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 session:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: Zlogin session ID
   *                       example: "zlogin_abc123def456"
   *                     zone_name:
   *                       type: string
   *                       description: Zone name
   *                       example: "my-zone"
   *                     status:
   *                       type: string
   *                       description: Session status
   *                       example: "active"
   *                     created:
   *                       type: string
   *                       format: date-time
   *                       description: Session creation timestamp
   *                       example: "2025-01-04T17:18:00.324Z"
   *                     last_activity:
   *                       type: string
   *                       format: date-time
   *                       description: Last activity timestamp
   *                       example: "2025-01-04T17:19:00.324Z"
   *                     pid:
   *                       type: integer
   *                       description: Process ID of the session
   *                       example: 12345
   *       404:
   *         description: Server or session not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               serverNotFound:
   *                 summary: Server not found
   *                 value:
   *                   success: false
   *                   message: "Server not found"
   *               sessionNotFound:
   *                 summary: Session not found
   *                 value:
   *                   success: false
   *                   message: "Zlogin session not found"
   *       401:
   *         description: Not authenticated
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
  static async getZloginSession(req, res) {
    try {
      const { serverAddress, sessionId } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zlogin/sessions/${sessionId}`,
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, session: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to get zlogin session',
        });
      }
    } catch (error) {
      log.zlogin.error('Get zlogin session error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to get zlogin session',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/zlogin/sessions/{sessionId}/stop:
   *   delete:
   *     summary: Stop a zlogin session
   *     description: Stop and terminate a zlogin session by session ID
   *     tags: [Terminal & Shell]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverAddress
   *         required: true
   *         schema:
   *           type: string
   *         description: Server address in format hostname:port
   *         example: "zoneweaver-api-host.example.com:5001"
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Zlogin session ID to stop
   *         example: "zlogin_abc123def456"
   *     responses:
   *       200:
   *         description: Zlogin session stopped successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Zlogin session stopped"
   *       404:
   *         description: Server or session not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               serverNotFound:
   *                 summary: Server not found
   *                 value:
   *                   success: false
   *                   message: "Server not found"
   *               sessionNotFound:
   *                 summary: Session not found
   *                 value:
   *                   success: false
   *                   message: "Zlogin session not found"
   *       401:
   *         description: Not authenticated
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
  static async stopZloginSession(req, res) {
    try {
      const { serverAddress, sessionId } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(
        hostname,
        parseInt(port || 5001),
        'https'
      );

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zlogin/sessions/${sessionId}/stop`,
        { method: 'DELETE' }
      );

      if (result.success) {
        res.json({ success: true, message: 'Zlogin session stopped' });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to stop zlogin session',
        });
      }
    } catch (error) {
      log.zlogin.error('Stop zlogin session error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to stop zlogin session',
      });
    }
  }

  /**
   * Handle two-step artifact upload process
   * Step 1: Parse multipart data and prepare upload
   * Step 2: Stream file to upload endpoint
   */
  static async handleArtifactUpload(req, res, hostname, port, protocol, cleanHeaders, startTime) {
    try {
      log.proxy.info('ARTIFACT UPLOAD: Starting two-step upload process', {
        contentLength: req.headers['content-length'],
        contentType: req.headers['content-type'],
      });

      // Get server for API key
      const server = await ServerController.getCachedServer(hostname, port, protocol);
      if (!server || !server.api_key) {
        return res.status(500).json({
          success: false,
          message: 'Server configuration not found',
        });
      }

      // Load configuration for limits and timeouts
      const config = loadConfig();
      const maxFileSizeGB = config.limits?.file_uploads?.max_file_size_gb?.value || 50;
      const prepareTimeoutMs = config.limits?.api_timeouts?.prepare_request?.value || 30000;
      const uploadTimeoutMs = config.limits?.api_timeouts?.file_upload?.value || 1800000;

      // Parse multipart data
      const metadata = {};
      let fileStream = null;
      let filename = '';

      const busboy = Busboy({ 
        headers: req.headers,
        limits: {
          fileSize: maxFileSizeGB * 1024 * 1024 * 1024, // Convert GB to bytes
        }
      });

      const parsePromise = new Promise((resolve, reject) => {
        // Handle form fields (metadata)
        busboy.on('field', (fieldname, value) => {
          metadata[fieldname] = value;
          log.proxy.debug('ARTIFACT UPLOAD: Field received', { fieldname, value: fieldname.includes('checksum') ? '[REDACTED]' : value });
        });

        // Handle file field
        busboy.on('file', (fieldname, file, info) => {
          filename = info.filename;
          log.proxy.info('ARTIFACT UPLOAD: File field received', { 
            fieldname, 
            filename: info.filename, 
            encoding: info.encoding, 
            mimeType: info.mimeType 
          });

          // Create a PassThrough stream to capture file data
          fileStream = new PassThrough();
          file.pipe(fileStream);
        });

        // Handle completion
        busboy.on('finish', () => {
          log.proxy.debug('ARTIFACT UPLOAD: Multipart parsing completed', {
            filename,
            metadataKeys: Object.keys(metadata),
          });
          resolve();
        });

        // Handle errors
        busboy.on('error', (error) => {
          log.proxy.error('ARTIFACT UPLOAD: Multipart parsing failed', { error: error.message });
          reject(error);
        });
      });

      // Start parsing
      req.pipe(busboy);
      await parsePromise;

      if (!fileStream) {
        return res.status(400).json({
          success: false,
          message: 'No file found in upload',
        });
      }

      log.proxy.info('ARTIFACT UPLOAD: Step 1 - Preparing upload', {
        filename,
        size: req.headers['content-length'],
        storage_path_id: metadata.storage_path_id,
      });

      // Step 1: Prepare upload
      const preparePayload = {
        filename: filename,
        size: parseInt(req.headers['content-length'], 10),
        storage_path_id: metadata.storage_path_id,
        expected_checksum: metadata.expected_checksum || null,
        checksum_algorithm: metadata.checksum_algorithm || 'sha256',
        overwrite_existing: metadata.overwrite_existing === 'true' || false,
      };

      const prepareResponse = await axios.post(
        `${protocol}://${hostname}:${port}/artifacts/upload/prepare`,
        preparePayload,
        {
          headers: {
            'Authorization': `Bearer ${server.api_key}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Zoneweaver-Proxy/1.0',
          },
          timeout: 30000, // 30 seconds for prepare step
        }
      );

      const taskId = prepareResponse.data.task_id;
      log.proxy.info('ARTIFACT UPLOAD: Step 1 completed - Upload prepared', {
        task_id: taskId,
        upload_url: prepareResponse.data.upload_url,
      });

      // Step 2: Upload file
      log.proxy.info('ARTIFACT UPLOAD: Step 2 - Streaming file to upload endpoint', {
        task_id: taskId,
        targetUrl: `${protocol}://${hostname}:${port}/artifacts/upload/${taskId}`,
      });

      // Create FormData with just the file
      const formData = new FormData();
      formData.append('file', fileStream, {
        filename: filename,
        contentType: 'application/octet-stream', // Let backend determine actual type
      });

      const uploadResponse = await axios.post(
        `${protocol}://${hostname}:${port}/artifacts/upload/${taskId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${server.api_key}`,
            'User-Agent': 'Zoneweaver-Proxy/1.0',
            ...formData.getHeaders(), // Get proper multipart headers
          },
          timeout: 1800000, // 30 minutes for file upload
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      const duration = Date.now() - startTime;
      log.proxy.info('ARTIFACT UPLOAD: Two-step upload completed successfully', {
        task_id: taskId,
        filename,
        duration: `${duration}ms`,
        status: uploadResponse.status,
      });

      // Return the upload response (Step 2) to frontend
      res.status(uploadResponse.status).json(uploadResponse.data);

    } catch (error) {
      const duration = Date.now() - startTime;
      log.proxy.error('ARTIFACT UPLOAD: Two-step upload failed', {
        error: error.message,
        duration: `${duration}ms`,
        step: error.config?.url?.includes('/prepare') ? 'prepare' : 'upload',
        isTimeout: error.code === 'ECONNABORTED',
      });

      // Determine appropriate status code
      let status = 500;
      let message = 'Artifact upload failed';

      if (error.response) {
        status = error.response.status;
        message = error.response.data?.message || error.response.statusText || message;
      } else if (error.code === 'ECONNABORTED') {
        status = 408;
        message = 'Upload timeout - file may be too large or connection too slow';
      }

      res.status(status).json({
        success: false,
        message,
        error: error.message,
      });
    }
  }
}

export default ServerController;
