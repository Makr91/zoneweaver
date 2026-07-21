import axios from 'axios';
import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';
import { extractOidcAccessToken } from './favorites/helpers.js';

/**
 * @swagger
 * /api/boxvault/{path}:
 *   get:
 *     summary: Proxy a request to BoxVault with the user's own OIDC access token
 *     description: Forwards the request (any HTTP method) to the configured BoxVault instance, authenticated as the LOGGED-IN USER via their OIDC access token — BoxVault authorizes org-private boxes from the token's organizations claim. No server-wide BoxVault credential exists. Requires a federated (OIDC) login; local sessions receive 403.
 *     tags: [BoxVault]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: BoxVault API path to forward to
 *     responses:
 *       200:
 *         description: Response from BoxVault (varies by endpoint)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Federated (OIDC) login required
 *       502:
 *         description: BoxVault unreachable
 *       503:
 *         description: BoxVault integration not configured
 */
export const proxyToBoxVault = async (req, res) => {
  try {
    const config = loadConfig();
    const baseUrl = config.integrations?.boxvault?.url?.value;
    if (!baseUrl) {
      return res.status(503).json({
        success: false,
        message: 'BoxVault integration is not configured (integrations.boxvault.url)',
      });
    }

    const accessToken = extractOidcAccessToken(req);
    if (!accessToken) {
      return res.status(403).json({
        success: false,
        message: 'Federated (OIDC) login required for BoxVault access',
      });
    }

    const subPath = Array.isArray(req.params.splat)
      ? req.params.splat.join('/')
      : req.params.splat || '';
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/${subPath}`;

    const requestOptions = {
      method: req.method,
      url: targetUrl,
      params: req.query,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': req.headers['content-type'] || 'application/json',
        'User-Agent': 'Hyperweaver-Server/1.0',
      },
      timeout: config.limits?.api_timeouts?.default_request?.value || 60000,
      validateStatus: () => true,
    };
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
      requestOptions.data = req.body;
    }

    const response = await axios(requestOptions);

    return res.status(response.status).json(response.data);
  } catch (error) {
    log.proxy.error('BoxVault proxy error', {
      error: error.message,
      path: req.params.splat,
    });
    return res.status(502).json({ success: false, message: 'BoxVault unreachable' });
  }
};
