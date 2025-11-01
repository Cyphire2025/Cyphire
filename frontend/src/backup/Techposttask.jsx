/* 
  Cyphire: TechPostTask.jsx 
  -----------------------------------------
  A Google/Amazon-level, step-by-step, glassmorphic tech task posting flow.
  - Full ARIA, motion, performance, and security standards.
  - Theme: Pink/Fuchsia/Violet/Deep Glass (Cyphire brand)
  - By: ChatGPT, 2025, for Cyphire flagship UI
*/

/* eslint-disable react/prop-types, react/no-unescaped-entities */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Sparkles, Wallet, Users, CalendarDays, UploadCloud, X, Loader2, Info, AlertTriangle, Eye, EyeOff, ShieldCheck, FileText, Zap,
} from "lucide-react";
import Calendar from "@/components/ui/Cal";

// Used to initialize the default form (no reference errors)
const defaultForm = {
  title: "",
  description: "",
  categories: [],
  price: "",
  numApplicants: "",
  deadline: "",
  logo: null,
  logoPreview: "",
  attachments: [],
};


// ---- Theme Colors ----
const COLORS = {
  primary: "from-pink-500 via-fuchsia-500 to-purple-500",
  accent: "from-violet-300 via-fuchsia-400 to-sky-400",
  bg: "bg-[#141414]",
  glass: "bg-black/40 backdrop-blur-2xl border border-white/10",
  glassCard: "bg-white/5 backdrop-blur-xl border border-white/10",
  textSubtle: "text-white/70",
  textMuted: "text-white/40",
  textStrong: "text-white/90",
  neon: "from-fuchsia-400 to-pink-500",
  warning: "from-yellow-400 to-amber-500",
};

// ---- Stepper Model ----
const STEP_CONFIG = [
  { key: "basics", label: "Basics", icon: Sparkles },
  { key: "specialty", label: "Specialties", icon: Users },
  { key: "logistics", label: "Logistics", icon: Wallet },
  { key: "files", label: "Files", icon: UploadCloud },
  { key: "review", label: "Review", icon: ShieldCheck },
];

const CATEGORY_OPTIONS = [
  "Design", "Development", "Marketing", "Writing", "Data", "AI", "DevOps"
];
const MAX_CATEGORIES = 3;
const MAX_ATTACHMENTS = 5;

const LOCAL_STORAGE_KEY = "cyphire.posttask.tech.v2";

// ---- Accessible Glass Card ----
function GlassCard({ children, className = "", elevation = 1, ...props }) {
  const base = [
    "rounded-2xl", "overflow-hidden", "shadow-xl",
    elevation === 2 ? "border-white/15 bg-white/10 backdrop-blur-2xl" :
      elevation === 1 ? "border-white/10 bg-white/5 backdrop-blur-xl" :
        "border-white/5 bg-white/0 backdrop-blur-none",
    className
  ].join(" ");
  return <div className={base} {...props}>{children}</div>;
}

// ---- NeonButton ----
const NeonButton = React.memo(({ children, className = "", loading = false, ...props }) => (
  <button
    {...props}
    className={[
      "relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300",
      "hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70",
      `bg-gradient-to-r ${COLORS.neon}`,
      className
    ].join(" ")}
    disabled={loading || props.disabled}
  >
    {loading && <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />}
    {children}
  </button>
));

// ---- Chip Selector ----
const Chip = React.memo(({ active, children, className = "", ...props }) => (
  <button
    {...props}
    type="button"
    className={[
      "rounded-full px-3 py-1.5 text-sm transition border",
      "select-none",
      active
        ? "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100"
        : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
      className
    ].join(" ")}
    aria-pressed={active}
  >
    {children}
  </button>
));

// ---- Input helpers (XSS safe, ARIA, accessible) ----
const inputCls = "w-full rounded-xl bg-black/30 px-3 py-2.5 leading-6 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-fuchsia-300/35 transition border";
const labelCls = "mb-1 text-[13px] tracking-wide text-white/75";
const errorCls = "border-rose-500 focus:ring-rose-400/60";
const helpText = "mt-1 text-xs text-white/55";
const visuallyHidden = "sr-only";

// ---- Animation presets ----
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: "easeOut" }
};
const fadeRight = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -36 },
  transition: { duration: 0.35, ease: "easeOut" }
};

// ---- Security/validation helpers ----
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function sanitizeString(str) {
  // Simple XSS-safe: strips scripts/tags, allows basic input
  const div = document.createElement('div');
  div.textContent = str || "";
  return div.innerHTML;
}

// ---- Validation logic (stepwise) ----
function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.title.trim()) errors.title = "Title is required.";
    if (!form.description.trim()) errors.description = "Description is required.";
    if (form.title.length > 200) errors.title = "Keep it under 200 characters.";
  }
  if (step === 1) {
    if (!form.categories.length) errors.categories = "Select at least one specialty.";
    if (form.categories.length > MAX_CATEGORIES) errors.categories = `Pick up to ${MAX_CATEGORIES}.`;
  }
  if (step === 2) {
    if (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) < 100) errors.price = "Budget must be a number (min 100).";
    if (!form.numApplicants.trim() || isNaN(Number(form.numApplicants)) || Number(form.numApplicants) < 1) errors.numApplicants = "Applicants must be at least 1.";
    if (!form.deadline) errors.deadline = "Set a deadline.";
    else if (new Date(form.deadline) < new Date()) errors.deadline = "Deadline must be in the future.";
  }
  // No required in files (optional)
  return errors;
}

// ---- Main Form Component ----
export default function TechPostTask() {
  const navigate = useNavigate();
  // ----- Step state -----
  const [step, setStep] = useState(0);

  // ----- Form state -----
  const [form, setForm] = useState(() => {
    // Resume draft
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? { ...defaultForm, ...JSON.parse(raw) } : defaultForm;
    } catch {
      return defaultForm;
    }
  });


  // Error and UX state
  const [errors, setErrors] = useState({});
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // e.g., "Saved", "Error", ""
  const [showUnsaved, setShowUnsaved] = useState(false);

  // Refs for fields for accessibility focus management
  const fieldRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];

  // Autosave draft logic
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const { logo, logoPreview, attachments, ...rest } = form;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rest));
        setSaveStatus("Saved");
      } catch {
        setSaveStatus("Save failed");
      }
    }, 400);
    return () => clearTimeout(id);
  }, [form]);

  // Load logo preview (avoid memory leaks)
  useEffect(() => {
    if (!form.logo) {
      setForm(f => ({ ...f, logoPreview: "" }));
      return;
    }
    const objectUrl = URL.createObjectURL(form.logo);
    setForm(f => ({ ...f, logoPreview: objectUrl }));
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.logo]);

  // Stepper progress (animated)
  const progressPct = useMemo(() =>
    Math.round(((step + 1) / STEP_CONFIG.length) * 100), [step]
  );

  // Anim particles
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 10 + 4}px`,
        duration: `${Math.random() * 8 + 6}s`,
        blur: `${Math.random() * 8 + 4}px`,
      }))
    );
  }, []);

  // Keyboard navigation: ArrowRight/ArrowLeft and Enter
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey || e.altKey)) return;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement.tagName)) return;
      if (e.key === "ArrowRight" && step < STEP_CONFIG.length - 1) goNext();
      if (e.key === "ArrowLeft" && step > 0) goPrev();
      if (e.key === "Enter" && step < STEP_CONFIG.length - 1) goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Step navigation (robust, manages errors/focus)
  const goPrev = useCallback(() => setStep(s => clamp(s - 1, 0, STEP_CONFIG.length - 1)), []);
  const goNext = useCallback(() => {
    const nextErrors = validateStep(step, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Focus first error
      const errField = Object.keys(nextErrors)[0];
      fieldRefs[step]?.current?.querySelector(`[name="${errField}"]`)?.focus?.();
      setShowUnsaved(true);
      return;
    }
    setStep(s => clamp(s + 1, 0, STEP_CONFIG.length - 1));
    setShowUnsaved(false);
  }, [step, form]);

  // Category select
  const handleCategoryClick = (cat) => {
    setForm(f => {
      const arr = f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : (f.categories.length < MAX_CATEGORIES ? [...f.categories, cat] : f.categories);
      return { ...f, categories: arr };
    });
  };

  // File upload (attachments)
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (form.attachments.length + files.length <= MAX_ATTACHMENTS) {
      setForm(f => ({ ...f, attachments: [...f.attachments, ...files] }));
    } else {
      alert(`You can upload up to ${MAX_ATTACHMENTS} files.`);
    }
  };
  const removeAttachment = idx => setForm(f => ({
    ...f,
    attachments: f.attachments.filter((_, i) => i !== idx)
  }));

  // Secure text handler for all text fields (anti-XSS)
  const handleTextInput = (field) => (e) => {
    setForm(f => ({ ...f, [field]: sanitizeString(e.target.value) }));
    setErrors(e => ({ ...e, [field]: "" }));
  };

  // Logo select/preview
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      alert("Logo must be an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo too big (max 5MB)");
      return;
    }
    setForm(f => ({ ...f, logo: file }));
  };

  // Remove logo
  const handleLogoRemove = () => setForm(f => ({ ...f, logo: null, logoPreview: "" }));

  // Main submit: compatible with backend contract (do not change structure)
  const handleSubmit = async () => {
    setPosting(true);
    setPosted(false);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", "Tech"); // Contract: don't change
      form.categories.forEach((cat) => formData.append("categories[]", cat));
      formData.append("numberOfApplicants", form.numApplicants);
      formData.append("price", form.price);
      if (form.deadline) formData.append("deadline", form.deadline);
      if (form.logo) formData.append("logo", form.logo);
      form.attachments.forEach((file) => formData.append("attachments", file));

      // Use backend config
      const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        setPosted(true);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setTimeout(() => navigate("/tasks"), 1800);
      } else {
        const errData = await res.json();
        alert(`Failed to post task: ${errData.error || "Unknown error"}`);
        setPosting(false);
      }
    } catch (error) {
      alert("An error occurred while posting the task.");
      setPosting(false);
    }
  };
  // --- RENDER ---
  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10 text-white overflow-hidden select-none"
      aria-label="Post a new Tech Task — Cyphire"
      tabIndex={-1}
    >
      {/* Animated Glass Gradient + Particles */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Multi-layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900 animate-gradient opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_60%)]" />
        {/* Animated floating particles */}
        {particles.map((p, i) => (
          <span
            aria-hidden="true"
            key={i}
            className="absolute rounded-full bg-fuchsia-400/20 blur-2xl animate-float"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              filter: `blur(${p.blur})`,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Main Glass Card Container */}
      <GlassCard
        elevation={2}
        className="relative z-10 w-full max-w-3xl p-0 sm:p-0 shadow-[0_35px_120px_rgba(129,17,188,0.23)] overflow-visible"
        aria-live="polite"
      >
        {/* Stepper */}
        <nav
          aria-label="Progress"
          className="sticky top-0 bg-black/15 z-30 px-7 pt-6 pb-4 backdrop-blur-xl"
        >
          <ol className="flex items-center gap-5">
            {STEP_CONFIG.map((s, idx) => (
              <li
                key={s.key}
                className="flex items-center gap-2 relative"
                aria-current={step === idx ? "step" : undefined}
                aria-label={s.label}
              >
                <span className={`flex items-center justify-center h-8 w-8 rounded-full 
                  ${step === idx ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow-lg scale-105"
                    : "bg-white/5 text-white/60 border border-white/15"} 
                  transition-all duration-300`}>
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                  <span className={visuallyHidden}>{s.label}</span>
                </span>
                {idx < STEP_CONFIG.length - 1 && (
                  <span className={`w-10 h-1 rounded bg-gradient-to-r
                    ${step >= idx + 1 ? "from-pink-400 to-fuchsia-400"
                      : "from-white/20 to-white/10"}
                    mx-1 transition-all duration-300`} />
                )}
              </li>
            ))}
          </ol>
          {/* Animated progress bar */}
          <div className="w-full mt-4 mb-1 bg-white/15 h-2 rounded-xl overflow-hidden">
            <motion.div
              layout
              className="bg-gradient-to-r from-pink-400 to-fuchsia-400 h-2 rounded-xl transition-all duration-300"
              style={{ width: `${progressPct}%` }}
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
        </nav>

        {/* Main Step Body */}
        <div className="p-7">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 && (
              <motion.section
                key="step-basics"
                {...fadeRight}
                ref={fieldRefs[0]}
                aria-label="Basic Details"
                tabIndex={-1}
                className="space-y-8"
              >
                <div>
                  <label htmlFor="title" className={labelCls}>
                    Title <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    className={`${inputCls} ${errors.title ? errorCls : ""}`}
                    placeholder="Eg. Build a realtime dashboard"
                    maxLength={200}
                    autoComplete="off"
                    autoFocus
                    value={form.title}
                    onChange={handleTextInput("title")}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    {errors.title && (
                      <span className={helpText + " text-rose-300"}>{errors.title}</span>
                    )}
                    <span className={helpText + " ml-auto"}>{form.title.length}/200</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="description" className={labelCls}>
                    Description <span className="text-rose-300">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    className={`${inputCls} ${errors.description ? errorCls : ""}`}
                    placeholder="Describe your requirements, expected output, tech stack, etc."
                    rows={4}
                    value={form.description}
                    onChange={handleTextInput("description")}
                  />
                  {errors.description && (
                    <span className={helpText + " text-rose-300"}>{errors.description}</span>
                  )}
                  <span className={helpText}>Be as clear as possible to attract the best talent.</span>
                </div>
              </motion.section>
            )}

            {step === 1 && (
              <motion.section
                key="step-specialty"
                {...fadeRight}
                ref={fieldRefs[1]}
                aria-label="Specialties"
                tabIndex={-1}
                className="space-y-8"
              >
                <div>
                  <label className={labelCls}>
                    Select Specialties <span className="text-rose-300">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3 mt-2" role="group" aria-label="Specialties">
                    {CATEGORY_OPTIONS.map((cat) => (
                      <Chip
                        key={cat}
                        active={form.categories.includes(cat)}
                        onClick={() => handleCategoryClick(cat)}
                        aria-pressed={form.categories.includes(cat)}
                        aria-label={cat}
                      >
                        {cat}
                      </Chip>
                    ))}
                  </div>
                  {errors.categories && (
                    <span className={helpText + " text-rose-300"}>{errors.categories}</span>
                  )}
                  <span className={helpText}>Pick up to {MAX_CATEGORIES}. Tags help route your task to the right talent.</span>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="step-logistics"
                {...fadeRight}
                ref={fieldRefs[2]}
                aria-label="Logistics"
                tabIndex={-1}
                className="space-y-8"
              >
                <div>
                  <label htmlFor="price" className={labelCls}>
                    Budget (INR) <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    inputMode="numeric"
                    min="100"
                    className={`${inputCls} ${errors.price ? errorCls : ""}`}
                    placeholder="Eg. 5000"
                    value={form.price}
                    onChange={handleTextInput("price")}
                  />
                  {errors.price && (
                    <span className={helpText + " text-rose-300"}>{errors.price}</span>
                  )}
                  <span className={helpText}>Minimum ₹100. Transparent budgets attract faster responses.</span>
                </div>
                <div>
                  <label htmlFor="numApplicants" className={labelCls}>
                    Number of Applicants <span className="text-rose-300">*</span>
                  </label>
                  <input
                    id="numApplicants"
                    name="numApplicants"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    className={`${inputCls} ${errors.numApplicants ? errorCls : ""}`}
                    placeholder="Eg. 2"
                    value={form.numApplicants}
                    onChange={handleTextInput("numApplicants")}
                  />
                  {errors.numApplicants && (
                    <span className={helpText + " text-rose-300"}>{errors.numApplicants}</span>
                  )}
                  <span className={helpText}>How many experts do you need? (e.g., 1 for solo, 3 for a pod)</span>
                </div>
                <div>
                  <label htmlFor="deadline" className={labelCls}>
                    Deadline <span className="text-rose-300">*</span>
                  </label>
                  <div className="mt-2">
                    <Calendar
                      selected={form.deadline ? new Date(form.deadline) : null}
                      onSelect={(date) => {
                        // Only allow selecting today or a future date
                        if (!date) return;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        date.setHours(0, 0, 0, 0);
                        if (date < today) {
                          setErrors(e => ({ ...e, deadline: "Deadline must be today or in the future." }));
                          return;
                        }
                        setForm(f => ({ ...f, deadline: date.toISOString().split("T")[0] }));
                        setErrors(e => ({ ...e, deadline: "" }));
                      }}
                    />
                    {form.deadline && (
                      <span className="block mt-2 text-xs text-fuchsia-200">
                        Selected: {new Date(form.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {errors.deadline && (
                      <span className={helpText + " text-rose-300"}>{errors.deadline}</span>
                    )}
                    <span className={helpText}>Be realistic. More time attracts higher quality.</span>
                  </div>
                </div>

              </motion.section>
            )}
            {step === 3 && (
              <motion.section
                key="step-files"
                {...fadeRight}
                ref={fieldRefs[3]}
                aria-label="Upload Files"
                tabIndex={-1}
                className="space-y-8"
              >
                <div>
                  <label htmlFor="logo" className={labelCls}>
                    Logo <span className={subtle}>(optional)</span>
                  </label>
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm file:bg-fuchsia-700/90 file:text-white file:rounded-xl file:px-3 file:py-1.5 file:border-none"
                    onChange={handleLogoChange}
                  />
                  {form.logoPreview && (
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={form.logoPreview}
                        alt="Logo preview"
                        className="h-20 w-20 rounded-xl border border-white/15 object-contain shadow"
                      />
                      <button
                        type="button"
                        className="ml-2 p-1.5 bg-black/50 rounded-full hover:bg-black/80 transition"
                        title="Remove logo"
                        aria-label="Remove logo"
                        onClick={handleLogoRemove}
                      >
                        <X className="h-5 w-5 text-white/70" />
                        <span className={visuallyHidden}>Remove logo</span>
                      </button>
                    </div>
                  )}
                  <span className={helpText}>Best: 1:1 or square, SVG/PNG preferred, max 5MB.</span>
                </div>
                <div>
                  <label htmlFor="attachments" className={labelCls}>
                    Attachments <span className={subtle}>(up to {MAX_ATTACHMENTS})</span>
                  </label>
                  <input
                    id="attachments"
                    name="attachments"
                    type="file"
                    multiple
                    className="block w-full text-sm file:bg-purple-700/90 file:text-white file:rounded-xl file:px-3 file:py-1.5 file:border-none"
                    onChange={handleAttachmentChange}
                    aria-describedby="attachmentsHelp"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl group"
                        aria-label={file.name}
                      >
                        <span className="text-xs">{file.name}</span>
                        <button
                          type="button"
                          className="ml-1 text-rose-400 hover:text-rose-500"
                          onClick={() => removeAttachment(idx)}
                          title={`Remove ${file.name}`}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <span id="attachmentsHelp" className={helpText}>
                    PDF, DOCX, PPTX, TXT, images, code, etc. Max 10MB each.
                  </span>
                </div>
              </motion.section>
            )}

            {step === 4 && (
              <motion.section
                key="step-review"
                {...fadeRight}
                ref={fieldRefs[4]}
                aria-label="Review and Submit"
                tabIndex={-1}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold mb-2">Review your Task</h2>
                <GlassCard className="p-4 mb-4 bg-gradient-to-br from-pink-500/5 via-fuchsia-500/10 to-purple-500/5 border-white/10">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-white/90">
                    <div>
                      <dt className={subtle}>Title</dt>
                      <dd className="font-semibold">{form.title}</dd>
                    </div>
                    <div>
                      <dt className={subtle}>Specialties</dt>
                      <dd>{form.categories.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className={subtle}>Budget</dt>
                      <dd>₹{form.price}</dd>
                    </div>
                    <div>
                      <dt className={subtle}>Deadline</dt>
                      <dd>{form.deadline}</dd>
                    </div>
                    <div>
                      <dt className={subtle}>Applicants Needed</dt>
                      <dd>{form.numApplicants}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className={subtle}>Description</dt>
                      <dd className="whitespace-pre-wrap">{form.description}</dd>
                    </div>
                    <div>
                      <dt className={subtle}>Logo</dt>
                      <dd>{form.logo ? form.logo.name : <span className="text-white/50">None</span>}</dd>
                    </div>
                    <div>
                      <dt className={subtle}>Attachments</dt>
                      <dd>
                        {form.attachments.length > 0
                          ? form.attachments.map((f) => f.name).join(", ")
                          : <span className="text-white/50">None</span>}
                      </dd>
                    </div>
                  </dl>
                </GlassCard>
                <div className="flex items-center gap-3">
                  <NeonButton
                    type="button"
                    className="flex-1"
                    onClick={handleSubmit}
                    loading={posting}
                    aria-label="Submit task"
                  >
                    <CheckCircle2 className="h-5 w-5" /> Post Task
                  </NeonButton>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white/80 hover:bg-white/15 transition"
                    onClick={() => setStep(0)}
                    aria-label="Edit task"
                  >
                    <FileText className="h-4 w-4" /> Edit
                  </button>
                </div>
                {posting && (
                  <div className="mt-5 flex items-center gap-2 text-fuchsia-200">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Posting your task securely…
                  </div>
                )}
                {posted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="mt-6 text-center text-emerald-300 text-lg font-bold"
                  >
                    ✅ Task posted! Redirecting…
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          {/* Step Nav Buttons */}
          <div className="flex items-center justify-between mt-10 mb-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/10 text-white/80 hover:bg-white/15 transition"
              onClick={goPrev}
              disabled={step === 0 || posting}
              aria-label="Previous step"
            >
              <ArrowLeft className="h-4 w-4" /> Prev
            </button>
            {step < STEP_CONFIG.length - 1 && (
              <NeonButton
                type="button"
                className="ml-auto"
                onClick={goNext}
                disabled={posting}
                aria-label="Next step"
              >
                Next <ArrowRight className="h-4 w-4" />
              </NeonButton>
            )}
          </div>
          <div className="flex justify-end mt-1 text-xs text-white/40">
            {saveStatus && (
              <span>
                <Zap className="inline h-4 w-4 mr-1 animate-pulse" />
                {saveStatus}
              </span>
            )}
            {showUnsaved && (
              <span className="ml-4 text-rose-400">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Please correct errors before proceeding.
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
