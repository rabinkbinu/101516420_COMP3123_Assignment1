const { body } = require('express-validator');
const { allowOnlyFields } = require('./common');

const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

const PASSWORD_RULE =
  'Password must be 8-64 characters and include at least one uppercase letter, one lowercase letter, one number and one special character.';

const signupRules = [
  allowOnlyFields(['username', 'email', 'password']),

  body('username')
    .exists({ values: 'null' }).withMessage('Username is required.').bail()
    .isString().withMessage('Username must be a string.').bail()
    .trim()
    .notEmpty().withMessage('Username is required.').bail()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters long.').bail()
    .matches(USERNAME_PATTERN).withMessage('Username may only contain letters, numbers, dots, underscores and hyphens.')
    .toLowerCase(),

  body('email')
    .exists({ values: 'null' }).withMessage('Email is required.').bail()
    .isString().withMessage('Email must be a string.').bail()
    .trim()
    .notEmpty().withMessage('Email is required.').bail()
    .isLength({ max: 254 }).withMessage('Email must be at most 254 characters.').bail()
    .isEmail().withMessage('Email must be a valid email address.')
    .toLowerCase(),

  body('password')
    .exists({ values: 'null' }).withMessage('Password is required.').bail()
    .isString().withMessage('Password must be a string.').bail()
    .notEmpty().withMessage('Password is required.').bail()
    .isLength({ min: 8, max: 64 }).withMessage(PASSWORD_RULE).bail()
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    .withMessage(PASSWORD_RULE),
];

// Login accepts { username, password } OR { email, password }.
const loginRules = [
  allowOnlyFields(['username', 'email', 'password']),

  body('username')
    .custom((value, { req }) => {
      if (value === undefined && req.body?.email === undefined) {
        throw new Error('Username or email is required.');
      }
      return true;
    }).bail()
    .if((value) => value !== undefined)
    .isString().withMessage('Username must be a string.').bail()
    .trim()
    .notEmpty().withMessage('Username cannot be empty.').bail()
    .isLength({ max: 30 }).withMessage('Username must be at most 30 characters.')
    .toLowerCase(),

  body('email')
    .optional()
    .isString().withMessage('Email must be a string.').bail()
    .trim()
    .isEmail().withMessage('Email must be a valid email address.')
    .toLowerCase(),

  body('password')
    .exists({ values: 'null' }).withMessage('Password is required.').bail()
    .isString().withMessage('Password must be a string.').bail()
    .notEmpty().withMessage('Password is required.').bail()
    .isLength({ max: 128 }).withMessage('Password is too long.'),
];

module.exports = { signupRules, loginRules };
