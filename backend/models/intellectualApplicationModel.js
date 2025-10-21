// backend/models/intellectualApplicationModel.js
import mongoose from "mongoose";

const CLOUD_FILE = new mongoose.Schema({
  url: { type: String, required: true },
  public_id: { type: String, required: true },
  original_name: { type: String, default: "" },
  size: { type: Number, default: 0 },
  contentType: { type: String, default: "application/octet-stream" },
}, { _id: false });

const AUDIT = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, enum: ["CREATE", "UPDATE", "STATUS_CHANGE", "REVIEW_NOTE"], required: true },
  note: { type: String, default: "" },
}, { _id: false });

const BASE_PROFILE = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  headline: { type: String, default: "" },       // short one-liner under name
  bio: { type: String, default: "" },
  avatar: CLOUD_FILE,                             // optional portrait
  languages: { type: [String], default: [] },     // e.g. ['English','Hindi','Other: Marathi']
  location: { type: String, default: "" },        // City, Country (free text)
  socials: {
    website: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" },
    instagram: { type: String, default: "" },
  }
}, { _id: false });

/**
 * Category-specific sections
 * Keep keys minimal + relevant; easy to extend later
 */
const PROFESSOR = new mongoose.Schema({
  institution: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, default: "" }, // Assistant/Associate/Professor
  expertise: { type: [String], default: [] }, // NLP, Control Systems, etc.
  publications: { type: Number, default: 0 },
  googleScholar: { type: String, default: "" },
  proofDocs: { type: [CLOUD_FILE], default: [] }, // ID, faculty page, letters
}, { _id: false });

const INFLUENCER = new mongoose.Schema({
  niches: { type: [String], default: [] },      // tech, education, lifestyle...
  platforms: [{
    name: { type: String, enum: ["youtube","instagram","x","linkedin","tiktok","other"], required: true },
    handle: { type: String, default: "" },
    followers: { type: Number, default: 0 },
  }],
  mediaKit: CLOUD_FILE,
  proofDocs: { type: [CLOUD_FILE], default: [] },
}, { _id: false });

const INDUSTRY_EXPERT = new mongoose.Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },        // e.g. SDE3, Staff PM
  yearsExperience: { type: Number, min: 0, default: 0 },
  domains: { type: [String], default: [] },      // fintech, ai, cloud
  certifications: { type: [String], default: [] },
  proofDocs: { type: [CLOUD_FILE], default: [] },
}, { _id: false });

const COACH = new mongoose.Schema({
  focusAreas: { type: [String], default: [] },   // career, interviews, public speaking
  sessionsOffered: { type: [String], default: [] }, // 1:1, group, workshop
  priceHint: { type: Number, min: 0, default: 0 },  // optional guide price
  proofDocs: { type: [CLOUD_FILE], default: [] },
}, { _id: false });

const IntellectualApplicationSchema = new mongoose.Schema({
  // Requester
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  // Category & status
  category: { type: String, enum: ["professor","influencer","industry_expert","coach"], required: true, index: true },
  status: { type: String, enum: ["draft","submitted","under_review","approved","rejected"], default: "submitted", index: true },

  // Profile (common)
  profile: { type: BASE_PROFILE, required: true },

  // Category-specific payload
  professor: PROFESSOR,
  influencer: INFLUENCER,
  industry_expert: INDUSTRY_EXPERT,
  coach: COACH,

  // Attachments common to all (e.g., CV)
  attachments: { type: [CLOUD_FILE], default: [] },

  // Admin-only: review notes, audit
  reviewNotes: { type: String, default: "" },
  audit: { type: [AUDIT], default: [] },

  // Idempotency / dedupe (optional)
  fingerprint: { type: String, default: "", index: true, unique: false },

}, { timestamps: true });

// Helpful compound index for admin dashboards
IntellectualApplicationSchema.index({ category: 1, status: 1, createdAt: -1 });

export default mongoose.model("IntellectualApplication", IntellectualApplicationSchema);
