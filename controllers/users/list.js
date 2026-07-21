import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { user: UserModel } = db;

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve all users. Super-admin sees all users, admin sees only users in their organization.
 *     tags: [Admin - User Management]
 *     security:
 *       - JwtAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                 viewScope:
 *                   type: string
 *                   enum: [all, organization]
 *                   description: Scope of users returned
 *                   example: "organization"
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
export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    let users;

    if (currentUserRole === 'super-admin') {
      users = await UserModel.findAll({
        include: [
          {
            association: 'organization',
            attributes: ['id', 'name'],
          },
        ],
        order: [['created_at', 'DESC']],
      });
    } else if (currentUserRole === 'admin') {
      const currentUser = await UserModel.findByPk(currentUserId);
      if (!currentUser || !currentUser.organization_id) {
        return res.status(400).json({
          success: false,
          message: 'Admin user must belong to an organization',
        });
      }
      users = await UserModel.findByOrganization(currentUser.organization_id, true);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    const transformedUsers = users.map(user => {
      const userJson = user.toJSON();
      if (userJson.organization) {
        userJson.organization_name = userJson.organization.name;
        userJson.organization_id = userJson.organization.id;
      }
      return userJson;
    });

    return res.json({
      success: true,
      users: transformedUsers,
      viewScope: currentUserRole === 'super-admin' ? 'all' : 'organization',
    });
  } catch (error) {
    log.auth.error('Get all users error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/admin/users/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     description: Change a user's role/permission level. Admins can only modify users in their organization.
 *     tags: [Admin - User Management]
 *     security:
 *       - JwtAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, newRole]
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to update
 *                 example: 5
 *               newRole:
 *                 type: string
 *                 enum: [user, admin, super-admin]
 *                 description: New role to assign
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "User role updated successfully"
 *       400:
 *         description: Validation error or cannot change own role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: "User ID and new role are required"
 *               ownRole:
 *                 summary: Cannot change own role
 *                 value:
 *                   success: false
 *                   message: "Cannot change your own role"
 *               invalidRole:
 *                 summary: Invalid role specified
 *                 value:
 *                   success: false
 *                   message: "Invalid role specified"
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    const currentUserId = req.user?.userId || req.session?.userId;

    if (!userId || !newRole) {
      return res.status(400).json({
        success: false,
        message: 'User ID and new role are required',
      });
    }

    if (parseInt(userId) === parseInt(currentUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    const validRoles = ['user', 'admin', 'super-admin'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified',
      });
    }

    const [affectedRows] = await UserModel.update(
      { role: newRole },
      { where: { id: userId, is_active: true } }
    );
    const success = affectedRows > 0;

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    log.auth.error('Update user role error', {
      error: error.message,
      userId: req.body.userId,
      newRole: req.body.newRole,
    });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
