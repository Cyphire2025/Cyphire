import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { getMessages } from "../controllers/workroomMessageController.js";
import { postMessage } from "../controllers/workroomController.js";


const router = express.Router();

router.get("/:workroomId/messages", protect, getMessages);
router.post("/:workroomId/messages", protect, upload.array("attachments", 10), postMessage);

export default router;
