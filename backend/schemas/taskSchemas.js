import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().min(1),
  category: z.union([
    z.string().min(1),
    z.array(z.string().min(1)).min(1),
  ]),
  numberOfApplicants: z.coerce.number().min(1),
  deadline: z.string().datetime().optional(),
  // Optionally handle attachments/logo via multer, not here
  metadata: z.any().optional(),
  // Add any other required fields
});

export const applyTaskSchema = z.object({
  // You can leave this empty if no body is needed, else add fields
});

export const selectApplicantSchema = z.object({
  applicantId: z.string().min(1),
});
