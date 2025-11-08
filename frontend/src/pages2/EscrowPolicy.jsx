// src/pages/EscrowPolicy.jsx
// Cyphire Escrow Policy Page
// Premium immersive design: Aurora, Particles, Framer Motion, GlassCard, GradientText, NeonButton
// Sections: Hero, Principles, For Clients, For Freelancers, Escrow Flow, Rules, Disputes, FAQ, Global, CTA

import React, { Suspense, useState,useMemo } from "react";
import NavbarSpon from "../components/navbarsponhome.jsx";
import NavbarHome from "../components/navbarhome.jsx";
import Footer from "../components/footer";
import { motion } from "framer-motion";
import {
  GradientText,
  GlassCard,
  NeonButton,
} from "../pages/home.jsx";
import {
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  MessageSquare,
  Gavel,
  Globe,
  Heart,
  Target,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

/* ========== Backgrounds ========== */
const Aurora = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
    <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
  </div>
);

const Particles = () => (
  <div className="pointer-events-none absolute inset-0 -z-10">
    {Array.from({ length: 50 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-1 w-1 rounded-full bg-white/40 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float${i % 3} ${6 + (i % 5)}s ease-in-out ${i * 0.15}s infinite`,
          opacity: 0.7,
        }}
      />
    ))}
    <style>{`
      @keyframes float0 {0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
      @keyframes float1 {0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
      @keyframes float2 {0%,100%{transform:translateY(0)}50%{transform:translateY(-24px)}}
    `}</style>
  </div>
);

/* ========== Anim Utils ========== */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7, ease: "easeOut" },
  viewport: { once: true },
});

/* ========== Content Data ========== */
const principles = [
  {
    icon: <ShieldCheck className="h-7 w-7" />,
    title: "Security First",
    desc: "Every transaction is locked until both sides agree, ensuring trust at every step.",
  },
  {
    icon: <Heart className="h-7 w-7" />,
    title: "Fairness",
    desc: "Our system protects both clients and freelancers, balancing needs with clarity.",
  },
  {
    icon: <Target className="h-7 w-7" />,
    title: "Transparency",
    desc: "Clear milestones, deadlines, and workrooms mean nothing is hidden.",
  },
  {
    icon: <Clock className="h-7 w-7" />,
    title: "Timeliness",
    desc: "Funds and work move only when they should — no premature releases.",
  },
];

const clientPoints = [
  "Post tasks with confidence knowing funds are secure.",
  "Control how many freelancers can apply to your task.",
  "Only release payment once you are fully satisfied.",
  "Disputes are reviewed by Cyphire for fair resolution.",
];

const freelancerPoints = [
  "Apply only to tasks that fit your skills and timeline.",
  "Know that client funds are secured from the moment of posting.",
  "Deliver work transparently inside the workroom.",
  "Get paid instantly when both sides finalize.",
];

const escrowFlow = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Task Creation",
    desc: "Client posts a task with budget and deadline. Funds are securely deposited.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Applications",
    desc: "Freelancers apply. Clients review applicants and finalize their match.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Workroom",
    desc: "A private space for chat, file sharing, and progress updates.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6" />,
    title: "Finalization",
    desc: "Both sides click finalize when satisfied. Only then are funds released.",
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    title: "Payout",
    desc: "Freelancer receives secure payout immediately after finalization.",
  },
];

const rules = [
  "Tasks auto-expire after 7 days if not finalized.",
  "No exchange of personal details outside the platform.",
  "Refunds and disputes are handled by Cyphire moderation.",
  "Clients must fund tasks upfront to ensure freelancer protection.",
  "Freelancers must deliver inside the workroom for proof of work.",
];

const faqs = [
  {
    q: "Why is escrow important?",
    a: "It guarantees that clients get their work and freelancers get paid — without trust gaps.",
  },
  {
    q: "What if work is not delivered?",
    a: "Funds stay locked until finalization. If work is not delivered, the client is protected.",
  },
  {
    q: "Can I cancel a task midway?",
    a: "Yes, tasks can be closed early. Depending on progress, Cyphire may review refund eligibility.",
  },
  {
    q: "How are disputes resolved?",
    a: "We review workroom activity, communications, and progress to make fair calls.",
  },
];

/* ========== Page ========== */
export default function EscrowPolicy() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const Nav = useMemo(() => {
  const last = sessionStorage.getItem("lastHomeRoute");
  return last === "/sponsorshiphome" ? NavbarSpon : NavbarHome;
}, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100 overflow-x-hidden">
      <main className="relative overflow-hidden">
        <Suspense fallback={<div className="text-center p-6">Loading...</div>}>
          <Nav />
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
            <GradientText>Escrow Policy</GradientText>
          </motion.h1>
          <motion.p
            {...fadeUp(0.2)}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/70"
          >
            At Cyphire, escrow isn’t just a feature — it’s the backbone of trust
            that ensures clients and freelancers collaborate with confidence.
          </motion.p>
        </section>

        {/* PRINCIPLES */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>Our Principles</GradientText>
            </h2>
            <p className="mt-3 text-white/70">
              These pillars define how our escrow works to protect everyone.
            </p>
          </header>
          <div className="grid gap-8 md:grid-cols-4">
            {principles.map((p, i) => (
              <motion.div key={i} {...fadeUp(i * 0.15)}>
                <GlassCard className="p-8 h-full transition hover:scale-[1.03] text-center">
                  <div className="mb-4 flex justify-center text-fuchsia-300">
                    {p.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-white/70">{p.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CLIENT PROTECTION */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-10">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>Protection for Clients</GradientText>
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {clientPoints.map((pt, i) => (
              <motion.div key={i} {...fadeUp(i * 0.15)}>
                <GlassCard className="p-6 flex gap-3 items-start">
                  <ShieldCheck className="h-5 w-5 text-fuchsia-300 mt-1" />
                  <p className="text-white/80 text-sm">{pt}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FREELANCER PROTECTION */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-10">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>Protection for Freelancers</GradientText>
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {freelancerPoints.map((pt, i) => (
              <motion.div key={i} {...fadeUp(i * 0.15)}>
                <GlassCard className="p-6 flex gap-3 items-start">
                  <ShieldCheck className="h-5 w-5 text-fuchsia-300 mt-1" />
                  <p className="text-white/80 text-sm">{pt}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ESCROW FLOW */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-14">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>The Escrow Flow</GradientText>
            </h2>
            <p className="mt-3 text-white/70">
              Step-by-step, here’s how every project is safeguarded.
            </p>
          </header>
          <div className="relative border-l border-white/10 pl-10 space-y-12">
            {escrowFlow.map((step, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.15)}
                className="relative flex items-start"
              >
                <div className="absolute -left-6 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-fuchsia-300 shadow-md">
                  {step.icon}
                </div>
                <div className="ml-8">
                  <h3 className="text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/70">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* RULES */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>Rules & Guidelines</GradientText>
            </h2>
          </header>
          <div className="grid gap-6 md:grid-cols-2">
            {rules.map((rule, i) => (
              <motion.div key={i} {...fadeUp(i * 0.15)}>
                <GlassCard className="p-6 flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-fuchsia-300 mt-1" />
                  <p className="text-white/80 text-sm">{rule}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* DISPUTES */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>Dispute Handling</GradientText>
            </h2>
          </header>
          <GlassCard className="p-8 text-center">
            <Gavel className="h-10 w-10 text-fuchsia-300 mx-auto mb-4" />
            <p className="text-white/80 max-w-3xl mx-auto leading-relaxed">
              In the event of disagreements, Cyphire steps in to review all
              communications and workroom activity. Our moderation team ensures
              fair outcomes, balancing the interests of both clients and
              freelancers while protecting the integrity of the platform.
            </p>
          </GlassCard>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>FAQs</GradientText>
            </h2>
          </header>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <motion.div key={i} {...fadeUp(i * 0.15)}>
                <GlassCard className="overflow-hidden">
                  <button
                    className="flex w-full items-center justify-between px-6 py-4 text-left text-white font-medium"
                    onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  >
                    {f.q}
                    {openFAQ === i ? (
                      <ChevronUp className="h-5 w-5 text-fuchsia-300" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-fuchsia-300" />
                    )}
                  </button>
                  {openFAQ === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-4 text-sm text-white/70"
                    >
                      {f.a}
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* GLOBAL */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="absolute inset-0 -z-10 bg-[url('/images/about/world-map-dark.png')] bg-cover bg-center opacity-20" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-center">
              <GradientText>Global Fairness</GradientText>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-center text-white/70">
              Cyphire’s escrow system is designed for a borderless world —
              making collaboration safe, fast, and fair across continents.
            </p>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
              {["India", "USA", "Europe", "Asia-Pacific"].map((region, i) => (
                <GlassCard key={i} className="p-6 text-center">
                  <h4 className="font-semibold text-white">{region}</h4>
                  <p className="mt-2 text-sm text-white/70">Protected by escrow</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-2xl" />
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl md:p-12">
            <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h3 className="text-2xl font-semibold text-white md:text-3xl">
                  <GradientText>Escrow You Can Trust</GradientText>
                </h3>
                <p className="mt-3 text-white/70">
                  Join thousands of clients and freelancers who rely on Cyphire
                  escrow for peace of mind, transparency, and fairness.
                </p>
              </div>
              <NeonButton onClick={() => (window.location.href = "/how-it-works")}>
                Learn How It Works <ArrowRight className="h-4 w-4" />
              </NeonButton>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
