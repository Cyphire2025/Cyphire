import mongoose from "mongoose";

const helpQuestionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    answer: { type: String, default: "" },   // admin can fill this later
    status: { type: String, enum: ["open", "answered"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model("HelpQuestion", helpQuestionSchema);
