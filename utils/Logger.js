/**
 * @fileoverview Centralized Logging System for Zoneweaver
 * @description Winston-based logging with clean daily rotation
 * @author Zoneweaver Team
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { loadConfig } from './config.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get logging configuration from config.yaml
const config = loadConfig();
const loggingConfig = config.logging || {
  level: { value: 'info' },
  console_enabled: { value: true },
  log_directory: { value: '/var/log/zoneweaver' },
  file_rotation: {
    max_size: { value: 50 },
    max_files: { value: 5 },
  },
  performance_threshold_ms: { value: 1000 },
  categories: {},
};

// Extract values from metadata format
const getValue = configItem => {
  if (typeof configItem === 'object' && configItem !== null && 'value' in configItem) {
    return configItem.value;
  }
  return configItem;
};

// Ensure log directory exists
const logDir = getValue(loggingConfig.log_directory) || '/var/log/zoneweaver';
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
  } catch {
    // Fallback to local logs directory if can't create system directory
    const fallbackDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    console.warn(`Could not create log directory ${logDir}, using ${fallbackDir}`);
  }
}

// Check if we can write to the log directory
const canWriteToLogDir = (() => {
  try {
    const testFile = path.join(logDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
})();

// Use fallback directory if can't write to configured directory
const effectiveLogDir = canWriteToLogDir ? logDir : path.join(__dirname, '..', 'logs');

/**
 * Common log format configuration - optimized for production
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console format for development - simplified and colorized
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, category, ...meta }) => {
    const categoryStr = category ? `[${category}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 0)}` : '';
    return `${timestamp} ${categoryStr} ${level}: ${message}${metaStr}`;
  })
);

/**
 * Create a logger for a specific category with simple file rotation
 * @param {string} category - Log category name
 * @param {string} filename - Log filename (without extension)
 * @returns {winston.Logger} Configured winston logger
 */
const createCategoryLogger = (category, filename) => {
  const categoryConfig = loggingConfig.categories?.[category];
  const categoryLevel = getValue(categoryConfig) || getValue(loggingConfig.level) || 'info';
  const transports = [];

  // Daily rotate file transport - CLEAN, NO SYMLINKS, NO AUDIT FILES
  transports.push(
    new DailyRotateFile({
      filename: path.join(effectiveLogDir, `${filename}-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      level: categoryLevel,
      format: logFormat,
      maxSize: `${getValue(loggingConfig.file_rotation?.max_size) || 50}m`,
      maxFiles: getValue(loggingConfig.file_rotation?.max_files) || 5,
      // NO symlinks, NO audit files, NO compression
    })
  );

  // All errors also go to daily rotated error.log
  transports.push(
    new DailyRotateFile({
      filename: path.join(effectiveLogDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '50m',
      maxFiles: 7,
      // NO symlinks, NO audit files, NO compression
    })
  );

  // Console transport only if enabled and not in production
  const consoleEnabled = getValue(loggingConfig.console_enabled) !== false;
  if (consoleEnabled && process.env.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        level: categoryLevel,
        format: consoleFormat,
      })
    );
  }

  return winston.createLogger({
    level: categoryLevel,
    format: logFormat,
    defaultMeta: { category, service: 'zoneweaver' },
    transports,
    exitOnError: false,
    silent: getValue(loggingConfig.level) === 'silent',
  });
};

/**
 * Category-specific loggers
 */
export const authLogger = createCategoryLogger('auth', 'auth');
export const databaseLogger = createCategoryLogger('database', 'database');
export const apiRequestLogger = createCategoryLogger('api', 'api-requests');
export const proxyLogger = createCategoryLogger('proxy', 'proxy');
export const mailLogger = createCategoryLogger('mail', 'mail');
export const websocketLogger = createCategoryLogger('websocket', 'websocket');
export const performanceLogger = createCategoryLogger('performance', 'performance');
export const appLogger = createCategoryLogger('app', 'application');
export const serverLogger = createCategoryLogger('server', 'server');
export const settingsLogger = createCategoryLogger('settings', 'settings');
export const securityLogger = createCategoryLogger('security', 'security');
export const vncLogger = createCategoryLogger('vnc', 'vnc');
export const terminalLogger = createCategoryLogger('terminal', 'terminal');
export const zloginLogger = createCategoryLogger('zlogin', 'zlogin');

/**
 * Helper function to safely log with fallback to console
 * @param {winston.Logger} logger - Winston logger instance
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const safeLog = (logger, level, message, meta = {}) => {
  try {
    // Remove circular references and large objects
    const safeMeta = JSON.parse(
      JSON.stringify(meta, (key, value) => {
        // Skip very large values
        if (typeof value === 'string' && value.length > 1000) {
          return `${value.substring(0, 1000)}... (truncated)`;
        }
        // Skip circular references
        if (typeof value === 'object' && value !== null) {
          const seen = new WeakSet();
          return JSON.parse(
            JSON.stringify(value, (k, v) => {
              if (typeof v === 'object' && v !== null) {
                if (seen.has(v)) return '[Circular]';
                seen.add(v);
              }
              return v;
            })
          );
        }
        return value;
      })
    );

    logger[level](message, safeMeta);
  } catch {
    // Fallback to console if winston fails
    if (console[level]) {
      console[level](`[${level.toUpperCase()}] ${message}`, meta);
    }
  }
};

/**
 * Convenience logging functions for each category
 */
export const log = {
  auth: {
    info: (msg, meta) => safeLog(authLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(authLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(authLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(authLogger, 'debug', msg, meta),
  },

  database: {
    info: (msg, meta) => safeLog(databaseLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(databaseLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(databaseLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(databaseLogger, 'debug', msg, meta),
  },

  api: {
    info: (msg, meta) => safeLog(apiRequestLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(apiRequestLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(apiRequestLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(apiRequestLogger, 'debug', msg, meta),
  },

  proxy: {
    info: (msg, meta) => safeLog(proxyLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(proxyLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(proxyLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(proxyLogger, 'debug', msg, meta),
  },

  mail: {
    info: (msg, meta) => safeLog(mailLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(mailLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(mailLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(mailLogger, 'debug', msg, meta),
  },

  websocket: {
    info: (msg, meta) => safeLog(websocketLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(websocketLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(websocketLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(websocketLogger, 'debug', msg, meta),
  },

  performance: {
    info: (msg, meta) => safeLog(performanceLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(performanceLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(performanceLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(performanceLogger, 'debug', msg, meta),
  },

  app: {
    info: (msg, meta) => safeLog(appLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(appLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(appLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(appLogger, 'debug', msg, meta),
  },

  server: {
    info: (msg, meta) => safeLog(serverLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(serverLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(serverLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(serverLogger, 'debug', msg, meta),
  },

  settings: {
    info: (msg, meta) => safeLog(settingsLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(settingsLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(settingsLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(settingsLogger, 'debug', msg, meta),
  },

  security: {
    info: (msg, meta) => safeLog(securityLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(securityLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(securityLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(securityLogger, 'debug', msg, meta),
  },

  vnc: {
    info: (msg, meta) => safeLog(vncLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(vncLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(vncLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(vncLogger, 'debug', msg, meta),
  },

  terminal: {
    info: (msg, meta) => safeLog(terminalLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(terminalLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(terminalLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(terminalLogger, 'debug', msg, meta),
  },

  zlogin: {
    info: (msg, meta) => safeLog(zloginLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(zloginLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(zloginLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(zloginLogger, 'debug', msg, meta),
  },
};

/**
 * Performance timing helper - logs slow operations
 * @param {string} operation - Operation name
 * @returns {Object} Timer object with end() function
 */
export const createTimer = operation => {
  const start = process.hrtime.bigint();
  return {
    end: (meta = {}) => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert nanoseconds to milliseconds

      // Only log to performance category if exceeds threshold
      const thresholdMs = getValue(loggingConfig.performance_threshold_ms) || 1000;
      if (duration >= thresholdMs) {
        performanceLogger.warn(`Slow operation detected: ${operation}`, {
          operation,
          duration_ms: Math.round(duration * 100) / 100,
          threshold_ms: thresholdMs,
          ...meta,
        });
      }

      return Math.round(duration * 100) / 100; // Return rounded duration
    },
  };
};

/**
 * Request logging middleware helper
 * @param {string} requestId - Unique request identifier
 * @param {Object} req - Express request object
 * @returns {Object} Request logger with timing
 */
export const createRequestLogger = (requestId, req) => {
  const start = Date.now();

  const logData = {
    requestId,
    method: req.method,
    path: req.path,
    user: req.user?.username,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
  };

  // Only log non-static requests
  if (!req.path.startsWith('/static') && !req.path.match(/\.(js|css|png|jpg|ico)$/)) {
    apiRequestLogger.info('Request started', logData);
  }

  return {
    success: (statusCode, meta = {}) => {
      const duration = Date.now() - start;

      // Skip logging for static assets
      if (req.path.startsWith('/static') || req.path.match(/\.(js|css|png|jpg|ico)$/)) {
        return;
      }

      apiRequestLogger.info('Request completed', {
        ...logData,
        status: statusCode,
        duration_ms: duration,
        success: true,
        ...meta,
      });
    },

    error: (statusCode, error, meta = {}) => {
      const duration = Date.now() - start;
      apiRequestLogger.error('Request failed', {
        ...logData,
        status: statusCode,
        duration_ms: duration,
        success: false,
        error: typeof error === 'string' ? error : error?.message || 'Unknown error',
        ...meta,
      });
    },
  };
};

/**
 * Generate a unique request ID
 * @returns {string} Unique request identifier
 */
export const generateRequestId = () =>
  `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Log startup message
log.app.info('Logger initialized', {
  logDirectory: effectiveLogDir,
  consoleEnabled: getValue(loggingConfig.console_enabled),
  level: getValue(loggingConfig.level),
  categories: Object.keys(log),
});

export default {
  log,
  createTimer,
  createRequestLogger,
  generateRequestId,
};
