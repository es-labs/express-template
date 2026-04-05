// Frontend logging
// for production, send to Sentry
// Usage:
// import { logger } from './logger.js';
// globalThis.logger = logger; // One line! globalThis for browser and node runtimes

class Logger {
  constructor() {
    this.isDev = import.meta.env.DEV;
  }

  log(message, data) {
    if (this.isDev) console.log(`[LOG] ${message}`, data);
  }

  error(message, data) {
    if (this.isDev) console.error(`[ERROR] ${message}`, data);
  }
}

export const logger = new Logger();