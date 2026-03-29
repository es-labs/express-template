import http from "http";
import https from "https";
import express from "express";

import * as services from '@es-labs/node/services';
import * as authService from '@es-labs/node/auth';

import { healthRouter } from './health/router.js';

const init = () => {
  // setup stacktrace limit
  const DEFAULT_STACK_TRACE_LIMIT = 3 // default limit error stack trace to 3 level
  const {
    STACK_TRACE_LIMIT = DEFAULT_STACK_TRACE_LIMIT,
  } = process.env

  Error.stackTraceLimit = Number(STACK_TRACE_LIMIT) || DEFAULT_STACK_TRACE_LIMIT

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

  app.use('/health', healthRouter); // Mount before auth middleware — healthchecks must be unprotected

  return { app, express, server };
}

export default init;