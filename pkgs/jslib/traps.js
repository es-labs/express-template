export default (signalFn, exceptionFn) => {
  const defaultExceptionFn = async (e, type) => {
    // TBD REPLACE WITH logger
    // console.error(type, e.toString())
    // process.emit("SIGTERM") // process.exit(0), process.kill(process.pid, type)
  };
  if (!exceptionFn) exceptionFn = defaultExceptionFn;
  const exceptions = ['unhandledRejection', 'uncaughtException'];
  exceptions.forEach(type => {
    process.on(type, e => exceptionFn(e, type));
  });

  const defaultSignalFn = async type => {
    // TBD REPLACE WITH logger
    // console.error(type)
  };
  if (!signalFn) signalFn = defaultSignalFn;
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2']; // SIGINT now works on windows
  // if (process.platform === 'win32') {
  //   import('readline').then(readline => readline.createInterface({ input: process.stdin, output: process.stdout }).on('SIGINT', () => process.emit('SIGINT')))
  // }
  signals.forEach(type => {
    process.once(type, async () => {
      const exitCode = await signalFn(type);
      return Number.isInteger(exitCode) ? process.exit(parseInt(exitCode)) : process.exit(-10001); // should terminate the application
    });
  });
};
