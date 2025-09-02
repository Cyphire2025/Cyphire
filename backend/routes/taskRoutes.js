// backend/routes/taskRoutes.js
import express from "express";
import { upload } from "../middlewares/uploadMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createTask,
  getTasks,
  getMyTasks,     // ← if you don't have this implemented, remove this import and its route below
  getTaskById,
  applyToTask,
  selectApplicant, // ← new controller for selecting an applicant
} from "../controllers/taskController.js";

const router = express.Router();

// Create a task (auth) + attachments via multer
// router.post("/", protect, upload.array("attachments"), createTask);

// Public: list tasks
router.get("/", getTasks);

// Auth: tasks created by the logged-in user (optional)
router.get("/mine", protect, getMyTasks);

// Public: single task by id
router.get("/:id", getTaskById);

// Auth: select an applicant for a task (owner only)
router.post("/:id/select", protect, selectApplicant);

// Auth: apply to a task
router.post("/:id/apply", protect, applyToTask);

export default router;
