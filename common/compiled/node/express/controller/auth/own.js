// own authentication
import jwt from 'jsonwebtoken';
import { verify } from 'otplib';

import { authFns, createToken, getSecret, setTokensToHeader } from '../../../auth/index.js';
import { matchScryptHash } from '../../../auth/scrypt.js';

const { COOKIE_HTTPONLY, JWT_ALG } = globalThis.__config.JWT;

const {
  AUTH_USER_FIELD_LOGIN,
  AUTH_USER_FIELD_SALT,
  AUTH_USER_FIELD_PASSWORD,
  AUTH_USER_FIELD_GAKEY,
  AUTH_USER_FIELD_ID_FOR_JWT,
  USE_OTP,
} = process.env;

const logout = async (req, res) => {
  let id = null;
  try {
    let access_token = null;
    const tmp = req.cookies?.Authorization || req.header('Authorization') || req.query?.Authorization;
    access_token = tmp.split(' ')[1];
    const result = jwt.decode(access_token);
    id = result.id;
    jwt.verify(access_token, getSecret('verify'), { algorithm: [JWT_ALG] }); // throw if expired or invalid
  } catch (e) {
    if (e.name !== 'TokenExpiredError') id = null;
  }
  try {
    if (id) {
      await authFns.revokeRefreshToken(id); // clear
      if (COOKIE_HTTPONLY) {
        res.clearCookie('refresh_token');
        res.clearCookie('Authorization');
      }
      return res.status(200).json({ message: 'Logged Out' });
    }
  } catch (e) {
    logger.info('logout err', e.toString());
  }
  return res.status(500).json();
};

const refresh = async (req, res) => {
  // refresh logic all done in authUser
  return res.status(401).json({ message: 'Error token revoked' });
};

const login = async (req, res) => {
  try {
    const user = await authFns.findUser({
      [AUTH_USER_FIELD_LOGIN]: req.body[AUTH_USER_FIELD_LOGIN],
    });
    if (!user) return res.status(401).json({ message: 'Incorrect credentials...' });
    if (
      !(await matchScryptHash(
        req.body[AUTH_USER_FIELD_PASSWORD],
        user[AUTH_USER_FIELD_SALT],
        user[AUTH_USER_FIELD_PASSWORD],
      ))
    )
      return res.status(401).json({ message: 'Incorrect credentials...' });
    if (user.revoked) return res.status(401).json({ message: 'Revoked credentials' });
    const id = user[AUTH_USER_FIELD_ID_FOR_JWT];
    if (!id) return res.status(401).json({ message: 'Authorization Format Error' });
    if (USE_OTP) {
      // Currently supports only Google Authenticator
      // Fido2 can be added in future
      return res.status(200).json({ otp: id });
    }
    const tokens = await createToken(user); // 5 minute expire for login
    setTokensToHeader(res, tokens);
    return res.status(200).json(tokens);
  } catch (e) {
    // logger.info('login err', e.toString())
  }
  return res.status(500).json();
};

const otp = async (req, res) => {
  // need to be authentication, body { id: '', pin: '123456' }
  try {
    const { id, pin } = req.body;
    const user = await authFns.findUser({ id });
    if (user) {
      const gaKey = user[AUTH_USER_FIELD_GAKEY];
      if (USE_OTP !== 'TEST' ? verify({ token: pin, secret: gaKey }) : String(pin) === '111111') {
        // NOTE: expiry will be determined by authenticator itself
        const tokens = await createToken(user);
        setTokensToHeader(res, tokens);
        return res.status(200).json(tokens);
      } else {
        return res.status(401).json({ message: 'Error token wrong pin' });
      }
    }
  } catch (e) {
    logger.info('otp err', e.toString());
  }
  return res.status(401).json({ message: 'Error token revoked' });
};

export { login, logout, otp, refresh };
