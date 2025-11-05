// controllers/adminController.js

import jwt from "jsonwebtoken";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import cloudinary from "cloudinary";
import WorkroomMessages from "../models/workroomMessageModel.js";
import mongoose from "mongoose";
import HelpTicket from "../models/helpTicketModel.js";
import HelpQuestion from "../models/helpQuestionModel.js";
import BlockedIp from "../models/blockedIpModel.js";


const signAdminJwt = () =>
  jwt.sign({ role: "admin" }, process.env.ADMIN_JWT_SECRET, { expiresIn: process.env.ADMIN_JWT_EXPIRES || "1h" });

// --- Audit Log (stub: expand to store in DB or send to logging service) ---
const logAdminAction = async (admin, action, details) => {
  // Example: store in a collection or use an external logging service
  // await AdminAuditLog.create({ adminId: admin._id, action, details, at: new Date() });
  // For now, just log:
  req.log.info(`[ADMIN AUDIT] ${admin?.email || "?"}: ${action}`, details);
};

// ----------- USER/PLAN/TASK MANAGEMENT -----------

export const getTotalUsers = async (_req, res) => {
  try { const total = await User.countDocuments(); res.json({ total }); }
  catch (err) { res.status(500).json({ error: "Failed to get user count" }); }
};

export const getTotalTasks = async (_req, res) => {
  try { const total = await Task.countDocuments(); res.json({ total }); }
  catch (err) { res.status(500).json({ error: "Failed to get task count" }); }
};

export const loginAdmin = (req, res) => {
  const { email, password, secret } = req.body;
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD &&
    secret === process.env.ADMIN_SECRET_KEY
  ) {
    const token = signAdminJwt();
    return res.json({ success: true, message: "Admin authenticated", token });
  }
  res.status(401).json({ error: "Invalid credentials" });
};

export const listAllUsers = async (_req, res) => {
  try {
    const users = await User.find({}, "name email plan slug _id createdAt planExpiresAt planStartedAt signupIp signinIpHistory");
    const now = new Date();
    const updatedUsers = await Promise.all(
      users.map(async (u) => {
        if (u.plan !== "free" && u.planExpiresAt && u.planExpiresAt < now) {
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
    req.log.error("listAllUsers error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const listUsersByIp = async (req, res) => {
  const { ip } = req.query;
  if (!ip) return res.status(400).json({ error: "IP required" });
  const users = await User.find({ signupIp: ip }).select("email name _id createdAt signupIp");
  res.json({ users });
};

export const blockIp = async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP required" });
  await BlockedIp.updateOne({ ip }, { ip }, { upsert: true });
  res.json({ success: true, message: `Blocked IP ${ip}` });
};

export const unblockIp = async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: "IP required" });
  await BlockedIp.deleteOne({ ip });
  res.json({ success: true, message: `Unblocked IP ${ip}` });
};

export const listBlockedIps = async (_req, res) => {
  const ips = await BlockedIp.find().select("ip -_id");
  res.json({ ips: ips.map((x) => x.ip) });
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Delete tasks by user, remove user from applicants, delete avatar, then user
    const tasks = await Task.find({ createdBy: id });
    for (const task of tasks) {
      if (task.attachments?.length > 0) {
        for (const file of task.attachments) {
          try { await cloudinary.v2.uploader.destroy(file.public_id); }
          catch (err) { req.log.error("Cloudinary delete error:", err); }
        }
      }
      if (task.workroomId) {
        await WorkroomMessages.findOneAndDelete({ workroomId: task.workroomId });
      }
      await Task.findByIdAndDelete(task._id);
    }
    await Task.updateMany({ applicants: id }, { $pull: { applicants: id } });
    if (user.avatar?.public_id) {
      try { await cloudinary.v2.uploader.destroy(user.avatar.public_id); }
      catch (err) { req.log.error("Cloudinary avatar delete error:", err); }
    }
    await User.findByIdAndDelete(id);

    res.json({ message: "User and related data deleted successfully" });
  } catch (err) {
    req.log.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const listAllTasks = async (_req, res) => {
  try {
    const tasks = await Task.find()
      .populate("createdBy", "name email plan slug")
      .populate("selectedApplicant", "name email plan slug")
      .populate("applicants", "name email slug")
      .sort({ createdAt: -1 })
      .select("title description category price deadline status flagged createdBy selectedApplicant applicants attachments workroomId createdAt updatedAt");
    res.json(tasks);
  } catch (err) {
    req.log.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

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

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.attachments?.length > 0) {
      for (const file of task.attachments) {
        try { await cloudinary.v2.uploader.destroy(file.public_id); }
        catch (err) { req.log.error("Cloudinary delete error:", err); }
      }
    }
    if (task.workroomId) {
      try { await WorkroomMessages.findOneAndDelete({ workroomId: task.workroomId }); }
      catch (err) { req.log.error("WorkroomMessages delete error:", err); }
    }
    await Task.findByIdAndDelete(id);
    res.json({ message: "Task and related data deleted successfully" });
  } catch (err) {
    req.log.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

export const flagTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndUpdate(id, { flagged: true }, { new: true });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task flagged", task });
  } catch (err) {
    res.status(500).json({ error: "Failed to flag task" });
  }
};

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
      plan === "free"
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await user.save();
    res.json({ success: true, plan: user.plan, planExpiresAt: user.planExpiresAt });
  } catch (err) {
    req.log.error("setUserPlan error:", err);
    res.status(500).json({ error: "Failed to set user plan" });
  }
};

// ----------- TICKETS -----------

export const listAllTickets = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      HelpTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      HelpTicket.countDocuments(filter)
    ]);
    res.json({ tickets, total });
  } catch (err) {
    req.log.error("listAllTickets error:", err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

export const getTicketByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await HelpTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

export const replyToTicketAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];
    const author = {
      _id: req.admin._id,
      role: "admin",
      name: req.admin.name,
      avatar: req.admin.avatar || ""
    };
    const comment = { author, text, files: [], createdAt: new Date() };
    const ticket = await HelpTicket.findByIdAndUpdate(
      id,
      { $push: { comments: comment }, status: "in-progress" },
      { new: true }
    );
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: "Failed to reply" });
  }
};

// ----------- HELP CENTER Q&A MANAGEMENT -----------

export const listAllQuestions = async (req, res) => {
  try {
    // Optionally: support search/filter
    const { status, user, keyword, page = 1, limit = 40 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (user) filter.user = user;
    if (keyword) filter.question = { $regex: keyword, $options: "i" };
    const skip = (Number(page) - 1) * Number(limit);
    const questions = await HelpQuestion.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ items: questions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const answerQuestionAdmin = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized: admin not found" });
    }
    const { id } = req.params;
    const { answer } = req.body;
    if (!answer || answer.trim().length < 8) {
      return res.status(400).json({ error: "Answer too short" });
    }
    const question = await HelpQuestion.findByIdAndUpdate(
      id,
      { answer, status: "answered", answeredBy: req.admin._id, answeredAt: new Date() },
      { new: true }
    );
    // Audit log
    await logAdminAction(req.admin, "ANSWER_HELP_QUESTION", { questionId: id, answer });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: "Failed to answer question" });
  }
};

export const toggleShowOnHelpPage = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized: admin not found" });
    }
    const { id } = req.params;
    const { show } = req.body;
    const q = await HelpQuestion.findByIdAndUpdate(
      id,
      { showOnHelpPage: !!show },
      { new: true }
    );
    await logAdminAction(req.admin, "TOGGLE_SHOW_ON_HELP_PAGE", { questionId: id, show: !!show });
    res.json({ question: q });
  } catch (e) {
    res.status(500).json({ error: "Failed to update visibility" });
  }
};

export const editAnswerAdmin = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized: admin not found" });
    }
    const { id } = req.params;
    const { answer } = req.body;
    if (!answer || answer.trim().length < 8) {
      return res.status(400).json({ error: "Answer too short" });
    }
    const q = await HelpQuestion.findByIdAndUpdate(
      id,
      { answer, answeredAt: new Date() },
      { new: true }
    );
    await logAdminAction(req.admin, "EDIT_HELP_QUESTION_ANSWER", { questionId: id, answer });
    res.json({ question: q });
  } catch (e) {
    res.status(500).json({ error: "Failed to edit answer" });
  }
};
