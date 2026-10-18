/**
 * Central configuration.
 * All secrets come from environment variables (.env locally, Vercel dashboard in production).
 * Nothing secret is hard-coded here.
 */
require('dotenv').config({ quiet: true });

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in the values.'
  );
}

const isVercel = Boolean(process.env.VERCEL);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  isVercel,

  // Express "trust proxy" is only enabled behind a real proxy (Vercel), so clients
  // cannot spoof X-Forwarded-For locally to dodge the rate limiter.
  trustProxy: isVercel ? 1 : false,

  mongoUri: process.env.MONGODB_URI,
  // The assignment requires this exact database name, so it is fixed in code.
  dbName: 'comp3123_assignment1',

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    issuer: 'comp3123-assignment1-api',
  },

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15) * 60 * 1000,
    apiMax: toInt(process.env.API_RATE_LIMIT_MAX, 100),
    loginMax: toInt(process.env.LOGIN_RATE_LIMIT_MAX, 5),
    signupMax: toInt(process.env.SIGNUP_RATE_LIMIT_MAX, 10),
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
  },
};

module.exports = config;
