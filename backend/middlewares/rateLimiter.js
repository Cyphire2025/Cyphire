// backend/middlewares/rateLimiter.js
import rateLimit from "express-rate-limit";

export const limitApplications = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 submissions / 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// // backend/middlewares/authRateLimiter.js
// import rateLimit from "express-rate-limit";
// import RedisStore from "rate-limit-redis";
// import { createClient } from "redis";

// const redis = createClient({
//   url: process.env.REDIS_URL || "redis://localhost:6379",
// });
// redis.on("error", (e) => console.error("Redis error", e));
// await redis.connect();

// // Helper to build a composite key
// function keyGenerator(req /*, res*/) {
//   const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "ip_na";
//   const dfp = req.headers["x-device-fingerprint"] || "dfp_na";
//   const uid = req.user?.id || "anon";
//   return `${ip}:${dfp}:${uid}`;
// }

// export const authStrictLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 20,                  // 20 auth attempts / 10 min across IP+DFP+user
//   standardHeaders: true,
//   legacyHeaders: false,
//   keyGenerator,
//   store: new RedisStore({
//     sendCommand: (...args) => redis.sendCommand(args),
//     prefix: "rl:auth:",
//   }),
//   message: { error: "Too many attempts. Please slow down and try again shortly." },
// });

// // Optional: slow-down middleware (after limiter) to increase latency on bursts
// import slowDown from "express-slow-down";
// export const authSlowDown = slowDown({
//   windowMs: 10 * 60 * 1000,
//   delayAfter: 10,             // allow 10 requests at full speed
//   delayMs: (hits) => Math.min(2000, (hits - 10) * 150), // then add 150ms per hit, capped
//   keyGenerator,
// });
