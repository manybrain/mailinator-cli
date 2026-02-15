/**
 * MCP Tools Registry
 * Exports all available tools for the MCP server
 */

import { listInboxTool, executeListInbox } from './list-inbox-tool.js';
import { getEmailTool, executeGetEmail } from './get-email-tool.js';

// Export tool definitions
export const tools = [
  listInboxTool,
  getEmailTool,
];

// Export tool executors mapped by name
export const toolExecutors = {
  list_inbox: executeListInbox,
  get_email: executeGetEmail,
};

/**
 * Execute a tool by name
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} args - Tool arguments
 * @returns {Promise<*>} Tool execution result
 * @throws {Error} If tool not found
 */
export async function executeTool(toolName, args) {
  const executor = toolExecutors[toolName];

  if (!executor) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  return await executor(args);
}
