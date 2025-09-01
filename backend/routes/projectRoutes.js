import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  createProject,
  uploadProjectMedia,
  getMyProjects,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, getMyProjects);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

// upload media (max 5)
router.post("/:id/media", protect, upload.array("files", 5), uploadProjectMedia);

export default router;
