import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function FullscreenLoader({
  visible = false,
  label = "Loading…",
  onComplete, // optional callback (fires when 1.5s done)
}) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      // auto hide after 1.5s
      const timer = setTimeout(() => {
        setShow(false);
        if (onComplete) onComplete();
      }, 1500); // 👈 adjust 1500 → 2000 for 2s
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0A0A10]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      aria-live="polite"
      role="status"
      aria-busy="true"
    >
      {/* Soft ambient theme glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.18),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[32vh] bg-[radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.14),transparent_60%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        {/* Premium donut spinner */}
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(217,70,239,1),rgba(168,85,247,1),rgba(56,189,248,1),rgba(217,70,239,1))] animate-spin" />
          <div className="absolute inset-[4px] rounded-full bg-[#0A0A10]" />
          <div className="absolute inset-[8px] rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,rgba(168,85,247,0.35),transparent)]" />
        </div>

        {/* Brand text */}
        <div className="text-center">
          <div className="text-lg font-semibold bg-gradient-to-r from-purple-300 via-pink-300 to-pink-400 bg-clip-text text-transparent">
            Cyphire
          </div>
          <div className="mt-1 text-sm text-white/70">{label}</div>
        </div>

        {/* Subtle shimmer bar */}
        {!reduce && (
          <div className="relative mt-3 h-1 w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/0 via-white/60 to-white/0"
              style={{ animation: "loaderShimmer 1.4s ease-in-out infinite" }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
