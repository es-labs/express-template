// ? set globals here
// ? caution - avoid name clashes with native JS libraries, other libraries, other globals
import helmet from 'helmet';
import cors from 'cors';
import pathToRegexp from 'path-to-regexp';
import cookieParser from 'cookie-parser';

import http from 'node:http';
import https from 'node:https';
import express from 'express';

import * as services from '../node/services/index.js';
import * as authService from '../node/auth/index.js';

import { healthRouter } from './health/router.js';
import { logger } from '../node/logging/index.js';

const preRoute = () => {
  const { NODE_ENV } = process.env;
  const DEFAULT_STACK_TRACE_LIMIT = 3; // default limit error stack trace to 3 level
  const DEFAULT_SHUTFOWN_TIMEOUT_MS = NODE_ENV === 'production' ? 30000 : 3000;
  const {
    GRACEFUL_EXIT = NODE_ENV !== 'development',
    STACK_TRACE_LIMIT = DEFAULT_STACK_TRACE_LIMIT,
    SHUTDOWN_TIMEOUT_MS = DEFAULT_SHUTFOWN_TIMEOUT_MS,
  } = process.env;

  // setup stacktrace limit
  Error.stackTraceLimit = Number(STACK_TRACE_LIMIT) || DEFAULT_STACK_TRACE_LIMIT;

  // setup graceful exit
  // **WebSockets/SSE:** You need to track connections manually and close them. For WS, broadcast a "server shutting down" message, then close all clients before server.close().
  let shuttingDown = false;

  const gracefulShutdown = async signal => {
    if (shuttingDown) return; // prevent multiple signals from triggering multiple shutdowns
    console.log(`Cleanup initiated by signal: ${signal}`);
    setTimeout(() => {
      // give the LB time to notice the 503 and stop routing
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    if (server) {
      server.close(async () => {
        await services.stop(); // promise all...
        console.log('process exiting gracefully');
        return process.exit(0);
      });
    }
    shuttingDown = true;
  };

  if (GRACEFUL_EXIT) {
    ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
      process.on(signal, gracefulShutdown);
    }); // SIGKILL cannot be caught
    process.on('uncaughtException', (err, origin) =>
      console.log(`Uncaught Exception - error: ${err} origin: ${origin}` && process.exit(1)),
    );
    process.on('unhandledRejection', (reason, promise) =>
      console.log(`Unhandled Rejection - promise: ${promise} reason: ${reason}` && process.exit(1)),
    );
  }

  const { HTTPS_PRIVATE_KEY, HTTPS_CERTIFICATE, HTTPS_CA, HTTPS_PASSPHRASE } = process.env;
  const https_opts = {};
  if (HTTPS_CERTIFICATE) https_opts.cert = HTTPS_CERTIFICATE;
  if (HTTPS_PRIVATE_KEY) https_opts.key = HTTPS_PRIVATE_KEY;
  if (HTTPS_CA) https_opts.ca = HTTPS_CERTIFICATE;
  if (HTTPS_PASSPHRASE) https_opts.passphrase = HTTPS_PASSPHRASE; // (fs.readFileSync('passphrase.txt')).toString()
  const app = express();
  const server = HTTPS_CERTIFICATE ? https.createServer(https_opts, app) : http.createServer(app); // fs.readFileSync('ca.cert')

  // intercept upgrades before Express sees them
  server.on('upgrade', (req, socket, head) => {
    // Let the WS server handle it — do nothing here if services.start sets up WS internally
    // This prevents Express middleware from touching upgrade requests
    if (req.headers.upgrade?.toLowerCase() !== 'websocket') {
      socket.destroy();
    }
  });

  // SERVICES need server
  services.start(app, server);
  try {
    authService.setup(services.get('keyv'), services.get('knex1')); // setup authorization
  } catch (e) {
    console.log(e);
  }

  // skip middleware for WebSocket upgrade requests
  app.use((req, res, next) => {
    // if (req.headers.upgrade?.toLowerCase() === 'websocket') return next('route');
    if (req.headers.upgrade?.toLowerCase() === 'websocket') return next(); // let WS server handle it
    next();
  });

  app.use('/health', healthRouter); // Mount before auth middleware — healthchecks must be unprotected

  const {
    CORS_OPTIONS, // CORS_ORIGINS no longer in use
    CORS_DEFAULTS,
    HELMET_OPTIONS,
    COOKIE_SECRET = (parseInt(Date.now() / 28800000) * 28800000).toString(),
  } = process.env;

  // ------ LOGGING ------
  // HTTP request logging middleware with timeout handling
  // handles: socket timeouts, client aborts, close connections, normal responses
  // and prevents duplicate logs
  app.use((req, res, next) => {
    next()
  });

  // ------ SECURITY ------
  console.log('helmet setting up');
  try {
    const helmetOptions = JSON.parse(HELMET_OPTIONS || null);
    if (helmetOptions) {
      console.table(helmetOptions);
      if (helmetOptions.nosniff) app.use(helmet.noSniff());
      if (helmetOptions.xssfilter) app.use(helmet.xssFilter());
      if (helmetOptions.hideServer) app.use(helmet.hidePoweredBy());
      if (helmetOptions.csp) app.use(helmet.contentSecurityPolicy(helmetOptions.csp));
    }
    // app.use(helmet.noCache())
    // csurf not needed at the moment
  } catch (e) {
    console.error('[helmet setup error]', e.toString());
    throw e;
  }

  // -------- CORS --------
  // Set CORS headers so client is able to communicate with this server
  // Access-Control-Allow-Origin=*
  // Access-Control-Allow-Methods=GET,POST,PUT,PATCH,DELETE,OPTIONS
  // Access-Control-Allow-Headers=Content-Type, Authorization
  console.log('cors setting up');
  console.table({ CORS_OPTIONS, CORS_DEFAULTS });
  try {
    const corsOptions = JSON.parse(CORS_OPTIONS || null);
    app.use(corsOptions ? cors(corsOptions) : cors()); // default { origin: '*' }
    console.info('cors options done');
  } catch (e) {
    console.error('[cors options error]', e.toString());
    throw e;
  }
  // Set CORS defaults if certain CORS headers are missing
  try {
    const corsDefaults = JSON.parse(CORS_DEFAULTS || null);
    if (corsDefaults) {
      app.use((req, res, next) => {
        for (const key in corsDefaults) {
          if (!res.get(key)) res.set(key, corsDefaults[key]);
        }
        next();
      });
    }
  } catch (e) {
    console.error('[cors defaults error]', e.toString());
    throw e;
  }

  // express-limiter, compression, use reverse proxy

  // ------ body-parser and-cookie parser ------
  const { BODYPARSER_JSON, BODYPARSER_URLENCODED, BODYPARSER_RAW_ROUTES = '' } = process.env;
  // look out for... Unexpected token n in JSON at position 0 ... client request body must match request content-type, if applicaion/json, body cannot be null/undefined
  console.log('bodyparser setting up');
  console.table({ BODYPARSER_RAW_ROUTES, BODYPARSER_JSON, BODYPARSER_URLENCODED });
  try {
    app.use((req, res, next) => {
      const rawMatch = BODYPARSER_RAW_ROUTES?.split(',')?.find(route => pathToRegexp.match(route)(req.originalUrl));
      if (rawMatch) {
        // raw routes - ignore bodyparser json
        next();
      } else {
        express.json(JSON.parse(BODYPARSER_JSON || null) || { limit: '2mb' })(req, res, next);
      }
    });
    app.use(express.urlencoded(JSON.parse(BODYPARSER_URLENCODED || null) || { extended: true, limit: '2mb' })); // https://stackoverflow.com/questions/29175465/body-parser-extended-option-qs-vs-querystring/29177740#29177740
  } catch (e) {
    console.error('[bodyparser setup error]', e.toString());
    throw e;
  }
  console.info('bodyparser setup done');

  console.log({ COOKIE_SECRET });
  app.use(cookieParser(COOKIE_SECRET));

  // return this // this is undefined...
  return { app, express, server };
};

export default preRoute;
