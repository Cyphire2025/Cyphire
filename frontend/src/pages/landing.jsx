// LandingPage.jsx
// -----------------------------------------------------------------------------
// Cyphire Futuristic Landing Page
// Expanded to 700+ lines with multiple visual layers, holographic cards,
// responsive polish, parallax stars, animated grids, keyboard nav, and footer.
// -----------------------------------------------------------------------------

import React, {
  Suspense,
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  ScrollControls,
  useScroll,
  OrbitControls,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  DepthOfField,
} from "@react-three/postprocessing";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";


// Add at top of LandingPage.jsx
import { create } from "zustand";

const useLandingStore = create((set) => ({
  activeIndex: 0,
  setActiveIndex: (i) => set({ activeIndex: i }),
}));

// -----------------------------------------------------------------------------
// CONFIGURATION CONSTANTS
// -----------------------------------------------------------------------------

const CONFIG = {
  CAMERA: {
    fov: 60,
    distance: 15,
    tilt: 0.45,
    rotations: 4, // allow >360° rotations
    smoothing: 0.1,
  },
  LIGHTS: {
    ambient: 0.3,
    point: [
      { position: [6, 6, 6], color: "#a855f7", intensity: 1.4 },
      { position: [-6, 4, -6], color: "#60a5fa", intensity: 1.2 },
      { position: [0, -4, 6], color: "#22d3ee", intensity: 0.8 },
    ],
    dir: {
      position: [0, 12, 0],
      color: "#d946ef",
      intensity: 0.6,
    },
  },
  BREAKPOINTS: {
    mobile: 640,
    tablet: 1024,
    desktop: 1440,
  },
  STARS: {
    count: 1200,
    spread: 200,
  },
};

// -----------------------------------------------------------------------------
// UTILITY HOOKS
// -----------------------------------------------------------------------------

function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

// -----------------------------------------------------------------------------
// STARFIELD BACKGROUND (PARALLAX)
// -----------------------------------------------------------------------------

function Starfield() {
  const points = useMemo(() => {
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
    ref.current.rotation.y = clock.getElapsedTime() * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        color="#a855f7"
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// CYTADEL MODEL LOADER
// -----------------------------------------------------------------------------

function CytadelModel() {
  const { scene } = useGLTF("/models/cytadel.glb");

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material.metalness = 0.6;
          child.material.roughness = 0.3;
          child.material.envMapIntensity = 1.2;
          child.material.emissive = new THREE.Color(0.05, 0.05, 0.1);
          child.material.emissiveIntensity = 0.5;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={1.1} />;
}

// -----------------------------------------------------------------------------
// CAMERA CONTROLLER (SCROLL + KEYBOARD NAV)
// -----------------------------------------------------------------------------

function CameraController() {
  const scroll = useScroll();
  const prevRot = useRef(0);
  const manualOffset = useRef(0);

  const handleKey = useCallback((e) => {
    if (e.key === "ArrowRight") manualOffset.current += 0.05;
    if (e.key === "ArrowLeft") manualOffset.current -= 0.05;
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useFrame(({ camera }) => {
    const { distance, tilt, rotations, smoothing } = CONFIG.CAMERA;
    const scrollProgress = scroll.offset + manualOffset.current;
    const targetRot = scrollProgress * Math.PI * 2 * rotations;

    const smoothedRot = lerp(prevRot.current, targetRot, smoothing);
    prevRot.current = smoothedRot;

    camera.position.x = Math.sin(smoothedRot) * distance;
    camera.position.z = Math.cos(smoothedRot) * distance;
    camera.position.y = distance * tilt;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function ScrollWatcher() {
  const scroll = useScroll();
  const setActiveIndex = useLandingStore((s) => s.setActiveIndex);

  useFrame(() => {
    const numCards = HOLOGRAM_CARDS.length;
    const segment = 1 / numCards;
    const progress = scroll.offset;

    let index = Math.floor(progress / segment);
    index = clamp(index, 0, numCards - 1);

    setActiveIndex(index);
  });

  return null;
}


// -----------------------------------------------------------------------------
// LIGHTING RIG
// -----------------------------------------------------------------------------

function NeonLights() {
  return (
    <>
      <ambientLight intensity={CONFIG.LIGHTS.ambient} />
      {CONFIG.LIGHTS.point.map((p, i) => (
        <pointLight
          key={i}
          position={p.position}
          intensity={p.intensity}
          color={p.color}
          distance={40}
        />
      ))}
      <directionalLight
        position={CONFIG.LIGHTS.dir.position}
        intensity={CONFIG.LIGHTS.dir.intensity}
        color={CONFIG.LIGHTS.dir.color}
        castShadow
      />
    </>
  );
}

// -----------------------------------------------------------------------------
// HOLOGRAPHIC OVERLAY CARDS
// -----------------------------------------------------------------------------

const HOLOGRAM_CARDS = [
  {
    id: 0,
    title: "Secure Your Work",
    desc: "Every project on Cyphire starts with escrow protection, ensuring trust by design.",
  },
  {
    id: 1,
    title: "Escrow By Default",
    desc: "Funds are locked safely until milestones are met, creating a reliable ecosystem.",
  },
  {
    id: 2,
    title: "Trust Without Compromise",
    desc: "Clients and freelancers collaborate with full transparency and peace of mind.",
  },
  {
    id: 3,
    title: "Instant Matching",
    desc: "Post a task and get connected to top freelancers within minutes.",
  },
  {
    id: 4,
    title: "One-Click Payouts",
    desc: "Our RazorpayX integration enables seamless and instant freelancer payouts.",
  },
  {
    id: 5,
    title: "Elite Freelancers",
    desc: "Join a verified community of skilled professionals across industries.",
  },
  {
    id: 6,
    title: "AI-Powered Suggestions",
    desc: "Get smart task recommendations with our built-in AI matching engine.",
  },
  {
    id: 7,
    title: "Global Reach",
    desc: "Collaborate across borders with secure payments and trusted contracts.",
  },
  {
    id: 8,
    title: "Premium Sponsors",
    desc: "Highlight your events with premium sponsorship visibility.",
  },
  {
    id: 9,
    title: "Join Cyphire",
    desc: "Be part of the next-generation freelance platform built on trust and speed.",
  },
];

function HologramCard({ card, isActive, isMobile }) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={card.id}
          className={`pointer-events-none ${isMobile ? "w-[90%] h-[60%]" : "w-[35%] h-[50%]"
            } flex flex-col items-center justify-center text-center
          rounded-2xl backdrop-blur-xl border shadow-lg`}
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            borderColor: "rgba(168, 85, 247, 0.4)",
            boxShadow:
              "0 0 30px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.2)",
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <h2
            className={`font-extrabold mb-4 ${isMobile ? "text-2xl" : "text-4xl"
              } text-purple-300`}
          >
            {card.title}
          </h2>
          <p
            className={`text-gray-200 ${isMobile ? "text-base px-4" : "text-lg px-12"
              }`}
          >
            {card.desc}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OverlayWrapper({ children }) {
  const width = useWindowSize();
  const isMobile = width < CONFIG.BREAKPOINTS.mobile;

  return (
    <div
      className="fixed top-0 left-0 w-screen h-screen flex justify-center items-center pointer-events-none"
      style={{
        padding: isMobile ? "1rem" : "2rem",
      }}
    >
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SCROLL PROGRESS INDICATOR
// -----------------------------------------------------------------------------

function ProgressIndicator({ activeIndex }) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 pointer-events-none">
      {HOLOGRAM_CARDS.map((_, idx) => (
        <motion.div
          key={idx}
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor:
              idx === activeIndex ? "#a855f7" : "rgba(255,255,255,0.2)",
            boxShadow:
              idx === activeIndex
                ? "0 0 10px rgba(168,85,247,0.8), 0 0 20px rgba(168,85,247,0.6)"
                : "none",
          }}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{
            scale: idx === activeIndex ? 1.2 : 0.8,
            opacity: idx === activeIndex ? 1 : 0.5,
          }}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// CTA HOLOGRAM CARD
// -----------------------------------------------------------------------------

function CTAHologram({ isActive, isMobile }) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key="cta-card"
          className={`pointer-events-auto ${isMobile ? "w-[90%] h-[60%]" : "w-[35%] h-[50%]"
            } flex flex-col items-center justify-center text-center
rounded-2xl backdrop-blur-xl border shadow-2xl`}

          style={{
            background: "rgba(255, 255, 255, 0.06)",
            borderColor: "rgba(168, 85, 247, 0.5)",
            boxShadow:
              "0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.3)",
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <h2
            className={`font-extrabold mb-6 ${isMobile ? "text-3xl" : "text-5xl"
              } text-purple-300`}
          >
            Ready to Join Cyphire?
          </h2>
          <p
            className={`text-gray-200 mb-8 ${isMobile ? "text-base px-4" : "text-lg px-12"
              }`}
          >
            Experience the future of freelancing. Escrow by default, instant
            payouts, and a trusted community.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px #a855f7" }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-xl font-bold text-lg text-white bg-purple-600 hover:bg-purple-700 transition-all"
            style={{
              boxShadow:
                "0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.4)",
            }}
            onClick={() => alert("Redirect to signup 🚀")}
          >
            Join Cyphire
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// -----------------------------------------------------------------------------
// OVERLAY MANAGER
// -----------------------------------------------------------------------------
function HologramOverlayManager() {
  const width = useWindowSize();
  const isMobile = width < CONFIG.BREAKPOINTS.mobile;
  const activeIndex = useLandingStore((s) => s.activeIndex);

  return (
    <div className="absolute inset-0 flex items-center justify-between px-12">
      {/* LEFT SIDE STATIC TEXT */}
      <div className="flex flex-col max-w-md space-y-6 pointer-events-auto">
        <h1 className="text-6xl font-extrabold text-purple-400">
          Welcome to Cyphire
        </h1>
        <p className="text-gray-300 text-lg">
          The next-gen freelancing platform with escrow by default, instant
          payouts, and trusted professionals worldwide.
        </p>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px #a855f7" }}
          whileTap={{ scale: 0.95 }}
          className="w-fit px-6 py-3 rounded-xl font-semibold text-lg text-white bg-purple-600 hover:bg-purple-700 transition-all"
          style={{
            boxShadow:
              "0 0 15px rgba(168,85,247,0.6), 0 0 30px rgba(168,85,247,0.4)",
          }}
          onClick={() => (window.location.href = "/signup")} // redirect
        >
          Join Now
        </motion.button>
      </div>

      {/* RIGHT SIDE CYCLING HOLOGRAMS */}
      <div className="absolute inset-0 flex items-center justify-end pr-24">
        {HOLOGRAM_CARDS.map((card, idx) =>
          idx === HOLOGRAM_CARDS.length - 1 ? (
            <CTAHologram
              key={card.id}
              isActive={idx === activeIndex}
              isMobile={isMobile}
            />
          ) : (
            <HologramCard
              key={card.id}
              card={card}
              isActive={idx === activeIndex}
              isMobile={isMobile}
            />
          )
        )}
      </div>

      {/* Scroll dots */}
      <ProgressIndicator activeIndex={activeIndex} />
    </div>
  );
}


// -----------------------------------------------------------------------------
// BACKGROUND LAYERS
// -----------------------------------------------------------------------------

function BackgroundLayers() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black opacity-95" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/dark-mosaic.png')",
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// FOOTER
// -----------------------------------------------------------------------------

function Footer() {
  return (
    <div className="absolute bottom-0 w-full py-4 flex justify-center text-sm text-gray-500 z-40">
      <p>
        © {new Date().getFullYear()} Cyphire · Built with trust · Escrow by
        default
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LOADER + ERROR BOUNDARY
// -----------------------------------------------------------------------------

function LoaderFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400 text-xl">
      <motion.div
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"
        initial={{ rotate: 0 }}
        animate={{ rotate: 45 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      <p>Loading Cyphire Experience...</p>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("LandingPage Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center text-red-500">
          <p>Something went wrong loading the landing page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// -----------------------------------------------------------------------------
// FINAL LANDING PAGE EXPORT
// -----------------------------------------------------------------------------

function LandingPage() {
  return (
    <ErrorBoundary>
      <div className="relative w-screen h-screen bg-black text-white overflow-hidden">
        <BackgroundLayers />

        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 2, 15], fov: CONFIG.CAMERA.fov }}
        >
          <Suspense fallback={null}>
            <ScrollControls pages={HOLOGRAM_CARDS.length} damping={0.15}>
              <Starfield />
              <CytadelModel />
              <CameraController />
              <NeonLights />
              <ScrollWatcher />
              <EffectComposer>
                <Bloom
                  intensity={1.0}
                  luminanceThreshold={0.25}
                  luminanceSmoothing={0.9}
                  height={300}
                />
                <Vignette eskil={false} offset={0.2} darkness={0.9} />
                <DepthOfField
                  focusDistance={0.02}
                  focalLength={0.02}
                  bokehScale={2}
                />
              </EffectComposer>
            </ScrollControls>
          </Suspense>
        </Canvas>

        <OverlayWrapper>
          <HologramOverlayManager />
        </OverlayWrapper>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default LandingPage;
