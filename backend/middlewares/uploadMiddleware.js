import multer from "multer";

// Store files in memory instead of saving to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  cb(null, true); // Allow all file types for now
};

export const upload = multer({ storage, fileFilter });
