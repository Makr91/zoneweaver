import axios from 'axios';
import { getAuthServerUrl, extractOidcAccessToken, logFavoritesError } from './helpers.js';

/**
 * GET /api/userinfo/favorites — the enriched favorite_apps only (lightweight; the profile
 * dropdown's favorites list). Empty array for non-OIDC sessions.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getEnrichedFavorites = async (req, res) => {
  const oidcAccessToken = extractOidcAccessToken(req);
  if (!oidcAccessToken) {
    return res.status(200).json([]);
  }

  try {
    const authServerUrl = getAuthServerUrl(req);
    const response = await axios.get(`${authServerUrl}/userinfo`, {
      headers: {
        Authorization: `Bearer ${oidcAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return res.status(200).json(response.data?.favorite_apps || []);
  } catch (error) {
    logFavoritesError('Error fetching enriched favorites from auth server', error);
    return res.status(200).json([]);
  }
};
