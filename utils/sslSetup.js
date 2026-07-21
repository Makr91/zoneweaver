import fs from 'fs';
import { loadConfig } from './config.js';
import { log } from './Logger.js';

const config = loadConfig();

/**
 * Generate SSL certificates if they don't exist and ssl_generate is enabled
 */
export const generateSSLCertificatesIfNeeded = async () => {
  if (!config.server.ssl_generate.value) {
    return false;
  }

  const keyPath = config.server.ssl_key_path.value;
  const certPath = config.server.ssl_cert_path.value;

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    log.app.info('SSL certificates already exist, skipping generation');
    return false;
  }

  try {
    log.app.info('Generating SSL certificates...');

    const { execSync } = await import('child_process');
    const path = await import('path');

    const sslDir = path.dirname(keyPath);
    if (!fs.existsSync(sslDir)) {
      fs.mkdirSync(sslDir, { recursive: true, mode: 0o700 });
    }

    const opensslCmd = `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -subj "/C=US/ST=State/L=City/O=Hyperweaver/CN=localhost"`;

    execSync(opensslCmd, { stdio: 'pipe' });

    fs.chmodSync(keyPath, 0o600);
    fs.chmodSync(certPath, 0o600);

    log.app.info('SSL certificates generated successfully', {
      keyPath,
      certPath,
    });

    return true;
  } catch (error) {
    log.app.error('Failed to generate SSL certificates', { error: error.message });
    log.app.warn('Continuing with HTTP fallback...');
    return false;
  }
};
