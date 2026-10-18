/**
 * Runs after the express-validator rule chains. If any rule failed, it stops the
 * request with 400 Bad Request and a list of field errors.
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path || 'body',
    location: e.location,
    message: e.msg,
  }));

  // Only field names are logged - never the submitted values (they may contain passwords).
  logger.warn('Validation failed', {
    category: 'validation',
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    fields: errors.map((e) => e.field),
  });

  return next(ApiError.badRequest('Validation failed.', errors));
}

module.exports = validate;
