/**
 * Entry point.
 *  - `npm start` / `npm run dev`: connects to MongoDB, then listens on PORT.
 *  - Vercel: imports this file and uses the exported Express app directly.
 */
const app = require('./src/app');
const config = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

async function start() {
  try {
    await connectDB();
  } catch {
    logger.error('Could not connect to MongoDB at startup. Check MONGODB_URI in your .env file. Exiting.');
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(`Server started on http://localhost:${config.port} (env: ${config.env})`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received - shutting down`);
    server.close(async () => {
      await disconnectDB();
      logger.info('Server stopped');
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.message : reason}`, {
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

if (require.main === module) {
  start();
}

module.exports = app;
