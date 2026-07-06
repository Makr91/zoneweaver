import db from '../models/index.js';
import { log } from '../utils/Logger.js';

const { user: UserModel, organization: OrganizationModel } = db;

class OrganizationController {
  /**
   * @swagger
   * /api/organizations:
   *   get:
   *     summary: Get all organizations (Super-admin only)
   *     description: Retrieve list of all organizations in the system
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Organizations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 organizations:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Organization'
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
  static async getAllOrganizations(req, res) {
    try {
      void req;
      // Get organizations with user statistics
      const organizations = await OrganizationModel.findAll({
        where: { is_active: true },
        include: [
          {
            association: 'users',
            attributes: ['id', 'role', 'is_active'],
            required: false,
          },
        ],
        order: [['name', 'ASC']],
      });

      // Calculate statistics for each organization
      const organizationsWithStats = organizations.map(org => {
        const orgJson = org.toJSON();
        const users = orgJson.users || [];

        orgJson.total_users = users.length;
        orgJson.active_users = users.filter(user => user.is_active).length;
        orgJson.admin_users = users.filter(user => user.role === 'admin' && user.is_active).length;

        // Remove the users array to keep response clean
        delete orgJson.users;

        return orgJson;
      });

      return res.json({
        success: true,
        organizations: organizationsWithStats,
      });
    } catch (error) {
      log.auth.error('Get all organizations error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/organizations/{orgId}/deactivate:
   *   put:
   *     summary: Deactivate organization (Super-admin only)
   *     description: Deactivate an organization (soft delete). All users in the organization will be affected.
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the organization to deactivate
   *         example: 2
   *     responses:
   *       200:
   *         description: Organization deactivated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Organization deactivated successfully"
   *       400:
   *         description: Missing organization ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             example:
   *               success: false
   *               message: "Organization ID is required"
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
   *       404:
   *         description: Organization not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Organization not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async deactivateOrganization(req, res) {
    try {
      const { orgId } = req.params;

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const success = await OrganizationModel.update(
        { is_active: false },
        { where: { id: parseInt(orgId), is_active: true } }
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
      }

      return res.json({
        success: true,
        message: 'Organization deactivated successfully',
      });
    } catch (error) {
      log.auth.error('Deactivate organization error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * @swagger
   * /api/organizations/{orgId}:
   *   delete:
   *     summary: Delete organization (Super-admin only)
   *     description: Permanently delete an organization (hard delete). All users in the organization will be deleted.
   *     tags: [Organization Management]
   *     security:
   *       - JwtAuth: []
   *     parameters:
   *       - in: path
   *         name: orgId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the organization to delete
   *         example: 2
   *     responses:
   *       200:
   *         description: Organization deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               success: true
   *               message: "Organization deleted successfully"
   *       400:
   *         description: Cannot delete organization with active users
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationErrorResponse'
   *             examples:
   *               missingOrgId:
   *                 summary: Missing organization ID
   *                 value:
   *                   success: false
   *                   message: "Organization ID is required"
   *               hasActiveUsers:
   *                 summary: Organization has active users
   *                 value:
   *                   success: false
   *                   message: "Cannot delete organization with active users"
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
   *       404:
   *         description: Organization not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               success: false
   *               message: "Organization not found"
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  static async deleteOrganization(req, res) {
    try {
      const { orgId } = req.params;

      if (!orgId) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID is required',
        });
      }

      const [affectedRows] = await OrganizationModel.update(
        { is_active: false },
        { where: { id: parseInt(orgId), is_active: true } }
      );
      const result = {
        success: affectedRows > 0,
        message: affectedRows > 0 ? 'Success' : 'Organization not found',
      };

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error) {
      log.auth.error('Delete organization error', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

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
  static async getOrganization(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Super-admin can access any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
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

      // Get organization statistics
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
  }

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
  static async updateOrganization(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const currentUser = req.user;

      // Super-admin can update any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
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
  }

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
  static async getOrganizationUsers(req, res) {
    try {
      const { id } = req.params;
      const { includeInactive } = req.query;
      const currentUser = req.user;

      // Super-admin can access any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
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
  }

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
  static async getOrganizationStats(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Super-admin can access any organization
      if (currentUser.role !== 'super-admin') {
        // Get current user's organization
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
  }

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
  static async checkOrganizationExists(req, res) {
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
  }
}

export default OrganizationController;
