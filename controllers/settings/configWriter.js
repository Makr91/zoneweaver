import fs from 'fs';
import * as YAML from 'yaml';
import { getConfigFilePath } from '../../utils/config.js';
import { log } from '../../utils/Logger.js';

/**
 * Write a config object to disk, creating a timestamped backup of the current
 * file first. Shared by the flat settings save and the OIDC provider CRUD so
 * every writer backs up identically.
 * @param {Object} updatedConfig - Full config object (with metadata) to persist
 * @returns {string} Path to the backup that was created
 */
export const writeConfigWithBackup = updatedConfig => {
  const configPath = getConfigFilePath();
  const backupPath = `${configPath}.backup.${Date.now()}`;
  fs.copyFileSync(configPath, backupPath);

  const updatedYaml = YAML.stringify(updatedConfig, {
    indent: 2,
    lineWidth: 120,
  });
  fs.writeFileSync(configPath, updatedYaml, 'utf8');

  return backupPath;
};

/**
 * Update config values while preserving metadata structure. Guards against
 * prototype-pollution key paths; a metadata object with a 'value' property gets its
 * value updated, anything else is set directly.
 * @param {Object} currentConfig - Current config with metadata structure
 * @param {Object} newValues - Flat key-value pairs from frontend
 * @returns {Object} Updated config with preserved metadata
 */
export const updateConfigValues = (currentConfig, newValues) => {
  const updatedConfig = JSON.parse(JSON.stringify(currentConfig));

  const setNestedValue = (obj, keyPath, value) => {
    const keys = keyPath.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        throw new Error(`Unsafe config key path: ${keyPath}`);
      }
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    const finalKey = keys[keys.length - 1];
    if (finalKey === '__proto__' || finalKey === 'constructor' || finalKey === 'prototype') {
      throw new Error(`Unsafe config key path: ${keyPath}`);
    }

    if (
      current[finalKey] &&
      typeof current[finalKey] === 'object' &&
      Object.hasOwn(current[finalKey], 'value')
    ) {
      current[finalKey].value = value;
    } else {
      current[finalKey] = value;
    }
  };

  for (const [keyPath, value] of Object.entries(newValues)) {
    try {
      setNestedValue(updatedConfig, keyPath, value);
    } catch (error) {
      log.settings.warn('Failed to update config path', { keyPath, error: error.message });
    }
  }

  return updatedConfig;
};

/**
 * Check if settings changes require a server restart
 */
export const requiresRestart = newSettings => {
  const restartRequired = ['serverPort', 'sslEnabled', 'corsWhitelist', 'sessionTimeout'];

  return Object.keys(newSettings).some(key => restartRequired.includes(key));
};
