// src/pages/Workroom.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Paperclip,
  Send,
  Loader2,
  CheckCircle2,
  RefreshCcw,
  X,
  Sparkles,
  ChevronDown,
  ThumbsUp,
  Heart,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../lib/fetch";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

/* ====== Background ====== */
const Aurora = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_70%)]" />
    <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_70%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_70%)]" />
  </div>
);

/* ====== Helpers ====== */
const bubbleCls = (mine) =>
  `max-w-[78%] px-4 py-3 rounded-2xl shadow-lg backdrop-blur-md transition relative ${mine
    ? "bg-gradient-to-br from-fuchsia-500/40 to-sky-500/30 text-fuchsia-50 border border-fuchsia-400/40 ml-auto rounded-br-sm"
    : "bg-white/10 text-white border border-white/20 rounded-bl-sm"
  }`;

const guessType = (att) => {
  const str = `${att?.type || ""} ${att?.name || ""}`.toLowerCase();
  if (str.includes("image") || /\.(png|jpe?g|gif|webp)$/.test(str)) return "image";
  if (str.includes("video") || /\.(mp4|webm|mov)$/.test(str)) return "video";
  return "file";
};

const parseJsonSafe = async (res) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  const txt = await res.text();
  throw new Error(`Unexpected ${res.status} ${res.statusText}: ${txt.slice(0, 200)}`);
};

const firstOf = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
};

const getSenderId = (m) =>
  firstOf(m, ["senderId", "userId", "authorId"]) ||
  m?.sender?._id ||
  m?.user?._id ||
  m?.author?._id;

const getMessageText = (m) =>
  firstOf(m, ["text", "content", "message", "body", "msg", "caption"]);

const getTimestamp = (m) =>
  firstOf(m, ["createdAt", "created_at", "timestamp", "time", "createdOn", "created_on", "date"]);

const getSenderName = (m, fallback = "Collaborator") =>
  firstOf(m?.sender, ["name", "displayName"]) ||
  firstOf(m?.user, ["name"]) ||
  firstOf(m?.author, ["name"]) ||
  firstOf(m, ["senderName", "name"]) ||
  fallback;

const normalizeAttachments = (m) => {
  let atts = firstOf(m, ["attachments", "files", "media", "assets", "uploads"]) || [];
  if (!Array.isArray(atts)) atts = [atts];
  return atts
    .map((a) => {
      if (typeof a === "string") {
        const name = a.split("/").pop();
        return { url: a, name, type: guessType({ name }) };
      }
      const url = firstOf(a, ["url", "path", "location", "secure_url", "src", "href"]);
      const name = a?.name || (typeof url === "string" ? url.split("/").pop() : undefined);
      const type = guessType({ type: a?.type, name });
      if (!url) return null;
      return { url, name, type };
    })
    .filter(Boolean);
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ====== Page ====== */
export default function WorkroomPage() {
  const { workroomId } = useParams();
  const navigate = useNavigate();

  const [upiVerified, setUpiVerified] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);

  const [me, setMe] = useState(null);
  const [meta, setMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reactions, setReactions] = useState({});
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [typing, setTyping] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [showUpiModal, setShowUpiModal] = useState(false);

  const listRef = useRef(null);
  const socketRef = useRef(null);
  const meId = me?._id;
  const canSend = text.trim().length > 0 || files.length > 0;

  const bothFinalised =
    !!meta?.finalisedAt || (!!meta?.clientFinalised && !!meta?.workerFinalised);

  /* ====== Payment Request ====== */
  const handleProceed = async () => {
    const handle = upiId.trim();
    if (!handle) {
      alert("Please enter your UPI ID before submitting.");
      return;
    }
    try {
      const res = await apiFetch(`${API_BASE}/api/workrooms/${workroomId}/payment-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId: handle }),
      });
      const data = await parseJsonSafe(res);
      if (res.ok && data.success) {
        setUpiId(handle);
        setShowUpiModal(false);
        setMeta((prev) => ({ ...prev, paymentRequested: true })); // add this line
        alert("✅ Success! Your payout request has been recorded.");
      } else {
        alert("⚠️ " + (data.error || data.message || "Failed to request payout"));
      }

    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  /* ====== Fetch me + meta ====== */
  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }),
          fetch(`${API_BASE}/api/workrooms/${workroomId}/meta`, { credentials: "include" }),
        ]);
        setMe((await r1.json())?.user || null);
        setMeta(await r2.json());
      } catch (err) {
        console.error("Meta fetch error", err);
      }
    })();
  }, [workroomId]);

  /* ====== Socket ====== */
  useEffect(() => {
    const s = io(API_BASE, { withCredentials: true });
    socketRef.current = s;
    s.emit("workroom:join", { workroomId });

    s.on("message:new", (msg) => {
      setItems((prev) => [...prev, msg]);
      if (atBottom) scrollToBottom();
    });

    s.on("typing", (d) => {
      if (d?.workroomId === workroomId && d?.userId !== meId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1000);
      }
    });

    return () => s.disconnect();
  }, [workroomId, meId, atBottom]);

  /* ====== Scroll helpers ====== */
  const scrollToBottom = () =>
    requestAnimationFrame(() =>
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    );

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 40);
  };

  /* ====== Messages ====== */
  const fetchMessages = useCallback(
    async (forceScroll = false) => {
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE}/api/workrooms/${workroomId}/messages`, {
          credentials: "include",
        });
        const d = await parseJsonSafe(r);
        const list = d.items || d.messages || d.data || [];
        setItems(list);
        const shouldScroll = forceScroll || atBottom;
        if (shouldScroll) setTimeout(scrollToBottom, 10);
      } catch (e) {
        console.warn("Message fetch error", e);
      } finally {
        setLoading(false);
      }
    },
    [workroomId, atBottom]
  );

  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  /* ====== Send ====== */
  const onSend = async () => {
    if (sending || bothFinalised || !canSend) return;
    setSending(true);
    try {
      const trimmed = text.trim();
      const form = new FormData();
      if (trimmed) form.append("text", trimmed);
      files.forEach((f) => form.append("attachments", f));

      const r = await apiFetch(`${API_BASE}/api/workrooms/${workroomId}/messages`, {
        method: "POST",
        body: form,
      });
      if (!r.ok) throw new Error(`Send failed: ${r.status} ${r.statusText}`);
      const d = await parseJsonSafe(r);
      const newMsg = d?.message || d?.item || d?.data || d?.msg;
      if (newMsg) {
        setItems((p) => [...p, newMsg]);
        scrollToBottom();
      }
      setText("");
      setFiles([]);
    } catch (e) {
      console.error("Send error", e);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const onTyping = () => socketRef.current?.emit("typing", { workroomId, userId: meId });

  /* ====== Drag & Drop ====== */
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer?.files || []);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  };

  /* ====== UI ====== */
  if (meta?.paymentRequested) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-black text-gray-100">
        <div className="text-center p-10 rounded-3xl border border-emerald-400/30 bg-emerald-900/20 shadow-lg">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-emerald-300">Task Completed</h1>
          <p className="mt-2 text-white/70">
            This workroom has been closed. The payout request has been recorded.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-black text-gray-100">
      <Aurora />
      <main className="relative mx-auto max-w-6xl px-4 pt-20 pb-10 sm:pt-24">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
                {meta?.title || "Workroom"}
              </h1>
              <p className="text-xs text-white/60">Room ID: {workroomId}</p>
            </div>
            <div className="grid gap-2 text-[11px] text-white/70 sm:grid-cols-2 lg:grid-cols-3">
              <span className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
                {meta?.role === "client" ? "You are the client" : "You are the selected freelancer"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5">
                Budget&nbsp;
                <strong className="font-semibold text-white/80">{formatCurrency(meta?.price)}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5">
                Deadline&nbsp;
                <strong className="font-semibold text-white/80">{formatDate(meta?.deadline)}</strong>
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:w-auto md:justify-end">
            <button
              onClick={() => fetchMessages(true)}
              className="px-3 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>

            {!bothFinalised && (
              <>
                {meta?.role === "client" && !meta?.clientFinalised && (
                  <button
                    onClick={async () => {
                      await apiFetch(`${API_BASE}/api/workrooms/${workroomId}/finalise`, {
                        method: "POST",

                      });
                      fetchMessages(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 font-semibold"
                  >
                    Finalize (Client)
                  </button>
                )}
                {meta?.role === "worker" && !meta?.workerFinalised && (
                  <button
                    onClick={async () => {
                      await apiFetch(`${API_BASE}/api/workrooms/${workroomId}/finalise`, {
                        method: "POST",
                      });
                      fetchMessages(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 font-semibold"
                  >
                    Finalize (Freelancer)
                  </button>
                )}
              </>
            )}

            {bothFinalised && meta?.role === "client" && (
              <div className="flex items-center gap-2 text-emerald-300 font-medium">
                <CheckCircle2 className="h-5 w-5" /> Finalized
              </div>
            )}

            {bothFinalised && meta?.role === "worker" && (
              (taskCompleted || meta?.paymentRequested) ? (
                <div className="flex items-center gap-2 text-emerald-300 font-medium">
                  <CheckCircle2 className="h-5 w-5" /> Task Completed
                </div>
              ) : (
                <button
                  onClick={() => setShowUpiModal(true)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold"
                >
                  Proceed & Receive Payment
                </button>
              )
            )}


          </div>
        </div>

        {/* ====== UPI Overlay with AnimatePresence ====== */}
        <AnimatePresence>
          {showUpiModal && (
            <motion.div
              key="upi-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 240, damping: 24 }}
                className="relative bg-gradient-to-b from-[#1a1a1f] to-[#0f0f13] border border-fuchsia-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(139,92,246,0.5)] text-center"
              >
                <button
                  onClick={() => setShowUpiModal(false)}
                  className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-sky-500 shadow-lg shadow-fuchsia-500/40 mb-5">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>

                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
                  Enter your UPI ID
                </h2>
                <p className="text-sm text-white/60 mb-6">
                  Your payout will be processed to this UPI handle after verification.
                </p>

                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full mb-6 rounded-xl border border-fuchsia-500/40 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                />

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setShowUpiModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowUpiModal(false);
                      setVerifyingUpi(true);
                      await handleProceed();
                      setUpiVerified(true);   // mark as verified
                    }}

                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg transition"
                  >
                    Submit & Notify
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====== Verifying / Verified Overlay ====== */}
        <AnimatePresence>
          {verifyingUpi && (
            <motion.div
              key="verifying-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
            >
              {!upiVerified ? (
                // While verifying
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white/80 text-lg font-medium">Verifying your UPI…</p>
                </motion.div>
              ) : (
                // After verified
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">UPI Verified</h3>
                  <p className="text-l text-white/70">
                    Your payout will be sent within{" "}
                    <span className="text-white font-medium">2–3 business days</span>.
                  </p>
                  <button
                    onClick={() => {
                      setVerifyingUpi(false);
                      setUpiVerified(false);
                      setTaskCompleted(true); // mark task as completed

                      // ✅ redirect based on environment
                      if (import.meta.env.DEV) {
                        // Localhost
                        window.location.href = "http://localhost:5173/dashboard";
                      } else {
                        // Production
                        window.location.href = "https://cyphire-frontend.vercel.app/dashboard";
                      }
                    }}
                    className="mt-4 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg hover:scale-105 transition"
                  >
                    Done
                  </button>


                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>


        {/* ====== Chat Box ====== */}
        <div
          className={`relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl shadow-lg transition ${dragOver ? "ring-2 ring-fuchsia-400/50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-[60vh] overflow-y-auto px-4 pb-6 pt-4 space-y-3 scroll-smooth sm:h-[65vh] lg:h-[70vh]"
          >
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`h-10 w-1/2 rounded-xl ${i % 2 ? "ml-auto bg-fuchsia-900/30" : "bg-white/10"}`} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/50">
                <Sparkles className="h-10 w-10 mb-2 animate-pulse" />
                <p>No messages yet</p>
              </div>
            ) : (
              <AnimatePresence>
                {items.map((m, idx) => {
                  const key = m._id || m.id || String(idx);
                  const currentSenderId = getSenderId(m);
                  const mine = String(currentSenderId || "") === String(meId || "");
                  const previousSenderId = idx > 0 ? getSenderId(items[idx - 1]) : null;
                  const showSenderLabel =
                    String(previousSenderId || "") !== String(currentSenderId || "") || idx === 0;
                  const senderName = mine ? "You" : getSenderName(m);
                  const timestamp = getTimestamp(m);
                  const parsedTs = timestamp ? new Date(timestamp) : null;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={bubbleCls(mine)}>
                        {showSenderLabel && (
                          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-wider text-white/50">
                            <span>{senderName}</span>
                            {parsedTs && !Number.isNaN(parsedTs.getTime()) && (
                              <span className="text-white/40">
                                {parsedTs.toLocaleString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </span>
                            )}
                          </div>
                        )}
                        {getMessageText(m) && (
                          <p className="whitespace-pre-wrap leading-relaxed">{getMessageText(m)}</p>
                        )}
                        {(() => {
                          const atts = normalizeAttachments(m);
                          return atts.length > 0 ? (
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {atts.map((att, i) => (
                                <div key={i} className="overflow-hidden rounded-xl border border-white/20 bg-black/20">
                                  {att.type === "image" ? (
                                    <a href={att.url} target="_blank" rel="noreferrer">
                                      <img
                                        src={att.url}
                                        alt={att.name || "image"}
                                        loading="lazy"
                                        className="max-h-48 w-full object-cover"
                                      />
                                    </a>
                                  ) : att.type === "video" ? (
                                    <video src={att.url} controls className="max-h-48 w-full" />
                                  ) : (
                                    <a href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 text-xs hover:bg-white/10">
                                      <Paperclip className="h-4 w-4" /> {att.name || "attachment"}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}
                        {/* Reactions */}
                        <div className="flex gap-2 mt-1 text-xs">
                          {(() => {
                            const sel = reactions[key];
                            const set = (type) =>
                              setReactions((prev) => ({ ...prev, [key]: prev[key] === type ? undefined : type }));
                            return (
                              <>
                                <button
                                  className={`${sel === "like" ? "text-fuchsia-300" : "text-white/70 hover:text-fuchsia-300"}`}
                                  onClick={() => set("like")}
                                  title="Like"
                                >
                                  <ThumbsUp size={14} />
                                </button>
                                <button
                                  className={`${sel === "heart" ? "text-rose-400" : "text-white/70 hover:text-rose-400"}`}
                                  onClick={() => set("heart")}
                                  title="Love"
                                >
                                  <Heart size={14} />
                                </button>
                                <button
                                  className={`${sel === "fire" ? "text-orange-400" : "text-white/70 hover:text-orange-400"}`}
                                  onClick={() => set("fire")}
                                  title="Fire"
                                >
                                  <Flame size={14} />
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Scroll to bottom */}
          {!atBottom && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-24 right-4 bg-gradient-to-r from-fuchsia-600 to-sky-600 text-white p-2 rounded-full shadow-lg animate-bounce"
            >
              <ChevronDown />
            </button>
          )}

          {/* Composer */}
          <div className="border-t border-white/10 px-4 py-4 space-y-3 sm:px-6">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => {
                  const t = guessType(f);
                  const url = URL.createObjectURL(f);
                  return (
                    <div
                      key={i}
                      className="flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 p-2 sm:w-auto sm:min-w-[220px]"
                    >
                      {t === "image" ? (
                        <img
                          src={url}
                          alt={f.name}
                          className="h-10 w-10 object-cover rounded"
                          onLoad={() => URL.revokeObjectURL(url)}
                        />
                      ) : t === "video" ? (
                        <video src={url} className="h-10 w-10 rounded" onLoadedData={() => URL.revokeObjectURL(url)} />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                      <span className="truncate max-w-[150px] text-xs" title={f.name}>
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="ml-auto rounded-full bg-white/10 p-1 text-white/70 transition hover:bg-white/20 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
              <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/15 sm:w-auto">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files)])}
                />
              </label>
              <textarea
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  onTyping();
                }}
                placeholder="Type a message..."
                className="w-full flex-1 resize-none rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm leading-6 text-white placeholder:text-white/40 focus:border-fuchsia-400/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />

              <button
                onClick={onSend}
                disabled={sending || !canSend || bothFinalised}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 px-5 py-3 text-sm font-semibold transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto sm:px-6 sm:py-2"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
            {typing && <div className="pl-2 text-xs text-white/60 animate-pulse">Typing...</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
