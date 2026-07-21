import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, organization: OrganizationModel } = db;

/**
 * @swagger
 * /api/organizations/{id}/users:
 *   get:
 *     summary: Get users in organization (Admin only)
 *     description: Retrieve all users belonging to a specific organization. Admins can only view users in their own organization.
 *     tags: [Organization Management]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *         example: 1
 *       - in: query
 *         name: includeInactive
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Include deactivated users in results
 *         example: false
 *     responses:
 *       200:
 *         description: Organization users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access denied to this organization
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
export const getOrganizationUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeInactive } = req.query;
    const currentUser = req.user;

    if (currentUser.role !== 'super-admin') {
      const user = await UserModel.findByPk(currentUser.userId);
      if (!user || user.organization_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this organization',
        });
      }
    }

    const users = await UserModel.findByOrganization(parseInt(id), includeInactive === 'true');

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    log.auth.error('Get organization users error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/organizations/{id}/stats:
 *   get:
 *     summary: Get organization statistics (Admin only)
 *     description: Retrieve detailed statistics for a specific organization including user counts and invitations
 *     tags: [Organization Management]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Organization statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     userCount:
 *                       type: integer
 *                       description: Total number of users in organization
 *                       example: 15
 *                     activeUsers:
 *                       type: integer
 *                       description: Number of active users
 *                       example: 12
 *                     adminCount:
 *                       type: integer
 *                       description: Number of admin users
 *                       example: 2
 *                     invitations:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                           description: Number of pending invitations
 *                           example: 3
 *                         used:
 *                           type: integer
 *                           description: Number of used invitations
 *                           example: 8
 *                         expired:
 *                           type: integer
 *                           description: Number of expired invitations
 *                           example: 1
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access denied to this organization
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
export const getOrganizationStats = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser.role !== 'super-admin') {
      const user = await UserModel.findByPk(currentUser.userId);
      if (!user || user.organization_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this organization',
        });
      }
    }

    const stats = await OrganizationModel.getStats(parseInt(id));
    const inviteStats = await db.invitation.getStats(parseInt(id));

    return res.json({
      success: true,
      stats: {
        ...stats,
        invitations: inviteStats,
      },
    });
  } catch (error) {
    log.auth.error('Get organization stats error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/organizations/check/{name}:
 *   get:
 *     summary: Check if organization exists (Public)
 *     description: Check if an organization with the given name already exists (public endpoint for registration)
 *     tags: [Organization Management]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization name to check
 *         example: "Acme Corporation"
 *     responses:
 *       200:
 *         description: Organization existence check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 exists:
 *                   type: boolean
 *                   description: Whether organization exists
 *                   example: true
 *                 organizationName:
 *                   type: string
 *                   nullable: true
 *                   description: Organization name if exists, null otherwise
 *                   example: "Acme Corporation"
 *       400:
 *         description: Missing organization name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "Organization name is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const checkOrganizationExists = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required',
      });
    }

    const organization = await OrganizationModel.findByName(name);

    return res.json({
      success: true,
      exists: !!organization,
      organizationName: organization?.name || null,
    });
  } catch (error) {
    log.auth.error('Check organization exists error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
