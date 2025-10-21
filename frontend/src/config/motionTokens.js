// src/config/motionTokens.js
// Centralized motion tokens so variants stay consistent across the app.

export const springSoft = { type: "spring", stiffness: 320, damping: 28, mass: 0.7 };

export const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
};

export const itemFadeUp = {
  hidden: { opacity: 0, y: 4 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export const pageFadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.35 } },
};
