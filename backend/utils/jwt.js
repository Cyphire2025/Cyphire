// utils/jwt.js

import jwt from "jsonwebtoken";

/**
 * Validate JWT env config at startup for safety.
 */
if (!process.env.JWT_SECRET) {
  throw new Error("[JWT] Missing JWT_SECRET in environment!");
}

/**
 * Signs a JWT with the given payload and options.
 * - Default expiry: 7 days (settable via JWT_EXPIRES env)
 * - Additional options (aud, sub, etc) can be passed
 * @param {object} payload - User/session data (should NOT contain secrets)
 * @param {object} options - jwt.sign options
 * @returns {string} - JWT token
 */
export const signJwt = (payload, options = {}) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "7d",
    ...options,
  });
};

/**
 * Verifies a JWT (throws on invalid/expired)
 * - Logs all errors for audit (swap for Winston/Sentry in prod)
 * - Returns decoded token payload if valid
 * @param {string} token - The JWT token
 * @returns {object} decoded payload
 */
export const verifyJwt = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.warn("[JWT] Verification failed:", err.message);
    throw err;
  }
};

/**
 * (Optional): Add support for token versioning, multi-key rotation, etc.
 * For enterprise: consider kid, aud, iss claims, etc.
 */