/* eslint-disable no-unused-vars */
import React, { memo, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  FiEye, FiEyeOff, FiShield, FiLock, FiMail, FiUser, FiCheck, FiX, FiZap, FiCpu, FiActivity,
} from "react-icons/fi";
import toast from "react-hot-toast";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const Field = memo(function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  rightSlot,
  onKeyEvent,
}) {
  return (
    <div className="group">
      <label htmlFor={name} className="text-xs tracking-wide text-white/70">{label}</label>
      <div className="mt-1 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70">
          {icon}
        </div>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onKeyUp={onKeyEvent}
          onKeyDown={onKeyEvent}
          onKeyPress={onKeyEvent}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-white/10 bg-black/30 px-10 py-3 outline-none ring-0
                     focus:border-fuchsia-400/40 transition-colors"
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
});


export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = useMemo(() => {
    const next = new URLSearchParams(location.search || "").get("next");
    if (next && next.startsWith("/")) return next;
    return "/choose";
  }, [location.search]);

  // form state
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [remember, setRemember] = useState(true);

  // ui state
  const [loading, setLoading] = useState(false);

  // password UI helpers
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  // keyboard submit (Ctrl/Cmd + Enter)
  const rootRef = useRef(null);

  // --- Validators ---
  const emailRegex = /^\S+@\S+\.\S+$/;
  const strengthChecks = useMemo(() => {
    const pw = form.password || "";
    const checks = {
      length: pw.length >= 10,
      number: /\d/.test(pw),
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      symbol: /[^A-Za-z0-9]/.test(pw),
      match: pw.length > 0 && pw === form.confirm,
    };
    return checks;
  }, [form.password, form.confirm]);

  const strengthScore = useMemo(() => {
    // simple weighted heuristic
    let score = 0;
    if (strengthChecks.length) score += 2;
    if (strengthChecks.upper) score += 1;
    if (strengthChecks.lower) score += 1;
    if (strengthChecks.number) score += 1;
    if (strengthChecks.symbol) score += 2;
    if (form.password.length >= 14) score += 1;
    return Math.min(score, 8);
  }, [strengthChecks, form.password.length]);

  const strengthLabel = useMemo(() => {
    if (strengthScore <= 2) return "Very weak";
    if (strengthScore <= 4) return "Weak";
    if (strengthScore <= 6) return "Good";
    return "Strong";
  }, [strengthScore]);

  const validate = useCallback(() => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.email.trim()) return "Email is required.";
    if (!emailRegex.test(form.email)) return "Enter a valid email address.";
    if (form.password.length < 10) return "Password must be at least 10 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return "";
  }, [form]);

  // unified setter
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Caps lock detection for password inputs
  const handleKeyState = useCallback((e) => {
    const cl = e.getModifierState && e.getModifierState("CapsLock");
    setCapsOn(!!cl);
  }, []);

  // Google OAuth (redirect, keeps your original behavior)
  const handleGoogle = useCallback(() => {
    setLoading(true);
    window.location.href = `${API_BASE}/api/auth/google?mode=signup&remember=${remember ? 1 : 0}&next=${encodeURIComponent(redirectPath)}`;
  }, [redirectPath, remember]);

  // Email signup
  const handleEmailSignup = useCallback(
    async (e) => {
      e.preventDefault();
      const v = validate();
      if (v) {
        toast.error(v);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, rememberMe: remember }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to sign up");

        // Backend uses HTTP-only cookies, so we just store user info
        const store = remember ? localStorage : sessionStorage;
        if (data?.user?.id) store.setItem("userId", data.user.id);
        if (data?.user?.name) store.setItem("userName", data.user.name);
        if (data?.user?.email) store.setItem("userEmail", data.user.email);
        store.setItem("loginTime", Date.now().toString());

        toast.success("Welcome to Cyphire! Redirecting…");
        // short celebratory delay for premium feel
        setTimeout(() => navigate(redirectPath), 650);
      } catch (e) {
        toast.error(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [form, remember, navigate, redirectPath, validate]
  );

  // Receive Google popup messages (kept compatible with your earlier flow if you switch to popup)
  useEffect(() => {
    const onMsg = (e) => {
      const { token, user, error } = e.data || {};
      if (error) {
        toast.error(error || "Google sign-in failed");
        setLoading(false);
        return;
      }
      if (token) {
        const store = remember ? localStorage : sessionStorage;
        store.setItem("token", token);
        if (user?.id) store.setItem("userId", user.id);
        store.setItem("loginTime", Date.now().toString());
        navigate(redirectPath);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [redirectPath, remember, navigate]);

  // Keyboard shortcut submit
  useEffect(() => {
    const el = rootRef.current;
    const handler = (e) => {
      const isMetaEnter = (e.ctrlKey || e.metaKey) && e.key === "Enter";
      if (isMetaEnter && !loading) {
        const formEl = el?.querySelector("form");
        if (formEl) formEl.requestSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading]);

  // UI helpers
  const strengthPct = (strengthScore / 8) * 100;

  const ChecklistItem = ({ ok, text }) => (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border 
        ${ok ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/20 bg-white/5"}`}
      >
        {ok ? <FiCheck className="text-emerald-300" /> : <FiX className="text-white/50" />}
      </span>
      <span className={`${ok ? "text-emerald-300" : "text-white/60"}`}>{text}</span>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="min-h-screen relative overflow-hidden bg-[#05050a] text-white"
    >
      {/* AURORA + GRID BACKDROP */}
      <div className="pointer-events-none absolute inset-0">
        {/* soft aurora blobs */}
        <motion.div
          className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/25 blur-[120px]"
          animate={{ x: [-10, 15, -10], y: [0, 25, 0] }}
          transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-44 -right-40 h-[30rem] w-[30rem] rounded-full bg-violet-500/25 blur-[120px]"
          animate={{ x: [10, -15, 10], y: [0, -25, 0] }}
          transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 left-1/4 h-[22rem] w-[22rem] rounded-full bg-sky-500/20 blur-[100px]"
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        />

        {/* subtle wire grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at 40% 30%, rgba(0,0,0,1), transparent 70%)",
          }}
        />
      </div>

      {/* PAGE CONTENT */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 lg:py-16">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
          >
            <FiZap />
            <span className="font-semibold tracking-wide">Cyphire</span>
          </Link>
          <Link
            to="/signin"
            className="text-sm text-white/70 hover:text-white"
          >
            Already have an account? Sign in
          </Link>
        </div>

        {/* Split Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="
    relative flex flex-col lg:flex-row 
    bg-white/[0.045] backdrop-blur-2xl border border-white/10 
    rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)]
  "
        >
          {/* Edge glow */}
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-violet-500/40 via-fuchsia-500/20 to-sky-500/40 blur-2xl pointer-events-none" />

          {/* LEFT: Hero / Value Panel */}
          <div
            className="
      flex-1 flex flex-col justify-between 
      bg-gradient-to-br from-[#160024]/80 via-[#080018]/80 to-[#001020]/80 
      p-8 lg:p-12
    "
          >
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold leading-tight text-white/95"
              >
                Join the network where work feels{" "}
                <span className="text-fuchsia-300">effortless</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-3 text-white/70 max-w-sm"
              >
                Secure escrow by default. Lightning-fast workflows. Designed for builders
                who never compromise on precision.
              </motion.p>

              {/* Feature Highlights */}
              <div className="mt-6 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-start gap-3"
                >
                  <div className="rounded-lg border border-white/15 bg-black/30 p-2">
                    <FiShield className="text-fuchsia-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white/90">Bank-grade protection</div>
                    <div className="text-sm text-white/60">
                      End-to-end secure flows and multi-layered checks.
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-start gap-3"
                >
                  <div className="rounded-lg border border-white/15 bg-black/30 p-2">
                    <FiCpu className="text-violet-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white/90">Performance-first design</div>
                    <div className="text-sm text-white/60">
                      Micro-interactions tuned for clarity and speed.
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-start gap-3"
                >
                  <div className="rounded-lg border border-white/15 bg-black/30 p-2">
                    <FiActivity className="text-sky-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white/90">Live status & insights</div>
                    <div className="text-sm text-white/60">
                      Real-time updates keep you one step ahead.
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Decorative progress holo */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-sky-500/10 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/70">Your journey</div>
                  <div className="text-lg font-semibold text-white/95">
                    Begin in under a minute
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <FiLock className="opacity-80" />
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Form Panel */}
          <div
            className="
      flex-1 p-8 lg:p-12 
      bg-[#05050a]/80 backdrop-blur-2xl 
      flex items-center justify-center
    "
          >
            <div className="w-full max-w-md">
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl md:text-3xl font-bold">Create your account</h2>
                <p className="text-white/60 mt-2">Welcome to Cyphire — let’s set you up</p>
              </div>


              {/* Google button */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15 disabled:opacity-60"
              >
                <FcGoogle size={22} />
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-4 text-white/50">
                <span className="h-px w-full bg-white/10" />
                <span className="text-xs">or</span>
                <span className="h-px w-full bg-white/10" />
              </div>

              {/* Email Signup Form */}
              <form onSubmit={handleEmailSignup} className="space-y-4" noValidate>
                <Field
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  icon={<FiUser />}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  autoComplete="email"
                  icon={<FiMail />}
                />

                {/* Password field */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-xs tracking-wide text-white/70">
                      Password
                    </label>
                    {capsOn && (
                      <span className="text-[11px] text-amber-300/90">Caps Lock is ON</span>
                    )}
                  </div>
                  <div className="mt-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70">
                      <FiLock />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      onKeyUp={handleKeyState}
                      onKeyDown={handleKeyState}
                      onKeyPress={handleKeyState}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-10 py-3 outline-none ring-0 focus:border-fuchsia-400/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                      aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                      {showPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  {/* strength meter */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Strength</span>
                      <span
                        className={
                          strengthLabel === "Strong"
                            ? "text-emerald-300"
                            : strengthLabel === "Good"
                              ? "text-sky-300"
                              : strengthLabel === "Weak"
                                ? "text-amber-300"
                                : "text-red-300"
                        }
                      >
                        {strengthLabel}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${strengthPct}%` }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm" className="text-xs tracking-wide text-white/70">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70">
                      <FiLock />
                    </div>
                    <input
                      id="confirm"
                      name="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={form.confirm}
                      onChange={handleChange}
                      onKeyUp={handleKeyState}
                      onKeyDown={handleKeyState}
                      onKeyPress={handleKeyState}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-10 py-3 outline-none ring-0 focus:border-fuchsia-400/40 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                      aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                    >
                      {showConfirm ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Password checklist */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <ChecklistItem ok={strengthChecks.length} text="10+ characters" />
                  <ChecklistItem ok={strengthChecks.number} text="Number" />
                  <ChecklistItem ok={strengthChecks.upper} text="Uppercase letter" />
                  <ChecklistItem ok={strengthChecks.lower} text="Lowercase letter" />
                  <ChecklistItem ok={strengthChecks.symbol} text="Symbol" />
                  <ChecklistItem ok={strengthChecks.match} text="Passwords match" />
                </div>

                {/* Remember + shortcut */}
                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-white/70 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-black/30"
                    />
                    Remember me
                  </label>
                  <div className="text-xs text-white/50">
                    Press <kbd className="rounded border border-white/20 bg-white/5 px-1">Ctrl</kbd>/
                    <kbd className="rounded border border-white/20 bg-white/5 px-1">⌘</kbd>+
                    <kbd className="rounded border border-white/20 bg-white/5 px-1">Enter</kbd> to submit
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="relative w-full overflow-hidden rounded-2xl px-4 py-3 font-semibold disabled:opacity-60"
                >
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600" />
                  <span className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-400/40 via-fuchsia-400/30 to-sky-400/30 blur-md" />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    {loading && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    )}
                    {loading ? "Creating account..." : "Create account"}
                  </span>
                </motion.button>

                <div className="text-xs text-white/50 text-center">
                  By continuing, you agree to our{" "}
                  <Link to="/legal/terms" className="text-fuchsia-300 hover:text-fuchsia-200">Terms</Link>{" "}
                  and{" "}
                  <Link to="/legal/privacy" className="text-fuchsia-300 hover:text-fuchsia-200">Privacy Policy</Link>.
                </div>
              </form>
            </div>
          </div>
        </motion.div>


        {/* Footer */}
        <div className="mt-8 text-center text-white/50 text-xs">
          © {new Date().getFullYear()} Cyphire. All rights reserved.
        </div>
      </div>

      {/* FULLSCREEN LOADING OVERLAY (block interactions on network) */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
              <div className="text-white/90">Setting things up…</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

