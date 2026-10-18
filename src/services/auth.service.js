const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signToken } = require('./token.service');

// A real bcrypt hash of a throwaway string. When a login names a user that does not
// exist we still run bcrypt.compare against this, so the response time is the same
// as for a wrong password and attackers cannot discover which usernames exist.
const DUMMY_HASH = '$2b$10$sCUcuXjM/Y.kw8WQvnnZJOEpiI7WPiWKBZrDy6UzKHVdU0lvndpEm';

async function registerUser({ username, email, password }) {
  const existing = await User.find({ $or: [{ username }, { email }] }).lean();

  if (existing.length) {
    const errors = [];
    if (existing.some((u) => u.username === username)) {
      errors.push({ field: 'username', message: 'Username is already taken.' });
    }
    if (existing.some((u) => u.email === email)) {
      errors.push({ field: 'email', message: 'Email is already registered.' });
    }
    throw ApiError.conflict('User already exists.', errors);
  }

  // The pre-save hook in the User model hashes the password.
  return User.create({ username, email, password });
}

async function loginUser({ username, email, password }) {
  const filter = {};
  if (username) filter.username = username;
  if (email) filter.email = email;

  const user = await User.findOne(filter).select('+password');
  const passwordOk = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !passwordOk) {
    // Same message for "no such user" and "wrong password" - do not reveal which.
    throw ApiError.unauthorized('Invalid username/email or password.');
  }

  return { user, token: signToken(user) };
}

module.exports = { registerUser, loginUser };
