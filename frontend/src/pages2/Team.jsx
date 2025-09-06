// src/pages/Teams.jsx
// Immersive Teams Page for Cyphire
// Tailwind + Framer Motion + premium design patterns

import React, { Suspense, useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

import { motion } from "framer-motion";
import {
  GradientText,
  GlassCard,
  NeonButton,
} from "../pages/home.jsx"; // reuse from home
import {
  Users,
  Sparkles,
  Star,
  ArrowRight,
  Quote,
  Globe,
  Rocket,
  Trophy,
} from "lucide-react";

/* ========== Background ========== */

const Aurora = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_60%)]" />
    <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
  </div>
);

const Particles = () => (
  <div className="pointer-events-none absolute inset-0 -z-10">
    {Array.from({ length: 40 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-1 w-1 rounded-full bg-white/40 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float${i % 3} ${6 + (i % 5)}s ease-in-out ${i * 0.15}s infinite`,
          opacity: 0.6,
        }}
      />
    ))}
    <style>{`
      @keyframes float0 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-12px)} }
      @keyframes float1 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-18px)} }
      @keyframes float2 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-24px)} }
    `}</style>
  </div>
);

/* ========== Anim Utils ========== */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.8, ease: "easeOut" },
  viewport: { once: true },
});

const slideIn = (dir = "left", delay = 0) => {
  const x = dir === "left" ? -80 : 80;
  return {
    initial: { opacity: 0, x },
    whileInView: { opacity: 1, x: 0 },
    transition: { delay, duration: 0.8, ease: "easeOut" },
    viewport: { once: true },
  };
};

/* ========== Content ========== */

const leaders = [
  {
    name: "Khushi Khanna",
    role: "Founder & CEO",
    img: {},
    bio: "Visionary leader shaping Cyphire’s future, blending strategy, tech, and trust-driven design.",
  },
  {
    name: "Sophia Chen",
    role: "CTO",
    img: "/images/team/sophia.jpg",
    bio: "Driving innovation and architecture, ensuring Cyphire’s systems scale securely and globally.",
  },
];

const teamMembers = [
  {
    name: "David Kim",
    role: "Design Lead",
    img: "/images/team/david.jpg",
    quote: "Design isn’t decoration — it’s clarity, empathy, and trust in pixels.",
  },
  {
    name: "Elena Rossi",
    role: "Head of Marketing",
    img: "/images/team/elena.jpg",
    quote: "We don’t just market Cyphire, we tell stories of empowerment and collaboration.",
  },
  {
    name: "Marcus Lee",
    role: "Backend Engineer",
    img: "/images/team/marcus.jpg",
    quote: "Code is invisible, but when done right it feels like magic.",
  },
  {
    name: "Priya Nair",
    role: "Product Manager",
    img: "/images/team/priya.jpg",
    quote: "Every feature is a promise to the user — we ship only what’s meaningful.",
  },
];

const stats = [
  { icon: <Globe className="h-6 w-6" />, label: "Countries", value: 12 },
  { icon: <Users className="h-6 w-6" />, label: "Team Members", value: 28 },
  { icon: <Rocket className="h-6 w-6" />, label: "Projects Shipped", value: 130 },
  { icon: <Trophy className="h-6 w-6" />, label: "Awards", value: 5 },
];

const testimonials = [
  {
    text: "Working at Cyphire feels like building the future with people who care deeply.",
    name: "Lucas",
    role: "Frontend Engineer",
  },
  {
    text: "It’s not a job, it’s a mission — creating trust-first freelancing for everyone.",
    name: "Ananya",
    role: "Community Manager",
  },
  {
    text: "Here, I’m not just writing code, I’m helping shape how work happens worldwide.",
    name: "Omar",
    role: "DevOps Engineer",
  },
];

/* ========== Page ========== */

export default function Teams() {
  const [counter, setCounter] = useState({});

  // Animate counters
  useEffect(() => {
    stats.forEach((s) => {
      let start = 0;
      const end = s.value;
      const step = end / 60;
      const interval = setInterval(() => {
        start += step;
        setCounter((prev) => ({ ...prev, [s.label]: Math.min(end, Math.floor(start)) }));
        if (start >= end) clearInterval(interval);
      }, 30);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100 overflow-x-hidden">
      <main className="relative overflow-hidden">
        <Suspense fallback={<div className="text-center p-6">Loading...</div>}>
          <Navbar />
          <Aurora />
          <Particles />
        </Suspense>

        {/* HERO */}
        <section className="relative mx-auto max-w-6xl px-6 pt-28 pb-20 text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold sm:text-5xl md:text-6xl"
          >
            <GradientText>Meet the Team</GradientText>
          </motion.h1>
          <motion.p
            {...fadeUp(0.3)}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/70"
          >
            Behind every milestone is a team of builders, dreamers, and doers.  
            This is Cyphire’s crew.
          </motion.p>
        </section>

        {/* LEADERSHIP */}
        <section className="mx-auto max-w-6xl px-6 py-20 space-y-16">
          {leaders.map((leader, i) => (
            <motion.div
              key={i}
              {...slideIn(i % 2 === 0 ? "left" : "right", i * 0.2)}
              className="grid md:grid-cols-2 gap-10 items-center"
            >
              <img
                src={leader.img}
                alt={leader.name}
                className="rounded-2xl object-cover w-full h-[26rem]"
              />
              <GlassCard className="p-8">
                <h3 className="text-2xl font-semibold text-white">{leader.name}</h3>
                <p className="text-sm text-fuchsia-300">{leader.role}</p>
                <p className="mt-4 text-white/80 leading-relaxed">{leader.bio}</p>
              </GlassCard>
            </motion.div>
          ))}
        </section>

        {/* CORE TEAM GRID */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-bold text-center md:text-4xl">
            <GradientText>Core Team</GradientText>
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((m, i) => (
              <motion.div
                key={i}
                initial={{ rotateY: 90, opacity: 0 }}
                whileInView={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: i * 0.15, duration: 0.8 }}
                viewport={{ once: true }}
                className="perspective"
              >
                <GlassCard className="h-full p-6 flex flex-col items-center text-center transition hover:scale-[1.05]">
                  <img
                    src={m.img}
                    alt={m.name}
                    className="h-28 w-28 rounded-full object-cover border-2 border-fuchsia-400/50"
                  />
                  <h3 className="mt-4 text-lg font-semibold text-white">{m.name}</h3>
                  <p className="text-sm text-fuchsia-300">{m.role}</p>
                  <p className="mt-3 text-sm text-white/70 italic">“{m.quote}”</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CULTURE (Alternating) */}
        <section className="mx-auto max-w-6xl px-6 py-20 space-y-20">
          <motion.div {...slideIn("left")} className="grid md:grid-cols-2 gap-12 items-center">
            <img src="/images/team/culture1.jpg" alt="Culture" className="rounded-2xl w-full h-[26rem] object-cover" />
            <div>
              <h3 className="text-2xl font-semibold text-white">Collaboration First</h3>
              <p className="mt-4 text-white/70">
                At Cyphire, collaboration isn’t a buzzword. We work in tight loops, blending engineering,
                design, and strategy to ship with precision.
              </p>
            </div>
          </motion.div>

          <motion.div {...slideIn("right")} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-white">Remote by DNA</h3>
              <p className="mt-4 text-white/70">
                Our team spans continents, but distance doesn’t dilute our energy.
                Async workflows and trust-driven systems keep us in flow.
              </p>
            </div>
            <img src="/images/team/culture2.jpg" alt="Remote" className="rounded-2xl w-full h-[26rem] object-cover" />
          </motion.div>
        </section>

        {/* STATS */}
        <section className="mx-auto max-w-6xl px-6 py-20 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <motion.div key={i} {...fadeUp(i * 0.2)}>
              <GlassCard className="p-6">
                <div className="mb-2 text-fuchsia-200 flex justify-center">{s.icon}</div>
                <div className="text-2xl font-bold text-white">{counter[s.label] || 0}+</div>
                <div className="text-sm text-white/70">{s.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </section>

        {/* TESTIMONIALS */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold text-center md:text-4xl">
            <GradientText>Voices from the Team</GradientText>
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div key={i} {...fadeUp(i * 0.2)}>
                <GlassCard className="p-6 h-full flex flex-col justify-between">
                  <Quote className="h-6 w-6 text-fuchsia-200 mb-4" />
                  <p className="text-white/80 italic">“{t.text}”</p>
                  <div className="mt-6">
                    <div className="font-medium text-white">{t.name}</div>
                    <div className="text-xs text-white/60">{t.role}</div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-2xl" />
          <GlassCard className="p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold text-white">
              <GradientText>Want to build the future with us?</GradientText>
            </h3>
            <p className="mt-4 text-white/70">
              We’re always looking for curious minds and bold builders.  
              Check out our open roles and join the Cyphire journey.
            </p>
            <div className="mt-6">
              <NeonButton onClick={() => (window.location.href = "/join-us")}>
                Explore Careers <ArrowRight className="h-4 w-4" />
              </NeonButton>
            </div>
          </GlassCard>
        </section>

        <Footer />
      </main>
    </div>
  );
}
