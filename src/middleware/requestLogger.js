/**
 * Logs one line per HTTP request once the response has been sent:
 * timestamp, method, path, status, duration, client IP, request id and (if logged in) user id.
 *
 * Request bodies and the Authorization header are deliberately NOT logged,
 * so passwords and tokens never end up in the log files.
 */
const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  req.id = randomUUID();
  res.set('X-Request-Id', req.id);

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    let level = 'info';
    if (res.statusCode >= 500) level = 'error';
    else if (res.statusCode >= 400) level = 'warn';

    logger.log(level, `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`, {
      requestId: req.id,
      ip: req.ip,
      ...(req.user && { userId: req.user.id }),
    });
  });

  next();
}

module.exports = requestLogger;
