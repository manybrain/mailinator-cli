# Mailinator-CLI (and MCP Server)

A Node.js CLI tool and MCP (Model Context Protocol) server to interact with the Mailinator disposable email service. List emails in any inbox and retrieve individual messages in various formats, either from the command line or through AI assistants like Claude Desktop.

## Features

### CLI Features
- 📬 List emails in any Mailinator inbox with numbered, human-readable table format
- 📧 Retrieve individual emails by message ID or listing number
- 🔒 Support for both public and private domains
- 🎨 Multiple output formats (text, HTML, headers, links, JSON, etc.)
- ⚡ Fast inbox caching for quick email retrieval
- 🔑 Flexible API token configuration (environment variable or config file)
- 🌐 Wildcard inbox searches (with API token)

### MCP Server Features
- 🤖 **MCP server mode** for integration with AI assistants (Claude Desktop, etc.)
- 🛠️ **Tools**: `list_inbox` and `get_email` for active email operations
- 📚 **Resources**: Read-only access via `mailinator://` URIs for passive context
- 🔌 HTTP-based server with configurable host/port
- 🔄 Same functionality as CLI but accessible via MCP protocol

## Installation

### Global Install (Recommended)

```bash
npm install -g mailinator-cli
```

### NPX (No Install Required)

```bash
npx mailinator-cli inbox test public
```

### Local Development

```bash
git clone <repository-url>
cd mailinator-cli
npm install
npm link
```

## Configuration

### API Token (Optional for Public Domain)

Mailinator allows public access to the "public" domain without authentication. To access private domains or use advanced features (SMTP logs, wildcards, etc.), you'll need an API token.

Get your API token from: [Mailinator API Settings](https://www.mailinator.com/v4/private/index.jsp)

#### Option 1: Environment Variable

```bash
export MAILINATOR_API_KEY=your_api_token_here
```

Or create a `.env` file:

```bash
MAILINATOR_API_KEY=your_api_token_here
```

#### Option 2: Config File

Create `~/.config/mailinator/config.json`:

```json
{
  "apiKey": "your_api_token_here"
}
```

**Priority:** Environment variable > Config file > None (public domain only)

## CLI Usage

### Global Options

These options can be used with any command:

- `-v, --verbose` - Show detailed HTTP request/response information
- `-V, --version` - Output the version number
- `-h, --help` - Display help for command
- `--start-mcp-server` - Start MCP server mode instead of CLI
- `--host <address>` - MCP server host (only with --start-mcp-server), default: 127.0.0.1
- `--port <number>` - MCP server port (only with --start-mcp-server), default: 8080

**Verbose Mode:**

Enable verbose mode to see all HTTP calls with URLs and JSON responses. Useful for debugging or understanding API interactions.

```bash
# Show detailed HTTP information
mailinator-cli --verbose inbox testuser public
mailinator-cli -v email 1 summary
```

### Inbox Command

List all emails in an inbox.

```bash
mailinator-cli [options] inbox <inbox_name> [domain]
```

**Arguments:**
- `inbox_name` (required): The inbox/email to query
- `domain` (optional): Domain to use. Defaults to:
  - `"private"` if API token is configured
  - `"public"` if no API token

**Examples:**

```bash
# List emails in the public domain (no token required)
mailinator-cli inbox testuser public

# List emails in private domain (requires API token)
mailinator-cli inbox myinbox private

# Auto-detect domain based on token configuration
mailinator-cli inbox myinbox

# Use custom domain
mailinator-cli inbox support mycustomdomain.com

# Wildcard search (requires API token and private domain)
mailinator-cli inbox test* private

# Show verbose HTTP information
mailinator-cli --verbose inbox testuser public
```

**Output:**

```
Inbox: testuser@public

┌─────┬────────────────────────────────┬──────────────────────────────────────────────────┬────────────────────┐
│ #   │ From                           │ Subject                                          │ Time               │
├─────┼────────────────────────────────┼──────────────────────────────────────────────────┼────────────────────┤
│ 1   │ noreply@example.com            │ Welcome to our service                           │ 21 mins ago        │
│ 2   │ notifications@github.com       │ [GitHub] Password reset request                  │ 2 hours ago        │
│ 3   │ support@company.com            │ Your order confirmation                          │ 5 hours ago        │
└─────┴────────────────────────────────┴──────────────────────────────────────────────────┴────────────────────┘

Total: 3 emails
```

### Email Command

Retrieve and display a specific email.

```bash
mailinator-cli [options] email <message_id|listing_number> [format]
```

**Arguments:**
- `message_id|listing_number` (required): Either:
  - A listing number from the inbox command (e.g., `1`, `2`, `3`)
  - A full message ID (e.g., `testuser-1234567890-abcdef`)
- `format` (optional): Output format. Default: `text`

**Available Formats:**
- `summary` - Key-value pairs (subject, from, to, domain, time, id)
- `text` - Plain text content with headers (default)
- `textplain` - Plain text part only
- `texthtml` - HTML part only
- `full` - Complete email data as formatted JSON
- `raw` - Raw email data as JSON
- `headers` - Email headers as table
- `smtplog` - SMTP delivery log timeline (requires API token)
- `links` - Numbered list of links found in email
- `linksfull` - Table with link text and URLs

**Examples:**

```bash
# Retrieve email by listing number (from inbox command)
mailinator-cli email 1

# Retrieve with specific format
mailinator-cli email 1 summary
mailinator-cli email 1 headers
mailinator-cli email 1 texthtml

# Retrieve by full message ID
mailinator-cli email testuser-1234567890-abcdef text

# Extract all links from email
mailinator-cli email 1 links

# View SMTP delivery log (requires API token)
mailinator-cli email 1 smtplog

# View full email data
mailinator-cli email 1 full

# Show verbose HTTP information
mailinator-cli --verbose email 1 full
```

**Example Output (text format):**

```
From: noreply@example.com
Subject: Welcome to our service
Time: Feb 12, 2026 14:30:15

────────────────────────────────────────────────────────────────────────────────

Hello and welcome!

Thank you for signing up for our service. We're excited to have you on board.

To get started, please verify your email address by clicking the link below:
https://example.com/verify?token=abc123

Best regards,
The Team
```

## MCP Server Usage

The MCP (Model Context Protocol) server mode allows AI assistants like Claude Desktop to access Mailinator functionality programmatically.

### Starting the MCP Server

```bash
# Start on default port (127.0.0.1:8080)
mailinator-cli --start-mcp-server

# Start on custom host and port
mailinator-cli --start-mcp-server --host=0.0.0.0 --port=3000

# With API token for authenticated features
export MAILINATOR_API_KEY=your_token_here
mailinator-cli --start-mcp-server
```

### Configuring Claude Desktop

Add to your Claude Desktop MCP configuration (typically at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

#### Option 1: Let Claude Desktop Start the Server

```json
{
  "mcpServers": {
    "mailinator": {
      "command": "node",
      "args": ["/absolute/path/to/mailinator-cli/bin/index.js", "--start-mcp-server"],
      "env": {
        "MAILINATOR_API_KEY": "your_token_here"
      }
    }
  }
}
```

#### Option 2: Connect to Running Server

```json
{
  "mcpServers": {
    "mailinator": {
      "url": "http://127.0.0.1:8080/mcp"
    }
  }
}
```

### MCP Tools

The server provides two tools that AI assistants can invoke:

#### `list_inbox`
Lists all emails in a Mailinator inbox.

**Parameters:**
- `inbox_name` (required): Inbox name to query
- `domain` (optional): Domain (public, private, or custom)

**Example prompts for Claude:**
- "List emails in the joe inbox"
- "What emails are in testuser@public"
- "Show me all emails in myinbox"

#### `get_email`
Retrieves a specific email with optional format.

**Parameters:**
- `message_id` (required): Message ID from list_inbox results
- `domain` (optional): Domain (auto-detected from cache if not provided)
- `format` (optional): Output format (text, summary, full, smtplog, etc.)

**Example prompts for Claude:**
- "Fetch that first email"
- "Show me email 3 in summary format"
- "Get the SMTP log for that message"

### MCP Resources

The server also exposes resources that can be read via URIs:

- `mailinator://inbox/{domain}/{inbox_name}` - Read inbox listing
- `mailinator://email/{domain}/{message_id}` - Read email content

**Difference between Tools and Resources:**
- **Tools** are active operations that AI invokes based on user requests
- **Resources** are passive data that AI can reference as context

Both provide the same underlying functionality but through different MCP interfaces.

### MCP Server Endpoints

When running in MCP server mode:
- **MCP Endpoint**: `POST http://127.0.0.1:8080/mcp` (or your custom host:port)
- **Health Check**: `GET http://127.0.0.1:8080/health`

The server implements the MCP Streamable HTTP transport protocol.

## Inbox Caching

The `inbox` command caches the list of emails to `~/.config/mailinator/inbox-cache.json`. This allows you to:

1. Quickly retrieve emails by their listing number (1, 2, 3, etc.)
2. Avoid re-running the inbox command for each email retrieval
3. Auto-detect domain for email retrieval in MCP mode

The cache persists across CLI invocations until you run the `inbox` command again.

## Validation Rules

### Inbox Names
- Maximum 50 characters
- Alphanumeric characters and dots (`.`)
- Cannot start or end with a dot
- Pattern: `[a-zA-Z0-9]([a-zA-Z0-9.]*[a-zA-Z0-9])?`

### Wildcards
- Requires API token
- Only allowed in private domains (not public)
- Formats: `*` (all inboxes) or `prefix*` (inboxes starting with prefix)
- Only one wildcard at the end

### Domains
- Special values: `public`, `private`
- Custom domains: Valid domain name format

## Error Handling

The CLI provides clear error messages for common issues:

- **Validation Error**: Invalid input (inbox name, domain, format)
- **API Error**: Authentication failures, network issues, API errors
- **Cache Error**: No cached inbox (run `inbox` command first)
- **Config Error**: Configuration file issues (non-fatal warnings)

Exit codes:
- `0` - Success or config warning
- `1` - Validation error
- `2` - API error
- `3` - Cache error

## Examples

### Common Workflows

**Check emails for a test account:**

```bash
# List emails
mailinator-cli inbox testuser public

# Read the first email
mailinator-cli email 1

# View headers of second email
mailinator-cli email 2 headers
```

**Use with private domain:**

```bash
# Configure API token
export MAILINATOR_API_KEY=your_token_here

# List private inbox
mailinator-cli inbox myinbox

# Read email with summary
mailinator-cli email 1 summary

# View SMTP delivery log
mailinator-cli email 1 smtplog
```

**Extract links from an email:**

```bash
mailinator-cli inbox newsletter public
mailinator-cli email 1 links
```

**Search multiple inboxes:**

```bash
# Requires API token
mailinator-cli inbox test* private
```

**Use as MCP server with Claude Desktop:**

```bash
# Start the server
export MAILINATOR_API_KEY=your_token_here
mailinator-cli --start-mcp-server

# In Claude Desktop, ask:
# "What emails are in the joe inbox?"
# "Show me that first email in summary format"
# "Get the SMTP log for that message"
```

## Requirements

- Node.js >= 18.0.0
- Internet connection (to access Mailinator API)

## API Endpoints

This tool uses the Mailinator CLI API v3:

- **Inbox**: `GET https://api.mailinator.com/cli/v3/domains/{domain}/inboxes/{inbox_name}`
- **Email**: `GET https://api.mailinator.com/cli/v3/domains/{domain}/messages/{message_id}?format={format}`
- **SMTP Log**: `GET https://api.mailinator.com/cli/v3/domains/{domain}/messages/{message_id}/smtplog`

**Note:** The `smtplog` format uses a separate endpoint path, not a format query parameter.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### "Authentication failed" error
- Verify your API token is correct
- Check that the token is properly set in environment variable or config file

### "No cached inbox found" error
- Run the `inbox` command first to populate the cache
- The cache is stored at `~/.config/mailinator/inbox-cache.json`

### "Wildcard searches require an API token" error
- Wildcard searches (`*` or `prefix*`) require authentication
- Set your API token using environment variable or config file

### "Access forbidden" error
- You may be trying to access a private domain without an API token
- Some operations require authentication even in public domain

### "(No SMTP log available)" message
- SMTP logs may require an API token
- SMTP logs may not be available for all emails
- Ensure you're requesting the `smtplog` format correctly

### MCP Server Issues

**Tools/Resources not appearing in Claude Desktop:**
- Restart Claude Desktop completely (not just reconnect)
- Verify the MCP configuration path is correct
- Check server logs for errors
- Ensure the server is running: `curl http://127.0.0.1:8080/health`

**"Invalid union" or JSON-RPC errors:**
- Make sure you're using the latest version of the CLI
- Ensure the server was started successfully
- Check that the API token is configured if accessing private features

**Port already in use:**
- Another instance might be running: `pkill -f "node.*start-mcp-server"`
- Or use a different port: `--port=8765`

## Support

For issues related to the Mailinator API itself, visit: [Mailinator Support](https://www.mailinator.com/support)

For CLI tool issues, please open an issue in the repository.

## Related Links

- [Mailinator](https://www.mailinator.com/) - Email Testing service
- [Mailinator API Documentation](https://www.mailinator.com/v4/documentation/)
