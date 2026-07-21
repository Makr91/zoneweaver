import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { organization: OrganizationModel } = db;

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
export const getAllOrganizations = async (req, res) => {
  try {
    void req;
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

    const organizationsWithStats = organizations.map(org => {
      const orgJson = org.toJSON();
      const users = orgJson.users || [];

      orgJson.total_users = users.length;
      orgJson.active_users = users.filter(user => user.is_active).length;
      orgJson.admin_users = users.filter(user => user.role === 'admin' && user.is_active).length;

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
};
