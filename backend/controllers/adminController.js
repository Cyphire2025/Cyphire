import jwt from "jsonwebtoken";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";

const signAdminJwt = () =>
  jwt.sign(
    { role: "admin" },                       // minimal payload
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES || "1h" }
  );

// ---- Stats (unchanged) ----
export const getTotalUsers = async (req, res) => {
  try {
    const total = await User.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user count" });
  }
};

export const getTotalTasks = async (req, res) => {
  try {
    const total = await Task.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Failed to get task count" });
  }
};

// ---- Admin login -> returns a real JWT with expiry ----
export const loginAdmin = (req, res) => {
  const { email, password, secret } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD &&
    secret === process.env.ADMIN_SECRET_KEY
  ) {
    const token = jwt.sign(
      { role: "admin" },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Admin authenticated",
      token,
    });
  }

  res.status(401).json({ error: "Invalid credentials" });
};

// ---- Admin: list all users (for admin panel) ----
export const listAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "name email plan slug _id createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ---- Optional: in-memory IP ban list (keep your older behavior) ----
const bannedIPs = [];
export const banIP = (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "No IP provided" });
  if (!bannedIPs.includes(ip)) bannedIPs.push(ip);
  res.json({ message: `IP ${ip} banned`, bannedIPs });
};


