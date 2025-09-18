// models/taskModel.js
import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    original_name: { type: String },
    size: { type: Number },
    contentType: { type: String },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: [{ type: String }], // e.g. ["Education"], ["Tech"]

    numberOfApplicants: { type: Number, default: 0 },
    price: { type: Number },
    deadline: { type: Date },
    attachments: [attachmentSchema],

    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    selectedApplicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    workroomId: { type: String, default: null },

    logo: {   // 👈 NEW field
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    // ✅ Flexible metadata field for category-specific fields
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Status + lifecycle
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "disputed", "cancelled"],
      default: "pending",
    },
    flagged: { type: Boolean, default: false },
    clientFinalised: { type: Boolean, default: false },
    workerFinalised: { type: Boolean, default: false },
    finalisedAt: { type: Date, default: null },

        // Payment tracking
    paymentRequested: { type: Boolean, default: false },
    upiId: { type: String, default: "" },

    expireAt: { type: Date, default: Date.now, index: { expires: "7d" } },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
