/**
 * Employee data access.
 *
 * Ownership is enforced INSIDE every database query: each read/update/delete
 * filters on { _id: eid, user: <authenticated user id> }. Changing the eid in the
 * URL can therefore never return or touch another user's document - the query
 * simply does not match it.
 */
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Called only when the owner-scoped query found nothing. Works out whether the
 * employee does not exist at all (404) or exists but belongs to someone else (403).
 */
async function notFoundOrForbidden(employeeId, userId, action) {
  const exists = await Employee.exists({ _id: employeeId });
  if (!exists) return ApiError.notFound('Employee not found.');

  logger.warn('Authorization failed: employee belongs to another user', {
    category: 'authorization',
    action,
    userId,
    employeeId,
  });
  return ApiError.forbidden('Access denied. This employee belongs to another user.');
}

async function listEmployees(userId) {
  return Employee.find({ user: userId }).sort({ created_at: 1 });
}

/** A user may not have two employees with the same email (409 Conflict). */
async function assertEmailAvailable(userId, email, excludeEmployeeId) {
  const filter = { user: userId, email };
  if (excludeEmployeeId) filter._id = mongoose.trusted({ $ne: excludeEmployeeId });
  if (await Employee.exists(filter)) {
    throw ApiError.conflict('You already have an employee with this email.', [
      { field: 'email', message: 'Employee email must be unique among your employees.' },
    ]);
  }
}

async function createEmployee(userId, data) {
  await assertEmailAvailable(userId, data.email);
  // The owner comes from the verified JWT, never from the request body.
  return Employee.create({ ...data, user: userId });
}

async function getEmployee(userId, employeeId) {
  const employee = await Employee.findOne({ _id: employeeId, user: userId });
  if (!employee) throw await notFoundOrForbidden(employeeId, userId, 'read');
  return employee;
}

async function updateEmployee(userId, employeeId, updates) {
  const ownedFilter = { _id: employeeId, user: userId };

  // Check ownership first so another user's employee always gets 403/404, never 409.
  if (!(await Employee.exists(ownedFilter))) throw await notFoundOrForbidden(employeeId, userId, 'update');
  if (updates.email) await assertEmailAvailable(userId, updates.email, employeeId);

  const employee = await Employee.findOneAndUpdate(
    ownedFilter,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );
  if (!employee) throw await notFoundOrForbidden(employeeId, userId, 'update');
  return employee;
}

async function deleteEmployee(userId, employeeId) {
  const employee = await Employee.findOneAndDelete({ _id: employeeId, user: userId });
  if (!employee) throw await notFoundOrForbidden(employeeId, userId, 'delete');
  return employee;
}

module.exports = { listEmployees, createEmployee, getEmployee, updateEmployee, deleteEmployee };
