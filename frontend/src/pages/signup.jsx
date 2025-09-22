/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";


export default function Signup() {
  const navigate = useNavigate();

  // form state
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [remember, setRemember] = useState(true);

  // ui state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // unified setter
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validate = useCallback(() => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return "";
  }, [form]);

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
        store.setItem("loginTime", Date.now().toString());  
        navigate("/home");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [remember, navigate]);

  const handleEmailSignup = useCallback(
    async (e) => {
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
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to sign up");

        const store = remember ? localStorage : sessionStorage;
        if (data?.token) store.setItem("token", data.token);
        if (data?.user?.id) store.setItem("userId", data.user.id);
        store.setItem("loginTime", Date.now().toString());  

        navigate("/home");
      } catch (e) {
        setErr(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [form, remember, navigate, validate]
  );

  const handleGoogle = useCallback(() => {
    setErr("");
    setLoading(true);
    window.location.href = `${API_BASE}/api/auth/google?mode=signup&remember=${remember ? 1 : 0}`;
  }, [remember]);

  // Pre-memoize form fields config (faster reconciliation)
  const fields = useMemo(
    () => [
      { label: "Name", type: "text", name: "name", placeholder: "Ada Lovelace", autoComplete: "name" },
      { label: "Email", type: "email", name: "email", placeholder: "you@company.com", autoComplete: "email" },
      { label: "Password", type: "password", name: "password", placeholder: "Create a strong password", autoComplete: "new-password" },
      { label: "Confirm Password", type: "password", name: "confirm", placeholder: "Re-enter your password", autoComplete: "new-password" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* subtle blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-sky-500/30 blur-xl" />
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="text-white/60 mt-2">Join Cyphire in a minute</p>
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

          <form onSubmit={handleEmailSignup} className="space-y-4">
            {fields.map(({ label, type, name, placeholder, autoComplete }) => (
              <div key={name}>
                <label className="text-sm text-white/70">{label}</label>
                <input
                  type={type}
                  name={name}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none ring-0 focus:border-fuchsia-400/40"
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  required
                />
                {name === "password" && (
                  <p className="text-xs text-white/40 mt-1">8+ characters recommended</p>
                )}
              </div>
            ))}

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
