import bcrypt from "bcrypt";
import passport from "passport";
import User from "../models/userModel.js";
import { signJwt } from "../utils/jwt.js";

const encodeState = (payload) =>
  Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const decodeState = (state) => {
  if (!state) return null;
  const normalized = state.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = Buffer.from(padded, "base64").toString("utf8");
  return JSON.parse(decoded);
};

const sanitizeNextPath = (value) => {
  if (typeof value !== "string") return "/choose";
  if (!value.startsWith("/")) return "/choose";
  try {
    const url = new URL(value, "http://placeholder.local");
    return url.pathname + (url.search || "") + (url.hash || "");
  } catch (_err) {
    return "/choose";
  }
};

const getFrontendBase = () => {
  const raw = process.env.FRONTEND_URL || "http://localhost:5173";
  return raw.replace(/\/$/, "");
};


// utils/setAuthCookie.js or inside authController.js
// keep this helper in authController.js (or utils)
const setAuthCookie = (req, res, token, remember = false) => {
  const maxAge = remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 6; // 30d or 6h
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",   // REQUIRED for cross-site (vercel.app -> onrender.com)
    secure: true,       // REQUIRED when SameSite=None
    path: "/",
    maxAge,
  });
};


// POST /api/auth/signup (email + password)
export const emailSignup = async (req, res) => {
  try {
    const { name, email, password, rememberMe } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email & password required" });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

    const token = signJwt({ id: user._id });
    setAuthCookie(req, res, token, /* remember= */ !!req.body.rememberMe);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (e) {
    console.error("emailSignup error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/signin (email + password)
export const emailSignin = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ id: user._id });
setAuthCookie(req, res, token, !!req.body.rememberMe);


    res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (e) {
    console.error("emailSignin error:", e);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/auth/google  (carry the remember flag via OAuth "state")
export const googleAuth = (req, res, next) => {
  const remember = req.query.remember === "1" ? "1" : "0";
  const nextPath = sanitizeNextPath(req.query.next);
  const state = encodeState({ remember, next: nextPath });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state,             // <- persist remember + next across the roundtrip
    prompt: "select_account",
  })(req, res, next);
};

// GET /api/auth/google/callback
// authController.js

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


// POST /api/auth/signout
export const signout = (_req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",      // must match the set cookie
  });
  res.json({ ok: true });
};



// GET /api/auth/me
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id name email avatar plan planStartedAt planExpiresAt country phone skills projects slug bio"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    // auto-downgrade if plan expired
    if (user.plan !== "free" && user.planExpiresAt && Date.now() > user.planExpiresAt) {
      user.plan = "free";
      user.planExpiresAt = null;
      await user.save();
    }

    res.json({ user });
  } catch (e) {
    console.error("authController.me error:", e);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};



// --- Notifications API ---
export const getNotifications = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select("notifications");
    res.json(me?.notifications || []);
  } catch (e) {
    res.status(500).json({ error: "Failed to load notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
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
  } catch (e) {
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// DELETE /api/auth/notifications/:idx
export const deleteNotification = async (req, res) => {
  const idx = Number(req.params.idx);
  const me = await User.findById(req.user._id).select("notifications");
  if (!me) return res.status(404).json({ error: "User not found" });
  if (!Number.isInteger(idx) || idx < 0 || idx >= me.notifications.length) {
    return res.status(400).json({ error: "Invalid index" });
  }
  me.notifications.splice(idx, 1);  // remove one at index
  await me.save();
  res.json({ ok: true });
};
