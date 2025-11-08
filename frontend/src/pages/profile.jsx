/* eslint-disable no-unused-vars */
// src/pages/profile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/navbarsponhome";
import Footer from "../components/footer";
import {
  Camera,
  Plus,
  X,
  Save,
  Mail,
  Globe2,
  Phone,
  Tag,
  FolderOpen,
} from "lucide-react";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const GradientText = ({ children, className = "" }) => (
  <span className={`bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

const NeonButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`relative inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] focus:outline-none ${className}`}
  >
    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600" />
    <span className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-400/40 via-fuchsia-400/30 to-sky-400/30 blur-md" />
    <span className="relative">{children}</span>
  </button>
);

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const SkillPill = ({ text, onRemove }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/90">
    <Tag className="h-3.5 w-3.5" />
    {text}
    <button className="ml-1 opacity-80 hover:opacity-100" onClick={onRemove} type="button" aria-label="Remove skill">
      <X className="h-3.5 w-3.5" />
    </button>
  </span>
);

// Media preview for images/videos
const MediaThumb = ({ file, url, onRemove }) => {
  const isVideo = useMemo(() => {
    const type = file?.type || "";
    return type.startsWith("video/");
  }, [file]);

  return (
    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-white/5">
      {isVideo ? (
        <video src={url} className="w-full h-full object-cover" muted controls={false} />
      ) : (
        <img src={url} className="w-full h-full object-cover" />
      )}
      <button
        type="button"
        className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90"
        onClick={onRemove}
        aria-label="Remove file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [err, setErr] = useState("");

  // Core profile fields
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // read-only from backend (auth identity)
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  // NEW: Bio
  const [bio, setBio] = useState("");

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  // Portfolio projects (editor; max 3)
  const [projects, setProjects] = useState([]);
  // Saved projects coming from server (read-only list)
  const [savedProjects, setSavedProjects] = useState([]);

  // Edit helpers
  const [editingIndex, setEditingIndex] = useState(null);
  const editorRef = useRef(null);
  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const projectLimits = {
    free: 3,
    plus: 5,
    ultra: 10,
  };

  const maxProjects = projectLimits[user?.plan || "free"];
  // Load current user
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await apifetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!r.ok) throw new Error("Failed to load profile");

        const { user: u } = await r.json();
        if (!alive) return;

        setUser(u || null);
        const initialName = u?.name || (u?.email ? u.email.split("@")[0] : "");
        setName(initialName);
        setEmail(u?.email || "");
        setAvatarUrl(u?.avatar || null);

        setCountry(u?.country || "");
        setPhone(u?.phone || "");
        setSkills(Array.isArray(u?.skills) ? u.skills : []);

        // NEW: set initial bio
        setBio(u?.bio || "");

        setSavedProjects(Array.isArray(u?.projects) ? u.projects : []);
      } catch (e) {
        if (alive) setErr(e.message || "Could not fetch profile");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);


  // Auto-refresh plan + projects every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        if (r.ok) {
          const { user: u } = await r.json();
          setUser(u);
          setSavedProjects(Array.isArray(u?.projects) ? u.projects : []);
        }
      } catch (e) {
        console.error("Auto-refresh failed:", e);
      }
    }, 30000); // every 30s

    return () => clearInterval(interval);
  }, []);

  // Helpers
  const initial = useMemo(() => {
    return (name || email || "U").trim().charAt(0).toUpperCase();
  }, [name, email]);

  const handleAvatarPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      alert("Please select an image file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("Max file size is 5MB.");
      return;
    }
    setAvatarFile(f);
    const nextUrl = URL.createObjectURL(f);
    setAvatarUrl(nextUrl);
  };

  const saveAvatar = async () => {
    if (!avatarFile) {
      alert("Pick an image first.");
      return;
    }
    setAvatarSaving(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const res = await apiFetch(`${API_BASE}/api/users/avatar`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Avatar update not implemented yet");
      }
      const d = await res.json().catch(() => ({}));
      const newUrl = d?.user?.avatar || avatarUrl;
      setAvatarUrl(newUrl);
      setAvatarFile(null);
      alert("✅ Profile picture updated!");
    } catch (e) {
      setErr(e.message || "Failed to update avatar");
    } finally {
      setAvatarSaving(false);
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) return;
    if (skills.length >= 20) {
      alert("Max 20 skills.");
      return;
    }
    setSkills((prev) => [...prev, s]);
    setSkillInput("");
  };

  const removeSkill = (idx) => {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
  };

  const addProject = () => {
    if (projects.length + savedProjects.length >= maxProjects) {
      alert(`You can add up to ${maxProjects} projects with your ${user?.plan || "free"} plan.`);
      return;
    }
    setProjects((prev) => [...prev, { title: "", description: "", link: "", files: [], previews: [] }]);
    setEditingIndex(null);
  };


  const removeProject = (idx) => {
    setProjects((prev) => {
      const next = [...prev];
      next[idx]?.previews?.forEach((p) => URL.revokeObjectURL(p));
      next.splice(idx, 1);
      return next;
    });
  };

  const updateProjectField = (idx, field, value) => {
    setProjects((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const onProjectFiles = (idx, fileList) => {
    const files = Array.from(fileList || []);
    setProjects((prev) => {
      const cur = prev[idx] || { title: "", description: "", files: [], previews: [] };
      const all = [...cur.files, ...files].slice(0, 5); // max 5
      cur.previews?.forEach((p) => URL.revokeObjectURL(p));
      const previews = all.map((f) => URL.createObjectURL(f));
      const next = [...prev];
      next[idx] = { ...cur, files: all, previews };
      return next;
    });
  };

  const clearProjectFile = (pIdx, fIdx) => {
    setProjects((prev) => {
      const next = [...prev];
      const proj = next[pIdx];
      if (!proj) return prev;
      const previews = [...proj.previews];
      const files = [...proj.files];
      if (previews[fIdx]) URL.revokeObjectURL(previews[fIdx]);
      previews.splice(fIdx, 1);
      files.splice(fIdx, 1);
      next[pIdx] = { ...proj, previews, files };
      return next;
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    setErr("");
    try {
      // include bio in payload
      const body = { name, country, phone, skills, bio: (bio || "").slice(0, 300) };
      const res = await apiFetch(`${API_BASE}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Profile update not implemented yet");
      }
      alert("✅ Profile saved!");
    } catch (e) {
      setErr(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // --- Saved projects: actions ---
  const editSavedProject = (idx) => {
    const p = savedProjects[idx];
    if (!p) return;
    setProjects([{ title: p.title || "", description: p.description || "", link: p.link || "", files: [], previews: [] }]);
    setEditingIndex(idx);
    scrollToEditor();
  };

  const deleteSavedProject = async (idx) => {
    if (!confirm("Delete this project? This will remove its media too.")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/users/projects/${idx}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete project");
      }
      const d = await res.json();
      setSavedProjects(d?.user?.projects || []);
      alert("🗑️ Project deleted.");
    } catch (e) {
      setErr(e.message || "Failed to delete project");
    }
  };

  const deleteSavedProjectMedia = async (idx, publicId) => {
    if (!confirm("Remove this media file?")) return;
    try {
      const res = await apiFetch(
        `${API_BASE}/api/users/projects/${idx}/media/${encodeURIComponent(publicId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete media");
      }
      const d = await res.json();
      setSavedProjects(d?.user?.projects || []);
    } catch (e) {
      setErr(e.message || "Failed to delete media");
    }
  };

  const saveProjects = async () => {
    setProjectSaving(true);
    setErr("");
    try {
      // --- UPDATE existing project (title/description only) ---
      if (editingIndex !== null && projects[0]) {
        const p = projects[0];
        if (!p.title?.trim()) throw new Error("Add a title to the project");

        // 1) update metadata
        const res = await apiFetch(`${API_BASE}/api/users/projects/${editingIndex}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: p.title, description: p.description, link: (p.link || "").trim() }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || "Failed to update project");
        }

        // 2) upload media (if any) for this index
        if (p.files?.length) {
          const fd = new FormData();
          p.files.slice(0, 5).forEach((f) => fd.append("files", f));
          const mr = await apiFetch(`${API_BASE}/api/users/projects/${editingIndex}/media`, {
            method: "POST",
            body: fd,
          });
          if (!mr.ok) {
            const md = await mr.json().catch(() => ({}));
            throw new Error(md.error || "Failed to upload project media");
          }
        }

        // 3) refresh saved list
        const me = await fetch(`${API_BASE}/api/auth/me`, {credentials: "include", cache: "no-store" });
        const meJson = await me.json();
        setSavedProjects(Array.isArray(meJson?.user?.projects) ? meJson.user.projects : []);

        setProjects([]);
        setEditingIndex(null);
        alert("✅ Project updated!");
        return;
      }

      // --- CREATE/APPEND new projects ---
      const newPayload = projects.map((p) => ({
        title: p.title,
        description: p.description,
        link: (p.link || "").trim(),
      }));

      // merge existing titles/descs + new ones (backend replaces array)
      const existingSlim = (savedProjects || []).map((p) => ({
        title: p?.title || "",
        description: p?.description || "",
        link: (p?.link || "").trim(),
      }));

      const merged = [...existingSlim, ...newPayload].slice(0, maxProjects);
      // 1) save metadata for all
      const res = await apiFetch(`${API_BASE}/api/users/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: merged }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Project save not implemented yet");
      }

      // 2) upload media for the *newly added* projects to their indices
      const startIndex = existingSlim.length; // first new index
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        if (!p.files || p.files.length === 0) continue;

        const fd = new FormData();
        p.files.slice(0, 5).forEach((f) => fd.append("files", f)); // max 5 files
        const mr = await apiFetch(`${API_BASE}/api/users/projects/${startIndex + i}/media`, {
          method: "POST",
          body: fd,
        });
        if (!mr.ok) {
          const md = await mr.json().catch(() => ({}));
          throw new Error(md.error || "Failed to upload project media");
        }
      }

      // 3) refresh saved list (now includes media)
      const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include", cache: "no-store" });
      const meJson = await me.json();
      setSavedProjects(Array.isArray(meJson?.user?.projects) ? meJson.user.projects : []);

      setProjects([]);
      alert("✅ Project saved!");
    } catch (e) {
      setErr(e.message || "Failed to save projects");
    } finally {
      setProjectSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100">
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* Soft blobs */}
        <div className="pointer-events-none absolute -left-20 -top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">
            <GradientText>Profile</GradientText>
          </h1>
          <p className="text-white/60 mt-2">Manage your identity and showcase your best work.</p>

          {/* Public profile link */}
          {user?.slug && (
            <div className="mt-2 text-sm text-white/70">
              Public profile:{" "}
              <a
                href={`/u/${user.slug}`}
                className="text-fuchsia-300 hover:text-fuchsia-200 underline"
              >
                {window.location.origin}/u/{user.slug}
              </a>
            </div>
          )}

        </div>
        {user?.plan && user.plan !== "free" && (
          <GlassCard className="mb-6 p-4 text-center">
            <p className="text-lg font-semibold text-white">
              🌟 You are on <span className="text-fuchsia-300">{user.plan.toUpperCase()}</span> plan
            </p>
            <p className="text-sm text-white/70 mt-1">
              {user.plan === "plus"
                ? "You can add up to 5 projects."
                : user.plan === "ultra"
                  ? "You can add up to 10 projects."
                  : ""}
            </p>
          </GlassCard>
        )}


        {err && (
          <GlassCard className="mb-6 p-4 text-red-300">
            {err}
          </GlassCard>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-white/70">
            <svg className="animate-spin h-6 w-6 text-fuchsia-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading your profile…
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {/* Left column: Avatar + Basic fields */}
            <div className="md:col-span-1 space-y-6">
              <GlassCard className="p-6 flex flex-col items-center">
                {/* Avatar */}
                <div className="relative h-28 w-28 rounded-full border border-white/10 bg-white/10 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-3xl font-bold">{initial}</span>
                  )}
                </div>

                {/* Change avatar */}
                <div className="mt-4 flex flex-col items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    onChange={handleAvatarPick}
                    className="hidden"
                  />
                  <NeonButton onClick={() => avatarInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                    Change profile pic
                  </NeonButton>
                  {avatarFile && (
                    <button
                      onClick={saveAvatar}
                      disabled={avatarSaving}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10 disabled:opacity-60"
                    >
                      {avatarSaving ? "Saving…" : "Save new photo"}
                    </button>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/70">Username</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-white/70">Contact Email</label>
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white/90">
                      <Mail className="h-4 w-4 text-white/60" />
                      <span className="truncate">{email || "—"}</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Email comes from your sign-in; usually read-only.</p>
                  </div>

                  <div>
                    <label className="text-sm text-white/70">Country</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-white/60" />
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g., India"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white/70">Phone</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-white/60" />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9XXXXXXXXX"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                      />
                    </div>
                  </div>

                  {/* NEW: Bio */}
                  <div>
                    <label className="text-sm text-white/70">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 300))}
                      placeholder="Short description about you (max 300 chars)"
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                      rows={4}
                    />
                    <div className="text-xs text-white/40 text-right">{bio.length}/300</div>
                  </div>

                  <div>
                    <label className="text-sm text-white/70">Skills</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <SkillPill key={i} text={s} onRemove={() => removeSkill(i)} />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder="Add a skill and press Enter"
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                      />
                      <button
                        onClick={addSkill}
                        type="button"
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 hover:bg-white/15"
                        aria-label="Add skill"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <NeonButton onClick={saveProfile} disabled={saving}>
                      <Save className="h-4 w-4" />
                      {saving ? "Saving…" : "Save Profile"}
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right column: Projects */}
            <div className="md:col-span-2 space-y-6">
              <div ref={editorRef}>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">
                        {editingIndex !== null ? `Edit Project #${editingIndex + 1}` : "Projects"}
                      </h2>
                    </div>
                    <button
                      onClick={addProject}
                      disabled={savedProjects.length + projects.length >= maxProjects}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm 
                          ${savedProjects.length + projects.length >= maxProjects
                          ? "opacity-50 cursor-not-allowed bg-white/5 border border-white/10"
                          : "bg-white/10 border border-white/10 hover:bg-white/15"
                        }`}
                    >
                      <Plus className="h-4 w-4" /> Add project
                    </button>

                  </div>

                  {projects.length === 0 && (
                    <p className="mt-4 text-white/60 text-sm">
                      You can add up to <span className="text-white">{maxProjects}</span> projects with your {user?.plan || "free"} plan.
                    </p>

                  )}

                  <div className="mt-6 space-y-6">
                    {projects.map((p, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-white/90 font-medium">Project {idx + 1}</h3>
                          <button
                            onClick={() => removeProject(idx)}
                            className="rounded-lg bg-white/10 hover:bg-white/15 p-1"
                            aria-label="Remove project"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* put all form fields inside the grid */}
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm text-white/70">Title</label>
                            <input
                              value={p.title}
                              onChange={(e) => updateProjectField(idx, "title", e.target.value)}
                              placeholder="Short title"
                              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-sm text-white/70">Short Description</label>
                            <textarea
                              value={p.description}
                              onChange={(e) => updateProjectField(idx, "description", e.target.value)}
                              rows={3}
                              placeholder="What is the project about? Your role, stack, results…"
                              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                            />
                          </div>

                          {/* NEW: link field (inside grid) */}
                          <div className="md:col-span-2">
                            <label className="text-sm text-white/70">Link to your project (optional)</label>
                            <input
                              value={p.link || ""}
                              onChange={(e) => updateProjectField(idx, "link", e.target.value)}
                              placeholder="https://github.com/yourrepo or https://yourdemo.com"
                              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-fuchsia-400/40"
                              inputMode="url"
                            />
                            <p className="text-xs text-white/40 mt-1">Add a live demo, GitHub, or case study link.</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="text-sm text-white/70">Upload Media (max 5)</label>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <input
                              id={`files-${idx}`}
                              type="file"
                              accept="image/*,video/*"
                              multiple
                              onChange={(e) => onProjectFiles(idx, e.target.files)}
                              className="hidden"
                            />
                            <label
                              htmlFor={`files-${idx}`}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                            >
                              <Plus className="h-4 w-4" />
                              Add files
                            </label>

                            {p.previews?.length > 0 && (
                              <div className="flex flex-wrap gap-3">
                                {p.previews.map((url, fIdx) => (
                                  <MediaThumb
                                    key={url}
                                    file={p.files[fIdx]}
                                    url={url}
                                    onRemove={() => clearProjectFile(idx, fIdx)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <NeonButton onClick={saveProjects} disabled={projectSaving}>
                      <Save className="h-4 w-4" />
                      {projectSaving
                        ? (editingIndex !== null ? "Updating…" : "Saving…")
                        : (editingIndex !== null ? "Update Project" : "Save Projects")}
                    </NeonButton>
                  </div>
                </GlassCard>
              </div>

              {/* Read-only list of saved projects with actions */}
              {savedProjects?.length > 0 && (
                <div className="space-y-6">
                  {savedProjects.map((p, i) => (
                    <GlassCard key={i} className="p-6 relative">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                        {p.description && (
                          <p className="mt-1 text-sm text-white/70">{p.description}</p>
                        )}

                        {/* NEW: show project link under description */}
                        {p.link && (
                          <a
                            href={/^https?:\/\//i.test(p.link) ? p.link : `https://${p.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-2 text-sm text-sky-300 hover:text-sky-200 underline break-all"
                          >
                            {p.link}
                          </a>
                        )}
                      </div>

                      {Array.isArray(p.media) && p.media.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {p.media.map((m, j) => {
                            const isVideo = (m?.contentType || "").startsWith("video/");
                            return (
                              <div
                                key={j}
                                className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10 bg-white/5"
                              >
                                {isVideo ? (
                                  <video src={m.url} className="w-full h-full object-cover" muted controls />
                                ) : (
                                  <img src={m.url} className="w-full h-full object-cover" alt="project media" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => editSavedProject(i)}
                          className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs text-blue-200 hover:bg-blue-400/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSavedProject(i)}
                          className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-200 hover:bg-red-400/20"
                        >
                          Delete
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
