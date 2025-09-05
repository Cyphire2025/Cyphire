// src/pages/dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { ChevronDown, ChevronUp, Users, FolderOpen } from "lucide-react";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // raw data
  const [me, setMe] = useState(null);
  const [tasks, setTasks] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState(
    new URLSearchParams(window.location.search).get("tab") || "myTasks"
  ); // "myTasks" | "myApplications"
  const [openTaskIdx, setOpenTaskIdx] = useState(null);

  // Load me + tasks
  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const [meRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }),
          fetch(`${API_BASE}/api/tasks`, { credentials: "include" }),
        ]);
        if (!meRes.ok) throw new Error("Failed to fetch profile");
        if (!tasksRes.ok) throw new Error("Failed to fetch tasks");

        const meJson = await meRes.json();
        const tasksJson = await tasksRes.json();

        if (!alive) return;
        setMe(meJson?.user || null);
        setTasks(Array.isArray(tasksJson) ? tasksJson : []);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  // Helpers to normalize IDs
  const toId = (v) => (typeof v === "string" ? v : v?._id || String(v || ""));
  const sameId = (a, b) => toId(a) === toId(b);

  // Derive my lists
  const myTasks = useMemo(() => {
    if (!me) return [];
    return tasks.filter((t) => sameId(t.createdBy, me._id));
  }, [me, tasks, sameId]);

  const myApplications = useMemo(() => {
    if (!me) return [];
    return tasks.filter((t) => {
      const apps = Array.isArray(t.applicants) ? t.applicants : [];
      // applicants could be ObjectIds OR populated users
      return apps.some((appl) => sameId(appl, me._id));
    });
  }, [me, tasks, sameId]);

  const list = activeTab === "myTasks" ? myTasks : myApplications;

  // Select applicant (owner only)
  const onSelectApplicant = async (task, applicant) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${toId(task._id)}/select`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId: toId(applicant) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Select API not implemented yet");

      // Merge returned fields into the local task
      setTasks((prev) =>
        prev.map((t) =>
          sameId(t._id, task._id)
            ? {
              ...t,
              selectedApplicant: d?.task?.selectedApplicant ?? t.selectedApplicant,
              workroomId: d?.task?.workroomId ?? t.workroomId,
            }
            : t
        )
      );
      setOpenTaskIdx(null);
      alert("✅ Applicant selected! Workroom is now available.");
    } catch (e) {
      alert(e.message);
    }
  };

  const SummaryCard = () => (
    <GlassCard className="p-6 flex flex-wrap gap-6 items-center">
      {activeTab === "myTasks" ? (
        <>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <div>
              <div className="text-2xl font-bold">{myTasks.length}</div>
              <div className="text-white/60 text-sm">Tasks posted</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <div>
              <div className="text-2xl font-bold">{myApplications.length}</div>
              <div className="text-white/60 text-sm">Tasks I applied to</div>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );

  const TaskCard = ({ task, idx }) => {
    //const isOwner = me && sameId(task.createdBy, me._id);
    const selectedId = toId(task.selectedApplicant);
    const iAmSelected = me && sameId(selectedId, me._id);
    //const canOpenWorkroom = !!selectedId && (isOwner || iAmSelected);
    const workroomHref = `https://cyphire-workroom.vercel.app/workroom/${task.workroomId || toId(task._id)}`;

    const isOpen = openTaskIdx === idx;
    const appliedCount = task.applicants?.length || 0;
   // const capacity = Number(task.numberOfApplicants || 0);

    return (
      <GlassCard key={toId(task._id)} className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <p className="text-white/70 text-sm mt-1">{task.description}</p>
            <div className="text-xs text-white/50 mt-1">
              {task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleDateString()}` : "No deadline"} | Price: ₹{task.price ?? 0}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {task.category?.map((c) => (
                <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                  {c}
                </span>
              ))}
            </div>
            {task.attachments?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {task.attachments.map((a, i) => (
                  <div
                    key={i}
                    className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-white/5"
                  >
                    {a.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={a.url} className="w-full h-full object-cover" controls />
                    ) : (
                      <img src={a.url} className="w-full h-full object-cover" alt="file" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right-side actions */}
          {activeTab === "myTasks" ? (
            // OWNER VIEW
            selectedId ? (
              <button
                onClick={() => window.open(workroomHref, "_blank")}
                className="text-emerald-200 hover:text-emerald-100 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs"
              >
                Open Workroom
              </button>
            ) : (
              <button
                onClick={() => setOpenTaskIdx(isOpen ? null : idx)}
                className="text-white/70 hover:text-white flex items-center gap-1"
              >
                Applicants ({appliedCount}) {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )
          ) : (
            // APPLICANT VIEW
            (() => {
              if (iAmSelected) {
                return (
                  <button
                    onClick={() => (window.location.href = workroomHref)}
                    className="text-emerald-200 hover:text-emerald-100 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs"
                  >
                    Go to Workroom
                  </button>
                );
              }
              // polite statuses when I’m not selected (or not yet decided)
              return (
                <span className="text-xs text-white/60">
                  {selectedId ? "Not selected this time" : "Under review"}
                </span>
              );
            })()
          )}


        </div>

        {/* Applicants dropdown (owner only, only if not selected yet) */}
        {activeTab === "myTasks" && !selectedId && isOpen && (
          <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
            {appliedCount > 0 ? (
              task.applicants.map((appl, j) => {
                const a = typeof appl === "object" ? appl : { _id: appl };
                const avatar =
                  a.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name || "U")}`;
                const displayName = a.name || "User";
                const profileSlugOrId = a.slug || a._id;
                return (
                  <div
                    key={toId(a._id) + j}
                    className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                      <div>
                        <div className="text-sm font-medium">{displayName}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`/u/${profileSlugOrId}`}
                        className="text-sm text-fuchsia-300 hover:underline"
                      >
                        View Profile
                      </a>

                      <button
                        onClick={() => onSelectApplicant(task, a)}
                        className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-400/20"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-white/50">No applicants yet.</div>
            )}
          </div>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100">
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* heading */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-white/60 mt-2">Manage your tasks and applications.</p>
        </div>

        {err && <GlassCard className="p-4 text-red-300 mb-6">{err}</GlassCard>}

        {loading ? (
          <div className="text-white/70">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="md:col-span-3">
              <GlassCard className="p-4 sticky top-24">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab("myTasks");
                      setOpenTaskIdx(null);
                      const url = new URL(window.location.href);
                      url.searchParams.set("tab", "myTasks");
                      window.history.replaceState({}, "", url);
                    }}
                    className={`w-full text-left rounded-xl px-4 py-3 transition 
                    ${activeTab === "myTasks" ? "bg-white/15 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"}`}
                  >
                    My Tasks
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("myApplications");
                      setOpenTaskIdx(null);
                      const url = new URL(window.location.href);
                      url.searchParams.set("tab", "myApplications");
                      window.history.replaceState({}, "", url);
                    }}
                    className={`w-full text-left rounded-xl px-4 py-3 transition 
                    ${activeTab === "myApplications" ? "bg-white/15 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"}`}
                  >
                    My Applications
                  </button>
                </div>
              </GlassCard>
            </aside>

            {/* Main content */}
            <section className="md:col-span-9 space-y-6">
              {/* Top summary */}
              <SummaryCard />

              {/* List */}
              {list.length === 0 ? (
                <GlassCard className="p-6 text-white/70">
                  {activeTab === "myTasks"
                    ? "You haven’t posted any tasks yet."
                    : "You haven’t applied to any tasks yet."}
                </GlassCard>
              ) : (
                list.map((task, idx) => <TaskCard key={toId(task._id)} task={task} idx={idx} />)
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
