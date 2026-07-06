import axios from 'axios';
import https from 'https';
import db from '../models/index.js';
import { log } from '../utils/Logger.js';

// Access Sequelize models
const { server: ServerModel } = db;

// Cache for server lookups to avoid database hits on every asset request
const serverCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Server controller for managing registered host agents
 * This replaces the per-user API key system with application-level agent management
 * NOTE TO AI:
 * Do not ever hardcode limits, timeouts, anything that is valuable to put in the production-config.yaml via the configloader
 * This application is 50% gui and 50% proxy server to the host agents (zoneweaver-agent for Bhyve/OmniOS, hyperweaver-agent for VirtualBox)
 */
class ServerController {
  /**
   * Resolve an agent by registry id (dual-mode plan §4.1). Id-keyed cache avoids the
   * F5 host:port protocol ambiguity — findByPk targets the exact row (with api_key).
   * @param {number|string} id - servers.id
   * @returns {Promise<Object|null>} Server row (with api_key) or null
   */
  static async getAgentById(id) {
    const cacheKey = `id:${id}`;
    const cached = serverCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.server;
    }

    const server = await ServerModel.withScope('withApiKey').findByPk(parseInt(id));
    serverCache.set(cacheKey, { server, timestamp: Date.now() });
    return server;
  }

  /**
   * @swagger
   * /api/servers:
   *   post:
   *     summary: Register a new agent
   *     description: Register a host agent for machine management (Admin only)
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
   *                 description: Agent hostname or IP address
   *                 example: "agent-host.example.com"
   *               port:
   *                 type: integer
   *                 description: Agent port number
   *                 example: 5001
   *               protocol:
   *                 type: string
   *                 enum: [http, https]
   *                 description: Connection protocol
   *                 example: "https"
   *               entityName:
   *                 type: string
   *                 description: Display name for the agent
   *                 example: "Production Agent"
   *               description:
   *                 type: string
   *                 description: Optional server description
   *                 example: "Main production server for machine management"
   *               apiKey:
   *                 type: string
   *                 description: Existing agent API key (optional - will bootstrap if not provided)
   *                 example: "wh_abc123def456..."
   *               allowInsecure:
   *                 type: boolean
   *                 description: Accept self-signed TLS certificates from this agent
   *                 example: false
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
      const { hostname, port, protocol, entityName, description, apiKey, allowInsecure } = req.body;

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
        allowInsecure: Boolean(allowInsecure),
      });

      return res.json({
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
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to add server',
      });
    }
  }

  /**
   * @swagger
   * /api/servers:
   *   get:
   *     summary: Get all registered agents
   *     description: Retrieve list of all registered host agents
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
    void req;
    try {
      const servers = await ServerModel.getAllServers();

      return res.json({
        success: true,
        servers,
      });
    } catch (error) {
      log.server.error('Get servers error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve servers',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/test:
   *   post:
   *     summary: Test agent connectivity
   *     description: Test connection to a host agent
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
   *                 description: Agent hostname or IP address
   *                 example: "agent-host.example.com"
   *               port:
   *                 type: integer
   *                 description: Server port number
   *                 example: 5001
   *               protocol:
   *                 type: string
   *                 enum: [http, https]
   *                 description: Connection protocol
   *                 example: "https"
   *               allowInsecure:
   *                 type: boolean
   *                 description: Accept self-signed TLS certificates for this test
   *                 example: false
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
      const { hostname, port, protocol, allowInsecure } = req.body;

      // Validation
      if (!hostname || !port || !protocol) {
        return res.status(400).json({
          success: false,
          message: 'Hostname, port, and protocol are required',
        });
      }

      // Probe directly — no registry row required (the add-form tests before adding)
      const testResult = await ServerModel.probeStatus(
        hostname,
        parseInt(port),
        protocol,
        Boolean(allowInsecure)
      );

      return res.json({
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
      return res.status(500).json({
        success: false,
        message: 'Failed to test server connection',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverId}:
   *   delete:
   *     summary: Remove a registered agent
   *     description: Remove a registered agent from the Server (Admin only)
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

      return res.json({
        success: true,
        message: 'Server removed successfully',
      });
    } catch (error) {
      log.server.error('Remove server error', {
        error: error.message,
        serverId: req.params.serverId,
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to remove server',
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverId}:
   *   patch:
   *     summary: Update a registered agent
   *     description: Update settings for a registered agent (Admin only). Only allow_insecure is editable.
   *     tags: [Server Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: serverId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Server ID to update
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [allowInsecure]
   *             properties:
   *               allowInsecure:
   *                 type: boolean
   *                 description: Accept self-signed TLS certificates from this agent
   *                 example: true
   *     responses:
   *       200:
   *         description: Server updated successfully
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
   *                   example: "Server updated successfully"
   *                 server:
   *                   $ref: '#/components/schemas/Server'
   *       400:
   *         description: allowInsecure (boolean) is required
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
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async updateServer(req, res) {
    try {
      const { serverId } = req.params;
      const { allowInsecure } = req.body;

      if (typeof allowInsecure !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'allowInsecure (boolean) is required',
        });
      }

      const server = await ServerModel.withScope('withInactive').findByPk(parseInt(serverId));
      if (!server) {
        return res.status(404).json({
          success: false,
          message: 'Server not found',
        });
      }

      await server.update({ allow_insecure: allowInsecure });
      // The proxy cache (30s TTL) must not keep serving the stale flag
      serverCache.delete(`id:${server.id}`);

      return res.json({
        success: true,
        message: 'Server updated successfully',
        server: {
          id: server.id,
          hostname: server.hostname,
          port: server.port,
          protocol: server.protocol,
          entityName: server.entity_name,
          allow_insecure: server.allow_insecure,
        },
      });
    } catch (error) {
      log.server.error('Update server error', {
        error: error.message,
        serverId: req.params.serverId,
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to update server',
      });
    }
  }

  static async proxyStreamingRequest(req, res, proxyConfig, streamConfig) {
    const { cleanHeaders, hostname, port, protocol, path, startTime } = proxyConfig;
    const serverUrl = `${protocol}://${hostname}:${port}`;
    const targetUrl = `${serverUrl}/${path}`;

    const { server } = proxyConfig;
    if (!server || !server.api_key) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration not found',
      });
    }

    try {
      const streamHeaders = {
        ...cleanHeaders,
        Authorization: `Bearer ${server.api_key}`,
        'User-Agent': 'Hyperweaver-Server/1.0',
      };

      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: streamConfig.data,
        headers: streamHeaders,
        params: req.query,
        responseType: 'stream',
        timeout: streamConfig.timeout,
        maxBodyLength: streamConfig.maxBodyLength || Infinity,
        maxContentLength: Infinity,
        // Honor allow_insecure on streaming forwards too (this path previously set no agent, so
        // it ignored the flag). Fresh agent, no keep-alive / session cache → fails closed.
        httpsAgent: new https.Agent({
          rejectUnauthorized: !server.allow_insecure,
          keepAlive: false,
          maxCachedSessions: 0,
        }),
        ...(streamConfig.maxRedirects !== undefined && { maxRedirects: streamConfig.maxRedirects }),
      });

      Object.keys(response.headers).forEach(key => {
        if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
          res.set(key, response.headers[key]);
        }
      });

      res.status(response.status);
      response.data.pipe(res);

      const duration = Date.now() - startTime;
      log.proxy.info(`STREAM: ${streamConfig.label} completed successfully`, {
        duration: `${duration}ms`,
        status: response.status,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      log.proxy.error(`STREAM: ${streamConfig.label} failed`, {
        error: error.message,
        duration: `${duration}ms`,
        isTimeout: error.code === 'ECONNABORTED',
      });

      const status = error.response?.status || 500;
      return res.status(status).json({
        success: false,
        message: error.response?.data?.message || error.message || `${streamConfig.label} failed`,
      });
    }

    return undefined;
  }

  static logFileOperationResult(
    result,
    req,
    fileOperation,
    isFileUpload,
    isFileDownload,
    duration,
    requestData
  ) {
    log.proxy.info('FILE OP: Proxy request completed', {
      operation: fileOperation,
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
        operation: fileOperation,
        error: result.error,
        status: result.status,
        duration: `${duration}ms`,
        requestData,
        query: req.query,
      });
    }
  }

  /**
   * Detect file operation type and log initial file operation details
   * @param {Object} req - Express request object
   * @param {string} path - API path
   * @returns {Object} - File operation info
   */
  static detectFileOperation(req, path) {
    const isFileUpload = path === 'filesystem/upload' && req.method === 'POST';
    const isFileDownload = path === 'filesystem/download' && req.method === 'GET';
    const isFileOperation = path.startsWith('filesystem');
    const fileOpType = isFileUpload ? 'UPLOAD' : 'OTHER';
    const fileOperation = isFileDownload ? 'DOWNLOAD' : fileOpType;

    if (isFileOperation) {
      log.proxy.info('FILE OP: Proxying file operation through zoneweaver proxy', {
        operation: fileOperation,
        method: req.method,
        path,
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

    return { isFileUpload, isFileDownload, isFileOperation, fileOperation };
  }

  /**
   * Build clean headers for proxying, excluding headers that shouldn't be forwarded
   * @param {Object} req - Express request object
   * @returns {Object} - Cleaned headers
   */
  static buildCleanHeaders(req) {
    const cleanHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!['host', 'authorization', 'cookie'].includes(key.toLowerCase())) {
        cleanHeaders[key] = value;
      }
    }
    return cleanHeaders;
  }

  /**
   * Handle standard (non-streaming) proxy requests through the resolved agent row
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} proxyConfig - Proxy configuration (server, path, cleanHeaders, startTime)
   * @param {Object} fileOpInfo - File operation info from detectFileOperation
   * @returns {Object} - Express response
   */
  static async proxyStandardRequest(req, res, proxyConfig, fileOpInfo) {
    const { server, path, cleanHeaders, startTime } = proxyConfig;
    const { isFileUpload, isFileDownload, isFileOperation, fileOperation } = fileOpInfo;

    let requestData;
    const requestOptions = {
      method: req.method,
      params: req.query,
      headers: cleanHeaders,
    };

    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
      requestData = req.body;
      requestOptions.data = requestData;
    }

    // The agent row is already resolved by id (proxyToAgent) — call it directly
    const result = await server.makeRequest(path, requestOptions);

    const duration = Date.now() - startTime;

    if (isFileOperation) {
      ServerController.logFileOperationResult(
        result,
        req,
        fileOperation,
        isFileUpload,
        isFileDownload,
        duration,
        requestData
      );
    }

    if (result.success) {
      return res.status(result.status || 200).json(result.data);
    }
    const status = result.status || 500;
    return res.status(status).json({
      success: false,
      message: result.error || 'Proxy request failed',
    });
  }

  /**
   * @swagger
   * /api/agents/{id}/{path}:
   *   get:
   *     summary: Proxy any request to a registered agent by id
   *     description: Forwards the request (any HTTP method) to the agent identified by its registry id. The sub-path is passed through verbatim to the agent's root-mounted API. Settings and server-restart sub-paths require super-admin; host power-action, ZFS ARC, fault-management, logs, syslog, hosts-file, and database-maintenance sub-paths require admin.
   *     tags: [Agent Proxy]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Registry id of the agent (servers.id)
   *         example: 1
   *       - in: path
   *         name: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Agent API path to forward to
   *         example: "machines"
   *     responses:
   *       200:
   *         description: Response from the agent (varies by endpoint)
   *       401:
   *         description: Not authenticated
   *       404:
   *         description: Agent not found
   *       409:
   *         description: Registered backend is not an agent
   *       500:
   *         description: Proxy error or agent error
   */
  /**
   * Unified id-addressed agent proxy (dual-mode plan §4.1): ALL /api/agents/:id/:path.
   * Resolves the agent by registry id (fixes F5), preserves the streaming special-cases
   * (F14) and clean-header logic of the legacy zapi proxy, and excludes non-agent rows.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async proxyToAgent(req, res) {
    try {
      const { id } = req.params;
      const path = Array.isArray(req.params.splat)
        ? req.params.splat.join('/')
        : req.params.splat || '';

      const server = await ServerController.getAgentById(id);
      if (!server || !server.api_key) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }

      // Role guard (§6.2): a row whose /status reported a non-agent role is excluded
      if (server.capabilities?.role && server.capabilities.role !== 'agent') {
        return res.status(409).json({
          success: false,
          message: 'Registered backend is not an agent',
        });
      }

      const { hostname, port, protocol } = server;
      const fileOpInfo = ServerController.detectFileOperation(req, path);
      const cleanHeaders = ServerController.buildCleanHeaders(req);
      const startTime = Date.now();
      const proxyConfig = { cleanHeaders, hostname, port, protocol, path, startTime, server };

      // Artifact downloads - binary streaming (F14)
      if (path.includes('artifacts/') && path.endsWith('/download') && req.method === 'GET') {
        return await ServerController.proxyStreamingRequest(req, res, proxyConfig, {
          timeout: 300000,
          label: 'Artifact download',
        });
      }

      // VNC screenshot - binary PNG, must stream (JSON parsing would corrupt it) (F14)
      if (path.endsWith('vnc/screenshot') && req.method === 'GET') {
        return await ServerController.proxyStreamingRequest(req, res, proxyConfig, {
          timeout: 20000,
          label: 'VNC screenshot',
        });
      }

      // Multipart uploads - streaming (F14)
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        return await ServerController.proxyStreamingRequest(req, res, proxyConfig, {
          data: req,
          timeout: 1800000,
          maxBodyLength: Infinity,
          label: 'Upload',
        });
      }

      // Standard JSON/regular requests
      return await ServerController.proxyStandardRequest(req, res, proxyConfig, fileOpInfo);
    } catch (error) {
      log.proxy.error('PROXY: Agent proxy error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        id: req.params.id,
        path: req.params.splat,
      });
      return res.status(500).json({ success: false, message: 'Proxy request failed' });
    }
  }
}

export default ServerController;
