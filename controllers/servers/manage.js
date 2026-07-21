import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';
import { serverCache } from './cache.js';

const { server: ServerModel } = db;

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
export const removeServer = async (req, res) => {
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
};

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
export const updateServer = async (req, res) => {
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
};
