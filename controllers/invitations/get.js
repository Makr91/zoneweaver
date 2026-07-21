import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel, invitation: InvitationModel } = db;

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Get invitations for organization (Admin only)
 *     description: Retrieve all invitations for the current user's organization with filtering options
 *     tags: [Invitation Management]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: query
 *         name: includePending
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include pending invitations
 *         example: true
 *       - in: query
 *         name: includeUsed
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include used invitations
 *         example: false
 *       - in: query
 *         name: includeExpired
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include expired invitations
 *         example: false
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 invitations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Must belong to organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "You must belong to an organization to view invitations"
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
export const getInvitations = async (req, res) => {
  try {
    const { includePending = 'true', includeUsed = 'false', includeExpired = 'false' } = req.query;
    const currentUser = req.user;

    const user = await UserModel.findByPk(currentUser.userId);
    if (!user || (!user.organization_id && currentUser.role !== 'super-admin')) {
      return res.status(400).json({
        success: false,
        message: 'You must belong to an organization to view invitations',
      });
    }

    const organizationId = user.organization_id;

    const invitations = await InvitationModel.findByOrganization(organizationId, {
      includePending: includePending === 'true',
      includeUsed: includeUsed === 'true',
      includeExpired: includeExpired === 'true',
    });

    return res.json({
      success: true,
      invitations,
    });
  } catch (error) {
    log.auth.error('Get invitations error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
