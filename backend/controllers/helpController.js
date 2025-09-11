import HelpTicket from "../models/helpTicketModel.js";
import { uploadAnyToCloudinary } from "../utils/chatUpload.js";

// Create new ticket
export const createTicket = async (req, res) => {
  try {
    const files = req.files || [];
    const uploads = await Promise.all(files.map(f => uploadAnyToCloudinary(f, "cyphire/help")));

    const ticket = await HelpTicket.create({
      userId: req.user._id,
      type: req.body.type,
      subject: req.body.subject,
      description: req.body.description,
      taskId: req.body.taskId || null,
      workroomId: req.body.workroomId || null,
      attachments: uploads,
    });

    res.json(ticket);
  } catch (err) {
    console.error("createTicket error:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

// User: get their tickets
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await HelpTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// User: get one ticket
export const getTicketById = async (req, res) => {
  try {
    const ticket = await HelpTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (ticket.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Forbidden" });
    res.json(ticket);
  } catch {
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

// Admin: get all tickets
export const adminGetAllTickets = async (_req, res) => {
  try {
    const tickets = await HelpTicket.find()
      .populate("userId", "name email slug")
      .populate("taskId", "title")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// Admin: update ticket
export const adminUpdateTicket = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const ticket = await HelpTicket.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch {
    res.status(500).json({ error: "Failed to update ticket" });
  }
};
