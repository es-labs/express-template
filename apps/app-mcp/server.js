import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Store active transports keyed by session ID
const transports = new Map();

// Factory: create a fresh McpServer with all tools registered
function createMcpServer() {
  const server = new McpServer({
    name: 'my-remote-server',
    version: '1.0.0',
  });

  // --- Tool: add ---
  server.tool('add', 'Add two numbers', { a: z.number(), b: z.number() }, async ({ a, b }) => ({
    content: [{ type: 'text', text: String(a + b) }],
  }));

  // --- Tool: greet ---
  server.tool('greet', 'Return a greeting', { name: z.string() }, async ({ name }) => ({
    content: [{ type: 'text', text: `Hello, ${name}! 👋` }],
  }));

  // --- Tool: random ---
  server.tool(
    'random',
    'Return a random number between min and max',
    { min: z.number(), max: z.number() },
    async ({ min, max }) => ({
      content: [
        {
          type: 'text',
          text: String(Math.floor(Math.random() * (max - min + 1)) + min),
        },
      ],
    }),
  );

  // --- Resource ---
  server.resource('server-info', 'info://server', { mimeType: 'text/plain' }, async () => ({
    contents: [
      {
        uri: 'info://server',
        text: 'My Remote MCP Server v1.0 — Streamable HTTP',
      },
    ],
  }));

  return server;
}

// ─── MCP Endpoint ──────────────────────────────────────────────────────────

// POST /mcp — handle all client messages
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && transports.has(sessionId)) {
    // Reuse existing session
    transport = transports.get(sessionId);
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New session — create transport + server
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: id => {
        transports.set(id, transport);
        // console.log(`[session] created: ${id}`);
      },
    });

    transport.onclose = () => {
      const id = transport.sessionId;
      transports.delete(id);
      // console.log(`[session] closed: ${id}`);
    };

    const server = createMcpServer();
    await server.connect(transport);
  } else {
    res.status(400).json({ error: 'Missing or invalid session' });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// GET /mcp — open SSE stream for server-to-client notifications
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const transport = transports.get(sessionId);

  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  await transport.handleRequest(req, res);
});

// DELETE /mcp — terminate a session
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const transport = transports.get(sessionId);

  if (!transport) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  await transport.handleRequest(req, res);
});

// ─── Start ─────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // console.log(`MCP server running at http://localhost:${PORT}/mcp`);
});
