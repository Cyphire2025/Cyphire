import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import PaymentLog from "../models/paymentLogModel.js";

export const createPaymentLog = async (req, res) => {
  try {
    const { workroomId } = req.params;
    const { upiId } = req.body;

    if (!upiId || !upiId.includes("@")) {
      return res.status(400).json({ error: "Valid UPI ID required" });
    }

    const task = await Task.findOne({ workroomId }).populate("selectedApplicant");
    if (!task) return res.status(404).json({ error: "Task not found" });

    const freelancer = await User.findById(task.selectedApplicant);
    if (!freelancer) return res.status(404).json({ error: "Freelancer not found" });

    const feePercent = 20;
    const fee = Math.round(task.price * (feePercent / 100));
    const netAmount = task.price - fee;

    // Build UPI deep link
    const upiLink = `upi://pay?pa=${encodeURIComponent(
      upiId
    )}&pn=${encodeURIComponent(freelancer.name)}&am=${netAmount}&cu=INR&tn=${encodeURIComponent(
      "Cyphire payout for " + task.title
    )}`;

    // Save log
    const log = await PaymentLog.create({
      workroomId,
      taskId: task._id,
      freelancer: {
        _id: freelancer._id,
        name: freelancer.name,
        email: freelancer.email,
      },
      upiId,
      grossAmount: task.price,
      fee,
      netAmount,
      upiLink,
      qrData: upiLink, // for QR we can use same data
    });

    res.json({ success: true, log });
  } catch (err) {
    console.error("createPaymentLog error:", err);
    res.status(500).json({ error: "Failed to create payment log" });
  }
};

// For Admin: fetch all logs
export const getPaymentLogs = async (req, res) => {
  try {
    const logs = await PaymentLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};

// For Admin: update status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paid } = req.body;
    const log = await PaymentLog.findByIdAndUpdate(
      id,
      { paid },
      { new: true }
    );
    if (!log) return res.status(404).json({ error: "Payment log not found" });
    res.json({ success: true, paid: log.paid });
  } catch {
    res.status(500).json({ error: "Failed to update status" });
  }
};
