// src/components/HeroArt.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";

// 👉 Replace these with your actual images
import Test from "../assets/test.jpg";
import Test2 from "../assets/test2.jpg";
import Test3 from "../assets/test3.jpg";

// Base images
const imgs = [Test, Test2, Test3];

// We create a triple array so we can start in the middle and slide infinitely in one direction.
// This avoids visible jumps when we silently reset the position.
const loopImgs = [...imgs, ...imgs, ...imgs];
const BASE = imgs.length; // middle start offset

const AUTO_SECONDS = 5;          // time between auto-advances
const SLIDE_DURATION = 2;        // slide animation duration (your value)
const EASE = [0.22, 1, 0.36, 1]; // easing curve
const DRAG_BUFFER = 60;          // px required to trigger prev/next on drag

export const SwipeCarousel = () => {
  // Start at the middle copy so we can move forward forever
  const [index, setIndex] = useState(BASE);

  const controls = useAnimation();
  const x = useMotionValue(0);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const slideRef = useRef(null);
  const intervalRef = useRef(null);

  // We measure one slide width and the gap for precise snapping
  const metricsRef = useRef({ slide: 0, gap: 0, step: 0 });

  const computeMetrics = () => {
    if (!trackRef.current || !slideRef.current) return;
    const slideWidth = slideRef.current.clientWidth; // width of each slide
    const gap = parseFloat(getComputedStyle(trackRef.current).gap || "0");
    metricsRef.current = { slide: slideWidth, gap, step: slideWidth + gap };
    // Keep the current index aligned when sizes change
    controls.set({ x: -(metricsRef.current.step * index) });
    x.set(-(metricsRef.current.step * index));
  };

  useEffect(() => {
    computeMetrics();
    const ro = new ResizeObserver(computeMetrics);
    if (trackRef.current) ro.observe(trackRef.current);
    if (containerRef.current) ro.observe(containerRef.current);
    if (slideRef.current) ro.observe(slideRef.current);

    // Ensure we start at the middle copy
    controls.set({ x: 0 }); // will be immediately re-set by computeMetrics to -step*index

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Go to a specific visual index within loopImgs, then silently recenter if we drift too far
  const goTo = async (nextIdx) => {
    const { step } = metricsRef.current;
    const targetX = -(step * nextIdx);

    // Animate to the target
    await controls.start({
      x: targetX,
      transition: { duration: SLIDE_DURATION, ease: EASE },
    });
    x.set(targetX);

    // If we've moved beyond the middle band, snap back invisibly to the equivalent position.
    // Middle band is [BASE, BASE + imgs.length - 1].
    if (nextIdx >= BASE + imgs.length) {
      const recentered = nextIdx - imgs.length; // wrap forward by one set
      controls.set({ x: -(step * recentered) });
      x.set(-(step * recentered));
      setIndex(recentered);
    } else if (nextIdx < BASE) {
      const recentered = nextIdx + imgs.length; // wrap backward by one set (for prev/drag)
      controls.set({ x: -(step * recentered) });
      x.set(-(step * recentered));
      setIndex(recentered);
    }
  };

  // Auto-play forward only (one direction flow)
  const startAuto = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;       // always forward
        goTo(next);
        return next;
      });
    }, AUTO_SECONDS * 1000);
  };

  useEffect(() => {
    startAuto();
    return () => clearInterval(intervalRef.current);
  }, []);

  // Decide where to snap after user drag
  const onDragEnd = async () => {
    const { step } = metricsRef.current;
    const currentTarget = -(step * index);
    const delta = x.get() - currentTarget;

    if (delta <= -DRAG_BUFFER) {
      const next = index + 1;
      setIndex(next);
      await goTo(next);
    } else if (delta >= DRAG_BUFFER) {
      const prev = index - 1;
      setIndex(prev);
      await goTo(prev);
    } else {
      await goTo(index);
    }
    startAuto(); // resume auto after manual interaction
  };

  // Arrows
  const next = () => {
    const nxt = index + 1; // forward only
    setIndex(nxt);
    goTo(nxt);
    startAuto();
  };
  const prev = () => {
    const prv = index - 1; // still allow going back if user clicks
    setIndex(prv);
    goTo(prv);
    startAuto();
  };

  // Active dot is always modulo base images length
  const activeDot = ((index % imgs.length) + imgs.length) % imgs.length;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[380px] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_24px_rgba(139,92,246,0.25)] p-4 sm:p-5 md:p-6"
    >
      {/* faint neon glow backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -inset-24 mix-blend-screen">
          <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_25%,rgba(168,45,152,0.10),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_80%_75%,rgba(14,165,233,0.10),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_50%,rgba(236,72,153,0.08),transparent_52%)]" />
        </div>
      </div>

      {/* sliding track with spacing between slides; images are square tiles (no inner card) */}
      <motion.div
        ref={trackRef}
        className="flex h-full w-full gap-5 sm:gap-6 md:gap-7 items-stretch"
        drag="x"
        dragConstraints={{ left: -9999, right: 9999 }} // we clamp in onDragEnd
        style={{ x }}
        animate={controls}
        onDragStart={() => clearInterval(intervalRef.current)}
        onDragEnd={onDragEnd}
      >
        {loopImgs.map((src, i) => (
          <div
            key={i}
            ref={i === 0 ? slideRef : null}
            className="basis-full shrink-0 h-full flex items-center justify-center"
          >
            <img
              src={src}
              alt=""
              className="aspect-square w-[95%] h-[95%] rounded-xl object-cover shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              draggable={false}
              loading="lazy"
            />
          </div>
        ))}
      </motion.div>

      {/* dots (reflect base images, not the clones) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {imgs.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const target = BASE + i; // always jump to the middle copy
              setIndex(target);
              goTo(target);
              
              startAuto();
            }}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              i === activeDot
                ? "bg-fuchsia-400 shadow-[0_0_10px_rgba(236,72,153,0.9)] scale-110"
                : "bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* arrows */}
      <button
        onClick={prev}
        className="group absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full border border-white/15 bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
        aria-label="Previous image"
      >
        <svg className="h-4 w-4 text-white/80 group-hover:text-white" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        onClick={next}
        className="group absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 grid place-items-center h-9 w-9 rounded-full border border-white/15 bg-white/10 backdrop-blur-md hover:bg-white/20 transition"
        aria-label="Next image"
      >
        <svg className="h-4 w-4 text-white/80 group-hover:text-white" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* subtle side fades (optional vignette) */}
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
    </div>
  );
};
