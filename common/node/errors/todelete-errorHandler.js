// TODO check...
import { AppError } from '../errors/index.js';
import logger from './logger.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    logger.warn('Application error', { code: err.code, message: err.message });
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
