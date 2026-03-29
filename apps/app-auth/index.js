import express from "express";
import * as auth from "./auth.js";

const router = express.Router();

export default ({ app, routePrefix }) => {
  app.use(routePrefix,
    router.use('/auth', auth.myauthRoute),
    router.use('/oidc', auth.oidcRoute),
    router.use('/oauth', auth.oauthRoute),
    router.use('/saml', auth.samlRoute)
  )
}
