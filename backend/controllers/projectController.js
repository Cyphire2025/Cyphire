import Project from "../models/projectModel.js";
import cloudinary from "../utils/cloudinary.js";

// Create a new project
export const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    const project = await Project.create({
      user: req.user._id,
      title,
      description,
      media: [],
    });

    res.json({ project });
  } catch (e) {
    console.error("createProject error:", e);
    res.status(500).json({ error: "Failed to create project" });
  }
};

// Upload media to a project (max 5 files)
export const uploadProjectMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ _id: id, user: req.user._id });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const files = Array.isArray(req.files) ? req.files.slice(0, 5) : [];
    if (files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    for (const f of files) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "projects", resource_type: "auto" },
          (err, uploaded) => {
            if (err) reject(err);
            else
              resolve({
                url: uploaded.secure_url,
                public_id: uploaded.public_id,
                contentType: f.mimetype,
              });
          }
        ).end(f.buffer);
      });
      project.media.push(result);
    }

    await project.save();
    res.json({ project });
  } catch (e) {
    console.error("uploadProjectMedia error:", e);
    res.status(500).json({ error: "Failed to upload media" });
  }
};

// Get all projects of logged-in user
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ projects });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

// Edit project (title/description only)
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { title, description },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json({ project });
  } catch (e) {
    res.status(500).json({ error: "Failed to update project" });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ _id: id, user: req.user._id });
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Delete from cloudinary
    for (const m of project.media) {
      if (m.public_id) {
        try {
          await cloudinary.uploader.destroy(m.public_id, { resource_type: "auto" });
        } catch {}
      }
    }

    await project.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete project" });
  }
};
