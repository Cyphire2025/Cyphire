import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";


const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";



export default function Signin() {
  const navigate = useNavigate();

  // form state
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(true);

  // ui state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    const onMsg = (e) => {
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

  const handleEmailSignin = useCallback(
    async (e) => {
      e.preventDefault();
      setErr("");
      if (!form.email || !form.password) {
        setErr("Enter your email and password.");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Login failed");

        navigate("/home");
      } catch (e) {
        setErr(e.message || "Sign in failed");
      } finally {
        setLoading(false);
      }
    },
    [form, navigate]
  );

  const handleGoogle = useCallback(() => {
    setErr("");
    setLoading(true);
    window.location.href = `${API_BASE}/api/auth/google?mode=signin&remember=${remember ? 1 : 0}`;
  }, [remember]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-sky-500/30 blur-xl" />
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-white/60 mt-2">Sign in to continue</p>
          </div>

          {err && (
            <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15 disabled:opacity-60"
          >
            <FcGoogle size={25} />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-4 text-white/50">
            <span className="h-px w-full bg-white/10" />
            <span className="text-xs">or</span>
            <span className="h-px w-full bg-white/10" />
          </div>

          <form onSubmit={handleEmailSignin} className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Email</label>
              <input
                type="email"
                name="email"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none ring-0 focus:border-fuchsia-400/40"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Password</label>
              <input
                type="password"
                name="password"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none ring-0 focus:border-fuchsia-400/40"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
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

              <Link to="/reset" className="text-sm text-white/60 hover:text-white/80">
                Forgot password?
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
              <span className="relative">{loading ? "Signing in…" : "Sign in"}</span>
            </motion.button>
          </form>

          <div className="mt-4 text-center text-sm text-white/70">
            New to Cyphire?{" "}
            <Link to="/signup" className="text-fuchsia-300 hover:text-fuchsia-200">
              Create an account
            </Link>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
            <div className="text-white/90">Authenticating…</div>
          </div>
        </div>
      )}
    </div>
  );
}
