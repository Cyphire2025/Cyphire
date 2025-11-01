// models/helpTicketModel.js

import mongoose from "mongoose";

// Sub-schema for comment/reply in a ticket
const ticketCommentSchema = new mongoose.Schema({
  author: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["user", "admin"], required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
  },
  text: { type: String, default: "" },
  files: [{
    url: String,
    public_id: String,
    original_name: String,
    size: Number,
    contentType: String,
  }],
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const helpTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["payment", "task", "workroom", "account", "report", "other"], required: true },
  subject: { type: String, required: true },
  description: { type: String, default: "" },

  // Threaded comments
  comments: { type: [ticketCommentSchema], default: [] },

  attachments: [{
    url: String,
    public_id: String,
    original_name: String,
    size: Number,
    contentType: String,
  }],

  status: { type: String, enum: ["open", "in-progress", "resolved", "closed"], default: "open", index: true },
  adminNotes: { type: String, default: "" }, // optional, now replaced by comments
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  closedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("HelpTicket", helpTicketSchema);
