/**
 * Generates an ALREADY-EXPIRED JWT for testing the "expired token" case.
 *
 * Usage:   npm run token:expired -- <userId>
 * Example: npm run token:expired -- 6712f0c2a1b2c3d4e5f60718
 *
 * It is signed with the same JWT_SECRET as the API (read from .env), so the API
 * recognises the signature and answers 401 "Token has expired".
 * For the deployed API, your local JWT_SECRET must match the one set on Vercel.
 */
require('dotenv').config({ quiet: true });
const jwt = require('jsonwebtoken');

const userId = process.argv[2];
if (!userId || !/^[a-f0-9]{24}$/i.test(userId)) {
  console.error('Usage: npm run token:expired -- <24-character userId>');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Create your .env file first.');
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  { username: 'expired-token-demo', iat: now - 7200, exp: now - 3600 }, // expired one hour ago
  process.env.JWT_SECRET,
  { subject: userId, issuer: 'comp3123-assignment1-api', algorithm: 'HS256' }
);

console.log(token);
