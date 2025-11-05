// backend/models/blockedIpModel.js
import mongoose from "mongoose";

const blockedIpSchema = new mongoose.Schema(
  {
    ip: { type: String, unique: true, index: true, trim: true },
    reason: { type: String },
    // optionally track scope / who added it, etc.
  },
  { timestamps: true }
);

// Use existing compiled model if present (prevents OverwriteModelError)
export default mongoose.models.BlockedIp ||
  mongoose.model("BlockedIp", blockedIpSchema);
