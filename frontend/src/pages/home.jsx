import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bolt,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { SwipeCarousel } from "../components/HeroArt";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";



const TRUSTED_BY = [
  "Nimbus Labs",
  "Quanticode",
  "Skyforge",
  "Nova Digital",
  "Metta Co.",
];

const FEATURES = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "Escrow that thinks ahead",
    desc: "Automated release conditions, dispute fallbacks, and audit-ready ledgers keep every sprint accountable.",
    badge: "Trust",
  },
  {
    icon: <Bolt className="h-6 w-6" />,
    title: "Signal-based matching",
    desc: "Reputation graphs and intent data surface the right talent in minutes, not weeks.",
    badge: "Speed",
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Reusable workflow packs",
    desc: "Bundle briefs, milestones, NDAs, and payment rails into templates your team can clone instantly.",
    badge: "Efficiency",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Live workrooms",
    desc: "Context-rich threads, asset vaults, and approvals stay in a sealed room with escrow-aware status updates.",
    badge: "Collaboration",
  },
];

const WORKFLOW_STEPS = [
  {
    title: "Brief & scope",
    desc: "Answer guided prompts and auto-generate milestones, NDAs, and payout rules.",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Match & shortlist",
    desc: "Cyphire routes your brief to vetted squads, highlighting signal-rich portfolios.",
    icon: <Bolt className="h-5 w-5" />,
  },
  {
    title: "Workroom delivery",
    desc: "Chat, assets, and approvals stay in a sealed room with escrow-aware status updates.",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    title: "Release & learn",
    desc: "Funds unlock automatically once both sides sign off. Insights feed the next launch.",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
];

const SECURITY_PILLARS = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "SOC-ready controls",
    desc: "Audit trails, IP whitelisting, and immutable escrow logs ship by default.",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Vaulted asset storage",
    desc: "Uploads live in encrypted object stores with scoped share links and expiry timers.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Compliance coverage",
    desc: "GST invoices, TDS reports, and KYC workflows bundled into every payout.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Cyphire gave us a delivery pod in 36 hours flat. Escrow kept finance comfortable and the workroom kept engineering honest.",
    name: "Serena Patel",
    role: "Director of Product @ Quanticode",
  },
  {
    quote: "We sunset five tools after moving to Cyphire. Payments, briefs, legal�everything finally talks to each other.",
    name: "Jonas Meyer",
    role: "Founder @ Nova Digital",
  },
  {
    quote: "Our compliance team loves the paper trail, our creatives love the pace. Rare to see both sides happy.",
    name: "Harshita Rao",
    role: "Ops Lead @ Nimbus Labs",
  },
];

const FAQ_ITEMS = [
  {
    question: "How fast can I launch a new brief?",
    answer: "Most teams publish within 4�6 minutes using the guided brief builder. Templates mean recurring work takes seconds.",
  },
  {
    question: "What protections do freelancers get?",
    answer: "Every mission funds escrow up-front. Milestones release only after your approval, with dedicated dispute support if anything slips.",
  },
  {
    question: "Can I bring my existing contractors?",
    answer: "Yes. Invite them by email, drop them into a workroom, and Cyphire will still handle contracts, payouts, and analytics.",
  },
  {
    question: "Is Cyphire available internationally?",
    answer: "We currently support teams across 22 countries with multi-currency escrow and localised tax paperwork.",
  },
];

const TICKER_FALLBACK = [
  { label: "UI overhaul for fintech dashboard", category: "Design", budget: "\u20B9 85k" },
  { label: "Serverless analytics pipeline", category: "Data", budget: "\u20B9 1.6L" },
  { label: "Investor-ready pitch deck", category: "Content", budget: "\u20B9 60k" },
  { label: "Growth experiment sprints", category: "Marketing", budget: "\u20B9 70k" },
  { label: "On-demand QA automation", category: "QA", budget: "\u20B9 55k" },
  { label: "Community event sponsorship", category: "Sponsorship", budget: "\u20B9 40k" },
];
export const GradientText = ({ children, className = "" }) => (
  <span
    className={`bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent ${className}`}
  >
    {children}
  </span>
);

export const GlassCard = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}
  >
    {children}
  </div>
);

export const NeonButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 ${className}`}
  >
    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600" />
    <span className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-400/40 via-fuchsia-400/30 to-sky-400/30 blur-md" />
    <span className="relative">{children}</span>
  </button>
);

const inr = (n) => {
  if (typeof n !== "number" || Number.isNaN(n)) return "�";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

const Aurora = ({ className = "" }) => (
  <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
    <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
    <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(168,85,247,0.06),rgba(14,165,233,0.06),rgba(236,72,153,0.06),rgba(168,85,247,0.06))]" />
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

const Shimmer = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl border border-white/10 bg-white/5 ${className}`} />
);
const HeroStatCard = ({ icon, value, label }) => (
  <div className='group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/20/[0.10] via-white/5/[0.06] to-white/10/[0.02] px-6 py-5 backdrop-blur-2xl shadow-[0_40px_110px_rgba(8,0,35,0.55)]'>
    <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.28),transparent_55%)] opacity-0 transition group-hover:opacity-100' />
    <div className='relative flex items-center gap-4 text-white'>
      <span className='grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-black/30 text-white/80 shadow-inner shadow-black/40'>
        {icon}
      </span>
      <div>
        <div className='text-2xl font-semibold tracking-tight'>{value}</div>
        <div className='text-[11px] uppercase tracking-[0.4em] text-white/50'>{label}</div>
      </div>
    </div>
  </div>
);

const HeroShowcase = ({ tickerItems }) => {
  // eslint-disable-next-line no-unused-vars
  const primary = tickerItems[0] ?? TICKER_FALLBACK[0];
  // eslint-disable-next-line no-unused-vars
  const secondary = tickerItems[1] ?? TICKER_FALLBACK[1];

  return (
    <div className='relative flex justify-center lg:justify-end'>
      <div className='absolute -top-24 right-10 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl' />
      <div className='absolute -bottom-12 left-4 hidden h-60 w-60 rounded-full bg-sky-500/20 blur-3xl lg:block' />
      <div className='relative w-full max-w-[420px] overflow-hidden rounded-[32px] border border-white/15 bg-white/10/0 p-6 backdrop-blur-[32px] shadow-[0_60px_140px_rgba(79,70,229,0.28)]'>
        <div className='absolute inset-[1px] rounded-[30px] border border-white/15 opacity-60' />
        <div className='relative overflow-hidden rounded-[26px] border border-white/10 bg-black/40 shadow-inner shadow-black/70'>
          <SwipeCarousel />
        </div>
      </div>
    </div>
  );
};

export const TiltTaskCard = ({ task, onView }) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [10, -10]);
  const rotateY = useTransform(x, [0, 1], [-12, 12]);

  const createdAt = new Date(task?.createdAt || Date.now());
  const expireDate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const categories = Array.isArray(task?.category) ? task.category.slice(0, 3) : [];
  const capacity = Number(task?.numberOfApplicants) || 0;
  const applied = Array.isArray(task?.applicants) ? task.applicants.length : 0;

  const handleView = () => {
    if (typeof onView === "function") {
      onView(task);
    }
  };

  return (
    <motion.div
      className="relative group rounded-2xl border border-white/10 bg-white/5 p-[1px] backdrop-blur-xl overflow-hidden"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        x.set(px);
        y.set(py);
        event.currentTarget.style.setProperty("--x", `${px * 100}%`);
        event.currentTarget.style.setProperty("--y", `${py * 100}%`);
      }}
      onMouseLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      <div
        className="pointer-events-none absolute -inset-24 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(168,85,247,0.18), transparent 35%)",
        }}
      />
      <motion.div
        style={{ rotateX, rotateY }}
        className="relative rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      >
        {categories.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            {categories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70"
              >
                <Star className="h-3.5 w-3.5" /> {category}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-lg font-semibold text-white line-clamp-2">{task?.title}</h3>
        <p className="mt-2 text-sm text-white/70 line-clamp-3">{task?.description}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-[13px] text-white/85">
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center">
            <div className="text-xs text-white/60">Budget</div>
            <div className="font-medium">{inr(task?.price)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center">
            <div className="text-xs text-white/60">Applications</div>
            <div className="font-medium">
              {capacity > 0 ? `${applied}/${capacity}` : applied}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center">
            <div className="text-xs text-white/60">Apply in</div>
            <div className={`font-medium ${daysLeft <= 0 ? "text-red-300" : ""}`}>
              {daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? "s" : ""}` : "Expired"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <NeonButton className="px-4 py-2 text-xs" onClick={handleView}>
            View Task <ArrowRight className="h-4 w-4" />
          </NeonButton>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className={`h-2 w-2 rounded-full ${daysLeft > 0 ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
            <span>{applied} applied</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
const HeroTicker = ({ items }) => {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent" />
      <div className="flex w-max animate-marquee gap-6 opacity-85">
        {loop.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-[11rem] items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs uppercase tracking-[0.3em] text-white/70 backdrop-blur-md"
          >
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" /> {item.category || "Brief"}
            </span>
            <span className="text-white/50">{item.budget || "Live"}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 22s linear infinite;
        }
      `}</style>
    </div>
  );
};
const HeroSection = ({ navigate }) => (
  <section className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
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
          <NeonButton onClick={() => navigate("/choose-category")}>
            Post a Task
          </NeonButton>

          <button
            onClick={() => navigate("/tasks")}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white/80 backdrop-blur-xl transition-all hover:bg-white/10"
          >
            Explore Marketplace{" "}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>
      </div>

      <div className="relative">
        <SwipeCarousel />
      </div>
    </div>
    {/* Smooth marquee under hero */}
    <div className="relative overflow-hidden py-6 mt-12">
      {/* Fades on edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent" />

      {/* Track */}
      <div className="flex w-max animate-marquee gap-10 opacity-80">
        {["Technology", "Education", "Events", "Healthcare", "Architecture", "Home & Safety"].map((name, i) => (
          <div
            key={i}
            className="flex min-w-[10rem] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 backdrop-blur-md"
          >
            <BadgeCheck className="mr-2 h-4 w-4" /> {name}
          </div>
        ))}

        {/* duplicate once for seamless loop */}
        {["Technology", "Education", "Events", "Healthcare", "Architecture", "Home & Safety"].map((name, i) => (
          <div
            key={`dup-${i}`}
            className="flex min-w-[10rem] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 backdrop-blur-md"
          >
            <BadgeCheck className="mr-2 h-4 w-4" /> {name}
          </div>
        ))}
      </div>

      <style>{`
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      animation: marquee 22s linear infinite;
    }
  `}</style>
    </div>

  </section>
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

const FeatureGrid = ({ items }) => (
  <section className="mx-auto max-w-screen-2xl px-6 py-14">
    <SectionHeader
      eyebrow="Why Cyphire"
      title="A marketplace engineered for outcomes"
      subtitle="Purpose-built primitives that reduce risk and increase throughput for both sides."
    />
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((feature) => (
        <GlassCard key={feature.title} className="flex flex-col gap-5 p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            {feature.icon}
            <span>{feature.badge}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm text-white/70">{feature.desc}</p>
          </div>
          <button className="mt-auto inline-flex items-center gap-2 text-sm text-fuchsia-300/90 transition-colors hover:text-fuchsia-200">
            Learn more <ArrowUpRight className="h-4 w-4" />
          </button>
        </GlassCard>
      ))}
    </div>
  </section>
);

const LiveBriefs = ({ tasks, loading, error, onRetry, navigate }) => (
  <section className="mx-auto max-w-screen-2xl px-6 py-14">
    <SectionHeader
      eyebrow="Live briefs"
      title="Fresh missions picking up signal"
      subtitle="A snapshot of what teams are shipping on Cyphire right now."
    />
    {error && (
      <GlassCard className="mb-6 flex items-center justify-between px-5 py-4 text-sm text-white/70">
        <span>{error}</span>
        <button
          onClick={onRetry}
          className="rounded-lg border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
        >
          Retry
        </button>
      </GlassCard>
    )}
    <div className="grid gap-6 md:grid-cols-3">
      {loading
        ? [0, 1, 2].map((item) => <Shimmer key={item} className="h-[320px]" />)
        : tasks.length > 0
          ? tasks.map((task) => (
            <TiltTaskCard
              key={task._id || task.id}
              task={task}
              onView={() => navigate(`/task/${task._id || task.id}`)}
            />
          ))
          : (
            <GlassCard className="col-span-full flex flex-col items-center justify-center gap-3 px-6 py-16 text-white/70">
              <BadgeCheck className="h-6 w-6 text-fuchsia-300" />
              <p>No live briefs yet�check back in a moment.</p>
            </GlassCard>
          )}
    </div>
    <div className="mt-10 flex items-center justify-center">
      <button
        onClick={() => navigate("/tasks")}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white/80 backdrop-blur-xl transition hover:bg-white/10"
      >
        View all tasks <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </section>
);

const SecuritySection = ({ pillars }) => (
  <section className="mx-auto max-w-screen-2xl px-6 py-14">
    <SectionHeader
      eyebrow="Security & compliance"
      title="Enterprise-grade controls without the enterprise drag"
      subtitle="Cyphire builds governance into every workflow so your legal and finance teams can sleep at night."
    />
    <div className="grid gap-6 md:grid-cols-3">
      {pillars.map((pillar) => (
        <GlassCard key={pillar.title} className="flex flex-col gap-4 p-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-200">
            {pillar.icon}
          </div>
          <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
          <p className="text-sm text-white/70">{pillar.desc}</p>
        </GlassCard>
      ))}
    </div>
  </section>
);

const TestimonialDeck = ({ items }) => (
  <section className="mx-auto max-w-screen-2xl px-6 py-16">
    <SectionHeader
      eyebrow="Signal over noise"
      title="Teams that switched to Cyphire"
      subtitle="Our customers ship faster because escrow, talent, and operations finally live in one environment."
    />
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item) => (
        <GlassCard key={item.name} className="flex h-full flex-col gap-5 p-6">
          <div className="flex items-center gap-1 text-fuchsia-200">
            {[...Array(5)].map((_, index) => (
              <Star key={index} className="h-4 w-4" />
            ))}
          </div>
          <p className="text-white/80">�{item.quote}�</p>
          <div className="mt-auto text-sm text-white/60">
            <div className="font-medium text-white">{item.name}</div>
            <div>{item.role}</div>
          </div>
        </GlassCard>
      ))}
    </div>
  </section>
);

const FAQSection = ({ items }) => {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <SectionHeader
        eyebrow="Questions"
        title="Everything you need to know"
        subtitle="If you have anything else on your mind, our support team is a heartbeat away."
      />
      <div className="space-y-4">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <GlassCard key={item.question} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-white/80"
              >
                <span className="text-sm font-medium sm:text-base">{item.question}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="faq-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-5 pb-5 text-sm text-white/70">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
};

const FinalCTA = ({ navigate }) => {
  const plans = [
    {
      id: "free",
      label: "Free",
      price: "\u20B9 0",
      description: "Unlimited briefs, pay-per-mission escrow, community support.",
      cta: "Create account",
      link: "/signup",
    },
    {
      id: "plus",
      label: "Plus",
      price: "\u20B9 4,999/mo",
      description: "Priority matching, compliance exports, and finance automation.",
      cta: "Upgrade to Plus",
      link: "/pricing",
    },
    {
      id: "ultra",
      label: "Ultra",
      price: "Talk to us",
      description: "Dedicated pods, bespoke legal, and on-site rollout for global teams.",
      cta: "Book a call",
      link: "/contact",
    },
  ];
  const [selectedPlan, setSelectedPlan] = useState(plans[1]);

  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-20">
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-2xl" />
      <GlassCard className="overflow-hidden rounded-3xl border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl md:p-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-2xl space-y-4">
            <h3 className="text-2xl font-semibold text-white md:text-3xl">
              <GradientText>Ready to launch your next mission?</GradientText>
            </h3>
            <p className="text-white/70">
              Choose the runway that fits your team. Upgrade anytime�your escrow, workflows, and insights come with you.
            </p>
            <div className="flex flex-wrap gap-3">
              {plans.map((plan) => {
                const isActive = plan.id === selectedPlan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`rounded-xl px-4 py-2 text-sm transition ${isActive
                        ? "border border-fuchsia-400/60 bg-fuchsia-500/20 text-white"
                        : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                  >
                    {plan.label}
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">{selectedPlan.price}</div>
              <div className="mt-1 text-sm">{selectedPlan.description}</div>
            </div>
          </div>
          <div className="flex flex-col items-start gap-4">
            <NeonButton onClick={() => navigate(selectedPlan.link)}>
              {selectedPlan.cta}
            </NeonButton>
            <button
              onClick={() => navigate("/help")}
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
            >
              Talk to support <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </GlassCard>
    </section>
  );
};
export default function Home() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
          signal: controller.signal,
        });

        const stored = Number(localStorage.getItem("loginTime") || "0");
        const oneDay = 24 * 60 * 60 * 1000;

        if (!response.ok) {
          navigate("/signup", { replace: true });
          return;
        }

        if (!stored) {
          localStorage.setItem("loginTime", Date.now().toString());
        } else if (Date.now() - stored >= oneDay) {
          localStorage.removeItem("loginTime");
          navigate("/signup", { replace: true });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          navigate("/signup", { replace: true });
        }
      }
    };

    checkAuth();
    return () => controller.abort();
  }, [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingTasks(true);
    setTaskError("");

    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tasks`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch tasks");
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching tasks:", error);
          setTaskError("We couldn't load live briefs. Try again soon.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTasks(false);
        }
      }
    })();

    return () => controller.abort();
  }, [reloadToken]);

  const liveTasks = useMemo(() => tasks.slice(0, 3), [tasks]);



  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100">
      <main className="relative overflow-hidden">
        <Suspense fallback={<div className="p-6 text-center text-white/70">Loading navigation�</div>}>
          <Navbar />
        </Suspense>
        <Aurora />
        <Particles />

        <HeroSection
          navigate={navigate}
        />

        <FeatureGrid items={FEATURES} />

        <LiveBriefs
          tasks={liveTasks}
          loading={loadingTasks}
          error={taskError}
          onRetry={() => setReloadToken((token) => token + 1)}
          navigate={navigate}
        />


        <SecuritySection pillars={SECURITY_PILLARS} />

        <TestimonialDeck items={TESTIMONIALS} />

        <FAQSection items={FAQ_ITEMS} />

        <FinalCTA navigate={navigate} />

        <Footer />
      </main>
    </div>
  );
}




