// controllers/paymentController.js

import Razorpay from "razorpay";
import crypto from "crypto";
import Task from "../models/taskModel.js";
import cloudinary from "../utils/cloudinary.js";

// --- Razorpay instance: env check and fail-fast ---
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("[RAZORPAY] Missing credentials in env!");
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- Logger for audit and monitoring ---
const logger = {
  info: (...args) => req.log.info("[PAYMENT]", ...args),
  warn: (...args) => req.log.warn("[PAYMENT][WARN]", ...args),
  error: (...args) => req.log.error("[PAYMENT][ERROR]", ...args),
};

// --- Helper: upload one file (path or buffer) to Cloudinary ---
const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    if (file?.path) {
      cloudinary.uploader.upload(
        file.path,
        { resource_type: "auto", folder: "cyphire/tasks" },
        (err, result) => {
          if (err) {
            req.log.error("Cloudinary upload error:", err.message);
            return reject(err);
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || file.filename || "file",
            size: file.size || 0,
            contentType: file.mimetype || "application/octet-stream",
          });
        }
      );
      return;
    }
    if (file?.buffer) {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "cyphire/tasks" },
        (err, result) => {
          if (err) {
            req.log.error("Cloudinary upload error:", err.message);
            return reject(err);
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || "file",
            size: file.size || 0,
            contentType: file.mimetype || "application/octet-stream",
          });
        }
      );
      stream.end(file.buffer);
      return;
    }
    resolve(null);
  });

/**
 * POST /api/payment/create-order
 * Creates a new Razorpay order for the given amount.
 */
export const createOrder = async (req, res) => {
  try {
    const amount = parseInt(req.body.amount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      req.log.warn("Invalid amount for order:", req.body.amount);
      return res.status(400).json({ error: "Invalid amount" });
    }
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    req.log.info("Created Razorpay order:", order.id, "for amount:", amount);
    res.json(order);
  } catch (err) {
    req.log.error("createOrder error:", err.message);
    res.status(500).json({ error: "Failed to create order" });
  }
};

/**
 * POST /api/payment/verify-payment
 * Verifies a successful payment, then creates a Task with attachments.
 */
export const verifyPaymentAndCreateTask = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      req.log.warn("Invalid Razorpay signature:", razorpay_order_id);
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Collect fields
    const {
      title,
      description,
      numberOfApplicants,
      price,
      deadline,
      category,
      metadata,
    } = req.body;

    // Normalize categories
    const rawCats = []
      .concat(req.body["categories[]"] || [])
      .concat(req.body.categories || [])
      .concat(req.body.category || []);
    const categories = rawCats.flat().map(String).filter(Boolean);

    // Upload attachments
    const uploadedFiles = [];
    const files = Array.isArray(req.files) ? req.files : [];
    for (const f of files) {
      const uploaded = await uploadToCloudinary(f);
      if (uploaded) uploadedFiles.push(uploaded);
    }

    // Create task
    const task = await Task.create({
      title: String(title || "").trim(),
      description: String(description || "").trim(),
      category: categories,
      numberOfApplicants: Number(numberOfApplicants) || 0,
      price: Number(price) || 0,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: req.user._id,
      attachments: uploadedFiles,
      metadata: metadata ? JSON.parse(metadata) : {},
    });

    req.log.info("Created task after payment:", task._id, "by", req.user._id);

    return res.json({ success: true, task });
  } catch (err) {
    req.log.error("verifyPaymentAndCreateTask error:", err.message);
    res.status(500).json({ success: false, message: "Server error posting task" });
  }
};

/**
 * POST /api/payment/verify-and-select
 * Verifies Razorpay payment, then selects applicant on a task.
 */
export const verifyPaymentAndSelectApplicant = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, taskId, applicantId } = req.body;

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      req.log.warn("Invalid Razorpay signature for select:", razorpay_order_id);
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    const task = await Task.findById(taskId).populate("applicants", "_id name");
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });

    // Only owner can select
    if (String(task.createdBy) !== String(req.user._id)) {
      req.log.warn("Unauthorized select attempt by", req.user._id, "for task", taskId);
      return res.status(403).json({ success: false, error: "Only the task owner can select an applicant" });
    }

    // Ensure applicant applied
    const applied = (task.applicants || []).some(
      (a) => String(a._id || a) === String(applicantId)
    );
    if (!applied) return res.status(400).json({ success: false, error: "This user has not applied" });

    if (task.selectedApplicant) {
      return res.status(400).json({ success: false, error: "An applicant has already been selected" });
    }

    // Select applicant + create workroomId
    task.selectedApplicant = applicantId;
    const { getNextWorkroomId } = await import("../utils/getNextWorkroomId.js");
    task.workroomId = await getNextWorkroomId();
    await task.save();

    // Notifications (winner & all others)
    const User = (await import("../models/userModel.js")).default;
    const selectedId = String(applicantId);
    const title = task.title || "your task";
    const selectedMsg = `You’ve been selected for “${title}”.`;
    const rejectedMsg = `Update on “${title}”: you weren’t selected this time.`;

    await Promise.all(
      (task.applicants || []).map((a) => {
        const uid = String(a._id || a);
        const payload = {
          type: uid === selectedId ? "selection" : "rejection",
          message: uid === selectedId ? selectedMsg : rejectedMsg,
          link: "/dashboard?tab=myApplications",
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return User.updateOne(
          { _id: uid },
          { $push: { notifications: { $each: [payload], $position: 0 } } }
        ).exec();
      })
    );

    req.log.info("Applicant selected for task:", task._id, "applicant:", applicantId);

    return res.json({ success: true, task });
  } catch (err) {
    req.log.error("verifyPaymentAndSelectApplicant error:", err.message);
    res.status(500).json({ success: false, error: "Server error selecting applicant" });
  }
};
