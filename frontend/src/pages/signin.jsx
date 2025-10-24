/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiZap,
  FiArrowRight,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

/* ─────────────────────── helpers (security/a11y) ─────────────────────── */
function deviceFingerprint() {
  try {
    const ua = navigator.userAgent || "na";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "na";
    const lang = navigator.language || "na";
    const plat = navigator.platform || "na";
    const seed = `${ua}|${tz}|${lang}|${plat}`;
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h << 5) - h + seed.charCodeAt(i);
      h |= 0;
    }
    return `dfp_${Math.abs(h)}`;
  } catch {
    return "dfp_na";
  }
}

/* ─────────────────────── component ─────────────────────── */
export default function Signin() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = useMemo(() => {
    const next = new URLSearchParams(location.search || "").get("next");
    if (next && next.startsWith("/")) return next;
    return "/choose";
  }, [location.search]);

  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const emailRef = useRef(null);
  const pwdRef = useRef(null);

  // Disable right-click
  useEffect(() => {
    const onCtx = (e) => e.preventDefault();
    document.addEventListener("contextmenu", onCtx);
    return () => document.removeEventListener("contextmenu", onCtx);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }, []);

  const handleKeyState = useCallback((e) => {
    const cl = e.getModifierState && e.getModifierState("CapsLock");
    setCapsOn(!!cl);
    if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "enter") {
      const btn = document.getElementById("signinSubmitBtn");
      btn?.click();
    }
  }, []);

  const blockClipboard = useCallback((e) => e.preventDefault(), []);

  /* ─────────────────────── network actions ─────────────────────── */
  const handleGoogle = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 300));
      const next = encodeURIComponent(redirectPath);
      const rememberFlag = remember ? 1 : 0;
      const dfp = deviceFingerprint();
      window.location.href = `${API_BASE}/api/auth/google?mode=signin&remember=${rememberFlag}&dfp=${encodeURIComponent(
        dfp
      )}&next=${next}`;
    } catch {
      setLoading(false);
      toast.error("Google sign-in failed");
    }
  }, [redirectPath, remember]);

  const handleEmailSignin = useCallback(
    async (e) => {
      e.preventDefault();
      if (!form.email || !form.password) {
        toast.error("Enter your email and password.");
        (!form.email ? emailRef.current : pwdRef.current)?.focus();
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/signin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-Fingerprint": deviceFingerprint(),
          },
          credentials: "include",
          body: JSON.stringify({ ...form, rememberMe: remember }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Login failed");

        /* your original storage / cookie pattern */
        const store = remember ? localStorage : sessionStorage;
        if (data?.user?.id) store.setItem("userId", data.user.id);
        if (data?.user?.name) store.setItem("userName", data.user.name);
        if (data?.user?.email) store.setItem("userEmail", data.user.email);
        store.setItem("loginTime", Date.now().toString());

        toast.success("Welcome back!");
        navigate(redirectPath, { replace: true });
      } catch (err) {
        toast.error(err.message || "Sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [form, navigate, redirectPath, remember]
  );

  /* ─────────────────────── UI ─────────────────────── */
  return (
    <div className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/20 blur-[120px]" />
      <div className="absolute -bottom-44 -right-40 h-[30rem] w-[30rem] rounded-full bg-sky-500/25 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-5xl relative z-10"
      >
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-sky-500/30 blur-xl" />
        <div className="relative flex flex-col lg:flex-row overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          {/* LEFT side – Welcome Back / Stats */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="flex-1 bg-gradient-to-br from-[#100018]/70 via-[#080015]/70 to-[#001020]/70 p-8 lg:p-12 flex flex-col justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-white/95">
                Welcome back to <span className="text-fuchsia-300">Cyphire</span>.
              </h1>
              <p className="mt-3 text-white/70 max-w-sm">
                Continue your journey of innovation, collaboration, and lightning-fast
                productivity.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1">
                  <FiClock className="text-fuchsia-300" />
                  <span className="text-white/80 font-medium">Avg. task time</span>
                  <span className="text-white/60 text-xs">2.1x faster this week</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1">
                  <FiTrendingUp className="text-sky-300" />
                  <span className="text-white/80 font-medium">Team performance</span>
                  <span className="text-white/60 text-xs">Up by 34%</span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 text-sm text-white/60"
            >
              “The best way to predict the future is to create it.” — Cyphire Labs
            </motion.div>
          </motion.div>

          {/* RIGHT side – Form */}
          <div className="flex-1 p-8 lg:p-12 bg-[#070710]/80 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl md:text-3xl font-semibold">Sign in securely</h2>
                <p className="text-white/60 mt-2">
                  Your data is protected with enterprise-grade encryption.
                </p>
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                aria-label="Continue with Google"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15 disabled:opacity-60"
              >
                <FcGoogle size={22} />
                {!loading && <span>Continue with Google</span>}
                {loading && (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                )}
              </button>

              <div className="my-5 flex items-center gap-4 text-white/50">
                <span className="h-px w-full bg-white/10" />
                <span className="text-xs">or</span>
                <span className="h-px w-full bg-white/10" />
              </div>

              <form onSubmit={handleEmailSignin} noValidate className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="text-sm text-white/70">
                    Email
                  </label>
                  <div className="relative mt-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                      <FiMail />
                    </div>
                    <input
                      ref={emailRef}
                      type="email"
                      name="email"
                      id="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                      aria-invalid={!form.email}
                      aria-describedby="email_help"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-10 py-3 outline-none ring-0 focus:border-fuchsia-400/40"
                    />
                  </div>
                  <div id="email_help" aria-live="polite" className="text-xs text-emerald-300 h-4">
                    {form.email && form.email.includes("@") ? "Looks good ✓" : ""}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm text-white/70">
                      Password
                    </label>
                    {capsOn && (
                      <span className="text-[11px] text-amber-300/90">Caps Lock is ON</span>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                      <FiLock />
                    </div>
                    <input
                      ref={pwdRef}
                      type={showPwd ? "text" : "password"}
                      name="password"
                      id="password"
                      value={form.password}
                      onChange={handleChange}
                      onKeyUp={handleKeyState}
                      onKeyDown={handleKeyState}
                      onKeyPress={handleKeyState}
                      onPaste={blockClipboard}
                      onCopy={blockClipboard}
                      onCut={blockClipboard}
                      onDrop={blockClipboard}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      aria-invalid={!form.password}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-10 py-3 outline-none ring-0 focus:border-fuchsia-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      aria-label={showPwd ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      {showPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Options */}
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
                  <Link
                    to="/reset"
                    className="text-sm text-white/60 hover:text-white/80"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit */}
                <motion.button
                  id="signinSubmitBtn"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="relative w-full overflow-hidden rounded-xl px-4 py-3 font-semibold disabled:opacity-60"
                >
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600" />
                  <span className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-400/40 via-fuchsia-400/30 to-sky-400/30 blur-md" />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    {loading && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                    )}
                    {loading ? "Signing in…" : "Sign in"}
                  </span>
                </motion.button>
              </form>

              <div className="mt-5 text-center text-sm text-white/70">
                New to Cyphire?{" "}
                <Link
                  to="/signup"
                  className="text-fuchsia-300 hover:text-fuchsia-200"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overlay Spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
              <div className="text-white/90">Authenticating…</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
