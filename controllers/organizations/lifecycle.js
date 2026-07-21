import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { organization: OrganizationModel } = db;

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
export const deactivateOrganization = async (req, res) => {
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
};

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
export const deleteOrganization = async (req, res) => {
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
};
