import '@common/node/config';
import '@common/node/logger';
import assert from 'node:assert';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import express from 'express';

// ─── Constants ────────────────────────────────────────────────────────────────

const IDP_URL = 'http://127.0.0.1:8080/simplesaml';
const SP_ENTITY_ID = 'http://127.0.0.1:3001/saml';
const SP_CALLBACK = 'http://127.0.0.1:3001/api/saml/callback';
const APP_PORT = 3001;
const APP_BASE_URL = `http://127.0.0.1:${APP_PORT}`;
const IDP_USER = 'testuser';
const IDP_PASSWORD = 'password';

// ─── HTTP helper ──────────────────────────────────────────────────────────────

type HttpResponse = { status: number; headers: http.IncomingHttpHeaders; body: string };

function httpRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname, search } = new URL(url);
    const bodyBuf = options.body ? Buffer.from(options.body) : null;
    const req = http.request(
      {
        hostname,
        port: Number(port) || 80,
        path: pathname + search,
        method: options.method ?? 'GET',
        headers: { ...options.headers, ...(bodyBuf ? { 'Content-Length': bodyBuf.length } : {}) },
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
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

// ─── SAML session — maintains cookies and follows redirects ───────────────────

class SamlSession {
  private readonly jar = new Map<string, string>();
  lastUrl = '';

  private update(headers: http.IncomingHttpHeaders): void {
    for (const cookie of headers['set-cookie'] ?? []) {
      const [pair] = cookie.split(';');
      const eq = pair.indexOf('=');
      if (eq !== -1) this.jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }

  private cookieHeader(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async get(url: string): Promise<HttpResponse> {
    const headers: Record<string, string> = {};
    if (this.jar.size) headers.Cookie = this.cookieHeader();
    const res = await httpRequest(url, { headers });
    this.update(res.headers);
    return res;
  }

  async post(url: string, body: string): Promise<HttpResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (this.jar.size) headers.Cookie = this.cookieHeader();
    const res = await httpRequest(url, { method: 'POST', headers, body });
    this.update(res.headers);
    return res;
  }

  // Follow GET redirects transparently, maintaining cookies; sets lastUrl to the final URL
  async follow(url: string, depth = 0): Promise<HttpResponse> {
    if (depth > 8) throw new Error(`Too many redirects from ${url}`);
    const res = await this.get(url);
    if ((res.status === 301 || res.status === 302 || res.status === 303) && res.headers.location) {
      return this.follow(new URL(res.headers.location as string, url).toString(), depth + 1);
    }
    this.lastUrl = url;
    return res;
  }

  // POST then follow any redirect as GET
  async followPost(url: string, body: string, base: string): Promise<HttpResponse> {
    const res = await this.post(url, body);
    if ((res.status === 301 || res.status === 302 || res.status === 303) && res.headers.location) {
      return this.follow(new URL(res.headers.location as string, base).toString());
    }
    this.lastUrl = url;
    return res;
  }
}

// ─── HTML form field helpers ──────────────────────────────────────────────────

function extractFormField(html: string, name: string): string {
  // Match both attribute orderings: name=... value=... and value=... name=...
  const r1 = new RegExp(`name=["']${name}["'][^>]*value=["']([^"']*?)["']`, 'i');
  const r2 = new RegExp(`value=["']([^"']*?)["'][^>]*name=["']${name}["']`, 'i');
  return (html.match(r1) ?? html.match(r2))?.[1] ?? '';
}

function extractFormAction(html: string): string {
  return html.match(/<form[^>]*action=["']([^"']+)["']/i)?.[1] ?? '';
}

// ─── IdP cert — fetched from SimpleSAMLphp metadata (top-level await) ────────
// Fails early with a clear message if SimpleSAMLphp is not running.

async function fetchIdpCert(metadataUrl: string): Promise<string> {
  const res = await httpRequest(metadataUrl);
  if (res.status !== 200)
    throw new Error(
      `SimpleSAMLphp metadata unavailable: HTTP ${res.status}.\n` +
        'Start it with: docker compose -f docker/saml/docker-compose.yml up -d',
    );
  const match = res.body.match(/<ds:X509Certificate>([^<]+)<\/ds:X509Certificate>/);
  if (!match) throw new Error('Could not extract IdP certificate from SAML metadata XML');
  const lines = match[1].replace(/\s/g, '').match(/.{1,64}/g) ?? [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

const idpCert = await fetchIdpCert(`${IDP_URL}/saml2/idp/metadata.php`);

// Override __config before module import — saml.ts captures SAML_OPTIONS at module load time
// biome-ignore lint/suspicious/noExplicitAny: test config override
(globalThis as any).__config = {
  // biome-ignore lint/suspicious/noExplicitAny: spreading frozen config object
  ...(globalThis as any).__config,
  AUTH_ERROR_URL: undefined,
  SAML_OPTIONS: {
    entryPoint: `${IDP_URL}/saml2/idp/SSOService.php`,
    issuer: SP_ENTITY_ID,
    callbackUrl: SP_CALLBACK,
    idpCert,
    wantAssertionsSigned: true,
    disableRequestedAuthnContext: true,
  },
  SAML_JWT_MAP: { id: 'uid', groups: 'eduPersonAffiliation' },
};

const { login, auth } = await import('@common/node/auth/controllers/saml');

// ─── Simulate the full SAML browser login flow ────────────────────────────────
// Returns the HTML body of the IdP's auto-submit form containing the SAMLResponse.

async function getSamlResponseHtml(relayState = ''): Promise<string> {
  const session = new SamlSession();

  // Step 1: GET SP login — app redirects to IdP SSO URL (don't follow here)
  const qs = relayState ? `?RelayState=${encodeURIComponent(relayState)}` : '';
  const spLoginRes = await httpRequest(`${APP_BASE_URL}/api/saml/login${qs}`);
  const idpSsoUrl = spLoginRes.headers.location as string;
  if (!idpSsoUrl) throw new Error('SP /api/saml/login did not redirect to IdP');

  // Step 2: Follow IdP SSO URL — redirects through to the login form page
  const loginFormRes = await session.follow(idpSsoUrl);
  const formAction = extractFormAction(loginFormRes.body);
  const authState = extractFormField(loginFormRes.body, 'AuthState');
  if (!formAction || !authState) throw new Error('Could not locate login form fields in IdP response');

  // Step 3: POST credentials — resolve form action relative to the login page URL (may be "?")
  const formUrl = new URL(formAction, session.lastUrl).toString();
  const samlFormRes = await session.followPost(
    formUrl,
    new URLSearchParams({ username: IDP_USER, password: IDP_PASSWORD, AuthState: authState }).toString(),
    session.lastUrl,
  );
  return samlFormRes.body;
}

// ─── Test app lifecycle ───────────────────────────────────────────────────────

let server: http.Server;

before(async () => {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.get('/api/saml/login', login);
  app.post('/api/saml/callback', auth);

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

describe.only('SAML — GET /api/saml/login', () => {
  it.only('redirects to SimpleSAMLphp IdP SSO endpoint with SAMLRequest', async () => {
    const { status, headers } = await httpRequest(`${APP_BASE_URL}/api/saml/login`);
    assert.strictEqual(status, 302);
    const location = (headers.location as string) ?? '';
    assert.ok(
      location.startsWith(`${IDP_URL}/saml2/idp/SSOService.php`),
      `Expected IdP SSO redirect, got: ${location}`,
    );
    assert.ok(location.includes('SAMLRequest='), 'Expected SAMLRequest param in redirect URL');
  });
});

describe.only('SAML — POST /api/saml/callback', () => {
  it.only('returns authenticated user data when SAMLResponse is valid and RelayState is absent', async () => {
    const samlFormHtml = await getSamlResponseHtml();
    const samlResponse = extractFormField(samlFormHtml, 'SAMLResponse');
    assert.ok(samlResponse, 'Expected SAMLResponse hidden input in IdP auto-submit form');

    const { status, body } = await httpRequest(`${APP_BASE_URL}/api/saml/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ SAMLResponse: samlResponse }).toString(),
    });
    assert.strictEqual(status, 200);
    const data = JSON.parse(body) as { authenticated: boolean; user: { sub: unknown; roles: unknown } };
    assert.strictEqual(data.authenticated, true);
    assert.ok(data.user, 'Response should contain user object');
  });
});
