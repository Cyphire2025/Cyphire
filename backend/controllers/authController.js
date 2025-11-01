// controllers/authController.js

import bcrypt from "bcrypt";
import passport from "passport";
import User from "../models/userModel.js";
import { signJwt } from "../utils/jwt.js";
import { setAuthCookie } from "../utils/authCookie.js";

const FE = process.env.FRONTEND_URL || "http://localhost:5173"; // fallback for local


// Helper: get real client IP (trusts reverse proxy headers)
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip
  );
};

// --- Simple logger; swap with Winston/Sentry in production ---
const logger = {
  info: (...args) => req.log.info("[INFO]", ...args),
  warn: (...args) => req.log.warn("[WARN]", ...args),
  error: (...args) => req.log.error("[ERROR]", ...args),
};

function sanitizeNextPath(next) {
  if (typeof next !== "string") return "/";
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("..")) {
    return next;
  }
  return "/";
}

function encodeState(obj) {
  // Simple, URL-safe base64 encoding of JSON
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
function decodeState(str) {
  try {
    return JSON.parse(Buffer.from(str, "base64url").toString());
  } catch {
    return null;
  }
}


function getFrontendBase() {
  // Use your .env FRONTEND_URL, fallback to localhost:5173 if not set
  return process.env.FRONTEND_URL || "http://localhost:5173";
}

// --- CONTROLLER EXPORTS ---

/**
 * POST /api/auth/signup (email + password, IP check)
 */
export const emailSignup = async (req, res, next) => {
  try {
    const { name, email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email & password required" });
    }

    // Get IP and check for abuse/ban
    const signupIp = getClientIp(req);

    // Advanced: block if IP is on blocklist
    if (await User.isIpBlocked?.(signupIp)) {
      req.log.warn("Blocked IP tried to signup:", signupIp);
      return res.status(403).json({ error: "Signup blocked from your network." });
    }

    // Limit: max 3 signups/IP in 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await User.countDocuments({ signupIp, createdAt: { $gte: since } });
    if (count >= 3) {
      req.log.warn("Signup rate limit hit for IP:", signupIp);
      return res.status(429).json({ error: "Too many signups from your network, try again later." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Save IP on user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      signupIp,
      signinIpHistory: [signupIp], // Initialize with first IP
    });

    // emailSignup
    const token = signJwt({ id: user._id });
    setAuthCookie(res, token, { remember: !!rememberMe });


    req.log.info("User signup:", user.email, user._id, "ip:", signupIp);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err) {
    req.log.error("emailSignup error:", err);
    next(err);
  }
};

/**
 * POST /api/auth/signin (email + password, log IP)
 */
export const emailSignin = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get IP and check blocklist
    const signinIp = getClientIp(req);

    if (await User.isIpBlocked?.(signinIp)) {
      req.log.warn("Blocked IP tried to signin:", signinIp);
      return res.status(403).json({ error: "Signin blocked from your network." });
    }

    // Maintain last 5 signin IPs
    user.signinIpHistory = [signinIp, ...(user.signinIpHistory || [])].slice(0, 5);
    await user.save();

    // emailSignin
    const token = signJwt({ id: user._id });
    setAuthCookie(res, token, { remember: !!rememberMe });

    req.log.info("User login:", user.email, user._id, "ip:", signinIp);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err) {
    req.log.error("emailSignin error:", err);
    next(err);
  }
};

/**
 * GET /api/auth/google (OAuth start)
 */
export const googleAuth = (req, res, next) => {
  try {
    const remember = req.query.remember === "1" ? "1" : "0";
    const nextPath = sanitizeNextPath(req.query.next);
    const state = encodeState({ remember, next: nextPath });

    req.log.info("Google OAuth initiated", { remember, nextPath });

    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state,
      prompt: "select_account",
    })(req, res, next);
  } catch (err) {
    req.log.error("googleAuth error:", err);
    next(err);
  }
};

/**
 * GET /api/auth/google/callback (OAuth return)
 */
export const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${getFrontendBase()}/signin?error=oauth_failed`);
    }

    try {
      const token = signJwt({ id: user._id });

      // Defaults
      let rememberMe = false;
      let nextPath = "/choose";

      // Parse state (supports plain "1"/"0" or the encoded object)
      const { state } = req.query;
      if (state === "1" || state === "0" || state === undefined) {
        rememberMe = state === "1";
      } else {
        try {
          const parsed = decodeState(state);
          if (parsed) {
            rememberMe =
              parsed.remember === "1" || parsed.remember === true || parsed.remember === "true";
            nextPath = sanitizeNextPath(parsed.next) || "/choose";
          }
        } catch (stateErr) {
          console.error("Failed to decode Google OAuth state:", stateErr);
        }
      }

      // 🔐 Set the auth cookie on your API domain (Render) so the browser will
      // include it on subsequent XHR/fetch from your Vercel app.
      const maxAge = rememberMe
        ? 1000 * 60 * 60 * 24 * 30 // 30 days
        : 1000 * 60 * 60 * 6;      // 6 hours

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",  // REQUIRED for cross-site (vercel.app → onrender.com)
        secure: true,      // REQUIRED when SameSite=None
        path: "/",
        maxAge,
      });

      // Avoid any proxy/CDN caching of this auth response
      res.setHeader("Cache-Control", "no-store");

      // ✅ Now that the cookie is set on Render, send user to your frontend
      return res.redirect(`${getFrontendBase()}${nextPath}`);
    } catch (e) {
      console.error("googleCallback error:", e);
      return res.redirect(`${getFrontendBase()}/signin?error=server_error`);
    }
  })(req, res, next);
};


/**
 * POST /api/auth/signout
 */
export const signout = (_req, res, next) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      path: "/",
    });
    res.json({ ok: true });
    req.log.info("User signed out");
  } catch (err) {
    req.log.error("signout error:", err);
    next(err);
  }
};

/**
 * GET /api/auth/me (returns user profile)
 */
export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id name email avatar plan planStartedAt planExpiresAt country phone skills projects slug bio"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // Auto-downgrade expired plan
    if (user.plan !== "free" && user.planExpiresAt && Date.now() > user.planExpiresAt) {
      user.plan = "free";
      user.planExpiresAt = null;
      await user.save();
    }

    res.json({ user });
  } catch (err) {
    req.log.error("authController.me error:", err);
    next(err);
  }
};

/**
 * Notifications: GET /api/auth/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).select("notifications");
    res.json(me?.notifications || []);
  } catch (err) {
    req.log.error("getNotifications error:", err);
    next(err);
  }
};

/**
 * Notifications: POST /api/auth/notifications/:idx/read
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const idx = Number(req.params.idx);
    const me = await User.findById(req.user._id).select("notifications");
    if (!me) return res.status(404).json({ error: "User not found" });
    if (!Number.isInteger(idx) || idx < 0 || idx >= me.notifications.length) {
      return res.status(400).json({ error: "Invalid index" });
    }
    me.notifications[idx].read = true;
    await me.save();
    res.json({ ok: true });
  } catch (err) {
    req.log.error("markNotificationRead error:", err);
    next(err);
  }
};

/**
 * Notifications: DELETE /api/auth/notifications/:idx
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const idx = Number(req.params.idx);
    const me = await User.findById(req.user._id).select("notifications");
    if (!me) return res.status(404).json({ error: "User not found" });
    if (!Number.isInteger(idx) || idx < 0 || idx >= me.notifications.length) {
      return res.status(400).json({ error: "Invalid index" });
    }
    me.notifications.splice(idx, 1);
    await me.save();
    res.json({ ok: true });
  } catch (err) {
    req.log.error("deleteNotification error:", err);
    next(err);
  }
};
