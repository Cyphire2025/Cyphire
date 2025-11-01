import { z } from "zod";

// User submits a help question
export const askQuestionSchema = z.object({
  question: z.string().min(8, "Question must be at least 8 characters"),
});

// Create help ticket
export const createTicketSchema = z.object({
  subject: z.string().min(4),
  description: z.string().min(12),
  type: z.enum([
    "payment",
    "task",
    "workroom",
    "account",
    "report",
    "other"
  ]),
  // Attachments handled by multer
});

// Add comment to ticket
export const postCommentSchema = z.object({
  text: z.string().min(1).max(2000),
  // Attachments handled by multer
});
