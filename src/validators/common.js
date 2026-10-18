const { body } = require('express-validator');

/**
 * Rejects bodies that are not JSON objects, and any field that is not on the
 * allow-list (e.g. a client trying to send "user", "_id" or "created_at").
 * Optionally requires at least one allowed field (used by PUT).
 */
function allowOnlyFields(allowed, { requireAtLeastOne = false } = {}) {
  return body().custom((value) => {
    if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Request body must be a JSON object (set header Content-Type: application/json).');
    }
    const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
    if (unexpected.length) {
      throw new Error(`Unexpected field(s): ${unexpected.join(', ')}. Allowed fields: ${allowed.join(', ')}.`);
    }
    if (requireAtLeastOne && !Object.keys(value).length) {
      throw new Error(`Provide at least one field to update: ${allowed.join(', ')}.`);
    }
    return true;
  });
}

module.exports = { allowOnlyFields };
