// utils/authCookie.js
export function setAuthCookie(res, token, { remember = false } = {}) {
  const isProd = process.env.NODE_ENV === "production";
  const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30d vs 1d

  // IMPORTANT: don't set domain unless you know you need it.
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,                    // must be true on HTTPS in prod
    sameSite: isProd ? "none" : "lax", // cross-site cookie in prod
    path: "/",
    maxAge,
  });
}
