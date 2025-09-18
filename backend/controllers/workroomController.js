// backend/controllers/workroomController.js
import Task from "../models/taskModel.js";
import cloudinary from "../utils/cloudinary.js";
import WorkroomMessages from "../models/workroomMessageModel.js";

// helper: upload memory or disk file to Cloudinary
const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    if (file?.path) {
      return cloudinary.uploader.upload(
        file.path,
        { resource_type: "auto", folder },
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
    if (file?.buffer) {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder },
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

const assertCanAccess = async (workroomId, userId) => {
  const task = await Task.findOne({ workroomId }).select(
    "_id title createdBy selectedApplicant clientFinalised workerFinalised finalisedAt workroomId"
  );
  if (!task) return { ok: false, code: 404, error: "Workroom not found" };
  const isOwner = String(task.createdBy) === String(userId);
  const isSelected = String(task.selectedApplicant || "") === String(userId);
  if (!isOwner && !isSelected) return { ok: false, code: 403, error: "Access denied" };
  return { ok: true, task, isOwner, isSelected };
};

/** GET /api/workrooms/:workroomId/meta */
export const getWorkroomMeta = async (req, res) => {
  try {
    const { workroomId } = req.params;
    const { ok, code, error, task, isOwner, isSelected } = await assertCanAccess(workroomId, req.user._id);
    if (!ok) return res.status(code).json({ error });

        res.json({
      workroomId,
      taskId: String(task._id),
      title: task.title,
      createdBy: String(task.createdBy),
      selectedApplicant: String(task.selectedApplicant || ""),
      clientFinalised: !!task.clientFinalised,
      workerFinalised: !!task.workerFinalised,
      finalisedAt: task.finalisedAt,
      role: isOwner ? "client" : "worker",
      paymentRequested: !!task.paymentRequested,   // ✅ add this
      upiId: task.upiId || "",                     // optional, if you want to show it
    });

  } catch (e) {
    console.error("getWorkroomMeta error", e);
    res.status(500).json({ error: "Failed to load workroom meta" });
  }
};

/** POST /api/workrooms/:workroomId/finalise */
export const finaliseWorkroom = async (req, res) => {
  const { workroomId } = req.params;
  const userId = String(req.user._id);

  const task = await Task.findOne({ workroomId });
  if (!task) return res.status(404).json({ error: "Task not found for workroom" });

  const isClient = String(task.createdBy) === userId;
  const isWorker = String(task.selectedApplicant) === userId;
  if (!isClient && !isWorker) return res.status(403).json({ error: "Not authorized for this workroom" });

  const update = {};
  if (isClient) update.clientFinalised = true;
  if (isWorker) update.workerFinalised = true;

  const updated = await Task.findOneAndUpdate({ _id: task._id }, { $set: update }, { new: true });
  const bothFinalised = updated.clientFinalised && updated.workerFinalised;

  if (bothFinalised && !updated.finalisedAt) {
    const finalTime = new Date();

    await Task.updateOne({ _id: task._id }, { finalisedAt: finalTime });

    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await WorkroomMessages.updateOne(
      { workroomId },
      { $set: { expireAt } }
    );

    req.io?.to(`workroom:${workroomId}`).emit("workroom:finalised", {
      workroomId,
      finalisedAt: finalTime,
    });
  }

  res.json({
    clientFinalised: updated.clientFinalised,
    workerFinalised: updated.workerFinalised,
    finalisedAt: updated.finalisedAt || null,
  });
};

/** POST /api/workrooms/:workroomId/messages (message send handler) */
export const postMessage = async (req, res) => {
  try {
    const { workroomId } = req.params;
    const userId = req.user._id;
    const text = req.body.text?.trim() || "";
    const task = await Task.findOne({ workroomId });

    if (!task) return res.status(404).json({ error: "Workroom not found" });
    if (task.finalisedAt) return res.status(400).json({ error: "Chat is finalized" });

    const isAuthorized = String(task.createdBy) === String(userId) || String(task.selectedApplicant) === String(userId);
    if (!isAuthorized) return res.status(403).json({ error: "Unauthorized" });

    const uploaded = [];
    const files = Array.isArray(req.files) ? req.files : [];

    for (const file of files) {
      const result = await uploadToCloudinary(file, `cyphire/workrooms/${workroomId}`);
      if (result) uploaded.push({
        ...result,
        type: file.mimetype.startsWith("image/") ? "image"
              : file.mimetype.startsWith("video/") ? "video"
              : "file",
      });
    }

    if (!text && uploaded.length === 0) {
      return res.status(400).json({ error: "Message is empty" });
    }

    const message = {
      sender: userId,
      text,
      attachments: uploaded,
      createdAt: new Date(),
    };

    const updated = await WorkroomMessages.findOneAndUpdate(
      { workroomId },
      { $push: { messages: message } },
      { upsert: true, new: true }
    );

    const inserted = updated.messages[updated.messages.length - 1];

    // ✅ Emit message to others in the room
    req.io?.to(`workroom:${workroomId}`).emit("message:new", {
      ...inserted,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        avatar: req.user.avatar,
      },
    });

    res.status(201).json({ item: inserted });
  } catch (e) {
    console.error("postMessage error", e);
    res.status(500).json({ error: "Failed to send message" });
  }
};

/** ADMIN: GET /api/workrooms/:workroomId/admin */
export const adminGetWorkroom = async (req, res) => {
  try {
    const { workroomId } = req.params;

    const task = await Task.findOne({ workroomId })
      .populate("createdBy", "name email avatar")
      .populate("selectedApplicant", "name email avatar");

    if (!task) return res.status(404).json({ error: "Workroom not found" });

    const doc = await WorkroomMessages.findOne({ workroomId })
      .populate("messages.sender", "name email avatar");

    const messages = doc?.messages || [];

    res.json({
      workroom: {
        workroomId: task.workroomId,
        title: task.title,
        createdBy: task.createdBy,
        selectedApplicant: task.selectedApplicant,
        clientFinalised: task.clientFinalised,
        workerFinalised: task.workerFinalised,
        finalisedAt: task.finalisedAt,
      },
      messages,
    });
  } catch (e) {
    console.error("adminGetWorkroom error", e);
    res.status(500).json({ error: "Failed to load workroom for admin" });
  }
};
