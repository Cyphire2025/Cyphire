// routes/authRoutes.js

import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  emailSignup,
  emailSignin,
  googleAuth,
  googleCallback,
  signout,
  me,
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from "../controllers/authController.js";
import { validateBody } from "../middlewares/validate.js";
import { signupSchema, signinSchema } from "../schemas/authSchemas.js";
import { requireFlag } from "../middlewares/flags.js";

const router = express.Router();

router.use(requireFlag("FLAG_AUTH", "1"));
/*
|--------------------------------------------------------------------------  
| AUTH ROUTES (Google/Amazon-level structure)  
|--------------------------------------------------------------------------  
| All auth, session, and notification endpoints.  
| Add per-endpoint rate limiting middleware where necessary for scale:  
|   e.g. router.post("/signin", rateLimiter({ windowMs: 15*60*1000, max: 25 }), emailSignin);  
|--------------------------------------------------------------------------  
*/

// --- Email/Password Authentication ---
router.post("/signup", validateBody(signupSchema), emailSignup);
router.post("/signin", validateBody(signinSchema), emailSignin);

// --- Google OAuth ---
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// --- Authenticated User Info & Session Control ---
router.get("/me", protect, me);
router.post("/signout", signout);

// --- Notifications ---
router.get("/notifications", protect, getNotifications);
router.post("/notifications/:idx/read", protect, markNotificationRead);
router.delete("/notifications/:idx", protect, deleteNotification);

export default router;
