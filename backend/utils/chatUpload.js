// utils/chatUpload.js

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a single file (buffer or path) to Cloudinary.
 * Returns { url, public_id, original_name, size, contentType, type }
 */
export const uploadAnyToCloudinary = (file, folder = "cyphire/chat") =>
  new Promise((resolve, reject) => {
    const meta = {
      original_name: file.originalname || file.filename || "file",
      size: file.size || 0,
      contentType: file.mimetype || "application/octet-stream",
    };

    const done = (err, result) => {
      if (err) return reject(err);
      const url = result?.secure_url;
      const public_id = result?.public_id;
      const mime = meta.contentType.toLowerCase();
      const type = mime.startsWith("image/")
        ? "image"
        : mime.startsWith("video/")
        ? "video"
        : "file";
      resolve({ url, public_id, ...meta, type });
    };

    if (file.buffer) {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder },
        done
      );
      stream.end(file.buffer);
    } else if (file.path) {
      cloudinary.uploader.upload(
        file.path,
        { resource_type: "auto", folder },
        done
      );
    } else {
      resolve(null);
    }
  });
