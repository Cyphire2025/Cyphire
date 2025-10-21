// src/hooks/useMicroFeedback.js
// Tiny user feedback on click: haptic (where available) + ultra-short tone.
// Makes clicks feel “real” without being annoying.

import { useCallback, useRef } from "react";

export default function useMicroFeedback() {
  const ctxRef = useRef(null);

  const ensureAudio = () => {
    if (ctxRef.current) return ctxRef.current;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctxRef.current = new AudioCtx();
      return ctxRef.current;
    } catch {
      return null;
    }
  };

  const vibrate = (pattern = [6, 12]) => {
    try {
      if (navigator?.vibrate) navigator.vibrate(pattern);
    } catch {}
  };

  const beep = (freq = 520, duration = 0.045) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.01);
  };

  const clickFeedback = useCallback(() => {
    vibrate([4]);
    beep(520, 0.04);
  }, []);

  return clickFeedback;
}
