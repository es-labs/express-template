import express from "express";
import base from "./base.js";
import categories from "./categories.js";
import webhooks from "./webhooks.js";
import sse from "./sse.js";
import tests from "./tests.js";
import webpush from "./webpush.js";
import fido from "./fido.js";

const router = express.Router();

// export your routes here - make sure no clashes
export default ({ app, routePrefix }) => {
  app.use(routePrefix,
    router.use('/', base), // http://127.0.0.1:3000/api/app-sample/
    router.use('/categories', categories), // http://127.0.0.1:3000/api/app-sample/categories/
    router.use('/webhooks', webhooks),
    router.use('/sse', sse),
    router.use('/tests', tests), // for tests
    router.use('/webpush', webpush),
    router.use('/fido', fido),
  )
}
