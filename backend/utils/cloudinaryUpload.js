// utils/cloudinaryUpload.js

import cloudinary from "../utils/cloudinary.js";

/**
 * Uploads a file (from disk path or buffer) to Cloudinary with robust options and logging.
 * @param {Object} file - Multer file object (with .path, .buffer, .originalname, .mimetype, .size)
 * @param {string} folder - Cloudinary folder (required)
 * @param {Object} [opts] - Additional Cloudinary upload options
 * @returns {Promise<Object>} - Cloudinary asset info (url, public_id, size, etc.)
 */
export const uploadToCloudinary = (file, folder, opts = {}) =>
  new Promise((resolve, reject) => {
    // Defensive: validate input
    if (!file) {
      return resolve(null);
    }
    if (!folder) {
      return reject(new Error("Cloudinary folder is required"));
    }

    const uploadOpts = {
      resource_type: "auto",
      folder,
      ...opts,
    };

    // Path-based upload (for disk-based multer)
    if (file.path) {
      cloudinary.uploader.upload(
        file.path,
        uploadOpts,
        (err, result) => {
          if (err) {
            console.error("[CLOUDINARY UPLOAD][PATH] error:", err.message);
            return reject(err);
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || file.filename || "file",
            size: file.size || result.bytes || 0,
            contentType: file.mimetype || "application/octet-stream",
            width: result.width,
            height: result.height,
            format: result.format,
            createdAt: result.created_at,
          });
        }
      );
      return;
    }

    // Buffer-based upload (for memory storage multer)
    if (file.buffer) {
      const stream = cloudinary.uploader.upload_stream(
        uploadOpts,
        (err, result) => {
          if (err) {
            console.error("[CLOUDINARY UPLOAD][BUFFER] error:", err.message);
            return reject(err);
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || "file",
            size: file.size || result.bytes || 0,
            contentType: file.mimetype || "application/octet-stream",
            width: result.width,
            height: result.height,
            format: result.format,
            createdAt: result.created_at,
          });
        }
      );
      stream.end(file.buffer);
      return;
    }

    // If neither path nor buffer, reject
    reject(new Error("Invalid file: must provide path or buffer for upload"));
  });

