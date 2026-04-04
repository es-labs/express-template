// websocket.js
// ─── Start ────────────────────────────────────────────────────────────────────
// console.log('  ws://localhost:3000/ws/chat?token=user-token-abc');
// console.log('  ws://localhost:3000/ws/notif?token=user-token-abc');
// console.log('  ws://localhost:3000/ws/admin?token=admin-token-xyz');

import { WebSocketServer } from 'ws';

// import url from "url";
// server.on('upgrade', (request, socket, head) => {
//   console.log('upgrade event')
//   const pathname = url.parse(request.url).pathname // if (pathname === '/some-match') { }
// })

// ─── Auth helpers ─────────────────────────────────────────────────────────────
async function requireUser(req) {
  const params = new URLSearchParams(req.url.split('?')[1]);
  const token = params.get('token');
  if (!token) throw new Error('No token');

  const user = await verifyToken(token); // your JWT/session check
  if (!user) throw new Error('Invalid token');
  return user;
}

async function requireAdmin(req) {
  const user = await requireUser(req);
  if (user.role !== 'admin') throw new Error('Insufficient role');
  return user;
}

// ─── Reject a socket before any WS handshake ─────────────────────────────────
function rejectSocket(socket, code, message) {
  socket.write(
    `HTTP/1.1 ${code} ${message}\r\n` +
      `Content-Type: text/plain\r\n` +
      `Connection: close\r\n` +
      `\r\n` +
      `${message}`,
  );
  socket.destroy();
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function broadcast(wss, payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

function safeParseJSON(raw) {
  try {
    return JSON.parse(raw.toString());
  } catch {
    return null;
  }
}

const MAX_BYTES = 64 * 1024; // 64 KB

function safeParseJSON2(raw, { maxBytes = MAX_BYTES } = {}) {
  // Size guard before any parsing
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (buf.length > maxBytes) {
    return { ok: false, error: 'PAYLOAD_TOO_LARGE', value: null };
  }

  try {
    const value = JSON.parse(buf.toString('utf8'));
    return { ok: true, error: null, value };
  } catch (err) {
    return { ok: false, error: 'INVALID_JSON', value: null };
  }
}

function error(message) {
  return JSON.stringify({ type: 'error', message });
}

function getServerStats() {
  return {
    chat: chatWSS.clients.size,
    notif: notifWSS.clients.size,
    admin: adminWSS.clients.size,
    uptime: process.uptime(),
  };
}

async function verifyToken(token) {
  // Replace with real JWT verification, e.g. jose or jsonwebtoken
  const users = {
    'user-token-abc': { id: 1, name: 'Alice', role: 'user' },
    'admin-token-xyz': { id: 2, name: 'Bob', role: 'admin' },
  };
  return users[token] ?? null;
}

// Push a notification to a specific user on the notif WSS
export function pushToUser(userId, payload) {
  const data = JSON.stringify(payload);
  for (const client of notifWSS.clients) {
    if (client.userId === userId && client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

export default function wsLoader(server) {
  // ─── Multiple WSS instances on the same HTTP server ──────────────────────────
  const chatWSS = new WebSocketServer({ noServer: true });
  const notifWSS = new WebSocketServer({ noServer: true });
  const adminWSS = new WebSocketServer({ noServer: true });

  // ─── Route map ───────────────────────────────────────────────────────────────
  const wsRoutes = [
    { prefix: '/ws/chat', wss: chatWSS, auth: requireUser },
    { prefix: '/ws/notif', wss: notifWSS, auth: requireUser },
    { prefix: '/ws/admin', wss: adminWSS, auth: requireAdmin },
  ];

  // ─── Manual upgrade handler ──────────────────────────────────────────────────
  server.on('upgrade', async (req, socket, head) => {
    // Reject non-WebSocket upgrades immediately
    if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
      return rejectSocket(socket, 400, 'Bad Request');
    }

    // Find a matching route
    const route = wsRoutes.find(r => req.url.startsWith(r.prefix));
    if (!route) {
      return rejectSocket(socket, 404, 'Not Found');
    }

    // Run auth before the handshake completes
    let context;
    try {
      context = await route.auth(req);
    } catch (err) {
      console.warn(`[upgrade] auth failed: ${err.message}`);
      return rejectSocket(socket, 401, 'Unauthorized');
    }

    // Attach auth result so the 'connection' handler can use it
    req.user = context;

    // Complete the WebSocket handshake and emit 'connection'
    route.wss.handleUpgrade(req, socket, head, ws => {
      route.wss.emit('connection', ws, req);
    });
  });

  // ─── Per-WSS connection logic ─────────────────────────────────────────────────
  chatWSS.on('connection', (ws, req) => {
    const { user } = req;
    console.log(`[chat] connected: ${user.name}`);
    ws.send(JSON.stringify({ type: 'welcome', room: 'chat', user: user.name }));
    ws.on('message', data => {
      const msg = safeParseJSON(data);
      if (!msg) return ws.send(error('Invalid JSON'));
      broadcast(chatWSS, { type: 'message', from: user.name, text: msg.text }); // Broadcast to all connected chat clients
    });
    ws.on('close', () => console.log(`[chat] disconnected: ${user.name}`));
    ws.on('error', err => console.error(`[chat] error:`, err.message));
  });

  notifWSS.on('connection', (ws, req) => {
    const { user } = req;
    console.log(`[notif] connected: ${user.name}`);
    ws.userId = user.id; // Tag socket with user id for targeted pushes
    ws.send(JSON.stringify({ type: 'welcome', room: 'notif' }));
    ws.on('error', err => console.error(`[notif] error:`, err.message));
  });

  adminWSS.on('connection', (ws, req) => {
    const { user } = req;
    console.log(`[admin] connected: ${user.name} (role=${user.role})`);
    ws.send(JSON.stringify({ type: 'stats', data: getServerStats() })); // Send current server stats on connect
    ws.on('error', err => console.error(`[admin] error:`, err.message));
  });
}
