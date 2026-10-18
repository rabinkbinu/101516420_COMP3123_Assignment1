const { body, param, query } = require('express-validator');
const { allowOnlyFields } = require('./common');

const EMPLOYEE_FIELDS = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];
const NAME_PATTERN = /^[\p{L}][\p{L} '.-]*$/u; // letters, spaces, apostrophes, dots, hyphens
const MAX_SALARY = 10000000;
const OBJECT_ID_MESSAGE = 'Invalid employee ID. It must be a 24-character hexadecimal MongoDB ObjectId.';

/**
 * Starts a rule chain for one field.
 * required = true  (POST): field must be present.
 * required = false (PUT) : field may be omitted, but if present it must be valid.
 */
function field(name, label, required) {
  const chain = body(name);
  return required
    ? chain.exists({ values: 'null' }).withMessage(`${label} is required.`).bail()
    : chain.optional();
}

function textField(name, label, required, { min = 1, max, pattern, patternMessage } = {}) {
  let chain = field(name, label, required)
    .isString().withMessage(`${label} must be a string.`).bail()
    .trim()
    .notEmpty().withMessage(`${label} cannot be empty.`).bail()
    .isLength({ min, max }).withMessage(`${label} must be ${min}-${max} characters long.`).bail();
  if (pattern) chain = chain.matches(pattern).withMessage(patternMessage);
  return chain;
}

function employeeBodyRules(required) {
  return [
    allowOnlyFields(EMPLOYEE_FIELDS, { requireAtLeastOne: !required }),

    textField('first_name', 'First name', required, {
      max: 50,
      pattern: NAME_PATTERN,
      patternMessage: 'First name may only contain letters, spaces, apostrophes, dots and hyphens.',
    }),
    textField('last_name', 'Last name', required, {
      max: 50,
      pattern: NAME_PATTERN,
      patternMessage: 'Last name may only contain letters, spaces, apostrophes, dots and hyphens.',
    }),

    field('email', 'Email', required)
      .isString().withMessage('Email must be a string.').bail()
      .trim()
      .isLength({ max: 254 }).withMessage('Email must be at most 254 characters.').bail()
      .isEmail().withMessage('Email must be a valid email address.')
      .toLowerCase(),

    textField('position', 'Position', required, { min: 2, max: 100 }),
    textField('department', 'Department', required, { min: 2, max: 100 }),

    field('salary', 'Salary', required)
      .custom((value) => {
        if (typeof value === 'boolean' || Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          throw new Error('Salary must be a number.');
        }
        return true;
      }).bail()
      .isFloat({ gt: 0, max: MAX_SALARY })
      .withMessage(`Salary must be a positive number no greater than ${MAX_SALARY.toLocaleString('en-US')}.`)
      .toFloat(),

    field('date_of_joining', 'Date of joining', required)
      .isString().withMessage('Date of joining must be a string in YYYY-MM-DD format.').bail()
      .isISO8601({ strict: true, strictSeparator: true })
      .withMessage('Date of joining must be a valid date in YYYY-MM-DD (ISO 8601) format.').bail()
      .custom((value) => {
        const date = new Date(value);
        const earliest = new Date('1950-01-01');
        const latest = new Date();
        latest.setFullYear(latest.getFullYear() + 1);
        if (date < earliest || date > latest) {
          throw new Error('Date of joining must be between 1950-01-01 and one year from today.');
        }
        return true;
      })
      .toDate(),
  ];
}

const createEmployeeRules = employeeBodyRules(true);
const updateEmployeeRules = [
  param('eid').isMongoId().withMessage(OBJECT_ID_MESSAGE),
  ...employeeBodyRules(false),
];

const employeeIdParamRules = [param('eid').isMongoId().withMessage(OBJECT_ID_MESSAGE)];

const employeeIdQueryRules = [
  query('eid')
    .exists().withMessage('Employee ID is required as a query parameter, e.g. ?eid=<id>.').bail()
    .isString().withMessage('Provide exactly one eid query parameter.').bail()
    .isMongoId().withMessage(OBJECT_ID_MESSAGE),
];

module.exports = {
  createEmployeeRules,
  updateEmployeeRules,
  employeeIdParamRules,
  employeeIdQueryRules,
};
