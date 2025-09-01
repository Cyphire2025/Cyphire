import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },              // Cloudinary URL
    public_id: { type: String, required: true },        // Cloudinary public ID
    original_name: { type: String },                    // Original file name
    size: { type: Number },                             // File size in bytes
    contentType: { type: String },                      // MIME type
  },
  { _id: false }
);


const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: [{ type: String }], // not required
    numberOfApplicants: { type: Number, default: 0 }, // not required
    price: { type: Number }, // not requiredz`
    deadline: { type: Date }, // not required
    attachments: [attachmentSchema], // store objewwwcts
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    selectedApplicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    workroomId: { type: String, default: null }, // simple shared slug; can be improved later
    // Finalization handshake
    clientFinalised: { type: Boolean, default: false },     // task owner
    workerFinalised: { type: Boolean, default: false },     // selected applicant
    finalisedAt: { type: Date, default: null },

    // 👇 Auto delete after 7 days
    expireAt: { type: Date, default: Date.now, index: { expires: "7d" } },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
