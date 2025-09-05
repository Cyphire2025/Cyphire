// server.js

import dotenv from "dotenv";
dotenv.config(); // <-- MUST be first before any imports

import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { connectDB } from "./config/mongodb.js";

// LOAD .env BEFORE importing passport config
import "./config/passport.js";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";

import workroomRoutes from "./routes/workroomRoutes.js";
import workroomMessageRoutes from "./routes/workroomMessageRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
import { Server } from "socket.io";

// ✅ Allow both frontend and admin origins
const allowedOrigins = [
  "http://localhost:5173",                        //test frontend
  "http://localhost:5174",                        //test admin
  "http://localhost:5175",                        //test workroom
  "https://cyphire-frontend.vercel.app",          //frontend    
  "https://cyphire-workroom.vercel.app"           //workroom   
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
    console.log(`📤 Broadcasting message to room ${room}:`, message._id || message.text);
    socket.to(room).emit("message:new", message);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ----- Core Middleware -----

// ✅ Fix: Dynamically allow known origins
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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

// ----- Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", usersRoutes);

app.use("/api/workrooms", workroomRoutes);
app.use("/api/workrooms", workroomMessageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
// ----- Start Server -----
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server + Socket.IO running on http://localhost:${PORT}`);
  });
});
