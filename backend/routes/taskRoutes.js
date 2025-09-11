// backend/routes/taskRoutes.js
import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createTask,
  getTasks,
  getMyTasks,
  getTaskById,
  applyToTask,
  selectApplicant,
} from "../controllers/taskController.js";

const router = express.Router();

/* ===========================
   Routes
   =========================== */

// ✅ Create a new task (with attachments + metadata)
router.post("/", protect, upload.array("attachments", 20), createTask);

// ✅ Public: list all tasks
router.get("/", getTasks);

// ✅ Auth: list tasks created by the logged-in user
router.get("/mine", protect, getMyTasks);

// ✅ Public: get a single task by ID
router.get("/:id", getTaskById);

// ✅ Auth: select an applicant (task owner only)
router.post("/:id/select", protect, selectApplicant);

// ✅ Auth: apply to a task
router.post("/:id/apply", protect, applyToTask);

export default router;
