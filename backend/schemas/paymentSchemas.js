import { z } from "zod";

export const createOrderSchema = z.object({
  amount: z.coerce.number().min(1),
});

export const verifyPaymentAndCreateTaskSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().min(1),
  category: z.union([z.string(), z.array(z.string())]),
  numberOfApplicants: z.coerce.number().min(1),
  deadline: z.string().optional(),
  metadata: z.any().optional(),
});

export const verifyPaymentAndSelectApplicantSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  taskId: z.string().min(1),
  applicantId: z.string().min(1),
});

export const createPaymentLogSchema = z.object({
  upiId: z.string().regex(/@/, "Must be a valid UPI id"),
});

export const updatePaymentStatusSchema = z.object({
  paid: z.boolean(),
});
