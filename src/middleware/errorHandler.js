/**
 * Centralised error handling.
 *
 * Every error in the app ends up here (Express 5 forwards errors thrown in async
 * handlers automatically). The client always receives the same JSON shape:
 *
 *   { "status": false, "message": "...", "errors": [...optional], "request_id": "..." }
 *
 * Stack traces, database details and secrets are never sent to the client;
 * unexpected errors are logged in full to logs/error.log instead.
 */
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.path}`));
}

const DB_UNAVAILABLE = new Set([
  'MongooseServerSelectionError',
  'MongoServerSelectionError',
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
]);

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let message = 'Internal server error.';
  let errors;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for field "${err.path}".`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    // Unique index violation (e.g. two requests racing to create the same user/employee).
    status = 409;
    const field = Object.keys(err.keyValue || err.keyPattern || {}).find((k) => k !== 'user');
    message = field ? `A record with this ${field} already exists.` : 'Duplicate record.';
    if (field) errors = [{ field, message }];
  } else if (DB_UNAVAILABLE.has(err.name)) {
    status = 503;
    message = 'Database is unavailable. Please try again later.';
  }

  if (status >= 500) {
    logger.error(`Unhandled error: ${err.message}`, {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      stack: err.stack,
    });
  } else if (!(err instanceof ApiError)) {
    logger.warn(`Request rejected: ${message}`, { requestId: req.id, method: req.method, path: req.originalUrl });
  }

  res.status(status).json({
    status: false,
    message,
    ...(errors && { errors }),
    request_id: req.id,
  });
}

module.exports = { notFound, errorHandler };
