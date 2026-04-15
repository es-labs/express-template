import { exportJWK, importSPKI } from 'jose';
import jwt from 'jsonwebtoken';
import keyStore from './keystore.js';

// JWKS endpoint /.well-known/jwks.json
const jwksHandler = async (req, res) => {
  const publicKeyPem = keyStore.getPublicKey();
  const kid = keyStore.getKid();

  // convert PEM → JWK format using jose
  const cryptoKey = await importSPKI(publicKeyPem, 'ES256');
  const jwk = await exportJWK(cryptoKey);

  res.json({
    keys: [
      {
        ...jwk,
        kid,
        use: 'sig', // sig = signing key
        alg: 'ES256',
      },
    ],
  });
};

// ── issue token ────────────────────────────────────
// /auth/token
const issueToken = (req, res) => {
  const token = jwt.sign({ sub: req.body.userId, roles: req.body.roles }, keyStore.getPrivateKey(), {
    algorithm: 'ES256',
    expiresIn: '1h',
    issuer: 'https://auth.myapp.com',
    audience: 'https://api.myapp.com',
    keyid: keyStore.getKid(), // embeds kid in header
  });
  res.json({ access_token: token });
};

import { createRemoteJWKSet, jwtVerify } from 'jose';

// fetches + caches JWKS automatically
const JWKS = createRemoteJWKSet(new URL('https://auth.myapp.com/.well-known/jwks.json'));

// ── middleware ─────────────────────────────────────
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'https://auth.myapp.com',
      audience: 'https://api.myapp.com',
      algorithms: ['ES256'],
    });

    req.user = payload; // { sub, roles, iat, exp, ... }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/*
{
  "sub": "user_abc123",
  "email": "alice@example.com",
  "name": "Alice Cruz",
  "iss": "https://auth.myapp.com",
  "aud": "https://api.myapp.com",
  "iat": 1713178320,
  "exp": 1713181920,
  "jti": "550e8400-e29b-41d4-a716-446655440000",

  "tenants": {
    "tenant_acme": {
      "name": "Acme Corp",
      "roles": ["admin", "billing_manager"],
      "plan": "enterprise",
      "permissions": ["users:write", "billing:read", "reports:export"]
    },
    "tenant_globex": {
      "name": "Globex Inc",
      "roles": ["viewer"],
      "plan": "starter",
      "permissions": ["reports:read"]
    }
  },

  "active_tenant": "tenant_acme"
}
*/
