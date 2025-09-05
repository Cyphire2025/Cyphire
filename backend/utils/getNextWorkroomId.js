// backend/utils/getNextWorkroomId.js
import Counter from "../models/counterModel.js";

export const getNextWorkroomId = async () => {
  const doc = await Counter.findOneAndUpdate(
    { key: "workroomId" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return String(doc.seq).padStart(10, "0"); // ensure 10 digits
};
