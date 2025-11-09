// // utils/csrfMiddleware.js

// // Unsafe HTTP methods we protect
// const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// // Exempt endpoints that must work before a CSRF cookie exists
// // (auth bootstraps, OAuth callbacks, payment webhooks, health/metrics)
// const EXEMPT_PREFIXES = [
//   "/api/auth/signin",
//   "/api/auth/signup",
//   "/api/auth/google/callback",
//   "/api/payment/webhook",   // ok if not present; harmless exemption
//   "/metrics",
// ];

// // Exact paths you want to allow as-is
// const EXEMPT_EXACT = new Set([
//   "/", // health
// ]);

// export function verifyDoubleSubmitCsrf(req, res, next) {
//   if (!UNSAFE.has(req.method)) return next();

//   if (EXEMPT_EXACT.has(req.path)) return next();
//   for (const p of EXEMPT_PREFIXES) {
//     if (req.path.startsWith(p)) return next();
//   }

//   const headerToken = req.get("X-CSRF-Token") || req.get("x-csrf-token");
//   const cookieToken = req.cookies?.csrfToken;

//   if (!headerToken || !cookieToken) {
//     return res.status(403).json({ error: "Missing CSRF token" });
//   }
//   if (headerToken !== cookieToken) {
//     return res.status(403).json({ error: "Invalid CSRF token" });
//   }
//   return next();
// }

// utils/csrfMiddleware.js

import crypto from "crypto";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const EXEMPT_PREFIXES = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/google/callback",
  "/api/payment/webhook",
  "/metrics",
];
const EXEMPT_EXACT = new Set(["/"]);

/**
 * Issue a CSRF cookie if it's missing or looks invalid.
 * We use a random per-session token; rotate every 12h.
 * NOTE: Double-submit cookie pattern requires a JS-readable cookie.
 * If you want HttpOnly, switch to a /csrf-token endpoint approach.
 */
export function ensureCsrfCookie(req, res, next) {
  const name = "csrfToken";
  let token = req.cookies?.[name];

  // very light sanity check
  const valid = typeof token === "string" && token.length >= 32;
  if (!valid) {
    token = crypto.randomBytes(24).toString("base64url");
    res.cookie(name, token, {
      // JS-readable on purpose for double-submit:
      httpOnly: false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure:   process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 12 * 60 * 60 * 1000, // 12h
    });
  }
  next();
}

export function verifyDoubleSubmitCsrf(req, res, next) {
  if (!UNSAFE.has(req.method)) return next();

  if (EXEMPT_EXACT.has(req.path)) return next();
  for (const p of EXEMPT_PREFIXES) {
    if (req.path.startsWith(p)) return next();
  }

  const headerToken = req.get("X-CSRF-Token") || req.get("x-csrf-token");
  const cookieToken = req.cookies?.csrfToken;

  if (!headerToken || !cookieToken) {
    return res.status(403).json({ error: "Missing CSRF token" });
  }
  if (headerToken !== cookieToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  return next();
}
