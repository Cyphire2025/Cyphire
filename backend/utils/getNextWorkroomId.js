// utils/getNextWorkroomId.js

import Counter from "../models/counterModel.js";

/**
 * Atomically generates the next unique workroom ID (10 digits, zero-padded).
 * Safe for high concurrency and distributed systems (Mongo upsert).
 */
export const getNextWorkroomId = async () => {
  const doc = await Counter.findOneAndUpdate(
    { key: "workroomId" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return String(doc.seq).padStart(10, "0"); // always 10 digits
};
