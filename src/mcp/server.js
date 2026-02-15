/**
 * MCP Server Implementation using @modelcontextprotocol/sdk
 * Properly implements MCP protocol using the official SDK
 */

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

// Import tool executors
import { executeListInbox } from './tools/list-inbox-tool.js';
import { executeGetEmail, EMAIL_FORMATS } from './tools/get-email-tool.js';

// Import resource handlers
import { readInboxResource } from './resources/inbox-resource.js';
import { readEmailResource } from './resources/email-resource.js';

const SERVER_NAME = 'mailinator-mcp-server';
const SERVER_VERSION = '1.0.0';

/**
 * Create and configure MCP server
 * @returns {McpServer} Configured MCP server instance
 */
function createMcpServer() {
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
      instructions: 'Mailinator is a free, disposable, email service. All email addresses (up to 50 characters) exist at the following domains: mailinator.com (public), and private/custom domains for authenticated users - there is no need to \'create\' email addresses at these domains, use any one you wish! Send email (or have email sent) to this domain anytime you need to receive an email as part of a workflow. This MCP allows you to fetch inbox message summaries and to fetch individual emails in an array of formats. Use Mailinator anytime you need a quick, frictionless, way to receive an email for any purpose. Use list_inbox to list messages and get_email to retrieve specific messages by ID. The Public domain requires no authentication. Customers may provide an API token to access messages in their private domains.',
    }
  );

  // Register list_inbox tool
  server.registerTool(
    'list_inbox',
    {
      description: 'Lists all emails in a Mailinator inbox. Supports wildcards (* or prefix*) for private domains with API token. Returns an array of email messages with metadata (from, subject, time, message ID).',
      inputSchema: z.object({
        inbox_name: z
          .string()
          .min(1)
          .max(50)
          .describe('Inbox name to query (max 50 characters, alphanumeric with dots). Can use * for all inboxes or prefix* for wildcard search in private domain with API token.'),
        domain: z
          .string()
          .optional()
          .describe('Domain to query: "public", "private", or custom domain name. Defaults to "private" if API token exists, "public" otherwise.'),
      }),
      outputSchema: z.object({
        inbox_name: z.string(),
        domain: z.string(),
        messages: z.array(z.object({
          number: z.number(),
          id: z.string(),
          from: z.string(),
          subject: z.string(),
          time: z.number(),
          seconds_ago: z.number(),
        })),
        count: z.number(),
      }),
    },
    async (args) => {
      try {
        const result = await executeListInbox(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message, type: error.name }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register get_email tool
  server.registerTool(
    'get_email',
    {
      description: 'Retrieves and formats a specific email from Mailinator. Supports multiple output formats including summary (key fields only), text (formatted with headers), textplain/texthtml (content only), full (complete JSON), headers (table format), smtplog (delivery timeline), and links (extracted URLs). Domain is optional and will be auto-detected from the most recent inbox listing or inferred from API token availability.',
      inputSchema: z.object({
        message_id: z
          .string()
          .min(1)
          .describe('Unique message ID from the list_inbox tool results'),
        domain: z
          .string()
          .min(1)
          .optional()
          .describe('Domain where the email is stored: "public", "private", or custom domain name. Optional - will auto-detect from cache or default based on API token.'),
        format: z
          .enum(EMAIL_FORMATS)
          .optional()
          .default('text')
          .describe('Output format: summary, text (default), textplain, texthtml, full/raw, headers, smtplog, links, linksfull'),
      }),
      outputSchema: z.any(), // Email output varies by format
    },
    async (args) => {
      try {
        const result = await executeGetEmail(args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message, type: error.name }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register inbox resource template
  server.registerResource(
    'Mailinator Inbox',
    'mailinator://inbox/{domain}/{inbox_name}',
    {
      description: 'Read-only access to Mailinator inbox listings. Returns all emails in the specified inbox with metadata.',
      mimeType: 'application/json',
    },
    async (uri) => {
      try {
        const resource = await readInboxResource(uri);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: typeof resource.content === 'string'
                ? resource.content
                : JSON.stringify(resource.content, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read inbox resource: ${error.message}`);
      }
    }
  );

  // Register email resource template
  server.registerResource(
    'Mailinator Email',
    'mailinator://email/{domain}/{message_id}',
    {
      description: 'Read-only access to specific Mailinator emails. Returns email content in text format with headers and metadata.',
      mimeType: 'application/json',
    },
    async (uri) => {
      try {
        const resource = await readEmailResource(uri);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: typeof resource.content === 'string'
                ? resource.content
                : JSON.stringify(resource.content, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to read email resource: ${error.message}`);
      }
    }
  );

  // Log what was registered
  console.log('[MCP Server] Registered 2 tools: list_inbox, get_email');
  console.log('[MCP Server] Registered 2 resource templates: Mailinator Inbox, Mailinator Email');

  return server;
}

/**
 * Start MCP server
 * @param {Object} options - Server options
 * @param {string} options.host - Host address to bind to
 * @param {number} options.port - Port to listen on
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {Promise<void>}
 */
export async function startMCPServer(options) {
  const { host = '127.0.0.1', port = 8080, verbose = false } = options;

  if (verbose) {
    console.log('Starting MCP server with options:', { host, port });
  }

  try {
    // Create MCP server
    const mcpServer = createMcpServer();

    // Create transport with stateless mode
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    // Connect server to transport
    await mcpServer.connect(transport);

    // Create Express app
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: SERVER_NAME });
    });

    // MCP endpoint - delegate to transport
    app.post('/mcp', async (req, res) => {
      await transport.handleRequest(req, res, req.body);
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.path} not found. Use POST /mcp for MCP requests.`,
      });
    });

    // Start Express server
    const server = app.listen(port, host, () => {
      console.log(`\nMailinator MCP Server started`);
      console.log(`Listening on: http://${host}:${port}/mcp`);
      console.log(`Health check: http://${host}:${port}/health`);
      console.log('\nPress Ctrl+C to stop the server\n');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Error: Port ${port} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`Error: Permission denied to bind to ${host}:${port}`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        throw error;
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down MCP server...');
      await mcpServer.close();
      server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nShutting down MCP server...');
      await mcpServer.close();
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error.message);
    if (verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
