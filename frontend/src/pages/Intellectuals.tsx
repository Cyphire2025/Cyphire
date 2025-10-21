// src/pages/ChooseIntellectuals.jsx
/* eslint-disable no-unused-vars */
import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Briefcase, // for industry expert
  Camera,    // for influencer/creator
  Lightbulb, // for mentor/coach
  ChevronRight,
} from "lucide-react";

import { pageFadeSlide, springSoft } from "../config/motionTokens";
import useMicroFeedback from "../hooks/useMicroFeedback";
import FullscreenLoader from "../components/FullscreenLoader";

const ActionTile = lazy(() => import("../components/ActionTile"));
const MotionLogo = lazy(() => import("../components/MotionLogo"));

/** Helpers */
const partOfDay = (d = new Date()) => {
  const h = d.getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};
const greetingLabel = (pod) =>
  pod === "morning" ? "Good morning" : pod === "afternoon" ? "Good afternoon" : "Good evening";

export default function ChooseIntellectuals() {
  const navigate = useNavigate();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hoverNone, setHoverNone] = useState(false);
  const [smallBlurPx, setSmallBlurPx] = useState(24);
  const [showLoader, setShowLoader] = useState(false);
  const [exitingTo, setExitingTo] = useState(null);

  const clickFeedback = useMicroFeedback();
  const containerRef = useRef(null);

  // Respect user motion/hover preferences
  useEffect(() => {
    const rm = window?.matchMedia?.("(prefers-reduced-motion: reduce)");
    const hn = window?.matchMedia?.("(hover: none)");
    const sm = window?.matchMedia?.("(max-width: 420px)");
    const setAll = () => {
      setReduceMotion(!!rm?.matches);
      setHoverNone(!!hn?.matches);
      setSmallBlurPx(sm?.matches ? 14 : 24);
    };
    setAll();
    rm?.addEventListener?.("change", setAll);
    hn?.addEventListener?.("change", setAll);
    sm?.addEventListener?.("change", setAll);
    rm?.addListener?.(setAll);
    hn?.addListener?.(setAll);
    sm?.addListener?.(setAll);
    return () => {
      rm?.removeEventListener?.("change", setAll);
      hn?.removeEventListener?.("change", setAll);
      sm?.removeEventListener?.("change", setAll);
      rm?.removeListener?.(setAll);
      hn?.removeListener?.(setAll);
      sm?.removeListener?.(setAll);
    };
  }, []);

  // Keyboard shortcuts: 1..4 to jump to flows
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t?.closest?.('[contenteditable="true"]') || ["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName)) return;
      const k = e.key?.toLowerCase?.();
      if (k === "1") startExit("/apply-professor");
      if (k === "2") startExit("/apply-expert");
      if (k === "3") startExit("/apply-influencer");
      if (k === "4") startExit("/apply-mentor");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Greeting
  const [greet, setGreet] = useState(() => greetingLabel(partOfDay()));
  useEffect(() => {
    const id = setInterval(() => setGreet(greetingLabel(partOfDay())), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Route prefetch (stubs; wire real modules later)
  const prefetchProfessor = () => { try { /* import("../intellectuals/ApplyProfessor.jsx") */ } catch { } };
  const prefetchExpert = () => { try { /* import("../intellectuals/ApplyExpert.jsx") */ } catch { } };
  const prefetchInfluencer = () => { try { /* import("../intellectuals/ApplyInfluencer.jsx") */ } catch { } };
  const prefetchMentor = () => { try { /* import("../intellectuals/ApplyMentor.jsx") */ } catch { } };

  // Exit animation then navigate
  const startExit = (path) => {
    clickFeedback();
    setShowLoader(true);
    setExitingTo(path);
  };
  const handleAnimationComplete = () => {
    if (exitingTo) navigate(exitingTo);
  };

  return (
    <AnimatePresence mode="wait">
      <FullscreenLoader visible={showLoader} label="Opening your listing flow…" />
      <motion.main
        key="choose-intellectuals"
        className="relative min-h-screen overflow-hidden bg-[#0A0A10] text-white"
        variants={pageFadeSlide}
        initial="initial"
        animate={exitingTo ? "exit" : "animate"}
        onAnimationComplete={handleAnimationComplete}
        ref={containerRef}
      >
        {/* Page ambience — emerald/teal identity */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14),transparent_60%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[28vh] bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.12),transparent_60%)]" />
        </div>

        {/* Header: logo + modes left, greeting right */}
        <div className="relative z-20 flex w-full items-center justify-between px-8 pt-8">
          {/* left: logo + all modes */}
          <div className="flex items-center gap-4 relative">
            <React.Suspense fallback={<div className="h-8 w-32 rounded bg-white/10" />}>
              <MotionLogo onClick={() => navigate("/")} />
            </React.Suspense>

            {/* All modes button beside logo */}
            <div className="relative">
              <button
                type="button"
                onClick={() => navigate("/choose")}
                className="relative z-10 rounded-xl border border-emerald-400/30 bg-emerald-500/10 
                   px-3 py-1.5 text-xs sm:text-sm font-medium text-white/85
                   hover:bg-emerald-500/20 hover:text-white transition-all duration-300
                   backdrop-blur-md ring-1 ring-emerald-400/10
                   hover:shadow-[0_0_15px_rgba(16,185,129,0.45)]"
                aria-label="Back to all modes"
              >
                All modes
              </button>

              {/* soft greenish aura behind the button */}
              <div
                className="absolute -inset-2 -z-0 rounded-2xl blur-[8px]"
                style={{
                  background:
                    "radial-gradient(45% 75% at 50% 50%, rgba(16,185,129,0.35), rgba(6,182,212,0.2), transparent)",
                }}
                aria-hidden="true"
              />
            </div>
          </div>



          <div className="relative">
            <div
              className={[
                "relative z-10 inline-flex items-center gap-3 rounded-2xl",
                "border border-emerald-400/25 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
                "px-3.5 py-2 backdrop-blur-xl ring-1 ring-emerald-400/10",
              ].join(" ")}
              aria-live="polite"
            >
              <div className="relative grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-white/10 overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-br from-emerald-400/40 via-teal-500/40 to-transparent opacity-80 blur-[6px]" />
                <span className="relative h-3 w-3 rounded-full bg-white/85 shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
              </div>
              <div className="hidden sm:block text-sm font-medium text-white/90 tracking-wide">
                {greet}, creator 👋
              </div>
            </div>
            <div
              className="absolute -inset-2 -z-0 rounded-3xl blur-[6px]"
              style={{
                background:
                  "radial-gradient(45% 75% at 80% 50%, rgba(16,185,129,0.35), rgba(6,182,212,0.18), transparent)",
              }}
            />
          </div>
        </div>

        {/* Hero */}
        <section className="relative z-20 mx-auto max-w-6xl px-6 pt-10 overflow-hidden">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[clamp(2rem,5vw,2.9rem)] font-bold"
          >
            Choose your{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              field of influence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-3 max-w-2xl text-white/70"
          >
            Select the path that fits you best. Your apply flow adapts to your role.
          </motion.p>

          {/* Tiles */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {/* Professor / Researcher */}
            <Suspense fallback={<SkeletonTile />}>
              <ActionTile
                icon={GraduationCap}
                title="Professor / Researcher"
                desc="For faculty and academics. Share lectures, workshops, and research guidance."
                bullets={[
                  "Academic email verification",
                  "Scholar/ORCID linking",
                  "Session-ready workflow",
                ]}
                onPress={() => startExit("/apply-professor")}
                onHoverPrefetch={prefetchProfessor}
                gradient="from-emerald-600/25 via-teal-600/10 to-cyan-500/20"
                reduceMotion={reduceMotion}
                smallBlurPx={smallBlurPx}
                hoverNone={hoverNone}
                describedById="prof-desc"
              />
            </Suspense>

            {/* Industry Expert */}
            <Suspense fallback={<SkeletonTile />}>
              <ActionTile
                icon={Briefcase}
                title="Industry Expert"
                desc="For professionals with hands-on experience. Mentor or run practical sessions."
                bullets={[
                  "LinkedIn/company checks",
                  "Online or on-site formats",
                  "Escrow-first booking",
                ]}
                onPress={() => startExit("/apply-expert")}
                onHoverPrefetch={prefetchExpert}
                gradient="from-teal-600/25 via-cyan-600/10 to-sky-500/20"
                reduceMotion={reduceMotion}
                smallBlurPx={smallBlurPx}
                hoverNone={hoverNone}
                describedById="expert-desc"
                indexForAsymmetry={0}
              />
            </Suspense>

            {/* Influencer / Creator */}
            <Suspense fallback={<SkeletonTile />}>
              <ActionTile
                icon={Camera}
                title="Influencer / Creator"
                desc="Educators and creators with an audience. Collaborate or host learning sessions."
                bullets={[
                  "Handle ownership proof",
                  "Audience & niche mapping",
                  "Clear deliverables",
                ]}
                onPress={() => startExit("/apply-influencer")}
                onHoverPrefetch={prefetchInfluencer}
                gradient="from-cyan-600/25 via-sky-600/10 to-emerald-500/20"
                reduceMotion={reduceMotion}
                smallBlurPx={smallBlurPx}
                hoverNone={hoverNone}
                describedById="influencer-desc"
              />
            </Suspense>

            {/* Mentor / Coach */}
            <Suspense fallback={<SkeletonTile />}>
              <ActionTile
                icon={Lightbulb}
                title="Mentor / Coach"
                desc="Guide students, teams, or founders with structured 1:1 or group sessions."
                bullets={[
                  "Flexible slotting",
                  "Badge-based trust",
                  "Simple payouts",
                ]}
                onPress={() => startExit("/apply-mentor")}
                onHoverPrefetch={prefetchMentor}
                gradient="from-emerald-600/20 via-cyan-600/10 to-teal-500/20"
                reduceMotion={reduceMotion}
                smallBlurPx={smallBlurPx}
                hoverNone={hoverNone}
                describedById="mentor-desc"
                indexForAsymmetry={0}
              />
            </Suspense>
          </div>

          {/* Subtle footnote */}
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-white/50">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400/70" />
            Escrow by default • Verification badges available • One flow, no reloads
          </div>
        </section>

<div className="flex justify-center mt-10">
  <button
    onClick={() => navigate("/intellectuals-all")}
    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold text-lg shadow-md hover:scale-105 transition"
  >
    View All Intellectuals (Temporary)
  </button>
</div>

        {/* Bottom ambience */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[18rem] bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.12),transparent_60%)]" />
      </motion.main>
    </AnimatePresence>
  );
}

/** Skeleton while lazy tiles load */
function SkeletonTile() {
  return (
    <div className="h-[220px] rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="h-5 w-28 rounded bg-white/10" />
      <div className="mt-4 h-4 w-48 rounded bg-white/10" />
      <div className="mt-2 h-4 w-40 rounded bg-white/10" />
      <div className="mt-6 h-4 w-24 rounded bg-white/10" />
    </div>
  );
}
