/**
 * @fileoverview Centralized Logging System for Hyperweaver Server
 * @description Winston-based logging with clean daily rotation
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';
import {
  loggingConfig,
  getValue,
  effectiveLogDir,
  effectiveCurrentDir,
  effectiveArchivesDir,
  effectiveMetaDir,
  logFormat,
  consoleFormat,
  createCategoryLogger,
} from './loggerCore.js';

export const monitoringLogger = createCategoryLogger('monitoring', 'monitoring');
export const databaseLogger = createCategoryLogger('database', 'database');
export const apiRequestLogger = createCategoryLogger('api', 'api-requests');
export const filesystemLogger = createCategoryLogger('filesystem', 'filesystem');
export const taskLogger = createCategoryLogger('task', 'tasks');
export const authLogger = createCategoryLogger('auth', 'auth');
export const websocketLogger = createCategoryLogger('websocket', 'websocket');
export const performanceLogger = createCategoryLogger('performance', 'performance');

const appTransport = new DailyRotateFile({
  filename: path.join(effectiveCurrentDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: `${getValue(loggingConfig.file_rotation?.max_size) || 50}m`,
  maxFiles: getValue(loggingConfig.file_rotation?.max_files) || '14d',
  zippedArchive: true,
  format: logFormat,
  auditFile: path.join(effectiveMetaDir, 'application-audit.json'),
  createSymlink: true,
  symlinkName: path.join('..', 'application.log'),
});

const errorTransport = new DailyRotateFile({
  filename: path.join(effectiveCurrentDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '50m',
  maxFiles: '30d',
  zippedArchive: true,
  format: logFormat,
  auditFile: path.join(effectiveMetaDir, 'error-audit.json'),
  createSymlink: true,
  symlinkName: path.join('..', 'error.log'),
});

appTransport.on('archive', zipFilename => {
  try {
    const archiveFilename = path.basename(zipFilename);
    const archivePath = path.join(effectiveArchivesDir, archiveFilename);
    fs.renameSync(zipFilename, archivePath);
  } catch {
    void 0;
  }
});

errorTransport.on('archive', zipFilename => {
  try {
    const archiveFilename = path.basename(zipFilename);
    const archivePath = path.join(effectiveArchivesDir, archiveFilename);
    fs.renameSync(zipFilename, archivePath);
  } catch {
    void 0;
  }
});

export const appLogger = winston.createLogger({
  level: getValue(loggingConfig.level) || 'info',
  format: logFormat,
  transports: [appTransport, errorTransport],
  defaultMeta: { category: 'app', service: 'hyperweaver-server' },
  exitOnError: false,
});

const consoleEnabled = getValue(loggingConfig.console_enabled) !== false;
if (consoleEnabled && process.env.NODE_ENV !== 'production') {
  appLogger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

export const proxyLogger = createCategoryLogger('proxy', 'proxy');
export const mailLogger = createCategoryLogger('mail', 'mail');
export const serverLogger = createCategoryLogger('server', 'server');
export const settingsLogger = createCategoryLogger('settings', 'settings');
export const securityLogger = createCategoryLogger('security', 'security');
export const vncLogger = createCategoryLogger('vnc', 'vnc');
export const terminalLogger = createCategoryLogger('terminal', 'terminal');
export const zloginLogger = createCategoryLogger('zlogin', 'zlogin');

/**
 * Helper function to safely log with fallback to console. Strips circular references
 * and truncates very large string values before handing meta to winston.
 * @param {winston.Logger} logger - Winston logger instance
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 */
const safeLog = (logger, level, message, meta = {}) => {
  try {
    const safeMeta = JSON.parse(
      JSON.stringify(meta, (key, value) => {
        void key;
        if (typeof value === 'string' && value.length > 1000) {
          return `${value.substring(0, 1000)}... (truncated)`;
        }
        if (typeof value === 'object' && value !== null) {
          const seen = new WeakSet();
          return JSON.parse(
            JSON.stringify(value, (innerKey, innerValue) => {
              void innerKey;
              if (typeof innerValue === 'object' && innerValue !== null) {
                if (seen.has(innerValue)) {
                  return '[Circular]';
                }
                seen.add(innerValue);
              }
              return innerValue;
            })
          );
        }
        return value;
      })
    );

    logger[level](message, safeMeta);
  } catch {
    if (console[level]) {
      console[level](`[${level.toUpperCase()}] ${message}`, meta);
    }
  }
};

/**
 * Convenience logging functions for each category
 */
export const log = {
  monitoring: {
    info: (msg, meta) => safeLog(monitoringLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(monitoringLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(monitoringLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(monitoringLogger, 'debug', msg, meta),
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

  filesystem: {
    info: (msg, meta) => safeLog(filesystemLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(filesystemLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(filesystemLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(filesystemLogger, 'debug', msg, meta),
  },

  task: {
    info: (msg, meta) => safeLog(taskLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(taskLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(taskLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(taskLogger, 'debug', msg, meta),
  },

  auth: {
    info: (msg, meta) => safeLog(authLogger, 'info', msg, meta),
    warn: (msg, meta) => safeLog(authLogger, 'warn', msg, meta),
    error: (msg, meta) => safeLog(authLogger, 'error', msg, meta),
    debug: (msg, meta) => safeLog(authLogger, 'debug', msg, meta),
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
      const duration = Number(end - start) / 1000000;

      const thresholdMs = getValue(loggingConfig.performance_threshold_ms) || 1000;
      if (duration >= thresholdMs) {
        performanceLogger.warn(`Slow operation detected: ${operation}`, {
          operation,
          duration_ms: Math.round(duration * 100) / 100,
          threshold_ms: thresholdMs,
          ...meta,
        });
      }

      return Math.round(duration * 100) / 100;
    },
  };
};

/**
 * Request logging middleware helper. Static-asset requests are not logged.
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

  if (!req.path.startsWith('/static') && !req.path.match(/\.(?:js|css|png|jpg|ico)$/)) {
    apiRequestLogger.info('Request started', logData);
  }

  return {
    success: (statusCode, meta = {}) => {
      const duration = Date.now() - start;

      if (req.path.startsWith('/static') || req.path.match(/\.(?:js|css|png|jpg|ico)$/)) {
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
