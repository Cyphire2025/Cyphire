// src/pages/ApplyExpert.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ArrowLeft, ArrowRight, Check, CheckCircle2, Briefcase, Building2, Link as LinkIcon, ShieldCheck, Info, Timer, AlertTriangle, FileText, X, Loader2
} from "lucide-react";
import {
  Field,
  FieldSet,
  SectionHeader,
  CenteredAvatar,
  ProofUploader,
  AvailabilityEditor,
  FieldError,
  Toast,
} from "../components/ApplyFormHelpers";
import { apiFetch } from "../lib/fetch";


const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
const DRAFT_KEY = "cyphire.apply.industryexpert.v1";
const STEPS = [
  { key: "basics", label: "Basics", icon: Briefcase },
  { key: "work", label: "Work & Experience", icon: Building2 },
  { key: "expertise", label: "Expertise & Availability", icon: LinkIcon },
  { key: "review", label: "Review & Submit", icon: ShieldCheck },
];

const inputCls = "w-full rounded-xl bg-black/30 px-3 py-2.5 leading-6 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-cyan-300/35 transition border";
const labelCls = "mb-1 text-[13px] tracking-wide text-white/75";
const errorCls = "border-rose-500 focus:ring-rose-400/60";
const chipBase = "rounded-full px-3 py-1.5 text-sm transition select-none border border-white/10 bg-white/5 hover:bg-white/10";
const chipOn = "border-cyan-400/40 bg-cyan-400/10 text-cyan-100";
const chipOff = "text-white/80";
const subtle = "text-white/70";
const helpText = "mt-1 text-xs text-white/55";
const sectionTitleCls = "text-xl font-semibold tracking-tight";
const DOMAIN_OPTIONS = ["Software", "AI/ML", "Product", "Marketing", "Design", "Data", "Cybersecurity", "Cloud", "Finance", "HR", "Consulting", "Sales"];
const DEFAULT_FORM = {
  avatar: null, avatarUrl: "", fullName: "", headline: "", bio: "", yearsExp: "",
  languages: ["English", "Hindi"], linkedin: "", website: "",
  company: "", position: "", companyLocation: "", domains: [], domainsOtherOn: false, domainsOther: "",
  availableFor: [], availOtherOn: false, availOther: "", availability: [
    { day: "Mon", start: "", end: "", checked: false },
    { day: "Tue", start: "", end: "", checked: false },
    { day: "Wed", start: "", end: "", checked: false },
    { day: "Thu", start: "", end: "", checked: false },
    { day: "Fri", start: "", end: "", checked: false },
    { day: "Sat", start: "", end: "", checked: false },
    { day: "Sun", start: "", end: "", checked: false },
  ],
  proofs: [],
  acceptTnC: false,
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.avatarUrl) errors.avatar = "Profile photo is required.";
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.headline.trim()) errors.headline = "Headline is required.";
    if (!form.bio.trim()) errors.bio = "Short bio is required.";
  }
  if (step === 1) {
    if (!form.company.trim()) errors.company = "Company name is required.";
    if (!form.position.trim()) errors.position = "Position is required.";
    if (!form.linkedin.trim()) errors.linkedin = "LinkedIn profile is required.";
    else if (!/^https:\/\/(www\.)?linkedin\.com\/.+/i.test(form.linkedin.trim()))
      errors.linkedin = "Provide a full https://www.linkedin.com/... link.";
    if (form.website && !/^https?:\/\/.+/i.test(form.website.trim()))
      errors.website = "Provide a valid website or leave blank.";
    if (!form.yearsExp.trim() || isNaN(Number(form.yearsExp)) || Number(form.yearsExp) < 0)
      errors.yearsExp = "Enter your years of experience.";
  }
  if (step === 2) {
    const domainList = [
      ...(form.domains || []),
      ...(form.domainsOtherOn && form.domainsOther.trim() ? [form.domainsOther.trim()] : []),
    ].filter(Boolean);
    if (!domainList.length) errors.domains = "At least one domain is required.";
    const availableList = [
      ...(form.availableFor || []),
      ...(form.availOtherOn && form.availOther.trim() ? [form.availOther.trim()] : []),
    ].filter(Boolean);
    if (!availableList.length) errors.availableFor = "At least one offering is required.";
  }
  if (step === 3) {
    if (!form.acceptTnC) errors.acceptTnC = "Accept the terms to submit.";
  }
  return errors;
}

export default function ApplyExpert() {
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

  const domainList = useMemo(() => {
    const extra = form.domainsOtherOn && form.domainsOther.trim() ? [form.domainsOther.trim()] : [];
    return Array.from(new Set([...(form.domains || []), ...extra]));
  }, [form.domains, form.domainsOtherOn, form.domainsOther]);
  const availableList = useMemo(() => {
    const extra = form.availOtherOn && form.availOther.trim() ? [form.availOther.trim()] : [];
    return Array.from(new Set([...(form.availableFor || []), ...extra]));
  }, [form.availableFor, form.availOtherOn, form.availOther]);

  // Autosave
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

  // Focus management
  const formRefs = [useRef(), useRef(), useRef(), useRef()];
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
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
      el.classList.remove("ring-cyan-400", "bg-cyan-800/20");
    };
    const onDragOver = (e) => {
      e.preventDefault();
      el.classList.add("ring-cyan-400", "bg-cyan-800/20");
    };
    const onDragLeave = (e) => {
      el.classList.remove("ring-cyan-400", "bg-cyan-800/20");
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

    async function doSubmit() {
      try {
        // Build objects
        const profile = {
          fullName: form.fullName.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          languages: form.languages,
          socials: {
            website: form.website || "",
            linkedin: form.linkedin || "",
          },
        };
        const industry_expert = {
  company: form.company.trim(),
  role: form.position.trim(), // <-- Backend expects "role"
  location: form.companyLocation.trim(),
  domains: domainList,
  yearsExperience: Number(form.yearsExp || 0) || 0, // <-- Backend expects "yearsExperience"
};

        const fd = new FormData();
        fd.append("category", "industry_expert");
        fd.append("profile", JSON.stringify(profile));
        fd.append("industry_expert", JSON.stringify(industry_expert));
        if (form.avatar) fd.append("attachments", form.avatar);
        (form.proofs || []).forEach((f) => fd.append("attachments", f));

        const API = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
        setSaving(true);
        const res = await apiFetch(`${API}/api/intellectuals/applications`, {
          method: "POST",  body: fd,
        });
        setSaving(false);

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Submission failed");
        setShowSuccess(true);
        localStorage.removeItem(DRAFT_KEY);
        setSuccessCountdown(3);
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

  // UI Render
  return (
    <main className="min-h-screen bg-[#0A0A10] text-white font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[42vh] bg-[radial-gradient(ellipse_at_top,rgba(16,185,199,0.11),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-[radial-gradient(ellipse_at_bottom,rgba(6,212,212,0.12),transparent_60%)]" />
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
                <Check className="h-3.5 w-3.5 text-cyan-300" aria-hidden /> Saved
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-6">
          <h1 className="text-[clamp(1.6rem,3.4vw,2.4rem)] font-semibold">
            Apply as{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
              Industry Expert
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-white/70">
            For experienced professionals, consultants, and doers. Your experience inspires and educates the next generation.
          </p>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10 relative" aria-hidden>
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400"
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setStep(i)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${i === step
                  ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                aria-current={i === step}
                aria-label={`Go to ${s.label}`}
                title={s.label}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${i <= step ? "bg-cyan-400" : "bg-white/30"}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="mx-auto mt-8 w-full max-w-6xl px-6 pb-16">
        <div className="relative rounded-3xl bg-white/5 p-6 md:p-8 backdrop-blur-xl shadow-[0_25px_80px_rgba(6,182,212,0.12)] ring-2 ring-cyan-400/30">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[0]}>
                  <SectionHeader icon={Briefcase} title="Basics" desc="Your basic info and a brief intro." />
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
                      placeholder="e.g., Devansh Shah"
                      error={errors.fullName}
                    />
                    <Field
                      name="headline"
                      label="Headline (your current role)"
                      required
                      value={form.headline}
                      onChange={v => setForm(f => ({ ...f, headline: v }))}
                      placeholder="VP Engineering, Razorpay"
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
                      placeholder="Share your work, vision, or experience… (max 400 chars)"
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
                  <SectionHeader icon={Building2} title="Work & Experience" desc="Your present company, position, and experience." />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      name="company"
                      label="Current company"
                      required
                      value={form.company}
                      onChange={v => setForm(f => ({ ...f, company: v }))}
                      placeholder="e.g., Razorpay"
                      error={errors.company}
                    />
                    <Field
                      name="position"
                      label="Position"
                      required
                      value={form.position}
                      onChange={v => setForm(f => ({ ...f, position: v }))}
                      placeholder="VP Engineering"
                      error={errors.position}
                    />
                    <Field
                      name="yearsExp"
                      label="Years of total experience"
                      required
                      value={form.yearsExp}
                      onChange={v => setForm(f => ({ ...f, yearsExp: v.replace(/[^\d]/g, "").slice(0, 2) }))}
                      placeholder="e.g., 12"
                      error={errors.yearsExp}
                    />
                    <Field
                      name="companyLocation"
                      label="Company Location"
                      value={form.companyLocation}
                      onChange={v => setForm(f => ({ ...f, companyLocation: v }))}
                      placeholder="e.g., Bangalore, India"
                    />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <Field
                      name="linkedin"
                      label="LinkedIn"
                      required
                      value={form.linkedin}
                      onChange={v => setForm(f => ({ ...f, linkedin: v }))}
                      placeholder="https://www.linkedin.com/in/username"
                      error={errors.linkedin}
                    />
                    <Field
                      name="website"
                      label="Personal/Company Website (optional)"
                      value={form.website}
                      onChange={v => setForm(f => ({ ...f, website: v }))}
                      placeholder="https://yourcompany.com"
                      error={errors.website}
                    />
                  </div>
                </section>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[2]}>
                  <SectionHeader icon={LinkIcon} title="Expertise & Availability" desc="Share your domain strengths and how you want to contribute." />
                  {/* Domains of expertise */}
                  <FieldSet label="Domains of expertise" required error={errors.domains}>
                    <div className="flex flex-wrap gap-2">
                      {DOMAIN_OPTIONS.map(e => {
                        const on = form.domains.includes(e);
                        return (
                          <button key={e} type="button"
                            onClick={() => setForm(f => ({ ...f, domains: on ? f.domains.filter(x => x !== e) : [...f.domains, e] }))}
                            className={`${chipBase} ${on ? chipOn : chipOff}`}
                            aria-pressed={on}
                            aria-label={`Domain ${e}${on ? " selected" : ""}`}
                            data-errorfield={e}
                          >{e}</button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, domainsOtherOn: !f.domainsOtherOn }))}
                        className={`${chipBase} ${form.domainsOtherOn ? chipOn : chipOff}`}
                        aria-pressed={form.domainsOtherOn}
                      >Other</button>
                    </div>
                    <AnimatePresence>
                      {form.domainsOtherOn && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
                          <input className={inputCls} placeholder="Add custom domain"
                            value={form.domainsOther}
                            onChange={e => setForm(f => ({ ...f, domainsOther: e.target.value }))}
                            aria-label="Custom domain"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </FieldSet>
                  {/* Available for */}
                  <FieldSet label="You’re available for" required error={errors.availableFor}>
                    <div className="flex flex-wrap gap-2">
                      {["Guest Lecture","Workshop","Panel Talk","Mentorship","Career Talk","Advisory"].map(a => {
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
                          <input className={inputCls} placeholder="Add custom offering"
                            value={form.availOther}
                            onChange={e => setForm(f => ({ ...f, availOther: e.target.value }))}
                            aria-label="Custom available for"
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
                  {/* Proof uploads */}
                  <div className="mt-6">
                    <div className={labelCls}>Upload proof documents (offer letters, certificates, etc — optional)</div>
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
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
                <section ref={formRefs[3]}>
                  <SectionHeader icon={ShieldCheck} title="Review" desc="Review your application before submitting." />
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
                      <div className="text-sm text-white/60 mb-1">Company</div>
                      <div className="font-medium">{form.company || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Position</div>
                      <div className="font-medium">{form.position || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Years of Experience</div>
                      <div className="font-medium">{form.yearsExp || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">LinkedIn</div>
                      <div className="font-medium break-all">{form.linkedin || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Website</div>
                      <div className="font-medium break-all">{form.website || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Expertise Domains</div>
                      <div className="font-medium break-words">{domainList.join(", ") || "—"}</div>
                      <div className="text-sm text-white/60 mt-4 mb-1">Available For</div>
                      <div className="font-medium break-words">{availableList.join(", ") || "—"}</div>
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold shadow-lg"
                  aria-label="Continue"
                >Continue <ArrowRight className="h-4 w-4" aria-hidden /></motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={submit}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold shadow-lg"
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
                <CheckCircle2 className="w-20 h-20 text-cyan-400 drop-shadow-xl" />
              </motion.div>
              <h2 className="text-2xl font-bold text-cyan-200">Application submitted!</h2>
              <p className="text-white/70 text-center max-w-xs">We’ll verify your credentials and publish your profile shortly.<br />Redirecting to Intellectuals in <span className="font-bold text-cyan-300">{successCountdown}</span>…</p>
              <button className="mt-4 rounded-lg px-6 py-2 text-white bg-gradient-to-r from-cyan-600 to-emerald-500 font-semibold text-base shadow-md" onClick={() => navigate("/intellectuals")}>
                Go now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
