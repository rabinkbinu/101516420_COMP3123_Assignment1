const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDB, dbStatus } = require('../config/db');
const { version } = require('../../package.json');

// GET /health
// 200 + "ok" when the API and MongoDB are both up; 503 + "degraded" when MongoDB is unreachable.
async function health(req, res) {
  let latencyMs = null;
  try {
    await connectDB();
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    latencyMs = Date.now() - start;
  } catch {
    // reported below as a degraded status; details are in the logs
  }

  const healthy = dbStatus() === 'connected' && latencyMs !== null;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    message: healthy ? 'API is running and connected to MongoDB.' : 'API is running but MongoDB is unreachable.',
    service: 'COMP3123 Assignment 1 - Employee Management API',
    version,
    environment: config.env,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    database: {
      status: dbStatus(),
      name: config.dbName,
      latency_ms: latencyMs,
    },
  });
}

module.exports = { health };
