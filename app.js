import url from "url";
import http from "http";
import https from "https";
import express from "express";
import expressJSDocSwagger from "express-jsdoc-swagger";
import preRoute from "@es-labs/node/express/preRoute";
import postRoute from "@es-labs/node/express/postRoute";
import appsLoader from "./apps/apploader.js";
import routeBase from "./common/router/index.js";
import { errorHandler, notFoundHandler } from './common/middleware/error.js';

import * as services from '@es-labs/node/services';
import * as authService from '@es-labs/node/auth';

// setup graceful exit
// **WebSockets/SSE:** You need to track connections manually and close them. For WS, broadcast a "server shutting down" message, then close all clients before server.close().
let shuttingDown = false;

const gracefulShutdown = async (signal) => {
  const timeOutMs = 30000
  console.log(`Cleanup initiated by signal: ${signal}`);
  shuttingDown = true;
  setTimeout(() => { // give the LB time to notice the 503 and stop routing
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, timeOutMs);
  if (server) {
    server.close(async () => {
      await services.stop(); // promise all...
      console.log('process exiting gracefully');
      return process.exit(0)
    });
  }
}

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, gracefulShutdown)); // SIGKILL cannot be caught
process.on('uncaughtException', (err, origin) => console.log(`Uncaught Exception - error: ${err} origin: ${origin}` && process.exit(1)));
process.on('unhandledRejection', (reason, promise) => console.log(`Unhandled Rejection - promise: ${promise} reason: ${reason}` && process.exit(1)));

// SERVICES
services.start()
try {
  authService.setup(services.get('keyv'), services.get('knex1')) // setup authorization
} catch (e) {
  console.log(e)
}

const { HTTPS_PRIVATE_KEY, HTTPS_CERTIFICATE, HTTPS_CA, HTTPS_PASSPHRASE } = process.env
const https_opts = {}
if (HTTPS_CERTIFICATE) https_opts.cert = HTTPS_CERTIFICATE
if (HTTPS_PRIVATE_KEY) https_opts.key = HTTPS_PRIVATE_KEY
if (HTTPS_CA) https_opts.ca = HTTPS_CERTIFICATE
if (HTTPS_PASSPHRASE) https_opts.passphrase = HTTPS_PASSPHRASE // (fs.readFileSync('passphrase.txt')).toString()

const app = express();
const server = HTTPS_CERTIFICATE ? https.createServer(https_opts, app) : http.createServer(app) // fs.readFileSync('ca.cert')
preRoute(app, express)


// ROUTES

  // 1. asyncWrapper
  // https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators/#usinges7asyncawait
  // https://gist.github.com/Hiswe/fe83c97d1c7c8eee9557939d1b9bc086
  // Caveats:
  // 1. You must have all your asynchronous code return promises (except emitters). Raw callbacks simply don’t have the facilities for this to work.
  // 2. Event emitters (like streams) can still cause uncaught exceptions. So make sure you are handling the error event properly e.g. stream.on('error', next).pipe(res)

  // DOs:
  // DO use throw, and try/catch when needed
  // DO use custom error classes like BadRequestError as it makes sorting errors out easier

  // const asyncWrapper = fn => (...args) => fn(...args).catch(args[2])
  // export default asyncWrapper
  // USAGE:
  // const wrap = require('./<path-to>/asyncWrapper')
  // app.get('/', wrap(async (req, res) => { ... }))
  // replaced by - express-async-errors, will be native in express 5
  // global.asyncWrapper = fn => (...args) => fn(...args).catch(args[2]) //  proceed to error handler
  // https://github.com/express-promise-router/express-promise-router
  // https://github.com/davidbanham/express-async-errors
  // https://stackoverflow.com/questions/44327291/express-js-wrap-every-middleware-route-in-decorator
  // https://github.com/expressjs/express/issues/4256
  // https://github.com/expressjs/express/issues/3748

// https://stackoverflow.com/questions/44327291/express-js-wrap-every-middleware-route-in-decorator - TO CHECK AND REMOVE for express 5

try {
  console.log('Start App Routes Load')
  appsLoader(app) // add your APIs here
  console.log('Start Common Routes Load')
  routeBase(app); // common routes
  console.log('Start Fallback Routes Load')
  app.use('/api/:wildcard', (req, res) => res.status(404).json({ error: 'Not Found' }))
  console.log('Routes Load Completed')
} catch (e) {
  console.log('Route loading exception', e, e.toString())
}
// END ROUTES

// OpenAPI
const { OPENAPI_OPTIONS } = process.env
// TBD when lib is ready for ExpressJS 5
const openApiOptions = null // JSON.parse(OPENAPI_OPTIONS || null)
if (openApiOptions) {
  openApiOptions.baseDir = new URL(".", import.meta.url).pathname
  expressJSDocSwagger(app)(openApiOptions)
}

// websockets
server.on('upgrade', (request, socket, head) => {
  console.log('upgrade event')
  const pathname = url.parse(request.url).pathname // if (pathname === '/some-match') { }
})

postRoute(app, express)
app.use(":wildcard", (req, res) => res.status(404).json({ Error: '404 Not Found...' }))
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
// 'Bad Request': 400, 'Unauthorized': 401, 'Forbidden': 403, 'Not Found': 404, 'Conflict': 409, 'Unprocessable Entity': 422, 'Internal Server Error': 500,

// 404 — must come after all valid routes

app.use(notFoundHandler);
app.use(errorHandler);


export {
  server
};
