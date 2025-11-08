import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(3),            // align with controller check
  description: z.string().min(10),     // align with controller check

  category: z.union([
    z.string().min(1),
    z.array(z.string().min(1)).min(1),
  ]),

  // Make optional (Sponsorship posts don’t need these)
  price: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().nonnegative()
  ).optional(),

  numberOfApplicants: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().nonnegative()
  ).optional(),

  deadline: z.string().datetime().optional(),
  metadata: z.any().optional(),
});


export const applyTaskSchema = z.object({
  // You can leave this empty if no body is needed, else add fields
});

export const selectApplicantSchema = z.object({
  applicantId: z.string().min(1),
});
