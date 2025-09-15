// controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Task from "../models/taskModel.js";
import cloudinary from "../utils/cloudinary.js"; // same as other controllers

// --- Razorpay instance ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --- helper: upload a single file (buffer or path) to Cloudinary ---
const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    // disk path (if ever used)
    if (file?.path) {
      return cloudinary.uploader.upload(
        file.path,
        { resource_type: "auto", folder: "cyphire/tasks" },
        (err, result) => {
          if (err) return reject(err);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || file.filename || "file",
            size: file.size || 0,
            contentType: file.mimetype || "application/octet-stream",
          });
        }
      );
    }
    // memory buffer (your default)
    if (file?.buffer) {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder: "cyphire/tasks" },
        (err, result) => {
          if (err) return reject(err);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || "file",
            size: file.size || 0,
            contentType: file.mimetype || "application/octet-stream",
          });
        }
      );
      return stream.end(file.buffer);
    }
    resolve(null);
  });

// --- POST /api/payment/create-order ---
export const createOrder = async (req, res) => {
  try {
    const amount = parseInt(req.body.amount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });
    res.json(order);
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// --- POST /api/payment/verify-payment ---
// multipart form-data with fields + attachments
export const verifyPaymentAndCreateTask = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // --- collect task fields from multipart body ---
    const {
      title,
      description,
      numberOfApplicants,
      price,
      deadline,
      category,
      metadata,
    } = req.body;

    // categories[] from form OR single category -> normalize to array
    // inside verifyPaymentAndCreateTask
    const rawCats = []
      .concat(req.body["categories[]"] || [])
      .concat(req.body.categories || [])
      .concat(req.body.category || []);

    const categories = rawCats.flat().map(String).filter(Boolean);


    // --- upload attachments if any ---
    const uploadedFiles = [];
    const files = Array.isArray(req.files) ? req.files : [];
    for (const f of files) {
      const uploaded = await uploadToCloudinary(f);
      if (uploaded) uploadedFiles.push(uploaded);
    }

    // --- create task ---
    const task = await Task.create({
      title: String(title || "").trim(),
      description: String(description || "").trim(),
      category: categories,
      numberOfApplicants: Number(numberOfApplicants) || 0,
      price: Number(price) || 0,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: req.user._id,
      attachments: uploadedFiles,
      metadata: metadata ? JSON.parse(metadata) : {}, // ✅ handle metadata
    });


    return res.json({ success: true, task });
  } catch (err) {
    console.error("verifyPaymentAndCreateTask error:", err);
    res.status(500).json({ success: false, message: "Server error posting task" });
  }
};

// --- POST /api/payment/verify-and-select ---
// verifies Razorpay payment AND selects an applicant in one step
export const verifyPaymentAndSelectApplicant = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, taskId, applicantId } = req.body;

    // 1) Verify Razorpay signature
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // 2) Find the task
    const task = await Task.findById(taskId).populate("applicants", "_id name");
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });

    // 3) Ensure requester is owner
    if (String(task.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: "Only the task owner can select an applicant" });
    }

    // 4) Ensure applicant actually applied
    const applied = (task.applicants || []).some(
      (a) => String(a._id || a) === String(applicantId)
    );
    if (!applied) return res.status(400).json({ success: false, error: "This user has not applied" });

    // 5) Prevent duplicate selection
    if (task.selectedApplicant) {
      return res.status(400).json({ success: false, error: "An applicant has already been selected" });
    }

    // 6) Select applicant + create workroomId
    task.selectedApplicant = applicantId;
    const { getNextWorkroomId } = await import("../utils/getNextWorkroomId.js");
    task.workroomId = await getNextWorkroomId();
    await task.save();

    // 7) Notifications
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

    return res.json({ success: true, task });
  } catch (err) {
    console.error("verifyPaymentAndSelectApplicant error:", err);
    res.status(500).json({ success: false, error: "Server error selecting applicant" });
  }
};
