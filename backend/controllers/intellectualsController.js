// backend/controllers/intellectualsController.js
import IntellectualApplication from "../models/intellectualApplicationModel.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import crypto from "crypto";
import { z } from "zod";

// ---------- common profile ----------
const profileSchema = z.object({
  fullName: z.string().min(2).max(120),
  headline: z.string().max(160).optional(),
  bio: z.string().max(5000).optional(),
  languages: z.array(z.string()).optional(),
  location: z.string().max(120).optional(),
  socials: z
    .object({
      website: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
});

// ---------- category payloads ----------
const professorSchema = z.object({
  institution: z.string().min(2),
  department: z.string().min(2),
  designation: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  publications: z.coerce.number().int().nonnegative().optional(),
  googleScholar: z.string().url().optional().or(z.literal("")),
});

const influencerSchema = z.object({
  niches: z.array(z.string()).min(1),
  platforms: z.array(z.object({
    name: z.enum(["youtube","instagram","x","linkedin","tiktok","other"]),
    handle: z.string().min(1),
    followers: z.coerce.number().int().nonnegative(),
  })).min(1),
});

const industryExpertSchema = z.object({
  company: z.string().min(2),
  role: z.string().min(2),
  yearsExperience: z.coerce.number().nonnegative(),
  domains: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

const coachSchema = z.object({
  focusAreas: z.array(z.string()).min(1),
  sessionsOffered: z.array(z.string()).min(1),
  priceHint: z.coerce.number().nonnegative().optional(),
});

const categorySchema = z.enum(["professor","influencer","industry_expert","coach"]);

export const createApplicationSchema = z.object({
  body: z.object({
    category: categorySchema,
    profile: profileSchema,
    professor: professorSchema.optional(),
    influencer: influencerSchema.optional(),
    industry_expert: industryExpertSchema.optional(),
    coach: coachSchema.optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

// --------- helper to pick the correct block ----------
const pickCategoryBlock = (category, body) => {
  if (category === "professor") return { professor: professorSchema.parse(body.professor) };
  if (category === "influencer") return { influencer: influencerSchema.parse(body.influencer) };
  if (category === "industry_expert") return { industry_expert: industryExpertSchema.parse(body.industry_expert) };
  if (category === "coach") return { coach: coachSchema.parse(body.coach) };
  return {};
};

// --------- controllers ----------
export const createApplication = async (req, res) => {
  const userId = req.user._id;
  const { category, profile } = req.body;

  // attachments from multipart form
  const uploads = [];
  const files = Array.isArray(req.files) ? req.files : [];
  for (const f of files) {
    const up = await uploadToCloudinary(f, `cyphire/intellectuals/${userId}`);
    if (up) uploads.push(up);
  }

  const catBlock = pickCategoryBlock(category, req.body);

  // idempotency-ish fingerprint (optional)
  const fingerprint = crypto
    .createHash("sha256")
    .update(`${userId}:${category}:${(profile.fullName || "").toLowerCase()}:${Date.now() / (1000*60*60*24) | 0}`) // per-day bucket
    .digest("hex");

  const app = await IntellectualApplication.create({
    user: userId,
    category,
    status: "submitted",
    profile,
    ...catBlock,
    attachments: uploads,
    audit: [{ action: "CREATE", by: userId, note: "New application submitted" }],
    fingerprint,
  });

  return res.status(201).json({ item: app });
};

export const getMyApplications = async (req, res) => {
  const apps = await IntellectualApplication
    .find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return res.json({ items: apps });
};

export const getApplicationById = async (req, res) => {
  const { id } = req.params;
  const app = await IntellectualApplication.findById(id).lean();
  if (!app) return res.status(404).json({ error: "Not found" });

  // User can see their own, admin can see all
  const isOwner = String(app.user) === String(req.user._id);
  if (!isOwner && !req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  return res.json({ item: app });
};

export const adminListApplications = async (req, res) => {
  const { status, category, q, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (q) {
    where.$or = [
      { "profile.fullName": new RegExp(q, "i") },
      { "profile.socials.linkedin": new RegExp(q, "i") },
      { "profile.socials.twitter": new RegExp(q, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    IntellectualApplication.find(where).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    IntellectualApplication.countDocuments(where)
  ]);

  return res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

export const adminUpdateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body; // status in ["under_review","approved","rejected"]
  if (!["under_review","approved","rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const app = await IntellectualApplication.findById(id);
  if (!app) return res.status(404).json({ error: "Not found" });

  app.status = status;
  if (note) {
    app.reviewNotes = [app.reviewNotes, note].filter(Boolean).join("\n");
  }
  app.audit.push({ action: "STATUS_CHANGE", by: req.user._id, note: `Status -> ${status}` });

  await app.save();
  return res.json({ item: app });
};

export const adminAddReviewNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const app = await IntellectualApplication.findById(id);
  if (!app) return res.status(404).json({ error: "Not found" });

  app.reviewNotes = [app.reviewNotes, note].filter(Boolean).join("\n");
  app.audit.push({ action: "REVIEW_NOTE", by: req.user._id, note });

  await app.save();
  return res.json({ item: app });
};
