// routes/adminRoutes.js
import express from "express";
import {
  loginAdmin,
  getTotalUsers,
  getTotalTasks,
  listAllUsers,
  deleteUser, 
  setUserPlan,
  listAllTasks,
  updateTaskStatus,
  deleteTask,
  flagTask,
} from "../controllers/adminController.js";
import { adminProtect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public route: Admin login
router.post("/login", loginAdmin);

// Protect everything below with admin JWT
router.use(adminProtect);

// Admin-only routes
router.get("/stats/users", getTotalUsers);
router.get("/stats/tasks", getTotalTasks);
router.get("/tasks", listAllTasks);
router.patch("/tasks/:id/status", updateTaskStatus);
router.delete("/tasks/:id", deleteTask);
router.patch("/tasks/:id/flag", flagTask);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/plan", setUserPlan);




// List all users (for admin panel user view)
router.get("/users", listAllUsers);


export default router;
