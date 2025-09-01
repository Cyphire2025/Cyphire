import WorkroomMessages from "../models/workroomMessageModel.js";
import Task from "../models/taskModel.js";

export const postMessage = async (req, res) => {
  try {
    const { workroomId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const task = await Task.findOne({ workroomId });

    if (!task) return res.status(404).json({ error: "Workroom not found" });
    if (task.finalisedAt) return res.status(400).json({ error: "Chat is finalized" });

    const files = Array.isArray(req.files) ? req.files : [];

    const attachments = files.map(f => ({
      url: f.path || f.secure_url || f.url,
      public_id: f.filename || f.public_id,
      type: f.mimetype?.startsWith("image/") ? "image" :
            f.mimetype?.startsWith("video/") ? "video" : "file",
      original_name: f.originalname,
      size: f.size,
      contentType: f.mimetype,
    }));

    if (!text && attachments.length === 0) {
      return res.status(400).json({ error: "Message is empty" });
    }

    const message = {
      sender: userId,
      text: text?.trim() || "",
      attachments,
      createdAt: new Date(),
    };

    const updated = await WorkroomMessages.findOneAndUpdate(
      { workroomId },
      {
        $push: { messages: message },
        $setOnInsert: {
          expireAt: task.finalisedAt
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : null,
        },
      },
      { upsert: true, new: true }
    );

    const inserted = updated.messages[updated.messages.length - 1];
    res.status(201).json({ item: inserted });
  } catch (e) {
    console.error("postMessage error:", e);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { workroomId } = req.params;
    const doc = await WorkroomMessages.findOne({ workroomId }).populate("messages.sender", "name avatar");

    if (!doc) return res.json({ items: [] });

    res.json({ items: doc.messages });
  } catch (e) {
    console.error("getMessages error:", e);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
