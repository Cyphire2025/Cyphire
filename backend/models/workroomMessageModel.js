import mongoose from "mongoose";

// --- Sub-schema for a single chat message (typed, auditable, attachment-aware) ---
const singleMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    attachments: {
      type: [
        {
          url: String,
          public_id: String,
          type: { type: String, enum: ["image", "video", "file"], default: "file" },
          original_name: String,
          size: Number,
          contentType: String,
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
    // ---- SOFT DELETE FIELDS ----
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { _id: false }
);

// --- Root schema for a workroom's full message history ---
const workroomMessageSchema = new mongoose.Schema(
  {
    workroomId: { type: String, required: true, unique: true },
    messages: { type: [singleMessageSchema], default: [] },
    // Auto-expiry (for privacy, compliance, cost control)
    expireAt: { type: Date, default: null, index: { expires: 0 } },
  },
  { timestamps: true }
);

// ----- QUERY MIDDLEWARE: auto-exclude deleted messages -----
function excludeDeleted(next) {
  if (this._fields && this._fields["messages"]) {
    // user requested specific fields; don't filter
    return next();
  }
  // Only return messages not marked deleted
  this.where({ "messages.deleted": { $ne: true } });
  next();
}
workroomMessageSchema.pre("find", excludeDeleted);
workroomMessageSchema.pre("findOne", excludeDeleted);
workroomMessageSchema.pre("aggregate", function (next) {
  const match = { "messages.deleted": { $ne: true } };
  this.pipeline().unshift({ $match: match });
  next();
});

// ----- INSTANCE METHOD: soft delete a message by ID -----
workroomMessageSchema.methods.softDeleteMessage = async function (messageId) {
  const msg = this.messages.id(messageId);
  if (!msg) return false;
  msg.deleted = true;
  msg.deletedAt = new Date();
  await this.save();
  return msg;
};

export default mongoose.model("WorkroomMessages", workroomMessageSchema);
