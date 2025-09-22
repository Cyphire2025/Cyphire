/* eslint-disable no-unused-vars */
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, ScrollControls, useScroll } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { create } from "zustand";

const useLandingStore = create((set) => ({
  introAnimating: true,
  introDone: false,
  activeScene: 0,
  portalActive: false,
  portalProgress: 0,
  pointer: { x: 0, y: 0 },
  soundOn: false,
  targetRoute: '/home',
  setIntroFinished: () => set({ introAnimating: false, introDone: true }),
  skipIntro: () => set({ introAnimating: false, introDone: true }),
  setActiveScene: (value) => set({ activeScene: value }),
  triggerPortal: () => set({ portalActive: true, portalProgress: 0 }),
  setPortalProgress: (value) => set({ portalProgress: value }),
  setTargetRoute: (targetRoute) => set({ targetRoute }),
  setPointer: (pointer) => set({ pointer }),
  toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),
}));

const CONFIG = {
  CAMERA: {
    distance: 14,
    tilt: 0.42,
    rotations: 2,
  },
  LIGHTS: {
    ambient: 1,
    point: [
      { position: [6, 6, 6], color: "#a855f7", intensity: 2.8 },
      { position: [-6, 3.5, -6], color: "#38bdf8", intensity: 2.4 },
      { position: [0, -5, 8], color: "#22d3ee", intensity: 2.0 },
    ],
    dir: {
      position: [0, 12, 0],
      color: "#f472b6",
      intensity: .9,
    },
  },
  STARS: {
    count: 1200,
    spread: 180,
  },
};

const STORY_SLIDES = [
  {
    id: 0,
    headline: "Escrow boots on contact",
    body: "Funds lock the moment your mission goes live.",
  },
  {
    id: 1,
    headline: "Signal verifies talent",
    body: "Cyphire routes briefs to verified creators with delivery receipts.",
  },
  {
    id: 2,
    headline: "Briefs ignite in seconds",
    body: "Smart distribution beams opportunities to matching specialists instantly.",
  },
  {
    id: 3,
    headline: "Workrooms sync velocity",
    body: "Shared threads, assets, and timelines keep every build aligned.",
  },
  {
    id: 4,
    headline: "Milestones track reality",
    body: "Live status pings map actual progress before releases unlock.",
  },
  {
    id: 5,
    headline: "Escrow releases cleanly",
    body: "When both sides confirm the drop, payouts land without friction.",
  },
  {
    id: 6,
    headline: "Fallbacks guard the mission",
    body: "Cyphire arbitration contains disputes so timelines stay intact.",
  },
  {
    id: 7,
    headline: "The citadel remembers",
    body: "Reputation compounds with every shipped deliverable inside Cyphire.",
  },
];

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeInExpo = (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1)));

function Starfield() {
  const pointer = useLandingStore((s) => s.pointer);
  const geometry = useMemo(() => {
    const vertices = [];
    for (let i = 0; i < CONFIG.STARS.count; i++) {
      const x = (Math.random() - 0.5) * CONFIG.STARS.spread;
      const y = (Math.random() - 0.5) * CONFIG.STARS.spread;
      const z = (Math.random() - 0.5) * CONFIG.STARS.spread;
      vertices.push(x, y, z);
    }
    return new Float32Array(vertices);
  }, []);

  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.04 + pointer.x * 0.4;
    ref.current.rotation.x = pointer.y * 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={geometry.length / 3}
          array={geometry}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.28} color="#c084fc" transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

function CytadelModel() {
  const { scene } = useGLTF("/models/cytadel.glb");

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.metalness = 1.6;
          child.material.roughness = 0.01;
          child.material.envMapIntensity = 30.0;
          child.material.emissive = new THREE.Color(0.08, 0.6, 0.15);
          child.material.emissiveIntensity = 25;
          if (child.name.toLowerCase().includes("core")) {
            child.material.emissive = new THREE.Color(0.86, 0.24, 0.98);
            child.material.emissiveIntensity = 3.5;
          }
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={1.08} />;
}

function CameraController() {
  const scroll = useScroll();
  const introAnimating = useLandingStore((s) => s.introAnimating);
  const portalActive = useLandingStore((s) => s.portalActive);
  const pointer = useLandingStore((s) => s.pointer);
  const setPortalProgress = useLandingStore((s) => s.setPortalProgress);
  const setActiveScene = useLandingStore((s) => s.setActiveScene);

  const introProgress = useRef(introAnimating ? 0 : 1);
  const portalProgress = useRef(0);
  const rotation = useRef(0);
  const lastScene = useRef(0);

  useEffect(() => {
    if (!introAnimating) {
      introProgress.current = 1;
    }
  }, [introAnimating]);

  useFrame(({ camera }, delta) => {
    if (introAnimating) {
      introProgress.current = Math.min(introProgress.current + delta * 0.6, 1);
      const eased = easeOutQuart(introProgress.current);
      const dist = lerp(42, CONFIG.CAMERA.distance, eased);
      const rot = lerp(-Math.PI * 0.45, 0, eased);
      camera.position.x = Math.sin(rot) * dist;
      camera.position.z = Math.cos(rot) * dist;
      camera.position.y = lerp(14, CONFIG.CAMERA.distance * CONFIG.CAMERA.tilt, eased);
      camera.lookAt(0, 0, 0);
      return;
    }

    if (portalActive) {
      portalProgress.current = Math.min(portalProgress.current + delta * 0.9, 1);
      const eased = easeInExpo(portalProgress.current);
      const dist = lerp(CONFIG.CAMERA.distance, 0.55, eased);
      camera.position.x = Math.sin(rotation.current) * dist;
      camera.position.z = Math.cos(rotation.current) * dist;
      camera.position.y = lerp(CONFIG.CAMERA.distance * CONFIG.CAMERA.tilt, 0.25, eased);
      camera.lookAt(0, 0, 0);
      if (Math.abs(useLandingStore.getState().portalProgress - portalProgress.current) > 0.01) {
        setPortalProgress(portalProgress.current);
      }
      if (portalProgress.current >= 0.999) {
        setPortalProgress(1);
      }
      return;
    }

    const offset = scroll.offset;
    const targetRot = offset * Math.PI * 2 * CONFIG.CAMERA.rotations;
    rotation.current = lerp(rotation.current, targetRot, 0.08);

    camera.position.x = Math.sin(rotation.current) * CONFIG.CAMERA.distance;
    camera.position.z = Math.cos(rotation.current) * CONFIG.CAMERA.distance;
    camera.position.y = CONFIG.CAMERA.distance * CONFIG.CAMERA.tilt + pointer.y * 1.2;
    camera.lookAt(0, 0, 0);

    const sceneIndex = clamp(Math.floor(offset * STORY_SLIDES.length + 0.0001), 0, STORY_SLIDES.length - 1);
    if (sceneIndex !== lastScene.current) {
      lastScene.current = sceneIndex;
      setActiveScene(sceneIndex);
    }
  });

  return null;
}

function IntroSequence() {
  const introAnimating = useLandingStore((s) => s.introAnimating);
  const setIntroFinished = useLandingStore((s) => s.setIntroFinished);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!introAnimating) return;
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setIntroFinished(), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [introAnimating, setIntroFinished]);

  return (
    <AnimatePresence>
      {introAnimating && (
        <motion.div
          className="pointer-events-auto fixed inset-0 z-40 bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase >= 1 ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <motion.span
              className="text-lg md:text-2xl tracking-[0.5em] uppercase text-violet-200"
              initial={{ opacity: 0, letterSpacing: '1.2em' }}
              animate={{ opacity: phase === 0 ? 0.9 : 0, letterSpacing: phase === 0 ? '0.6em' : '1.2em' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              INITIALISING
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingShardMessage() {
  const introDone = useLandingStore((s) => s.introDone);
  const activeScene = useLandingStore((s) => s.activeScene);
  const slide = STORY_SLIDES[activeScene] ?? STORY_SLIDES[0];

  return (
    <AnimatePresence>
      {introDone && (
        <motion.div
          key={slide.id}
          className="pointer-events-none fixed top-1/2 hidden -translate-y-1/2 lg:block lg:left-12 xl:left-20 2xl:left-[10%]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="absolute -left-10 z-50 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3">
            {STORY_SLIDES.map((entry, index) => (
              <span
                key={entry.id}
                className="h-2.5 w-2.5 rounded-full border border-white/25"
                style={{
                  background:
                    index === activeScene
                      ? 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(59,130,246,0.9))'
                      : 'transparent',
                  boxShadow:
                    index === activeScene
                      ? '0 0 16px rgba(99,102,241,0.65)'
                      : 'none',
                  opacity: index === activeScene ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 36, ease: 'linear' }}
            className="relative aspect-[5/7] w-40 sm:w-48 md:w-52 xl:w-60 rounded-[28px] border border-white/15 bg-white/8 backdrop-blur-2xl shadow-[0_28px_60px_-28px_rgba(59,130,246,0.45)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
            <div className="absolute -inset-6 opacity-20 blur-3xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500" />
            <motion.div
              className="absolute inset-0 flex h-full flex-col justify-between p-6"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 36, ease: 'linear' }}
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.5em] text-white/40">
                {/* <span className="h-1.5 w-8 rounded-full bg-gradient-to-r from-fuchsia-400 to-sky-400" /> */}
                <span></span>
              </div>
              <div className="space-y-3">
                <motion.h3
                  key={`headline-${slide.id}`}
                  className="text-xl md:text-2xl font-semibold text-white"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                >
                  {slide.headline}
                </motion.h3>
                <motion.p
                  key={`body-${slide.id}`}
                  className="text-sm md:text-base text-white/70"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                >
                  {slide.body}
                </motion.p>
              </div>
              <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-white/50">
                <span className="h-2 w-2 rounded-full bg-gradient-to-br from-fuchsia-400 to-sky-500 animate-pulse" />
                <span>Live sequence</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const PULSE_DATA = [
  { id: "velocity", value: "48h", label: "avg turnaround" },
  { id: "coverage", value: "2,400", label: "creators online" },
  { id: "escrow", value: "100%", label: "funds escrowed" },
];


function AmbientNumbers() {
  const introDone = useLandingStore((s) => s.introDone);
  const data = PULSE_DATA;

  return (
    <AnimatePresence>
      {introDone && (
        <motion.div
          className="pointer-events-none fixed top-12 left-1/2 z-30 flex -translate-x-1/2 gap-6 text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {data.map((item) => (
            <motion.div
              key={item.id}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 0.9, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-sky-300">
                {item.value}
              </div>
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CoreCTA() {
  // eslint-disable-next-line no-unused-vars
  const introDone = useLandingStore((s) => s.introDone);
  const portalActive = useLandingStore((s) => s.portalActive);
  const triggerPortal = useLandingStore((s) => s.triggerPortal);
  const pointer = useLandingStore((s) => s.pointer);
  const handleClick = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const loginTimeRaw = localStorage.getItem("loginTime");
    const loginTime = loginTimeRaw ? Number(loginTimeRaw) : 0;
    const now = Date.now();

    const within24Hours =
      Boolean(token) && loginTime > 0 && now - loginTime < 24 * 60 * 60 * 1000;

    const target = within24Hours ? "/home" : "/signup";
    useLandingStore.getState().setTargetRoute(target);

    if (!portalActive) {
      triggerPortal();
      if (navigator.vibrate) navigator.vibrate([12, 24, 12]);
    }
  };

  const hoverTransform = {
    x: pointer.x * 18,
    y: -pointer.y * 18,
  };

  return (
    <motion.button
      type="button"
      className="pointer-events-auto fixed bottom-20 left-1/2 z-40 flex h-32 w-32 -translate-x-1/2 items-center justify-center rounded-full"
      onClick={() => {
        if (!portalActive) {
          triggerPortal();
          if (navigator.vibrate) navigator.vibrate([12, 24, 12]);
        }
      }}
      animate={portalActive ? { scale: [1, 1.4, 0.6], opacity: [1, 0.8, 0.3] } : {}}
      transition={{ duration: 1.2, ease: "easeInOut", repeat: portalActive ? Infinity : 0 }}
    >
      <motion.span
        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500 opacity-70 blur-2xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0.45, 0.8] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.span
        className="absolute inset-0 rounded-full border border-white/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.span
        className="absolute h-20 w-20 rounded-full bg-black/70 backdrop-blur-xl"
        style={{ x: hoverTransform.x, y: hoverTransform.y }}
        transition={{ type: "spring", stiffness: 60, damping: 14 }}
      />
      <span className="relative z-10 text-xs uppercase tracking-[0.4em] text-white/70">
        Enter
      </span>
    </motion.button>
  );
}

function AmbientSoundToggle() {
  const soundOn = useLandingStore((s) => s.soundOn);
  const toggleSound = useLandingStore((s) => s.toggleSound);
  const ctxRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ctxRef.current = new AudioContext();
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      ctxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (soundOn) {
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 2);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 16);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      sourceRef.current = osc;
    } else if (sourceRef.current) {
      const osc = sourceRef.current;
      const gain = osc.context.createGain();
      osc.disconnect();
      osc.connect(gain).connect(osc.context.destination);
      gain.gain.setValueAtTime(0.05, osc.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, osc.context.currentTime + 0.6);
      setTimeout(() => {
        osc.stop();
        sourceRef.current = null;
      }, 650);
    }
  }, [soundOn]);

  return (
    <button
      type="button"
      onClick={toggleSound}
      className="pointer-events-auto fixed top-8 left-8 z-40 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.4em] text-white/60 backdrop-blur-xl hover:text-white"
    >
      {soundOn ? "Sound On" : "Sound Off"}
    </button>
  );
}

function SceneHud() {
  const introDone = useLandingStore((s) => s.introDone);

  return (
    <AnimatePresence>
      {introDone && (
        <motion.div
          className="pointer-events-none fixed right-[6%] top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-3 text-right text-white"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-xs uppercase tracking-[0.7em] text-white/40">
            Cyphire
          </span>
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-l from-fuchsia-400 via-purple-400 to-sky-300">
            Escrow. Velocity. Trust.
          </span>
          <span className="max-w-[20rem] text-sm text-white/60">
            A launch bay for teams who refuse compromise - secure, curated, and ready on contact.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const GLYPHS = [
  { id: "secure", label: "Secure", position: { top: "22%", left: "16%" } },
  // { id: "global", label: "Global", position: { bottom: "18%", right: "18%" } },
  // { id: "instant", label: "Instant", position: { top: "68%", left: "12%" } },
];

function EasterGlyphs() {
  const introDone = useLandingStore((s) => s.introDone);

  if (!introDone) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {GLYPHS.map((glyph) => (
        <motion.div
          key={glyph.id}
          className="absolute text-[10px] uppercase tracking-[0.6em] text-white/40"
          style={glyph.position}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 6 + Math.random() * 4, repeat: Infinity }}
        >
          {glyph.label}
        </motion.div>
      ))}
    </div>
  );
}
function NeonCursor() {
  const setPointer = useLandingStore((s) => s.setPointer);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const handleMove = (event) => {
      const xNorm = event.clientX / window.innerWidth - 0.5;
      const yNorm = (event.clientY / window.innerHeight - 0.5) * -1;
      setPointer({ x: xNorm, y: yNorm });
      setTrail((prev) => {
        const next = [...prev.slice(-14), { x: event.clientX, y: event.clientY, id: performance.now() }];
        return next;
      });
    };

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [setPointer]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {trail.map((point, index) => (
        <span
          key={point.id}
          className="absolute h-3 w-3 rounded-full bg-gradient-to-r from-fuchsia-400 via-sky-400 to-cyan-400 blur-md"
          style={{
            left: point.x,
            top: point.y,
            opacity: (index + 1) / trail.length,
            transform: "translate(-50%, -50%)",
            transition: "opacity 0.5s ease-out",
          }}
        />
      ))}
    </div>
  );
}

function PortalOverlay() {
  const portalActive = useLandingStore((s) => s.portalActive);
  const portalProgress = useLandingStore((s) => s.portalProgress);

  return (
    <AnimatePresence>
      {portalActive && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-45 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black/70 to-sky-900/30"
            animate={{ opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          />
          <motion.div
  className="relative z-10 rounded-full p-[2px]" // outer gradient border
  style={{
    background: 'linear-gradient(135deg, #a855f7, #ec4899, #3b82f6)',
  }}
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1 + portalProgress * 0.2, opacity: 1 }}
  transition={{ duration: 0.6 }}
>
  <div className="rounded-full bg-black/70 px-10 py-6 text-xs uppercase tracking-[0.6em] text-white/70 flex items-center justify-center">
    Docking
  </div>
</motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PortalWatcher() {
  const navigate = useNavigate();
  const portalActive = useLandingStore((s) => s.portalActive);
  const portalProgress = useLandingStore((s) => s.portalProgress);
  const targetRoute = useLandingStore((s) => s.targetRoute);
  useEffect(() => {
    if (!portalActive) return;
    if (portalProgress < 1) return;
    const timeout = setTimeout(() => navigate(targetRoute), 4500);
    return () => clearTimeout(timeout);
  }, [navigate, portalActive, portalProgress, targetRoute]);

  return null;
}

function BackgroundLayers() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f2d] via-[#111827] to-black" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle at 30% 20%, rgba(168,85,247,0.35), transparent 50%), radial-gradient(circle at 70% 80%, rgba(56,189,248,0.35), transparent 50%)",
        }}
      />

    </div>
  );
}

function LandingPage() {
  const portalActive = useLandingStore((s) => s.portalActive);
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <BackgroundLayers />

      <Canvas shadows camera={{ position: [0, 4, 16], fov: 55 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ScrollControls pages={STORY_SLIDES.length} damping={0.15}>
            <Starfield />

            {/* ✅ Add this block */}
            <ambientLight intensity={CONFIG.LIGHTS.ambient} />
            {CONFIG.LIGHTS.point.map((light, idx) => (
              <pointLight
                key={idx}
                position={light.position}
                intensity={light.intensity}
                color={light.color}
                castShadow
              />
            ))}
            <directionalLight
              position={CONFIG.LIGHTS.dir.position}
              intensity={CONFIG.LIGHTS.dir.intensity}
              color={CONFIG.LIGHTS.dir.color}
              castShadow
            />

            <CytadelModel />
            <CameraController />
            <EffectComposer>
              <Bloom intensity={1.4} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
              <Vignette eskil={false} offset={0.2} darkness={0.35} />
              <DepthOfField focusDistance={0.02} focalLength={0.02} bokehScale={3} />
            </EffectComposer>
          </ScrollControls>
        </Suspense>
      </Canvas>
      {!portalActive && (
        <>
          <IntroSequence />
          <FloatingShardMessage />
          <AmbientNumbers />
          <CoreCTA />
          <AmbientSoundToggle />
          <SceneHud />
          <EasterGlyphs />
          <NeonCursor />
        </>
      )}

      <PortalOverlay />
      <PortalWatcher />

    </div>
  );
}

useGLTF.preload("/models/cytadel.glb");

export default LandingPage;

