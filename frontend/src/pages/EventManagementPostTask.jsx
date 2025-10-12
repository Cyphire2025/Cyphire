import React, { useEffect, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  MapPin,
  Building,
  Ticket,
  Briefcase,
} from "lucide-react";
import PostingOverlay from "../components/PostingOverlay";

const Calendar = React.lazy(() => import('@/components/ui/Cal'));

const MAX_EVENT_TYPES = 3;
const MAX_SERVICES = 7;
const MAX_ATTACHMENTS = 10;

export default function EventManagementPostTask() {
  const navigate = useNavigate();

  const eventTypeOptions = [
    "College Fest",
    "Corporate Event",
    "Seminar / Conference",
    "Workshop",
    "Webinar",
    "Community Event",
    "Concert / Festival",
  ];

  const serviceOptions = [
    "Posters & Flyers",
    "Branding Kit",
    "Registration Website",
    "Social Media Campaign",
    "Promo Video",
    "Brochure / Schedule",
    "Email Templates",
  ];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(null);
  const [price, setPrice] = useState("");
  const [numApplicants, setNumApplicants] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [eventTypes, setEventTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [audienceSize, setAudienceSize] = useState("");
  const [location, setLocation] = useState("");
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [particles, setParticles] = useState([]);
  const [openDeadline, setOpenDeadline] = useState(false);

  const logoInputRef = useRef(null);
  const fileInputRef = useRef(null);

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
      return;
    }
    const objectUrl = URL.createObjectURL(logo);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logo]);

  const handleChipSelection = (value, selectedItems, setter, max) => {
    setter((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      if (prev.length >= max) {
        alert(`You can select up to ${max} items.`);
        return prev;
      }
      return [...prev, value];
    });
  };

  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    if (attachments.length + files.length <= MAX_ATTACHMENTS) {
      setAttachments((prev) => [...prev, ...files]);
    } else {
      alert(`You can upload up to ${MAX_ATTACHMENTS} attachments.`);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setPosting(true);
      setPosted(false);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", "Event Management"); // Main category
      formData.append("numberOfApplicants", numApplicants);
      formData.append("price", price);
      if (deadline) formData.append("deadline", deadline.toISOString());

      // --- FIX: Group specific details into a metadata object ---
      formData.append(
        "metadata",
        JSON.stringify({
          "Event Types": eventTypes,
          "Services Needed": services,
          "Audience Size": audienceSize,
          "Location": location,
        })
      );

      if (logo) formData.append("logo", logo);
      attachments.forEach((file) => formData.append("attachments", file));

      const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        setPosted(true);
        setTimeout(() => navigate("/tasks"), 1600);
      } else {
        const errData = await res.json();
        alert(`Failed to post task: ${errData.error || "Unknown error"}`);
        setPosting(false);
      }
    } catch (error) {
      console.error("Error posting task:", error);
      alert("An error occurred while posting the task.");
      setPosting(false);
    }
  };

  const essentials = [
    {
      id: "title",
      label: "Sharpen your event title",
      hint: "Aim for a clear, engaging headline.",
      complete: Boolean(title.trim()),
    },
    {
      id: "description",
      label: "Describe the event",
      hint: "Spell out the theme, goals, and audience.",
      complete: description.trim().length > 0,
    },
    {
      id: "eventType",
      label: "Tag event types",
      hint: `Pick up to ${MAX_EVENT_TYPES} to define the occasion.`,
      complete: eventTypes.length > 0,
    },
    {
      id: "logistics",
      label: "Lock budget, deadline & scale",
      hint: "Transparent expectations attract better talent.",
      complete: Boolean(price) && Boolean(deadline) && Boolean(audienceSize),
    },
  ];

  const readinessScore = Math.round(
    (essentials.filter((item) => item.complete).length / essentials.length) * 100
  );

  const eventTypesSummary = eventTypes.length ? eventTypes.join(", ") : "No event types selected";
  const servicesSummary = services.length ? services.join(", ") : "No services selected";
  const attachmentsSummary = attachments.length
    ? `${attachments.length} file${attachments.length > 1 ? "s" : ""} attached`
    : "No attachments yet";


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-white md:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

      {particles.map((p, i) => (
        <div
          key={i}
          className="hidden sm:block absolute rounded-full bg-purple-500/35 blur-md animate-float"
          style={{ ...p }}
        />
      ))}

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#141414]/85 p-6 shadow-[0_35px_120px_rgba(129,17,188,0.35)] backdrop-blur-2xl sm:p-8 md:p-10"
        >
          <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-pink-500/10 blur-3xl" />

          <div className="relative grid gap-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
            <section className="space-y-8">
              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.45 }}
                    className="bg-gradient-to-r from-pink-400 via-purple-300 to-purple-100 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl"
                  >
                    Post Event Task
                  </motion.h1>
                  <p className="mt-3 text-sm text-gray-200/80 sm:text-base">
                    Describe your event, and we'll connect you with the perfect creative professionals.
                  </p>
                  <p className="mt-5 text-xs uppercase tracking-[0.35em] text-purple-200/70">
                    Step 1 of 2 | Event Details
                  </p>
                </div>
                <motion.button
                  onClick={() => navigate("/choose-category")}
                  className="group flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-purple-300/60 hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
                  Back
                </motion.button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-200">Event Cover Image</p>
                <motion.div
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => logoInputRef.current?.click()}
                  className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-8 text-center transition hover:border-purple-300/70 hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-100 group-hover:bg-purple-500/30">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-white">Upload a cover image</p>
                  <p className="mt-1 text-xs text-gray-400">PNG or JPG | Up to 5MB</p>
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} className="hidden" />
                </motion.div>
                {logoPreview && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <img src={logoPreview} alt="Selected cover" className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/10" />
                      <div>
                        <p className="text-sm font-medium text-white/90">{logo?.name}</p>
                        <p className="text-xs text-gray-400">Ready to make an impression</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setLogo(null)} className="text-white/60 transition hover:text-red-300">
                      <XCircle className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="space-y-6">
                 <div className="relative">
                    <input id="taskTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Annual Tech Fest 2025" className="peer block w-full rounded-2xl border border-white/12 bg-white/5 px-5 pt-7 pb-3 text-[15px] leading-relaxed text-white placeholder-transparent shadow-inner shadow-black/10 transition focus:border-pink-300/70 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-purple-500/30"/>
                    <label htmlFor="taskTitle" className="pointer-events-none absolute left-5 top-3 text-[11px] font-medium uppercase tracking-[0.18em] text-purple-200 transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-purple-100">Title</label>
                 </div>
                 <div className="relative">
                    <textarea id="taskDescription" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the event, target audience, theme, and key objectives..." className="peer block w-full resize-none rounded-2xl border border-white/12 bg-white/5 px-5 pt-7 pb-3 text-[15px] leading-relaxed text-white placeholder-transparent shadow-inner shadow-black/10 transition focus:border-pink-300/70 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-purple-500/30"/>
                    <label htmlFor="taskDescription" className="pointer-events-none absolute left-5 top-3 text-[11px] font-medium uppercase tracking-[0.18em] text-purple-200 transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-purple-100">Description</label>
                 </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-gray-200">Event Type</p>
                <div className="flex flex-wrap gap-3">
                  {eventTypeOptions.map((type) => {
                    const selected = eventTypes.includes(type);
                    const disabled = !selected && eventTypes.length >= MAX_EVENT_TYPES;
                    return (
                      <motion.button key={type} type="button" layout disabled={disabled} onClick={() => !disabled && handleChipSelection(type, eventTypes, setEventTypes, MAX_EVENT_TYPES)} className={`relative flex select-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${selected ? "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40" : "border-white/15 bg-white/5 text-gray-200/90 hover:border-purple-300/60 hover:bg-white/10"} ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
                         <Ticket className="h-4 w-4 opacity-70" /> {type}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-gray-400">Choose up to {MAX_EVENT_TYPES} types that best describe your event.</p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-gray-200">Services Needed</p>
                <div className="flex flex-wrap gap-3">
                  {serviceOptions.map((service) => {
                    const selected = services.includes(service);
                    const disabled = !selected && services.length >= MAX_SERVICES;
                    return (
                      <motion.button key={service} type="button" layout disabled={disabled} onClick={() => !disabled && handleChipSelection(service, services, setServices, MAX_SERVICES)} className={`relative flex select-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${selected ? "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40" : "border-white/15 bg-white/5 text-gray-200/90 hover:border-purple-300/60 hover:bg-white/10"} ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}>
                         <Sparkles className="h-4 w-4 opacity-70" /> {service}
                      </motion.button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-gray-400">Select all creative services you require for this event.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                 <div className="relative"><Users className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-200/70" /><input id="audienceSize" type="number" inputMode="numeric" min="1" value={audienceSize} onChange={(e) => setAudienceSize(e.target.value)} placeholder="e.g., 500" className="peer block w-full rounded-2xl border border-white/12 bg-white/5 px-12 pt-8 pb-3 text-[15px] text-white placeholder-transparent transition focus:border-pink-300/70 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-purple-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /><label htmlFor="audienceSize" className="pointer-events-none absolute left-12 top-3 text-[11px] font-medium uppercase tracking-[0.18em] text-purple-200 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-purple-100">Audience Size</label></div>
                 <div className="relative"><MapPin className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-200/70" /><input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Bangalore" className="peer block w-full rounded-2xl border border-white/12 bg-white/5 px-12 pt-8 pb-3 text-[15px] text-white placeholder-transparent transition focus:border-pink-300/70 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-purple-500/30" /><label htmlFor="location" className="pointer-events-none absolute left-12 top-3 text-[11px] font-medium uppercase tracking-[0.18em] text-purple-200 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-purple-100">Location</label></div>
                 <div className="relative"><Wallet className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-200/70" /><input id="price" type="number" inputMode="decimal" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 10000" className="peer block w-full rounded-2xl border border-white/12 bg-white/5 px-12 pt-8 pb-3 text-[15px] text-white placeholder-transparent transition focus:border-pink-300/70 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-purple-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /><label htmlFor="price" className="pointer-events-none absolute left-12 top-3 text-[11px] font-medium uppercase tracking-[0.18em] text-purple-200 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-purple-100">Budget (₹)</label></div>
                 <div className="relative"><Users className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-200/70" /><input id="applicants" type="number" inputMode="numeric" min="1" value={numApplicants} onChange={(e) => setNumApplicants(e.target.value)} placeholder="e.g., 5" className="peer block w-full rounded-2xl border border-white/12 bg-white/5 px-12 pt-8 pb-3 text-[15px] text-white placeholder-transparent transition focus:border-pink-300/70 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-purple-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /><label htmlFor="applicants" className="pointer-events-none absolute left-12 top-3 text-[11px] font-medium uppercase tracking-[0.18em] text-purple-200 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-focus:top-3 peer-focus:text-[11px] peer-focus:text-purple-100">Max Applicants</label></div>
                 <div className="relative min-w-[170px] group"><Popover open={openDeadline} onOpenChange={setOpenDeadline}><PopoverTrigger asChild><div className="relative w-full"><CalendarDays className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-200/70" /><div tabIndex={0} className="peer block w-full cursor-pointer rounded-2xl border border-white/12 bg-white/5 px-12 pt-8 pb-3 text-[15px] leading-relaxed text-white transition focus:border-pink-300/70 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-purple-500/30">{deadline ? (<span className="whitespace-nowrap text-white">{format(deadline, "PP")}</span>) : (<span className="text-transparent">-</span>)}</div><label className={`pointer-events-none absolute left-12 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-200 ${deadline ? "top-3 text-purple-200" : "top-1/2 -translate-y-1/2 text-xs text-gray-400"}`}>Deadline</label></div></PopoverTrigger><PopoverContent className="w-auto p-0 bg-[#141414] border border-white/10 rounded-xl shadow-xl"><React.Suspense fallback={<div>Loading...</div>}><Calendar mode="single" selected={deadline} onSelect={(date) => { setDeadline(date); setOpenDeadline(false); }} fromDate={new Date()} className="rounded-md border-none text-white" /></React.Suspense></PopoverContent></Popover></div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-gray-200">Attachments <span className="text-xs text-gray-400">(Optional)</span></p>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => fileInputRef.current?.click()} className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-8 text-center transition hover:border-purple-300/70 hover:bg-white/10">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-100 group-hover:bg-purple-500/30"><UploadCloud className="h-5 w-5" /></div>
                  <p className="mt-3 text-sm font-medium text-white">Drop files or click to browse</p>
                  <p className="mt-1 text-xs text-gray-400">Up to {MAX_ATTACHMENTS} files · Mood boards, brand guides, etc.</p>
                  <input ref={fileInputRef} type="file" multiple onChange={handleAttachmentChange} className="hidden" />
                </motion.div>
                <AnimatePresence>
                  {attachments.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="mt-4 flex flex-wrap gap-3">
                      {attachments.map((file, index) => (
                        <motion.div key={`${file.name}-${index}`} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button type="button" onClick={() => removeAttachment(index)} className="text-white/60 transition hover:text-red-300"><XCircle className="h-4 w-4" /></button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} disabled={posting}
                className="sticky bottom-4 w-full rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-6 py-3 text-lg font-semibold shadow-[0_20px_60px_rgba(129,17,188,0.35)] transition hover:shadow-[0_25px_70px_rgba(129,17,188,0.45)] focus:outline-none focus:ring-4 focus:ring-purple-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {posting ? "Posting..." : "Post Event Task"}
              </motion.button>
            </section>

            <aside className="relative mt-2 hidden md:block space-y-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_25px_80px_rgba(15,15,35,0.45)] backdrop-blur-xl sm:px-7 sm:py-10">
              <div className="absolute -top-20 right-4 h-40 w-40 rounded-full bg-gradient-to-tr from-purple-500/35 via-pink-400/25 to-transparent blur-3xl" />
              <div className="relative space-y-6 text-sm text-white/90">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-purple-200/80">Snapshot</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-purple-100">{readinessScore}% ready</span>
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div><dt className="text-xs uppercase tracking-[0.2em] text-gray-400">Title</dt><dd className="text-white/90">{title.trim() || "Title coming soon"}</dd></div>
                    <div><dt className="text-xs uppercase tracking-[0.2em] text-gray-400">Event Types</dt><dd className="text-white/90">{eventTypesSummary}</dd></div>
                    <div><dt className="text-xs uppercase tracking-[0.2em] text-gray-400">Services</dt><dd className="text-white/90">{servicesSummary}</dd></div>
                    <div><dt className="text-xs uppercase tracking-[0.2em] text-gray-400">Attachments</dt><dd className="text-white/90">{attachmentsSummary}</dd></div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-purple-200/80">Launch checklist</p>
                  <ul className="mt-4 space-y-3 text-sm">
                    {essentials.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        {item.complete ? <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" /> : <CircleDashed className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-200/70" />}
                        <div>
                          <p className="font-medium text-white/90">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.hint}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/10 p-2"><Lightbulb className="h-5 w-5 text-purple-100" /></div>
                    <div>
                      <p className="text-sm font-semibold text-white">Pro tip</p>
                      <p className="text-xs text-gray-300">Link to past events or inspiration so applicants can match your vibe.</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      <PostingOverlay posting={posting} posted={posted} redirectTo="Tasks" />

      <style>{`
        @keyframes gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .animate-gradient{background-size:220% 220%;animation:gradient 16s ease infinite}
        @keyframes float{0%{transform:translateY(0px)}50%{transform:translateY(-16px)}100%{transform:translateY(0px)}}
        .animate-float{animation:float infinite ease-in-out}
      `}</style>
    </div>
  );
}