import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function Signup() {
  const navigate = useNavigate();

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);

  // ui state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // optional: receive token from Google OAuth popup (if you implement popup flow)
  useEffect(() => {
    const onMsg = (e) => {
      // You should verify e.origin in production
      const { token, user, error } = e.data || {};
      if (error) {
        setErr(error || "Google sign-in failed");
        setLoading(false);
        return;
      }
      if (token) {
        const store = remember ? localStorage : sessionStorage;
        store.setItem("token", token);
        if (user?.id) store.setItem("userId", user.id);
        navigate("/home");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [remember, navigate]);

  const validate = () => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to sign up");
      }

      const data = await res.json();
      const store = remember ? localStorage : sessionStorage;
      if (data?.token) {
        store.setItem("token", data.token);
      }
      if (data?.user?.id) {
        store.setItem("userId", data.user.id);
      }

      navigate("/home");
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setErr("");
    setLoading(true);

    // OPTION A (simplest): full-page redirect to your backend OAuth entry
    // After successful auth, have backend redirect back to your app
    // (e.g. /oauth/success?token=...) and store the token there.
    window.location.href = `${API_BASE}/api/auth/google?mode=signup&remember=${remember ? 1 : 0}`;


    // OPTION B (popup): open a popup and use postMessage from your callback page.
    // const w = window.open(`${API_BASE}/api/auth/google?mode=signup&popup=true`, "_blank", "width=500,height=650");
    // (Your OAuth callback should call: window.opener.postMessage({ token, user }, "<your-app-origin>"); window.close();)
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* subtle blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-sky-500/30 blur-xl" />
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-white/60 mt-2">Join Cyphire in a minute</p>
          </div>

          {err ? (
            <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {err}
            </div>
          ) : null}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15 disabled:opacity-60"
          >
            {/* Google "G" */}
            <svg width="18" height="18" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg" className="-ml-1">
              <path fill="#4285F4" d="M255.9 133.5c0-10.1-.9-17.5-2.9-25.2H130.6v45.7h71.7c-1.4 11.4-9 28.6-26 40.1l-.2 1.2 37.8 29.3 2.6.3c24.1-22.2 38.1-54.8 38.1-91.4"/>
              <path fill="#34A853" d="M130.6 261.1c34.5 0 63.5-11.4 84.6-31.1l-40.3-31.2c-10.8 7.5-25.3 12.8-44.3 12.8-33.9 0-62.7-22.2-73-52.9l-1.2.1-39.4 30.5-.5 1.1c20.6 41 63 70.7 114.1 70.7"/>
              <path fill="#FBBC05" d="M57.6 158.7c-2.7-7.8-4.2-16.2-4.2-24.7s1.5-16.9 4.1-24.7l-.1-1.7-39.9-30.9-1.3.6C7.1 93.5 0 115 0 134c0 19 7.1 40.5 15.9 56.6l41.7-31.9"/>
              <path fill="#EB4335" d="M130.6 50.5c24 0 40.2 10.4 49.5 19.2l36.1-35.3C194 12.7 165.1 0 130.6 0 79.6 0 37.1 29.7 16.5 70.7l41.1 31.9c10.4-30.7 39.2-52.1 72.9-52.1"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-4 text-white/50">
            <span className="h-px w-full bg-white/10" />
            <span className="text-xs">or</span>
            <span className="h-px w-full bg-white/10" />
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Name</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none ring-0 focus:border-fuchsia-400/40"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none ring-0 focus:border-fuchsia-400/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none ring-0 focus:border-fuchsia-400/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-white/40 mt-1">8+ characters recommended</p>
            </div>

            <div>
              <label className="text-sm text-white/70">Confirm Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none ring-0 focus:border-fuchsia-400/40"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
            </div>

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

              <Link to="/signin" className="text-sm text-fuchsia-300 hover:text-fuchsia-200">
                Already have an account?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className="w-full rounded-xl px-4 py-3 font-semibold disabled:opacity-60 relative"
            >
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600" />
              <span className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-violet-400/40 via-fuchsia-400/30 to-sky-400/30 blur-md" />
              <span className="relative">{loading ? "Creating account..." : "Create account"}</span>
            </motion.button>
          </form>
        </div>
      </motion.div>

      {/* Fullscreen overlay while loading */}
      {loading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
            <div className="text-white/90">Setting things up…</div>
          </div>
        </div>
      )}
    </div>
  );
}
