import express from "express";
import { protect, adminProtect } from "../middlewares/authMiddleware.js";
import { askQuestion, listQuestions, answerQuestion } from "../controllers/helpQuestionController.js";

const router = express.Router();

// Public: list all Q&As
router.get("/", listQuestions);

// User: ask a question
router.post("/", protect, askQuestion);

// Admin: answer a question
router.patch("/:id/answer", adminProtect, answerQuestion);

export default router;
