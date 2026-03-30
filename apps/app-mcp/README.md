node server.js
# MCP server running at http://localhost:3000/mcp




npx @modelcontextprotocol/inspector
```

Then open it in your browser, select **Streamable HTTP** as transport type, and enter:
```
http://localhost:3000/mcp




## test with curl

```bash
# 1. Initialize — grab the Mcp-Session-Id from the response headers
curl -si -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"initialize",
    "params":{
      "protocolVersion":"2025-03-26",
      "clientInfo":{"name":"curl-client","version":"1.0"},
      "capabilities":{}
    }
  }'

# 2. List tools (replace SESSION_ID with the value from above)
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: SESSION_ID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# 3. Call the add tool
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: SESSION_ID" \
  -d '{
    "jsonrpc":"2.0","id":3,"method":"tools/call",
    "params":{"name":"add","arguments":{"a":7,"b":5}}
  }'
```

## test with claud desktop

Add this to your Claude Desktop config (~/Library/Application Support/Claude/claude_desktop_config.json):

```json
{
  "mcpServers": {
    "my-remote-server": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/mcp"]
    }
  }
}
```

mcp-remote is a lightweight bridge that lets Claude Desktop (stdio-based) talk to a remote Streamable HTTP server.

## Stateless Mode

Stateless Mode (for Serverless / Production)
If you don't need session state, swap to a simpler stateless version:

```js
// Stateless: one fresh server+transport per request, no session tracking
app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // disables sessions
  });
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  await server.close();
});

app.get("/mcp", (req, res) => res.status(405).send("Use POST"));
app.delete("/mcp", (req, res) => res.status(405).send("Use POST"));
```