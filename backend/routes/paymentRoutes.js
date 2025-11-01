// routes/paymentRoutes.js

import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  createOrder,
  verifyPaymentAndCreateTask,
  verifyPaymentAndSelectApplicant,
} from "../controllers/paymentController.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import { validateBody } from "../middlewares/validate.js";
import {
  createOrderSchema,
  verifyPaymentAndCreateTaskSchema,
  verifyPaymentAndSelectApplicantSchema,
} from "../schemas/paymentSchemas.js";
import { requireFlag } from "../middlewares/flags.js";

// --- Advanced per-endpoint rate limiting setup ---
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

// Order creation (anti-fraud, anti-spam): e.g., 10/min per IP
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Too many payment orders created, please try again in a minute.",
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  }),
});

// Payment verification (very sensitive, e.g., 5/min per IP)
const verifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many payment verifications, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  }),
});

// Payment verification for applicant selection (e.g., 5/min per IP)
const selectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many selection attempts, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  }),
});

const router = express.Router();
router.use(requireFlag("FLAG_PAYMENT", "1"));
// Public key endpoint (safe to expose; not a secret)
router.get("/public-key", (_req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  if (!keyId) return res.status(503).json({ error: "Payment temporarily unavailable" });
  return res.json({ keyId });
});

/*
|--------------------------------------------------------------------------  
| PAYMENT ROUTES (Google/Amazon-level structure)  
|--------------------------------------------------------------------------  
*/

// --- CREATE ORDER (initiate payment intent/order) ---
router.post(
  "/create-order",
  protect,
  orderLimiter,
  validateBody(createOrderSchema),
  createOrder
);

// --- VERIFY PAYMENT AND CREATE TASK (multi-part, with attachments) ---
router.post(
  "/verify-payment",
  protect,
  verifyLimiter,
  upload.array("attachments", 20),
  validateBody(verifyPaymentAndCreateTaskSchema),
  verifyPaymentAndCreateTask
);

// --- VERIFY PAYMENT AND SELECT APPLICANT ---
router.post(
  "/verify-and-select",
  protect,
  selectLimiter,
  validateBody(verifyPaymentAndSelectApplicantSchema),
  verifyPaymentAndSelectApplicant
);

export default router;
