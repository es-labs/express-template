const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;
const log = (level, message, meta = {}) => {
  if (LOG_LEVELS[level] > currentLevel) return;
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: process.env.SERVICE_NAME ?? 'unknown',
    ...meta,
  });
  level === 'error' ? console.error(entry) : console.log(entry); // eslint-disable-line no-console
};
export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
