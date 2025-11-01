// routes/workroomRoutes.js

import express from "express";
import { protect, requireAdmin } from "../middlewares/authMiddleware.js";
import {
  getWorkroomMeta,
  finaliseWorkroom,
  adminGetWorkroom,
} from "../controllers/workroomController.js";
import { requireFlag } from "../middlewares/flags.js";

/*
|--------------------------------------------------------------------------
| WORKROOM ROUTES
|--------------------------------------------------------------------------
| Secure endpoints for live workroom: meta info, finalisation, admin audit.
| All actions require authentication; admin audit endpoint requires admin role.
|--------------------------------------------------------------------------
*/

const router = express.Router();
router.use(requireFlag("FLAG_WORKROOM", "1"));

// Get meta info for a workroom (title, roles, finalisation status)
router.get("/:workroomId/meta", protect, getWorkroomMeta);

// Finalise workroom (client/worker confirmation)
router.post("/:workroomId/finalise", protect, finaliseWorkroom);

// Admin-only: Get full workroom data + chat
router.get("/:workroomId/admin", protect, requireAdmin, adminGetWorkroom);

export default router;
