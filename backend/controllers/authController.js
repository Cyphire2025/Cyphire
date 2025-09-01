import bcrypt from "bcrypt";
import passport from "passport";
import User from "../models/userModel.js";
import { signJwt } from "../utils/jwt.js";

const setAuthCookie = (res, token, rememberMe) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
  if (rememberMe) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  }
  res.cookie("token", token, cookieOptions);
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
    setAuthCookie(res, token, !!rememberMe);

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
    setAuthCookie(res, token, !!rememberMe);

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
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
    state: remember,             // <- persist remember across the roundtrip
    prompt: "select_account",
  })(req, res, next);
};

// GET /api/auth/google/callback
export const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=oauth_failed`);
    }

    const token = signJwt({ id: user._id });
    // read remember from OAuth state (set in googleAuth above)
    const rememberMe = req.query.state === "1";

    // use the same cookie helper you already use for email sign-in
    setAuthCookie(res, token, !!rememberMe);  // sets httpOnly cookie + maxAge when remembered
    return res.redirect(`${process.env.FRONTEND_URL}/home`);
  })(req, res, next);
};

// POST /api/auth/signout
export const signout = async (_req, res) => {
  res.clearCookie("token");
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