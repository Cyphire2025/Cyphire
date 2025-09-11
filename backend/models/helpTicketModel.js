import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
    original_name: String,
    size: Number,
    contentType: String,
  },
  { _id: false }
);

const helpTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: ["payment", "task", "workroom", "account", "report", "other"], 
      required: true 
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    workroomId: { type: String }, 
    attachments: [attachmentSchema],
    status: { 
      type: String, 
      enum: ["open", "in-progress", "resolved"], 
      default: "open" 
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("HelpTicket", helpTicketSchema);
