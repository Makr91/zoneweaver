import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';

const { invitation: InvitationModel } = db;

/**
 * @swagger
 * /api/invitations/validate/{code}:
 *   get:
 *     summary: Validate invitation code
 *     description: Check if an invitation code is valid and retrieve invitation details (public endpoint)
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation code to validate
 *         example: "inv_abc123def456"
 *     responses:
 *       200:
 *         description: Invitation validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     invitation:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                           example: "invited@example.com"
 *                         organizationId:
 *                           type: integer
 *                           example: 1
 *                         organizationName:
 *                           type: string
 *                           example: "Acme Corporation"
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: false
 *                     message:
 *                       type: string
 *                       example: "Invalid or expired invitation code"
 *       400:
 *         description: Missing invitation code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               message: "Invitation code is required"
 *       404:
 *         description: Invalid or expired invitation code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid or expired invitation code"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const validateInvitation = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Invitation code is required',
      });
    }

    const validation = await InvitationModel.validateCode(code);

    if (!validation.valid) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation code',
      });
    }

    const { invitation } = validation;

    return res.json({
      success: true,
      invitation: {
        email: invitation.email,
        organizationId: invitation.organizationId,
        organizationName: invitation.organizationName,
      },
    });
  } catch (error) {
    log.auth.error('Validate invitation error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error during invitation validation',
    });
  }
};
