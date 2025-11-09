// server.js
import dotenv from "dotenv";
dotenv.config(); // MUST be first

import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import mongoose from "mongoose";
import { connectDB } from "./config/mongodb.js";
import "./config/passport.js";
import { Server } from "socket.io";
import client from "prom-client";

// ---- Pino Logging (Production-Grade) ----
import pino from "pino";
import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";

// 🔐 CSRF middleware
import { verifyDoubleSubmitCsrf } from "./utils/csrfMiddleware.js";
// 🔐 JWT verify for sockets
import { verifyJwt } from "./utils/jwt.js";
// For workroom access checks
import Task from "./models/taskModel.js";

// ---- App / Server ----
const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ---- Logging
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true } },
});
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => {
      const headerId = req.headers["x-request-id"];
      return typeof headerId === "string" && headerId.length > 10
        ? headerId
        : uuidv4();
    },
  })
);

// ---- Prometheus Metrics
client.collectDefaultMetrics();
const httpRequestDurationMs = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 400, 800, 1600, 3200, 6400, 10000],
});
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    httpRequestDurationMs
      .labels(req.method, route, String(res.statusCode))
      .observe(Date.now() - started);
  });
  next();
});

// ---- CSP (Content Security Policy) via Helmet
// If you add more third-party origins (analytics, Sentry, etc.), include them here.
const cspDirectives = {
  defaultSrc: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"], // clickjacking defense
  imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
  mediaSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  styleSrc: ["'self'", "https://fonts.googleapis.com"], // avoid 'unsafe-inline'
  scriptSrc: ["'self'", "https://checkout.razorpay.com"], // Razorpay Checkout
  connectSrc: [
    "'self'",
    "https://api.razorpay.com",
    // Add your backend WS origin if different from 'self' in frontends:
    ...(process.env.BACKEND_WS_ORIGIN ? [process.env.BACKEND_WS_ORIGIN] : []),
  ],
  frameSrc: ["https://*.razorpay.com"], // Razorpay iframes
  upgradeInsecureRequests: [],
};

// ---- Security Headers (Helmet)
// app.use(
//   helmet({
//     crossOriginResourcePolicy: false, // allow Cloudinary renders
//     contentSecurityPolicy: { useDefaults: true, directives: cspDirectives },
//     referrerPolicy: { policy: "no-referrer-when-downgrade" },
//     crossOriginOpenerPolicy: { policy: "same-origin" },
//     crossOriginEmbedderPolicy: false, // keep false unless COEP required

//     // 🚦 HTTP Security Header Pack
//     hsts: { maxAge: 63072000, includeSubDomains: true, preload: true }, // Strict-Transport-Security
//     noSniff: true,   // X-Content-Type-Options: nosniff
//     frameguard: { action: "deny" }, // X-Frame-Options: DENY
//     xssFilter: true, // adds X-XSS-Protection header (legacy)
//     permissionsPolicy: {
//       features: {
//         camera: ["none"],
//         microphone: ["none"],
//         geolocation: ["none"]
//       }
//     }
//   })
// );

app.use(helmet({
  // Keep other good headers on
  referrerPolicy: { policy: "no-referrer-when-downgrade" },
  frameguard: { action: "deny" },
  noSniff: true,
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },

  // R3F/three + WASM + Razorpay need COEP disabled in most setups
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,

  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'none'"],

      // Scripts: your app + Razorpay + WASM compile/eval paths
      "script-src": [
        "'self'",
        "https://checkout.razorpay.com",
        "'wasm-unsafe-eval'",
        "'unsafe-eval'"
      ],

      // Styles: allow Google Fonts + inline style attributes Razorpay/React use
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      // If you want maximum strictness while still working, you can split:
      // "style-src-elem": ["'self'", "https://fonts.googleapis.com"],
      // "style-src-attr": ["'unsafe-inline'"],

      // Fonts for Google Fonts
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],

      // Images & textures (three.js often uses blob/data URLs), Cloudinary CDN
      "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],

      // XHR/WebSocket targets + blob (for loaders/workers)
      "connect-src": [
        "'self'",
        "blob:",
        "https://api.razorpay.com",
        "https://cyphire.onrender.com",
        "wss://cyphire.onrender.com"
      ],

      // Workers (DRACO/KTX2/etc.) and children from blob:
      "worker-src": ["'self'", "blob:"],
      "child-src": ["'self'", "blob:"],

      // Media future-proofing
      "media-src": ["'self'", "data:", "blob:"],

      // Razorpay opens an iframe
      "frame-src": ["https://*.razorpay.com"],

      // Help avoid mixed content in case any http links sneak in
      "upgrade-insecure-requests": []
    }
  }
}));
// ---- CORS
app.set("trust proxy", 1);
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://cyphire-frontend.vercel.app",
  "https://cyphire-workroom.vercel.app",
  "https://cyphire-admin.vercel.app",
];
const isVercelPreview = (origin) => {
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};
app.use((_, res, next) => {
  res.header("Vary", "Origin"); // proper caching per-origin
  next();
});
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin))
        cb(null, true);
      else cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ---- Parsers / Auth
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ---- Static uploads (kept; consider moving to signed URLs later)
app.use("/uploads", express.static("uploads"));

// ---- Rate Limiting (Redis optional)
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;
const limiterOpts = {
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: "Too many requests, please try again later.",
};
if (redisClient) {
  limiterOpts.store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
}
app.use(rateLimit(limiterOpts));

// ---- Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin))
        return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

// 🔐 Socket handshake auth (JWT required)
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || "").split(" ")[1];
    if (!token) return next(new Error("Unauthorized"));
    const payload = verifyJwt(token); // throws if invalid
    socket.user = {
      _id: String(payload._id || payload.id),
      isAdmin: !!payload.isAdmin,
    };
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

// 🔐 Access-controlled rooms + messaging
io.on("connection", (socket) => {
  logger.info({ sid: socket.id }, "Socket connected");

  socket.on("workroom:join", async ({ workroomId }) => {
    try {
      const task = await Task.findOne({ workroomId }).select(
        "createdBy selectedApplicant"
      );
      if (!task) return socket.emit("error", "Workroom not found");

      const uid = socket.user?._id;
      const allowed =
        uid &&
        (String(task.createdBy) === uid ||
          String(task.selectedApplicant) === uid ||
          socket.user.isAdmin);
      if (!allowed) return socket.emit("error", "Forbidden");

      socket.join(`workroom:${workroomId}`);
      socket.emit("joined", { ok: true });
    } catch {
      socket.emit("error", "Join failed");
    }
  });

  socket.on("message:new", async ({ workroomId, text, attachments = [] }, ack) => {
    try {
      const task = await Task.findOne({ workroomId }).select(
        "createdBy selectedApplicant"
      );
      if (!task) return ack?.({ ok: false, error: "Workroom not found" });

      const uid = socket.user?._id;
      const allowed =
        uid &&
        (String(task.createdBy) === uid ||
          String(task.selectedApplicant) === uid ||
          socket.user.isAdmin);
      if (!allowed) return ack?.({ ok: false, error: "Forbidden" });

      io.to(`workroom:${workroomId}`).emit("message:new", {
        text,
        attachments,
        sender: uid,
        createdAt: new Date().toISOString(),
      });
      ack?.({ ok: true });
    } catch {
      ack?.({ ok: false, error: "Failed" });
    }
  });

  socket.on("disconnect", () => {
    logger.info({ sid: socket.id }, "Socket disconnected");
  });
});

// ---- CSRF (double-submit) — after cookieParser, before routes
app.use(verifyDoubleSubmitCsrf);

// ---- Health & Metrics
app.get("/", (_req, res) => res.send("Cyphire API up"));
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ---- Routes
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import intellectualsRoutes from "./routes/intellectualsRoutes.js";
import helpRoutes from "./routes/helpRoutes.js";
import helpQuestionRoutes from "./routes/helpQuestionRoutes.js";
import workroomRoutes from "./routes/workroomRoutes.js";
import workroomMessageRoutes from "./routes/workroomMessageRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import paymentLogRoutes from "./routes/paymentLogRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/intellectuals", intellectualsRoutes);
app.use("/api/workrooms", workroomRoutes);
app.use("/api/workrooms", workroomMessageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api", paymentLogRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/help/questions", helpQuestionRoutes);

// ---- Global Error Handler
app.use((err, req, res, _next) => {
  req.log?.error?.(err);
  logger.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

// ---- Start
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`✅ Server + Socket.IO running on http://localhost:${PORT}`);
  });
});

// ---- Graceful Shutdown
function shutdown(signal) {
  logger.info(`[SHUTDOWN] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info("[SHUTDOWN] HTTP server closed.");
    try {
      if (io && io.close) io.close();
      if (redisClient && redisClient.quit) redisClient.quit();
      if (mongoose.connection?.readyState)
        mongoose.connection.close(false, () => {
          logger.info("[SHUTDOWN] MongoDB connection closed.");
          process.exit(0);
        });
      else process.exit(0);
    } catch {
      process.exit(0);
    }
  });
}
["SIGINT", "SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));
