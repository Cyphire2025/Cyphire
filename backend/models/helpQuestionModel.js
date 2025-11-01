import mongoose from "mongoose";

// --- Audit Log Schema ---
const helpQuestionAuditSchema = new mongoose.Schema({
  action: { type: String, enum: ["asked", "answered", "edited", "showToggled"], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  prevAnswer: String,
  newAnswer: String,
  prevShow: Boolean,
  newShow: Boolean,
  at: { type: Date, default: Date.now },
}, { _id: false });

const helpQuestionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  question: { type: String, required: true },
  answer: { type: String, default: "" },
  answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  answeredAt: { type: Date },
  status: { type: String, enum: ["open", "answered"], default: "open", index: true },
  showOnHelpPage: { type: Boolean, default: false, index: true },
  auditLog: [helpQuestionAuditSchema],
}, { timestamps: true });

export default mongoose.model("HelpQuestion", helpQuestionSchema);
