import { z } from "zod";

// User creates an intellectual application
export const createApplicationSchema = z.object({
  // Required main profile information, tweak as needed:
  profile: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    // add other required fields as needed
  }),
  type: z.enum([
    "professor",
    "influencer",
    "industry_expert",
    "coach"
  ]),
  // Any optional fields your flow collects:
  // e.g., achievements, university, etc.
  // Attachments handled by multer/coerceJson
});

// Admin: update application status
export const adminUpdateStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  // Any admin notes or metadata if needed
});

// Admin: add review note
export const adminAddReviewNoteSchema = z.object({
  note: z.string().min(3),
});
