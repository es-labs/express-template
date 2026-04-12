// use this instead of pino & pino-http
// pino has fatal and trace levels, which we dot not use.
// pino-http has some issues with logging response status codes on client disconnects and socket timeouts.
// So we implement our own simple logger and http logger middleware.
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

const log = (level, message, meta = {}) => {
  if (LOG_LEVELS[level] > currentLevel) return; // currentLevel < LOG_LEVELS[level]
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: process.env.npm_package_name ?? 'unknown',
    ...meta,
  });
  // biome-ignore lint/suspicious/noConsole: Using console for logging
  level === 'error' ? console.error(entry) : console.log(entry);
};

const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

const loggerMiddleware = (req, res, next) => {
  // 5xx=error. 4xx=warn, 2xx-3xx=info.
  // reason for 4xx can be logged in meta, e.g. validation_error, auth_failed, etc.
  req.log = logger;
  req.startTime = Date.now();
  req.socket.setTimeout(Number(process.env?.WS_KEEPALIVE_MS) || 30000); // 30 seconds
  let logged = false; // Prevent duplicate logs

  // Log incoming request
  req.log.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  const logResponse = (status, reason = null) => {
    if (logged) return;
    logged = true;
    const duration = Date.now() - req.startTime;
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    req.log[logLevel](`${req.method} ${req.path} ${status}`, {
      method: req.method,
      path: req.path,
      status,
      duration: `${duration}ms`,
      ...(reason && { reason }),
    });
  };

  // Log on normal response finish
  res.on('finish', () => logResponse(res.statusCode));

  // Handle client disconnect/abort
  req.on('aborted', () => logResponse(0, 'client_aborted'));
  res.on('close', () => {
    if (!res.writableEnded) logResponse(0, 'connection_closed');
  });

  // Handle socket timeout
  req.socket.on('timeout', () => logResponse(408, 'socket_timeout'));
  next();
};

// Make logger globally available
global.logger = logger;

export { logger, loggerMiddleware };
