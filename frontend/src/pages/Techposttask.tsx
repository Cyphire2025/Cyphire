import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  UploadCloud,
  Sparkles,
  Users,
  Wallet,
  CalendarDays,
  XCircle,
  CheckCircle,
  CircleDashed,
  Lightbulb,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { apiFetch } from "../lib/fetch";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";



const MAX_CATEGORIES = 3;
const MAX_ATTACHMENTS = 5;

export default function PostTask() {
  const navigate = useNavigate();

  const categories = [
    "Design",
    "Development",
    "Marketing",
    "Writing",
    "Data",
    "AI",
    "DevOps",
  ];

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [numApplicants, setNumApplicants] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [particles, setParticles] = useState<Array<{ left: string; top: string; size: string; duration: string }>>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [openDeadline, setOpenDeadline] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 6 + 4}px`,
      duration: `${Math.random() * 8 + 6}s`,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (!logo) {
      setLogoPreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(logo);
    setLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logo]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= MAX_CATEGORIES) {
        alert(`You can select up to ${MAX_CATEGORIES} categories.`);
        return prev;
      }
      return [...prev, category];
    });
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length <= MAX_ATTACHMENTS) {
      setAttachments((prev) => [...prev, ...files]);
    } else {
      alert(`You can upload up to ${MAX_ATTACHMENTS} attachments.`);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
  e?.preventDefault?.();

  try {
    setPosting(true);
    setPosted(false);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    // category + subcategories you already use
    formData.append("category", "Tech");
    selectedCategories.forEach((cat: string) => formData.append("categories[]", cat));

    // numbers as strings for FormData
    formData.append("numberOfApplicants", String(numApplicants));
    formData.append("price", String(price));

    if (deadline) {
      formData.append("deadline", new Date(deadline).toISOString());
    }

    // OPTIONAL FIELDS REMOVED (no state defined):
    // - locationType / location
    // - selectedSkills / tags

    // files
    if (logo) formData.append("logo", logo as File);
    if (Array.isArray(attachments)) {
      attachments.forEach((file: File) => formData.append("attachments", file));
    }

    // POST (apiFetch auto-adds credentials + X-CSRF-Token)
    const res = await apiFetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {}
      throw new Error(msg);
    }

    setPosted(true);
    setTimeout(() => navigate("/tasks"), 1600);
  } catch (err: any) {
    console.error("Error posting task:", err);
    alert(`Failed to post task: ${err?.message || "Unknown error"}`);
    setPosting(false);
  }
};

  const essentials = [
    {
      id: "title",
      label: "Sharpen your title",
      hint: "Aim for a crisp, outcome-focused headline.",
      complete: Boolean(title.trim()),
    },
    {
      id: "description",
      label: "Describe the deliverable",
      hint: "Spell out scope, tone, and success metrics.",
      complete: description.trim().length > 0,
    },
    {
      id: "categories",
      label: "Tag specialties",
      hint: "Pick up to three to route talent instantly.",
      complete: selectedCategories.length > 0,
    },
    {
      id: "logistics",
      label: "Lock budget & deadline",
      hint: "Transparent expectations speed replies.",
      complete: Boolean(price) && Boolean(deadline),
    },
  ];

  const readinessScore = essentials.length
    ? Math.round((essentials.filter((item) => item.complete).length / essentials.length) * 100)
    : 0;

  const categoriesSummary = selectedCategories.length
    ? selectedCategories.join(", ")
    : "No categories selected yet";

  const attachmentsSummary = attachments.length
    ? `${attachments.length} file${attachments.length > 1 ? "s" : ""} ready`
    : "No attachments yet";

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10"
      style={{ 
        background: "linear-gradient(to bottom right, #0a0a0f, #0c0c14, #000000)",
        color: "hsl(0, 0%, 98%)"
      }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-30rem",
            left: "-20rem",
            width: "50rem",
            height: "50rem",
            background: "radial-gradient(circle at top, hsla(326, 78%, 60%, 0.12), transparent 65%)",
          }}
        />
        <motion.div 
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          style={{
            position: "absolute",
            bottom: "-30rem",
            right: "-20rem",
            width: "50rem",
            height: "50rem",
            background: "radial-gradient(circle at bottom, hsla(198, 93%, 60%, 0.1), transparent 65%)",
          }}
        />
      </div>

      {/* Grain texture */}
      <div 
        className="absolute inset-0 -z-10 mix-blend-soft-light" 
        style={{
          opacity: 0.015,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E\")"
        }}
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="hidden sm:block absolute rounded-full blur-md"
          animate={{ y: [0, -16, 0] }}
          transition={{ 
            duration: parseFloat(p.duration), 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: i * 0.5
          }}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: "hsla(266, 83%, 67%, 0.25)",
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl p-6 shadow-2xl sm:p-8 md:p-10"
          style={{
            background: "hsla(240, 8%, 6%, 0.7)",
            backdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid hsla(0, 0%, 100%, 0.1)",
            boxShadow: "0 35px 120px rgba(129, 17, 188, 0.25)",
          }}
        >
          {/* Decorative blurs */}
          <div 
            className="absolute -right-20 top-0 h-64 w-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: "hsla(266, 83%, 67%, 0.15)" }}
          />
          <div 
            className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl pointer-events-none"
            style={{ background: "hsla(326, 78%, 60%, 0.1)" }}
          />

          <div className="relative grid gap-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
            {/* Main Form Section */}
            <section className="space-y-8">
              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.45 }}
                    className="text-3xl font-semibold sm:text-4xl"
                    style={{
                      background: "linear-gradient(to right, hsl(326, 78%, 60%), hsl(266, 83%, 67%), hsl(198, 93%, 60%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Post Tech Task
                  </motion.h1>
                  <p className="mt-3 text-sm sm:text-base" style={{ color: "hsla(0, 0%, 98%, 0.7)" }}>
                    Submit a world-class brief and we will surface the perfect talent in hours.
                  </p>
                  <p 
                    className="mt-5 text-xs uppercase tracking-[0.35em]"
                    style={{ color: "hsla(326, 78%, 60%, 0.8)" }}
                  >
                    Step 1 of 3 | Task Details
                  </p>
                </div>

                <motion.button
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  onClick={() => navigate("/choose-category")}
                  className="group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition"
                  style={{
                    border: "1px solid hsla(0, 0%, 100%, 0.15)",
                    color: "hsla(0, 0%, 98%, 0.9)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsla(326, 78%, 60%, 0.6)";
                    e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.15)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                  Back
                </motion.button>
              </div>

              {/* Hero Image Upload */}
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: "hsl(0, 0%, 90%)" }}>
                  Hero Image
                </p>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => logoInputRef.current?.click()}
                  className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition"
                  style={{
                    borderColor: "hsla(0, 0%, 100%, 0.15)",
                    background: "hsla(0, 0%, 100%, 0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsla(266, 83%, 67%, 0.7)";
                    e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.15)";
                    e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.05)";
                  }}
                >
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-full transition"
                    style={{
                      background: "hsla(266, 83%, 67%, 0.2)",
                      color: "hsl(266, 83%, 90%)",
                    }}
                  >
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium" style={{ color: "hsl(0, 0%, 98%)" }}>
                    Upload a cover image
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "hsl(240, 5%, 64.9%)" }}>
                    PNG or JPG | Up to 5MB
                  </p>
                  <input
                    ref={logoInputRef}
                    id="logoInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </motion.div>
                {logoPreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center justify-between rounded-2xl p-4"
                    style={{
                      border: "1px solid hsla(0, 0%, 100%, 0.1)",
                      background: "hsla(0, 0%, 100%, 0.05)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={logoPreview}
                        alt="Selected cover"
                        className="h-12 w-12 rounded-xl object-cover"
                        style={{ 
                          boxShadow: "0 0 0 2px hsla(0, 0%, 100%, 0.1)",
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "hsla(0, 0%, 98%, 0.9)" }}>
                          {logo?.name}
                        </p>
                        <p className="text-xs" style={{ color: "hsl(240, 5%, 64.9%)" }}>
                          Ready to make an impression
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="transition"
                      style={{ color: "hsla(0, 0%, 98%, 0.6)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(0, 84%, 60%)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "hsla(0, 0%, 98%, 0.6)")}
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-6">
                <div className="relative">
                  <input
                    id="taskTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Your task title"
                    className="peer block w-full rounded-2xl px-5 pt-7 pb-3 text-[15px] leading-relaxed placeholder-transparent transition focus:outline-none focus:ring-4"
                    style={{
                      border: "1px solid hsla(0, 0%, 100%, 0.12)",
                      background: "hsla(0, 0%, 100%, 0.05)",
                      color: "hsl(0, 0%, 98%)",
                      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "hsla(326, 78%, 60%, 0.7)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                      e.currentTarget.style.boxShadow = "0 0 0 4px hsla(266, 83%, 67%, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.12)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.05)";
                      e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.1)";
                    }}
                  />
                  <label
                    htmlFor="taskTitle"
                    className="pointer-events-none absolute left-5 top-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-[11px]"
                    style={{
                      color: "hsl(326, 78%, 70%)",
                    }}
                  >
                    Title
                  </label>
                  <p className="mt-2 text-xs" style={{ color: "hsl(240, 5%, 64.9%)" }}>
                    Capture the project in one punchy sentence.
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    id="taskDescription"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the deliverables, tone, tech stack, success metrics..."
                    className="peer block w-full resize-none rounded-2xl px-5 pt-7 pb-3 text-[15px] leading-relaxed placeholder-transparent transition focus:outline-none focus:ring-4"
                    style={{
                      border: "1px solid hsla(0, 0%, 100%, 0.12)",
                      background: "hsla(0, 0%, 100%, 0.05)",
                      color: "hsl(0, 0%, 98%)",
                      boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "hsla(326, 78%, 60%, 0.7)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                      e.currentTarget.style.boxShadow = "0 0 0 4px hsla(266, 83%, 67%, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.12)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.05)";
                      e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.1)";
                    }}
                  />
                  <label
                    htmlFor="taskDescription"
                    className="pointer-events-none absolute left-5 top-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-[11px]"
                    style={{
                      color: "hsl(326, 78%, 70%)",
                    }}
                  >
                    Description
                  </label>
                  <p className="mt-2 text-xs" style={{ color: "hsl(240, 5%, 64.9%)" }}>
                    Outline deliverables, context, and what success looks like.
                  </p>
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="mb-3 text-sm font-medium" style={{ color: "hsl(0, 0%, 90%)" }}>
                  Sub Categories
                </p>
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => {
                    const selected = selectedCategories.includes(cat);
                    const disabled = !selected && selectedCategories.length >= MAX_CATEGORIES;
                    
                    return (
                      <motion.button
                        key={cat}
                        type="button"
                        layout
                        disabled={disabled}
                        aria-pressed={selected}
                        whileTap={!disabled ? { scale: 0.95 } : undefined}
                        whileHover={!disabled ? { scale: 1.03 } : undefined}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        onClick={() => !disabled && handleCategoryClick(cat)}
                        className="relative flex select-none items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition"
                        style={{
                          border: selected ? "none" : "1px solid hsla(0, 0%, 100%, 0.15)",
                          background: selected 
                            ? "linear-gradient(to right, hsl(266, 83%, 67%), hsl(326, 78%, 60%))"
                            : "hsla(0, 0%, 100%, 0.05)",
                          color: selected ? "hsl(0, 0%, 100%)" : "hsla(0, 0%, 90%, 0.9)",
                          opacity: disabled ? 0.4 : 1,
                          cursor: disabled ? "not-allowed" : "pointer",
                          boxShadow: selected ? "0 10px 30px hsla(266, 83%, 67%, 0.3)" : "none",
                        }}
                      >
                        <Sparkles className="h-4 w-4 opacity-70" />
                        {cat}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs" style={{ color: "hsl(240, 5%, 64.9%)" }}>
                  Choose up to {MAX_CATEGORIES} specialties to help pros find your brief.
                </p>
              </div>

              {/* Applicants, Budget, Deadline */}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {/* Applicants */}
                <div className="relative min-w-[170px]">
                  <Users 
                    className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "hsla(326, 78%, 70%, 0.7)" }}
                  />
                  <input
                    id="applicants"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={numApplicants}
                    onChange={(e) => setNumApplicants(e.target.value)}
                    placeholder="0"
                    className="peer block w-full rounded-2xl px-12 pr-14 pt-8 pb-3 text-[15px] leading-relaxed placeholder-transparent transition focus:outline-none focus:ring-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{
                      border: "1px solid hsla(0, 0%, 100%, 0.12)",
                      background: "hsla(0, 0%, 100%, 0.05)",
                      color: "hsl(0, 0%, 98%)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "hsla(326, 78%, 60%, 0.7)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                      e.currentTarget.style.boxShadow = "0 0 0 4px hsla(266, 83%, 67%, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.12)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <label
                    htmlFor="applicants"
                    className="pointer-events-none absolute left-12 top-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-200 peer-placeholder-shown:left-12 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-focus:top-3 peer-focus:text-[11px]"
                    style={{ color: "hsl(326, 78%, 70%)" }}
                  >
                    Applicants
                  </label>
                </div>

                {/* Budget */}
                <div className="relative min-w-[170px]">
                  <Wallet 
                    className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "hsla(326, 78%, 70%, 0.7)" }}
                  />
                  <input
                    id="price"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="peer block w-full rounded-2xl px-12 pr-14 pt-8 pb-3 text-[15px] leading-relaxed placeholder-transparent transition focus:outline-none focus:ring-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{
                      border: "1px solid hsla(0, 0%, 100%, 0.12)",
                      background: "hsla(0, 0%, 100%, 0.05)",
                      color: "hsl(0, 0%, 98%)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "hsla(326, 78%, 60%, 0.7)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                      e.currentTarget.style.boxShadow = "0 0 0 4px hsla(266, 83%, 67%, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.12)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <label
                    htmlFor="price"
                    className="pointer-events-none absolute left-12 top-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-200 peer-placeholder-shown:left-12 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-focus:top-3 peer-focus:text-[11px]"
                    style={{ color: "hsl(326, 78%, 70%)" }}
                  >
                    Budget (₹)
                  </label>
                </div>

                {/* Deadline */}
                <div className="relative min-w-[170px]">
                  <CalendarDays 
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 z-10"
                    style={{ color: "hsla(326, 78%, 70%, 0.7)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setOpenDeadline(!openDeadline)}
                    className="peer block w-full rounded-2xl px-12 pt-8 pb-3 text-[15px] leading-relaxed transition focus:outline-none focus:ring-4 text-left"
                    style={{
                      border: "1px solid hsla(0, 0%, 100%, 0.12)",
                      background: "hsla(0, 0%, 100%, 0.05)",
                      color: deadline ? "hsl(0, 0%, 98%)" : "transparent",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "hsla(326, 78%, 60%, 0.7)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                      e.currentTarget.style.boxShadow = "0 0 0 4px hsla(266, 83%, 67%, 0.2)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.12)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.05)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {deadline ? format(deadline, "PP") : "-"}
                  </button>
                  <label
                    className="pointer-events-none absolute left-12 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-200"
                    style={{
                      top: deadline ? "0.75rem" : "50%",
                      transform: deadline ? "none" : "translateY(-50%)",
                      fontSize: deadline ? "11px" : "12px",
                      color: deadline ? "hsl(326, 78%, 70%)" : "hsl(240, 5%, 64.9%)",
                    }}
                  >
                    Deadline
                  </label>
                  
                  {/* Inline Calendar */}
                  <AnimatePresence>
                    {openDeadline && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 z-50 rounded-xl p-4 shadow-2xl"
                        style={{
                          background: "hsl(240, 8%, 6%)",
                          border: "1px solid hsla(0, 0%, 100%, 0.1)",
                        }}
                      >
                        <SimpleCalendar
                          selected={deadline}
                          onSelect={(date) => {
                            setDeadline(date);
                            setOpenDeadline(false);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <p className="mb-3 text-sm font-medium" style={{ color: "hsl(0, 0%, 90%)" }}>
                  Attachments <span className="text-xs" style={{ color: "hsl(240, 5%, 64.9%)" }}>(Optional)</span>
                </p>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition"
                  style={{
                    borderColor: "hsla(0, 0%, 100%, 0.15)",
                    background: "hsla(0, 0%, 100%, 0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "hsla(266, 83%, 67%, 0.7)";
                    e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.15)";
                    e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.05)";
                  }}
                >
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-full transition"
                    style={{
                      background: "hsla(266, 83%, 67%, 0.2)",
                      color: "hsl(266, 83%, 90%)",
                    }}
                  >
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium" style={{ color: "hsl(0, 0%, 98%)" }}>
                    Drop files or click to browse
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "hsl(240, 5%, 64.9%)" }}>
                    Up to {MAX_ATTACHMENTS} files · PDF, ZIP, Figma, Docs
                  </p>
                  <input
                    ref={fileInputRef}
                    id="fileInput"
                    type="file"
                    multiple
                    onChange={handleAttachmentChange}
                    className="hidden"
                  />
                </motion.div>
                <AnimatePresence>
                  {attachments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      className="mt-4 flex flex-wrap gap-3"
                    >
                      {attachments.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${index}`}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm"
                          style={{
                            border: "1px solid hsla(0, 0%, 100%, 0.1)",
                            background: "hsla(0, 0%, 100%, 0.05)",
                            color: "hsla(0, 0%, 98%, 0.9)",
                          }}
                        >
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="transition"
                            style={{ color: "hsla(0, 0%, 98%, 0.6)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(0, 84%, 60%)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "hsla(0, 0%, 98%, 0.6)")}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="sticky bottom-4 w-full rounded-2xl px-6 py-3 text-lg font-semibold transition focus:outline-none focus:ring-4"
                onClick={handleSubmit}
                disabled={posting}
                style={{
                  background: "linear-gradient(to right, hsl(326, 78%, 60%), hsl(266, 83%, 67%), hsl(198, 93%, 60%))",
                  boxShadow: "0 20px 60px rgba(129, 17, 188, 0.35)",
                  color: "hsl(0, 0%, 100%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 25px 70px rgba(129, 17, 188, 0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 20px 60px rgba(129, 17, 188, 0.35)";
                }}
              >
                {posting ? "Posting..." : "Post Task"}
              </motion.button>
            </section>

            {/* Sidebar */}
            <aside 
              className="relative mt-2 hidden md:block space-y-6 rounded-3xl px-6 py-8 shadow-2xl sm:px-7 sm:py-10"
              style={{
                border: "1px solid hsla(0, 0%, 100%, 0.1)",
                background: "hsla(0, 0%, 100%, 0.05)",
                backdropFilter: "blur(48px)",
              }}
            >
              <div 
                className="absolute -top-20 right-4 h-40 w-40 rounded-full blur-3xl pointer-events-none"
                style={{
                  background: "linear-gradient(to top right, hsla(266, 83%, 67%, 0.25), hsla(326, 78%, 60%, 0.15), transparent)",
                }}
              />
              
              <div className="relative space-y-6 text-sm" style={{ color: "hsla(0, 0%, 98%, 0.9)" }}>
                {/* Snapshot */}
                <div 
                  className="rounded-2xl p-5"
                  style={{
                    border: "1px solid hsla(0, 0%, 100%, 0.1)",
                    background: "hsla(0, 0, 0%, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p 
                        className="text-xs uppercase tracking-[0.3em]"
                        style={{ color: "hsla(326, 78%, 70%, 0.8)" }}
                      >
                        Snapshot
                      </p>
                    </div>
                    <span 
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: "hsla(0, 0%, 100%, 0.1)",
                        color: "hsl(266, 83%, 80%)",
                      }}
                    >
                      {readinessScore}% ready
                    </span>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div>
                      <dt 
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ color: "hsl(240, 5%, 64.9%)" }}
                      >
                        Title
                      </dt>
                      <dd style={{ color: "hsla(0, 0%, 98%, 0.9)" }}>
                        {title.trim() || "Title coming soon"}
                      </dd>
                    </div>
                    <div>
                      <dt 
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ color: "hsl(240, 5%, 64.9%)" }}
                      >
                        Categories
                      </dt>
                      <dd style={{ color: "hsla(0, 0%, 98%, 0.9)" }}>
                        {categoriesSummary}
                      </dd>
                    </div>
                    <div>
                      <dt 
                        className="text-xs uppercase tracking-[0.2em]"
                        style={{ color: "hsl(240, 5%, 64.9%)" }}
                      >
                        Attachments
                      </dt>
                      <dd style={{ color: "hsla(0, 0%, 98%, 0.9)" }}>
                        {attachmentsSummary}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Checklist */}
                <div 
                  className="rounded-2xl p-5"
                  style={{
                    border: "1px solid hsla(0, 0%, 100%, 0.1)",
                    background: "hsla(0, 0, 0%, 0.25)",
                  }}
                >
                  <p 
                    className="text-xs uppercase tracking-[0.3em]"
                    style={{ color: "hsla(326, 78%, 70%, 0.8)" }}
                  >
                    Launch checklist
                  </p>
                  <ul className="mt-4 space-y-3 text-sm">
                    {essentials.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        {item.complete ? (
                          <CheckCircle 
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color: "hsl(160, 84%, 60%)" }}
                          />
                        ) : (
                          <CircleDashed 
                            className="mt-0.5 h-4 w-4 flex-shrink-0"
                            style={{ color: "hsla(326, 78%, 70%, 0.7)" }}
                          />
                        )}
                        <div>
                          <p 
                            className="font-medium"
                            style={{ color: "hsla(0, 0%, 98%, 0.9)" }}
                          >
                            {item.label}
                          </p>
                          <p 
                            className="text-xs"
                            style={{ color: "hsl(240, 5%, 64.9%)" }}
                          >
                            {item.hint}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tip */}
                <div 
                  className="rounded-2xl p-5"
                  style={{
                    border: "1px solid hsla(0, 0%, 100%, 0.1)",
                    background: "linear-gradient(to bottom right, hsla(0, 0%, 100%, 0.1), hsla(0, 0%, 100%, 0.05), transparent)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="rounded-full p-2"
                      style={{ background: "hsla(0, 0%, 100%, 0.1)" }}
                    >
                      <Lightbulb 
                        className="h-5 w-5"
                        style={{ color: "hsl(266, 83%, 80%)" }}
                      />
                    </div>
                    <div>
                      <p 
                        className="text-sm font-semibold"
                        style={{ color: "hsl(0, 0%, 98%)" }}
                      >
                        Pro tip
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: "hsl(240, 5%, 75%)" }}
                      >
                        Give examples of past work or inspiration links so applicants can mirror your style.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://help.withbriefs.com/sample-task"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition"
                    style={{
                      border: "1px solid hsla(0, 0%, 100%, 0.2)",
                      color: "hsl(0, 0%, 98%)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "hsla(266, 83%, 67%, 0.6)";
                      e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "hsla(0, 0%, 100%, 0.2)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    View sample brief
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      {/* Posting Overlay */}
      <AnimatePresence>
        {(posting || posted) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "hsla(0, 0%, 0%, 0.8)",
              backdropFilter: "blur(20px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-3xl p-12 text-center shadow-2xl"
              style={{
                background: "hsl(240, 8%, 6%)",
                border: "1px solid hsla(0, 0%, 100%, 0.1)",
                maxWidth: "400px",
              }}
            >
              {posting && !posted && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mx-auto mb-6 h-16 w-16 rounded-full"
                    style={{
                      border: "3px solid hsla(266, 83%, 67%, 0.3)",
                      borderTopColor: "hsl(266, 83%, 67%)",
                    }}
                  />
                  <h3 
                    className="text-2xl font-semibold mb-2"
                    style={{ color: "hsl(0, 0%, 98%)" }}
                  >
                    Posting Task...
                  </h3>
                  <p style={{ color: "hsl(240, 5%, 64.9%)" }}>
                    We're publishing your task
                  </p>
                </>
              )}
              
              {posted && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mx-auto mb-6"
                  >
                    <CheckCircle 
                      className="h-16 w-16"
                      style={{ color: "hsl(160, 84%, 60%)" }}
                    />
                  </motion.div>
                  <h3 
                    className="text-2xl font-semibold mb-2"
                    style={{ color: "hsl(0, 0%, 98%)" }}
                  >
                    Task Posted!
                  </h3>
                  <p style={{ color: "hsl(240, 5%, 64.9%)" }}>
                    Redirecting to Tasks...
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple inline calendar component
function SimpleCalendar({ selected, onSelect }: { selected: Date | null; onSelect: (date: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());
  
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };
  
  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    );
  };
  
  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate < today;
  };
  
  return (
    <div className="w-[280px]" style={{ color: "hsl(0, 0%, 98%)" }}>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded transition"
          style={{ color: "hsl(240, 5%, 64.9%)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(0, 0%, 98%)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(240, 5%, 64.9%)")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded transition"
          style={{ color: "hsl(240, 5%, 64.9%)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(0, 0%, 98%)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(240, 5%, 64.9%)")}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div 
            key={day} 
            className="text-center text-xs font-medium py-1"
            style={{ color: "hsl(240, 5%, 64.9%)" }}
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div key={index}>
            {day ? (
              <button
                type="button"
                disabled={isPast(day)}
                onClick={() => {
                  if (!isPast(day)) {
                    onSelect(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                  }
                }}
                className="w-full aspect-square rounded-lg text-sm transition"
                style={{
                  background: isSelected(day)
                    ? "linear-gradient(to right, hsl(326, 78%, 60%), hsl(266, 83%, 67%))"
                    : isPast(day)
                    ? "transparent"
                    : "transparent",
                  color: isSelected(day)
                    ? "hsl(0, 0%, 100%)"
                    : isPast(day)
                    ? "hsl(240, 5%, 40%)"
                    : "hsl(0, 0%, 98%)",
                  cursor: isPast(day) ? "not-allowed" : "pointer",
                  opacity: isPast(day) ? 0.3 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isPast(day) && !isSelected(day)) {
                    e.currentTarget.style.background = "hsla(0, 0%, 100%, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPast(day) && !isSelected(day)) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {day}
              </button>
            ) : (
              <div />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
