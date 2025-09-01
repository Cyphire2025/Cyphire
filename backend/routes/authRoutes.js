import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  emailSignup,
  emailSignin,
  googleAuth,
  googleCallback,
  signout,
  me,
  getNotifications,       // ← add
  markNotificationRead, 
  deleteNotification,  // ← add
} from "../controllers/authController.js";

const router = express.Router();

// Email/password
router.post("/signup", emailSignup);
router.post("/signin", emailSignin);

// Google OAuth
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);

// Me + signout
router.get("/me", protect, me);
router.post("/signout", signout);

// NEW: Notifications
router.get("/notifications", protect, getNotifications);
router.post("/notifications/:idx/read", protect, markNotificationRead);
router.delete("/notifications/:idx", protect, deleteNotification);  // ← add

export default router;
