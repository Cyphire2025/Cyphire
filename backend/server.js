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

// ---- Express App + Server ----
const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// --- Structured Logging: MUST BE FIRST (before any routes, CORS, etc) ---
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV === "production"
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true }
      }
});
const pinoHttpMiddleware = pinoHttp({
  logger,
  genReqId: (req) => {
    const headerId = req.headers["x-request-id"];
    return typeof headerId === "string" && headerId.length > 10
      ? headerId
      : uuidv4();
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
    httpRequestDurationMicroseconds
      .labels(req.method, route, res.statusCode)
      .observe(Date.now() - startEpoch);
  });
  next();
});

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ✅ Allow both frontend and admin origins
const allowedOrigins = [
  "http://localhost:5173", // test frontend
  "http://localhost:5174", // test admin
  "http://localhost:5175", // test workroom
  "https://cyphire-frontend.vercel.app", // frontend
  "https://cyphire-workroom.vercel.app", // workroom
  "https://cyphire-admin.vercel.app", // admin
];

// small helper to also allow any Vercel preview
const isVercelPreview = (origin) => {
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && u.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};
// 🔐 Required on Render so Secure cookies are honored behind the proxy
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.header("Vary", "Origin");
  next();
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Static uploads
app.use("/uploads", express.static("uploads"));

// Advanced Rate Limiting (per-IP, per-route; uses Redis if available)
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null;

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200,
  message: "Too many requests, please try again later.",
  ...(redisClient && {
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
  }),
});

app.use(limiter);

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
});

// ----- Socket.io events -----
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("workroom:join", ({ workroomId }) => {
    const room = `workroom:${workroomId}`;
    socket.join(room);
    console.log(`👥 Socket ${socket.id} joined room ${room}`);
  });

  socket.on("message:new", (data) => {
    const { workroomId, ...message } = data;
    const room = `workroom:${workroomId}`;
    message.sender = data.userId;
    if (!message.createdAt) {
      message.createdAt = new Date().toISOString();
    }
    console.log(
      `📤 Broadcasting message to room ${room}:`,
      message._id || message.text
    );
    socket.to(room).emit("message:new", message);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ----- Core Middleware -----

// ensure caches/CDNs don’t mix responses between origins
app.use((req, res, next) => {
  res.header("Vary", "Origin");
  next();
});

// ✅ Fix: Dynamically allow known origins + vercel previews; allow credentials
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isVercelPreview(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// ----- Health Check -----
app.get("/", (_req, res) => res.send("Cyphire API up"));


// Prometheus scrape endpoint
app.get("/metrics", async (req, res) => {
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

app.use("/api/help", helpRoutes); // All /api/help/tickets and /api/help routes
app.use("/api/help/questions", helpQuestionRoutes); // All /api/help/questions routes

// --- Global Error Handler (Structured) ---
app.use((err, req, res, next) => {
  req.log?.error?.(err); // Use pino log if available
  // Log error in detail (can upgrade to Winston/Sentry)
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
    // Close Socket.IO
    if (io && io.close) io.close();
    // Close Redis if used
    if (redisClient && redisClient.quit) redisClient.quit();
    // If using mongoose, close DB connection:
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

// Listen for process signals
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
