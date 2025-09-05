import multer from "multer";

// Store files in memory instead of saving to disk
const storage = multer.memoryStorage();

const allowed = ["image/", "video/", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument"];
const fileFilter = (req, file, cb) => {
  if (allowed.some(type => file.mimetype.startsWith(type))) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};


export const upload = multer({ storage, fileFilter });
