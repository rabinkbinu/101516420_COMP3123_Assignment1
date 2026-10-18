/**
 * JWT helpers. Tokens are signed with HS256 using JWT_SECRET.
 * Payload: sub = user id, username. Expiry comes from JWT_EXPIRES_IN (default 1h).
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signToken(user) {
  return jwt.sign({ username: user.username }, config.jwt.secret, {
    subject: user._id.toString(),
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    algorithm: 'HS256',
  });
}

/** Throws TokenExpiredError / JsonWebTokenError when the token is not valid. */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: ['HS256'], // pin the algorithm - rejects "alg: none" and swapped algorithms
    issuer: config.jwt.issuer,
  });
}

module.exports = { signToken, verifyToken };
