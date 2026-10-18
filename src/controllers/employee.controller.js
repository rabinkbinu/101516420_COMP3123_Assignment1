/**
 * Employee controllers. Every handler runs after the authenticate middleware,
 * so req.user.id is the verified id from the JWT - the only source of ownership.
 */
const { matchedData } = require('express-validator');
const employeeService = require('../services/employee.service');
const logger = require('../utils/logger');

// GET /api/v1/emp/employees  -> 200
async function listEmployees(req, res) {
  const employees = await employeeService.listEmployees(req.user.id);
  res.status(200).json({ status: true, count: employees.length, employees });
}

// POST /api/v1/emp/employees  -> 201
async function createEmployee(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const employee = await employeeService.createEmployee(req.user.id, data);

  logger.info('Employee created', { requestId: req.id, userId: req.user.id, employeeId: employee.id });
  res.status(201).json({
    status: true,
    message: 'Employee created successfully.',
    employee_id: employee.id,
    employee,
  });
}

// GET /api/v1/emp/employees/:eid  -> 200
async function getEmployee(req, res) {
  const employee = await employeeService.getEmployee(req.user.id, req.params.eid);
  res.status(200).json({ status: true, employee });
}

// PUT /api/v1/emp/employees/:eid  -> 200
async function updateEmployee(req, res) {
  const updates = matchedData(req, { locations: ['body'] });
  const employee = await employeeService.updateEmployee(req.user.id, req.params.eid, updates);

  logger.info('Employee updated', {
    requestId: req.id,
    userId: req.user.id,
    employeeId: employee.id,
    fields: Object.keys(updates),
  });
  res.status(200).json({ status: true, message: 'Employee details updated successfully.', employee });
}

// DELETE /api/v1/emp/employees?eid=xxx  -> 204 (no body)
async function deleteEmployee(req, res) {
  const { eid } = req.query;
  await employeeService.deleteEmployee(req.user.id, eid);

  logger.info('Employee deleted', { requestId: req.id, userId: req.user.id, employeeId: eid });
  res.status(204).end();
}

module.exports = { listEmployees, createEmployee, getEmployee, updateEmployee, deleteEmployee };
