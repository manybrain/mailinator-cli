# Mailinator CLI & MCP Server

## Overview

A Node.js tool providing both command-line and AI-integrated access to Mailinator's disposable email service. Enables automated email testing, workflow verification, and email content extraction through CLI commands or via the Model Context Protocol (MCP) for AI assistants.

- **Service Type:** Email Testing & Automation
- **Protocol Support:** CLI, MCP (Model Context Protocol)
- **License:** MIT
- **Repository:** https://github.com/manybrain/mailinator-cli

## What is Mailinator?

Mailinator is a free, public, disposable email service. Every email address at @mailinator.com (and private custom domains) automatically exists—no signup required. Simply choose any inbox name (up to 50 characters) and receive emails instantly. Perfect for testing, automation, and workflows requiring temporary email addresses.

## Capabilities

### Core Features

- **Inbox Listing**: Retrieve all emails in any Mailinator inbox with metadata (sender, subject, timestamp)
- **Email Retrieval**: Fetch individual emails in 10+ formats (text, HTML, JSON, headers, SMTP logs, links)
- **Wildcard Search**: Query multiple inboxes at once with pattern matching (requires authentication)
- **Public & Private Domains**: Access public @mailinator.com or private custom domains
- **Smart Caching**: Local inbox cache for fast email retrieval by reference number
- **Multiple Output Formats**: Tailored views for different use cases (testing, debugging, content extraction)

### Use Cases

1. **Automated Testing**: Verify email delivery in CI/CD pipelines
2. **Workflow Validation**: Confirm notification systems are working correctly
3. **Link Extraction**: Pull verification links, password reset URLs, or confirmation codes
4. **SMTP Debugging**: View complete delivery logs and headers for troubleshooting
5. **Content Analysis**: Extract and analyze email content programmatically
6. **AI-Assisted Workflows**: Enable AI assistants to check emails and extract information

## MCP Server Integration

### MCP Tools

This server exposes two tools for active operations:

#### `list_inbox`
Lists all emails in a Mailinator inbox.

**Parameters:**
- `inbox_name` (required): Inbox to query (max 50 chars, alphanumeric with dots)
  - Supports wildcards: `*` (all inboxes) or `prefix*` (pattern match) with API token
- `domain` (optional): "public", "private", or custom domain (auto-detected if omitted)

**Returns:**
```json
{
  "inbox_name": "testuser",
  "domain": "public",
  "messages": [
    {
      "number": 1,
      "id": "testuser-1234567890-abc",
      "from": "noreply@example.com",
      "subject": "Welcome!",
      "time": 1770915725000,
      "seconds_ago": 120
    }
  ],
  "count": 1
}
```

#### `get_email`
Retrieves a specific email with optional formatting.

**Parameters:**
- `message_id` (required): Message ID from `list_inbox` results
- `domain` (optional): Domain (auto-detected from cache if omitted)
- `format` (optional): Output format (default: "text")
  - `summary`: Key fields only (from, to, subject, time, ID)
  - `text`: Formatted text with headers (default)
  - `textplain`: Plain text body only
  - `texthtml`: HTML body only
  - `full`: Complete email as JSON
  - `raw`: Raw MIME content
  - `headers`: SMTP headers as structured data
  - `smtplog`: Delivery timeline with SMTP transaction log
  - `links`: Array of URLs found in email
  - `linksfull`: URLs with anchor text

**Returns:** Email content in requested format (structure varies by format)

### MCP Resources

Read-only URI-based access for passive context:

- `mailinator://inbox/{domain}/{inbox_name}` - Inbox listing
- `mailinator://email/{domain}/{message_id}` - Email content

**Use Case:** AI assistants can reference these URIs as context without explicit tool calls.

### MCP Server Configuration

**Starting the Server:**
```bash
# Default (127.0.0.1:8080)
mailinator-cli --start-mcp-server

# Custom host/port
mailinator-cli --start-mcp-server --host=0.0.0.0 --port=3000

# With API token for private domains
export MAILINATOR_API_KEY=your_token_here
mailinator-cli --start-mcp-server
```

**Claude Desktop Integration:**

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mailinator": {
      "command": "node",
      "args": ["/path/to/mailinator-cli/bin/index.js", "--start-mcp-server"],
      "env": {
        "MAILINATOR_API_KEY": "your_token_here"
      }
    }
  }
}
```

Or connect to a running server:

```json
{
  "mcpServers": {
    "mailinator": {
      "url": "http://127.0.0.1:8080/mcp"
    }
  }
}
```

**Health Check Endpoint:** `GET http://127.0.0.1:8080/health`

## CLI Usage

### Installation

```bash
# Global installation
npm install -g mailinator-cli

# Or use with npx (no install)
npx mailinator-cli inbox test public
```

### Commands

**List Inbox:**
```bash
# Public domain (no authentication)
mailinator-cli inbox testuser public

# Private domain (requires API token)
mailinator-cli inbox myinbox private

# Wildcard search (requires API token)
mailinator-cli inbox test* private
```

**Retrieve Email:**
```bash
# By reference number (from inbox listing)
mailinator-cli email 1

# With specific format
mailinator-cli email 1 summary
mailinator-cli email 1 links
mailinator-cli email 2 smtplog

# By message ID directly
mailinator-cli email testuser-1234567890-abc text
```

**Verbose Mode:**
```bash
# Show HTTP requests/responses
mailinator-cli --verbose inbox testuser public
mailinator-cli -v email 1 full
```

## Authentication

### Optional API Token

Public domain (@mailinator.com) requires no authentication. For private/custom domains and advanced features (wildcards, SMTP logs), configure an API token:

**Get Token:** https://www.mailinator.com/v4/private/team_settings.jsp

**Configuration Options:**

1. **Environment Variable** (highest priority):
   ```bash
   export MAILINATOR_API_KEY=your_token_here
   ```

2. **Config File** (`~/.config/mailinator/config.json`):
   ```json
   {
     "apiKey": "your_token_here"
   }
   ```

3. **Environment File** (`.env`):
   ```
   MAILINATOR_API_KEY=your_token_here
   ```

## Example AI Prompts

When configured as an MCP server in Claude Desktop:

- "Check the testuser inbox for any emails"
- "What emails arrived in the last hour in joe@mailinator.com?"
- "Show me the first email in summary format"
- "Extract all links from that verification email"
- "Get the SMTP log for message ID xyz-123"
- "Are there any password reset emails for admin?"
- "Pull the confirmation code from the latest email"

## Requirements

- **Runtime:** Node.js ≥ 18.0.0
- **Internet Access:** Required for Mailinator API
- **API Token:** Optional (required for private domains and wildcards)

## Validation Rules

- **Inbox Names:** Max 50 chars, alphanumeric + dots, no leading/trailing dots
- **Wildcards:** Only `*` or `prefix*`, only in private domains, requires API token
- **Domains:** "public", "private", or valid custom domain names

## Error Handling

The tool provides clear error messages with exit codes:

- **Exit 0:** Success or non-fatal config warning
- **Exit 1:** Validation error (invalid input)
- **Exit 2:** API error (authentication, network, server)
- **Exit 3:** Cache error (run inbox command first)

## Performance & Caching

- **Inbox Cache:** Results stored at `~/.config/mailinator/inbox-cache.json`
- **Numbered References:** After listing an inbox, retrieve emails by number (1, 2, 3...)
- **Domain Auto-Detection:** No need to specify domain for cached emails
- **Cache Persistence:** Survives across CLI invocations until next inbox query

## API Endpoints

Uses Mailinator CLI API v3:

- **Base URL:** `https://api.mailinator.com/cli/v3`
- **Inbox:** `GET /domains/{domain}/inboxes/{inbox_name}`
- **Email:** `GET /domains/{domain}/messages/{message_id}?format={format}`
- **SMTP Log:** `GET /domains/{domain}/messages/{message_id}/smtplog`

## Tags

`email`, `testing`, `disposable-email`, `automation`, `cli`, `mcp`, `model-context-protocol`, `ai-integration`, `workflow`, `verification`, `smtp`, `debugging`, `mailinator`, `nodejs`

## Support

- **CLI Issues:** Open issue in repository
- **Mailinator API:** https://www.mailinator.com/support
- **API Documentation:** https://www.mailinator.com/documentation/docs/category/getting-started/index.html

## Links

- **Mailinator Service:** https://www.mailinator.com/
- **Model Context Protocol:** https://modelcontextprotocol.io/
- **Claude Desktop:** https://claude.ai/download
