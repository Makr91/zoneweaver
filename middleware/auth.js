import jwt from 'jsonwebtoken';
import { config } from '../index.js';
import db from '../models/index.js';

/**
 * Authentication middleware for protecting routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.security.jwt_secret || 'fallback-secret');
    
    // Get fresh user data to ensure user is still active
    const { user: UserModel } = db;
    const user = await UserModel.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    // Add user info to request object
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Token authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

/**
 * Session-based authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateSession = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    // Get fresh user data
    const { user: UserModel } = db;
    const user = await UserModel.findByPk(req.session.userId);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy();
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session - user not found' 
      });
    }

    // Add user info to request object
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Session authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

/**
 * Flexible authentication middleware that accepts both JWT and session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticate = async (req, res, next) => {
  // Try JWT authentication first
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    return authenticateToken(req, res, next);
  }

  // Fall back to session authentication
  if (req.session && req.session.userId) {
    return authenticateSession(req, res, next);
  }

  // No authentication method found
  return res.status(401).json({ 
    success: false, 
    message: 'Authentication required' 
  });
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
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
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin privileges required' 
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
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'super-admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Super admin privileges required' 
    });
  }

  next();
};

/**
 * Optional authentication middleware - doesn't fail if no auth provided
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Try JWT authentication first
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, config.security.jwt_secret || 'fallback-secret');
        const { user: UserModel } = db;
        const user = await UserModel.findByPk(decoded.userId);
        
        if (user) {
          req.user = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          };
        }
      } catch (error) {
        // Ignore JWT errors for optional auth
      }
    } else if (req.session && req.session.userId) {
      // Try session authentication
      try {
        const { user: UserModel } = db;
        const user = await UserModel.findByPk(req.session.userId);
        
        if (user) {
          req.user = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          };
        }
      } catch (error) {
        // Ignore session errors for optional auth
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
