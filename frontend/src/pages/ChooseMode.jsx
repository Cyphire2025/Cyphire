// src/pages/ChooseMode.jsx
import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Megaphone, GraduationCap, ArrowRight, ArrowLeft, LogIn, HelpCircle, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import brandQuotes from "../config/brandQuotes";
import { springSoft, pageFadeSlide } from "../config/motionTokens";
import useMicroFeedback from "../hooks/useMicroFeedback";
import FullscreenLoader from "../components/FullscreenLoader";


// Lazy-load components for smaller initial bundle
const ActionTile = lazy(() => import("../components/ActionTile"));
const MotionLogo = lazy(() => import("../components/MotionLogo"));

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
// --- time-based greeting helpers ---
function partOfDay(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "evening";
}
function greetingLabel(pod) {
  switch (pod) {
    case "morning": return "Good morning";
    case "afternoon": return "Good afternoon";
    case "evening": return "Good evening";
    default: return "Good Evening";
  }
}
function firstNameOnly(str = "") {
  return String(str).trim().split(" ")[0] || str;
}


export default function ChooseMode() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [smallBlurPx, setSmallBlurPx] = useState(24);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hoverNone, setHoverNone] = useState(false);
  const [exitingTo, setExitingTo] = useState(null); // for route exit animation
  const clickFeedback = useMicroFeedback();
  const [showLoader, setShowLoader] = useState(false);


  // ===== Prefers reduced motion =====
  useEffect(() => {
    const mq = window?.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const apply = () => setReduceMotion(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    mq.addListener?.(apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      mq.removeListener?.(apply);
    };
  }, []);

  // ===== Hover availability (touch) =====
  useEffect(() => {
    const mq = window?.matchMedia?.("(hover: none)");
    if (!mq) return;
    const set = () => setHoverNone(!!mq.matches);
    set();
    mq.addEventListener?.("change", set);
    mq.addListener?.(set);
    return () => {
      mq.removeEventListener?.("change", set);
      mq.removeListener?.(set);
    };
  }, []);

  // ===== Blur scaling for tiny devices (perf) =====
  useEffect(() => {
    const mq = window?.matchMedia?.("(max-width: 420px)");
    if (!mq) return;
    const set = () => setSmallBlurPx(mq.matches ? 14 : 24);
    set();
    mq.addEventListener?.("change", set);
    mq.addListener?.(set);
    return () => {
      mq.removeEventListener?.("change", set);
      mq.removeListener?.(set);
    };
  }, []);

  // ===== Auth (read-only) =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include", cache: "no-store" });
        const json = res.ok ? await res.json() : {};
        if (!alive) return;
        setMe(json?.user || null);
      } catch {
        // not signed in is okay here
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ===== Hidden keyboard shortcuts (no UI mention) =====
  useEffect(() => {
    const onKey = (e) => {
      if (e?.metaKey || e?.ctrlKey || e?.altKey) return;
      const t = e?.target;
      if (t?.closest?.('[contenteditable="true"]') || ["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName)) return;
      const k = e?.key?.toLowerCase?.();
      if (k === "1") startExit("/home");
      if (k === "2") startExit("/sponsorshiphome");
      if (k === "3") startExit("/intellectuals");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ===== Quotes rotation (brand voice) =====
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setQIndex((i) => (i + 1) % brandQuotes.length), 3000);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const [greetState, setGreetState] = useState(() => {
    const pod = partOfDay();
    return { pod, label: greetingLabel(pod) };
  });
  useEffect(() => {
    const update = () => {
      const pod = partOfDay();
      setGreetState({ pod, label: greetingLabel(pod) });
    };
    update();
    const id = setInterval(update, 60 * 1000); // refresh each minute
    return () => clearInterval(id);
  }, []);


  // ===== Optional route prefetch (replace with real module paths) =====
  const prefetchHome = () => { try { /* import("../home/Home.jsx") */ } catch { } };
  const prefetchSponsor = () => { try { /* import("../sponsorship/SponsorshipHome.jsx") */ } catch { } };
  const prefetchIntellectuals = () => { try { /* import("../intellectuals/Intellectuals.jsx") */ } catch { } };

  // ===== Idle prefetch for faster perceived nav + assets prefetch =====
  useEffect(() => {
    const idle = (cb) => ("requestIdleCallback" in window ? window.requestIdleCallback(cb) : setTimeout(cb, 300));
    idle(() => {
      prefetchHome?.();
      prefetchSponsor?.();

      // low-priority asset prefetch (gradients/icons are mostly inline, but pattern stays)
      try {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.as = "image";
        link.href = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4="; // tiny placeholder
        document.head.appendChild(link);
      } catch { }
    });
  }, []);

  // ===== Page exit animation before navigate =====
  const containerRef = useRef(null);
  const startExit = (path) => {
    clickFeedback();            // your micro haptic/sound
    setShowLoader(true);        // show loader immediately
    setExitingTo(path);         // keep your existing exit flow
  };

  const handleAnimationComplete = () => {
    if (exitingTo) navigate(exitingTo);
  };

  // ===== Tooltip toggle (for "Choose your mode") =====
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <AnimatePresence >
      <FullscreenLoader visible={showLoader} label="Preparing your workspace…" />
      <motion.main
        key="choose-mode"
        className="relative min-h-screen overflow-hidden bg-[#0A0A10] text-white"
        variants={pageFadeSlide}
        initial="initial"
        animate={exitingTo ? "exit" : "animate"}
        onAnimationComplete={handleAnimationComplete}
        ref={containerRef}
      >
        {/* Enterprise background (no grid/stars). Soft radial tints. */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.12),transparent_60%)]" />
        </div>

        {/* Top header bar — brand left, greeting right (no Back button) */}
        <div className="relative z-20 flex w-full items-start justify-between px-8 pt-8">
          {/* Cyphire brand (bigger, gradient, clickable) */}
          <React.Suspense fallback={<div className="h-8 w-32 rounded bg-white/10" />}>
            <MotionLogo onClick={() => navigate("/")} />
          </React.Suspense>

          {/* Greeting capsule (refined, same position & size) */}
          <div className="relative">
            <div
              className={[
                "relative z-10 flex items-center gap-3 rounded-2xl",
                // improved border & glow
                "border border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/25 via-purple-600/20 to-sky-500/25",
                // softer glass effect + subtle inner light
                "px-3.5 py-2 backdrop-blur-xl shadow-[0_8px_28px_-12px_rgba(0,0,0,0.65)] ring-1 ring-fuchsia-400/10",
                "transition-all duration-300 hover:shadow-[0_12px_35px_-15px_rgba(168,85,247,0.4)] hover:ring-fuchsia-400/20",
              ].join(" ")}
            >
              {/* glowing orb icon */}
              <div className="relative grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-white/10 overflow-hidden">
                {/* subtle inner pulse light */}
                <span className="absolute inset-0 bg-gradient-to-br from-fuchsia-400/40 via-purple-500/40 to-transparent opacity-80 blur-[6px]" />
                <span className="relative h-3 w-3 rounded-full bg-white/85 shadow-[0_0_6px_rgba(255,255,255,0.6)]" aria-hidden="true" />
              </div>

              {/* greeting text */}
              <div className="hidden sm:block text-sm font-medium text-white/90 tracking-wide">
                {`${greetState.label}, ${firstNameOnly(me?.name || me?.username || "there")}`}{" "}
                <span aria-hidden>👋</span>
              </div>

            </div>

            {/* refined purple aura behind pill */}
            <div
              className="absolute -inset-2 -z-0 rounded-3xl blur-[6px]"
              style={{
                background:
                  "radial-gradient(45% 75% at 80% 50%, rgba(168,85,247,0.35), rgba(110,40,200,0.15), transparent)",
              }}
              aria-hidden="true"
            />
          </div>

        </div>


        {/* Hero + rest of page content scaled to ~110% (header unchanged) */}
        <div className="origin-top scale-[1]">
          {/* Hero */}
          <section className="relative z-20 mx-auto max-w-6xl px-6 pt-10 overflow-hidden">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[clamp(2rem,5vw,2.9rem)] font-bold"
            >
              Choose your{" "}
              <span className="bg-gradient-to-r from-fuchsia-300 via-purple-200 to-sky-300 bg-clip-text text-transparent">
                mode
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-3 max-w-2xl text-white/70"
            >
              Three focused paths. No clutter. Decide and dive in.
            </motion.p>

            {/* Soft tagline below hero */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-2 text-white/60"
            >
              <span className="text-sm">Empowering creators with certainty.</span>
            </motion.div>

            {/* Tiles */}
            {/* <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3"> */} 
            <div className="mt-10 grid grid-cols-1 gap-1 md:grid-cols-2 justify-center place-items-center">
              <Suspense fallback={<SkeletonTile />}>
                <ActionTile
                  icon={Briefcase}
                  title="Freelance Marketplace"
                  desc="Explore briefs, apply fast, and work with confidence."
                  bullets={[
                    "Live tasks with escrow",
                    "One-click proposals",
                    "Verified clients",
                  ]}
                  onPress={() => startExit("/home")}
                  onHoverPrefetch={prefetchHome}
                  gradient="from-fuchsia-600/25 via-purple-600/10 to-sky-500/20"
                  reduceMotion={reduceMotion}
                  smallBlurPx={smallBlurPx}
                  hoverNone={hoverNone}
                  describedById="tile-1-desc"
                />
              </Suspense>

              <Suspense fallback={<SkeletonTile />}>
                <ActionTile
                  icon={Megaphone}
                  title="Sponsorship Marketplace"
                  desc="Find brand partners or list your events effortlessly."
                  bullets={[
                    "Qualified brand leads",
                    "Fast outreach tools",
                    "Clear deliverables",
                  ]}
                  onPress={() => startExit("/sponsorshiphome")}
                  onHoverPrefetch={prefetchSponsor}
                  gradient="from-fuchsia-600/25 via-purple-600/10 to-sky-500/20" //pinkish
                  // gradient="from-rose-600/25 via-pink-600/10 to-orange-500/20" orangish 
                  reduceMotion={reduceMotion}
                  smallBlurPx={smallBlurPx}
                  hoverNone={hoverNone}
                  describedById="tile-2-desc"
                />
              </Suspense>

              {/* NEW — Intellectual Mind */}
              {/* <Suspense fallback={<SkeletonTile />}>
                <ActionTile
                  icon={GraduationCap}
                  title="Intellectual Mind"
                  desc="Invite professors, experts, or creators for talks, workshops, and mentoring."
                  bullets={[
                    "Verified profiles & badges",
                    "Escrow-protected sessions",
                    "Smart scheduling"
                  ]}
                  onPress={() => startExit("/intellectuals")}  // TODO: change to /intellectuals when page is ready
      onHoverPrefetch={prefetchIntellectuals}
      gradient="from-emerald-600/25 via-teal-600/10 to-cyan-500/20"
      reduceMotion={reduceMotion}
      smallBlurPx={smallBlurPx}
      hoverNone={hoverNone}
      describedById="tile-3-desc"
      indexForAsymmetry={2}
    />
  </Suspense>
*/}
            </div>
          </section>

          {/* Inspirational brand quote section */}
          <section className="relative z-20 mx-auto mt-12 max-w-6xl px-6 pb-24">
            <div className="border-t border-white/10 pt-10">
              <div
                className="relative mx-auto max-w-3xl text-center"
                style={{ contentVisibility: "auto", containIntrinsicSize: "250px" }}
              >
                <div aria-live="polite">
                  <AnimatePresence>
                    <motion.blockquote
                      key={qIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.45 }}
                      className="text-balance text-2xl font-semibold leading-relaxed text-white/90 md:text-3xl"
                    >
                      “{brandQuotes[qIndex]}”
                    </motion.blockquote>
                  </AnimatePresence>
                </div>
                <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="mt-3 text-sm text-white/50">Designed with care • Cyphire</div>
              </div>
            </div>
          </section>
        </div>


        {/* Bottom ambient */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[18rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
      </motion.main>
    </AnimatePresence>
  );
}

/** Skeleton while lazy tiles load */
function SkeletonTile() {
  return (
    <div className="h-[220px] rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="h-5 w-24 rounded bg-white/10" />
      <div className="mt-4 h-4 w-48 rounded bg-white/10" />
      <div className="mt-2 h-4 w-40 rounded bg-white/10" />
      <div className="mt-6 h-4 w-24 rounded bg-white/10" />
    </div>
  );
}
