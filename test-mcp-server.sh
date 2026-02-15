#!/bin/bash

# MCP Server Test Script
# Tests all MCP endpoints and verifies responses

# Check for jq
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed."
    echo "Please install jq: sudo apt-get install jq (Debian/Ubuntu) or brew install jq (macOS)"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default MCP server URL
MCP_URL="${1:-http://localhost:8080/mcp}"
HEALTH_URL="${MCP_URL%/mcp}/health"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test header
print_test() {
    echo -e "\n${BLUE}[TEST $((TESTS_RUN + 1))]${NC} $1"
}

# Helper function to print success
print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_RUN++))
}

# Helper function to print failure
print_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_RUN++))
}

# Helper function to print verbose error with response
print_fail_verbose() {
    local message="$1"
    local response="$2"
    echo -e "${RED}✗ FAIL:${NC} $message"
    if [ -n "$response" ]; then
        echo -e "${YELLOW}Response:${NC} ${response:0:500}"
    fi
    ((TESTS_FAILED++))
    ((TESTS_RUN++))
}

# Helper function to validate JSON
validate_json() {
    local json="$1"
    if echo "$json" | jq empty 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Helper function to make MCP request
make_mcp_request() {
    local method="$1"
    local params="$2"
    local request_id=$((RANDOM))

    if [ -z "$params" ]; then
        params="{}"
    fi

    curl -s -X POST "$MCP_URL" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -d "{\"jsonrpc\":\"2.0\",\"id\":$request_id,\"method\":\"$method\",\"params\":$params}"
}

echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}    MCP Server Test Suite${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "Testing server at: ${BLUE}$MCP_URL${NC}"
echo -e "Health check at:   ${BLUE}$HEALTH_URL${NC}"

# Test 1: Health Check
print_test "Health Check Endpoint"
HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
if validate_json "$HEALTH_RESPONSE"; then
    STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null)
    if [ "$STATUS" = "ok" ]; then
        print_success "Health check passed - server is running"
    else
        print_fail "Health check returned unexpected status: $STATUS"
    fi
else
    print_fail "Health check returned invalid JSON"
fi

# Test 2: Initialize
print_test "MCP Initialize"
INIT_RESPONSE=$(make_mcp_request "initialize" '{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}')
if validate_json "$INIT_RESPONSE"; then
    SERVER_NAME=$(echo "$INIT_RESPONSE" | jq -r '.result.serverInfo.name' 2>/dev/null)
    SERVER_VERSION=$(echo "$INIT_RESPONSE" | jq -r '.result.serverInfo.version' 2>/dev/null)
    INSTRUCTIONS=$(echo "$INIT_RESPONSE" | jq -r '.result.instructions // empty' 2>/dev/null)

    if [ -n "$SERVER_NAME" ] && [ -n "$SERVER_VERSION" ]; then
        print_success "Initialize succeeded - Server: $SERVER_NAME v$SERVER_VERSION"
        if [ -n "$INSTRUCTIONS" ]; then
            echo -e "  ${BLUE}Instructions:${NC} ${INSTRUCTIONS:0:100}..."
        fi
    else
        print_fail_verbose "Initialize returned incomplete server info" "$INIT_RESPONSE"
    fi
else
    print_fail_verbose "Initialize returned invalid JSON" "$INIT_RESPONSE"
fi

# Test 3: Ping
print_test "MCP Ping"
PING_RESPONSE=$(make_mcp_request "ping" "{}")
if validate_json "$PING_RESPONSE"; then
    ERROR=$(echo "$PING_RESPONSE" | jq -r '.error // empty' 2>/dev/null)
    if [ -z "$ERROR" ]; then
        print_success "Ping succeeded"
    else
        print_fail "Ping returned error: $ERROR"
    fi
else
    print_fail "Ping returned invalid JSON"
fi

# Test 4: List Tools
print_test "List Tools (tools/list)"
TOOLS_RESPONSE=$(make_mcp_request "tools/list" "{}")
if validate_json "$TOOLS_RESPONSE"; then
    TOOLS_COUNT=$(echo "$TOOLS_RESPONSE" | jq '.result.tools | length' 2>/dev/null)
    TOOL_NAMES=$(echo "$TOOLS_RESPONSE" | jq -r '.result.tools[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

    if [ "$TOOLS_COUNT" -gt 0 ]; then
        print_success "Found $TOOLS_COUNT tools: $TOOL_NAMES"
    else
        print_fail_verbose "No tools found in response" "$TOOLS_RESPONSE"
    fi
else
    print_fail_verbose "tools/list returned invalid JSON" "$TOOLS_RESPONSE"
fi

# Test 5: List Resource Templates
print_test "List Resource Templates (resources/templates/list)"
RESOURCES_RESPONSE=$(make_mcp_request "resources/templates/list" "{}")
if validate_json "$RESOURCES_RESPONSE"; then
    RESOURCES_COUNT=$(echo "$RESOURCES_RESPONSE" | jq '.result.resourceTemplates | length' 2>/dev/null)
    RESOURCE_NAMES=$(echo "$RESOURCES_RESPONSE" | jq -r '.result.resourceTemplates[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')

    if [ "$RESOURCES_COUNT" -gt 0 ]; then
        print_success "Found $RESOURCES_COUNT resource templates: $RESOURCE_NAMES"
    else
        print_fail_verbose "No resource templates found" "$RESOURCES_RESPONSE"
    fi
else
    print_fail_verbose "resources/templates/list returned invalid JSON" "$RESOURCES_RESPONSE"
fi

# Test 6: Call list_inbox Tool
print_test "Call list_inbox Tool (tools/call)"
INBOX_PARAMS='{"name":"list_inbox","arguments":{"inbox_name":"testuser","domain":"public"}}'
LIST_INBOX_RESPONSE=$(make_mcp_request "tools/call" "$INBOX_PARAMS")

if validate_json "$LIST_INBOX_RESPONSE"; then
    IS_ERROR=$(echo "$LIST_INBOX_RESPONSE" | jq -r '.result.isError // false' 2>/dev/null)

    if [ "$IS_ERROR" = "false" ]; then
        # Extract the JSON content from the text field
        EMAIL_COUNT=$(echo "$LIST_INBOX_RESPONSE" | jq -r '.result.content[0].text' 2>/dev/null | jq '.count' 2>/dev/null)

        if [ -n "$EMAIL_COUNT" ] && [ "$EMAIL_COUNT" -ge 0 ]; then
            print_success "list_inbox succeeded - Found $EMAIL_COUNT emails in testuser@public"

            # Store first message ID for next test
            FIRST_MESSAGE_ID=$(echo "$LIST_INBOX_RESPONSE" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.messages[0].id // empty' 2>/dev/null)
            if [ -n "$FIRST_MESSAGE_ID" ]; then
                echo -e "  ${BLUE}First message ID:${NC} $FIRST_MESSAGE_ID"
            fi
        else
            print_fail_verbose "list_inbox returned unexpected data structure" "$LIST_INBOX_RESPONSE"
        fi
    else
        ERROR_MSG=$(echo "$LIST_INBOX_RESPONSE" | jq -r '.result.content[0].text' 2>/dev/null)
        print_fail_verbose "list_inbox returned error: $ERROR_MSG" "$LIST_INBOX_RESPONSE"
    fi
else
    print_fail_verbose "tools/call for list_inbox returned invalid JSON" "$LIST_INBOX_RESPONSE"
fi

# Test 7: Call get_email Tool (if we have a message ID)
print_test "Call get_email Tool (tools/call)"
if [ -n "$FIRST_MESSAGE_ID" ]; then
    EMAIL_PARAMS="{\"name\":\"get_email\",\"arguments\":{\"message_id\":\"$FIRST_MESSAGE_ID\",\"domain\":\"public\",\"format\":\"summary\"}}"
    GET_EMAIL_RESPONSE=$(make_mcp_request "tools/call" "$EMAIL_PARAMS")

    if validate_json "$GET_EMAIL_RESPONSE"; then
        IS_ERROR=$(echo "$GET_EMAIL_RESPONSE" | jq -r '.result.isError // false' 2>/dev/null)

        if [ "$IS_ERROR" = "false" ]; then
            SUBJECT=$(echo "$GET_EMAIL_RESPONSE" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.subject // empty' 2>/dev/null)
            FROM=$(echo "$GET_EMAIL_RESPONSE" | jq -r '.result.content[0].text' 2>/dev/null | jq -r '.from // empty' 2>/dev/null)

            if [ -n "$SUBJECT" ]; then
                print_success "get_email succeeded"
                echo -e "  ${BLUE}From:${NC} $FROM"
                echo -e "  ${BLUE}Subject:${NC} ${SUBJECT:0:60}..."
            else
                print_fail "get_email returned unexpected data structure"
            fi
        else
            ERROR_MSG=$(echo "$GET_EMAIL_RESPONSE" | jq -r '.result.content[0].text' 2>/dev/null)
            print_fail "get_email returned error: $ERROR_MSG"
        fi
    else
        print_fail "tools/call for get_email returned invalid JSON"
    fi
else
    print_fail "Skipped - no message ID available from previous test"
fi

# Test 8: Read Inbox Resource
print_test "Read Inbox Resource (resources/read)"
RESOURCE_URI="mailinator://inbox/public/testuser"
RESOURCE_PARAMS="{\"uri\":\"$RESOURCE_URI\"}"
READ_RESOURCE_RESPONSE=$(make_mcp_request "resources/read" "$RESOURCE_PARAMS")

if validate_json "$READ_RESOURCE_RESPONSE"; then
    CONTENTS=$(echo "$READ_RESOURCE_RESPONSE" | jq -r '.result.contents[0].text' 2>/dev/null)

    if [ -n "$CONTENTS" ]; then
        RESOURCE_COUNT=$(echo "$CONTENTS" | jq '.count' 2>/dev/null)
        if [ -n "$RESOURCE_COUNT" ]; then
            print_success "Read inbox resource succeeded - $RESOURCE_COUNT emails"
        else
            print_fail_verbose "Resource read returned unexpected data structure" "$READ_RESOURCE_RESPONSE"
        fi
    else
        ERROR=$(echo "$READ_RESOURCE_RESPONSE" | jq -r '.error.message // empty' 2>/dev/null)
        if [ -n "$ERROR" ]; then
            print_fail_verbose "Resource read returned error: $ERROR" "$READ_RESOURCE_RESPONSE"
        else
            print_fail_verbose "Resource read returned empty contents" "$READ_RESOURCE_RESPONSE"
        fi
    fi
else
    print_fail_verbose "resources/read returned invalid JSON" "$READ_RESOURCE_RESPONSE"
fi

# Test 9: Invalid Method
print_test "Invalid Method Handling"
INVALID_RESPONSE=$(make_mcp_request "invalid/method" "{}")
if validate_json "$INVALID_RESPONSE"; then
    ERROR_CODE=$(echo "$INVALID_RESPONSE" | jq -r '.error.code // empty' 2>/dev/null)

    if [ "$ERROR_CODE" = "-32601" ]; then
        print_success "Invalid method correctly rejected with error code -32601"
    else
        print_fail_verbose "Invalid method not properly handled (expected error code -32601, got: $ERROR_CODE)" "$INVALID_RESPONSE"
    fi
else
    print_fail_verbose "Invalid method returned invalid JSON" "$INVALID_RESPONSE"
fi

# Test 10: Tool with Invalid Parameters
print_test "Tool with Invalid Parameters"
BAD_PARAMS='{"name":"list_inbox","arguments":{"inbox_name":""}}'
BAD_TOOL_RESPONSE=$(make_mcp_request "tools/call" "$BAD_PARAMS")

if validate_json "$BAD_TOOL_RESPONSE"; then
    IS_ERROR=$(echo "$BAD_TOOL_RESPONSE" | jq -r '.result.isError // false' 2>/dev/null)

    if [ "$IS_ERROR" = "true" ]; then
        print_success "Invalid parameters correctly rejected"
    else
        print_fail_verbose "Invalid parameters were not rejected" "$BAD_TOOL_RESPONSE"
    fi
else
    print_fail_verbose "Invalid parameter test returned invalid JSON" "$BAD_TOOL_RESPONSE"
fi

# Summary
echo -e "\n${YELLOW}================================================${NC}"
echo -e "${YELLOW}    Test Summary${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "Total tests run:    ${BLUE}$TESTS_RUN${NC}"
echo -e "Tests passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed:       ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}\n"
    exit 1
fi
