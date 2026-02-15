/**
 * MCP Tool: get_email
 * Retrieves a specific email from Mailinator
 */

import { z } from 'zod';
import { emailCommand } from '../../commands/email.js';

// Valid email formats
export const EMAIL_FORMATS = [
  'summary',
  'text',
  'textplain',
  'texthtml',
  'full',
  'raw',
  'headers',
  'smtplog',
  'links',
  'linksfull',
];

// Zod schema for get_email parameters
export const getEmailSchema = z.object({
  message_id: z
    .string()
    .min(1)
    .describe('Message ID from list_inbox results'),
  domain: z
    .string()
    .min(1)
    .optional()
    .describe('Domain where the email is stored (public, private, or custom domain). Optional - will auto-detect from cache or use public/private based on API token.'),
  format: z
    .enum(EMAIL_FORMATS)
    .optional()
    .default('text')
    .describe('Output format for the email'),
});

// Tool definition for MCP
export const getEmailTool = {
  name: 'get_email',
  description: 'Retrieves and formats a specific email from Mailinator. Supports multiple output formats including summary (key fields only), text (formatted with headers), textplain/texthtml (content only), full (complete JSON), headers (table format), smtplog (delivery timeline), and links (extracted URLs). Domain is optional and will be auto-detected from the most recent inbox listing or inferred from API token availability.',
  inputSchema: {
    type: 'object',
    properties: {
      message_id: {
        type: 'string',
        description: 'Unique message ID from the list_inbox tool results',
      },
      domain: {
        type: 'string',
        description: 'Domain where the email is stored: "public", "private", or custom domain name. Optional - will auto-detect from cache or default based on API token.',
      },
      format: {
        type: 'string',
        enum: EMAIL_FORMATS,
        default: 'text',
        description: `Output format:
- summary: Key-value pairs (subject, from, to, domain, time, id)
- text: Plain text with headers (default)
- textplain: Plain text content only
- texthtml: HTML content only
- full/raw: Complete JSON response
- headers: Email headers in table format
- smtplog: SMTP delivery timeline
- links: Extracted links numbered list
- linksfull: Links with text in table format`,
      },
    },
    required: ['message_id'],
  },
};

/**
 * Execute get_email tool
 * @param {Object} args - Tool arguments
 * @param {string} args.message_id - Message ID
 * @param {string} args.domain - Domain
 * @param {string} [args.format] - Format (optional, defaults to 'text')
 * @returns {Promise<Object>} Email data in requested format
 */
export async function executeGetEmail(args) {
  // Validate arguments with Zod
  const validatedArgs = getEmailSchema.parse(args);

  // Call email command with returnJSON mode
  const result = await emailCommand(
    validatedArgs.message_id,
    validatedArgs.format,
    {
      returnJSON: true,
      verbose: false,
      domain: validatedArgs.domain,
    }
  );

  return result;
}
