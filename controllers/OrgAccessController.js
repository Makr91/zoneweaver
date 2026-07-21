import db from '../models/index.js';
import { log } from '../utils/Logger.js';
import { canManageAgentOrgs, canManageMachineOrgs } from '../utils/orgVisibility.js';

const { serverOrg: ServerOrgModel, machineOrg: MachineOrgModel } = db;

const validOrgList = value =>
  Array.isArray(value) && value.every(item => typeof item === 'string' && item.length > 0);

/**
 * @swagger
 * /api/servers/{serverId}/orgs:
 *   get:
 *     summary: List the orgs that own a registered agent (Admin only)
 *     description: Returns the org uuids owning this agent. An agent with no orgs is open to every authenticated user of this Server.
 *     tags: [Organization Access]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Registry id of the agent (servers.id)
 *     responses:
 *       200:
 *         description: Org uuids retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 orgs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["f47ac10b-58cc-4372-a567-0e02b2c3d479"]
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
export const getServerOrgs = async (req, res) => {
  try {
    if (!(await canManageAgentOrgs(req, parseInt(req.params.serverId)))) {
      return res.status(403).json({ success: false, message: 'Not an org manager of this agent' });
    }
    const rows = await ServerOrgModel.findOrgsForServer(parseInt(req.params.serverId));
    return res.json({ success: true, orgs: rows.map(row => row.org_uuid) });
  } catch (error) {
    log.auth.error('Get server orgs error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load agent orgs' });
  }
};

/**
 * @swagger
 * /api/servers/{serverId}/orgs:
 *   put:
 *     summary: Set the orgs that own a registered agent (Admin only)
 *     description: Replaces the agent's owning-org list. Owning orgs see the whole agent including machines with no org assignment. An empty list reopens the agent to every authenticated user.
 *     tags: [Organization Access]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Registry id of the agent (servers.id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orgs]
 *             properties:
 *               orgs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Org uuids that own this agent
 *     responses:
 *       200:
 *         description: Org list replaced
 *       400:
 *         description: orgs must be an array of org uuid strings
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
export const setServerOrgs = async (req, res) => {
  try {
    if (!(await canManageAgentOrgs(req, parseInt(req.params.serverId)))) {
      return res.status(403).json({ success: false, message: 'Not an org manager of this agent' });
    }
    const { orgs } = req.body;
    if (!validOrgList(orgs)) {
      return res.status(400).json({
        success: false,
        message: 'orgs must be an array of org uuid strings',
      });
    }

    await ServerOrgModel.setOrgsForServer(parseInt(req.params.serverId), orgs);

    log.auth.info('Agent org ownership updated', {
      user: req.user.username,
      serverId: req.params.serverId,
      orgs,
    });

    return res.json({ success: true, message: 'Agent orgs updated', orgs });
  } catch (error) {
    log.auth.error('Set server orgs error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to update agent orgs' });
  }
};

/**
 * @swagger
 * /api/servers/{serverId}/machines/{machineName}/orgs:
 *   get:
 *     summary: List the orgs a machine belongs to (Admin only)
 *     description: Returns the org uuids assigned to a machine on an agent. A machine with no orgs is visible only to the agent's owning orgs.
 *     tags: [Organization Access]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: machineName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Org uuids retrieved
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
export const getMachineOrgs = async (req, res) => {
  try {
    if (!(await canManageMachineOrgs(req, parseInt(req.params.serverId), req.params.machineName))) {
      return res
        .status(403)
        .json({ success: false, message: 'Not an org manager of this machine' });
    }
    const orgs = await MachineOrgModel.findOrgsForMachine(
      parseInt(req.params.serverId),
      req.params.machineName
    );
    return res.json({ success: true, orgs });
  } catch (error) {
    log.auth.error('Get machine orgs error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to load machine orgs' });
  }
};

/**
 * @swagger
 * /api/servers/{serverId}/machines/{machineName}/orgs:
 *   put:
 *     summary: Set the orgs a machine belongs to (Admin only)
 *     description: Replaces the machine's org list. Users in these orgs see and (per role) manage this machine even when their org does not own the agent.
 *     tags: [Organization Access]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: serverId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: machineName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orgs]
 *             properties:
 *               orgs:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Org list replaced
 *       400:
 *         description: orgs must be an array of org uuid strings
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
export const setMachineOrgs = async (req, res) => {
  try {
    if (!(await canManageMachineOrgs(req, parseInt(req.params.serverId), req.params.machineName))) {
      return res
        .status(403)
        .json({ success: false, message: 'Not an org manager of this machine' });
    }
    const { orgs } = req.body;
    if (!validOrgList(orgs)) {
      return res.status(400).json({
        success: false,
        message: 'orgs must be an array of org uuid strings',
      });
    }

    await MachineOrgModel.setOrgsForMachine(
      parseInt(req.params.serverId),
      req.params.machineName,
      orgs
    );

    log.auth.info('Machine org assignment updated', {
      user: req.user.username,
      serverId: req.params.serverId,
      machine: req.params.machineName,
      orgs,
    });

    return res.json({ success: true, message: 'Machine orgs updated', orgs });
  } catch (error) {
    log.auth.error('Set machine orgs error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Failed to update machine orgs' });
  }
};
