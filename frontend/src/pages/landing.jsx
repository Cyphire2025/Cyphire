// landing.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaLock,
  FaHandshake,
  FaRocket,
  FaUserShield,
  FaArrowRight,
  FaQuoteLeft,
  FaCheckCircle,
} from "react-icons/fa";


function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const handleJoinNow = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/me`, {
        credentials: "include",   // sends cookie
      });

      const loginTime = localStorage.getItem("loginTime");
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (res.ok && loginTime && now - Number(loginTime) < oneDay) {
        // ✅ Logged in & within 1 day
        navigate("/home");
      } else {
        // ❌ No cookie OR expired 1 day
        localStorage.removeItem("loginTime");
        navigate("/signup");
      }
    } catch {
      localStorage.removeItem("loginTime");
      navigate("/signup");
    }
  };


  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const handleScroll = useCallback(
    debounce(() => setScrolled(window.scrollY > 50), 10),
    []
  );

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, [handleScroll]);

  const fadeUp = useMemo(() => ({
    hidden: { opacity: 0, y: 40 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay, duration: 0.6, ease: "easeOut" },
    }),
  }), []);

  const stepsData = useMemo(() => [
    { step: "1", title: "Publisher Posts Task" },
    { step: "2", title: "Executors Apply" },
    { step: "3", title: "Workroom Collaboration" },
    { step: "4", title: "Escrow Release" },
  ], []);

  const statsData = useMemo(() => [
    { label: "Users", value: 12500 },
    { label: "Tasks Completed", value: 4500 },
    { label: "Escrow Released", value: 320000 },
  ], []);

  const testimonialsData = useMemo(() => [
    { name: "Alice", quote: "Cyphire made my project safe and smooth!" },
    { name: "Bob", quote: "Highly recommend for freelance security." },
    { name: "Charlie", quote: "Fast matching and trustworthy executors." },
  ], []);

  const pricingData = useMemo(() => [
    {
      name: "Free",
      price: "$0",
      features: [
        "Post up to 3 tasks",
        "Basic support",
        "Limited escrow",
      ],
    },
    {
      name: "Pro",
      price: "$29/mo",
      features: [
        "Unlimited tasks",
        "Priority support",
        "Full escrow features",
      ],
    },
    {
      name: "Enterprise",
      price: "$99/mo",
      features: ["Team management", "Dedicated support", "Custom escrow"],
    },
  ], []);

  const faqData = useMemo(() => [
    {
      q: "How does escrow work?",
      a: "Funds are held securely until the project is completed and approved.",
    },
    {
      q: "Can I cancel a task?",
      a: "Yes, you can cancel before an executor accepts. Escrow will be released accordingly.",
    },
    {
      q: "Is Cyphire safe?",
      a: "Absolutely, all users are verified and all payments are handled securely.",
    },
  ], []);

  const marqueeData = useMemo(() => ["Google", "Microsoft", "Tesla", "Amazon", "Facebook"], []);

  return (

    <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white overflow-x-hidden">

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed w-full z-50 transition-all duration-300 ${scrolled
          ? "bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg"
          : "bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-purple-400">Cyphire</div>
          <div className="space-x-6 hidden md:flex">
            <a href="#home" className="hover:text-purple-300 transition">
              Home
            </a>
            <a href="#features" className="hover:text-purple-300 transition">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-purple-300 transition"
            >
              How It Works
            </a>
            <a href="#pricing" className="hover:text-purple-300 transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-purple-300 transition">
              FAQ
            </a>
          </div>
          <button
            onClick={handleJoinNow}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition"
          >
            Join Now
          </button>

        </div>
      </motion.nav>

      {/* Hero */}
      <section
        id="home"
        className="relative h-screen flex flex-col justify-center items-center text-center px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/40 via-blue-800/20 to-transparent animate-pulse"></div>
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-5xl md:text-7xl font-extrabold text-purple-300 mb-4"
        >
          Secure Freelance Deals with Cyphire
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={fadeUp}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8"
        >
          An escrow-based freelance marketplace connecting Publishers and
          Executors with trust, transparency, and speed.
        </motion.p>
        <motion.a
          initial="hidden"
          animate="visible"
          custom={0.4}
          variants={fadeUp}
          href="#features"
          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-lg transition flex items-center gap-2"
        >
          Explore Features <FaArrowRight />
        </motion.a>
      </section>

      {/* Features */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-4xl font-bold text-center mb-12"
        >
          Why Choose Cyphire?
        </motion.h2>
        <div className="grid md:grid-cols-4 gap-8">
          <motion.div
            variants={fadeUp}
            whileInView="visible"
            initial="hidden"
            className="p-6 bg-gray-800/60 rounded-xl shadow-lg hover:shadow-purple-500/20 transition"
          >
            <FaLock size={40} className="text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Escrow Security</h3>
            <p className="text-gray-300 text-sm">
              Funds are securely held until project completion, ensuring
              trust.
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            whileInView="visible"
            initial="hidden"
            className="p-6 bg-gray-800/60 rounded-xl shadow-lg hover:shadow-purple-500/20 transition"
          >
            <FaHandshake size={40} className="text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verified Executors</h3>
            <p className="text-gray-300 text-sm">
              Connect with vetted freelancers ready to deliver quality work.
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            whileInView="visible"
            initial="hidden"
            className="p-6 bg-gray-800/60 rounded-xl shadow-lg hover:shadow-purple-500/20 transition"
          >
            <FaRocket size={40} className="text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Fast Matching</h3>
            <p className="text-gray-300 text-sm">
              Publish tasks and get skilled executors in minutes.
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            whileInView="visible"
            initial="hidden"
            className="p-6 bg-gray-800/60 rounded-xl shadow-lg hover:shadow-purple-500/20 transition"
          >
            <FaUserShield size={40} className="text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Trusted Platform</h3>
            <p className="text-gray-300 text-sm">
              All users verified and monitored for a reliable freelancing
              environment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 max-w-5xl mx-auto px-6"
      >
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-4xl font-bold text-center mb-12"
        >
          How It Works
        </motion.h2>
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {stepsData.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileInView="visible"
              initial="hidden"
              className="flex flex-col items-center bg-gray-800/60 rounded-xl p-6 shadow-lg"
            >
              <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl mb-4">
                {s.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 bg-gray-900/50">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-4xl font-bold text-center mb-12"
        >
          Our Impact
        </motion.h2>
        <div className="flex flex-col md:flex-row justify-around items-center gap-8 max-w-5xl mx-auto">
          {statsData.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileInView="visible"
              initial="hidden"
              className="flex flex-col items-center"
            >
              <div className="text-5xl font-bold text-purple-400 mb-2">
                {s.value.toLocaleString()}
              </div>
              <div className="text-gray-300">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Scrolling Marquee */}
      <section className="py-12">
        <div className="overflow-x-hidden">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            className="flex gap-12 text-gray-400"
          >
            {marqueeData.map(
              (p, i) => (
                <div key={i} className="text-2xl font-bold">
                  {p}
                </div>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-4xl font-bold text-center mb-12"
        >
          What People Say
        </motion.h2>
        <div className="flex flex-col md:flex-row justify-around gap-8">
          {testimonialsData.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileInView="visible"
              initial="hidden"
              className="bg-gray-800/60 p-6 rounded-xl shadow-lg flex-1"
            >
              <FaQuoteLeft className="text-purple-400 mb-2" />
              <p className="text-gray-300 mb-2">{t.quote}</p>
              <h4 className="font-semibold">{t.name}</h4>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-900/50">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-4xl font-bold text-center mb-12"
        >
          Pricing Plans
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-6">
          {pricingData.map((p, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileInView="visible"
              initial="hidden"
              className="bg-gray-800/60 rounded-xl p-6 shadow-lg hover:shadow-purple-500/20 transition"
            >
              <h3 className="text-2xl font-bold mb-4">{p.name}</h3>
              <div className="text-4xl font-extrabold mb-4">{p.price}</div>
              <ul className="mb-6 space-y-2">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <FaCheckCircle className="text-purple-400" /> {f}
                  </li>
                ))}
              </ul>
              <a className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition inline-block">
                Get Started
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 max-w-5xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-4xl font-bold text-center mb-12"
        >
          Frequently Asked Questions
        </motion.h2>
        <div className="space-y-4">
          {faqData.map((f, i) => (
            <details
              key={i}
              className="bg-gray-800/60 p-4 rounded-lg cursor-pointer hover:bg-gray-800/80 transition"
            >
              <summary className="font-semibold flex items-center justify-between">
                {f.q} <FaArrowRight />
              </summary>
              <p className="mt-2 text-gray-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        id="join"
        className="py-20 flex flex-col items-center text-center bg-purple-900/30"
      >
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-5xl font-bold mb-6"
        >
          Ready to Join Cyphire?
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-lg md:text-xl mb-8 max-w-xl text-gray-300"
        >
          Sign up today and start managing your freelance tasks securely and
          efficiently with our escrow system.
        </motion.p>
        <motion.a
          href="#"
          className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-lg text-xl transition"
        >
          Get Started Now
        </motion.a>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-gray-900/80 text-gray-400 text-center space-y-4">
        <div>© 2025 Cyphire. All rights reserved.</div>
        <div className="flex justify-center gap-4">
          <a href="#" className="hover:text-purple-400 transition">
            Twitter
          </a>
          <a href="#" className="hover:text-purple-400 transition">
            LinkedIn
          </a>
          <a href="#" className="hover:text-purple-400 transition">
            GitHub
          </a>
        </div>
      </footer>


    </div>
  );
}

export default memo(LandingPage);
