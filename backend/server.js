// server.js
// Full merge of your original server.js with security + CSRF + CSP fixes.
// No new env vars introduced. Keeps your logging, metrics, Redis limiter, passport, sockets, and routes.

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
import { connectDB } from "./config/mongodb.js";
import "./config/passport.js";
import { Server } from "socket.io";
import client from "prom-client";
import compression from "compression";

import pino from "pino";
import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";

// existing CSRF util from your repo (keeps your verify logic)
import { verifyDoubleSubmitCsrf } from "./utils/csrfMiddleware.js";

// existing socket guard util and models
import { verifyJwt } from "./utils/jwt.js";
import Task from "./models/taskModel.js";

// ---- express + server ----
const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
app.set("trust proxy", 1); // behind proxy (render/vercel) support

// ---- structured logging (pino) ----
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty", options: { colorize: true } }
});
const pinoHttpMiddleware = pinoHttp({
  logger,
  genReqId: (req) => {
    const headerId = req.headers["x-request-id"];
    return typeof headerId === "string" && headerId.length > 10 ? headerId : uuidv4();
  }
});
app.use(pinoHttpMiddleware);

// ---- Prometheus metrics (keep) ----
client.collectDefaultMetrics();
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 400, 800, 1600, 3200]
});
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(Date.now() - start);
  });
  next();
});

// ---- Security headers: Helmet + CSP (single source) ----
// This CSP is strict but allows:
// - three.js GLTF textures via blob:, workers via worker-src blob:, WASM via wasm-unsafe-eval/unsafe-eval
// - Razorpay checkout inline styles (style-src 'unsafe-inline' only for styles, not scripts)
// - fonts from Google, images from Cloudinary (as your app used)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'none'"],

      // scripts: self + Razorpay checkout + WASM eval for decoders
      "script-src": [
        "'self'",
        "https://checkout.razorpay.com",
        "'wasm-unsafe-eval'",
        "'unsafe-eval'"
      ],

      // styles: allow Google Fonts + inline styles (required for Razorpay)
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],

      // fonts
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],

      // images & textures including blob/data for GLTF textures
      "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],

      // connect: include blob: for loaders, razorpay api, and your backend/ws
      "connect-src": [
        "'self'",
        "blob:",
        "https://api.razorpay.com",
        "https://cyphire.onrender.com",
        "wss://cyphire.onrender.com"
      ],

      "worker-src": ["'self'", "blob:"],
      "child-src": ["'self'", "blob:"],
      "media-src": ["'self'", "data:", "blob:"],
      "frame-src": ["https://*.razorpay.com"],
      "upgrade-insecure-requests": []
    }
  }
}));

// small debug header so you can confirm server CSP in browser
app.use((req, res, next) => { res.setHeader("X-Cyphire-Server-CSP", "v2"); next(); });

// ---- Common middleware ----
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ---- Static uploads ----
app.use("/uploads", express.static("uploads"));

// ---- CORS (single place, no duplicates) ----
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://cyphire-frontend.vercel.app",
  "https://cyphire-workroom.vercel.app",
  "https://cyphire-admin.vercel.app",
];
function isVercelPreview(origin) {
  try { return /\.vercel\.app$/.test(new URL(origin).hostname); } catch { return false; }
}
app.use((req, res, next) => { res.header("Vary", "Origin"); next(); });
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || isVercelPreview(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token",
  "Cache-Control",        // ⬅️ add
  "Pragma",               // ⬅️ add (some clients send it)
  "If-Modified-Since",    // ⬅️ add (conditional GETs)
  "If-None-Match",        // ⬅️ add (ETag)
  "X-Requested-With"      // ⬅️ common with axios/jquery
  ]
}));

// ---- Rate limiter (keeps your logic, redis optional) ----
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: "Too many requests, please try again later.",
  ...(redisClient && { store: new RedisStore({ sendCommand: (...a) => redisClient.call(...a) }) })
});
app.use(limiter);

// ---- Socket.IO (keep your existing setup) ----
const io = new Server(server, {
  cors: {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || isVercelPreview(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true
  }
});

// socket auth via JWT (keeps your logic)
io.use((socket, next) => {
  try {
    const raw = socket.handshake.auth?.token || (socket.handshake.headers?.authorization || "").split(" ")[1];
    if (!raw) return next(new Error("Unauthorized"));
    const payload = verifyJwt(raw);
    socket.user = { _id: String(payload._id || payload.id), isAdmin: !!payload.isAdmin };
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  logger.info(`🔌 New client connected: ${socket.id}`);
  socket.on("workroom:join", async ({ workroomId }) => {
    try {
      const task = await Task.findOne({ workroomId }).select("createdBy selectedApplicant");
      if (!task) return socket.emit("error", "Workroom not found");
      const uid = socket.user?._id;
      const allowed = uid && (String(task.createdBy) === uid || String(task.selectedApplicant) === uid || socket.user.isAdmin);
      if (!allowed) return socket.emit("error", "Forbidden");
      socket.join(`workroom:${workroomId}`);
      socket.emit("joined", { ok: true });
    } catch (err) {
      socket.emit("error", "Join failed");
    }
  });

  socket.on("message:new", async ({ workroomId, text, attachments = [] }, ack) => {
    try {
      const task = await Task.findOne({ workroomId }).select("createdBy selectedApplicant");
      if (!task) return ack?.({ ok: false, error: "Workroom not found" });
      const uid = socket.user?._id;
      const allowed = uid && (String(task.createdBy) === uid || String(task.selectedApplicant) === uid || socket.user.isAdmin);
      if (!allowed) return ack?.({ ok: false, error: "Forbidden" });
      io.to(`workroom:${workroomId}`).emit("message:new", { text, attachments, sender: uid, createdAt: new Date().toISOString() });
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: "Failed" });
    }
  });

  socket.on("disconnect", () => {
    logger.info(`❌ Client disconnected: ${socket.id}`);
  });
});

// attach io to req
app.use((req, _res, next) => { req.io = io; next(); });

// ---- CSRF fix: ensure cookie BEFORE verifyDoubleSubmitCsrf ----
// Your existing verifyDoubleSubmitCsrf expects a cookie to be set; we ensure it here.
// We do NOT change verifyDoubleSubmitCsrf; we only issue the cookie if missing.
import crypto from "crypto";

function ensureCsrfCookie(req, res, next) {
  try {
    const name = "csrfToken";
    const cookieVal = req.cookies?.[name];
    const ok = typeof cookieVal === "string" && cookieVal.length >= 32;
    if (!ok) {
      const token = crypto.randomBytes(24).toString("base64url");
      res.cookie(name, token, {
        httpOnly: false, // readable by client-side JS for double-submit pattern (matches your existing util)
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 12 * 60 * 60 * 1000, // 12h
      });
    }
  } catch (err) {
    // do not block requests if cookie issuing fails
    logger.warn("ensureCsrfCookie failed", err);
  }
  return next();
}

// Use ensureCsrfCookie BEFORE your verifyDoubleSubmitCsrf middleware
app.use(ensureCsrfCookie);
app.use(verifyDoubleSubmitCsrf);

// ---- Health & metrics endpoints ----
app.get("/", (_req, res) => res.send("Cyphire API up"));
app.get("/readyz", (_req, res) => res.send("ready"));
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ---- Routes (kept exactly like your current file) ----
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

// ---- Global error handler ----
app.use((err, req, res, _next) => {
  req.log?.error?.(err);
  logger.error({ err, url: req.originalUrl }, "GLOBAL ERROR");
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
});

// ---- Start server: connect DB then listen ----
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`✅ Server + Socket.IO running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error("DB connect error", err);
  process.exit(1);
});

// ---- Graceful shutdown ----
function shutdown(signal) {
  logger.info(`Received ${signal} - shutting down`);
  server.close(() => {
    logger.info("HTTP server closed");
    try { if (io) io.close(); } catch {}
    try { if (redisClient) redisClient.quit(); } catch {}
    try {
      // if mongoose present, attempt clean close
      // eslint-disable-next-line global-require
      const mongoose = require("mongoose");
      if (mongoose?.connection?.close) mongoose.connection.close(false, () => logger.info("MongoDB closed"));
    } catch {}
    process.exit(0);
  });
}
["SIGINT", "SIGTERM"].forEach(sig => process.on(sig, () => shutdown(sig)));
