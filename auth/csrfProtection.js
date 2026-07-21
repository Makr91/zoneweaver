import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const originOf = value => {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};

/**
 * Cross-site request forgery guard for the session-cookie surface (CWE-352).
 *
 * Bearer-authenticated requests pass untouched — an attacker's page cannot attach an
 * Authorization header cross-site, so header-auth is CSRF-immune by construction. For
 * every other state-changing request the browser-supplied Origin (Referer fallback)
 * must match this server's own origin, the configured frontend_url, or a CORS
 * whitelist entry. Requests carrying NEITHER header (curl, server-to-server calls
 * such as the OIDC back-channel logout, whose trust is its signed logout_token) pass:
 * CSRF is strictly a browser attack and browsers always send Origin on cross-site
 * unsafe requests.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (req.headers.authorization) {
    return next();
  }

  const claimed = req.headers.origin || originOf(req.headers.referer || '');
  if (!claimed) {
    return next();
  }

  const config = loadConfig();
  const allowed = new Set(
    [
      `${req.protocol}://${req.get('host')}`,
      originOf(config.frontend?.frontend_url?.value || ''),
      ...(config.security?.cors?.whitelist?.value || []).map(originOf),
    ].filter(Boolean)
  );

  const claimedOrigin = originOf(claimed) || claimed;
  if (allowed.has(claimedOrigin)) {
    return next();
  }

  log.security.warn('Cross-origin state-changing request rejected (CSRF guard)', {
    method: req.method,
    path: req.path,
    origin: claimedOrigin,
  });
  return res.status(403).json({
    success: false,
    message: 'Cross-origin request rejected',
  });
};
