import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, organization: OrganizationModel } = db;

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization details (Admin only)
 *     description: Retrieve detailed information about a specific organization
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
 *         description: Organization details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     userCount:
 *                       type: integer
 *                       description: Number of users in organization
 *                       example: 15
 *                     serverCount:
 *                       type: integer
 *                       description: Number of servers assigned
 *                       example: 3
 *                     activeUsers:
 *                       type: integer
 *                       description: Number of active users
 *                       example: 12
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
 *         description: Organization not found
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
export const getOrganization = async (req, res) => {
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

    const organization = await OrganizationModel.findByPk(parseInt(id));

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const stats = await OrganizationModel.getStats(parseInt(id));

    return res.json({
      success: true,
      organization: {
        ...organization,
        stats,
      },
    });
  } catch (error) {
    log.auth.error('Get organization error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization details (Admin only)
 *     description: Update name and description of an organization. Admins can only update their own organization.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New organization name
 *                 example: "Updated Corporation"
 *               description:
 *                 type: string
 *                 description: New organization description
 *                 example: "Updated description for the organization"
 *             minProperties: 1
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Organization updated successfully"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "At least one field (name or description) is required"
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
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Organization name already exists
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
export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
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

    if (!name && !description) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or description) is required',
      });
    }

    const updates = {};
    if (name) {
      updates.name = name;
    }
    if (description !== undefined) {
      updates.description = description;
    }

    const [affectedRows] = await OrganizationModel.update(updates, {
      where: { id: parseInt(id), is_active: true },
    });
    const success = affectedRows > 0;

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    return res.json({
      success: true,
      message: 'Organization updated successfully',
    });
  } catch (error) {
    log.auth.error('Update organization error', { error: error.message });

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'Organization name already exists',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
