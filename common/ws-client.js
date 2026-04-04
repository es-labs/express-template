// client.js — test all three endpoints
import WebSocket from 'ws';

function connect(path, token, label) {
  const ws = new WebSocket(`ws://localhost:3000${path}?token=${token}`);
  ws.on('open', () => console.log(`[${label}] open`));
  ws.on('message', d => console.log(`[${label}]`, JSON.parse(d)));
  ws.on('close', code => console.log(`[${label}] closed`, code));
  ws.on('error', err => console.error(`[${label}] error`, err.message));
  return ws;
}

const chat = connect('/ws/chat', 'user-token-abc', 'chat');
const notif = connect('/ws/notif', 'user-token-abc', 'notif');
const admin = connect('/ws/admin', 'admin-token-xyz', 'admin');

// Send a chat message after connecting
chat.on('open', () => {
  chat.send(JSON.stringify({ type: 'message', text: 'Hello everyone!' }));
});

// Test a rejected connection (wrong token)
setTimeout(() => {
  connect('/ws/admin', 'user-token-abc', 'admin-REJECTED');
}, 500);
