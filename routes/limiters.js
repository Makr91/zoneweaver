/**
 * @fileoverview Rate limiting configuration (CodeQL security fix). Configurable tiered
 * approach based on endpoint sensitivity and resource usage; limits load from config.yaml.
 */

import rateLimit from 'express-rate-limit';
import { loadConfig } from '../utils/config.js';

const config = loadConfig();

/** Authentication - Strict (prevent brute force attacks) */
export const authLimiter = rateLimit({
  windowMs: config.limits?.authentication?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.authentication?.max?.value || 25,
  message: {
    error:
      config.limits?.authentication?.message?.value ||
      'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Admin operations - Moderate (protect admin functions) */
export const adminLimiter = rateLimit({
  windowMs: config.limits?.admin?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.admin?.max?.value || 500,
  message: {
    error:
      config.limits?.admin?.message?.value || 'Too many admin requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** External API proxy - Restrictive (protect downstream agents) */
export const apiProxyLimiter = rateLimit({
  windowMs: config.limits?.apiProxy?.windowMs?.value || 60 * 1000,
  limit: config.limits?.apiProxy?.max?.value || 2000,
  message: {
    error:
      config.limits?.apiProxy?.message?.value ||
      'Too many API proxy requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Standard operations - Normal (general purpose) */
export const standardLimiter = rateLimit({
  windowMs: config.limits?.standard?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.standard?.max?.value || 1000,
  message: {
    error: config.limits?.standard?.message?.value || 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Static file serving - High limit (prevent file system abuse, CodeQL flagged endpoints) */
export const staticFileLimiter = rateLimit({
  windowMs: config.limits?.staticFiles?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.staticFiles?.max?.value || 5000,
  message: {
    error:
      config.limits?.staticFiles?.message?.value ||
      'Too many static file requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
