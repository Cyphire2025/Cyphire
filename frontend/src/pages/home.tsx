import React, { Suspense, useEffect, useMemo, useState, useRef, useCallback, lazy, FC, ReactNode, MouseEvent } from "react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useReducedMotion, useInView } from "framer-motion";
import {
  ArrowRight, ArrowUp, ArrowUpRight, BadgeCheck, Bolt, CheckCircle2, ChevronDown, ChevronRight, Layers, Loader2, Lock, MessageSquare, ShieldCheck, Sparkles, Star, Zap,
} from "lucide-react";
import Footer from "../components/footer";
import { TiltTaskCard as TasksTile } from "./Tasks";

// Lazy load heavy components
const Navbar = lazy(() => import("../components/navbar"));

const SwipeCarousel = lazy(() => import("../components/HeroArt").then(module => ({ default: module.SwipeCarousel })));

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

// --- TypeScript: Define Core Data Types ---
interface Task {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string[];
  numberOfApplicants: number;
  applicants: unknown[];
  createdAt: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FeatureItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge: string;
}

// --- CONSTANTS ---
const FEATURES: FeatureItem[] = [{ icon: ShieldCheck, title: "Escrow that thinks ahead", desc: "Automated release conditions, dispute fallbacks, and audit-ready ledgers keep every sprint accountable.", badge: "Trust" }, { icon: Bolt, title: "Signal-based matching", desc: "Reputation graphs and intent data surface the right talent in minutes, not weeks.", badge: "Speed" }, { icon: Layers, title: "Reusable workflow packs", desc: "Bundle briefs, milestones, NDAs, and payment rails into templates your team can clone instantly.", badge: "Efficiency" }, { icon: MessageSquare, title: "Live workrooms", desc: "Context-rich threads, asset vaults, and approvals stay in a sealed room with escrow-aware status updates.", badge: "Collaboration" }];
const SECURITY_PILLARS = [{ icon: ShieldCheck, title: "SOC-ready controls", desc: "Audit trails, IP whitelisting, and immutable escrow logs ship by default." }, { icon: Lock, title: "Vaulted asset storage", desc: "Uploads live in encrypted object stores with scoped share links and expiry timers." }, { icon: CheckCircle2, title: "Compliance coverage", desc: "GST invoices, TDS reports, and KYC workflows bundled into every payout." }];
const TESTIMONIALS = [{ quote: "Cyphire gave us a delivery pod in 36 hours flat. Escrow kept finance comfortable and the workroom kept engineering honest.", name: "Serena Patel", role: "Director of Product @ Quanticode" }, { quote: "We sunset five tools after moving to Cyphire. Payments, briefs, legal—everything finally talks to each other.", name: "Jonas Meyer", role: "Founder @ Nova Digital" }, { quote: "Our compliance team loves the paper trail, our creatives love the pace. Rare to see both sides happy.", name: "Harshita Rao", role: "Ops Lead @ Nimbus Labs" }];
const FAQ_ITEMS: FAQItem[] = [{ question: "How fast can I launch a new brief?", answer: "Most teams publish within 4–6 minutes using the guided brief builder. Templates mean recurring work takes seconds." }, { question: "What protections do freelancers get?", answer: "Every mission funds escrow up-front. Milestones release only after your approval, with dedicated dispute support if anything slips." }, { question: "Can I bring my existing contractors?", answer: "Yes. Invite them by email, drop them into a workroom, and Cyphire will still handle contracts, payouts, and analytics." }, { question: "Is Cyphire available internationally?", answer: "We currently support teams across 22 countries with multi-currency escrow and localised tax paperwork." }];


// --- UTILITY COMPONENTS (Typed) ---

interface TextProps { children: ReactNode; className?: string; }
export const GradientText: FC<TextProps> = React.memo(({ children, className = "" }) => (<span className={`bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent ${className}`}>{children}</span>));
export const GlassCard: FC<TextProps> = React.memo(({ children, className = "" }) => (<div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)] ${className}`}>{children}</div>));

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { children: ReactNode; loading?: boolean; }
export const NeonButton: FC<NeonButtonProps> = React.memo(({ children, className = "", onClick, loading = false, ...props }) => (
  <button onClick={onClick} disabled={loading} {...props} className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 ${className}`}>
    <span className={`absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600 ${loading ? 'opacity-60' : ''}`} />
    <span className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-400/40 via-fuchsia-400/30 to-sky-400/30 blur-md" />
    <span className="relative z-10 flex items-center gap-2">{loading && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}{children}</span>
  </button>
));

const formatINR = (n: number | undefined | null): string => {
  if (typeof n !== 'number' || isNaN(n)) return "₹—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
};

const Aurora: FC = React.memo(() => (<div className="absolute inset-0 -z-10 overflow-hidden"> <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)] will-change-transform" /><div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)] will-change-transform" /><div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)] will-change-transform" /></div>));

const Particles: FC = React.memo(() => {
  const prefersReducedMotion = useReducedMotion();
  const [particleCount, setParticleCount] = useState(20);
  useEffect(() => { const updateCount = () => setParticleCount(window.innerWidth < 768 ? 10 : 20); updateCount(); window.addEventListener('resize', updateCount); return () => window.removeEventListener('resize', updateCount); }, []);
  if (prefersReducedMotion) return null;
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {Array.from({ length: particleCount }).map((_, i) => (<span key={i} className="absolute h-1 w-1 rounded-full bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.25)] will-change-transform" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animation: `float${i % 3} ${6 + (i % 5)}s ease-in-out ${i * 0.12}s infinite` }} />))}
      <style>{`@keyframes float0{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-10px,0)}} @keyframes float1{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-16px,0)}} @keyframes float2{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-22px,0)}}`}</style>
    </div>
  );
});

const Shimmer: FC<{ className?: string }> = React.memo(({ className = "" }) => (<div className={`animate-pulse rounded-2xl border border-white/10 bg-white/5 ${className}`}> <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" /> </div>));


// --- TASK CARD ---
interface TiltTaskCardProps { task: Task; onView: (task: Task) => void; onApply: (task: Task) => void; }
const TiltTaskCard: FC<TiltTaskCardProps> = React.memo(({ task, onView, onApply }) => {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.2 });
  const x = useMotionValue(0.5); const y = useMotionValue(0.5); const rotateX = useTransform(y, [0, 1], [6, -6]); const rotateY = useTransform(x, [0, 1], [-8, 8]);
  const createdAt = useMemo(() => new Date(task?.createdAt || Date.now()), [task?.createdAt]);
  const daysLeft = useMemo(() => Math.ceil(((new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)).getTime() - Date.now()) / (1000 * 60 * 60 * 24)), [createdAt]);
  const isNew = useMemo(() => (Date.now() - createdAt.getTime()) < (24 * 60 * 60 * 1000), [createdAt]); const isUrgent = daysLeft > 0 && daysLeft <= 2;
  const categories = Array.isArray(task?.category) ? task.category.slice(0, 3) : []; const capacity = Number(task?.numberOfApplicants) || 0; const applied = Array.isArray(task?.applicants) ? task.applicants.length : 0;

  const handleMouseMove = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
    event.currentTarget.style.setProperty("--x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    event.currentTarget.style.setProperty("--y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }, [prefersReducedMotion, x, y]);
  const handleMouseLeave = useCallback(() => { x.set(0.5); y.set(0.5); }, [x, y]);

  return (
    <motion.div ref={cardRef} initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.02 }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} tabIndex={0} aria-labelledby={`task-title-${task._id}`} className="relative group rounded-2xl border border-white/10 bg-white/5 p-[1px] backdrop-blur-xl overflow-hidden will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60">
      <div className="pointer-events-none absolute -inset-24 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(168,85,247,0.18), transparent 35%)` }} />
      <motion.div style={prefersReducedMotion ? {} : { rotateX, rotateY }} className="relative rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] h-full flex flex-col">
        {/* Card content remains identical */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {isNew && <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-medium text-emerald-300"> <Sparkles aria-hidden="true" className="h-3 w-3" /> New </span>}
          {isUrgent && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 font-medium text-amber-300"> <Zap aria-hidden="true" className="h-3 w-3" /> Urgent </span>}
          {categories.slice(0, 1).map((cat) => (<span key={cat} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70"> <Star aria-hidden="true" className="h-3 w-3" /> {cat} </span>))}
        </div>
        <h3 id={`task-title-${task._id}`} className="text-lg font-semibold text-white line-clamp-2">{task?.title}</h3>
        <p className="mt-2 text-sm text-white/70 line-clamp-3 flex-grow">{task?.description}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-[13px] text-white/85">
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center"><div className="text-xs text-white/60">Budget</div><div className="font-medium">{formatINR(task?.price)}</div></div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center"><div className="text-xs text-white/60">Slots</div><div className="font-medium">{capacity > 0 ? `${applied}/${capacity}` : "∞"}</div></div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center"><div className="text-xs text-white/60">Ends in</div><div className={`font-medium ${daysLeft <= 0 ? "text-red-300" : ""}`}>{daysLeft > 0 ? `${daysLeft}d` : "Expired"}</div></div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
          <div className="flex -space-x-2 overflow-hidden">{['S', 'J'].map((initial, i) => (<div key={i} className={`inline-block h-6 w-6 rounded-full ring-2 ring-black/30 text-white/80 text-[10px] flex items-center justify-center ${i === 0 ? 'bg-fuchsia-800/60' : 'bg-sky-800/60'}`}>{initial}</div>))}</div>
          <span>{applied} applied so far</span>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <NeonButton title={`Apply for: ${task?.title}`} className="w-full text-xs" onClick={() => onApply?.(task)}>Apply Now <ArrowRight aria-hidden="true" className="h-4 w-4" /></NeonButton>
          <button title={`View details for: ${task?.title}`} onClick={() => onView?.(task)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95">View Details</button>
        </div>
      </motion.div>
    </motion.div>
  );
});

// --- SECTIONS (Typed) ---
interface SectionHeaderProps { id: string; eyebrow?: string; title: string; subtitle?: string; }
const SectionHeader: FC<SectionHeaderProps> = React.memo(({ id, eyebrow, title, subtitle }) => {
  const ref = useRef<HTMLHeadingElement>(null); const isInView = useInView(ref, { once: true, amount: 0.8 }); const prefersReducedMotion = useReducedMotion();
  const animationProps = (delay = 0) => prefersReducedMotion ? {} : { initial: { opacity: 0, y: 10 }, animate: isInView ? { opacity: 1, y: 0 } : {}, transition: { duration: 0.4, delay } };
  return (
    <header ref={ref} className="mx-auto mb-12 max-w-3xl text-center">
      {eyebrow && <motion.div {...animationProps()} className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"><Sparkles aria-hidden="true" className="h-4 w-4" /> {eyebrow}</motion.div>}
      <motion.h2 id={id} {...animationProps(0.1)} className="text-3xl md:text-4xl font-bold"><GradientText>{title}</GradientText></motion.h2>
      {subtitle && <motion.p {...animationProps(0.2)} className="mt-4 text-white/70">{subtitle}</motion.p>}
    </header>
  );
});

const HeroSection: FC<{ navigate: NavigateFunction }> = React.memo(({ navigate }) => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <section aria-label="Hero Section" className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      {/* Hero content remains identical */}
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <motion.h1 initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            <span className="block text-white">The OS for</span><GradientText>High-Trust Freelance</GradientText>
          </motion.h1>
          <motion.p initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="mt-6 text-lg text-white/70 max-w-xl">
            Your secure freelance marketplace—where trust, speed, and craftsmanship meet. Discover top executors, automate contracts, and deliver outcomes with confidence.
          </motion.p>
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-8 flex flex-wrap items-center gap-4">
            <NeonButton onClick={() => navigate("/choose-category")} title="Post a new task">Post a Task <Zap aria-hidden="true" className="h-4 w-4" /></NeonButton>
            <button onClick={() => navigate("/tasks")} title="Explore all available tasks" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white/80 backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95">
              Explore Marketplace <ChevronRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
        <div className="relative lg:ml-auto"><Suspense fallback={<Shimmer className="h-96 w-full" />}><SwipeCarousel /></Suspense></div>
      </div>
      <div className="relative overflow-hidden py-6 mt-16">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10" />
        <div className="flex w-max animate-marquee gap-10 opacity-80">
          {["Technology", "Education", "Events", "Healthcare", "Architecture", "Home & Safety", "Technology", "Education", "Events", "Healthcare", "Architecture", "Home & Safety"].map((name, i) => (
            <div key={i} className="flex min-w-[10rem] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 backdrop-blur-md whitespace-nowrap"><BadgeCheck aria-hidden="true" className="mr-2 h-4 w-4 flex-shrink-0" /> {name}</div>
          ))}
        </div>
        <style>{`@keyframes marquee{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(-50%,0,0)}}.animate-marquee{animation:marquee 30s linear infinite}.animate-shimmer{animation:shimmer 2s infinite}@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      </div>
    </section>
  );
});

const BackToTopButton: FC = React.memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { const toggleVisibility = () => setIsVisible(window.scrollY > 300); window.addEventListener("scroll", toggleVisibility); return () => window.removeEventListener("scroll", toggleVisibility); }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={scrollToTop} title="Back to Top" aria-label="Scroll back to top" className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-xl transition-colors hover:bg-white/10">
          <ArrowUp aria-hidden="true" className="h-6 w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
});

const SiteFooter: FC = React.memo(() => (
  <footer className="mx-auto max-w-screen-2xl px-6 py-8 text-center text-sm text-white/50">
    <div className="flex justify-center gap-6 mb-4">
      <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
      <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
      <a href="/contact" className="hover:text-white transition-colors">Contact</a>
    </div>
    <p>&copy; {new Date().getFullYear()} Cyphire Technologies Inc. All rights reserved.</p>
  </footer>
));

const FAQSection: FC<{ items: FAQItem[] }> = React.memo(({ items }) => {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section aria-labelledby="faq-title" className="mx-auto max-w-4xl px-6 py-16">
      <SectionHeader id="faq-title" eyebrow="Questions" title="Everything you need to know" subtitle="If you have anything else on your mind, our support team is a heartbeat away." />
      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <GlassCard key={item.question} className="overflow-hidden">
              <button onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-white/90 hover:bg-white/5 transition-colors">
                <span className="text-sm font-medium sm:text-base">{item.question}</span>
                <ChevronDown aria-hidden="true" className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div id={`faq-answer-${index}`} role="region" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                    <p className="px-6 pb-5 text-sm text-white/70 leading-relaxed">{item.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
});


// --- MAIN HOME COMPONENT ---
export default function Home() {
  const navigate = useNavigate();
  // TypeScript: Type state with our `Task` interface
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // SEO and Meta Tags
  useEffect(() => {
    document.title = "Cyphire | The OS for High-Trust Freelance";
    const setMeta = (name: string, content: string) => {
      let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };
    const description = "Your secure freelance marketplace—where trust, speed, and craftsmanship meet. Discover top talent, automate contracts, and deliver outcomes with confidence.";
    setMeta('description', description);
    setMeta('og:title', document.title);
    setMeta('og:description', description);
  }, []);

  // Initial loader effect
  useEffect(() => { const timer = setTimeout(() => setIsInitialLoading(false), 800); return () => clearTimeout(timer); }, []);

  // Auth and Task fetching logic remains identical
  useEffect(() => { const controller = new AbortController(); (async () => { try { const response = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include", signal: controller.signal }); if (response.status === 401 || response.status === 403) navigate("/signup", { replace: true }); } catch (error) { if (error.name !== "AbortError") console.error("Auth check failed:", error); } })(); return () => controller.abort(); }, [navigate]);
  useEffect(() => { const controller = new AbortController(); setLoadingTasks(true); setTaskError(""); (async () => { try { const response = await fetch(`${API_BASE}/api/tasks`, { credentials: "include", cache: "no-store", signal: controller.signal }); if (!response.ok) throw new Error("Failed to fetch tasks"); const data = await response.json(); setTasks(Array.isArray(data) ? data : []); } catch (error) { if (error.name !== "AbortError") { console.error("Error fetching tasks:", error); setTaskError("We couldn't load live briefs. Try again soon."); } } finally { if (!controller.signal.aborted) setLoadingTasks(false); } })(); return () => controller.abort(); }, [reloadToken]);

  const liveTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100 antialiased">
      <AnimatePresence>{isInitialLoading && (<motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0f]"><Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" /></motion.div>)}</AnimatePresence>
      <header className="sticky top-0 z-50"><Suspense fallback={<div className="h-16 bg-white/5 backdrop-blur-xl" />}><Navbar /></Suspense></header>
      <main role="main">
        {/* All JSX content from here on is identical */}
        <Aurora /><Particles />
        <HeroSection navigate={navigate} />

        <section aria-labelledby="features-title" className="mx-auto max-w-screen-2xl px-6 py-16">
          <SectionHeader id="features-title" eyebrow="Why Cyphire" title="A marketplace engineered for outcomes" subtitle="Purpose-built primitives that reduce risk and increase throughput for both sides." />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{FEATURES.map((feature, index) => { const Icon = feature.icon; return (<motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: index * 0.1 }}><GlassCard className="flex flex-col gap-5 p-6 h-full hover:border-white/20 transition-colors"><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 w-fit"><Icon aria-hidden="true" className="h-4 w-4" /><span>{feature.badge}</span></div><div><h3 className="text-lg font-semibold text-white">{feature.title}</h3><p className="mt-2 text-sm text-white/70 leading-relaxed">{feature.desc}</p></div><button className="mt-auto inline-flex items-center gap-2 text-sm text-fuchsia-300/90 transition-colors hover:text-fuchsia-200 group">Learn more <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button></GlassCard></motion.div>); })}</div>
        </section>

        <section aria-labelledby="live-briefs-title" className="mx-auto max-w-screen-2xl px-6 py-16">
          <SectionHeader id="live-briefs-title" eyebrow="Live briefs" title="Recently Posted " subtitle="Apply fast these openings won’t last long." />
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2"><input type="search" placeholder="Search tasks by keyword (e.g., 'React developer')" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 backdrop-blur-xl focus:border-fuchsia-400/50 focus:ring-fuchsia-400/50 transition-colors" /></div>
            <div className="grid grid-cols-2 gap-4 md:col-span-1 md:grid-cols-2">
              <select className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 backdrop-blur-xl focus:border-fuchsia-400/50 focus:ring-fuchsia-400/50 transition-colors"><option>Category</option></select>
              <select className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 backdrop-blur-xl focus:border-fuchsia-400/50 focus:ring-fuchsia-400/50 transition-colors"><option>Budget</option></select>
            </div>
          </div>
          {taskError && (<GlassCard role="alert" aria-live="polite" className="mb-6 flex items-center justify-between px-5 py-4 text-sm text-white/70"><span>{taskError}</span><button onClick={() => setReloadToken(t => t + 1)} className="rounded-lg border border-white/10 px-3 py-1 text-xs uppercase tracking-wider text-white/70 hover:bg-white/10 transition-colors">Retry</button></GlassCard>)}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {loadingTasks
              ? [0, 1, 2].map((i) => <Shimmer key={i} className="h-[420px]" />)
              : liveTasks.length > 0
                ? liveTasks.map((task) => (
                  // Using the exact Tasks page tile so the image shows above details
                  // @ts-ignore - if your project is strict TS and Tasks.jsx is JS
                  <TasksTile key={task._id} task={task} />
                ))
                : (
                  <GlassCard className="col-span-full flex flex-col items-center justify-center gap-3 px-6 py-20 text-white/70">
                    <BadgeCheck aria-hidden="true" className="h-8 w-8 text-fuchsia-300" />
                    <p>No live briefs yet—check back in a moment.</p>
                  </GlassCard>
                )
            }
          </div>

          <div className="mt-12 flex items-center justify-center"><button onClick={() => navigate("/tasks")} className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-white/80 backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95">View all tasks <ChevronRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></div>
        </section>

        <section aria-labelledby="security-title" className="mx-auto max-w-screen-2xl px-6 py-16">
          <SectionHeader id="security-title" eyebrow="Security & compliance" title="Enterprise-grade controls without the drag" subtitle="Cyphire builds governance into every workflow so your legal and finance teams can sleep at night." />
          <div className="text-center mb-10"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300"><ShieldCheck aria-hidden="true" className="h-5 w-5" /> SOC-2 Compliant Infrastructure</span></div>
          <div className="grid gap-6 md:grid-cols-3">{SECURITY_PILLARS.map((p, i) => { const Icon = p.icon; return (<motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.1 }}><GlassCard className="flex flex-col gap-4 p-6 h-full hover:border-emerald-400/20 transition-colors"><div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"><Icon aria-hidden="true" className="h-6 w-6" /></div><h3 className="text-lg font-semibold text-white">{p.title}</h3><p className="text-sm text-white/70 leading-relaxed">{p.desc}</p></GlassCard></motion.div>); })}</div>
        </section>

        <section aria-labelledby="testimonials-title" className="mx-auto max-w-screen-2xl px-6 py-16">
          <SectionHeader id="testimonials-title" eyebrow="Signal over noise" title="Teams that switched to Cyphire" subtitle="Our customers ship faster because escrow, talent, and operations finally live in one environment." />
          <div className="grid gap-6 md:grid-cols-3">{TESTIMONIALS.map((item, i) => (<motion.div key={item.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.1 }}><GlassCard className="flex h-full flex-col gap-5 p-6 hover:border-white/20 transition-colors"><div className="flex items-center gap-1 text-fuchsia-300">{[...Array(5)].map((_, i) => (<Star key={i} aria-hidden="true" className="h-4 w-4 fill-current" />))}</div><p className="text-white/80 leading-relaxed">"{item.quote}"</p><div className="mt-auto text-sm text-white/60"><div className="font-medium text-white">{item.name}</div><div className="mt-0.5">{item.role}</div></div></GlassCard></motion.div>))}</div>
        </section>

        <FAQSection items={FAQ_ITEMS} />

        <section aria-label="Final Call to Action" className="relative mx-auto max-w-6xl px-6 pb-20 pt-8">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-3xl" />
          <GlassCard className="overflow-hidden rounded-3xl border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl md:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <h3 className="text-3xl font-bold text-white md:text-4xl"><GradientText>Ready to launch your next mission?</GradientText></h3>
                <p className="text-lg text-white/70 leading-relaxed">Choose the runway that fits your team. Upgrade anytime—your escrow, workflows, and insights come with you.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 lg:flex-col"><NeonButton onClick={() => navigate("/signup")} className="whitespace-nowrap">Get Started Free <ArrowRight aria-hidden="true" className="h-4 w-4" /></NeonButton><button onClick={() => navigate("/contact")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur-xl transition-all hover:bg-white/10 active:scale-95">Talk to Sales <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></button></div>
            </div>
          </GlassCard>
        </section>
        <Footer />
        <SiteFooter />
      </main>
      <BackToTopButton />
    </div>
  );
}