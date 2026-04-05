// middleware/errorHandler.js
import { NotFoundError } from '../../../node/errors/AppError.js';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Normalize any thrown value into a consistent shape.
 * Express v5 auto-forwards async rejections, but the thrown
 * value might not always be an AppError.
 */
function normalizeError(err) {
  // Already a structured AppError
  if (err.isOperational) return err;

  // Express body-parser / JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, code: 'INVALID_JSON', message: 'Malformed JSON in request body', isOperational: true };
  }

  // Express v5 enforces valid status codes — map unknown ones safely
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;

  return {
    statusCode: status,
    code: err.code || 'INTERNAL_ERROR',
    message: isDev ? err.message : 'An unexpected error occurred',
    stack: err.stack,
    isOperational: false,
  };
}

/**
 * Central error-handling middleware.
 * Must have exactly 4 parameters so Express recognises it as an error handler.
 */
export const errorHandler = (err, req, res, next) => {
  // If the response stream has already started, delegate to Express default
  if (res.headersSent) {
    return next(err);
  }

  const error = normalizeError(err);
  const statusCode = error.statusCode ?? 500;

  // Always log server errors; conditionally log client errors
  if (statusCode >= 500) {
    console.error({
      type: 'server_error',
      code: error.code,
      message: error.message,
      path: req.path,
      method: req.method,
      requestId: req.headers['x-request-id'],
      stack: error.stack,
    });
  } else if (isDev) {
    console.warn({
      type: 'client_error',
      code: error.code,
      status: statusCode,
      path: req.path,
    });
  }

  const body = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(isDev && { stack: error.stack }),
    },
  };

  res.status(statusCode).json(body);
};

/**
 * Catch-all 404 handler — place this after all your routes.
 */
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(req.path));
};
