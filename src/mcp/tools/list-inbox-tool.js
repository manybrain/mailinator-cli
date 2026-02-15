/**
 * MCP Tool: list_inbox
 * Lists emails in a Mailinator inbox
 */

import { z } from 'zod';
import { inboxCommand } from '../../commands/inbox.js';

// Zod schema for list_inbox parameters
export const listInboxSchema = z.object({
  inbox_name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9*]([a-zA-Z0-9.*]*[a-zA-Z0-9*])?$/,
      'Inbox name must be alphanumeric with optional dots and wildcards'),
  domain: z
    .string()
    .optional()
    .describe('Domain: "public", "private", or custom domain name. Defaults to "private" if API token exists, "public" otherwise.'),
});

// Tool definition for MCP
export const listInboxTool = {
  name: 'list_inbox',
  description: 'Lists all emails in a Mailinator inbox. Supports wildcards (* or prefix*) for private domains with API token. Returns an array of email messages with metadata (from, subject, time, message ID).',
  inputSchema: {
    type: 'object',
    properties: {
      inbox_name: {
        type: 'string',
        description: 'Inbox name to query (max 50 characters, alphanumeric with dots). Can use * for all inboxes or prefix* for wildcard search in private domain with API token.',
      },
      domain: {
        type: 'string',
        description: 'Domain to query: "public", "private", or custom domain name. Defaults to "private" if API token exists, "public" otherwise.',
      },
    },
    required: ['inbox_name'],
  },
};

/**
 * Execute list_inbox tool
 * @param {Object} args - Tool arguments
 * @param {string} args.inbox_name - Inbox name
 * @param {string} [args.domain] - Domain (optional)
 * @returns {Promise<Object>} Inbox listing with messages
 */
export async function executeListInbox(args) {
  // Validate arguments with Zod
  const validatedArgs = listInboxSchema.parse(args);

  // Call inbox command with returnJSON mode
  const result = await inboxCommand(
    validatedArgs.inbox_name,
    validatedArgs.domain,
    { returnJSON: true, verbose: false }
  );

  return result;
}
