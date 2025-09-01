// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ⬇️ include slug & bio so /api/auth/me returns them
    const user = await User.findById(decoded.id).select(
      "_id name email avatar avatarPublicId country phone skills projects slug bio createdAt updatedAt"
    );

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
// --- Admin-only JWT guard (for Admin Panel) ---
export const adminProtect = (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    const bearer = req.headers.authorization;
    const token = bearer?.startsWith("Bearer ")
      ? bearer.split(" ")[1]
      : (req.cookies?.admin_token || null);

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.admin = { role: "admin" };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
