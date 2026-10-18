/**
 * Builds and exports the Express application (no app.listen here).
 * - server.js imports it and starts a local HTTP server.
 * - Vercel imports it and runs it as a serverless function.
 */
const express = require('express');
const helmet = require('helmet');
const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const ensureDb = require('./middleware/ensureDb');
const { apiLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const userRoutes = require('./routes/user.routes');
const employeeRoutes = require('./routes/employee.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.set('trust proxy', config.trustProxy);

// 1. Security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, ...)
//    and removal of the X-Powered-By header.
app.use(helmet());

// 2. Request id + one log line per request.
app.use(requestLogger);

// 3. JSON body parsing with a size cap (rejects huge payloads with 413).
app.use(express.json({ limit: '10kb' }));

// 4. Public routes
app.get('/', (req, res) => {
  res.status(200).json({
    status: true,
    message: 'COMP3123 Assignment 1 - Employee Management API is running.',
    health: '/health',
    endpoints: {
      signup: 'POST /api/v1/user/signup',
      login: 'POST /api/v1/user/login',
      list_employees: 'GET /api/v1/emp/employees',
      create_employee: 'POST /api/v1/emp/employees',
      get_employee: 'GET /api/v1/emp/employees/{eid}',
      update_employee: 'PUT /api/v1/emp/employees/{eid}',
      delete_employee: 'DELETE /api/v1/emp/employees?eid={eid}',
    },
  });
});
app.use('/health', healthRoutes);

// 5. API routes: general rate limit + database connection, then the routers.
app.use('/api', apiLimiter, ensureDb);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

// 6. Unsupported routes -> 404, then the central error handler.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
