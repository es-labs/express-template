import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as keyv from './keyv.js';
import * as knex from './knex.js';
import * as redis from './redis.js';

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
  JWT_EXPIRY,
  JWT_REFRESH_EXPIRY,
  JWT_REFRESH_STORE = 'keyv',
  JWT_REFRESH_STORE_NAME,
} = globalThis.__config.JWT;

const {
  AUTH_REFRESH_URL,
  AUTH_USER_FIELD_LOGIN,
  AUTH_USER_FIELD_PASSWORD,
  AUTH_USER_FIELD_GAKEY,
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

const setup = (tokenService, userService) => {
  //NOSONAR ({ } = process.env);
  // ({ setRefreshToken, getRefreshToken, revokeRefreshToken, setRefreshTokenStoreName, setTokenService } = require('./' + JWT_REFRESH_STORE)); // keyv, redis, knex
  // ({ findUser, updateUser, setAuthUserStoreName, setUserService } = require('./' + AUTH_USER_STORE)); // knex
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
// type: access, refresh
const getSecret = mode => {
  if (JWT_ALG.substring(0, 2) !== 'HS') {
    if (mode === 'sign') return JWT_PRIVATE_KEY;
    else return JWT_CERTIFICATE;
  }
  return JWT_SECRET;
};

// should use:
// sub - for user id (access_token & refresh_token)
// groups - for user groups (access_token only)
// all other user related information sent on initial login and stored using local storage
// do not catch exception here, let functions above handle
const createToken = async user => {
  // Create a tokens & data from user
  const user_meta = {};
  const options = {};

  const id = user[AUTH_USER_FIELD_ID_FOR_JWT];

  if (!id) throw Error('User ID Not Found');
  if (user.revoked) throw Error('User Revoked');

  const groups = user.groups;

  const keys = AUTH_USER_FIELDS_JWT_PAYLOAD.split(',');
  for (const key of keys) {
    if (key && user[key] !== undefined) user_meta[key] = user[key];
  }

  options.allowInsecureKeySizes = false;
  options.algorithm = JWT_ALG;
  options.expiresIn = JWT_EXPIRY;
  const access_token = jwt.sign({ id, groups }, getSecret('sign'), options);

  options.expiresIn = JWT_REFRESH_EXPIRY;
  const refresh_token = '12345678'; // TODO generate random string
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
        req.decoded = access_result;
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
    const decoded = jwt.decode(access_token);
    const { id } = decoded;
    // TODO expiry check
    const refreshToken = await getRefreshToken(id);
    if (String(refreshToken) === String(refresh_token)) {
      // ok... generate new access token & refresh token
      const user = await findUser({ id });
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

export {
  authFns,
  authRefresh,
  authUser,
  bcrypt,
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
