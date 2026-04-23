import '@common/node/config';
import '@common/node/logger';
import assert from 'node:assert';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import express from 'express';

// ─── Dex test constants ───────────────────────────────────────────────────────

const DEX_URL = 'http://127.0.0.1:5556/dex';
const DEX_CLIENT_ID = 'test-client';
const DEX_CLIENT_SECRET = 'test-secret';
const DEX_USER_EMAIL = 'test@example.com';
const DEX_USER_PASSWORD = 'password';
const APP_PORT = 3001;
const APP_BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const OIDC_CALLBACK = `${APP_BASE_URL}/api/oidc/auth`;

// Override __config before module import — oidc.ts captures OIDC_OPTIONS at module load time
// biome-ignore lint/suspicious/noExplicitAny: test config override
(globalThis as any).__config = {
  // biome-ignore lint/suspicious/noExplicitAny: spreading frozen config object
  ...(globalThis as any).__config,
  AUTH_ERROR_URL: undefined,
  OIDC_OPTIONS: {
    URL: DEX_URL,
    CLIENT_ID: DEX_CLIENT_ID,
    CLIENT_SECRET: DEX_CLIENT_SECRET,
    CALLBACK: OIDC_CALLBACK,
    REISSUE: false,
  },
};

const { login, auth, refresh } = await import('@common/node/auth/controllers/oidc');

// ─── HTTP helper — makes a single request without following redirects ─────────

type HttpResponse = { status: number; headers: http.IncomingHttpHeaders; body: string };

function httpGet(url: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname, search } = new URL(url);
    http
      .get({ hostname, port: Number(port) || 80, path: pathname + search }, res => {
        let body = '';
        res.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      })
      .on('error', reject);
  });
}

function httpPost(url: string, body: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname, search } = new URL(url);
    const buf = Buffer.from(body);
    const req = http.request(
      {
        hostname,
        port: Number(port) || 80,
        path: pathname + search,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': buf.length },
      },
      res => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: data }));
      },
    );
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

// ─── Dex helpers ──────────────────────────────────────────────────────────────

// Follow GET redirects until a non-redirect response is received
async function followGet(url: string, depth = 0): Promise<HttpResponse> {
  if (depth > 8) throw new Error(`Too many redirects from ${url}`);
  const res = await httpGet(url);
  if ((res.status === 301 || res.status === 302 || res.status === 303) && res.headers.location) {
    return followGet(new URL(res.headers.location as string, url).toString(), depth + 1);
  }
  return res;
}

async function getDexAuthCode(): Promise<string> {
  // Step 1: follow all redirects from auth endpoint to reach the actual login form
  // Dex v2.38: /dex/auth?... → /dex/auth/local?... → /dex/auth/local/login?back=&state=XXX
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: DEX_CLIENT_ID,
    redirect_uri: OIDC_CALLBACK,
    scope: 'openid profile email offline_access',
    state: 'test',
  });
  const loginFormRes = await followGet(`${DEX_URL}/auth?${params}`);
  if (!loginFormRes.body.includes('<form')) throw new Error(`Dex login form not found — is Dex running at ${DEX_URL}?`);

  // Step 2: extract form action — state is in query string, HTML-encoded (&amp; → &)
  const rawAction = loginFormRes.body.match(/<form[^>]*action=["']([^"']+)["']/i)?.[1] ?? '';
  if (!rawAction) throw new Error('Could not extract form action from Dex login page');
  const postUrl = new URL(rawAction.replace(/&amp;/g, '&'), 'http://127.0.0.1:5556').toString();

  // Step 3: POST credentials — Dex redirects to OIDC_CALLBACK with ?code=...
  const loginRes = await httpPost(
    postUrl,
    new URLSearchParams({ login: DEX_USER_EMAIL, password: DEX_USER_PASSWORD }).toString(),
  );
  const callbackUrl = loginRes.headers.location as string;
  if (!callbackUrl) throw new Error('Dex did not redirect after login');

  const code = new URL(callbackUrl).searchParams.get('code');
  if (!code) throw new Error(`Missing auth code in Dex callback: ${callbackUrl}`);
  return code;
}

async function getDexTokens(): Promise<{ access_token: string; refresh_token: string }> {
  const code = await getDexAuthCode();
  const res = await httpPost(
    `${DEX_URL}/token`,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: OIDC_CALLBACK,
      client_id: DEX_CLIENT_ID,
      client_secret: DEX_CLIENT_SECRET,
    }).toString(),
  );
  return JSON.parse(res.body);
}

// ─── Test app lifecycle ───────────────────────────────────────────────────────

let server: http.Server;

before(async () => {
  // Verify Dex is reachable before running any tests
  try {
    const res = await httpGet(`${DEX_URL}/.well-known/openid-configuration`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    throw new Error(
      `Dex is not reachable at ${DEX_URL}.\n` +
        `Start it with: docker compose -f docker/dex/docker-compose.yml up -d\n` +
        `Original error: ${(err as Error).message}`,
    );
  }

  const app = express();
  app.get('/api/oidc/login', login);
  app.get('/api/oidc/auth', auth);
  app.get('/api/oidc/refresh', refresh);

  await new Promise<void>(resolve => {
    server = app.listen(APP_PORT, '127.0.0.1', () => resolve());
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(err => (err ? reject(err) : resolve()));
  });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe.only('OIDC — GET /api/oidc/login', () => {
  it.only('redirects to Dex authorization endpoint with correct params', async () => {
    const { status, headers } = await httpGet(`${APP_BASE_URL}/api/oidc/login`);
    assert.strictEqual(status, 302);
    const location = (headers.location as string) ?? '';
    assert.ok(location.startsWith(`${DEX_URL}/auth`), `Expected Dex auth redirect, got: ${location}`);
    assert.ok(location.includes(`client_id=${DEX_CLIENT_ID}`));
    assert.ok(location.includes('response_type=code'));
  });
});

describe.only('OIDC — GET /api/oidc/auth', () => {
  it.only('redirects to callback with tokens when authorization code is valid', async () => {
    const code = await getDexAuthCode();
    const { status, headers } = await httpGet(`${APP_BASE_URL}/api/oidc/auth?code=${code}`);
    assert.strictEqual(status, 302);
    const location = (headers.location as string) ?? '';
    assert.ok(location.startsWith(OIDC_CALLBACK), `Expected callback redirect, got: ${location}`);
    assert.ok(location.includes('#'), 'Expected token hash fragment in redirect URL');
  });
});

describe.only('OIDC — GET /api/oidc/refresh', () => {
  it.only('returns new access_token and refresh_token when refresh token is valid', async () => {
    const { refresh_token } = await getDexTokens();
    const { status, body } = await httpGet(
      `${APP_BASE_URL}/api/oidc/refresh?refresh_token=${encodeURIComponent(refresh_token)}`,
    );
    assert.strictEqual(status, 200);
    const tokens = JSON.parse(body) as { access_token: string; refresh_token: string };
    assert.ok(tokens.access_token, 'Response should contain access_token');
    assert.ok(tokens.refresh_token, 'Response should contain refresh_token');
  });
});
