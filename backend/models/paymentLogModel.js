// models/paymentLogModel.js
import mongoose from "mongoose";

const paymentLogSchema = new mongoose.Schema({
  workroomId: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  freelancer: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    email: String,
  },
  upiId: { type: String, required: true },
  grossAmount: { type: Number, required: true }, // task price
  fee: { type: Number, required: true },         // platform fee
  netAmount: { type: Number, required: true },   // after fee
  upiLink: { type: String },
  qrData: { type: String },
  paid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PaymentLog", paymentLogSchema);
