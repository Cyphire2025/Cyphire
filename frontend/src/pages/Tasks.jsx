// src/pages/Tasks.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { GradientText } from "./home"; // ✅ reuse your components
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
  Search,
  Filter,
  Calendar,
  Wallet,
  ToggleRight,
} from "lucide-react";


const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const inr = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n)
    : "—";

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
    <span className="relative inline-flex items-center gap-2">{children}</span>
  </button>
);

export const TiltTaskCard = ({ task }) => {
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
      {/* 🔥 Banner / Logo */}
      <div className="h-40 w-full bg-gradient-to-r from-fuchsia-600/30 via-purple-600/30 to-sky-600/30 flex items-center justify-center overflow-hidden">
        {task.logo?.url ? (
          <img
            src={task.logo.url}
            alt="task-logo"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : task.attachments?.length > 0 ? (
          <img
            src={task.attachments[0].url}
            alt="task-attachment"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white/50 italic">No Logo</span>
        )}
      </div>

      {/* Animated border shine */}
      <div className="pointer-events-none absolute -inset-24 opacity-0 group-hover:opacity-100 transition duration-500"
        style={{
          background:
            "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(168,85,247,0.18), transparent 35%)",
        }}
      />
      <motion.div

        className="relative  bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
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
            className="px-10 py-3 text-s"
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

export default function Tasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


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
    return () => {
      alive = false;
    };
  }, []);

  // Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 🚫 Skip sponsorship listings
      if (
        (Array.isArray(task.category) && task.category.includes("Sponsorship")) ||
        task.category === "Sponsorship"
      ) {
        return false;
      }

      if (selectedCategory && !task.category.includes(selectedCategory)) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      if (minBudget && Number(task.price) < Number(minBudget)) return false;
      if (maxBudget && Number(task.price) > Number(maxBudget)) return false;

      if (deadlineFilter) {
        const deadline = new Date(task.deadline);
        const now = new Date();
        if (deadlineFilter === "week") {
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (deadline > weekFromNow) return false;
        } else if (deadlineFilter === "month") {
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (deadline > monthFromNow) return false;
        }
      }

      if (statusFilter && task.status !== statusFilter) return false;

      return true;
    });
  }, [tasks, selectedCategory, minBudget, maxBudget, deadlineFilter, statusFilter, searchQuery]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-black text-gray-100">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-20 flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-72 hidden md:block space-y-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 h-fit sticky top-24 relative overflow-hidden shadow-[0_0_25px_rgba(236,72,153,0.5)]">
          {/* Keep subtle border overlay */}
          <div className="absolute inset-0 rounded-2xl border border-fuchsia-500/40 pointer-events-none" />
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
            <Filter className="h-5 w-5 text-fuchsia-400" />
            <GradientText>Filters</GradientText>
          </h2>

          {/* Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <Layers className="h-4 w-4 text-violet-400" /> Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-fuchsia-500 transition"
            >
              <option value="">All</option>
              <option value="Tech">Tech</option>
              <option value="Education">Education</option>
              <option value="Architecture">Architecture</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Event Management">Event Management</option>
              <option value="Home & Safety">Home & Safety</option>
            </select>
          </div>

          {/* Budget Dual Slider */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <Wallet className="h-4 w-4 text-sky-400" /> Budget (₹)
            </label>
            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
              <span className="px-2 py-0.5 rounded-lg bg-white/10">{minBudget || "Min"}</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/10">{maxBudget || "Max"}</span>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-full accent-fuchsia-500"
              />
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full accent-sky-500"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <Calendar className="h-4 w-4 text-emerald-400" /> Deadline
            </label>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Any</option>
              <option value="week">Within 1 week</option>
              <option value="month">Within 1 month</option>
            </select>
          </div>

          {/* Status Toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <ToggleRight className="h-4 w-4 text-pink-400" /> Status
            </label>
            <div className="flex flex-col gap-2">
              {["pending", "in-progress", "completed"].map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilter === status}
                    onChange={() => setStatusFilter(statusFilter === status ? "" : status)}
                    className="peer hidden"
                  />
                  <span className="w-10 h-5 rounded-full bg-white/10 relative flex items-center">
                    <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full transition ${statusFilter === status ? "translate-x-5 bg-fuchsia-500" : "bg-white/40"}`} />
                  </span>
                  <span className="capitalize text-white/70 peer-checked:text-white">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>


        {/* Task Grid */}
        <main className="flex-1">
          <h1 className="text-3xl font-bold mb-6">
            <GradientText>All Tasks</GradientText>
          </h1>

          {/* 🔍 Search Bar */}
          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-12 pr-4 py-3 text-sm text-white placeholder-white/40 focus:ring-2 focus:ring-fuchsia-500 transition"
            />
            {/* Future: autosuggest dropdown */}
          </div>


          {loading ? (
            <p className="text-gray-400">Loading tasks...</p>
          ) : filteredTasks.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TiltTaskCard key={task._id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No tasks match your filters.</p>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
