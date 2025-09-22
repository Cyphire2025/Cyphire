/* eslint-disable no-unused-vars */
// src/pages/viewtask.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import {
  ArrowLeft,
  Calendar,
  Paperclip,
  Users,
  Wallet,
  Clock,
  Star,
} from "lucide-react";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const GradientText = ({ children, className = "" }) => (
  <span className={`bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent ${className}`}>{children}</span>
);

const NeonButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] focus:outline-none ${className}`}
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

const Label = ({ icon: Icon, children }) => (
  <div className="mb-1 inline-flex items-center gap-2 text-xs text-white/70">
    {Icon ? <Icon className="h-4 w-4" /> : null}
    {children}
  </div>
);

const toDaysLeft = (dateIso) => {
  if (!dateIso) return null;
  const end = new Date(dateIso);
  const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return diff;
};

const inr = (n) => {
  if (n == null) return "—";
  const num = typeof n === "string" ? Number(n.replace(/[^\d.]/g, "")) : Number(n);
  if (Number.isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const CountdownTimer = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const endTime = new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000;
    const update = () => {
      const now = Date.now();
      const diff = Math.max(endTime - now, 0);
      setTimeLeft(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-gradient-to-r from-fuchsia-800/20 via-violet-800/20 to-sky-800/20 px-3 py-1 text-xs text-white/80 shadow-inner shadow-fuchsia-400/10">
      <Clock className="h-3.5 w-3.5" />
      <span className="font-mono">
        {days}d {hours.toString().padStart(2, "0")}h:{minutes.toString().padStart(2, "0")}m:{seconds.toString().padStart(2, "0")}s
      </span>
    </span>
  );
};

export default function ViewTask() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [isOwner, setIsOwner] = useState(false);
  const [applied, setApplied] = useState(false);

  // Timeout message if server is slow
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setErr("⏱️ Server took too long. Please try again.");
        setLoading(false);
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [loading]);

  // Load both: current user and task
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setErr("");

      try {
        const [meRes, taskRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/me`, { cache: "no-store", credentials: "include" }),
          fetch(`${API_BASE}/api/tasks/${id}`, { cache: "no-store", credentials: "include" }),
        ]);

        const meJson = meRes.ok ? await meRes.json() : { user: null };
        const tJson = taskRes.ok ? await taskRes.json() : null;

        if (!alive) return;

        const meUser = meJson?.user || null;
        setMe(meUser);

        if (!tJson) {
          // Fallback: fetch all tasks and find by id
          const all = await fetch(`${API_BASE}/api/tasks`, { cache: "no-store", credentials: "include" });
          if (!all.ok) throw new Error("Failed to fetch tasks");
          const arr = await all.json();
          const t = arr.find((x) => (x._id || x.id) === id);
          if (!t) throw new Error("Task not found");
          setTask(t);

          if (meUser?._id && Array.isArray(t.applicants)) {
            const alreadyApplied = t.applicants.some((u) => String(u?._id || u) === String(meUser._id));
            setApplied(alreadyApplied);
            setIsOwner(String(t.createdBy) === String(meUser._id));
          }
        } else {
          setTask(tJson);

          if (meUser?._id && Array.isArray(tJson.applicants)) {
            const alreadyApplied = tJson.applicants.some((u) => String(u?._id || u) === String(meUser._id));
            setApplied(alreadyApplied);
            setIsOwner(String(tJson.createdBy) === String(meUser._id));
          }
        }
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load task");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [id]);

  const deadlineDaysLeft = useMemo(() => toDaysLeft(task?.deadline), [task]);

  const categories = useMemo(() => {
    return task?.category?.length
      ? task.category
      : task?.categories?.length
        ? task.categories
        : [];
  }, [task]);

  const isSponsorship = categories.some((c) => c.toLowerCase() === "sponsorship");


  // applied/total display
  const appliedCount = Array.isArray(task?.applicants) ? task.applicants.length : 0;
  const totalSeats = Number(task?.numberOfApplicants) || 0;

  const handleApply = async () => {
    try {
      if (!me?._id) {
        alert("Please sign in first.");
        navigate("/signin");
        return;
      }
      if (isOwner) {
        alert("You cannot apply to your own task.");
        return;
      }
      if (applied) return; // already applied → no-op

      const res = await fetch(`${API_BASE}/api/tasks/${task._id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to apply");
      }

      // Server returns updated task { _id, applicants, numberOfApplicants }
      const updated = data?.task;
      if (updated) {
        setTask((prev) => ({
          ...prev,
          applicants: Array.isArray(updated.applicants) ? updated.applicants : (prev?.applicants || []),
          numberOfApplicants:
            typeof updated.numberOfApplicants === "number"
              ? updated.numberOfApplicants
              : (prev?.numberOfApplicants || 0), // capacity unchanged
        }));
      } else {
        // Fallback: append locally
        setTask((prev) => ({
          ...prev,
          applicants: Array.isArray(prev?.applicants) ? [...prev.applicants, me._id] : [me._id],
        }));
      }

      setApplied(true);
    } catch (e) {
      alert(e.message || "Could not apply right now.");
    }
  };

  const handleStartEscrow = async () => {
    alert("ℹ️ Escrow coming soon.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-fuchsia-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <p className="text-sm text-white/60">Loading task details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100">
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 pt-24 pb-16">
        <div className="pointer-events-none absolute -left-20 -top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-xl transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {err && (
          <GlassCard className="p-6 text-red-300">
            Failed to load task: {err}
          </GlassCard>
        )}

        {!loading && task && (
          <div
            className={`${isSponsorship
                ? "flex justify-center px-4" // sponsorship → flex centers it
                : "grid gap-8 md:grid-cols-3" // normal tasks → grid
              }`}
          >
            <div
              className={`${isSponsorship
                  ? "w-full max-w-5xl" // sponsorship → centered + capped
                  : "md:col-span-2"
                }`}
            >
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] overflow-hidden backdrop-blur-xl"
              >
                {/* 🔥 Banner fills edge-to-edge */}
                <div className="h-32 sm:h-40 md:h-80 w-full overflow-hidden">
                  {task.logo?.url ? (
                    <img
                      src={task.logo.url}
                      alt="task-logo"
                      className="w-full h-full object-cover"
                    />
                  ) : task.attachments?.length > 0 ? (
                    <img
                      src={task.attachments[0].url}
                      alt="task-attachment"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/50 italic">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content with padding */}
                <div className="p-6">
                  <div className="mb-3 inline-flex flex-wrap items-center gap-2 text-xs text-white/70">
                    {categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1"
                      >
                        <Star className="h-3.5 w-3.5" /> {cat}
                      </span>
                    ))}
                    {task?.createdAt && <CountdownTimer createdAt={task.createdAt} />}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    <GradientText>{task.title}</GradientText>
                  </h1>

                  <p className="mt-5 text-white/80 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Extra details if metadata exists */}
                  {task?.metadata && Object.keys(task.metadata).length > 0 && (
                    <div className="mt-6 space-y-2">
                      <h3 className="text-lg font-semibold text-white">Additional Details</h3>
                      <ul className="mt-2 space-y-1 text-sm text-white/80">
                        {Object.entries(task.metadata).map(([key, value]) => {
                          if (!value || (Array.isArray(value) && value.length === 0)) return null;

                          return (
                            <li key={key}>
                              <span className="font-medium capitalize text-fuchsia-300">
                                {key.replace(/([A-Z])/g, " $1")}:
                              </span>{" "}
                              {Array.isArray(value)
                                ? value
                                  .filter((v, i, arr) => v !== "Other" || arr.length === 1) // hide "Other" if custom exists
                                  .join(", ")
                                : String(value)}

                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Extra button only for Sponsorships */}
                  {isSponsorship && isOwner && (
                    <div className="mt-8">
                      <NeonButton onClick={() => navigate("/dashboard")}>
                        View Contact Details
                      </NeonButton>
                    </div>
                  )}


                  {Array.isArray(task.attachments) && task.attachments.length > 0 && (
                    <div className="mt-8">
                      <Label icon={Paperclip}>Attachments</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.attachments.map((a, i) => {
                          const url = a?.url || (typeof a === "string" ? a : "#");
                          const name =
                            a?.original_name ||
                            a?.name ||
                            `File ${i + 1}`;
                          const isImage = (a?.contentType || "").startsWith("image/");
                          const isVideo = (a?.contentType || "").startsWith("video/");

                          return (
                            <div
                              key={i}
                              className="group relative rounded-lg border border-white/10 bg-white/5 p-2"
                            >
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                                title={name}
                              >
                                <div className="w-36 h-24 overflow-hidden rounded-md bg-black/30">
                                  {isVideo ? (
                                    <video src={url} className="w-full h-full object-cover" muted />
                                  ) : isImage ? (
                                    <img src={url} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                                      <Paperclip className="mr-1 h-4 w-4" />
                                      {name}
                                    </div>
                                  )}
                                </div>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {!isSponsorship && (
              <div className="md:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <GlassCard className="p-5">
                    <Label icon={Wallet}>Budget</Label>
                    <div className="text-xl font-semibold text-white">{inr(task.price)}</div>
                  </GlassCard>

                  <GlassCard className="p-5">
                    <Label icon={Calendar}>Deadline</Label>
                    <div className="text-white">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}
                    </div>
                    {deadlineDaysLeft != null && (
                      <div className={`mt-1 text-sm ${deadlineDaysLeft < 0 ? "text-red-300" : "text-white/70"}`}>
                        {deadlineDaysLeft < 0
                          ? `Expired ${Math.abs(deadlineDaysLeft)} day${Math.abs(deadlineDaysLeft) !== 1 ? "s" : ""} ago`
                          : `${deadlineDaysLeft} day${deadlineDaysLeft !== 1 ? "s" : ""} left`}
                      </div>
                    )}
                  </GlassCard>

                  <GlassCard className="p-5">
                    <Label icon={Users}>Applicants</Label>
                    <div className="text-white">
                      {totalSeats > 0 ? `${appliedCount}/${totalSeats}` : `${appliedCount}`}
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5">
                    <div className="flex flex-col gap-3">
                      {!isOwner && (
                        <NeonButton
                          onClick={handleApply}
                          disabled={applied}
                          className={applied ? "opacity-60 cursor-not-allowed" : ""}
                        >
                          {applied ? "Applied" : "Apply to this Task"}
                        </NeonButton>
                      )}
                      {isOwner && (
                        <NeonButton onClick={() => navigate("/dashboard")}>
                          View Dashboard
                        </NeonButton>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
