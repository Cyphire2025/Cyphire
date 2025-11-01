// models/counterModel.js
import mongoose from "mongoose";

// Counter for sequential IDs (e.g. workrooms, invoices, etc)
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1000000000 }, // start at 10-digit base
});

export default mongoose.model("Counter", counterSchema);
