import mongoose from "mongoose";

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
  },
  { _id: false }
);

const workroomMessageSchema = new mongoose.Schema(
  {
    workroomId: { type: String, required: true, unique: true },
    messages: { type: [singleMessageSchema], default: [] },
    expireAt: { type: Date, default: null, index: { expires: 0 } },
  },
  { timestamps: true }
);

export default mongoose.model("WorkroomMessages", workroomMessageSchema);
