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
  listAllTickets,
  getTicketByIdAdmin,
  replyToTicketAdmin,
  // --- Help Center Q&A Admin ---
  listAllQuestions,
  answerQuestionAdmin,
  editAnswerAdmin,
  toggleShowOnHelpPage,
} from "../controllers/adminController.js"; // or helpQuestionController.js for Q&A routes
import { adminProtect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * ADMIN ROUTES — All except /login are protected by admin JWT.
 */

// --- Admin Login (returns JWT) ---
router.post("/login", loginAdmin);

// --- Protect everything below with admin JWT ---
router.use(adminProtect);

// --- Stats, User, Task, Tickets Management (existing routes) ---
router.get("/stats/users", getTotalUsers);
router.get("/stats/tasks", getTotalTasks);
router.get("/tasks", listAllTasks);
router.patch("/tasks/:id/status", updateTaskStatus);
router.delete("/tasks/:id", deleteTask);
router.patch("/tasks/:id/flag", flagTask);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/plan", setUserPlan);
router.get("/users", listAllUsers);
router.get("/tickets", listAllTickets);
router.get("/tickets/:id", getTicketByIdAdmin);
router.post("/tickets/:id/reply", replyToTicketAdmin);

// --- Help Center Q&A Management ---
// Get all questions (with filters/search/pagination)
router.get("/questions", adminProtect, listAllQuestions);

// Answer a question (admin)
router.patch("/questions/:id/answer", adminProtect, answerQuestionAdmin);

// Edit an answer (admin)
router.patch("/questions/:id/edit", adminProtect, editAnswerAdmin);

// Toggle show/hide on Help Page (admin)
router.patch("/questions/:id/show", adminProtect, toggleShowOnHelpPage);

export default router;
