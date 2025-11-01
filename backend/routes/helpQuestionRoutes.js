// routes/helpQuestionRoutes.js
import express from "express";
import { askQuestion, getRecentQuestions } from "../controllers/helpQuestionController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { askQuestionSchema } from "../schemas/helpSchemas.js"; // create this schema for question input
import { requireFlag } from "../middlewares/flags.js";

const router = express.Router();
router.use(requireFlag("FLAG_HELP_QUESTION", "1"));
/**
 * POST   /api/help/questions    — User submits a question (protected)
 * GET    /api/help/questions    — User gets recent answered & public Qs
 */

// Ask a question (user must be authenticated)
router.post("/", protect, validateBody(askQuestionSchema), askQuestion);

// Get recently answered, visible questions (user/public)
router.get("/", getRecentQuestions);

export default router;
