// backend/utils/cloudinaryUpload.js
import cloudinary from "../utils/cloudinary.js"; // you already have this

export const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    if (file?.path) {
      cloudinary.uploader.upload(
        file.path,
        { resource_type: "auto", folder },
        (err, result) => {
          if (err) return reject(err);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || file.filename || "file",
            size: file.size || 0,
            contentType: file.mimetype || "application/octet-stream",
          });
        }
      );
      return;
    }
    if (file?.buffer) {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", folder },
        (err, result) => {
          if (err) return reject(err);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            original_name: file.originalname || "file",
            size: file.size || 0,
            contentType: file.mimetype || "application/octet-stream",
          });
        }
      );
      stream.end(file.buffer);
      return;
    }
    resolve(null);
  });
