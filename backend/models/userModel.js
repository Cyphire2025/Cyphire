// models/userModel.js
import mongoose from "mongoose";

function slugify(name = "") {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const NotificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["selection", "rejection"], required: true },
    message: { type: String, required: true },
    link: { type: String, default: "/dashboard?tab=myApplications" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    googleId: { type: String },
    avatar: { type: String },

    // public profile
    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    bio: { type: String, maxlength: 300 },
    notifications: { type: [NotificationSchema], default: [] },
    country: { type: String },
    phone: { type: String },
    skills: [{ type: String }],
    isAdmin: { type: Boolean, default: false },
    plan: { type: String, enum: ["free", "plus", "ultra"], default: "free" },
    planStartedAt: { type: Date },
    planExpiresAt: { type: Date },
    upiId: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },

    // NEW: IP tracking for anti-abuse/anti-multiaccount
    signupIp: { type: String, index: true },
    signinIpHistory: [{ type: String }], // last N signins, for admin/audit

    projects: [
      new mongoose.Schema(
        {
          title: String,
          description: String,
          link: String,
          media: [
            new mongoose.Schema(
              {
                url: String,
                public_id: String,
                original_name: String,
                contentType: String,
              },
              { _id: false }
            ),
          ],
        },
        { _id: false }
      ),
    ],
  },
  { timestamps: true }
);

// Auto-generate slug on save
userSchema.pre("save", async function () {
  if (!this.isModified("name") && this.slug) return;
  const baseSource = this.name || this.email || "user";
  const base = slugify(baseSource) || Math.random().toString(36).slice(2, 8);
  let candidate = base;
  let i = 0;
  while (
    await this.constructor.exists({
      slug: candidate,
      _id: { $ne: this._id },
    })
  ) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  this.slug = candidate;
});

// Optional: static to globally block IPs
userSchema.statics.isIpBlocked = async function (ip) {
  // For advanced: Store blocked IPs in a dedicated collection, or in .env/config
  const BlockedIp = mongoose.model("BlockedIp", new mongoose.Schema({ ip: { type: String, unique: true } }));
  const exists = await BlockedIp.exists({ ip });
  return !!exists;
};

export default mongoose.model("User", userSchema);
