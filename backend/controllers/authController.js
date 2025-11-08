// controllers/authController.js

import bcrypt from "bcrypt";
import passport from "passport";
import User from "../models/userModel.js";
import { signJwt } from "../utils/jwt.js";
import { setAuthCookie, clearAuthCookie } from "../utils/authCookie.js";

const FE = process.env.FRONTEND_URL || "http://localhost:5173";

// Helper: get real client IP (trusts reverse proxy headers)
const getClientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.connection?.remoteAddress ||
  req.ip;

function sanitizeNextPath(next) {
  if (typeof next !== "string") return "/";
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes("..")) return next;
  return "/";
}

function encodeState(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}
function decodeState(str) {
  try { return JSON.parse(Buffer.from(str, "base64url").toString()); }
  catch { return null; }
}
const getFrontendBase = () => process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * POST /api/auth/signup
 */
export const emailSignup = async (req, res, next) => {
  try {
    const { name, email, password, rememberMe } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email & password required" });

    const signupIp = getClientIp(req);
    if (await User.isIpBlocked?.(signupIp)) {
      req.log?.warn?.("Blocked IP tried to signup:", signupIp);
      return res.status(403).json({ error: "Signup blocked from your network." });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await User.countDocuments({ signupIp, createdAt: { $gte: since } });
    if (count >= 3) {
      req.log?.warn?.("Signup rate limit hit for IP:", signupIp);
      return res.status(429).json({ error: "Too many signups from your network, try again later." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      signupIp,
      signinIpHistory: [signupIp],
    });

    const token = signJwt({ id: user._id });
    setAuthCookie(res, token, { remember: !!rememberMe });

    req.log?.info?.("User signup:", user.email, user._id, "ip:", signupIp);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err) {
    req.log?.error?.("emailSignup error:", err);
    next(err);
  }
};

/**
 * POST /api/auth/signin
 */
export const emailSignin = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const signinIp = getClientIp(req);
    if (await User.isIpBlocked?.(signinIp)) {
      req.log?.warn?.("Blocked IP tried to signin:", signinIp);
      return res.status(403).json({ error: "Signin blocked from your network." });
    }

    user.signinIpHistory = [signinIp, ...(user.signinIpHistory || [])].slice(0, 5);
    await user.save();

    const token = signJwt({ id: user._id });
    setAuthCookie(res, token, { remember: !!rememberMe });

    req.log?.info?.("User login:", user.email, user._id, "ip:", signinIp);

    res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err) {
    req.log?.error?.("emailSignin error:", err);
    next(err);
  }
};

/**
 * GET /api/auth/google
 */
export const googleAuth = (req, res, next) => {
  try {
    const remember = req.query.remember === "1" ? "1" : "0";
    const nextPath = sanitizeNextPath(req.query.next);
    const state = encodeState({ remember, next: nextPath });

    req.log?.info?.("Google OAuth initiated", { remember, nextPath });

    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state,
      prompt: "select_account",
    })(req, res, next);
  } catch (err) {
    req.log?.error?.("googleAuth error:", err);
    next(err);
  }
};

/**
 * GET /api/auth/google/callback
 */
export const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) return res.redirect(`${getFrontendBase()}/signin?error=oauth_failed`);
    try {
      const token = signJwt({ id: user._id });

      let rememberMe = false;
      let nextPath = "/choose";

      const { state } = req.query;
      if (state === "1" || state === "0" || state === undefined) {
        rememberMe = state === "1";
      } else {
        const parsed = decodeState(state);
        if (parsed) {
          rememberMe = parsed.remember === "1" || parsed.remember === true || parsed.remember === "true";
          nextPath = sanitizeNextPath(parsed.next) || "/choose";
        }
      }

      // Use helper so we ALSO set csrfToken cookie (double-submit)
      setAuthCookie(res, token, { remember: !!rememberMe });

      res.setHeader("Cache-Control", "no-store");
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
    clearAuthCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id name email avatar plan planStartedAt planExpiresAt country phone skills projects slug bio"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.plan !== "free" && user.planExpiresAt && Date.now() > user.planExpiresAt) {
      user.plan = "free";
      user.planExpiresAt = null;
      await user.save();
    }

    res.json({ user });
  } catch (err) {
    req.log?.error?.("authController.me error:", err);
    next(err);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).select("notifications");
    res.json(me?.notifications || []);
  } catch (err) {
    next(err);
  }
};

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
    next(err);
  }
};

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
    next(err);
  }
};
