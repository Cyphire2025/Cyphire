// src/pages/Home.jsx
// Ultra-polished, neon glass, dark theme homepage for Cyphire
// Tailwind + Framer Motion required

import React, { useMemo, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Sparkles,
  BadgeCheck,
  Flame,
  Trophy,
  Briefcase,
  Layers,
  Bolt,
  Compass,
  ChevronRight,
  ArrowRight,
  Star,
} from "lucide-react";
import { SwipeCarousel } from "../components/HeroArt";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

/* ========== Utilities ========== */
export const GradientText = ({ children, className = "" }) => (
  <span
    className={`bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 
      bg-clip-text text-transparent ${className}`}
  >
    {children}
  </span>
);

export const GlassCard = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-white/10 bg-white/5 
      backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}
  >
    {children}
  </div>
);

export const NeonButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`relative inline-flex items-center gap-2 rounded-xl px-6 py-3 
      text-sm font-semibold text-white transition-transform duration-200 
      hover:scale-[1.03] focus:outline-none ${className}`}
  >
    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600" />
    <span className="absolute -inset-[1px] rounded-xl 
      bg-gradient-to-r from-violet-400/40 via-fuchsia-400/30 to-sky-400/30 blur-md" />
    <span className="relative">{children}</span>
  </button>
);

const SectionHeader = ({ eyebrow, title, subtitle }) => (
  <header className="mx-auto mb-10 max-w-3xl text-center">
    {eyebrow && (
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
        <Sparkles className="h-4 w-4" aria-hidden="true" /> {eyebrow}
      </div>
    )}
    <h2 className="text-3xl md:text-4xl font-bold">
      <GradientText>{title}</GradientText>
    </h2>
    {subtitle && <p className="mt-4 text-white/70">{subtitle}</p>}
  </header>
);

const Stat = ({ k, v }) => (
  <GlassCard className="px-5 py-4 text-center">
    <div className="text-xs uppercase tracking-wide text-white/60">{k}</div>
    <div className="mt-1 text-2xl font-semibold text-white">{v}</div>
  </GlassCard>
);

/* ========== Utils & Data ========== */

const inr = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n)
    : "—";


/* ========== Background Effects ========== */

const Aurora = ({ className = "" }) => (
  <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
    <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
    <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
    <div className="pointer-events-none absolute inset-0 
      bg-[conic-gradient(from_180deg_at_50%_50%,rgba(168,85,247,0.06),rgba(14,165,233,0.06),rgba(236,72,153,0.06),rgba(168,85,247,0.06))]" />
  </div>
);

const Particles = () => (
  <div className="pointer-events-none absolute inset-0 -z-10">
    {Array.from({ length: 40 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-1 w-1 rounded-full bg-white/40 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float${i % 3} ${6 + (i % 5)}s ease-in-out ${i * 0.12}s infinite`,
          opacity: 0.5,
        }}
      />
    ))}
    <style>{`
      @keyframes float0 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-10px)} }
      @keyframes float1 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-16px)} }
      @keyframes float2 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-22px)} }
    `}</style>
  </div>
);

/* ========== Data ========== */

const features = [
  {
    icon: <BadgeCheck className="h-6 w-6" />,
    title: "Escrow-secured payments",
    desc: "Funds are locked safely until the job is approved. Zero anxiety, full control.",
    badge: "Trust First",
  },
  {
    icon: <Bolt className="h-6 w-6" />,
    title: "Precision talent search",
    desc: "Smart filters + reputation graph to surface the right executors within seconds.",
    badge: "AI-boosted",
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "1‑click contract & kickoff",
    desc: "Use templates, milestones, and NDAs to start instantly—no back-and-forth.",
    badge: "Frictionless",
  },
  {
    icon: <Compass className="h-6 w-6" />,
    title: "Composable task packs",
    desc: "Bundle repeatable tasks into sharable packs your team can reuse and remix.",
    badge: "Reusable",
  },
];

const categories = [
  { name: "Design", icon: <Flame className="h-4 w-4" /> },
  { name: "Development", icon: <Bolt className="h-4 w-4" /> },
  { name: "Marketing", icon: <Trophy className="h-4 w-4" /> },
  { name: "Writing", icon: <Briefcase className="h-4 w-4" /> },
  { name: "Data", icon: <Layers className="h-4 w-4" /> },
  { name: "AI", icon: <Bolt className="h-4 w-4" /> },
  { name: "DevOps", icon: <Compass className="h-4 w-4" /> },
];

/* ========== Task Card (3D tilt + shine, with requested fields) ========== */
const TiltTaskCard = ({ task }) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-12, 12]);

  // Seven-day window based on createdAt
  const createdAt = new Date(task.createdAt || Date.now());
  const expireDate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Categories: show up to 3
  const cats = Array.isArray(task.category) ? task.category.slice(0, 3) : [];

  // Vacancies: show remaining of total (if applicants known)
  // Vacancies: show applied/total
  const totalSeats = Number(task.numberOfApplicants) || 0;           // capacity
  const applied = Array.isArray(task.applicants) ? task.applicants.length : 0;  // current



  return (
    <motion.div
      className="relative group rounded-2xl border border-white/10 bg-white/5 p-[1px] backdrop-blur-xl overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        x.set(px);
        y.set(py);
        e.currentTarget.style.setProperty("--x", `${px * 100}%`);
        e.currentTarget.style.setProperty("--y", `${py * 100}%`);
      }}
      onMouseLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      {/* Animated border shine */}
      <div className="pointer-events-none absolute -inset-24 opacity-0 group-hover:opacity-100 transition duration-500"
        style={{
          background:
            "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(168,85,247,0.18), transparent 35%)",
        }}
      />
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      >
        {/* Categories (max 3) */}
        {cats.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {cats.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70"
              >
                <Star className="h-3.5 w-3.5" /> {c}
              </span>
            ))}
          </div>
        )}

        {/* Title + Desc */}
        <h3 className="text-lg font-semibold text-white">{task.title}</h3>
        <p className="mt-2 text-sm text-white/70 line-clamp-3">{task.description}</p>

        {/* Price + Vacancies + Days left */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-[13px] text-white/85">
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center">
            <div className="text-xs text-white/60">Budget</div>
            <div className="font-medium">{inr(task.price)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center">
            <div className="text-xs text-white/60">Vacancies</div>
            <div className="font-medium">
              {totalSeats > 0 ? `${applied}/${totalSeats} ` : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center">
            <div className="text-xs text-white/60">Apply in</div>
            <div className={`font-medium ${daysLeft <= 0 ? "text-red-300" : ""}`}>
              {daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? "s" : ""}` : "Expired"}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between">
          <NeonButton
            className="px-4 py-2 text-xs"
            onClick={() => (window.location.href = `/task/${task._id || task.id}`)}
          >
            View Task <ArrowRight className="h-4 w-4" />
          </NeonButton>
          {/* Subtle pulse dot */}
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${daysLeft > 0 ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
            <span className="text-xs text-white/60">{applied} applied</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ========== Page ========== */

export default function Home() {
  const featured = useMemo(() => features, []);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCats, setSelectedCats] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const filteredTasks = useMemo(() => {
    if (selectedCats.length === 0) return tasks;
    return tasks.filter((t) => {
      const taskCats = Array.isArray(t.category) ? t.category : [];
      return selectedCats.some((c) => taskCats.includes(c));
    });
  }, [tasks, selectedCats]);

  const pagedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize);

  const toggleCategory = (name) => {
    setPage(1);
    setSelectedCats((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  // Fetch tasks (raw, no remap so the card can use category/applicants directly)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tasks`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        if (alive) setTasks(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching tasks:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100 overflow-x-hidden">
      <main className="relative overflow-hidden">
        <Suspense fallback={<div className="text-center p-6">Loading...</div>}>
          <Navbar />
          <Aurora />
          <Particles />
        </Suspense>

        {/* HERO */}
        <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="pointer-events-none absolute -left-20 -top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl"
              >
                <span className="block text-white">Welcome to</span>
                <GradientText>Cyphire</GradientText>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mt-6 text-lg text-white/70"
              >
                Your secure freelance marketplace—where trust, speed, and craftsmanship
                meet. Discover top executors, automate contracts, and deliver outcomes
                with confidence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <NeonButton onClick={() => navigate("/posttask")}>
                  Post a Task
                </NeonButton>
                <button
                  onClick={() => {
                    const el = document.getElementById("browse-section");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white/80 backdrop-blur-xl transition-all hover:bg-white/10"
                >
                  Explore Marketplace{" "}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>

              <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 md:max-w-lg">
                <Stat k="Tasks Completed" v="48,700+" />
                <Stat k="Average Rating" v="4.9/5" />
                <Stat k="Payouts" v="₹180+ Cr" />
              </div>
            </div>

            <div className="relative">
              <SwipeCarousel />
            </div>
          </div>

          {/* Simple marquee */}
          <div className="relative overflow-hidden py-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent" />
            <div className="flex animate-[marquee_22s_linear_infinite] gap-10 opacity-80">
              {["React", "Tailwind", "Node", "Stripe", "Postgres", "Docker", "AWS", "Framer"].concat(["React", "Tailwind", "Node", "Stripe", "Postgres", "Docker", "AWS", "Framer"]).map((name, i) => (
                <div
                  key={i}
                  className="flex min-w-[10rem] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 backdrop-blur-md"
                >
                  <BadgeCheck className="mr-2 h-4 w-4" /> {name}
                </div>
              ))}
            </div>
            <style>{`@keyframes marquee { 0% { transform: translateX(0)} 100% { transform: translateX(-50%) } }`}</style>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <SectionHeader
            eyebrow="Why Cyphire"
            title="A marketplace engineered for outcomes"
            subtitle="Purpose-built primitives that reduce risk and increase throughput for both sides."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div key={i} className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  {f.icon}
                  <span>{f.badge}</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-white/70">{f.desc}</p>
                <div className="mt-6">
                  <button className="inline-flex items-center gap-2 text-sm text-fuchsia-300/90 transition-colors hover:text-fuchsia-200">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CATEGORIES + TASKS */}
        <section id="browse-section" className="mx-auto max-w-7xl px-6 py-14">
          <SectionHeader
            eyebrow="Browse by craft"
            title="Find exactly what you need"
            subtitle="Tight filters, human signals, and living portfolios make discovery effortless."
          />

          {/* Categories filter buttons */}
          <div className="mb-8 flex flex-wrap items-center gap-3">
            {categories.map((c, i) => {
              const active = selectedCats.includes(c.name);
              return (
                <button
                  key={i}
                  onClick={() => toggleCategory(c.name)}
                  className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-xl transition-all
            ${active
                      ? "border-fuchsia-400 bg-fuchsia-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-fuchsia-400/30 hover:bg-white/10"}
          `}
                >
                  <span className="opacity-70 group-hover:opacity-100">{c.icon}</span>
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Tasks grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <p className="text-gray-400">Loading tasks...</p>
            ) : pagedTasks.length > 0 ? (
              pagedTasks.map((t) => <TiltTaskCard key={t._id || t.id} task={t} />)
            ) : (
              <p className="text-gray-400">No tasks available yet.</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`rounded-lg border px-3 py-2 text-sm backdrop-blur-xl transition 
            ${page === i + 1
                      ? "bg-fuchsia-500/20 border-fuchsia-400 text-white"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"}
          `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>


        {/* SIGNAL */}
        <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-16">
          <div className="absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -right-20 bottom-1/3 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
          <SectionHeader
            eyebrow="Loved by builders"
            title="Signal over noise"
            subtitle="High-signal reputation, transparent histories, and meaningful endorsements."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-3 flex items-center gap-2 text-fuchsia-200">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4" />)}
                </div>
                <p className="text-white/80">
                  “Cyphire made our release twice as fast. The escrow + milestone flow
                  is *chef’s kiss*—smooth, safe, and predictable.”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-fuchsia-400 to-sky-400" />
                  <div>
                    <div className="font-medium text-white">Alex Rivera</div>
                    <div className="text-xs text-white/60">Product Lead @ Nimbus</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-2xl" />
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl md:p-12">
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-semibold text-white md:text-3xl">
                  <GradientText>Ready to ship your next milestone?</GradientText>
                </h3>
                <p className="mt-3 text-white/70">
                  Post a task in minutes, choose from vetted executors, and let escrow
                  keep everything safe. No drama—just delivery.
                </p>
              </div>
              <div className="flex gap-3">
                <NeonButton
                  onClick={() => navigate("/pricing")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-white/80 backdrop-blur-xl transition hover:bg-white/10"
                >
                  Upgrade Now <ArrowRight className="h-4 w-4" />
                </NeonButton>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
