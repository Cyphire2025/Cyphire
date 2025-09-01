// models/userModel.js
import mongoose from "mongoose";

// keep this helper in the same file
function slugify(name = "") {
  return name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// add a subdoc schema above UserSchema

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

// ✅ Auto-generate slug on first save
// ✅ AND re-generate slug whenever the *name* changes
userSchema.pre("save", async function () {
  // If no name available and slug already exists, do nothing.
  if (!this.isModified("name") && this.slug) return;

  const baseSource = this.name || this.email || "user";
  const base = slugify(baseSource) || Math.random().toString(36).slice(2, 8);

  let candidate = base;
  let i = 0;

  // Ensure unique across other users (exclude current _id)
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

export default mongoose.model("User", userSchema);
