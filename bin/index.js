#!/usr/bin/env node

/**
 * mailinator-cli - CLI entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { inboxCommand } from '../src/commands/inbox.js';
import { emailCommand } from '../src/commands/email.js';
import { startMCPServer } from '../src/mcp/server.js';
import {
  ValidationError,
  APIError,
  ConfigError,
  CacheError,
} from '../src/utils/errors.js';

const program = new Command();

// Program metadata
program
  .name('mailinator-cli')
  .description('CLI tool to interact with Mailinator disposable email service')
  .version('1.0.0')
  .option('-v, --verbose', 'Show detailed HTTP request/response information')
  .option('--start-mcp-server', 'Start MCP server instead of CLI mode')
  .option('--host <address>', 'MCP server host address (only with --start-mcp-server)', '127.0.0.1')
  .option('--port <number>', 'MCP server port (only with --start-mcp-server)', '8080');

// Parse options early to check for MCP server mode
program.parse(process.argv);
const globalOptions = program.opts();

// Fork: MCP server mode OR CLI mode
if (globalOptions.startMcpServer) {
  // Validate that host/port are only used with --start-mcp-server (already enforced by being here)
  const host = globalOptions.host;
  const port = parseInt(globalOptions.port, 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(chalk.red('Error: Invalid port number. Must be between 1 and 65535.'));
    process.exit(1);
  }

  // Start MCP server (runs indefinitely, no CLI commands will run)
  await startMCPServer({
    host,
    port,
    verbose: globalOptions.verbose || false,
  });

  // Server runs indefinitely, keeping the event loop alive
  // This code won't be reached unless server exits with error
} else {
  // CLI mode - validate and setup commands

  // Validate that --host and --port are only used with --start-mcp-server
  if ((globalOptions.host !== '127.0.0.1' || globalOptions.port !== '8080')) {
    console.error(chalk.red('Error: --host and --port flags are only valid with --start-mcp-server'));
    process.exit(1);
  }

  // Reset program to re-parse for CLI commands
  const cliProgram = new Command();
  cliProgram
    .name('mailinator-cli')
    .description('CLI tool to interact with Mailinator disposable email service')
    .version('1.0.0')
    .option('-v, --verbose', 'Show detailed HTTP request/response information')
    .option('--start-mcp-server', 'Start MCP server instead of CLI mode')
    .option('--host <address>', 'MCP server host address (only with --start-mcp-server)', '127.0.0.1')
    .option('--port <number>', 'MCP server port (only with --start-mcp-server)', '8080');

  // Inbox command
  cliProgram
    .command('inbox')
    .description('List emails in an inbox')
    .argument('<inbox_name>', 'Inbox name to query')
    .argument('[domain]', 'Domain (public, private, or custom domain)')
    .action(async (inboxName, domain) => {
      try {
        const options = cliProgram.opts();
        await inboxCommand(inboxName, domain, { verbose: options.verbose });
      } catch (error) {
        handleError(error);
      }
    });

  // Email command
  cliProgram
    .command('email')
    .description('Retrieve and display an email')
    .argument('<message_id|listing_number>', 'Message ID or listing number from inbox command')
    .argument('[format]', 'Email format (summary, text, textplain, texthtml, full, raw, headers, smtplog, links, linksfull)', 'text')
    .action(async (messageIdentifier, format) => {
      try {
        const options = cliProgram.opts();
        await emailCommand(messageIdentifier, format, { verbose: options.verbose });
      } catch (error) {
        handleError(error);
      }
    });

  // Global error handler
  function handleError(error) {
    if (error instanceof ValidationError) {
      console.error(chalk.red('Validation Error:'), error.message);
      process.exit(1);
    } else if (error instanceof APIError) {
      console.error(chalk.red('API Error:'), error.message);
      if (error.statusCode) {
        console.error(chalk.dim(`Status code: ${error.statusCode}`));
      }
      process.exit(2);
    } else if (error instanceof CacheError) {
      console.error(chalk.red('Cache Error:'), error.message);
      console.error(chalk.dim('Hint: Run the "inbox" command first to populate the cache.'));
      process.exit(3);
    } else if (error instanceof ConfigError) {
      console.error(chalk.yellow('Config Warning:'), error.message);
      // Config errors are warnings, not fatal
      process.exit(0);
    } else {
      console.error(chalk.red('Unexpected Error:'), error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  // Parse command line arguments
  cliProgram.parse(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    cliProgram.outputHelp();
  }
}
