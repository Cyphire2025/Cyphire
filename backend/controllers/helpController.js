// controllers/helpController.js

import HelpTicket from "../models/helpTicketModel.js";
import { uploadAnyToCloudinary } from "../utils/chatUpload.js"; // Or your universal file uploader
import User from "../models/userModel.js";

// Utility: create comment object from req/user/text/files
const buildComment = async (user, text, files = []) => {
  const author = {
    _id: user._id,
    role: user.isAdmin ? "admin" : "user",
    name: user.name,
    avatar: user.avatar || "",
  };
  const uploaded = [];
  for (const f of files) {
    const file = await uploadAnyToCloudinary(f, "cyphire/tickets");
    if (file) uploaded.push(file);
  }
  return { author, text: text || "", files: uploaded, createdAt: new Date() };
};

/** POST /api/help/tickets — create a ticket (adds first comment as description) */
export const createTicket = async (req, res) => {
  try {
    const { type, subject, description } = req.body;
    const user = req.user;
    const files = Array.isArray(req.files) ? req.files : [];

    // Main attachments (e.g. screenshots for initial ticket)
    const mainFiles = [];
    for (const f of files) {
      const file = await uploadAnyToCloudinary(f, "cyphire/tickets");
      if (file) mainFiles.push(file);
    }

    // Add description as first comment
    const firstComment = await buildComment(user, description, []);

    const ticket = await HelpTicket.create({
      user: user._id,
      type,
      subject,
      description,
      attachments: mainFiles,
      comments: [firstComment],
      status: "open",
    });

    res.status(201).json({ ticket });
  } catch (e) {
    req.log.error("[HELP][createTicket]", e);
    res.status(500).json({ error: "Failed to create ticket" });
  }
};

/** POST /api/help/tickets/:id/comments — add a threaded reply */
export const postComment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { text } = req.body;
    const files = Array.isArray(req.files) ? req.files : [];

    const ticket = await HelpTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Only ticket owner or admin can reply
    if (
      String(ticket.user) !== String(user._id) &&
      !user.isAdmin
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({ error: "Ticket is closed" });
    }

    const comment = await buildComment(user, text, files);

    ticket.comments.push(comment);
    ticket.status = "in-progress"; // Auto-bump to in-progress if new comment
    await ticket.save();

    res.status(201).json({ comment });
  } catch (e) {
    req.log.error("[HELP][postComment]", e);
    res.status(500).json({ error: "Failed to post comment" });
  }
};

/** PATCH /api/help/tickets/:id/close — close the ticket (user or admin) */
export const closeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const ticket = await HelpTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Only ticket owner or admin can close
    if (
      String(ticket.user) !== String(user._id) &&
      !user.isAdmin
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (ticket.status === "closed") {
      return res.status(400).json({ error: "Already closed" });
    }

    ticket.status = "closed";
    ticket.closedBy = user._id;
    ticket.closedAt = new Date();

    // Optional: Add close event as a comment
    ticket.comments.push({
      author: {
        _id: user._id,
        role: user.isAdmin ? "admin" : "user",
        name: user.name,
        avatar: user.avatar || "",
      },
      text: user.isAdmin
        ? "Admin closed this ticket."
        : "User closed this ticket.",
      files: [],
      createdAt: new Date(),
    });

    await ticket.save();
    res.json({ success: true, status: "closed" });
  } catch (e) {
    req.log.error("[HELP][closeTicket]", e);
    res.status(500).json({ error: "Failed to close ticket" });
  }
};

/** PATCH /api/help/tickets/:id/reopen — reopen the ticket (user or admin) */
export const reopenTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const ticket = await HelpTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Only ticket owner or admin can reopen
    if (
      String(ticket.user) !== String(user._id) &&
      !user.isAdmin
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (ticket.status !== "closed") {
      return res.status(400).json({ error: "Ticket is not closed" });
    }

    ticket.status = "open";
    ticket.closedBy = null;
    ticket.closedAt = null;

    ticket.comments.push({
      author: {
        _id: user._id,
        role: user.isAdmin ? "admin" : "user",
        name: user.name,
        avatar: user.avatar || "",
      },
      text: user.isAdmin
        ? "Admin reopened this ticket."
        : "User reopened this ticket.",
      files: [],
      createdAt: new Date(),
    });

    await ticket.save();
    res.json({ success: true, status: "open" });
  } catch (e) {
    req.log.error("[HELP][reopenTicket]", e);
    res.status(500).json({ error: "Failed to reopen ticket" });
  }
};

/** GET /api/help/tickets/:id — fetch full ticket (threaded chat) */
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const ticket = await HelpTicket.findById(id);

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Only ticket owner or admin can see ticket
    if (
      String(ticket.user) !== String(user._id) &&
      !user.isAdmin
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ ticket });
  } catch (e) {
    req.log.error("[HELP][getTicketById]", e);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

/** GET /api/help/tickets/mine — get all user's tickets */
export const getMyTickets = async (req, res) => {
  try {
    const user = req.user;
    const tickets = await HelpTicket.find({ user: user._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (e) {
    req.log.error("[HELP][getMyTickets]", e);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

/** ADMIN: GET /api/help/tickets — all tickets (filters, pagination) */
export const adminGetAllTickets = async (req, res) => {
  try {
    const { status, type, userId, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (userId) query.user = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      HelpTicket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      HelpTicket.countDocuments(query),
    ]);
    res.json({
      tickets,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (e) {
    req.log.error("[HELP][adminGetAllTickets]", e);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

