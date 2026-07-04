import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';

/**
 * Public configuration endpoints (no auth) — expose only non-sensitive, UI-consumed config.
 */
class ConfigController {
  /**
   * @swagger
   * /api/config/ticket:
   *   get:
   *     summary: Get ticket-system configuration (public)
   *     description: Returns the ticket_system config block (help-desk link shown in the profile dropdown). 404 when not configured.
   *     tags: [Configuration]
   *     responses:
   *       200:
   *         description: Ticket system configuration
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ticket_system:
   *                   type: object
   *                   properties:
   *                     enabled: { type: object }
   *                     base_url: { type: object }
   *                     req_type: { type: object }
   *                     context: { type: object }
   *       404:
   *         description: Ticket system not configured
   *       500:
   *         description: Internal server error
   */
  static getTicketConfig(req, res) {
    void req;
    try {
      const config = loadConfig();
      if (config?.ticket_system) {
        return res.json({ ticket_system: config.ticket_system });
      }
      return res.status(404).json({ success: false, message: 'Ticket system not configured' });
    } catch (error) {
      log.settings.error('Error getting ticket config', { error: error.message });
      return res.status(500).json({
        success: false,
        message: 'Failed to load ticket configuration',
      });
    }
  }
}

export default ConfigController;
