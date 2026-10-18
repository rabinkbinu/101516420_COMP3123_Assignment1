const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const employeeSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: [true, 'First name is required.'], trim: true, maxlength: 50 },
    last_name: { type: String, required: [true, 'Last name is required.'], trim: true, maxlength: 50 },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [EMAIL_REGEX, 'Email must be a valid email address.'],
    },
    position: { type: String, required: [true, 'Position is required.'], trim: true, maxlength: 100 },
    salary: {
      type: Number,
      required: [true, 'Salary is required.'],
      min: [0.01, 'Salary must be greater than 0.'],
      max: [10000000, 'Salary must not exceed 10,000,000.'],
    },
    date_of_joining: { type: Date, required: [true, 'Date of joining is required.'] },
    department: { type: String, required: [true, 'Department is required.'], trim: true, maxlength: 100 },

    // Relationship: the user who created (owns) this employee.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An employee must have an owner.'],
      immutable: true, // ownership can never be changed after creation
      index: true, // fast "employees owned by user X" queries
      validate: {
        // The owner must reference a user that actually exists.
        validator: async (userId) => Boolean(await mongoose.model('User').exists({ _id: userId })),
        message: 'Employee owner must reference an existing user.',
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// The same user cannot add two employees with the same email.
// (Two different users may each have an employee with that email.)
employeeSchema.index({ user: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);
