// utils/cloudinary.js

import cloudinary from "../config/cloudinary.js";

// --- Validate Cloudinary config at startup (fail fast if misconfigured) ---
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error(
    "[Cloudinary] Missing credentials! Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
  );
}

// --- Advanced logger for upload/delete actions ---
const logger = {
  info: (...args) => console.log("[CLOUDINARY]", ...args),
  warn: (...args) => console.warn("[CLOUDINARY][WARN]", ...args),
  error: (...args) => console.error("[CLOUDINARY][ERROR]", ...args),
};

/**
 * Upload any file (from disk path or buffer) to Cloudinary.
 * Supports options for folder, resource_type, tags, etc.
 * Returns the full Cloudinary result object (not just URL).
 * Throws on error.
 */
export const uploadToCloudinary = async (input, opts = {}) => {
  try {
    // Accept either file path (string) or buffer (for in-memory uploads)
    let result;
    if (Buffer.isBuffer(input)) {
      // Buffer upload
      result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { ...opts },
          (err, uploadResult) => {
            if (err) return reject(err);
            resolve(uploadResult);
          }
        );
        stream.end(input);
      });
    } else if (typeof input === "string") {
      // File path upload
      result = await cloudinary.uploader.upload(input, { ...opts });
    } else {
      throw new Error("Invalid input to uploadToCloudinary (must be path or buffer)");
    }

    logger.info(
      "Upload successful:",
      result.public_id,
      "in folder",
      result.folder,
      "url:",
      result.secure_url
    );

    return result;
  } catch (error) {
    logger.error("Upload failed:", error?.message);
    throw new Error("Cloudinary upload failed");
  }
};

/**
 * Delete asset from Cloudinary by public_id.
 * Logs result and throws on failure.
 */
export const deleteFromCloudinary = async (public_id, opts = {}) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, { ...opts });
    if (result.result !== "ok") {
      logger.warn("Delete returned:", result);
      throw new Error("Delete not successful");
    }
    logger.info("Deleted asset:", public_id);
    return result;
  } catch (error) {
    logger.error("Delete failed:", error?.message, "for", public_id);
    throw new Error("Cloudinary delete failed");
  }
};

export default cloudinary;
