/**
 * MCP Resource: Inbox
 * Provides read access to Mailinator inboxes as resources
 */

import { inboxCommand } from '../../commands/inbox.js';
import { get as cacheGetDomain } from '../../cache/inbox-cache.js';

/**
 * Parse inbox URI
 * Format: mailinator://inbox/{domain}/{inbox_name}
 * @param {string} uri - Resource URI
 * @returns {Object} Parsed URI components
 * @throws {Error} If URI format is invalid
 */
export function parseInboxUri(uri) {
  const pattern = /^mailinator:\/\/inbox\/([^/]+)\/([^/]+)$/;
  const match = uri.match(pattern);

  if (!match) {
    throw new Error(`Invalid inbox URI format. Expected: mailinator://inbox/{domain}/{inbox_name}`);
  }

  return {
    domain: match[1],
    inbox_name: match[2],
  };
}

/**
 * Read inbox resource
 * @param {string} uri - Resource URI
 * @returns {Promise<Object>} Resource data
 */
export async function readInboxResource(uri) {
  const { domain, inbox_name } = parseInboxUri(uri);

  // Call inbox command with returnJSON mode
  const result = await inboxCommand(inbox_name, domain, {
    returnJSON: true,
    verbose: false,
  });

  return {
    uri,
    mimeType: 'application/json',
    content: result,
  };
}

// Resource template for MCP
export const inboxResourceTemplate = {
  uriTemplate: 'mailinator://inbox/{domain}/{inbox_name}',
  name: 'Mailinator Inbox',
  description: 'Read-only access to Mailinator inbox listings. Returns all emails in the specified inbox with metadata.',
  mimeType: 'application/json',
};
