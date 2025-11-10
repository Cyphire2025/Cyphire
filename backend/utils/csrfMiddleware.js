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

// backend/utils/csrfMiddleware.js
import crypto from "crypto";

/**
 * Issue/refresh a CSRF cookie for the API origin.
 * We use a non-HttpOnly cookie so the SPA can read it via /csrf-token,
 * while still requiring a matching header (double-submit).
 */
export function ensureCsrfCookie(req, res, next) {
  const existing = req.cookies?.csrfToken;
  if (!existing) {
    const token = crypto.randomBytes(32).toString("base64url");

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("csrfToken", token, {
      httpOnly: false,                 // SPA needs to read it (via endpoint)
      sameSite: isProd ? "none" : "lax",
      secure: isProd,                  // required for cross-site cookies
      path: "/",
      // DO NOT set "domain" for cross-origin (Render) unless you fully control it
      maxAge: 1000 * 60 * 60 * 12,     // 12h
    });
  }
  next();
}

/**
 * Verify double-submit: header must exactly match cookie
 * for state-changing methods.
 */
export function verifyDoubleSubmitCsrf(req, res, next) {
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"];
  if (!unsafe.includes(req.method)) return next();

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("X-CSRF-Token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "Missing CSRF token" });
  }
  next();
}
