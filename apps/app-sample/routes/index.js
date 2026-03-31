import express from "express";
import base from "./base.js";
import categories from "./categories.js";
import webhooks from "./webhooks.js";
import sse from "./sse.js";
import tests from "./tests.js";
import webpush from "./webpush.js";
import fido from "./fido.js";
import * as auth from "./auth.js";

const router = express.Router();

// export your routes here - make sure no clashes
export default ({ app }) => {
  app.use('/api/app-sample',
    router.use('/', base), // http://127.0.0.1:3000/api/app-sample/
    router.use('/categories', categories), // http://127.0.0.1:3000/api/app-sample/categories/
    router.use('/webhooks', webhooks),
    router.use('/sse', sse),
    router.use('/tests', tests), // for tests
    router.use('/webpush', webpush),
    router.use('/fido', fido),
  )

  // authentication stuff Below - you can remove if not needed (be aware of routing if you are customizing your auth)
  // routes used are: /api/auth (own auth rollout), /api/oauth, /api/oidc, /api/saml
  // this one can actually be a microservice on its own, but for demo purposes we are putting it here
  app.use('/api',
    router.use('/auth', auth.myauthRoute),
    router.use('/oidc', auth.oidcRoute),
    router.use('/oauth', auth.oauthRoute),
    router.use('/saml', auth.samlRoute)
  )
}



