// routes/paymentRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { createOrder, verifyPaymentAndCreateTask } from "../controllers/paymentController.js";
import { verifyPaymentAndSelectApplicant } from "../controllers/paymentController.js";

const router = express.Router();

// create order (JSON)
router.post("/create-order", protect, createOrder);

// verify + create task (multipart; keep high limit if you allow many files)
router.post(
  "/verify-payment",
  protect,
  upload.array("attachments", 20),   // adjust max files as you like
  verifyPaymentAndCreateTask
);

// verify + select applicant
router.post("/verify-and-select", protect, verifyPaymentAndSelectApplicant);

export default router;
