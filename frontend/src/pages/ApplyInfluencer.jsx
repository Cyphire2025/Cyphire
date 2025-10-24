// src/pages/ApplyInfluencer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ArrowLeft, ArrowRight, Check, CheckCircle2, Camera, Link as LinkIcon, ShieldCheck, Info, AlertTriangle, FileText, X, Loader2
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

// ---- THEME + HELPERS ----
const inputCls = "w-full rounded-xl bg-black/30 px-3 py-2.5 leading-6 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-emerald-300/35 transition border";
const labelCls = "mb-1 text-[13px] tracking-wide text-white/75";
const errorCls = "border-rose-500 focus:ring-rose-400/60";
const chipBase = "rounded-full px-3 py-1.5 text-sm transition select-none border border-white/10 bg-white/5 hover:bg-white/10";
const chipOn = "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
const chipOff = "text-white/80";
const subtle = "text-white/70";
const helpText = "mt-1 text-xs text-white/55";
const sectionTitleCls = "text-xl font-semibold tracking-tight";
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const PLATFORM_OPTIONS = [
  "YouTube", "Instagram", "LinkedIn", "Twitter/X", "Podcast", "Blog", "Other"
];
const OFFERINGS_OPTIONS = [
  "Collaboration", "Guest Lecture", "Panel", "Mentoring", "Promotion"
];

const DRAFT_KEY = "cyphire.apply.influencer.v1";
const STEPS = [
  { key: "basics", label: "Basics", icon: Camera },
  { key: "platform", label: "Socials & Niche", icon: LinkIcon },
  { key: "offering", label: "Offerings & Proof", icon: ShieldCheck },
  { key: "review", label: "Review & Submit", icon: ShieldCheck },
];

const DEFAULT_FORM = {
  avatar: null, avatarUrl: "", fullName: "", handle: "", headline: "", bio: "",
  mainPlatform: "", otherPlatform: "", audienceSize: "", niche: "",
  socials: { instagram: "", youtube: "", linkedin: "", twitter: "", tiktok: "", website: "" },
  offerings: [], offeringOtherOn: false, offeringOther: "",
  proofs: [], languages: ["English", "Hindi"],
  acceptTnC: false,
};

// -------- VALIDATION --------
function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (!form.avatarUrl) errors.avatar = "Profile photo is required.";
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.headline.trim()) errors.headline = "One-line intro is required.";
    if (!form.bio.trim()) errors.bio = "Bio is required.";
  }
  if (step === 1) {
    if (!form.mainPlatform) errors.mainPlatform = "Choose your main platform.";
    if (form.mainPlatform === "Other" && !form.otherPlatform.trim())
      errors.otherPlatform = "Please specify your main platform.";
    if (!form.handle.trim()) errors.handle = "Public handle is required.";
    if (!form.audienceSize.trim() || isNaN(Number(form.audienceSize)) || Number(form.audienceSize) <= 0)
      errors.audienceSize = "Enter your audience size.";
    if (!form.niche.trim()) errors.niche = "Niche/category is required.";
    if (
      !form.socials.instagram &&
      !form.socials.youtube &&
      !form.socials.linkedin &&
      !form.socials.twitter &&
      !form.socials.tiktok &&
      !form.socials.website
    ) {
      errors.socials = "At least one social link is required.";
    }
  }
  if (step === 2) {
    const offeringList = [
      ...(form.offerings || []),
      ...(form.offeringOtherOn && form.offeringOther.trim() ? [form.offeringOther.trim()] : []),
    ].filter(Boolean);
    if (!offeringList.length) errors.offerings = "Choose at least one offering.";
  }
  if (step === 3) {
    if (!form.acceptTnC) errors.acceptTnC = "Accept the terms to submit.";
  }
  return errors;
}

// ------------- MAIN -------------
export default function ApplyInfluencer() {
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

  const offeringList = useMemo(() => {
    const extra = form.offeringOtherOn && form.offeringOther.trim() ? [form.offeringOther.trim()] : [];
    return Array.from(new Set([...(form.offerings || []), ...extra]));
  }, [form.offerings, form.offeringOtherOn, form.offeringOther]);

  // --- Autosave
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

  // --- Progress
  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  // --- Focus for errors
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

  // --- Drag & drop proofs
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

  // --- Step transitions
  const goPrev = () => setStep(s => clamp(s - 1, 0, STEPS.length - 1));
  const goNext = () => {
    const nextErrors = validateStep(step, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0)
      setStep(s => clamp(s + 1, 0, STEPS.length - 1));
  };

  // --- Submit logic
  function submit() {
    const errs = validateStep(step, form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    async function doSubmit() {
      try {
        const profile = {
          fullName: form.fullName.trim(),
          headline: form.headline.trim(),
          bio: form.bio.trim(),
          handle: form.handle.trim(),
          mainPlatform: form.mainPlatform === "Other" ? form.otherPlatform : form.mainPlatform,
          audienceSize: Number(form.audienceSize),
          niche: form.niche.trim(),
          languages: form.languages,
          socials: {
            instagram: form.socials.instagram || "",
            youtube: form.socials.youtube || "",
            linkedin: form.socials.linkedin || "",
            twitter: form.socials.twitter || "",
            tiktok: form.socials.tiktok || "",
            website: form.socials.website || "",
          },
        };
        const influencer = { offerings: offeringList };
        const fd = new FormData();
        fd.append("category", "influencer");
        fd.append("profile", JSON.stringify(profile));
        fd.append("influencer", JSON.stringify(influencer));
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

  // ---- UI Render ----
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
        <div className="mt-6">
          <h1 className="text-[clamp(1.6rem,3.4vw,2.4rem)] font-semibold">
            Apply as{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              Influencer / Creator
            </span>
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-white/70">
            For content creators, educators, and community leaders who teach and inspire online.
          </p>
        </div>
        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{progressPct}%</span>
          </div>
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
      {/* Steps */}
      <div className="mx-auto mt-8 w-full max-w-6xl px-6 pb-16">
        <div className="relative rounded-3xl bg-white/5 p-6 md:p-8 backdrop-blur-xl shadow-[0_25px_80px_rgba(6,182,212,0.12)] ring-2 ring-emerald-400/30">
          <FormSteps
            step={step}
            form={form}
            setForm={setForm}
            errors={errors}
            offeringList={offeringList}
            formRefs={formRefs}
            proofDropRef={proofDropRef}
          />
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

// -- All the Field, FieldSet, FieldError, CenteredAvatar, ProofUploader, SectionHeader, Toast helpers here --
// (Use the exact same helpers as your ApplyProfessor.jsx for perfect consistency!)

function FormSteps({ step, form, setForm, errors, offeringList, formRefs, proofDropRef }) {
  return (
    <AnimatePresence mode="wait">
      {/* STEP 0: BASICS */}
      {step === 0 && (
        <motion.div key="s0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
          <section ref={formRefs[0]}>
            <SectionHeader icon={Camera} title="Basics" desc="Who are you, and what do you create?" />
            <CenteredAvatar
              url={form.avatarUrl}
              onPick={(file, url) => setForm(f => ({ ...f, avatar: file, avatarUrl: url }))}
              error={errors.avatar}
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field
                name="fullName"
                label="Full name"
                required
                value={form.fullName}
                onChange={v => setForm(f => ({ ...f, fullName: v }))}
                placeholder="e.g., Ananya Joshi"
                error={errors.fullName}
              />
              <Field
                name="headline"
                label="One-line intro"
                required
                value={form.headline}
                onChange={v => setForm(f => ({ ...f, headline: v }))}
                placeholder="YouTuber, Tech Reviewer, Speaker"
                error={errors.headline}
              />
            </div>
            <div className="mt-4">
              <Field
                name="bio"
                label="Bio"
                required
                textarea
                rows={4}
                value={form.bio}
                onChange={v => setForm(f => ({ ...f, bio: v.slice(0, 400) }))}
                placeholder="What do you do? Tell us about your style, audience, and vision… (max 400 chars)"
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
      {/* STEP 1: PLATFORM & NICHE */}
      {step === 1 && (
        <motion.div key="s1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
          <section ref={formRefs[1]}>
            <SectionHeader icon={LinkIcon} title="Socials & Niche" desc="Show your digital presence and focus." />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                name="mainPlatform"
                label="Main platform"
                required
                select
                options={PLATFORM_OPTIONS}
                value={form.mainPlatform}
                onChange={v => setForm(f => ({ ...f, mainPlatform: v }))}
                error={errors.mainPlatform}
              />
              {form.mainPlatform === "Other" && (
                <Field
                  name="otherPlatform"
                  label="Specify platform"
                  required
                  value={form.otherPlatform}
                  onChange={v => setForm(f => ({ ...f, otherPlatform: v }))}
                  error={errors.otherPlatform}
                />
              )}
              <Field
                name="handle"
                label="Your handle/username"
                required
                value={form.handle}
                onChange={v => setForm(f => ({ ...f, handle: v }))}
                placeholder="@ananyajoshi"
                error={errors.handle}
              />
              <Field
                name="audienceSize"
                label="Audience size (followers/subscribers)"
                required
                value={form.audienceSize}
                onChange={v => setForm(f => ({ ...f, audienceSize: v.replace(/[^\d]/g, "").slice(0, 8) }))}
                placeholder="e.g., 75000"
                error={errors.audienceSize}
              />
            </div>
            <div className="mt-4">
              <Field
                name="niche"
                label="Main niche (e.g. Tech, Comedy, Career Advice)"
                required
                value={form.niche}
                onChange={v => setForm(f => ({ ...f, niche: v }))}
                placeholder="Tech reviews, study motivation…"
                error={errors.niche}
              />
            </div>
            {/* Socials */}
            <div className="mt-6">
              <div className={labelCls}>Your social links <span className="text-emerald-300">*</span></div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  name="instagram"
                  label="Instagram"
                  value={form.socials.instagram}
                  onChange={v => setForm(f => ({ ...f, socials: { ...f.socials, instagram: v } }))}
                  placeholder="https://instagram.com/username"
                />
                <Field
                  name="youtube"
                  label="YouTube"
                  value={form.socials.youtube}
                  onChange={v => setForm(f => ({ ...f, socials: { ...f.socials, youtube: v } }))}
                  placeholder="https://youtube.com/@username"
                />
                <Field
                  name="linkedin"
                  label="LinkedIn"
                  value={form.socials.linkedin}
                  onChange={v => setForm(f => ({ ...f, socials: { ...f.socials, linkedin: v } }))}
                  placeholder="https://linkedin.com/in/username"
                />
                <Field
                  name="twitter"
                  label="Twitter/X"
                  value={form.socials.twitter}
                  onChange={v => setForm(f => ({ ...f, socials: { ...f.socials, twitter: v } }))}
                  placeholder="https://twitter.com/username"
                />
                <Field
                  name="tiktok"
                  label="TikTok"
                  value={form.socials.tiktok}
                  onChange={v => setForm(f => ({ ...f, socials: { ...f.socials, tiktok: v } }))}
                  placeholder="https://tiktok.com/@username"
                />
                <Field
                  name="website"
                  label="Personal website"
                  value={form.socials.website}
                  onChange={v => setForm(f => ({ ...f, socials: { ...f.socials, website: v } }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              {errors.socials && <FieldError>{errors.socials}</FieldError>}
            </div>
          </section>
        </motion.div>
      )}
      {/* STEP 2: OFFERINGS & PROOF */}
      {step === 2 && (
        <motion.div key="s2" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
          <section ref={formRefs[2]}>
            <SectionHeader icon={ShieldCheck} title="Offerings & Proof" desc="How do you want to work with Cyphire?" />
            <FieldSet label="Offerings" required error={errors.offerings}>
              <div className="flex flex-wrap gap-2">
                {OFFERINGS_OPTIONS.map((e) => {
                  const on = form.offerings.includes(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, offerings: on ? f.offerings.filter(x => x !== e) : [...f.offerings, e] }))}
                      className={`${chipBase} ${on ? chipOn : chipOff}`}
                      aria-pressed={on}
                      aria-label={`Offering ${e}${on ? " selected" : ""}`}
                      data-errorfield={e}
                    >{e}</button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, offeringOtherOn: !f.offeringOtherOn }))}
                  className={`${chipBase} ${form.offeringOtherOn ? chipOn : chipOff}`}
                  aria-pressed={form.offeringOtherOn}
                >Other</button>
              </div>
              <AnimatePresence>
                {form.offeringOtherOn && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
                    <input className={inputCls} placeholder="Add custom offering"
                      value={form.offeringOther}
                      onChange={e => setForm(f => ({ ...f, offeringOther: e.target.value }))}
                      aria-label="Custom offering"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </FieldSet>
            {/* Proof uploads */}
            <div className="mt-6">
              <div className={labelCls}>Upload proof documents (collab screenshots, media kits, press, etc — optional)</div>
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
      {/* STEP 3: REVIEW */}
      {step === 3 && (
        <motion.div key="s3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.35 }}>
          <section ref={formRefs[3]}>
            <SectionHeader icon={ShieldCheck} title="Review" desc="Final check before submitting your creator profile." />
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm text-white/60 mb-1">Name</div>
                <div className="font-medium">{form.fullName || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Intro</div>
                <div className="font-medium">{form.headline || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Bio</div>
                <div className="font-medium whitespace-pre-wrap">{form.bio || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Main Platform</div>
                <div className="font-medium">{form.mainPlatform === "Other" ? form.otherPlatform : form.mainPlatform || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Handle</div>
                <div className="font-medium">{form.handle || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Audience</div>
                <div className="font-medium">{form.audienceSize || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Niche</div>
                <div className="font-medium">{form.niche || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-white/60 mb-1">Offerings</div>
                <div className="font-medium">{offeringList.join(", ") || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Languages</div>
                <div className="font-medium break-words">{(form.languages || []).join(", ") || "—"}</div>
                <div className="text-sm text-white/60 mt-4 mb-1">Social Links</div>
                <div className="font-medium break-all">
                  {Object.entries(form.socials).filter(([k, v]) => v).map(([k, v]) =>
                    <div key={k}>{k.charAt(0).toUpperCase() + k.slice(1)}: <a href={v} target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline">{v}</a></div>
                  )}
                  {Object.values(form.socials).filter(Boolean).length === 0 && "—"}
                </div>
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
  );
}

