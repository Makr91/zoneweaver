import axios from 'axios';
import { getAuthServerUrl, extractOidcAccessToken, logFavoritesError } from './helpers.js';

/**
 * GET /api/userinfo/claims — proxy the IdP's /userinfo (enriched claims incl. favorite_apps),
 * authenticated with the session OIDC access token. Non-OIDC sessions get minimal claims.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getUserInfoClaims = async (req, res) => {
  const oidcAccessToken = extractOidcAccessToken(req);
  if (!oidcAccessToken) {
    return res.status(200).json({ sub: req.user?.userId, favorite_apps: [] });
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
    return res.status(200).json(response.data);
  } catch (error) {
    logFavoritesError('Error fetching claims from auth server', error);
    // Degrade to minimal claims rather than erroring the profile dropdown.
    return res.status(200).json({ sub: req.user?.userId, favorite_apps: [] });
  }
};
