// routes/paymentLogRoutes.js

import express from "express";
import { protect, adminProtect } from "../middlewares/authMiddleware.js";
import {
  createPaymentLog,
  getPaymentLogs,
  updatePaymentStatus,
} from "../controllers/paymentLogController.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import { validateBody } from "../middlewares/validate.js";
import { createPaymentLogSchema, updatePaymentStatusSchema } from "../schemas/paymentSchemas.js";
import { requireFlag } from "../middlewares/flags.js";

const router = express.Router();
router.use(requireFlag("FLAG_PAYMENT_LOG", "1"));

// Advanced rate limiting: use Redis in prod, fallback to in-memory for solo/dev
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

// Limit: Only 10 payout logs per user per hour
const payoutLogLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Too many payment log creations from this account, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  }),
});

// Admin actions: 60 admin payout actions/hour per IP (anti-bot)
const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: "Too many admin payment log actions from your IP, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  }),
});

/*
|--------------------------------------------------------------------------  
| PAYMENT LOG ROUTES (Google/Amazon-level structure)  
|--------------------------------------------------------------------------  
*/

// ⭐ Freelancer: create a payment log
router.post(
  "/workrooms/:workroomId/payment-log",
  protect,
  payoutLogLimiter,
  validateBody(createPaymentLogSchema),
  createPaymentLog
);

// ⭐ Admin: fetch all logs
router.get(
  "/admin/payments",
  adminProtect,
  adminLimiter,
  getPaymentLogs
);

// ⭐ Admin: mark paid/unpaid
router.patch(
  "/admin/payments/:id/status",
  adminProtect,
  adminLimiter,
  validateBody(updatePaymentStatusSchema),
  updatePaymentStatus
);

export default router;
