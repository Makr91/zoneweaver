import axios from 'axios';
import { getAuthServerUrl, extractOidcAccessToken, logFavoritesError } from './helpers.js';

/**
 * POST /api/favorites/save — persist the user's favorites to the IdP, authenticated with the
 * session OIDC access token. Requires an OIDC session (401 otherwise — favorites are an
 * OIDC/federated feature).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const saveFavorites = async (req, res) => {
  const oidcAccessToken = extractOidcAccessToken(req);
  if (!oidcAccessToken) {
    return res.status(401).json({ message: 'OIDC authentication is required to save favorites' });
  }

  // The contract shape is a raw array ([{clientId, customLabel, order}]) — reject anything
  // else here instead of proxying arbitrary payloads to the IdP.
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ message: 'Favorites payload must be an array' });
  }

  try {
    const authServerUrl = getAuthServerUrl(req);
    await axios.post(`${authServerUrl}/user/favorites/save`, JSON.stringify(req.body), {
      headers: {
        Authorization: `Bearer ${oidcAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return res.status(200).json({ message: 'Favorites saved' });
  } catch (error) {
    logFavoritesError('Error saving favorites to auth server', error);
    return res.status(500).json({
      message: error.response?.data?.message || 'Failed to save favorites',
    });
  }
};
