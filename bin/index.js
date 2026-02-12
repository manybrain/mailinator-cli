#!/usr/bin/env node

/**
 * mailinator-cli - CLI entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { inboxCommand } from '../src/commands/inbox.js';
import { emailCommand } from '../src/commands/email.js';
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
  .option('-v, --verbose', 'Show detailed HTTP request/response information');

// Inbox command
program
  .command('inbox')
  .description('List emails in an inbox')
  .argument('<inbox_name>', 'Inbox name to query')
  .argument('[domain]', 'Domain (public, private, or custom domain)')
  .action(async (inboxName, domain) => {
    try {
      const options = program.opts();
      await inboxCommand(inboxName, domain, options.verbose);
    } catch (error) {
      handleError(error);
    }
  });

// Email command
program
  .command('email')
  .description('Retrieve and display an email')
  .argument('<message_id|listing_number>', 'Message ID or listing number from inbox command')
  .argument('[format]', 'Email format (summary, text, textplain, texthtml, full, raw, headers, smtplog, links, linksfull)', 'text')
  .action(async (messageIdentifier, format) => {
    try {
      const options = program.opts();
      await emailCommand(messageIdentifier, format, options.verbose);
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
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
