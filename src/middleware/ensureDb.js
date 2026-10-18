/**
 * Makes sure MongoDB is connected before an API route runs.
 * Locally the connection is already open (no-op). On Vercel, a cold-started
 * function opens (and caches) the connection on its first request.
 * If MongoDB is unreachable the error handler answers 503.
 */
const { connectDB } = require('../config/db');

async function ensureDb(req, res, next) {
  await connectDB();
  next();
}

module.exports = ensureDb;
