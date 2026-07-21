/**
 * @fileoverview Logger core: config extraction, log-directory resolution (with local
 * fallback when the system directory is unwritable), shared formats, and the
 * per-category logger factory.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = loadConfig();
export const loggingConfig = config.logging || {
  level: { value: 'info' },
  console_enabled: { value: true },
  log_directory: { value: '/var/log/hyperweaver-server' },
  file_rotation: {
    max_size: { value: 50 },
    max_files: { value: 5 },
  },
  performance_threshold_ms: { value: 1000 },
  categories: {},
};

/**
 * Extract a value from metadata format
 */
export const getValue = configItem => {
  if (typeof configItem === 'object' && configItem !== null && 'value' in configItem) {
    return configItem.value;
  }
  return configItem;
};

const logDir = getValue(loggingConfig.log_directory) || '/var/log/hyperweaver-server';
const currentDir = path.join(logDir, 'current');
const archivesDir = path.join(logDir, 'archives');
const metaDir = path.join(logDir, '.meta');

let resolvedLogDir = logDir;
let resolvedCurrentDir = currentDir;
let resolvedArchivesDir = archivesDir;
let resolvedMetaDir = metaDir;

try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true, mode: 0o755 });
  }
  if (!fs.existsSync(currentDir)) {
    fs.mkdirSync(currentDir, { recursive: true, mode: 0o755 });
  }
  if (!fs.existsSync(archivesDir)) {
    fs.mkdirSync(archivesDir, { recursive: true, mode: 0o755 });
  }
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true, mode: 0o755 });
  }

  const testFile = path.join(logDir, '.write-test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
} catch {
  const fallbackDir = path.join(__dirname, '..', 'logs');
  resolvedLogDir = fallbackDir;
  resolvedCurrentDir = path.join(fallbackDir, 'current');
  resolvedArchivesDir = path.join(fallbackDir, 'archives');
  resolvedMetaDir = path.join(fallbackDir, '.meta');

  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  if (!fs.existsSync(resolvedCurrentDir)) {
    fs.mkdirSync(resolvedCurrentDir, { recursive: true });
  }
  if (!fs.existsSync(resolvedArchivesDir)) {
    fs.mkdirSync(resolvedArchivesDir, { recursive: true });
  }
  if (!fs.existsSync(resolvedMetaDir)) {
    fs.mkdirSync(resolvedMetaDir, { recursive: true });
  }

  console.warn(`Could not create log directory ${logDir}, using ${fallbackDir}`);
}

export const effectiveLogDir = resolvedLogDir;
export const effectiveCurrentDir = resolvedCurrentDir;
export const effectiveArchivesDir = resolvedArchivesDir;
export const effectiveMetaDir = resolvedMetaDir;

/**
 * Common log format configuration - optimized for production
 */
export const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console format for development - simplified and colorized
 */
export const consoleFormat = winston.format.combine(
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
 * Create a logger for a specific category with organized directory structure
 * @param {string} category - Log category name
 * @param {string} filename - Log filename (without extension)
 * @returns {winston.Logger} Configured winston logger
 */
export const createCategoryLogger = (category, filename) => {
  const categoryConfig = loggingConfig.categories?.[category];
  const categoryLevel = getValue(categoryConfig) || getValue(loggingConfig.level) || 'info';
  const transports = [];

  const categoryTransport = new DailyRotateFile({
    filename: path.join(effectiveCurrentDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    level: categoryLevel,
    format: logFormat,
    maxSize: `${getValue(loggingConfig.file_rotation?.max_size) || 50}m`,
    maxFiles: getValue(loggingConfig.file_rotation?.max_files) || '14d',
    zippedArchive: true,
    auditFile: path.join(effectiveMetaDir, `${filename}-audit.json`),
    createSymlink: true,
    symlinkName: path.join('..', `${filename}.log`),
  });

  categoryTransport.on('archive', zipFilename => {
    try {
      const archiveFilename = path.basename(zipFilename);
      const archivePath = path.join(effectiveArchivesDir, archiveFilename);
      fs.renameSync(zipFilename, archivePath);
    } catch {
      void 0;
    }
  });

  transports.push(categoryTransport);

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
    defaultMeta: { category, service: 'hyperweaver-server' },
    transports,
    exitOnError: false,
    silent: getValue(loggingConfig.level) === 'silent',
  });
};
