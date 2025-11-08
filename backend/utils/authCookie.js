// utils/authCookie.js
import crypto from "crypto";

/**
 * setAuthCookie(res, token, { remember = false })
 * - Sets httpOnly 'token' + JS-readable 'csrfToken' (double-submit).
 * - Returns csrfToken (optional to expose).
 */
export function setAuthCookie(res, token, { remember = false } = {}) {
  const isProd = process.env.NODE_ENV === "production";
  // If FE and BE are on different domains, you MUST use 'none' (secure: true).
  const sameSite = process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax");

  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // ms
  if (typeof token !== "string") throw new Error("setAuthCookie: token must be a string");

  // Auth cookie (httpOnly)
  res.cookie("token", token, {
    httpOnly: true,
    secure: !!isProd,      // required when SameSite=None
    sameSite,
    path: "/",
    maxAge,
  });

  // CSRF cookie (readable by JS)
  const csrfToken = crypto.randomBytes(20).toString("hex");
  const csrfMaxAge = 2 * 60 * 60 * 1000; // 2h

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: !!isProd,
    sameSite,
    path: "/",
    maxAge: csrfMaxAge,
  });

  return csrfToken;
}

/** Clears both cookies */
export function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax");

  res.clearCookie("token", { httpOnly: true, secure: !!isProd, sameSite, path: "/" });
  res.clearCookie("csrfToken", { httpOnly: false, secure: !!isProd, sameSite, path: "/" });
}

/** Prefer Authorization Bearer; fallback to cookie */
export function extractBearerToken(req) {
  const auth = (req.get && req.get("Authorization")) || req.headers?.authorization || "";
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}
