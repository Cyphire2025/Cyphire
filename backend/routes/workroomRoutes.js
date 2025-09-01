// backend/routes/workroomRoutes.js
import express from "express";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";
import {
  getWorkroomMeta,
  finaliseWorkroom,
  adminGetWorkroom,
} from "../controllers/workroomController.js";

const router = express.Router();

// Get meta info for a workroom (title, roles, finalisation status)
router.get("/:workroomId/meta", protect, getWorkroomMeta);

// Finalise workroom (client/worker confirmation)
router.post("/:workroomId/finalise", protect, finaliseWorkroom);

// Admin-only: Get full workroom data + chat
router.get("/:workroomId/admin", protect, requireAdmin, adminGetWorkroom);

export default router;
