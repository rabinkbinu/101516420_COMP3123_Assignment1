const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { signupRules, loginRules } = require('../validators/user.validators');
const validate = require('../middleware/validate');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimiters');

const router = Router();

// Order per route: rate limiter -> validation rules -> validation check -> controller
router.post('/signup', signupLimiter, signupRules, validate, userController.signup);
router.post('/login', loginLimiter, loginRules, validate, userController.login);

module.exports = router;
