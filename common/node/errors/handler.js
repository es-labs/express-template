// NodeJS Application Error Handling
// **WebSockets/SSE:** You need to track connections manually and close them
// For WS, broadcast a "server shutting down" message, then close all clients before server.close().
const {
  GRACEFUL_EXIT = NODE_ENV !== 'development',
  STACK_TRACE_LIMIT = DEFAULT_STACK_TRACE_LIMIT,
  SHUTDOWN_TIMEOUT_MS = DEFAULT_SHUTFOWN_TIMEOUT_MS,
} = process.env;

let shuttingDown = false;

const gracefulShutdown = async signal => {
  if (shuttingDown) return; // prevent multiple signals from triggering multiple shutdowns
  logger.info(`Cleanup initiated by signal: ${signal}`);
  setTimeout(() => {
    // give the LB time to notice the 503 and stop routing
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  if (server) {
    server.close(async () => {
      await services.stop(); // promise all...
      logger.info('process exiting gracefully');
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
    logger.info(`Uncaught Exception - error: ${err} origin: ${origin}` && process.exit(1)),
  );
  process.on('unhandledRejection', (reason, promise) =>
    logger.info(`Unhandled Rejection - promise: ${promise} reason: ${reason}` && process.exit(1)),
  );
}

// error and signal
// export default (signalFn, exceptionFn) => {
//   const defaultExceptionFn = async (e, type) => {
//     // TBD REPLACE WITH logger
//     // logger.error(type, e.toString())
//     // process.emit("SIGTERM") // process.exit(0), process.kill(process.pid, type)
//   };
//   if (!exceptionFn) exceptionFn = defaultExceptionFn;
//   const exceptions = ['unhandledRejection', 'uncaughtException'];
//   exceptions.forEach(type => {
//     process.on(type, e => exceptionFn(e, type));
//   });

//   const defaultSignalFn = async type => {
//     // TBD REPLACE WITH logger
//     // logger.error(type)
//   };
//   if (!signalFn) signalFn = defaultSignalFn;
//   const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2']; // SIGINT now works on windows
//   // if (process.platform === 'win32') {
//   //   import('readline').then(readline => readline.createInterface({ input: process.stdin, output: process.stdout }).on('SIGINT', () => process.emit('SIGINT')))
//   // }
//   signals.forEach(type => {
//     process.once(type, async () => {
//       const exitCode = await signalFn(type);
//       return Number.isInteger(exitCode) ? process.exit(parseInt(exitCode)) : process.exit(-10001); // should terminate the application
//     });
//   });
// };
