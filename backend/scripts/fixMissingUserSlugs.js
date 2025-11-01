// scripts/fixMissingUserSlugs.js

import mongoose from "mongoose";
import User from "../models/userModel.js"; // adjust path if needed

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/YOUR_DB_NAME";

async function main() {
  await mongoose.connect(mongoUri);
  const users = await User.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] });
  let count = 0;
  for (const user of users) {
    const oldId = user._id.toString();
    user.slug = undefined; // triggers pre-save hook to create a new slug
    await user.save();
    console.log(`User fixed: ${user.email} | New slug: ${user.slug} | ID: ${oldId}`);
    count++;
  }
  console.log(`---\nTotal users fixed: ${count}\n`);
  process.exit();
}

main();
