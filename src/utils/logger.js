/**
 * Application logger (Winston).
 *
 * Locally, logs are written to:
 *   logs/app.log    - everything at "info" level and above
 *   logs/error.log  - errors only
 * and also printed to the console.
 *
 * On Vercel the filesystem is read-only, so only the console transport is used
 * (Vercel collects console output in the project's Logs tab).
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const config = require('../config/env');

// Defence in depth: if a sensitive key is ever passed as log metadata, mask it.
const SENSITIVE_KEY = /pass(word)?|secret|token|authorization|cookie|mongodb_uri/i;
const redact = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (SENSITIVE_KEY.test(key)) info[key] = '[REDACTED]';
  }
  return info;
});

const line = winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const trace = stack ? `\n${stack}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${message}${extra}${trace}`;
});

const format = winston.format.combine(redact(), winston.format.timestamp(), line);

const transports = [new winston.transports.Console()];

if (!config.isVercel) {
  const logDir = path.resolve(process.cwd(), config.log.dir);
  fs.mkdirSync(logDir, { recursive: true });
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 5 * 1024 * 1024, // rotate at 5 MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({ level: config.log.level, format, transports });

module.exports = logger;
