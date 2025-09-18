// src/pages/Workroom.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";
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

// Parse JSON only when response is JSON; otherwise surface text with status
const parseJsonSafe = async (res) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await res.json();
  }
  const txt = await res.text();
  const snippet = txt.slice(0, 300);
  throw new Error(`Unexpected ${res.status} ${res.statusText}. Non-JSON response: ${snippet}`);
};

// Safely extract common message fields regardless of backend naming
const firstOf = (obj, keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
};

const getSenderId = (m) => firstOf(m, ["senderId", "userId", "authorId"]) || m?.sender?._id || m?.user?._id || m?.author?._id;
const getMessageText = (m) => firstOf(m, ["text", "content", "message", "body", "msg", "caption"]);
const getTimestamp = (m) => firstOf(m, ["createdAt", "created_at", "timestamp", "time", "createdOn", "created_on", "date"]);

// Normalize attachments to array of { url, name, type }
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

/* ====== Page ====== */
export default function WorkroomPage() {
  const { workroomId } = useParams();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [meta, setMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reactions, setReactions] = useState({}); // key: messageId -> 'like' | 'heart' | 'fire'

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [typing, setTyping] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const listRef = useRef(null);
  const socketRef = useRef(null);
  const meId = me?._id;

  const bothFinalised =
    !!meta?.finalisedAt || (!!meta?.clientFinalised && !!meta?.workerFinalised);

  const [upiId, setUpiId] = useState("");
  const [showUpiModal, setShowUpiModal] = useState(false);
  const handleProceed = async () => {
    const handle = upiId.trim();
    if (!handle) {
      alert("Please enter your UPI ID before submitting.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/workrooms/${workroomId}/payment-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ upiId: handle }),
      });
      const data = await parseJsonSafe(res);
      if (res.ok && data.success) {
        setUpiId(handle);
        setShowUpiModal(false);
        alert("Success! Your payout request has been recorded. Expect an update within 2-3 business days.");
      } else {
        alert("Heads up: " + (data.error || data.message || "Failed to request payout"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again shortly.");
    }
  };


  /* ====== Fetch me + meta ====== */
  useEffect(() => {
    (async () => {
      const [r1, r2] = await Promise.all([
        fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }),
        fetch(`${API_BASE}/api/workrooms/${workroomId}/meta`, { credentials: "include" }),
      ]);
      setMe((await r1.json())?.user || null);
      setMeta(await r2.json());
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
        setTimeout(() => setTyping(false), 2000);
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
  const fetchMessages = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/workrooms/${workroomId}/messages`, {
        credentials: "include",
      });
      const d = await parseJsonSafe(r);
      const list = d.items || d.messages || d.data || [];
      setItems(list);
      setLoading(false);
      if (atBottom) setTimeout(scrollToBottom, 10);
    } catch (e) {
      // ignore network errors in polling, but log once in dev
      if (import.meta.env?.DEV) console.warn("poll error", e);
    }
  }, [workroomId, atBottom]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /* ====== Send ====== */
  const onSend = async () => {
    if (sending || bothFinalised) return;
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {

      const trimmed = text.trim();
      const form = new FormData();
      if (trimmed) {
        form.append("text", trimmed);   // keep only one text field
      }
      files.forEach((f) => {
        form.append("attachments", f);  // keep only one attachments field
      });

      const r = await fetch(`${API_BASE}/api/workrooms/${workroomId}/messages`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      // Better error surfacing for non-JSON or error pages
      if (!r.ok) {
        const ct = r.headers.get("content-type") || "";
        const body = ct.includes("application/json") ? await r.json() : await r.text();
        const msg = typeof body === "string" ? body.slice(0, 300) : (body?.error || body?.message || JSON.stringify(body).slice(0, 300));
        let hint = "";
        if (r.status === 413) hint = " (file too large)";
        if (r.status === 401 || r.status === 403) hint = " (not authenticated/authorized)";
        if (r.status === 404) hint = " (endpoint not found — check VITE_API_BASE)";
        throw new Error(`Upload failed: ${r.status} ${r.statusText}${hint}. ${msg}`);
      }

      const d = await parseJsonSafe(r);
      const newMsg = d?.message || d?.item || d?.data || d?.msg;
      if (newMsg) {
        setItems((p) => [...p, newMsg]);
        scrollToBottom();
      }
      setText("");
      setFiles([]);
    } catch (e) {
      console.error("send error", e);
      alert(e?.message || "Failed to send. See console for details.");
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
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-black text-gray-100">
      <Aurora />
      <main className="relative mx-auto max-w-6xl px-4 pt-20 pb-10 sm:pt-24">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-[0_30px_80px_-40px_rgba(139,92,246,0.6)] md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              Workroom
            </h1>
            <p className="text-xs text-white/60">Room: {workroomId}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:w-auto md:justify-end">
            <button
              onClick={fetchMessages}
              className="px-3 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>

            {!bothFinalised && (
              <>
                {meta?.role === "client" && !meta?.clientFinalised && (
                  <button
                    onClick={async () => {
                      await fetch(`${API_BASE}/api/workrooms/${workroomId}/finalise`, {
                        method: "POST",
                        credentials: "include",
                      });
                      fetchMessages();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 font-semibold"
                  >
                    Finalize (Client)
                  </button>
                )}
                {meta?.role === "worker" && !meta?.workerFinalised && (
                  <button
                    onClick={async () => {
                      await fetch(`${API_BASE}/api/workrooms/${workroomId}/finalise`, {
                        method: "POST",
                        credentials: "include",
                      });
                      fetchMessages();
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
              <button
                onClick={() => setShowUpiModal(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold"
              >
                Proceed & Receive Payment
              </button>
            )}
          </div>
        </div>

        {/* ====== UPI Modal ====== */}
        <AnimatePresence>
          {showUpiModal &&
            ReactDOM.createPortal(
              <motion.div
                key="upi-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-lg"
                onClick={() => setShowUpiModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 240, damping: 24 }}
                  className="relative z-[100000] w-full max-w-md overflow-hidden rounded-3xl 
                             border border-white/20 bg-gradient-to-br 
                             from-[#11111a]/90 via-[#0f0f18]/90 to-[#0a0a12]/90 p-6 
                             shadow-[0_40px_120px_-40px_rgba(58,16,143,0.9)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setShowUpiModal(false)}
                    className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500/40 to-sky-500/40 text-white">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">Enter your UPI ID</h3>
                      <p className="text-xs text-white/60">We will nudge the payout as soon as it clears.</p>
                    </div>
                  </div>

                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    UPI Handle
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-fuchsia-400/50 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
                  />

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowUpiModal(false)}
                      className="rounded-xl border border-white/10 px-5 py-2 text-sm text-white/80 hover:border-white/30 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProceed}
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
                    >
                      Submit & Notify
                    </button>
                  </div>
                </motion.div>
              </motion.div>,
              document.body
            )}
        </AnimatePresence>
        {/* Chat */}
        <div
          className={` rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_50px_120px_-60px_rgba(14,165,233,0.45)] transition ${dragOver ? "ring-2 ring-fuchsia-400/50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-[60vh] overflow-y-auto px-4 pb-6 pt-4 pr-2 space-y-3 scroll-smooth sm:h-[65vh] lg:h-[70vh]"
          >
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-10 w-1/2 rounded-xl ${i % 2 ? "ml-auto bg-fuchsia-900/30" : "bg-white/10"}`}
                  ></div>
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
                  const mine = String(getSenderId(m) || "") === String(meId || "");
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={bubbleCls(mine)}>
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
                                      <img src={att.url} alt={att.name || "image"} className="max-h-48 w-full object-cover" />
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
                        {(() => {
                          const ts = getTimestamp(m);
                          const d = ts ? new Date(ts) : null;
                          const valid = d && !Number.isNaN(d.getTime());
                          return valid ? (
                            <p className="text-[10px] text-white/40 mt-1">{d.toLocaleTimeString()}</p>
                          ) : null;
                        })()}
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
                    <div key={i} className="flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 p-2 sm:w-auto sm:min-w-[220px]">
                      {t === "image" ? (
                        <img src={url} alt={f.name} className="h-10 w-10 object-cover rounded" onLoad={() => URL.revokeObjectURL(url)} />
                      ) : t === "video" ? (
                        <video src={url} className="h-10 w-10 rounded" onLoadedData={() => URL.revokeObjectURL(url)} />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                      <span className="truncate max-w-[150px] text-xs" title={f.name}>{f.name}</span>
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
                  onChange={(e) =>
                    setFiles((prev) => [...prev, ...Array.from(e.target.files)])
                  }
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
                    e.preventDefault(); // prevent newline
                    onSend();           // send message
                  }
                }}
              />

              <button
                onClick={onSend}
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 px-5 py-3 text-sm font-semibold transition hover:scale-105 disabled:opacity-50 sm:w-auto sm:px-6 sm:py-2"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
            {typing && (
              <div className="pl-2 text-xs text-white/60 animate-pulse">Typing...</div>
            )}

          </div>
          
        </div>
      </main>
    </div>
  );
}



