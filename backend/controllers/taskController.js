// backend/controllers/taskController.js
import mongoose from "mongoose";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import cloudinary from "../utils/cloudinary.js"; // uses your utils/cloudinary.js config

// Helper: upload a single file buffer/path to Cloudinary
const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    // If multer gave us a path (disk storage), use uploader.upload
    if (file.path) {
      cloudinary.uploader.upload(
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
      return;
    }

    // If multer gave us a memory buffer, stream it
    if (file.buffer) {
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
      stream.end(file.buffer);
      return;
    }

    // Fallback: nothing to upload
    resolve(null);
  });

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      categories, // comes from frontend as categories[]
      numberOfApplicants,
      price,
      deadline,
      createdBy,
    } = req.body;

    // Normalize categories into an array (model uses `category`)
    const normalizedCategory = Array.isArray(categories)
      ? categories
      : Array.isArray(category)
        ? category
        : category
          ? [category]
          : [];

    // Upload attachments (if any)
    const uploadedFiles = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        const uploaded = await uploadToCloudinary(f);
        if (uploaded) uploadedFiles.push(uploaded);
      }
    }


    const newTask = await Task.create({
      title,
      description,
      category: normalizedCategory,
      numberOfApplicants: Number(numberOfApplicants) || 0,
      price: Number(price) || 0,
      deadline: deadline ? new Date(deadline) : null,
      createdBy: req.user._id, // ← trust server auth, not client
      attachments: uploadedFiles,
    });


    return res.status(201).json(newTask);
  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({ error: "Server error creating task" });
  }
};

// GET /api/tasks
export const getTasks = async (_req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "applicants",
        select: "name avatar slug",  // include slug for profile URL
      });

    return res.json(tasks);
  } catch (err) {
    console.error("getTasks error:", err);
    return res.status(500).json({ error: "Server error fetching tasks" });
  }
};


// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    return res.json(task);
  } catch (err) {
    console.error("getTaskById error:", err);
    return res.status(500).json({ error: "Server error fetching task" });
  }
};


// GET /api/tasks/mine  (tasks created by the logged-in user)
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "applicants",
        select: "name email avatar", // adjust fields as needed
        path: "applicants",
        select: "name avatar slug",
      });

    return res.json({ tasks });
  } catch (err) {
    console.error("getMyTasks error:", err);
    return res.status(500).json({ error: "Server error fetching my tasks" });
  }
};


export const applyToTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // 1) Block owner from applying
    if (String(task.createdBy) === String(req.user._id)) {
      return res.status(400).json({ error: "You cannot apply to your own task" });
    }

    // 2) Prevent duplicates
    const already = task.applicants.some((u) => String(u) === String(req.user._id));
    if (already) {
      // 200 so the UI can just flip to "Applied"
      return res.status(200).json({ task, message: "Already applied" });
    }

    // 3) Enforce capacity (numberOfApplicants = max seats)
    const capacity = Number(task.numberOfApplicants) || 0; // 0 means unlimited
    if (capacity > 0 && task.applicants.length >= capacity) {
      return res.status(400).json({ error: "Applications are full" });
    }

    // 4) Apply
    task.applicants.push(req.user._id);

    // IMPORTANT: DO NOT set numberOfApplicants to the current length
    // It represents capacity, not count.

    await task.save();

    // Return minimal updated task so UI can refresh counts
    const updated = await Task.findById(id).select("_id applicants numberOfApplicants");
    return res.json({ task: updated });
  } catch (err) {
    console.error("applyToTask error:", err);
    return res.status(500).json({ error: "Server error applying to task" });
  }
};

// add below your imports


;
// POST /api/tasks/:id/select
// POST /api/tasks/:id/select
export const selectApplicant = async (req, res) => {
  try {
    const { id } = req.params;
    const { applicantId } = req.body;

    // Load the task with applicants
    const task = await Task.findById(id).populate("applicants", "_id name");
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only owner can select
    if (String(task.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ error: "Only the task owner can select an applicant" });
    }

    // Must be an actual applicant
    const applied = (task.applicants || []).some(a => String(a._id || a) === String(applicantId));
    if (!applied) return res.status(400).json({ error: "This user has not applied to the task" });

    // Only one selection allowed
    if (task.selectedApplicant) {
      return res.status(400).json({ error: "An applicant has already been selected" });
    }

    // Persist selection
    task.selectedApplicant = applicantId;
    task.workroomId = `wr_${task._id}_${applicantId}`;
    await task.save();

    // Build notifications
    const selectedId = String(applicantId);
    const title = task.title || "your task";
    const selectedMsg = `You’ve been selected for “${title}”. Open your applications to proceed.`;
    const rejectedMsg = `Update on “${title}”: you weren’t selected this time.`;

    // Fan-out notifications: selected + all others as rejection
    await Promise.all(
      (task.applicants || []).map(a => {
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

    // Return a lean task for UI merge
    const clean = await Task.findById(id).select(
      "_id title selectedApplicant workroomId createdBy applicants numberOfApplicants"
    );
    return res.json({ task: clean });
  } catch (err) {
    console.error("selectApplicant error:", err);
    return res.status(500).json({ error: "Server error selecting applicant" });
  }
};
