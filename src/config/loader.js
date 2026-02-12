/**
 * Configuration loader for API token
 */

import Conf from 'conf';
import { ConfigError } from '../utils/errors.js';

const config = new Conf({
  projectName: 'mailinator',
  configName: 'config',
});

/**
 * Load API token from environment variable or config file
 * Priority: environment variable > config file > none
 * @returns {Object} { apiToken: string|null, source: 'environment'|'file'|'none' }
 */
export function loadConfig() {
  // Check environment variable first
  const envToken = process.env.MAILINATOR_API_KEY;
  if (envToken) {
    return {
      apiToken: envToken,
      source: 'environment',
    };
  }

  // Check config file
  try {
    const fileToken = config.get('apiKey');
    if (fileToken) {
      return {
        apiToken: fileToken,
        source: 'file',
      };
    }
  } catch (error) {
    // Config file doesn't exist or is invalid, continue
  }

  // No token found
  return {
    apiToken: null,
    source: 'none',
  };
}

/**
 * Save API token to config file
 * @param {string} token - API token to save
 */
export function saveConfig(token) {
  try {
    config.set('apiKey', token);
  } catch (error) {
    throw new ConfigError(`Failed to save configuration: ${error.message}`);
  }
}

/**
 * Get config file path
 * @returns {string} Path to config file
 */
export function getConfigPath() {
  return config.path;
}
