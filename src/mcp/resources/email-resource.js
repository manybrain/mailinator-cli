/**
 * MCP Resource: Email
 * Provides read access to Mailinator emails as resources
 */

import { emailCommand } from '../../commands/email.js';

/**
 * Parse email URI
 * Format: mailinator://email/{domain}/{message_id}
 * @param {string} uri - Resource URI
 * @returns {Object} Parsed URI components
 * @throws {Error} If URI format is invalid
 */
export function parseEmailUri(uri) {
  const pattern = /^mailinator:\/\/email\/([^/]+)\/([^/]+)$/;
  const match = uri.match(pattern);

  if (!match) {
    throw new Error(`Invalid email URI format. Expected: mailinator://email/{domain}/{message_id}`);
  }

  return {
    domain: match[1],
    message_id: match[2],
  };
}

/**
 * Read email resource
 * @param {string} uri - Resource URI
 * @returns {Promise<Object>} Resource data
 */
export async function readEmailResource(uri) {
  const { domain, message_id } = parseEmailUri(uri);

  // Call email command with text format (default for resources)
  const result = await emailCommand(message_id, 'text', {
    returnJSON: true,
    verbose: false,
    domain,
  });

  return {
    uri,
    mimeType: 'application/json',
    content: result,
  };
}

// Resource template for MCP
export const emailResourceTemplate = {
  uriTemplate: 'mailinator://email/{domain}/{message_id}',
  name: 'Mailinator Email',
  description: 'Read-only access to specific Mailinator emails. Returns email content in text format with headers and metadata.',
  mimeType: 'application/json',
};
