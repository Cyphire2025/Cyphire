import express from "express";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { limitApplications } from "../middlewares/rateLimiter.js";
import { coerceJson } from "../middlewares/coerceJson.js";

import IntellectualApplication from "../models/intellectualApplicationModel.js"; // <-- add this

import {
  createApplication,
  createApplicationSchema,
  getMyApplications,
  getApplicationById,
  adminListApplications,
  adminUpdateStatus,
  adminAddReviewNote,
} from "../controllers/intellectualsController.js";

const router = express.Router();

// === ADD THIS: GET all intellectuals, must come BEFORE any "/:id" routes
router.get("/", async (req, res) => {
  try {
    const all = await IntellectualApplication.find({})
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// User-facing
router.post(
  "/applications",
  protect,
  limitApplications,
  upload.array("attachments", 10),
  coerceJson(["profile", "professor", "influencer", "industry_expert", "coach"]),
  validate(createApplicationSchema),
  createApplication
);

router.get("/applications/mine", protect, getMyApplications);
router.get("/applications/:id", protect, getApplicationById);

// Admin-facing
router.get("/admin/applications", protect, requireAdmin, adminListApplications);
router.patch("/admin/applications/:id/status", protect, requireAdmin, adminUpdateStatus);
router.post("/admin/applications/:id/review-note", protect, requireAdmin, adminAddReviewNote);

export default router;
