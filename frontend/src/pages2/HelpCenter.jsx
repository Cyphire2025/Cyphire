// src/pages2/HelpCenter.jsx
// Cyphire Help Center (Q&A + FAQ)

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { motion } from "framer-motion";
import {
  GradientText,
  GlassCard,
  NeonButton,
} from "../pages/home.jsx";
import {
  LifeBuoy,
  CreditCard,
  FileText,
  MessageSquare,
  Shield,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

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
    {Array.from({ length: 30 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-1 w-1 rounded-full bg-white/40 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float${i % 3} ${6 + (i % 5)}s ease-in-out ${i * 0.15}s infinite`,
          opacity: 0.8,
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

/* ========== Animation Utils ========== */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: "easeOut" },
  viewport: { once: true },
});

/* ========== Categories Data ========== */
const categories = [
  { title: "Getting Started", icon: <LifeBuoy className="h-6 w-6" />, desc: "Learn how to post tasks, apply, and use Cyphire effectively." },
  { title: "Payments & Escrow", icon: <CreditCard className="h-6 w-6" />, desc: "Understand secure payments, refunds, and escrow policies." },
  { title: "Workroom", icon: <MessageSquare className="h-6 w-6" />, desc: "Chat, share files, and finalize your workrooms with confidence." },
  { title: "Trust & Safety", icon: <Shield className="h-6 w-6" />, desc: "Our rules for fair play, reporting abuse, and staying safe." },
  { title: "Plans & Billing", icon: <User className="h-6 w-6" />, desc: "Details on free, plus, and ultra plans, billing cycles, and upgrades." },
  { title: "Policies", icon: <FileText className="h-6 w-6" />, desc: "Read our Escrow Policy, Terms of Service, and Privacy Policy." },
];

/* ========== FAQ Data ========== */
const faqs = [
  {
    q: "How do I post a task?",
    a: "To post a task, simply click on 'Post Task' from your dashboard. Fill in the task title, description, budget, and deadline. Once you make the payment, your task will be live instantly for freelancers to view and apply. This ensures only serious tasks are listed."
  },
  {
    q: "When are freelancers paid?",
    a: "Freelancers are paid only when both client and freelancer finalize the workroom. Funds remain securely in escrow until this point, so clients can be assured of work delivery, and freelancers know their payment is guaranteed once the job is done."
  },
  {
    q: "What if no one applies to my task?",
    a: "If no freelancer applies within 7 days, the task expires automatically. Depending on the situation and platform policies, you may either repost the task or receive a refund. We encourage writing clear descriptions and fair budgets to attract more applicants."
  },
  {
    q: "How are disputes resolved?",
    a: "If a client is unhappy with the work or a freelancer feels treated unfairly, they can raise a dispute. Our moderation team reviews the workroom chats, file submissions, and timeline of events. After careful evaluation, we decide on a fair outcome, which could be a refund, partial release, or payment."
  }
];

/* ========== Question Card ========== */
const QuestionCard = ({ q }) => (
  <GlassCard className="p-6 hover:scale-[1.02] transition">
    <h4 className="text-lg font-semibold text-white">{q.question}</h4>
    {q.answer ? (
      <p className="mt-3 text-sm text-emerald-300 leading-relaxed">{q.answer}</p>
    ) : (
      <p className="mt-3 text-sm text-white/40 italic">Not answered yet</p>
    )}
    <p className="mt-4 text-xs text-white/50">
      Asked by {q.userId?.name || "User"} • {new Date(q.createdAt).toLocaleDateString()}
    </p>
  </GlassCard>
);

/* ========== Ask Question Form ========== */
const AskQuestionForm = ({ onSubmit }) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/help/questions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      onSubmit(data);
      setQuestion("");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        <GradientText>Ask a Question</GradientText>
      </h3>
      <textarea
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question..."
        className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50"
      />
      <div className="mt-4 flex justify-end">
        <NeonButton onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </NeonButton>
      </div>
    </GlassCard>
  );
};

/* ========== Main Page ========== */
export default function HelpCenter() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/help/questions`);
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data.filter((q) => q.answer) : []);
    } catch (err) {
      console.error("fetchQuestions error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleNewQuestion = () => {
    alert("Question submitted. It will appear once answered by admin.");
  };

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
            <GradientText>Help Center</GradientText>
          </motion.h1>
          <motion.p
            {...fadeUp(0.2)}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/70"
          >
            Ask questions, explore FAQs, and find detailed answers from our team.
          </motion.p>
        </section>

        {/* CATEGORIES */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">
              <GradientText>Browse by Category</GradientText>
            </h2>
          </header>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <motion.div key={i} {...fadeUp(i * 0.2)}>
                <GlassCard className="p-8 h-full transition hover:scale-[1.03]">
                  <div className="mb-4 text-fuchsia-200">{c.icon}</div>
                  <h3 className="text-xl font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{c.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ASK QUESTION */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <AskQuestionForm onSubmit={handleNewQuestion} />
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
              <GlassCard key={i} className="overflow-hidden">
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-white font-medium"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  {f.q}
                  {faqOpen === i ? (
                    <ChevronUp className="h-5 w-5 text-fuchsia-300" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-fuchsia-300" />
                  )}
                </button>
                {faqOpen === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-4 text-sm text-white/70 leading-relaxed"
                  >
                    {f.a}
                  </motion.div>
                )}
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ANSWERED QUESTIONS */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold md:text-4xl mb-8 text-center">
            <GradientText>Answered by Cyphire Team</GradientText>
          </h2>
          {loading ? (
            <p className="text-white/50 text-center">Loading...</p>
          ) : questions.length === 0 ? (
            <p className="text-white/50 text-center">No answered questions yet.</p>
          ) : (
            <div className="space-y-6">
              {questions.map((q, i) => (
                <motion.div key={q._id || i} {...fadeUp(i * 0.1)}>
                  <QuestionCard q={q} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <Footer />
      </main>
    </div>
  );
}
