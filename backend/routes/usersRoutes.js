// routes/usersRoutes.js
import express from "express";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { checkPlanExpiry } from "../middlewares/checkPlanExpiry.js";
import {
  updateMe,
  updateAvatar,
  saveProjects,
  uploadProjectMedia,
  updateProject,
  deleteProject,
  deleteProjectMedia,
  ensureSlug,            // keep if you added public profiles
  publicProfileBySlug,   // keep if you added public profiles
  deleteUser,
  blockUser,
  setUserPlan,
  getAllUsers,
} from "../controllers/usersController.js";

const router = express.Router();

/* ===== Public endpoints ===== */
router.get("/slug/:slug/public", publicProfileBySlug);

/* ===== Protected (logged-in) user endpoints ===== */
router.use(protect, checkPlanExpiry);

// Profile fields
router.put("/me", updateMe);

// Avatar (single image)
router.post("/avatar", upload.single("avatar"), updateAvatar);

// Projects metadata (create/replace list)
router.post("/projects", saveProjects);

// Project media upload (max 5 files per project index 0..2)
router.post("/projects/:index/media", upload.array("files", 5), uploadProjectMedia);

// Edit / Delete a project by index
router.put("/projects/:index", updateProject);
router.delete("/projects/:index", deleteProject);

// Delete one media item from a project
router.delete("/projects/:index/media/:publicId", deleteProjectMedia);

// Slug (requires auth)
router.post("/slug", ensureSlug);

// Logged-in user updates their own plan
router.patch("/me/plan", setUserPlan);

/* ===== Admin-only endpoints ===== */
router.get("/", requireAdmin, getAllUsers);
router.delete("/:id", requireAdmin, deleteUser);
router.patch("/:id/block", requireAdmin, blockUser);
router.patch("/:id/plan", requireAdmin, setUserPlan);

export default router;
