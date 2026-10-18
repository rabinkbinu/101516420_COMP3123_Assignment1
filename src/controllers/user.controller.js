const { matchedData } = require('express-validator');
const authService = require('../services/auth.service');
const config = require('../config/env');
const logger = require('../utils/logger');

// POST /api/v1/user/signup  -> 201 Created
async function signup(req, res) {
  // matchedData returns only fields that passed validation (no mass assignment).
  const data = matchedData(req, { locations: ['body'] });

  let user;
  try {
    user = await authService.registerUser(data);
  } catch (err) {
    if (err.statusCode === 409) {
      logger.warn('Signup rejected: user already exists', {
        category: 'auth',
        requestId: req.id,
        fields: (err.errors || []).map((e) => e.field),
      });
    }
    throw err;
  }

  logger.info('User registered', { category: 'auth', requestId: req.id, userId: user.id, username: user.username });

  res.status(201).json({
    status: true,
    message: 'User created successfully.',
    user_id: user.id,
    user, // password is stripped by the model's toJSON transform
  });
}

// POST /api/v1/user/login  -> 200 OK + JWT
async function login(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const identifier = data.username || data.email;

  let result;
  try {
    result = await authService.loginUser(data);
  } catch (err) {
    if (err.statusCode === 401) {
      logger.warn('Login failed: invalid credentials', { category: 'auth', requestId: req.id, identifier, ip: req.ip });
    }
    throw err;
  }

  logger.info('Login successful', { category: 'auth', requestId: req.id, userId: result.user.id, identifier });

  res.status(200).json({
    status: true,
    message: 'Login successful.',
    jwt_token: result.token,
    token_type: 'Bearer',
    expires_in: config.jwt.expiresIn,
    user: result.user,
  });
}

module.exports = { signup, login };
