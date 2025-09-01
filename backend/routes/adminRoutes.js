// routes/adminRoutes.js
import express from "express";
import {
  loginAdmin,
  getTotalUsers,
  getTotalTasks,
  banIP,
  listAllUsers,
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
router.post("/ban-ip", banIP);

// List all users (for admin panel user view)
router.get("/users", listAllUsers);


export default router;
