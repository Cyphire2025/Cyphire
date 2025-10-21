// src/components/ActionTile.jsx
import React, { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { listStagger, itemFadeUp, springSoft } from "../config/motionTokens";

/**
 * Lightweight “pre-blurred” gloss overlay using an SVG gradient (no runtime blur()).
 * It’s cheap on low-end GPUs compared to CSS filter: blur().
 */
function GlossOverlay({ small }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-3xl [mask-image:linear-gradient(to_bottom,black,black,transparent)]">
      <svg
        className="absolute -top-24 left-0 right-0"
        width="100%"
        height={small ? 96 : 128}
        viewBox={`0 0 100 ${small ? 30 : 40}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.00)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height={small ? 30 : 40} fill="url(#g)" />
      </svg>
    </div>
  );
}

export default function ActionTile({
  icon: Icon,
  title,
  desc,
  bullets,
  onPress,
  onHoverPrefetch,
  gradient,
  reduceMotion,
  smallBlurPx, // kept for API compat; not used now that gloss is SVG
  hoverNone,
  describedById,
  indexForAsymmetry = 0,
}) {
  const tileRef = useRef(null);

  return (
    <motion.button
      ref={tileRef}
      role="button"
      onClick={onPress}
      onMouseEnter={() => onHoverPrefetch?.()}
      onFocus={() => onHoverPrefetch?.()}
      whileHover={reduceMotion || hoverNone ? undefined : { y: -6, scale: 1.01 }}
      whileTap={reduceMotion || hoverNone ? undefined : { scale: 0.985 }}
      transition={springSoft}
      /* asymmetry: second tile offset on desktop for visual rhythm */
      className={[
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl",
        "border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl transition",
        "transform-gpu will-change-transform will-change-opacity focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A10]",
        "md:shadow-none",                       // no heavy shadow on small/medium
        "lg:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]", // extra ambient depth on large screens only
        indexForAsymmetry === 1 ? "md:translate-y-2 lg:translate-y-3" : "",
      ].join(" ")}
      aria-label={title}
      aria-describedby={describedById}
    >
      {/* Aura frame */}
      <div
        className={`pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
        aria-hidden="true"
      />

      {/* Inner glass stroke for premium definition */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" aria-hidden="true" />

      {/* Top gloss — SVG (no blur()) */}
      <GlossOverlay small={smallBlurPx <= 14} />

      {/* Corner accent */}
      <div className="pointer-events-none absolute right-4 top-4 h-10 w-10 rounded-full bg-white/8 blur-xl opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10">
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <p id={describedById} className="max-w-[48ch] text-white/90">{desc}</p>
        {Array.isArray(bullets) && bullets.length > 0 && (
          <motion.ul className="mt-4 grid gap-2 text-sm text-white/85" variants={listStagger} initial="hidden" animate="show">
            {bullets.map((b, i) => (
              <motion.li key={i} variants={itemFadeUp} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-white/75" aria-hidden="true" /> {b}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      <div className="relative z-10 mt-6 inline-flex items-center gap-2 text-sm text-white/90">
        Go <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Click ripple */}
      <span
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-[opacity] duration-500 group-active:opacity-20"
        style={{ background: "radial-gradient(circle at var(--x,50%) var(--y,50%), rgba(255,255,255,0.35), transparent 40%)" }}
        aria-hidden="true"
      />
    </motion.button>
  );
}
