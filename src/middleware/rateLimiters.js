/**
 * Rate limiting (express-rate-limit).
 *
 *  loginLimiter  - POST /api/v1/user/login : counts FAILED attempts only (brute-force protection)
 *  signupLimiter - POST /api/v1/user/signup: counts every signup request (account-spam protection)
 *  apiLimiter    - every /api/* request    : general abuse protection
 *
 * When a limit is exceeded the client gets 429 Too Many Requests, a JSON body,
 * and the standard RateLimit / Retry-After headers. Counters live in memory and
 * reset when the window ends (or when the server restarts).
 */
const { rateLimit } = require('express-rate-limit');
const config = require('../config/env');
const logger = require('../utils/logger');

const { windowMs } = config.rateLimit;
const windowMinutes = Math.round(windowMs / 60000);

function createLimiter({ name, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7', // RateLimit + RateLimit-Policy headers
    legacyHeaders: false,
    handler(req, res, next, options) {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfter = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000)) : windowMs / 1000;

      logger.warn(`Rate limit exceeded: ${name}`, {
        category: 'rate-limit',
        requestId: req.id,
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        limit,
      });

      res.set('Retry-After', String(retryAfter));
      res.status(options.statusCode).json({
        status: false,
        message,
        retry_after_seconds: retryAfter,
        request_id: req.id,
      });
    },
  });
}

const loginLimiter = createLimiter({
  name: 'login',
  limit: config.rateLimit.loginMax,
  skipSuccessfulRequests: true,
  message: `Too many failed login attempts. Please try again in ${windowMinutes} minutes.`,
});

const signupLimiter = createLimiter({
  name: 'signup',
  limit: config.rateLimit.signupMax,
  message: `Too many signup requests. Please try again in ${windowMinutes} minutes.`,
});

const apiLimiter = createLimiter({
  name: 'api',
  limit: config.rateLimit.apiMax,
  message: `Too many requests. Please try again in ${windowMinutes} minutes.`,
});

module.exports = { loginLimiter, signupLimiter, apiLimiter };
