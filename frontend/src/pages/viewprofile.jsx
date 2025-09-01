// src/pages/viewprofile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/footer";
import { Globe2, Tag, FolderOpen, ArrowLeft } from "lucide-react";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const Pill = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/90">
    {Icon ? <Icon className="h-4 w-4" /> : null}
    {children}
  </span>
);

const MediaThumb = ({ m }) => {
  const isVideo =
    (m?.contentType || "").startsWith("video/") ||
    /\.(mp4|webm|ogg)$/i.test(m?.url || "");
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5">
      {isVideo ? (
        <video src={m.url} className="w-full h-full object-cover" controls />
      ) : (
        <img
          src={m.url}
          className="w-full h-full object-cover"
          alt={m.original_name || "project media"}
        />
      )}
    </div>
  );
};

export default function ViewProfilePage() {
  const { slug } = useParams(); // ⬅️ now we read slug, not id
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);

  const initial = useMemo(() => {
    const n = profile?.name || "U";
    return n.trim().charAt(0).toUpperCase();
  }, [profile]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/api/users/slug/${slug}/public`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!r.ok) throw new Error("Profile not found");

        const data = await r.json();
        const u = data.user || data;
        if (!alive) return;
        setProfile({
          name: u.name || "",
          country: u.country || "",
          avatar: u.avatar || "",
          skills: Array.isArray(u.skills) ? u.skills : [],
          projects: Array.isArray(u.projects) ? u.projects : [],
          bio: u.bio || "",
          slug: u.slug,
        });
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load profile");
      } finally {
        if (alive) setLoading(false);
      }
    };
    if (slug) load();
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100">
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* blobs */}
        <div className="pointer-events-none absolute -left-20 -top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {err && <GlassCard className="p-4 text-red-300 mb-6">{err}</GlassCard>}

        {loading ? (
          <div className="flex items-center gap-3 text-white/70">
            <svg
              className="animate-spin h-6 w-6 text-fuchsia-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Loading profile…
          </div>
        ) : profile ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: user info */}
            <div className="lg:col-span-1 space-y-6">
              <GlassCard className="p-6 text-center">
                <div className="mx-auto h-28 w-28 rounded-full border border-white/10 bg-white/10 overflow-hidden flex items-center justify-center">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      className="h-full w-full object-cover"
                      alt="avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-3xl font-bold">{initial}</span>
                  )}
                </div>

                <h1 className="mt-4 text-2xl font-semibold">
                  {profile.name || "Unnamed user"}
                </h1>
                {profile.bio && (
                  <p className="text-white/70 text-sm mt-2 px-4">{profile.bio}</p>
                )}

                <div className="mt-4 flex flex-col gap-2 items-center">
                  {profile.country && <Pill icon={Globe2}>{profile.country}</Pill>}
                </div>
              </GlassCard>

              {/* Skills */}
              <GlassCard className="p-6">
                <div className="text-lg font-semibold mb-3">Skills</div>
                {profile.skills?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s, i) => (
                      <Pill key={i} icon={Tag}>
                        {s}
                      </Pill>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">No skills listed.</div>
                )}
              </GlassCard>
            </div>

            {/* Right: projects gallery */}
            <div className="lg:col-span-2 space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Projects</h2>
                </div>

                {!profile.projects?.length ? (
                  <div className="text-white/60 text-sm">No projects yet.</div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {profile.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="mb-2">
                          <div className="text-white font-semibold">
                            {proj.title || `Project ${idx + 1}`}
                          </div>
                          {proj.description && (
                            <div className="text-sm text-white/70 mt-1">
                              {proj.description}
                            </div>
                          )}
                        </div>
                        {proj.link && (
                          <a
                            href={/^https?:\/\//i.test(proj.link) ? proj.link : `https://${proj.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-2 text-sm text-sky-300 hover:text-sky-200 underline break-all"
                          >
                            {proj.link}
                          </a>
                        )}

                        {Array.isArray(proj.media) && proj.media.length > 0 ? (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            {proj.media.map((m, j) => (
                              <MediaThumb key={j} m={m} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-white/50 mt-2">
                            No media uploaded.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
