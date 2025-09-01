// controllers/usersController.js
import User from "../models/userModel.js";
import cloudinary from "../utils/cloudinary.js";

/** Cloudinary helper for memory files (multer.memoryStorage) */
const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    if (!file?.buffer) return resolve(null);
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
  });

/** PUT /api/users/me  -> update profile fields (name/country/phone/skills/bio)
 *  IMPORTANT: We load the doc and call .save() so the userModel pre('save')
 *  hook can re-generate slug when 'name' changes.
 */
export const updateMe = async (req, res) => {
  try {
    const { name, country, phone, skills, bio } = req.body;

    // normalize skills (array OR comma-separated)
    let normalizedSkills = [];
    if (Array.isArray(skills)) {
      normalizedSkills = skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 20);
    } else if (typeof skills === "string") {
      normalizedSkills = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // assign fields
    if (typeof name === "string") user.name = name.trim();
    if (typeof country === "string") user.country = country.trim();
    if (typeof phone === "string") user.phone = phone.trim();
    if (Array.isArray(normalizedSkills)) user.skills = normalizedSkills;
    if (typeof bio === "string") user.bio = bio.trim().slice(0, 300);

    await user.save(); // triggers slug (re)generation logic in model if name changed

    // return a clean projection
    const fresh = await User.findById(user._id).select(
      "_id name email avatar avatarPublicId country phone skills projects slug bio createdAt updatedAt"
    );

    return res.json({ user: fresh });
  } catch (e) {
    console.error("updateMe error:", e);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

/** POST /api/users/avatar  -> change profile picture (field: avatar) */
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No avatar file uploaded" });

    const uploaded = await uploadToCloudinary(req.file, "cyphire/avatars");
    if (!uploaded) return res.status(400).json({ error: "Upload failed" });

    // delete previous avatar if we have its public_id
    if (req.user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(req.user.avatarPublicId);
      } catch (err) {
        console.warn("Failed to destroy old avatar:", err?.message);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: uploaded.url, avatarPublicId: uploaded.public_id },
      {
        new: true,
        select:
          "_id name email avatar avatarPublicId country phone skills projects slug bio createdAt updatedAt",
      }
    );

    return res.json({ user });
  } catch (e) {
    console.error("updateAvatar error:", e);
    return res.status(500).json({ error: "Failed to update avatar" });
  }
};

/** POST /api/users/projects  -> set projects metadata (max 3, each title required) */
export const saveProjects = async (req, res) => {
  try {
    let { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: "projects must be an array" });
    }

    // plan-based limits
    const planLimits = { free: 3, plus: 5, ultra: 10 };
    const user = await User.findById(req.user._id).select("plan projects");
    if (!user) return res.status(404).json({ error: "User not found" });

    const limit = planLimits[user.plan || "free"];
    if (projects.length > limit) {
      return res.status(400).json({ error: `Maximum of ${limit} projects allowed for your plan` });
    }

    // sanitize & clamp
    projects = projects.map((p) => ({
      title: String(p?.title || "").trim(),
      description: String(p?.description || "").trim(),
      link: String(p?.link || "").trim(),
    }));

    if (projects.some((p) => !p.title)) {
      return res.status(400).json({ error: "Each project must have a title" });
    }

    // preserve existing media
    const existing = user.projects || [];
    const merged = projects.map((p, idx) => ({
      title: p.title,
      description: p.description,
      link: p.link,
      media: Array.isArray(existing[idx]?.media) ? existing[idx].media : [],
    }));

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { projects: merged },
      {
        new: true,
        runValidators: true,
        select: "_id name email avatar plan projects bio slug",
      }
    );

    return res.json({ user: updated });
  } catch (e) {
    console.error("saveProjects error:", e);
    return res.status(500).json({ error: "Failed to save projects" });
  }
};

/** POST /api/users/projects/:index/media  -> upload up to 5 media files for a project */
export const uploadProjectMedia = async (req, res) => {
  try {
    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0 || index > 2) {
      return res.status(400).json({ error: "Project index must be 0, 1, or 2" });
    }

    const user = await User.findById(req.user._id).select("projects");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!Array.isArray(user.projects) || !user.projects[index]) {
      return res.status(400).json({ error: "Project metadata missing; save it first" });
    }

    const files = Array.isArray(req.files) ? req.files.slice(0, 5) : [];
    if (files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    // Current media + new ones (clamp to 5)
    const currentMedia = Array.isArray(user.projects[index].media)
      ? user.projects[index].media
      : [];

    // Upload all new files
    const uploadedAll = [];
    for (const f of files) {
      const uploaded = await uploadToCloudinary(f, "cyphire/projects");
      if (uploaded) uploadedAll.push(uploaded);
    }

    const nextMedia = [...currentMedia, ...uploadedAll].slice(0, 5);
    user.projects[index].media = nextMedia;

    await user.save();

    const refreshed = await User.findById(req.user._id).select(
      "_id name email avatar avatarPublicId country phone skills projects slug bio createdAt updatedAt"
    );

    return res.json({ user: refreshed });
  } catch (e) {
    console.error("uploadProjectMedia error:", e);
    return res.status(500).json({ error: "Failed to upload media" });
  }
};

// PUT /api/users/projects/:index  -> edit a project's title/description/link
export const updateProject = async (req, res) => {
  try {
    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0 || index > 2) {
      return res.status(400).json({ error: "Project index must be 0, 1, or 2" });
    }

    // ⬇️ include link here
    const { title, description, link } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const user = await (await import("../models/userModel.js")).default.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure projects has slot
    if (!Array.isArray(user.projects)) user.projects = [];
    while (user.projects.length < index + 1)
      user.projects.push({ title: "", description: "", media: [] });

    user.projects[index].title = String(title).trim();
    user.projects[index].description = String(description || "").trim();
    // ⬇️ set link safely (optional)
    user.projects[index].link = typeof link === "string" ? link.trim() : (user.projects[index].link || "");

    await user.save();

    const refreshed = await (await import("../models/userModel.js")).default
      .findById(req.user._id)
      .select("_id name email avatar projects slug bio createdAt updatedAt");

    return res.json({ user: refreshed });
  } catch (e) {
    console.error("updateProject error:", e);
    return res.status(500).json({ error: "Failed to update project" });
  }
};


// DELETE /api/users/projects/:index  -> delete a whole project (and its media)
export const deleteProject = async (req, res) => {
  try {
    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0 || index > 2) {
      return res.status(400).json({ error: "Project index must be 0, 1, or 2" });
    }

    const UserModel = (await import("../models/userModel.js")).default;
    const cloud = (await import("../utils/cloudinary.js")).default;

    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!Array.isArray(user.projects) || !user.projects[index]) {
      return res.status(404).json({ error: "Project not found" });
    }

    // delete media from Cloudinary
    const media = user.projects[index].media || [];
    for (const m of media) {
      if (m?.public_id) {
        try {
          await cloud.uploader.destroy(m.public_id, { resource_type: "auto" });
        } catch { }
      }
    }

    // remove it
    user.projects.splice(index, 1);
    await user.save();

    const refreshed = await UserModel.findById(req.user._id).select(
      "_id name email avatar projects slug bio createdAt updatedAt"
    );

    return res.json({ user: refreshed });
  } catch (e) {
    console.error("deleteProject error:", e);
    return res.status(500).json({ error: "Failed to delete project" });
  }
};

// DELETE /api/users/projects/:index/media/:publicId  -> remove a single media item
export const deleteProjectMedia = async (req, res) => {
  try {
    const index = Number(req.params.index);
    const { publicId } = req.params;

    if (!Number.isInteger(index) || index < 0 || index > 2) {
      return res.status(400).json({ error: "Project index must be 0, 1, or 2" });
    }
    if (!publicId) return res.status(400).json({ error: "publicId required" });

    const UserModel = (await import("../models/userModel.js")).default;
    const cloud = (await import("../utils/cloudinary.js")).default;

    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!Array.isArray(user.projects) || !user.projects[index]) {
      return res.status(404).json({ error: "Project not found" });
    }

    // remove from Cloudinary
    try {
      await cloud.uploader.destroy(publicId, { resource_type: "auto" });
    } catch { }

    // remove from document
    user.projects[index].media = (user.projects[index].media || []).filter(
      (m) => m.public_id !== publicId
    );
    await user.save();

    const refreshed = await UserModel.findById(req.user._id).select(
      "_id name email avatar projects slug bio createdAt updatedAt"
    );

    return res.json({ user: refreshed });
  } catch (e) {
    console.error("deleteProjectMedia error:", e);
    return res.status(500).json({ error: "Failed to delete media" });
  }
};

/** ---------- NEW PUBLIC PROFILE ENDPOINTS ---------- **/

// GET /api/users/slug/:slug/public  -> Safe public profile (no email/phone)
export const publicProfileBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findOne({ slug }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const safe = {
      _id: user._id,
      name: user.name || "",
      avatar: user.avatar || "",
      country: user.country || "",
      skills: Array.isArray(user.skills) ? user.skills : [],
      bio: user.bio || "",
      projects: Array.isArray(user.projects) ? user.projects : [],
      slug: user.slug,
    };
    return res.json({ user: safe });
  } catch (e) {
    console.error("publicProfileBySlug error:", e);
    return res.status(500).json({ error: "Failed to fetch public profile" });
  }
};

// POST /api/users/slug  -> Ensure/generate a slug for the logged-in user
export const ensureSlug = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ error: "User not found" });

    if (!me.slug) {
      await me.save(); // triggers pre-save to create slug
    }
    return res.json({ slug: me.slug });
  } catch (e) {
    console.error("ensureSlug error:", e);
    return res.status(500).json({ error: "Failed to ensure slug" });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // or with .select("-password") to exclude passwords
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to get users" });
  }
};
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.isBlocked = true;
    await user.save();
    res.json({ message: "User blocked" });
  } catch (err) {
    res.status(500).json({ error: "Failed to block user" });
  }
};

export const setUserPlan = async (req, res) => {
  try {
    const { id } = req.params;        // admin override OR
    const { plan } = req.body;        // frontend request
    const userId = id || req.user._id; // if no id, fallback to logged-in user

    if (!["free", "plus", "ultra"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.plan = plan;
    user.planStartedAt = new Date();
    user.planExpiresAt =
      plan === "free" ? null : new Date(Date.now() +  60 * 1000);

    await user.save();
    res.json({ success: true, plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};