import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { loadConfig } from '../utils/config.js';
import { standardLimiter } from './limiters.js';

const router = express.Router();

/**
 * @swagger
 * /api/profile/{identifier}:
 *   get:
 *     summary: Get Gravatar profile information
 *     description: Retrieve Gravatar profile data for a given email address or username
 *     tags: [Utilities]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Email address or username to lookup
 *         example: "user@example.com"
 *     responses:
 *       200:
 *         description: Gravatar profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hash:
 *                   type: string
 *                   description: Gravatar hash for the profile
 *                   example: "abc123def456..."
 *                 display_name:
 *                   type: string
 *                   description: Display name from Gravatar
 *                   example: "John Doe"
 *                 profile_url:
 *                   type: string
 *                   description: Gravatar profile URL
 *                   example: "https://gravatar.com/johndoe"
 *                 avatar_url:
 *                   type: string
 *                   description: Avatar image URL
 *                   example: "https://secure.gravatar.com/avatar/abc123def456"
 *                 avatar_alt_text:
 *                   type: string
 *                   description: Alt text for avatar
 *                   example: "John Doe's avatar"
 *       400:
 *         description: Invalid identifier
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid identifier format"
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Profile not found"
 *       500:
 *         description: Internal server error or Gravatar API error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Gravatar API request failed"
 */
router.get('/api/profile/:identifier', standardLimiter, async (req, res) => {
  const { identifier } = req.params;

  try {
    const appConfig = loadConfig();
    const apiKey = appConfig.integrations?.gravatar?.api_key?.value;

    const hash = crypto.createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex');

    const response = await axios.get(`https://api.gravatar.com/v3/profiles/${hash}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json({
      error: error.message,
    });
  }
});

export default router;
