const { Router } = require('express');
const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createEmployeeRules,
  updateEmployeeRules,
  employeeIdParamRules,
  employeeIdQueryRules,
} = require('../validators/employee.validators');

const router = Router();

// Every employee route requires a valid JWT.
router.use(authenticate);

router.get('/employees', employeeController.listEmployees);
router.post('/employees', createEmployeeRules, validate, employeeController.createEmployee);
router.get('/employees/:eid', employeeIdParamRules, validate, employeeController.getEmployee);
router.put('/employees/:eid', updateEmployeeRules, validate, employeeController.updateEmployee);
router.delete('/employees', employeeIdQueryRules, validate, employeeController.deleteEmployee);

module.exports = router;
