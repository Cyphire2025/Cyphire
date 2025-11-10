// server.js
// Cyphire API – hardened for Vercel (frontend) → Render (backend) with CSRF, CORS, CSP, sockets.
// Paste this whole file. No TODOs, no placeholders.

import dotenv from "dotenv";
dotenv.config(); // must be first

import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import passport from "passport";
import { Server } from "socket.io";
import crypto from "crypto";

// metrics & logging (optional but kept production-friendly)
import client from "prom-client";
import pino from "pino";
import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";

// DB + auth + models
import { connectDB } from "./config/mongodb.js";
import "./config/passport.js";
import { verifyJwt } from "./utils/jwt.js";
import Task from "./models/taskModel.js";

// CSRF middleware from your utils (double-submit validator)
import { verifyDoubleSubmitCsrf } from "./utils/csrfMiddleware.js";

// Routes (keep all existing)
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

// ───────────────────────────────────────────────────────────────────────────────
// App & HTTP server
// ───────────────────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

app.set("trust proxy", 1); // required behind Render/Cloudflare

// ───────────────────────────────────────────────────────────────────────────────
// Structured logging (pino) + HTTP trace IDs
// ───────────────────────────────────────────────────────────────────────────────
const logger = pino({
  level: process.env.LOG_LEVEL || (IS_PROD ? "info" : "debug"),
  transport: IS_PROD ? undefined : { target: "pino-pretty", options: { colorize: true } },
});
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"]?.toString() || uuidv4(),
  })
);

// ───────────────────────────────────────────────────────────────────────────────
// Prometheus basic metrics
// ───────────────────────────────────────────────────────────────────────────────
client.collectDefaultMetrics();
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 400, 800, 1600, 3200],
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(Date.now() - start);
  });
  next();
});

// ───────────────────────────────────────────────────────────────────────────────
// Security headers (Helmet) + CSP tuned for your stack
// ───────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "object-src": ["'none'"],
        "frame-ancestors": ["'none'"],

        // Scripts: app + Razorpay; allow wasm eval for decoders & three.js loaders
        "script-src": ["'self'", "https://checkout.razorpay.com", "'wasm-unsafe-eval'", "'unsafe-eval'"],

        // Styles: Google Fonts requires 'unsafe-inline' for styles
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],

        // Fonts & images
        "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
        "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],

        // Connect: include your API + Razorpay + blob; also WS for sockets
        "connect-src": [
          "'self'",
          "blob:",
          "https://api.razorpay.com",
          "https://cyphire.onrender.com",
          "wss://cyphire.onrender.com",
        ],

        "worker-src": ["'self'", "blob:"],
        "child-src": ["'self'", "blob:"],
        "media-src": ["'self'", "data:", "blob:"],
        "frame-src": ["https://*.razorpay.com"],
        "upgrade-insecure-requests": [],
      },
    },
  })
);

// helps you confirm CSP actually comes from server
app.use((_, res, next) => {
  res.setHeader("X-Cyphire-Server-CSP", "v2");
  next();
});

// ───────────────────────────────────────────────────────────────────────────────
// Core middleware
// ───────────────────────────────────────────────────────────────────────────────
app.use(compression());
app.use(morgan(IS_PROD ? "combined" : "dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/uploads", express.static("uploads"));

// ───────────────────────────────────────────────────────────────────────────────
// CORS for Vercel (prod + previews) and local dev
// ───────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://cyphire-frontend.vercel.app",
  "https://cyphire-workroom.vercel.app",
  "https://cyphire-admin.vercel.app",
]);
const isVercelPreview = (origin) => {
  try {
    return /\.vercel\.app$/i.test(new URL(origin).hostname);
  } catch {
    return false;
  }
};

app.use((_, res, next) => {
  // better cache behavior with varying origins
  res.header("Vary", "Origin");
  next();
});

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // server-to-server / curl
      if (ALLOWED_ORIGINS.has(origin) || isVercelPreview(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
      "Cache-Control",
      "Pragma",
      "If-Modified-Since",
      "If-None-Match",
    ],
  })
);

// ───────────────────────────────────────────────────────────────────────────────
/**
 * CSRF: issue readable cookie early (SameSite=None; Secure in prod),
 * provide `/csrf-token` for the SPA to fetch, then verify on unsafe methods.
 * This matches your double-submit strategy and works cross-site (Vercel → Render).
 */
// ───────────────────────────────────────────────────────────────────────────────
function ensureCsrfCookie(req, res, next) {
  const name = "csrfToken";
  const existing = req.cookies?.[name];
  if (!existing || typeof existing !== "string" || existing.length < 32) {
    const token = crypto.randomBytes(32).toString("base64url");
    res.cookie(name, token, {
      httpOnly: false, // SPA must read it (via /csrf-token)
      sameSite: IS_PROD ? "none" : "lax",
      secure: IS_PROD,
      path: "/",
      maxAge: 12 * 60 * 60 * 1000, // 12h
    });
  }
  next();
}

// 1) mint/refresh cookie for everyone
app.use(ensureCsrfCookie);

// 2) SPA reads the token here (your frontend helper should call this)
app.get("/csrf-token", (req, res) => {
  res.json({ csrfToken: req.cookies?.csrfToken || null });
});

// 3) verify header vs cookie on unsafe methods
app.use(verifyDoubleSubmitCsrf);

// ───────────────────────────────────────────────────────────────────────────────
// Health & metrics
// ───────────────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.send("Cyphire API up"));
app.get("/readyz", (_req, res) => res.send("ready"));
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ───────────────────────────────────────────────────────────────────────────────
// REST routes
// ───────────────────────────────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────────────────────────────
// Socket.IO (JWT auth; restrict rooms to task owner/assignee/admin)
// ───────────────────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.has(origin) || isVercelPreview(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const raw =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || "").split(" ")[1];
    if (!raw) return next(new Error("Unauthorized"));
    const payload = verifyJwt(raw);
    socket.user = { _id: String(payload._id || payload.id), isAdmin: !!payload.isAdmin };
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  logger.info(`🔌 socket connected ${socket.id}`);

  socket.on("workroom:join", async ({ workroomId }) => {
    try {
      const task = await Task.findOne({ workroomId }).select("createdBy selectedApplicant");
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
      const task = await Task.findOne({ workroomId }).select("createdBy selectedApplicant");
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

  socket.on("disconnect", () => logger.info(`❌ socket disconnected ${socket.id}`));
});

// make io available in routes if needed
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ───────────────────────────────────────────────────────────────────────────────
// Global error handler
// ───────────────────────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  req.log?.error?.(err);
  logger.error({ err, url: req.originalUrl }, "GLOBAL ERROR");
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    stack: IS_PROD ? undefined : err.stack,
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Start
// ───────────────────────────────────────────────────────────────────────────────
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.info(`✅ API & Sockets listening on :${PORT}`);
    });
  })
  .catch((err) => {
    logger.error({ err }, "Mongo connection failed");
    process.exit(1);
  });

// graceful shutdown
["SIGINT", "SIGTERM"].forEach((sig) =>
  process.on(sig, () => {
    logger.info(`↪ shutting down on ${sig}`);
    server.close(() => {
      try {
        const mongoose = require("mongoose");
        if (mongoose?.connection?.close) {
          mongoose.connection.close(false, () => logger.info("MongoDB closed"));
        }
      } catch {}
      process.exit(0);
    });
  })
);
