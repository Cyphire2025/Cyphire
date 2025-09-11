// src/pages/Tasks.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { TiltTaskCard, GradientText } from "./home"; // ✅ reuse your components
import { motion } from "framer-motion";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

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
      if (selectedCategory && !task.category.includes(selectedCategory)) return false;

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
  }, [tasks, selectedCategory, minBudget, maxBudget, deadlineFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-black text-gray-100">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-20 flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-64 hidden md:block space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-fit sticky top-24">
          <h2 className="text-xl font-semibold mb-4">
            <GradientText>Filters</GradientText>
          </h2>

          {/* Category */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
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

          {/* Budget */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Budget (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                className="w-1/2 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-1/2 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Deadline</label>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="week">Within 1 week</option>
              <option value="month">Within 1 month</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </aside>

        {/* Task Grid */}
        <main className="flex-1">
          <h1 className="text-3xl font-bold mb-8">
            <GradientText>All Tasks</GradientText>
          </h1>

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
