/**
 * MCP response formatter utility
 * Formats successful responses according to JSON-RPC 2.0 spec
 */

/**
 * Creates a JSON-RPC 2.0 success response
 * @param {number|string} id - JSON-RPC request ID
 * @param {*} result - Result data
 * @returns {Object} JSON-RPC success response
 */
export function formatSuccessResponse(id, result) {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Formats tool list response
 * @param {Array} tools - Array of tool definitions
 * @returns {Object} Formatted tools list
 */
export function formatToolsList(tools) {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
}

/**
 * Formats resource list response
 * @param {Array} resources - Array of resource templates
 * @returns {Object} Formatted resources list
 */
export function formatResourcesList(resources) {
  return {
    resources: resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  };
}

/**
 * Formats resource templates list response
 * @param {Array} templates - Array of resource templates
 * @returns {Object} Formatted resource templates
 */
export function formatResourceTemplatesList(templates) {
  return {
    resourceTemplates: templates.map(template => ({
      uriTemplate: template.uriTemplate,
      name: template.name,
      description: template.description,
      mimeType: template.mimeType,
    })),
  };
}

/**
 * Formats resource read response
 * @param {Object} resource - Resource data
 * @returns {Object} Formatted resource contents
 */
export function formatResourceContents(resource) {
  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType || 'application/json',
        text: typeof resource.content === 'string' ? resource.content : JSON.stringify(resource.content, null, 2),
      },
    ],
  };
}

/**
 * Formats tool call result
 * @param {*} content - Tool execution result
 * @param {boolean} isError - Whether the result is an error
 * @returns {Object} Formatted tool result
 */
export function formatToolResult(content, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
      },
    ],
    isError,
  };
}

/**
 * Formats initialize response
 * @param {string} serverName - Name of the server
 * @param {string} serverVersion - Version of the server
 * @returns {Object} Initialize response
 */
export function formatInitializeResponse(serverName, serverVersion) {
  return {
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: serverName,
      version: serverVersion,
    },
    capabilities: {
      tools: {},
      resources: {
        subscribe: false,
        listChanged: false,
      },
    },
  };
}
