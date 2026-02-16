import fs from 'fs';
import * as YAML from 'yaml';

/**
 * Get the config file path, checking environment variable first, then fallback
 * @returns {string} Path to config.yaml file
 */
const getConfigPath = () => {
  // Check environment variable first (set by systemd)
  if (process.env.CONFIG_PATH) {
    return process.env.CONFIG_PATH;
  }

  // Fallback to local config for development
  return './config.yaml';
};

/**
 * Load and parse the configuration file
 * @returns {Object} Parsed configuration object
 */
export const loadConfig = () => {
  try {
    const configPath = getConfigPath();
    const configFile = fs.readFileSync(configPath, 'utf8');
    return YAML.parse(configFile);
  } catch (error) {
    console.error('Failed to load configuration:', error.message);
    console.error('Tried path:', getConfigPath());
    throw error;
  }
};

/**
 * Get the configuration file path for external use
 * @returns {string} Configuration file path
 */
export const getConfigFilePath = () => getConfigPath();
