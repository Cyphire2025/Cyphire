import dotenv from "dotenv";
dotenv.config(); // <-- MUST be first before any imports

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

// ---- Pino Logging (Production-Grade) ----
import pino from "pino";
import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";

// 🔐 CSRF middleware import
import { verifyDoubleSubmitCsrf } from "./utils/csrfMiddleware.js";

// 🔐 Socket guard deps
import { verifyJwt } from "./utils/jwt.js";
import Task from "./models/taskModel.js";

// ---- Express App + Server ----
const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// --- Structured Logging ---
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "production"
    ? undefined
    : { target: "pino-pretty", options: { colorize: true } }
});
const pinoHttpMiddleware = pinoHttp({
  logger,
  genReqId: (req) => {
    const headerId = req.headers["x-request-id"];
    return typeof headerId === "string" && headerId.length > 10 ? headerId : uuidv4();
  }
});
app.use(pinoHttpMiddleware);

// --- Prometheus Metrics ---
client.collectDefaultMetrics();
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 400, 800, 1600, 3200, 6400, 10000]
});
app.use((req, res, next) => {
  const startEpoch = Date.now();
  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    httpRequestDurationMicroseconds.labels(req.method, route, res.statusCode)
      .observe(Date.now() - startEpoch);
  });
  next();
});

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// ✅ Allow both frontend and admin origins
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
  } catch { return false; }
};
app.set("trust proxy", 1);

app.use((req, res, next) => { res.header("Vary", "Origin"); next(); });
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Static uploads
app.use("/uploads", express.static("uploads"));

// Advanced Rate Limiting
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: "Too many requests, please try again later.",
  ...(redisClient && { store: new RedisStore({ sendCommand: (...a) => redisClient.call(...a) }) }),
});
app.use(limiter);

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

// 🔐 Socket handshake auth (JWT required)
io.use((socket, next) => {
  try {
    const raw =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || "").split(" ")[1];
    if (!raw) return next(new Error("Unauthorized"));
    const payload = verifyJwt(raw); // should throw on invalid
    socket.user = { _id: String(payload._id || payload.id), isAdmin: !!payload.isAdmin };
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

// ----- Socket.io events -----
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

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

      // TODO: Persist message via WorkroomMessage model if desired
      io.to(`workroom:${workroomId}`).emit("message:new", {
        text, attachments, sender: uid, createdAt: new Date().toISOString(),
      });
      ack?.({ ok: true });
    } catch {
      ack?.({ ok: false, error: "Failed" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ----- Core Middleware (dup blocks kept to avoid breaking existing order) -----
app.use((req, res, next) => { res.header("Vary", "Origin"); next(); });
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use((req, _res, next) => { req.io = io; next(); });
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/uploads", express.static("uploads"));

// 🔐 CSRF: double-submit verification (after cookieParser, before routes)
app.use(verifyDoubleSubmitCsrf);

// ----- Health Check -----
app.get("/", (_req, res) => res.send("Cyphire API up"));

// Prometheus scrape endpoint
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// ----- Routes -----
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

// --- Global Error Handler ---
app.use((err, req, res, _next) => {
  req.log?.error?.(err);
  console.error("GLOBAL ERROR:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

// ----- Start Server -----
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`✅ Server + Socket.IO running on http://localhost:${PORT}`);
  });
});

// ---- Graceful Shutdown ----
function shutdown(signal) {
  logger.info(`[SHUTDOWN] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info("[SHUTDOWN] HTTP server closed.");
    if (io && io.close) io.close();
    if (redisClient && redisClient.quit) redisClient.quit();
    if (typeof mongoose !== "undefined" && mongoose.connection?.close) {
      mongoose.connection.close(false, () => {
        logger.info("[SHUTDOWN] MongoDB connection closed.");
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
