import express from "express";
import { protect, adminProtect } from "../middlewares/authMiddleware.js";
import {
  createPaymentLog,
  getPaymentLogs,
  updatePaymentStatus,
} from "../controllers/paymentLogController.js";

const router = express.Router();

// ⭐ Freelancer: create a payment log
router.post("/workrooms/:workroomId/payment-log", protect, createPaymentLog);

// ⭐ Admin: fetch all logs
router.get("/admin/payments", adminProtect, getPaymentLogs);

// ⭐ Admin: mark paid/unpaid
router.patch("/admin/payments/:id/status", adminProtect, updatePaymentStatus);

export default router;
