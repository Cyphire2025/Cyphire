// src/pages/ApplyProfessor.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ArrowLeft, ArrowRight, Check, CheckCircle2, GraduationCap, University,
  Briefcase, Link as LinkIcon, ShieldCheck, Info, Timer, AlertTriangle, FileText, X, Loader2
} from "lucide-react";

const DRAFT_KEY = "cyphire.apply.professor.v1";
const STEPS = [
  { key: "basics", label: "Basics", icon: GraduationCap },
  { key: "institution", label: "Institution", icon: University },
  { key: "offerings", label: "Offerings", icon: Briefcase },
  { key: "proof", label: "Proof", icon: LinkIcon },
  { key: "review", label: "Review", icon: ShieldCheck },
];
const inputCls = "w-full rounded-xl bg-black/30 px-3 py-2.5 leading-6 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-emerald-300/35 transition border";
const labelCls = "mb-1 text-[13px] tracking-wide text-white/75";
const errorCls = "border-rose-500 focus:ring-rose-400/60";
const chipBase = "rounded-full px-3 py-1.5 text-sm transition select-none border border-white/10 bg-white/5 hover:bg-white/10";
const chipOn = "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
const chipOff = "text-white/80";
const subtle = "text-white/70";
const helpText = "mt-1 text-xs text-white/55";
const sectionTitleCls = "text-xl font-semibold tracking-tight";

const DEFAULT_AVAIL = [
  { day: "Mon", start: "", end: "", checked: false },
  { day: "Tue", start: "", end: "", checked: false },
  { day: "Wed", start: "", end: "", checked: false },
  { day: "Thu", start: "", end: "", checked: false },
  { day: "Fri", start: "", end: "", checked: false },
  { day: "Sat", start: "", end: "", checked: false },
  { day: "Sun", start: "", end: "", checked: false },
];
const DEFAULT_FORM = {
  avatar: null, avatarUrl: "", fullName: "", headline: "", bio: "", yearsExp: "",
  languages: ["English", "Hindi"], institution: "", department: "", designation: "",
  academicEmail: "", instCity: "", instCountry: "", expertise: [], expertiseOtherOn: false,
  expertiseOther: "", availableFor: [], availOtherOn: false, availOther: "",
  availability: DEFAULT_AVAIL, googleScholar: "", publications: "", orcid: "",
  linkedIn: "", website: "", acceptTnC: false, proofs: [],
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ========================= Validation Logic (by Step) ========================= */
function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.avatarUrl) errors.avatar = "Profile photo is required.";
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.headline.trim()) errors.headline = "Headline is required.";
    if (!form.bio.trim()) errors.bio = "Short bio is required.";
  }
  if (step === 1) {
    if (!form.institution.trim()) errors.institution = "Institution is required.";
    if (!form.department.trim() || form.department.length < 2) errors.department = "Department is required.";
    if (!form.academicEmail.trim()) errors.academicEmail = "Academic email is required.";
    else if (!/\.ac\.in$|\.edu$/.test(form.academicEmail.trim()))
      errors.academicEmail = "Use a valid .ac.in or .edu email.";
  }
  if (step === 2) {
    const expertiseList = [
      ...(form.expertise || []),
      ...(form.expertiseOtherOn && form.expertiseOther.trim() ? [form.expertiseOther.trim()] : []),
    ].filter(Boolean);
    if (!expertiseList.length) errors.expertise = "At least one expertise field is required.";
    const availableList = [
      ...(form.availableFor || []),
      ...(form.availOtherOn && form.availOther.trim() ? [form.availOther.trim()] : []),
    ].filter(Boolean);
    if (!availableList.length) errors.availableFor = "At least one offering is required.";
  }
  if (step === 3) {
    if (form.googleScholar && !/^https?:\/\/.+/i.test(form.googleScholar.trim()))
      errors.googleScholar = "Provide a valid https:// Google Scholar link or leave blank.";
    if (form.publications && !/^\d+$/.test(form.publications))
      errors.publications = "Enter a number for publications.";
  }
  if (step === 4) {
    if (!form.acceptTnC) errors.acceptTnC = "Accept the terms to submit.";
  }
  return errors;
}

/* ================================ Main Page ================================ */
export default function ApplyProfessor() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...DEFAULT_FORM, ...JSON.parse(raw) } : DEFAULT_FORM;
    } catch {
      return DEFAULT_FORM;
    }
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(3);

  // Derived lists
  const expertiseList = useMemo(() => {
    const extra = form.expertiseOtherOn && form.expertiseOther.trim() ? [form.expertiseOther.trim()] : [];
    return Array.from(new Set([...(form.expertise || []), ...extra]));
  }, [form.expertise, form.expertiseOtherOn, form.expertiseOther]);
  const availableList = useMemo(() => {
    const extra = form.availOtherOn && form.availOther.trim() ? [form.availOther.trim()] : [];
    return Array.from(new Set([...(form.availableFor || []), ...extra]));
  }, [form.availableFor, form.availOtherOn, form.availOther]);

  // Autosave draft, exclude blobs
  useEffect(() => {
    const id = setTimeout(() => {
      setSaving(true);
      const { avatar, proofs, ...rest } = form;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
      setSaving(false);
      setSavedAt(Date.now());
    }, 400);
    return () => clearTimeout(id);
  }, [form]);

  // Progress
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  // Focus management for errors
  const formRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Focus the first error field if possible
      const fields = Object.keys(errors);
      const el = formRefs[step].current?.querySelector(
        `[name="${fields[0]}"],[data-errorfield="${fields[0]}"]`
      );
      if (el && el.focus) el.focus();
    }
  }, [errors, step]);

  // Drag & drop for proofs
  const proofDropRef = useRef();
  useEffect(() => {
    const el = proofDropRef.current;
    if (!el) return;
    const onDrop = (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) setForm(f => ({ ...f, proofs: [...f.proofs, ...files.slice(0, 10 - f.proofs.length)] }));
      el.classList.remove("ring-emerald-400", "bg-emerald-800/20");
    };
    const onDragOver = (e) => {
      e.preventDefault();
      el.classList.add("ring-emerald-400", "bg-emerald-800/20");
    };
    const onDragLeave = (e) => {
      el.classList.remove("ring-emerald-400", "bg-emerald-800/20");
    };
    el.addEventListener("drop", onDrop);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    return () => {
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
    };
  }, []);

  // Step transitions
  const goPrev = () => setStep(s => clamp(s - 1, 0, STEPS.length - 1));
  const goNext = () => {
    const nextErrors = validateStep(step, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0)
      setStep(s => clamp(s + 1, 0, STEPS.length - 1));
  };

  // Validation per step before submit
  function submit() {
    const errs = validateStep(step, form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Last page validation (can never get here if errors in earlier steps)
    async function doSubmit() {
      try {
        // Build objects
        const profile = {
          fullName: form.fullName.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          languages: form.languages,
          location: [form.instCity, form.instCountry].filter(Boolean).join(", "),
          socials: { website: form.website || "", linkedin: form.linkedIn || "" },
        };
        const professor = {
          institution: form.institution.trim(),
          department: form.department.trim(),
          designation: form.designation || "",
          expertise: expertiseList,
          publications: Number(form.publications || 0) || 0,
          googleScholar: form.googleScholar || "",
        };
        const fd = new FormData();
        fd.append("category", "professor");
        fd.append("profile", JSON.stringify(profile));
        fd.append("professor", JSON.stringify(professor));
        if (form.avatar) fd.append("attachments", form.avatar);
        (form.proofs || []).forEach((f) => fd.append("attachments", f));

        const API = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
        setSaving(true);
        const res = await fetch(`${API}/api/intellectuals/applications`, {
          method: "POST", credentials: "include", body: fd,
        });
        setSaving(false);

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Submission failed");
        setShowSuccess(true);
        localStorage.removeItem(DRAFT_KEY);
        setSuccessCountdown(3);
        // Countdown and redirect
        let t = 3;
        const tick = () => {
          t -= 1;
          setSuccessCountdown(t);
          if (t > 0) setTimeout(tick, 1000);
          else navigate("/intellectuals");
        };
        setTimeout(tick, 1000);
      } catch (e) {
        setToasts((prev) => [
          ...prev,
          { id: Date.now(), kind: "error", title: "Submission failed", message: e?.message || "Something went wrong." }
        ]);
      }
    }
    doSubmit();
  }

  // Animated progress bar (shimmer when saving)
  const progressBar = (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10 relative" aria-hidden>
      <motion.div
        className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
        style={{ width: `${progressPct}%` }}
        initial={false}
        animate={{ width: `${progressPct}%` }}
        transition={{ duration: 0.35, type: "spring" }}
      />
      <AnimatePresence>
        {saving && (
          <motion.div
            key="shimmer"
            className="absolute inset-0 z-10 bg-gradient-to-r from-white/20 via-white/60 to-white/20 opacity-40 animate-shimmer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <style>{`
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.3s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -120% 0; }
          100% { background-position: 220% 0; }
        }
      `}</style>
    </div>
  );

  // --- Success overlay (modal) ---
  useEffect(() => {
    if (!showSuccess) return;
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Enter") {
        setShowSuccess(false);
        navigate("/intellectuals");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuccess, navigate]);

  /* ============================= UI Render ============================= */
  return (
    <main className="min-h-screen bg-[#0A0A10] text-white font-sans">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[42vh] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.12),transparent_60%)]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/intellectuals")}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition"
            aria-label="Back to Intellectuals roles"
            title="Back to roles"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            All roles
          </button>
          <div className="flex items-center gap-3 text-xs text-white/60" aria-live="polite" role="status">
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…
              </span>
            ) : savedAt ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden /> Saved
              </span>
            ) : null}
          </div>
        </div>
        {/* Title */}
        <div className="mt-6">
          <h1 className="text-[clamp(1.6rem,3.4vw,2.4rem)] font-semibold">
            Apply as{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              Professor / Researcher
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-white/70">
            A five-step guided flow. We’ll collect the essentials, verify your credentials, and publish a profile ready to be booked.
          </p>
        </div>
        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{progressPct}%</span>
          </div>
          {progressBar}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${i === step
                  ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                aria-current={i === step}
                aria-label={`Go to ${s.label}`}
                title={s.label}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${i <= step ? "bg-emerald-400" : "bg-white/30"}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="mx-auto mt-8 w-full max-w-6xl px-6 pb-16">
        <div className="relative rounded-3xl bg-white/5 p-6 md:p-8 backdrop-blur-xl shadow-[0_25px_80px_rgba(6,182,212,0.12)] ring-2 ring-emerald-400/30">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[0]}>
                  <SectionHeader icon={GraduationCap} title="Basics" desc="Short, sharp, professional. We’ll start with your identity." />
                  <CenteredAvatar
                    url={form.avatarUrl}
                    onPick={(file, url) => setForm(f => ({ ...f, avatar: file, avatarUrl: url }))}
                    error={errors.avatar}
                  />
                  {errors.avatar && <FieldError>{errors.avatar}</FieldError>}
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Field
                      name="fullName"
                      label="Full name"
                      required
                      value={form.fullName}
                      onChange={v => setForm(f => ({ ...f, fullName: v }))}
                      placeholder="e.g., Dr. Anita Sharma"
                      error={errors.fullName}
                    />
                    <Field
                      name="headline"
                      label="Headline (designation)"
                      required
                      value={form.headline}
                      onChange={v => setForm(f => ({ ...f, headline: v }))}
                      placeholder="Assistant Professor, IIT — AI/ML"
                      error={errors.headline}
                    />
                  </div>
                  <div className="mt-4">
                    <Field
                      name="bio"
                      label="Short bio"
                      required
                      textarea
                      rows={4}
                      value={form.bio}
                      onChange={v => setForm(f => ({ ...f, bio: v.slice(0, 400) }))}
                      placeholder="What you teach, research focus, speaking style… (max 400 chars)"
                      error={errors.bio}
                      counter={`${form.bio.length}/400`}
                    />
                  </div>
                  {/* Languages */}
                  <div className="mt-6">
                    <div className={`${labelCls} inline-flex items-center gap-1`}>
                      Languages
                      <Info className="h-3.5 w-3.5 text-white/45" aria-hidden title="Add 'Other' to specify additional" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["English", "Hindi", "Bengali", "Tamil", "Telugu", "Kannada", "Marathi"].map((lang) => {
                        const on = form.languages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, languages: on ? f.languages.filter(x => x !== lang) : [...f.languages, lang] }))}
                            className={`${chipBase} ${on ? chipOn : chipOff}`}
                            aria-pressed={on}
                            aria-label={`Language ${lang}${on ? " selected" : ""}`}
                          >{lang}</button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, languages: f.languages.includes("Other") ? f.languages : [...f.languages, "Other"] }))}
                        className={`${chipBase} ${form.languages.includes("Other") ? chipOn : chipOff}`}
                        aria-pressed={form.languages.includes("Other")}
                        aria-label="Add other language"
                      >Other</button>
                    </div>
                    {form.languages.includes("Other") && (
                      <div className="mt-2">
                        <input
                          className={inputCls}
                          placeholder="Add your language (e.g., Gujarati)"
                          onBlur={e => {
                            const v = e.target.value.trim();
                            if (v) setForm(f => ({ ...f, languages: Array.from(new Set([...f.languages.filter(x => x !== "Other"), v])) }));
                            e.target.value = "";
                          }}
                          aria-label="Other language"
                        />
                        <p className={helpText}>Tip: type and blur/Tab to add.</p>
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[1]}>
                  <SectionHeader icon={University} title="Institution" desc="Your current affiliation and department." />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field name="institution" label="Institution" required value={form.institution} onChange={v => setForm(f => ({ ...f, institution: v }))} placeholder="e.g., IIT Bombay" error={errors.institution} />
                    <Field name="department" label="Department" required value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} placeholder="e.g., Computer Science & Engineering" error={errors.department} />
                    <Field name="designation" label="Designation" value={form.designation} onChange={v => setForm(f => ({ ...f, designation: v }))} placeholder="Assistant Professor / Associate Professor / Professor" />
                    <Field name="academicEmail" label="Academic email" required value={form.academicEmail} onChange={v => setForm(f => ({ ...f, academicEmail: v }))} placeholder="name@university.edu / .ac.in" error={errors.academicEmail} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Field name="instCity" label="City (optional)" value={form.instCity} onChange={v => setForm(f => ({ ...f, instCity: v }))} placeholder="e.g., Mumbai" />
                    <Field name="instCountry" label="Country (optional)" value={form.instCountry} onChange={v => setForm(f => ({ ...f, instCountry: v }))} placeholder="e.g., India" />
                  </div>
                </section>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[2]}>
                  <SectionHeader icon={Briefcase} title="Offerings" desc="What you do, and how people can book you." />
                  {/* Expertise */}
                  <FieldSet
                    label="Fields of expertise"
                    required
                    error={errors.expertise}
                  >
                    <div className="flex flex-wrap gap-2">
                      {["AI","ML","Data Science","Signal Processing","Robotics","IoT","Cybersecurity","Finance","Design","Product"].map(e => {
                        const on = form.expertise.includes(e);
                        return (
                          <button key={e} type="button"
                            onClick={() => setForm(f => ({ ...f, expertise: on ? f.expertise.filter(x => x !== e) : [...f.expertise, e] }))}
                            className={`${chipBase} ${on ? chipOn : chipOff}`}
                            aria-pressed={on}
                            aria-label={`Expertise ${e}${on ? " selected" : ""}`}
                            data-errorfield={e}
                          >{e}</button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, expertiseOtherOn: !f.expertiseOtherOn }))}
                        className={`${chipBase} ${form.expertiseOtherOn ? chipOn : chipOff}`}
                        aria-pressed={form.expertiseOtherOn}
                      >Other</button>
                    </div>
                    <AnimatePresence>
                      {form.expertiseOtherOn && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
                          <input className={inputCls} placeholder="Add custom expertise"
                            value={form.expertiseOther}
                            onChange={e => setForm(f => ({ ...f, expertiseOther: e.target.value }))}
                            aria-label="Custom expertise"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FieldSet>
                  {/* Available for */}
                  <FieldSet label="You’re available for" required error={errors.availableFor}>
                    <div className="flex flex-wrap gap-2">
                      {["Guest Lecture","Workshop","Panel Talk","Thesis Mentorship","Curriculum Advisory"].map(a => {
                        const on = form.availableFor.includes(a);
                        return (
                          <button key={a} type="button"
                            onClick={() => setForm(f => ({ ...f, availableFor: on ? f.availableFor.filter(x => x !== a) : [...f.availableFor, a] }))}
                            className={`${chipBase} ${on ? chipOn : chipOff}`}
                            aria-pressed={on}
                            aria-label={`Available for ${a}${on ? " selected" : ""}`}
                          >{a}</button>
                        );
                      })}
                      <button type="button" onClick={() => setForm(f => ({ ...f, availOtherOn: !f.availOtherOn }))} className={`${chipBase} ${form.availOtherOn ? chipOn : chipOff}`} aria-pressed={form.availOtherOn}>Other</button>
                    </div>
                    <AnimatePresence>
                      {form.availOtherOn && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
                          <input className={inputCls} placeholder="Add custom format"
                            value={form.availOther}
                            onChange={e => setForm(f => ({ ...f, availOther: e.target.value }))}
                            aria-label="Custom availability"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FieldSet>
                  {/* Weekly availability */}
                  <div className="mt-6">
                    <div className={`${labelCls} inline-flex items-center gap-1`}>
                      Weekly availability (optional)
                      <Info className="h-3.5 w-3.5 text-white/45" aria-hidden title="Helps organizers pick slots" />
                    </div>
                    <AvailabilityEditor value={form.availability} onChange={fn => setForm(f => ({ ...f, availability: fn(f.availability) }))} />
                  </div>
                </section>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[3]}>
                  <SectionHeader icon={LinkIcon} title="Proof" desc="Links & documents that help us verify you (optional but recommended)." />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field name="googleScholar" label="Google Scholar (URL)" value={form.googleScholar} onChange={v => setForm(f => ({ ...f, googleScholar: v }))} placeholder="https://scholar.google.com/..." error={errors.googleScholar} />
                    <Field name="orcid" label="ORCID iD (optional)" value={form.orcid} onChange={v => setForm(f => ({ ...f, orcid: v }))} placeholder="0000-0002-1825-0097" />
                    <Field name="linkedIn" label="LinkedIn (optional)" value={form.linkedIn} onChange={v => setForm(f => ({ ...f, linkedIn: v }))} placeholder="https://www.linkedin.com/in/username" />
                    <Field name="website" label="Website / Lab page (optional)" value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} placeholder="https://yourlab.edu" />
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field name="publications" label="Publications (approx. count)" value={form.publications} onChange={v => setForm(f => ({ ...f, publications: v.replace(/[^\d]/g, "").slice(0, 4) }))} placeholder="e.g., 25" error={errors.publications} />
                  </div>
                  {/* Proof drag & drop */}
                  <div className="mt-6">
                    <div className={labelCls}>Upload proof documents (ID, faculty page, letters — optional)</div>
                    <ProofUploader
                      ref={proofDropRef}
                      files={form.proofs}
                      onAdd={files => setForm(f => ({ ...f, proofs: [...f.proofs, ...files] }))}
                      onRemove={idx => setForm(f => ({ ...f, proofs: f.proofs.filter((_, i) => i !== idx) }))}
                    />
                    <p className={helpText}>We accept images or PDFs. Drag and drop, or click to add (max 10).</p>
                  </div>
                </section>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[4]}>
                  <SectionHeader icon={ShieldCheck} title="Review" desc="Verify details before submitting." />
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-white/60 mb-1">Name</div>
                      <div className="font-medium">{form.fullName || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Headline</div>
                      <div className="font-medium">{form.headline || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Bio</div>
                      <div className="font-medium whitespace-pre-wrap">{form.bio || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Languages</div>
                      <div className="font-medium break-words">{(form.languages || []).join(", ") || "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/60 mb-1">Institution</div>
                      <div className="font-medium">{form.institution || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Department</div>
                      <div className="font-medium">{form.department || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Designation</div>
                      <div className="font-medium">{form.designation || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Academic email</div>
                      <div className="font-medium break-all flex items-center gap-2">
                        {form.academicEmail || "—"}
                        {form.academicEmail &&
                          <button onClick={() => { navigator.clipboard.writeText(form.academicEmail) }} className="text-xs text-emerald-300 hover:underline" tabIndex={0}>Copy</button>
                        }
                      </div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Offerings</div>
                      <div className="font-medium break-words">{availableList.join(", ") || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Expertise</div>
                      <div className="font-medium break-words">{expertiseList.join(", ") || "—"}</div>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl bg-white/5 p-4">
                    <label className="flex items-start gap-3">
                      <input
                        name="acceptTnC"
                        type="checkbox"
                        checked={form.acceptTnC}
                        onChange={e => setForm(f => ({ ...f, acceptTnC: e.target.checked }))}
                        className="mt-1 h-4 w-4 rounded"
                        aria-required
                      />
                      <span className="text-sm">
                        I agree to Cyphire’s Terms &amp; Conditions and consent to verification of my submitted profile.
                      </span>
                    </label>
                    {errors.acceptTnC && <FieldError>{errors.acceptTnC}</FieldError>}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between">
            <button onClick={goPrev} disabled={step === 0} className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60" aria-label="Go back">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </button>
            <div className="flex items-center gap-3">
              {step < STEPS.length - 1 ? (
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold shadow-lg"
                  aria-label="Continue"
                >Continue <ArrowRight className="h-4 w-4" aria-hidden /></motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={submit}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold shadow-lg"
                  aria-label="Submit application"
                >Submit Application</motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast key={t.id} kind={t.kind} title={t.title} message={t.message} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </div>
      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center gap-6 bg-[#0A0A10] rounded-2xl p-10 border border-white/15 shadow-2xl">
              <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1.08 }} transition={{ type: "spring", duration: 0.6 }}>
                <CheckCircle2 className="w-20 h-20 text-emerald-400 drop-shadow-xl" />
              </motion.div>
              <h2 className="text-2xl font-bold text-emerald-200">Application submitted!</h2>
              <p className="text-white/70 text-center max-w-xs">We’ll verify your credentials and publish your profile shortly.<br />Redirecting to Intellectuals in <span className="font-bold text-emerald-300">{successCountdown}</span>…</p>
              <button className="mt-4 rounded-lg px-6 py-2 text-white bg-gradient-to-r from-emerald-600 to-cyan-500 font-semibold text-base shadow-md" onClick={() => navigate("/intellectuals")}>
                Go now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* --- Helper Components --- */
function Field({ label, name, value, onChange, required, error, placeholder, textarea, rows, counter }) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className={labelCls}>
        {label} {required && <span className="text-emerald-300">*</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          id={name}
          rows={rows || 3}
          className={`${inputCls} ${error ? errorCls : "border-white/10"}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      ) : (
        <input
          name={name}
          id={name}
          className={`${inputCls} ${error ? errorCls : "border-white/10"}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      )}
      {counter && <div className="text-xs text-white/50 text-right">{counter}</div>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
function FieldSet({ label, required, error, children }) {
  return (
    <div className="mb-3">
      <div className={labelCls}>{label} {required && <span className="text-emerald-300">*</span>}</div>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
function FieldError({ children }) {
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-rose-300"><AlertTriangle className="h-3 w-3" />{children}</div>
  );
}
function CenteredAvatar({ url, onPick, error }) {
  const ref = useRef(null);
  return (
    <div className="flex flex-col items-center mb-4">
      <button type="button" onClick={() => ref.current?.click()}
        className={`relative h-28 w-28 overflow-hidden rounded-full bg-white/10 ring-2 ring-emerald-400/20 hover:ring-emerald-400/40 transition`}
        title="Upload profile photo (required)"
        aria-label="Upload profile photo"
      >
        {url ? (
          <img src={url} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-white/60">Upload</div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.25)]" />
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          const preview = URL.createObjectURL(f);
          onPick(f, preview);
        }} />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
const ProofUploader = React.forwardRef(function ProofUploader({ files, onAdd, onRemove }, ref) {
  const inputRef = useRef(null);
  const onPick = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) onAdd(list.slice(0, 10 - files.length));
    e.target.value = "";
  };
  return (
    <div ref={ref} tabIndex={0} className="mt-1 transition border-2 border-dashed border-white/15 rounded-xl bg-white/5 p-3 focus:ring-emerald-400 focus:outline-none">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-white/8 px-4 py-2 text-sm hover:bg-white/12"
          aria-label="Add proof documents"
        >Add files</button>
        <input ref={inputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={onPick} />
        <span className="text-xs text-white/40">or drag files here</span>
      </div>
      {files?.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-sm gap-3">
              <div className="flex items-center gap-2">
                {f.type?.startsWith("image/") ?
                  <img src={URL.createObjectURL(f)} className="h-8 w-8 object-cover rounded" alt="proof" />
                  : <FileText className="h-8 w-8 text-white/30" />}
                <span className="truncate">{f.name}</span>
              </div>
              <button type="button" onClick={() => onRemove(i)} className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15" aria-label={`Remove ${f.name}`}><X className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className={sectionTitleCls}>{title}</h2>
          {desc && <p className={subtle}>{desc}</p>}
        </div>
      </div>
    </div>
  );
}
function AvailabilityEditor({ value, onChange }) {
  const set = (i, k, v) => onChange(prev => prev.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  return (
    <div className="grid gap-3">
      {value.map((r, i) => (
        <div key={r.day} className="rounded-xl bg-white/5 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={r.checked} onChange={e => set(i, "checked", e.target.checked)} aria-label={`Available on ${r.day}`} />
              <span className="min-w-[3ch]">{r.day}</span>
            </label>
            <input type="time" disabled={!r.checked} value={r.start} onChange={e => set(i, "start", e.target.value)} className={`${inputCls} max-w-[160px] disabled:opacity-60`} aria-label={`${r.day} start time`} />
            <span className="text-white/50">to</span>
            <input type="time" disabled={!r.checked} value={r.end} onChange={e => set(i, "end", e.target.value)} className={`${inputCls} max-w-[160px] disabled:opacity-60`} aria-label={`${r.day} end time`} />
          </div>
        </div>
      ))}
    </div>
  );
}
function Toast({ kind = "success", title, message, onClose }) {
  return (
    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.25 }}
      className={`pointer-events-auto w-full max-w-sm rounded-xl p-3 shadow-xl ring-1 ${kind === "success" ? "bg-emerald-500/15 ring-emerald-500/30" : "bg-rose-500/15 ring-rose-500/30"}`}
      role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
          {kind === "success" ? <Check className="h-4 w-4" aria-hidden /> : <AlertTriangle className="h-4 w-4" aria-hidden />}
        </div>
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {message && <div className="text-xs text-white/80">{message}</div>}
        </div>
        <button onClick={onClose} className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15" aria-label="Close notification">Close</button>
      </div>
    </motion.div>
  );
}
