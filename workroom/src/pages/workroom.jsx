// src/pages/Workroom.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
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
      const d = await r.json();
      const list = d.items || d.messages || [];
      setItems(list);
      setLoading(false);
      if (atBottom) setTimeout(scrollToBottom, 10);
    } catch (e) {
      // ignore network errors in polling
    }
  }, [workroomId, atBottom]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll every 1s to reflect new messages
  useEffect(() => {
    const id = setInterval(fetchMessages, 1000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  /* ====== Send ====== */
  const onSend = async () => {
    if (sending || bothFinalised) return;
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      const form = new FormData();
      const trimmed = text.trim();
      if (trimmed) {
        // Send with multiple common keys for backend compatibility
        form.append("text", trimmed);
        form.append("content", trimmed);
        form.append("message", trimmed);
        form.append("body", trimmed);
      }
      files.forEach((f) => {
        form.append("attachments", f);
        form.append("files", f);
        form.append("uploads", f);
      });
      const r = await fetch(`${API_BASE}/api/workrooms/${workroomId}/messages`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const d = await r.json();
      if (r.ok && d?.message) {
        setItems((p) => [...p, d.message]);
        scrollToBottom();
      }
      setText("");
      setFiles([]);
    } catch (e) {
      alert(e.message);
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
    <div className="min-h-screen bg-gradient-to-b from-[#08080d] via-[#0b0b13] to-black text-gray-100">
      <Aurora />
      <main className="relative pt-24 pb-10 mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              Workroom
            </h1>
            <p className="text-xs text-white/60">Room: {workroomId}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchMessages}
              className="px-3 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/20 flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
            {bothFinalised ? (
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-5 w-5" /> Finalized
              </div>
            ) : (
              <button
                onClick={async () =>
                  await fetch(`${API_BASE}/api/workrooms/${workroomId}/finalise`, {
                    method: "POST",
                    credentials: "include",
                  })
                }
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 font-semibold"
              >
                Finalize
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div
          className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl ${dragOver ? "ring-2 ring-fuchsia-400/50" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-[65vh] overflow-y-auto p-4 space-y-3"
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
                            <div className="mt-2 grid grid-cols-2 gap-2">
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
          <div className="border-t border-white/10 p-3 space-y-2">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => {
                  const t = guessType(f);
                  const url = URL.createObjectURL(f);
                  return (
                    <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg p-2">
                      {t === "image" ? (
                        <img src={url} alt={f.name} className="h-10 w-10 object-cover rounded" onLoad={() => URL.revokeObjectURL(url)} />
                      ) : t === "video" ? (
                        <video src={url} className="h-10 w-10 rounded" onLoadedData={() => URL.revokeObjectURL(url)} />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                      <span className="truncate max-w-[150px] text-xs" title={f.name}>{f.name}</span>
                      <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-end gap-2">
              <label className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/20 flex items-center gap-2">
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
                placeholder="Type a message…"
                className="flex-1 resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none"
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-sky-600 hover:scale-105 transition disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
            {typing && (
              <div className="text-xs text-white/60 pl-2 animate-pulse">Partner is typing…</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
