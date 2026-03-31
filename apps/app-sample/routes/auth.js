import express from "express";
import * as auth from "@es-labs/jslib/auth";
import * as own from "@es-labs/jslib/express/controller/auth/own";
import * as oauth from "@es-labs/jslib/express/controller/auth/oauth";
import * as oidc from "@es-labs/jslib/express/controller/auth/oidc";
import * as saml from "@es-labs/jslib/express/controller/auth/saml";

export const myauthRoute = express.Router()
  .post('/login', own.login)
  .post('/otp', own.otp)
  .post('/refresh', auth.authRefresh)
  .get('/logout', own.logout)
  .get('/verify', auth.authUser, async (req, res) => res.json({}))
  .get('/me', auth.authUser, (req, res) => {
    try {
      const { id } = req.decoded
      // you can also get more user information from here from a datastore
      return res.status(200).json({ user: id, ts: Date.now() })
    } catch (e) {
      return res.status(500).json({ message: e.toString() })
    }
  })
  .post('/signup', (req, res) => {
    // NOSONAR let encryptedPassword = bcrypt.hashSync(clearPassword, process.env.SALT_ROUNDS)
    res.status(201).end()
  })


export const oauthRoute = express.Router().get('/callback', oauth.callbackOAuth)

export const oidcRoute = express.Router()
  .get('/login', oidc.login)
  .get('/auth', oidc.auth)
  .get('/refresh', oidc.refresh)

export const samlRoute = express.Router()
  .get('/login', saml.login)
  .post('/callback', saml.auth)

