// src/pages/Contact.jsx
// Premium Contact Page for Cyphire
// ~450 lines with maps, FAQ, animations, real Unsplash images

import React, { Suspense, useEffect, useState ,useMemo} from "react";
import NavbarSpon from "../components/navbarsponhome.jsx";
import NavbarHome from "../components/navbarhome.jsx";
import Footer from "../components/footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  GradientText,
  GlassCard,
  NeonButton,
} from "../pages/home.jsx"; // re-use exports from Home
import {
  Sparkles,
  MapPin,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  ArrowRight,
  Users,
  HelpCircle,
  Minus,
  Plus,
} from "lucide-react";

/* ===== Background ===== */

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
          animation: `float${i % 3} ${6 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
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

/* ===== Anim Utils ===== */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.8, ease: "easeOut" },
  viewport: { once: true },
});

/* ===== FAQ Component ===== */

const FAQItem = ({ q, a, open, onClick }) => (
  <GlassCard className="p-6">
    <button
      className="flex justify-between items-center w-full text-left"
      onClick={onClick}
    >
      <span className="text-white font-medium">{q}</span>
      {open ? <Minus className="h-5 w-5 text-fuchsia-300" /> : <Plus className="h-5 w-5 text-fuchsia-300" />}
    </button>
    <AnimatePresence>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 text-white/70"
        >
          {a}
        </motion.p>
      )}
    </AnimatePresence>
  </GlassCard>
);

/* ===== Page ===== */

export default function Contact() {
  const Nav = useMemo(() => {
  const last = sessionStorage.getItem("lastHomeRoute");
  return last === "/sponsorshiphome" ? NavbarSpon : NavbarHome;
}, []);

  const [counter, setCounter] = useState({});
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    {
      q: "How can I reach Cyphire?",
      a: "You can email us directly at contact@cyphire.com or connect via our socials.",
    },
    {
      q: "Do you have a physical office?",
      a: "Yes, our HQ is located in New Delhi, India. We operate as a remote-first team across multiple countries.",
    },
    {
      q: "Are you hiring?",
      a: "Currently we’re not hiring, but stay tuned on our Careers page for openings.",
    },
    {
      q: "What response time can I expect?",
      a: "We aim to reply to emails within 24 hours, often much faster.",
    },
  ];

  // Animated stats counters
  useEffect(() => {
    const stats = [
      { label: "Countries Reached", value: 12 },
      { label: "Email Response (hrs)", value: 24 },
      { label: "HQ", value: 1 },
    ];
    stats.forEach((s) => {
      let start = 0;
      const end = s.value;
      const step = end / 60;
      const interval = setInterval(() => {
        start += step;
        setCounter((prev) => ({
          ...prev,
          [s.label]: Math.min(end, Math.floor(start)),
        }));
        if (start >= end) clearInterval(interval);
      }, 30);
    });
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
            <GradientText>Contact Us</GradientText>
          </motion.h1>
          <motion.p
            {...fadeUp(0.3)}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/70"
          >
            We’d love to hear from you. Reach out through our details below.
          </motion.p>
        </section>


        {/* CULTURE SECTIONS */}
        <section className="mx-auto max-w-6xl px-6 py-20 space-y-20">
          <motion.div {...fadeUp(0.1)} className="grid md:grid-cols-2 gap-12 items-center">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
              alt="Culture"
              className="rounded-2xl w-full h-[26rem] object-cover"
            />
            <div>
              <h3 className="text-2xl font-semibold text-white">Transparent Communication</h3>
              <p className="mt-4 text-white/70">
                We believe that trust starts with openness. Whether it’s clients, freelancers, or our community — communication stays at the heart of Cyphire.
              </p>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-white">Global Connections</h3>
              <p className="mt-4 text-white/70">
                From New Delhi to New York, Cyphire bridges boundaries. Our communication channels keep everyone connected.
              </p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c"
              alt="Global"
              className="rounded-2xl w-full h-[26rem] object-cover"
            />
          </motion.div>
        </section>

        {/* MAP SECTION */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <GlassCard className="p-8 text-center">
            <h3 className="text-2xl font-semibold text-white">
              <GradientText>Find Us</GradientText>
            </h3>
            <p className="mt-3 text-white/70">Our HQ is located in New Delhi, India.</p>
            <div className="mt-6 h-96 w-full rounded-2xl overflow-hidden border border-white/10">
              <iframe
                title="Cyphire HQ"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224345.5070565709!2d77.06889995!3d28.52728035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce2b3c10b2bf9%3A0x4d0a83c8b59b4d5!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1701234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </GlassCard>
        </section>
        {/* CONTACT INFO */}
        <section className="mx-auto max-w-6xl px-6 py-20 grid gap-8 md:grid-cols-3">
          <GlassCard className="p-8 text-center">
            <MapPin className="mx-auto h-8 w-8 text-fuchsia-300 mb-4" />
            <h3 className="text-lg font-semibold text-white">Address</h3>
            <p className="mt-2 text-white/70">New Delhi, India</p>
          </GlassCard>

          <GlassCard className="p-8 text-center">
            <Mail className="mx-auto h-8 w-8 text-fuchsia-300 mb-4" />
            <h3 className="text-lg font-semibold text-white">Email</h3>
            <p className="mt-2 text-white/70">contact@cyphire.com</p>
          </GlassCard>

          <GlassCard className="p-8 text-center">
            <Globe className="mx-auto h-8 w-8 text-fuchsia-300 mb-4" />
            <h3 className="text-lg font-semibold text-white">Socials</h3>
            <div className="mt-4 flex justify-center gap-4 text-white/70">
              <Linkedin className="h-6 w-6 cursor-pointer hover:text-fuchsia-300 transition" />
              <Twitter className="h-6 w-6 cursor-pointer hover:text-fuchsia-300 transition" />
              <Instagram className="h-6 w-6 cursor-pointer hover:text-fuchsia-300 transition" />
            </div>
          </GlassCard>
        </section>


        {/* STATS */}
        <section className="mx-auto max-w-6xl px-6 py-20 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {["Countries Reached", "Email Response (hrs)", "HQ"].map((label, i) => (
            <motion.div key={i} {...fadeUp(i * 0.2)}>
              <GlassCard className="p-6">
                <div className="mb-2 text-fuchsia-200 flex justify-center">
                  {i === 0 && <Users className="h-6 w-6" />}
                  {i === 1 && <Mail className="h-6 w-6" />}
                  {i === 2 && <MapPin className="h-6 w-6" />}
                </div>
                <div className="text-2xl font-bold text-white">
                  {counter[label] || 0}
                  {label === "HQ" ? "" : "+"}
                </div>
                <div className="text-sm text-white/70">{label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-3xl font-bold text-center md:text-4xl mb-12">
            <GradientText>Frequently Asked Questions</GradientText>
          </h2>
          <div className="space-y-6">
            {["How can I reach Cyphire?", "Do you have a physical office?", "Are you hiring?", "What response time can I expect?"].map(
              (q, i) => (
                <FAQItem
                  key={i}
                  q={q}
                  a={
                    i === 0
                      ? "You can email us directly at contact@cyphire.com or connect via our socials."
                      : i === 1
                        ? "Yes, our HQ is located in New Delhi, India. We operate as a remote-first team across multiple countries."
                        : i === 2
                          ? "Currently we’re not hiring, but stay tuned on our Careers page for openings."
                          : "We aim to reply to emails within 24 hours, often much faster."
                  }
                  open={faqOpen === i}
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                />
              )
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 blur-2xl" />
          <GlassCard className="p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold text-white">
              <GradientText>Let’s Stay Connected</GradientText>
            </h3>
            <p className="mt-4 text-white/70">
              Follow us on socials or reach out directly. We’re here to build trust, one message at a time.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <NeonButton>LinkedIn</NeonButton>
              <NeonButton>Twitter</NeonButton>
              <NeonButton>Instagram</NeonButton>
            </div>
          </GlassCard>
        </section>

        <Footer />
      </main>
    </div>
  );
}
