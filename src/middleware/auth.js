/**
 * Authentication middleware for protected routes.
 *
 * 1. Reads "Authorization: Bearer <jwt>"
 * 2. Verifies the signature, issuer and expiry of the JWT
 * 3. Confirms the user in the token still exists
 * 4. Attaches req.user = { id, username } for the controllers
 *
 * Any failure -> 401 Unauthorized.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { verifyToken } = require('../services/token.service');

function reject(req, reason, message) {
  logger.warn(`Authentication failed: ${reason}`, {
    category: 'auth',
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });
  return ApiError.unauthorized(message);
}

async function authenticate(req, res, next) {
  const header = req.get('Authorization');

  if (!header) {
    throw reject(req, 'missing token', 'Authentication required. Send a JWT in the header: Authorization: Bearer <token>.');
  }

  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    throw reject(req, 'malformed Authorization header', 'Malformed Authorization header. Expected format: Bearer <token>.');
  }

  let payload;
  try {
    payload = verifyToken(parts[1]);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw reject(req, 'expired token', 'Token has expired. Please log in again.');
    }
    throw reject(req, 'invalid token', 'Invalid token.');
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw reject(req, 'invalid token subject', 'Invalid token.');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw reject(req, 'user in token no longer exists', 'Invalid token. The user no longer exists.');
  }

  req.user = { id: user._id.toString(), username: user.username };
  next();
}

module.exports = authenticate;
