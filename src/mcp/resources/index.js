/**
 * MCP Resources Registry
 * Exports all available resource templates for the MCP server
 */

import {
  inboxResourceTemplate,
  readInboxResource,
  parseInboxUri,
} from './inbox-resource.js';

import {
  emailResourceTemplate,
  readEmailResource,
  parseEmailUri,
} from './email-resource.js';

// Export resource templates
export const resourceTemplates = [
  inboxResourceTemplate,
  emailResourceTemplate,
];

/**
 * Read a resource by URI
 * @param {string} uri - Resource URI
 * @returns {Promise<Object>} Resource data
 * @throws {Error} If URI format is invalid or resource not found
 */
export async function readResource(uri) {
  // Determine resource type from URI
  if (uri.startsWith('mailinator://inbox/')) {
    return await readInboxResource(uri);
  } else if (uri.startsWith('mailinator://email/')) {
    return await readEmailResource(uri);
  } else {
    throw new Error(`Unknown resource URI scheme: ${uri}`);
  }
}

/**
 * List all available resources (currently returns templates)
 * In a more dynamic system, this could return actual resource instances
 * @returns {Array} Array of resource templates
 */
export function listResources() {
  return resourceTemplates;
}
