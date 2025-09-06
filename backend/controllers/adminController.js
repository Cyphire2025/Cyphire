import jwt from "jsonwebtoken";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import cloudinary from "cloudinary";
import WorkroomMessages from "../models/workroomMessageModel.js"; // ✅ correct model

// ---- Helper: sign admin JWT ----
const signAdminJwt = () =>
  jwt.sign(
    { role: "admin" },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES || "1h" }
  );

// ---- Stats ----
export const getTotalUsers = async (_req, res) => {
  try {
    const total = await User.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Failed to get user count" });
  }
};

export const getTotalTasks = async (_req, res) => {
  try {
    const total = await Task.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Failed to get task count" });
  }
};

// ---- Admin login ----
export const loginAdmin = (req, res) => {
  const { email, password, secret } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD &&
    secret === process.env.ADMIN_SECRET_KEY
  ) {
    const token = signAdminJwt();
    return res.json({
      success: true,
      message: "Admin authenticated",
      token,
    });
  }

  res.status(401).json({ error: "Invalid credentials" });
};

// ---- Admin: list all users ----
export const listAllUsers = async (_req, res) => {
  try {
    const users = await User.find(
      {},
      "name email plan slug _id createdAt planExpiresAt planStartedAt"
    );

    const now = new Date();

    const updatedUsers = await Promise.all(
      users.map(async (u) => {
        if (u.plan !== "free" && u.planExpiresAt && u.planExpiresAt < now) {
          // auto-downgrade expired plans
          u.plan = "free";
          u.planStartedAt = null;
          u.planExpiresAt = null;
          await u.save();
        }
        return u;
      })
    );

    res.json(updatedUsers);
  } catch (err) {
    console.error("listAllUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ---- Admin: delete a user and all related data ----
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Delete tasks created by this user
    const tasks = await Task.find({ createdBy: id });
    for (const task of tasks) {
      // Delete attachments from Cloudinary
      if (task.attachments?.length > 0) {
        for (const file of task.attachments) {
          try {
            await cloudinary.v2.uploader.destroy(file.public_id);
          } catch (err) {
            console.error("Cloudinary delete error:", err);
          }
        }
      }
      // Delete workroom chats
      if (task.workroomId) {
        await WorkroomMessages.findOneAndDelete({ workroomId: task.workroomId });
      }
      await Task.findByIdAndDelete(task._id);
    }

    // 2. Remove this user from applicants arrays in other tasks
    await Task.updateMany({ applicants: id }, { $pull: { applicants: id } });

    // 3. Delete user avatar from Cloudinary (if stored)
    if (user.avatar?.public_id) {
      try {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      } catch (err) {
        console.error("Cloudinary avatar delete error:", err);
      }
    }

    // 4. Delete the user itself
    await User.findByIdAndDelete(id);

    res.json({ message: "User and related data deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// ---- Admin: list all tasks ----
export const listAllTasks = async (_req, res) => {
  try {
    const tasks = await Task.find()
      .populate("createdBy", "name email plan slug")
      .populate("selectedApplicant", "name email plan slug")
      .populate("applicants", "name email slug")
      .sort({ createdAt: -1 })
      .select(
        "title description category price deadline status flagged createdBy selectedApplicant applicants attachments workroomId createdAt updatedAt"
      );

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// ---- Admin: update task status ----
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "in-progress", "completed", "disputed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task status updated", task });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task status" });
  }
};

// ---- Admin: delete a task ----
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // 1. Delete attachments from Cloudinary
    if (task.attachments?.length > 0) {
      for (const file of task.attachments) {
        try {
          await cloudinary.v2.uploader.destroy(file.public_id);
        } catch (err) {
          console.error("Cloudinary delete error:", err);
        }
      }
    }

    // 2. Delete related WorkroomMessages
    if (task.workroomId) {
      try {
        await WorkroomMessages.findOneAndDelete({ workroomId: task.workroomId });
      } catch (err) {
        console.error("WorkroomMessages delete error:", err);
      }
    }

    // 3. Delete the task itself
    await Task.findByIdAndDelete(id);

    res.json({ message: "Task and related data deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// ---- Admin: flag a task ----
export const flagTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(
      id,
      { flagged: true },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task flagged", task });
  } catch (err) {
    res.status(500).json({ error: "Failed to flag task" });
  }
};

// ---- Admin: set user plan ----
export const setUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!["free", "plus", "ultra"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.plan = plan;
    user.planStartedAt = new Date();
    user.planExpiresAt =
      plan === "free" ? null : new Date(Date.now() + 10 * 1000); // 30 days

    await user.save();

    res.json({
      success: true,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
    });
  } catch (err) {
    console.error("setUserPlan error:", err);
    res.status(500).json({ error: "Failed to set user plan" });
  }
};
