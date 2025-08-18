import db from '../models/index.js';

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
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.server;
    }
    
    // Fetch from database
    const server = await ServerModel.getServer(hostname, port, protocol);
    
    // Cache the result
    serverCache.set(cacheKey, {
      server,
      timestamp: Date.now()
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
          message: 'Hostname, port, protocol, and entity name are required' 
        });
      }

      // Add server with bootstrap or existing API key
      const server = await ServerModel.addServer({
        hostname,
        port: parseInt(port),
        protocol,
        entityName,
        description,
        apiKey
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
          description: server.description
        }
      });
    } catch (error) {
      console.error('Add server error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to add server' 
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
        servers: servers
      });
    } catch (error) {
      console.error('Get servers error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve servers' 
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
          message: 'Hostname, port, and protocol are required' 
        });
      }

      // Test the server
      const testResult = await ServerModel.testServer(hostname, parseInt(port), protocol);

      res.json({
        success: testResult.success,
        message: testResult.success ? 'Connection successful' : 'Connection failed',
        error: testResult.error || null,
        serverInfo: testResult.success ? testResult.data : null
      });
    } catch (error) {
      console.error('Test server error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test server connection' 
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
          message: 'Server ID is required' 
        });
      }

      const success = await ServerModel.removeServer(parseInt(serverId));

      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: 'Server not found or already removed' 
        });
      }

      res.json({
        success: true,
        message: 'Server removed successfully'
      });
    } catch (error) {
      console.error('Remove server error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to remove server' 
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
        : (req.params.splat || ''); // Express 5.x compatibility fix
      // Create clean headers for Zoneweaver API request - explicitly exclude problematic headers
      const cleanHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        // Skip headers that should not be forwarded to Zoneweaver API
        if (!['host', 'authorization', 'cookie'].includes(key.toLowerCase())) {
          cleanHeaders[key] = value;
        }
      }

      // Prepare request data - don't send empty objects
      let requestData = undefined;
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        // Only send data if there's actual content
        if (req.body && Object.keys(req.body).length > 0) {
          requestData = req.body;
        }
      }

      // Make request through ServerModel
      const result = await ServerModel.makeRequest(
        hostname, 
        parseInt(port), 
        protocol, 
        path, 
        {
          method: req.method,
          data: requestData,
          params: req.query,
          headers: cleanHeaders
        }
      );

      if (result.success) {
        res.status(result.status || 200).json(result.data);
      } else {
        const status = result.status || 500;
        res.status(status).json({ 
          success: false, 
          message: result.error || 'Proxy request failed' 
        });
      }
    } catch (error) {
      console.error('Zoneweaver API proxy error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Proxy request failed'
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/zones/{zoneName}/vnc/{path}:
   *   get:
   *     summary: Proxy VNC assets and requests
   *     description: General VNC proxy for static assets, WebSocket connections, and other VNC-related requests
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
   *       - in: path
   *         name: path
   *         required: true
   *         schema:
   *           type: string
   *         description: VNC asset path (CSS, JS, images, WebSocket, etc.)
   *         example: "app/ui.js"
   *     responses:
   *       200:
   *         description: VNC asset served successfully
   *         content:
   *           text/css:
   *             schema:
   *               type: string
   *               description: CSS stylesheets (scoped for Zoneweaver)
   *           application/javascript:
   *             schema:
   *               type: string
   *               description: JavaScript files
   *           image/*:
   *             schema:
   *               type: string
   *               format: binary
   *               description: Image assets
   *           application/json:
   *             schema:
   *               type: object
   *               description: API responses
   *       401:
   *         description: Not authenticated (optional auth)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: Server, zone, or asset not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               serverNotFound:
   *                 summary: Server not found
   *                 value:
   *                   success: false
   *                   message: "Zoneweaver API Server hostname:port not found in Zoneweaver configuration"
   *               assetNotFound:
   *                 summary: Asset not found
   *                 value:
   *                   success: false
   *                   message: "Asset not found"
   *                   asset_path: "app/missing.js"
   *       500:
   *         description: Proxy error or Zoneweaver API error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async proxyVncGeneral(req, res) {
    try {
      const { serverAddress, zoneName } = req.params;
      const vncPath = Array.isArray(req.params.splat) 
        ? req.params.splat.join('/') 
        : (req.params.splat || ''); // Express 5.x compatibility fix
      
      // Parse hostname and port from serverAddress
      const [hostname, port] = serverAddress.split(':');
      
      // Use cached server lookup to avoid database hits on every asset request
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        console.error(`🔗 VNC Asset: Server not found - ${hostname}:${port}`);
        return res.status(404).json({
          success: false,
          message: `Zoneweaver API Server ${hostname}:${port} not found in Zoneweaver configuration`,
          asset_path: vncPath
        });
      }

      if (!server.api_key) {
        console.error(`🔗 VNC Asset: No API key for server ${hostname}:${port}`);
        return res.status(500).json({
          success: false,
          message: `No API key configured for Zoneweaver API Server ${hostname}:${port}`,
          asset_path: vncPath
        });
      }

      // Import required modules
      const axios = (await import('axios')).default;
      
      // Check if this is a WebSocket upgrade request
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        console.log(`🔌 WebSocket upgrade request for VNC path: ${vncPath}`);
        
        // Use native WebSocket implementation for better control
        // This will be handled by the WebSocket upgrade handler in index.js
        return;
      }

      // Handle regular HTTP requests (static assets, API calls)
      const queryString = req.url.split('?')[1];
      
      // Construct the Zoneweaver API URL - aligned with backend's new asset routing
      let zapiUrl = `${server.protocol}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/${vncPath}`;
      
      // Append query parameters if present
      if (queryString) {
        zapiUrl += `?${queryString}`;
      }
      
      // Only log CSS files and console requests to reduce noise
      const needsLogging = vncPath.includes('console') || vncPath.endsWith('.css');
      if (needsLogging) {
        console.log(`🔗 VNC Asset: Proxying ${vncPath || 'root'} to ${zapiUrl}`);
      }

      try {
        // Make authenticated request to Zoneweaver API
        const requestHeaders = {
          'Authorization': `Bearer ${server.api_key}`,
          'User-Agent': 'Zoneweaver-Proxy/1.0'
        };

        // Forward relevant headers from original request
        if (req.headers.accept) requestHeaders.Accept = req.headers.accept;
        if (req.headers['accept-encoding']) requestHeaders['Accept-Encoding'] = req.headers['accept-encoding'];
        if (req.headers['accept-language']) requestHeaders['Accept-Language'] = req.headers['accept-language'];

        const response = await axios({
          method: req.method,
          url: zapiUrl,
          headers: requestHeaders,
          data: req.method !== 'GET' && req.method !== 'DELETE' ? req.body : undefined,
          responseType: 'stream',
          timeout: 30000
        });

        // Apply aggressive no-cache headers for all VNC content
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Proxied-By': 'Zoneweaver',
          'X-Frame-Options': 'SAMEORIGIN'
        });

        // Check if this is an iframe request - skip all processing for iframe isolation
        const isIframeRequest = req.headers['sec-fetch-dest'] === 'iframe' || 
                               req.headers.referer?.includes('/zones/') ||
                               req.get('X-Requested-With') === 'iframe';

        // Check if this is a CSS file that needs scoping - but skip for iframes
        const contentType = response.headers['content-type'] || '';
        const needsCssScoping = !isIframeRequest && (contentType.includes('text/css') || vncPath.endsWith('.css'));

        if (isIframeRequest) {
          // Only log first few assets and CSS files for iframe requests to reduce noise
          const shouldLog = needsLogging || vncPath.endsWith('.css') || vncPath.includes('core/rfb.js') || vncPath.includes('ui.js');
          if (shouldLog) {
            console.log(`🖼️ VNC IFRAME: Passing ${vncPath} through unmodified for iframe isolation`);
          }
          
          // Pass through completely unmodified for true iframe isolation
          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Proxied-By': 'Zoneweaver-Iframe',
            'X-Frame-Options': 'SAMEORIGIN'
          });

          // Forward other headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'content-type', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          res.status(response.status);
          response.data.pipe(res);

        } else if (needsCssScoping) {
          // Buffer CSS content for scoping
          let cssContent = '';
          
          response.data.on('data', (chunk) => {
            cssContent += chunk.toString();
          });
          
          response.data.on('end', () => {
            // Apply CSS scoping to prevent conflicts with main app
            const scopedCss = cssContent.replace(/([^{}]+){/g, (match, selector) => {
              const cleanSelector = selector.trim();
              
              // Skip @rules, already scoped selectors, and global selectors
              if (cleanSelector.startsWith('@') || cleanSelector.includes('.vnc-viewer') || cleanSelector === 'html' || cleanSelector === 'body') {
                return match;
              }
              
              // Add .vnc-viewer scope
              return `.vnc-viewer ${cleanSelector} {`;
            });
            
            console.log(`🎨 VNC CSS: Applied scoping to ${vncPath}`);
            
            // Set response headers
            res.set({
              'Content-Type': 'text/css',
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Proxied-By': 'Zoneweaver',
              'Content-Length': Buffer.byteLength(scopedCss)
            });
            
            res.status(response.status).send(scopedCss);
          });
          
          response.data.on('error', (error) => {
            console.error('Error reading CSS content for scoping:', error);
            res.status(500).send('/* Error processing CSS */');
          });
          
        } else {
          // Forward response headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          // Set status and pipe response
          res.status(response.status);
          response.data.pipe(res);
        }

      } catch (proxyError) {
        console.error(`🔗 VNC Asset proxy failed for ${vncPath}:`, proxyError.message);
        
        if (proxyError.response) {
          const statusCode = proxyError.response.status;
          // Handle backend-specific errors as documented by backend AI
          if (statusCode === 404) {
            return res.status(404).json({
              success: false,
              message: 'Asset not found',
              asset_path: vncPath,
              error: 'VNC session may not be active'
            });
          }
          
          res.status(statusCode).json({
            success: false,
            message: `VNC asset proxy error: ${statusCode}`,
            asset_path: vncPath
          });
        } else {
          res.status(500).json({
            success: false,
            message: `VNC asset proxy connection error: ${proxyError.message}`,
            asset_path: vncPath
          });
        }
      }

    } catch (error) {
      console.error('🔗 VNC general proxy error:', error.message);
      res.status(500).json({
        success: false,
        message: 'VNC proxy request failed',
        error: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/servers/{serverAddress}/zones/{zoneName}/vnc/console:
   *   get:
   *     summary: Access VNC console for zone
   *     description: Proxy to Zoneweaver API VNC console with URL rewriting for seamless integration in Zoneweaver
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
   *       - in: query
   *         name: autoconnect
   *         required: false
   *         schema:
   *           type: boolean
   *         description: Auto-connect to VNC (noVNC parameter)
   *         example: true
   *       - in: query
   *         name: resize
   *         required: false
   *         schema:
   *           type: string
   *           enum: [scale, remote]
   *         description: Resize method (noVNC parameter)
   *         example: "scale"
   *     responses:
   *       200:
   *         description: VNC console HTML page
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *               description: noVNC client HTML with rewritten URLs for Zoneweaver integration
   *       401:
   *         description: Not authenticated (optional auth for iframe compatibility)
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *               description: HTML error page
   *       404:
   *         description: Server or zone not found
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *               description: HTML error page with user-friendly message
   *             examples:
   *               serverNotFound:
   *                 summary: Server not found
   *                 value: '<html><body><h2>Server Not Found</h2><p>Zoneweaver API Server not found in Zoneweaver configuration.</p></body></html>'
   *               configError:
   *                 summary: Configuration error
   *                 value: '<html><body><h2>Configuration Error</h2><p>No API key configured for Zoneweaver API Server</p></body></html>'
   *       500:
   *         description: Proxy error or Zoneweaver API error
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   *               description: HTML error page with retry button
   */
  static async proxyVncConsole(req, res) {
    try {
      const { serverAddress, zoneName } = req.params;
      
      // Parse hostname and port from serverAddress
      const [hostname, port] = serverAddress.split(':');
      
      // Use cached server lookup to avoid database hits on every asset request
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        console.error(`🔗 VNC Console: Server not found - ${hostname}:${port}`);
        return res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2 style="color: #e74c3c;">Server Not Found</h2>
              <p>Zoneweaver API Server ${hostname}:${port} not found in Zoneweaver configuration.</p>
              <p style="color: #7f8c8d; font-size: 0.9em;">Please add this server in Zoneweaver settings.</p>
            </body>
          </html>
        `);
      }

      if (!server.api_key) {
        console.error(`🔗 VNC Console: No API key for server ${hostname}:${port}`);
        return res.status(500).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2 style="color: #e74c3c;">Configuration Error</h2>
              <p>No API key configured for Zoneweaver API Server ${hostname}:${port}</p>
              <p style="color: #7f8c8d; font-size: 0.9em;">
                Please check the server configuration in Zoneweaver settings.
              </p>
            </body>
          </html>
        `);
      }

      // Import axios for HTTP proxy requests
      const axios = (await import('axios')).default;
      
      // Extract query parameters from the request URL to forward to Zoneweaver API
      const queryString = req.url.split('?')[1];
      
      // Construct the Zoneweaver API VNC console URL - aligned with backend implementation
      let zapiUrl = `${server.protocol}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/console`;
      
      // Append query parameters if present (for noVNC configuration)
      if (queryString) {
        zapiUrl += `?${queryString}`;
      }
      
      console.log(`🔗 VNC Console: Proxying request to ${zapiUrl}`);

      try {
        // Make authenticated request to Zoneweaver API
        const requestHeaders = {
          'Authorization': `Bearer ${server.api_key}`,
          'User-Agent': 'Zoneweaver-Proxy/1.0',
          'Accept': req.headers.accept || '*/*'
        };
        
        console.log(`Making request with headers:`, { 
          'Authorization': `Bearer ${server.api_key.substring(0, 10)}...`, 
          'User-Agent': requestHeaders['User-Agent'],
          'Accept': requestHeaders['Accept']
        });

        const response = await axios({
          method: req.method,
          url: zapiUrl,
          headers: requestHeaders,
          responseType: 'stream', // ✅ FIX: Enable streaming response
          timeout: 30000
        });

        // Check if this is an iframe request - if so, skip all processing for true isolation
        const isIframeRequest = req.headers['sec-fetch-dest'] === 'iframe' || 
                               req.headers.referer?.includes('/zones/') ||
                               req.get('X-Requested-With') === 'iframe';

        // Check if this content needs URL rewriting (HTML, JS, CSS) - but skip for iframes
        const contentType = response.headers['content-type'] || '';
        const needsRewriting = !isIframeRequest && (
          contentType.includes('text/html') || 
          contentType.includes('text/css') || 
          contentType.includes('application/javascript') ||
          contentType.includes('text/javascript')
        );

        if (isIframeRequest) {
          console.log(`🖼️ VNC IFRAME: Passing content through unmodified for iframe isolation`);
          
          // Pass through completely unmodified for true iframe isolation
          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Proxied-By': 'Zoneweaver-Iframe'
          });

          // Forward other headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'content-type', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          res.status(response.status);
          response.data.pipe(res);
          
        } else if (needsRewriting) {
          // Buffer the content for rewriting
          let content = '';
          
          response.data.on('data', (chunk) => {
            content += chunk.toString();
          });
          
          response.data.on('end', () => {
            // Get frontend URL details
            const frontendHost = req.get('host');
            const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
            const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
            
            let rewrittenContent = content;
            
            // Comprehensive URL rewriting patterns
            const patterns = [
              // Rewrite relative asset paths that start with "app/"
              {
                pattern: /href="app\//g,
                replacement: `href="${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/app/`
              },
              {
                pattern: /src="app\//g,
                replacement: `src="${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/app/`
              },
              // WebSocket URLs
              {
                pattern: new RegExp(`wss?://${server.hostname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:${server.port}/websockify`, 'g'),
                replacement: `${wsProtocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/websockify`
              },
              // HTTP/HTTPS URLs (for assets, API calls, etc.)
              {
                pattern: new RegExp(`https?://${server.hostname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:${server.port}/zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/`, 'g'),
                replacement: `${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/`
              },
              // Relative URLs that might be constructed dynamically
              {
                pattern: new RegExp(`["'](?:\\.\\./)*zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/([^"']*?)["']`, 'g'),
                replacement: `"${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/$1"`
              },
              // JavaScript string concatenation patterns
              {
                pattern: new RegExp(`["']/zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/["']`, 'g'),
                replacement: `"${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/"`
              },
              // CSS url() references
              {
                pattern: new RegExp(`url\\(["']?(?:\\.\\./)*zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/([^"')]*?)["']?\\)`, 'g'),
                replacement: `url("${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/$1")`
              }
            ];
            
            // Apply all rewriting patterns
            patterns.forEach(({ pattern, replacement }) => {
              const before = rewrittenContent.length;
              rewrittenContent = rewrittenContent.replace(pattern, replacement);
              const after = rewrittenContent.length;
              if (before !== after) {
                console.log(`🔄 URL rewrite applied: ${pattern.source}`);
              }
            });
            
            // Set aggressive no-cache headers for all VNC content
            res.set({
              'Content-Type': contentType,
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Frame-Options': 'SAMEORIGIN',
              'X-Proxied-By': 'Zoneweaver',
              'Content-Length': Buffer.byteLength(rewrittenContent),
              // Content Security Policy to block direct backend access
              'Content-Security-Policy': `connect-src 'self' ${wsProtocol}://${frontendHost}; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`
            });
            
            res.status(response.status).send(rewrittenContent);
          });
          
          response.data.on('error', (error) => {
            console.error('Error reading content for rewriting:', error);
            res.status(500).send('Error processing content');
          });
          
        } else {
          // For binary content (images, etc.), pipe directly with no-cache headers
          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Proxied-By': 'Zoneweaver'
          });

          // Forward other headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'content-type', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          res.status(response.status);
          response.data.pipe(res);
        }

      } catch (proxyError) {
        console.error('VNC proxy request failed:', proxyError.message);
        
        if (proxyError.response) {
          // Handle specific HTTP errors from Zoneweaver API
          const statusCode = proxyError.response.status;
          const errorMessage = proxyError.response.data || proxyError.message;
          
          res.status(statusCode).send(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                <h2 style="color: #e74c3c;">VNC Console Error</h2>
                <p><strong>Status:</strong> ${statusCode}</p>
                <p><strong>Message:</strong> ${errorMessage}</p>
                <p style="color: #7f8c8d; font-size: 0.9em;">
                  Make sure the zone is running and VNC is enabled.
                </p>
                <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 10px;">
                  Retry
                </button>
              </body>
            </html>
          `);
        } else {
          // Network or other errors
          res.status(500).send(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                <h2 style="color: #e74c3c;">Connection Error</h2>
                <p>Failed to connect to Zoneweaver API.</p>
                <p style="color: #7f8c8d; font-size: 0.9em;">
                  ${proxyError.message}
                </p>
                <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 10px;">
                  Retry
                </button>
              </body>
            </html>
          `);
        }
      }

    } catch (error) {
      console.error('VNC console proxy error:', error.message);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #e74c3c;">Proxy Error</h2>
            <p>Failed to proxy VNC console request.</p>
            <p style="color: #7f8c8d; font-size: 0.9em;">
              ${error.message}
            </p>
            <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 10px;">
              Retry
            </button>
          </body>
        </html>
      `);
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
          message: "No servers configured."
        });
      }
      const server = await ServerModel.getServer(servers[0].hostname, servers[0].port, servers[0].protocol);

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
          message: result.error || 'Failed to start terminal session'
        });
      }
    } catch (error) {
      console.error('Start terminal session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to start terminal session'
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

      console.log('🚀 TERMINAL START: Received request', {
        serverAddress,
        terminal_cookie,
        zone_name,
        timestamp: new Date().toISOString()
      });

      if (!terminal_cookie) {
        return res.status(400).json({
          success: false,
          error: 'terminal_cookie is required'
        });
      }

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        console.error('❌ TERMINAL START: Server not found', { serverAddress, hostname, port });
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      console.log('✅ TERMINAL START: Server found', {
        hostname: server.hostname,
        port: server.port,
        protocol: server.protocol,
        hasApiKey: !!server.api_key
      });

      console.log('🎬 TERMINAL START: Creating/reusing session', {
        endpoint: 'terminal/start',
        method: 'POST',
        terminal_cookie
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
            zone_name
          }
        }
      );

      // Extract session data from nested response structure (matches frontend parsing pattern)
      const sessionData = result.data?.data || result.data;
      
      console.log('📋 TERMINAL START: Session result', {
        success: result.success,
        status: result.status,
        hasData: !!result.data,
        sessionId: sessionData?.id,
        reused: sessionData?.reused,
        websocket_url: sessionData?.websocket_url,
        error: result.error
      });

      if (result.success) {
        console.log('🎉 TERMINAL START: Session created/reused successfully', {
          sessionId: sessionData.id,
          reused: sessionData.reused ? '⚡ REUSED' : '🆕 NEW',
          status: sessionData.status,
          websocket_url: sessionData.websocket_url
        });

        res.json({ success: true, data: sessionData });
      } else {
        console.error('❌ TERMINAL START: Session creation failed', {
          status: result.status,
          error: result.error,
          message: result.message
        });

        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to start terminal session'
        });
      }
    } catch (error) {
      console.error('💥 TERMINAL START: Exception occurred', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start terminal session'
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
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

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
          message: result.error || 'Failed to get terminal sessions'
        });
      }
    } catch (error) {
      console.error('Get terminal sessions error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get terminal sessions'
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
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

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
          message: result.error || 'Failed to check terminal session health'
        });
      }
    } catch (error) {
      console.error('Check terminal health error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to check terminal session health'
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
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

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
          message: result.error || 'Failed to get terminal session'
        });
      }
    } catch (error) {
      console.error('Get terminal session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get terminal session'
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
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

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
          message: result.error || 'Failed to stop terminal session'
        });
      }
    } catch (error) {
      console.error('Stop terminal session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to stop terminal session'
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
      console.log('🚀 ZLOGIN START: Received request', {
        serverAddress,
        zoneName,
        timestamp: new Date().toISOString()
      });

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        console.error('❌ ZLOGIN START: Server not found', { serverAddress, hostname, port });
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      console.log('✅ ZLOGIN START: Server found', {
        hostname: server.hostname,
        port: server.port,
        protocol: server.protocol,
        hasApiKey: !!server.api_key
      });

      // First, get all zlogin sessions and stop any that are for the same zone
      console.log('🔍 ZLOGIN START: Checking for existing sessions');
      const sessionsResult = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'zlogin/sessions',
        { method: 'GET' }
      );

      console.log('📊 ZLOGIN START: Existing sessions response', {
        success: sessionsResult.success,
        status: sessionsResult.status,
        sessionCount: sessionsResult.success ? sessionsResult.data?.length : 'unknown',
        data: sessionsResult.data
      });

      if (sessionsResult.success) {
        const sessions = sessionsResult.data;
        const existingSession = sessions.find(session => session.zone_name === zoneName);
        if (existingSession) {
          console.log('🧹 ZLOGIN START: Found existing session, stopping it', {
            sessionId: existingSession.id,
            zoneName: existingSession.zone_name,
            status: existingSession.status
          });

          const stopResult = await ServerModel.makeRequest(
            server.hostname,
            server.port,
            server.protocol,
            `zlogin/sessions/${existingSession.id}/stop`,
            { method: 'DELETE' }
          );

          console.log('🛑 ZLOGIN START: Stop existing session result', {
            success: stopResult.success,
            status: stopResult.status,
            message: stopResult.message || stopResult.error
          });
        } else {
          console.log('✅ ZLOGIN START: No existing session found for zone');
        }
      }

      console.log('🎬 ZLOGIN START: Creating new session', {
        endpoint: `zones/${zoneName}/zlogin/start`,
        method: 'POST'
      });

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zones/${zoneName}/zlogin/start`,
        { method: 'POST' }
      );

      console.log('📋 ZLOGIN START: Session creation result', {
        success: result.success,
        status: result.status,
        hasData: !!result.data,
        sessionId: result.data?.id,
        error: result.error,
        data: result.data
      });

      if (result.success) {
        console.log('🎉 ZLOGIN START: Session created successfully', {
          sessionId: result.data.id,
          zoneName: result.data.zone_name || zoneName,
          status: result.data.status
        });

        res.json({ success: true, session: result.data });
      } else {
        console.error('❌ ZLOGIN START: Session creation failed', {
          status: result.status,
          error: result.error,
          message: result.message
        });

        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to start zlogin session'
        });
      }
    } catch (error) {
      console.error('💥 ZLOGIN START: Exception occurred', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start zlogin session'
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
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

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
          message: result.error || 'Failed to get zlogin sessions'
        });
      }
    } catch (error) {
      console.error('Get zlogin sessions error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get zlogin sessions'
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
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

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
          message: result.error || 'Failed to get zlogin session'
        });
      }
    } catch (error) {
      console.error('Get zlogin session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get zlogin session'
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
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

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
          message: result.error || 'Failed to stop zlogin session'
        });
      }
    } catch (error) {
      console.error('Stop zlogin session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to stop zlogin session'
      });
    }
  }
};

export default ServerController;
