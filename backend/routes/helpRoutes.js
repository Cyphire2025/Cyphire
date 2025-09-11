import express from "express";
import { protect, adminProtect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  createTicket,
  getMyTickets,
  getTicketById,
  adminGetAllTickets,
  adminUpdateTicket,
} from "../controllers/helpController.js";

const router = express.Router();

// User: create + view tickets
router.post("/", protect, upload.array("attachments", 5), createTicket);
router.get("/me", protect, getMyTickets);
router.get("/:id", protect, getTicketById);

// Admin: manage tickets
router.get("/", adminProtect, adminGetAllTickets);
router.patch("/:id", adminProtect, adminUpdateTicket);

export default router;
