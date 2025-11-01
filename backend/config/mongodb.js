// config/mongodb.js

import mongoose from "mongoose";

/**
 * Connects to MongoDB, with logging and fatal fail on error.
 * No deprecated options (as of Mongoose v6+).
 */
export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("[MONGO] Missing MONGO_URI in env!");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Fail hard if DB is not available (safer for prod)
  }
};
