// config/cloudinary.js

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Load .env config (MUST run before config)
dotenv.config();

// --- Fail fast if config missing ---
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("[CLOUDINARY] Missing .env config for Cloudinary!");
}

// Configure the Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Export a Multer storage instance for direct file uploads (enterprise best practice)
export const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cyphire_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    // Add more options (transformations, eager, etc.) as needed.
  },
});

export default cloudinary;
