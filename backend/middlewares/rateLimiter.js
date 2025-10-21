// backend/middlewares/rateLimiter.js
import rateLimit from "express-rate-limit";

export const limitApplications = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 submissions / 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
