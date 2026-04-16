import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import * as keyv from './keyv.js';
import * as knex from './knex.js';
import * as fga from './openfga.js';
import * as rbac from './rbac.js';
import * as redis from './redis.js';

const HASH_KEYLEN = 64;

let setRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
  setRefreshTokenStoreName,
  setTokenService,
  setUserService,
  findUser,
  updateUser,
  setAuthUserStoreName;

const {
  JWT_ALG,
  JWT_EXPIRY_SEC = 900,
  JWT_REFRESH_EXPIRY_SEC = 3600,
  JWT_REFRESH_STORE = 'keyv',
  JWT_REFRESH_STORE_NAME,
  JWT_REFRESH_TOKEN_BYTE_LEN = 32,
} = globalThis.__config.JWT;

const {
  AUTH_REFRESH_URL,
  AUTH_USER_FIELD_ID_FOR_JWT,
  AUTH_USER_FIELDS_JWT_PAYLOAD = '',
  AUTH_USER_STORE,
  AUTH_USER_STORE_NAME,

  USE_OTP,

  JWT_PRIVATE_KEY,
  JWT_CERTIFICATE,
  // refresh token should be a random string stored in DB or Cache, so we can revoke when needed, also handle refresh token reuse detection
  JWT_SECRET,
} = process.env;

const authFns = {
  // rename to authFns
  findUser: null,
  updateUser: null,
  revokeRefreshToken: null,
};

const store = {
  keyv,
  knex,
  redis,
};

/**
 * @param {object} tokenService - service instance for refresh-token storage (keyv/redis/knex)
 * @param {object} userService  - service instance for user lookups (knex)
 * @param {{ apiUrl: string, storeId: string, authorizationModelId?: string }} [fgaConfig]
 *   Optional OpenFGA connection config. When omitted, FGA checks are skipped and
 *   createToken falls back to user.roles from the database.
 * @param {{ enabled: boolean }} [rbacConfig]
 *   Optional RBAC config. When enabled, createToken fetches tenant/role/permission
 *   data from the DB and embeds it in the JWT as active_tenant + tenants.
 */
const setup = (tokenService, userService, fgaConfig, rbacConfig) => {
  //NOSONAR ({ } = process.env);
  ({ setRefreshToken, getRefreshToken, revokeRefreshToken, setRefreshTokenStoreName, setTokenService } =
    store[JWT_REFRESH_STORE]); // keyv, redis, knex
  ({ findUser, updateUser, setAuthUserStoreName, setUserService } = store[AUTH_USER_STORE]); // knex
  authFns.findUser = findUser;
  authFns.updateUser = updateUser;
  authFns.revokeRefreshToken = revokeRefreshToken;
  if (setTokenService) setTokenService(tokenService);
  if (setUserService) setUserService(userService);
  if (setRefreshTokenStoreName) setRefreshTokenStoreName(JWT_REFRESH_STORE_NAME);
  if (setAuthUserStoreName) setAuthUserStoreName(AUTH_USER_STORE_NAME);
  if (fgaConfig) fga.setup(fgaConfig);
  if (rbacConfig?.enabled) rbac.setup(userService);
};

const { COOKIE_OPTS } = globalThis.__config;

//NOSONAR algorithm
// expiresIn
// issuer  = 'Mysoft corp'
// subject  = 'some@user.com'
// audience  = 'http://mysoftcorp.in'
// ip
// We implement stateful refresh_token not stateless

//NOSONAR
// mode: sign, verify
const getSecret = mode => {
  if (JWT_ALG.substring(0, 2) !== 'HS') {
    if (mode === 'sign') return JWT_PRIVATE_KEY;
    else return JWT_CERTIFICATE;
  }
  return JWT_SECRET;
};

// should use:
// sub - for user id
// roles - for user roles (based on selected token)
// all other user related information sent on initial login and stored using local storage
// do not catch exception here, let functions above handle
const createToken = async user => {
  // Create a tokens & data from user
  const user_meta = {};
  const options = {};

  const id = user[AUTH_USER_FIELD_ID_FOR_JWT];

  if (!id) throw Error('User ID Not Found');
  if (user.revoked) throw Error('User Revoked');

  // Fetch roles from OpenFGA when available; fall back to the DB `roles` column.
  const fgaRoles = await fga.listUserRoles(id);
  const roles = fgaRoles.length > 0 ? fgaRoles : (user.roles ?? '').split(',').filter(Boolean);

  // Fetch tenant-scoped roles and permissions from RBAC tables when configured.
  // user.tenant is the user's default/preferred tenant from the users table.
  const rbacData = await rbac.getUserTenantsData(id, user.tenant);

  const keys = AUTH_USER_FIELDS_JWT_PAYLOAD.split(',');
  for (const key of keys) {
    if (key && user[key] !== undefined) user_meta[key] = user[key];
  }

  options.allowInsecureKeySizes = false;
  options.algorithm = JWT_ALG;
  options.expiresIn = JWT_EXPIRY_SEC;

  // Build JWT payload — RBAC tenant data is merged in when available.
  const payload = {
    sub: id,
    roles, // flat roles list (FGA or DB column) kept for backward compatibility
    ...(rbacData && { active_tenant: rbacData.active_tenant, tenants: rbacData.tenants }),
  };
  const access_token = jwt.sign(payload, getSecret('sign'), options);

  options.expiresIn = JWT_REFRESH_EXPIRY_SEC;
  const refresh_token = crypto.randomBytes(JWT_REFRESH_TOKEN_BYTE_LEN).toString('base64url');
  await setRefreshToken(id, refresh_token); // store in DB or Cache
  return {
    access_token,
    refresh_token,
    user_meta,
  };
};

const setTokensToHeader = (res, { access_token, refresh_token }) => {
  const _access_token = `Bearer ${access_token}`;
  if (COOKIE_HTTPONLY) {
    res.cookie('Authorization', _access_token, { ...COOKIE_OPTS, path: '/' });
    res.cookie('refresh_token', refresh_token, { ...COOKIE_OPTS, path: AUTH_REFRESH_URL }); // send only if path contains refresh
  } else {
    res.setHeader('Authorization', _access_token);
    res.setHeader('refresh_token', refresh_token);
  }
};

/**
 * JWT authentication middleware.
 * Verifies the Bearer token and populates:
 *   req.user — decoded JWT payload { sub, roles, iat, exp, ... }
 *   req.fga  — convenience object for per-request OpenFGA checks
 *
 * For route-level fine-grained checks use fga.requireFga() instead of calling
 * req.fga.check() inline.
 */
const authUser = async (req, res, next) => {
  let access_token = null;
  try {
    const tmp = req.cookies?.Authorization || req.header('Authorization') || req.query?.Authorization;
    access_token = tmp.split(' ')[1];
  } catch (e) {
    return res.status(401).json({ message: 'Token Format Error' });
  }
  if (access_token) {
    try {
      const access_result = jwt.verify(access_token, getSecret('verify'), { algorithm: [JWT_ALG] }); // and options
      if (access_result) {
        req.user = access_result;
        // Attach a scoped FGA check helper so route handlers can do ad-hoc checks
        // without importing the fga module directly.
        req.fga = {
          check: (relation, object) => fga.check(access_result.sub, relation, object),
        };
        // Attach synchronous RBAC helpers that inspect the JWT payload.
        // These mirror requireRoles / requirePermissions but for inline handler use.
        req.rbac = {
          hasRole: (...roleList) => {
            const ctx = access_result.tenants?.[access_result.active_tenant];
            return ctx ? roleList.some(r => ctx.roles.includes(r)) : false;
          },
          hasPermission: (...permList) => {
            const ctx = access_result.tenants?.[access_result.active_tenant];
            return ctx ? permList.every(p => ctx.permissions.includes(p)) : false;
          },
        };
        return next();
      } else {
        return res.status(401).json({ message: 'Access Error' });
      }
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token Expired Error' });
      } else {
        return res.status(401).json({ message: 'Token Error' });
      }
    }
  } else {
    return res.status(401).json({ message: 'Token Missing' });
  }
};

const authRefresh = async (req, res) => {
  // get refresh token
  try {
    const refresh_token = req.cookies?.refresh_token || req.header('refresh_token') || req.query?.refresh_token; // check refresh token & user - always stateful
    const access_token = req.cookies?.access_token || req.header('access_token') || req.query?.access_token; // check refresh token & user - always stateful
    const user = jwt.decode(access_token);
    const { id, iat } = user;
    if (Math.floor(Date.now() / 1000) > iat + JWT_REFRESH_EXPIRY_SEC) {
      return res.status(401).json({ message: 'Refresh Token Expired' });
    }
    const refreshToken = await getRefreshToken(id);
    if (String(refreshToken) === String(refresh_token)) {
      // ok... generate new access token & refresh token
      const user = await findUser({ id });
      // TODO user also include tenant and other information
      const tokens = await createToken(user);
      setTokensToHeader(res, tokens);
      return res.status(200).json(tokens);
    } else {
      return res.status(401).json({ message: 'Refresh Token Error: Uncaught' });
    }
  } catch (err) {
    // use err instead of e (fix no-catch-shadow issue)
    return res.status(401).json({ message: 'Refresh Token Error' });
  }
};

// Re-export OpenFGA helpers so callers can import from a single auth entry point
export { check, deleteTuple, listUserRoles, requireFga, writeTuple } from './openfga.js';
// Re-export RBAC management helpers from a single auth entry point
export { assignRole, grantPermission, revokePermission, revokeRole } from './rbac.js';
export {
  authFns,
  authRefresh,
  authUser,
  createToken,
  // findUser, updateUser,
  getSecret,
  setTokensToHeader,
  setup,
};

// do refresh token check from backend ?
/*
Signout across tabs
window.addEventListener('storage', this.syncLogout) 
//....
syncLogout (event) {
  if (event.key === 'logout') {
    Router.push('/login')
  }
}
async function logout () {
  inMemoryToken = null;
  const url = 'http://localhost:3010/auth/logout'
  const response = await fetch(url, { method: 'POST', credentials: 'include', })
  // to support logging out from all windows
  window.localStorage.setItem('logout', Date.now())
}
*/

// The user logs in with a login API call.
// Server generates JWT Token and refresh_token
// Server sets a HttpOnly cookie with refresh_token. jwt_token and jwt_token_expiry are returned back to the client as a JSON payload.
// The jwt_token is stored in memory.
// A countdown to a future silent refresh is started based on jwt_token_expiry

// https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/
