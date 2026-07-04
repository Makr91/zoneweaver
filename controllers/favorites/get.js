import axios from 'axios';
import { getAuthServerUrl, extractOidcAccessToken, logFavoritesError } from './helpers.js';

/**
 * GET /api/favorites — the user's favorites in RAW form ([{clientId,customLabel,order}]),
 * derived from the IdP's enriched /userinfo favorite_apps. Empty array for non-OIDC sessions.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getFavorites = async (req, res) => {
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

    const favoriteApps = response.data?.favorite_apps || [];
    const rawFavorites = favoriteApps.map(app => ({
      clientId: app.clientId,
      customLabel: app.customLabel,
      order: app.order,
    }));
    return res.status(200).json(rawFavorites);
  } catch (error) {
    logFavoritesError('Error fetching favorites from auth server', error);
    return res.status(200).json([]);
  }
};
