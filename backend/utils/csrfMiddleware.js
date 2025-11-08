// utils/csrfMiddleware.js

// Unsafe HTTP methods we protect
const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Exempt endpoints that must work before a CSRF cookie exists
// (auth bootstraps, OAuth callbacks, payment webhooks, health/metrics)
const EXEMPT_PREFIXES = [
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/google/callback",
  "/api/payment/webhook",   // ok if not present; harmless exemption
  "/metrics",
];

// Exact paths you want to allow as-is
const EXEMPT_EXACT = new Set([
  "/", // health
]);

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
