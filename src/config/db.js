/**
 * MongoDB connection (Mongoose).
 *
 * The connection promise is cached so that:
 *  - locally, the server connects once at startup;
 *  - on Vercel (serverless), warm function instances reuse the open connection
 *    instead of opening a new one on every request.
 */
const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

// Reject unknown fields in query filters.
mongoose.set('strictQuery', true);
// Neutralise NoSQL operator injection: any {"$gt": ""}-style object that reaches
// a query filter is wrapped in $eq and treated as a literal value.
mongoose.set('sanitizeFilter', true);

let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.mongoUri, {
        dbName: config.dbName, // always comp3123_assignment1
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => {
        logger.info(`MongoDB connected (database: ${m.connection.name})`);
        return m.connection;
      })
      .catch((err) => {
        connectionPromise = null; // allow a retry on the next request
        // Only the message is logged - never the connection string (it contains credentials).
        logger.error(`MongoDB connection failed: ${err.message}`);
        throw err;
      });
  }
  return connectionPromise;
}

const STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

function dbStatus() {
  return STATES[mongoose.connection.readyState] || 'unknown';
}

async function disconnectDB() {
  await mongoose.disconnect();
  connectionPromise = null;
}

module.exports = { connectDB, disconnectDB, dbStatus };
