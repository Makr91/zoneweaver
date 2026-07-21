import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';
import { filterAndAnnotateServers } from '../../utils/orgVisibility.js';

const { server: ServerModel } = db;

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
export const addServer = async (req, res) => {
  try {
    const { hostname, port, protocol, entityName, description, apiKey, allowInsecure } = req.body;

    if (!hostname || !port || !protocol || !entityName) {
      return res.status(400).json({
        success: false,
        message: 'Hostname, port, protocol, and entity name are required',
      });
    }

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
};

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
export const getAllServers = async (req, res) => {
  try {
    const servers = await ServerModel.getAllServers();
    const visible = await filterAndAnnotateServers(req, servers);

    return res.json({
      success: true,
      servers: visible,
    });
  } catch (error) {
    log.server.error('Get servers error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve servers',
    });
  }
};

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
export const testServer = async (req, res) => {
  try {
    const { hostname, port, protocol, allowInsecure } = req.body;

    if (!hostname || !port || !protocol) {
      return res.status(400).json({
        success: false,
        message: 'Hostname, port, and protocol are required',
      });
    }

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
};
