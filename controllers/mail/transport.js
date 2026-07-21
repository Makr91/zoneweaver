import nodemailer from 'nodemailer';
import { loadConfig } from '../../utils/config.js';
import { log } from '../../utils/Logger.js';

let mailConfig = null;
let appConfig = null;

/**
 * Initialize mail configuration
 */
const init = () => {
  try {
    const fullConfig = loadConfig();

    mailConfig = fullConfig.mail;
    appConfig = fullConfig.app;

    if (!mailConfig) {
      log.mail.warn('Mail configuration not found in config.yaml');
    }
  } catch (error) {
    log.mail.error('Failed to load mail configuration', { error: error.message });
  }
};

/**
 * Get mail configuration
 */
export const getConfig = () => {
  if (!mailConfig) {
    init();
  }
  return mailConfig;
};

/**
 * Get app configuration (loaded alongside the mail config)
 */
export const getAppConfig = () => {
  if (!mailConfig) {
    init();
  }
  return appConfig;
};

/**
 * Create nodemailer transporter from the UI-metadata-format mail configuration
 */
export const createTransporter = () => {
  const config = getConfig();

  if (!config) {
    throw new Error('Mail configuration not available');
  }

  if (!config.smtp_host?.value || !config.smtp_port?.value || !config.smtp_from?.value) {
    throw new Error('Incomplete mail configuration. Missing smtp_host, smtp_port, or smtp_from');
  }

  const transporterConfig = {
    host: config.smtp_host.value,
    port: config.smtp_port.value,
    secure: config.smtp_secure?.value || false,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  };

  if (config.smtp_user?.value && config.smtp_password?.value) {
    transporterConfig.auth = {
      user: config.smtp_user.value,
      pass: config.smtp_password.value,
    };
  }

  return nodemailer.createTransport(transporterConfig);
};
