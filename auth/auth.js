import passport from '../auth/passport.js';
import { log } from '../utils/Logger.js';

/**
 * Authentication middleware for protecting routes (now using Passport.js)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      log.auth.error('Token authentication error', { error: err.message });
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
      });
    }

    if (!user) {
      // Map Passport.js info to existing error messages for consistency
      let message = 'Invalid token';

      if (info && info.message) {
        if (info.message.includes('user not found')) {
          message = 'Invalid token - user not found';
        } else if (info.name === 'TokenExpiredError' || info.message.includes('expired')) {
          message = 'Token expired';
        } else if (info.name === 'JsonWebTokenError') {
          message = 'Invalid token';
        } else if (info.message.includes('required') || info.message.includes('No auth token')) {
          message = 'Access token required';
        }
      }

      return res.status(401).json({
        success: false,
        message,
      });
    }

    // Set user on request (same format as before)
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * JWT-based authentication middleware (CSRF-safe)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = (req, res, next) =>
  // Use JWT authentication only (sessions removed for CSRF security)
  authenticateToken(req, res, next);

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
export const authorize = allowedRoles => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const userRole = req.user.role;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
    });
  }

  next();
};

/**
 * Admin-only authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required',
    });
  }

  next();
};

/**
 * Super-admin-only authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'super-admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin privileges required',
    });
  }

  next();
};

/**
 * Optional JWT authentication middleware - doesn't fail if no auth provided (CSRF-safe)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = (req, res, next) => {
  // Only try authentication if Authorization header is present
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No auth header, continue without user
  }

  passport.authenticate('jwt', { session: false }, (err, user, _info) => {
    // Always continue to next middleware, regardless of auth result
    if (user) {
      req.user = user; // Set user if authentication succeeded
    }
    // Ignore errors and failed authentication for optional auth
    next();
  })(req, res, next);
};
