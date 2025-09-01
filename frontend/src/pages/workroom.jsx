// src/pages/Workroom.jsx
// Adds a Refresh button + fixes attachments showing empty boxes by using server payload/refetch

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  Paperclip,
  Send,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  File as FileIcon,
  Video as VideoIcon,
  RefreshCcw,
  X,
} from "lucide-react";
import Navbar from "../components/navbar";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

/* ====== Background pretties (same as before) ====== */
const Aurora = ({ className = "" }) => (
  <div className={`absolute inset-0 -z-10 overflow-hidden max-w-full ${className}`}>
    <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
    <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)]" />
    <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(168,85,247,0.06),rgba(14,165,233,0.06),rgba(236,72,153,0.06),rgba(168,85,247,0.06))]" />
  </div>
);

const Particles = () => (
  <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden max-w-full">
    {Array.from({ length: 40 }).map((_, i) => (
      <span
        key={i}
        className="absolute h-1 w-1 rounded-full bg-white/40 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float${i % 3} ${6 + (i % 5)}s ease-in-out ${i * 0.12}s infinite`,
          opacity: 0.5,
        }}
      />
    ))}
    <style>{`
      @keyframes float0 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-10px)} }
      @keyframes float1 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-16px)} }
      @keyframes float2 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-22px)} }
    `}</style>
  </div>
);

const bubbleCls = (mine) =>
  `max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-md ${mine
    ? "bg-gradient-to-br from-fuchsia-500/25 to-sky-500/20 text-fuchsia-50 border border-fuchsia-400/30 rounded-br-sm ml-auto"
    : "bg-white/10 text-white border border-white/20 rounded-bl-sm"
  }`;

/* ====== Type helper for attachments (handles different backend shapes) ====== */
function guessType(att) {
  const t = att?.type || att?.mime || att?.mimetype || "";
  const url = att?.url || att?.secure_url || att?.location || att?.path || "";
  const name = att?.original_name || att?.originalName || att?.filename || att?.key || "";

  const str = `${t} ${url} ${name}`.toLowerCase();
  if (str.includes("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(str)) return "image";
  if (str.includes("video/") || /\.(mp4|webm|mov|m4v|avi)$/.test(str)) return "video";
  return "file";
}
function pickUrl(att) {
  return att?.url || att?.secure_url || att?.location || att?.path || "";
}
function pickName(att) {
  return att?.original_name || att?.originalName || att?.filename || att?.key || att?.name || "file";
}

/* ====== Page ====== */
export default function WorkroomPage() {
  const { workroomId } = useParams();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [meta, setMeta] = useState(null);

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const listRef = useRef(null);
  const socketRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const meId = me?._id;

  const isLocked = !!meta?.finalisedAt;
  const bothFinalised = !!meta?.finalisedAt || (!!meta?.clientFinalised && !!meta?.workerFinalised);

  /* ====== Load me + meta ====== */
  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }),
          fetch(`${API_BASE}/api/workrooms/${workroomId}/meta`, { credentials: "include" }),
        ]);
        const meJson = await r1.json();
        const metaJson = await r2.json();
        setMe(meJson?.user || null);
        setMeta(metaJson || null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [workroomId]);

  /* ====== SOCKET ====== */
  useEffect(() => {
    const s = io(API_BASE, { withCredentials: true });
    socketRef.current = s;

    s.on("connect", () => {
      s.emit("workroom:join", { workroomId });
    });

    s.on("connect_error", (err) => console.warn("socket connect_error:", err?.message));

    // When server broadcasts a fully-formed message (with uploaded file URLs), append it
    const onIncoming = (msg) => {
      if (msg?.workroomId && msg.workroomId !== workroomId) return;
      setItems((prev) => [...prev, msg]);
      if (isAtBottomRef.current) scrollToBottomSmooth();
    };
    s.on("message:new", onIncoming);

    const onFinaliseUpdate = (payload) => {
      if (!payload || payload.workroomId !== workroomId) return;
      setMeta((prev) => ({
        ...(prev || {}),
        clientFinalised: payload.clientFinalised ?? prev?.clientFinalised,
        workerFinalised: payload.workerFinalised ?? prev?.workerFinalised,
        finalisedAt: payload.finalisedAt ?? prev?.finalisedAt ?? null,
      }));
    };
    s.on("workroom:finalise:update", onFinaliseUpdate);

    return () => {
      s.off("message:new", onIncoming);
      s.off("workroom:finalise:update", onFinaliseUpdate);
      s.disconnect();
    };
  }, [workroomId]);

  /* ====== Scroll helpers ====== */
  const scrollToBottomSmooth = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    isAtBottomRef.current = nearBottom;
  }, []);

  /* ====== Fetch messages ====== */
  const fetchMessages = async (cursor) => {
    const url = new URL(`${API_BASE}/api/workrooms/${workroomId}/messages`);
    if (cursor) url.searchParams.set("cursor", cursor);
    const r = await fetch(url, { credentials: "include" });
    const d = await r.json();

    if (!cursor) {
      setItems(d.items || []);
      setTimeout(scrollToBottomSmooth, 50);
    } else {
      setItems((prev) => [...(d.items || []), ...prev]);
    }
    setNextCursor(d.nextCursor || null);
  };
  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));
  }, [workroomId]);
  // auto refresh messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 1000);

    return () => clearInterval(interval); // cleanup on unmount
  }, [workroomId]);

  // 2️⃣ Auto-refresh finalise/meta
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/workrooms/${workroomId}/meta`, {
          credentials: "include",
        });
        const d = await r.json();
        setMeta(d);
      } catch (e) {
        console.error("auto meta refresh error", e);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [workroomId]);

  /* ====== File helpers ====== */
  const addFiles = (picked) => {
    if (!picked?.length) return;
    setFiles((prev) => [...prev, ...Array.from(picked)]);
  };
  const onPickFiles = (e) => {
    addFiles(e.target.files);
    e.target.value = null;
  };
  const onRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const onPaste = (e) => {
    if (isLocked) return;
    const pastedFiles = Array.from(e.clipboardData?.files || []);
    if (pastedFiles.length) {
      e.preventDefault();
      addFiles(pastedFiles);
    }
  };
  const onDrop = (e) => {
    if (isLocked) return;
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer?.files);
  };
  const onDragOver = (e) => {
    if (isLocked) return;
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  /* ====== Send message (NO optimistic attachments; use server payload) ====== */
  const onSend = async () => {
    if (sending || isLocked) return;
    const empty = !text.trim() && files.length === 0;
    if (empty) return;

    setSending(true);
    try {
      const form = new FormData();
      if (text.trim()) form.append("text", text.trim());
      files.forEach((f) => form.append("attachments", f));

      const r = await fetch(`${API_BASE}/api/workrooms/${workroomId}/messages`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to send");

      // If server returns the full saved message, append that; else hard refresh list.
      const serverMsg = d?.message || d; // tolerate different API shapes
      if (serverMsg && (serverMsg.text || serverMsg.attachments)) {
        setItems((prev) => [...prev, serverMsg]);
        if (isAtBottomRef.current) scrollToBottomSmooth();
      } else {
        // fallback: re-fetch to get the last message with proper uploaded URLs
        await fetchMessages();
      }

      // clear composer
      setText("");
      setFiles([]);
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  /* ====== Finalise ====== */
  const onFinalise = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/workrooms/${workroomId}/finalise`, {
        method: "POST",
        credentials: "include",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to finalize");

      setMeta((prevMeta) => ({
        ...(prevMeta || {}),
        clientFinalised: d.clientFinalised,
        workerFinalised: d.workerFinalised,
        finalisedAt: d.finalisedAt || null,
      }));

      socketRef.current?.emit("workroom:finalise:update", {
        workroomId,
        clientFinalised: d.clientFinalised,
        workerFinalised: d.workerFinalised,
        finalisedAt: d.finalisedAt || null,
      });
    } catch (e) {
      alert(e.message);
    }
  };

  /* ====== UI ====== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100 overflow-x-hidden">
      <Navbar />
      <main className="relative pt-24 pb-10">
        <Aurora />
        <Particles />
        <div className="mx-auto max-w-6xl px-4">
          {/* Header card */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div>
              <h1 className="text-xl font-semibold text-white">Workroom</h1>
              <div className="text-xs text-white/60">Room: {workroomId}</div>

              {!bothFinalised ? (
                <div className="mt-1 text-xs text-white/70">
                  {meta?.role === "client" ? (
                    <>Your status: <b>{meta?.clientFinalised ? "Finalized" : "Pending"}</b> • Partner: <b>{meta?.workerFinalised ? "Finalized" : "Pending"}</b></>
                  ) : (
                    <>Your status: <b>{meta?.workerFinalised ? "Finalized" : "Pending"}</b> • Partner: <b>{meta?.clientFinalised ? "Finalized" : "Pending"}</b></>
                  )}
                </div>
              ) : (
                <div className="mt-1 text-xs text-white/80">Both parties finalised. Chat is locked.</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* REFRESH BUTTON (hard page reload) */}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm border border-white/20 hover:bg-white/15"
                title="Refresh page"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>

              {!bothFinalised ? (
                <button
                  onClick={onFinalise}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-700"
                >
                  Finalize
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm">Finalized</span>
                </div>
              )}

              {bothFinalised && (
                <button
                  onClick={() => navigate(`/workroom/${workroomId}/complete`)}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm hover:bg-fuchsia-700"
                >
                  Proceed
                </button>
              )}
            </div>
          </div>

          {/* Chat card */}
          <div
            className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ${dragOver ? "ring-2 ring-fuchsia-400/50" : ""
              }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <button
                disabled={!nextCursor}
                onClick={() => fetchMessages(nextCursor)}
                className={`text-xs rounded-md px-3 py-1 ${nextCursor
                  ? "text-white/80 hover:text-white bg-white/10 border border-white/20"
                  : "text-white/30 bg-white/5 border border-white/10 cursor-not-allowed"
                  }`}
              >
                {nextCursor ? "Load previous" : "No more"}
              </button>
              <div className="text-[11px] text-white/50">Drag & drop or paste files to attach</div>
              {/* Quick refresh messages only (soft refresh) */}
              <button
                onClick={() => fetchMessages()}
                className="text-xs rounded-md px-3 py-1 text-white/80 hover:text-white bg-white/10 border border-white/20"
                title="Refresh messages"
              >
                Refresh chat
              </button>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="h-[68vh] overflow-y-auto p-4 space-y-3 scroll-smooth"
              onScroll={handleScroll}
              onPaste={onPaste}
            >
              {loading ? (
                <div className="text-white/60">Loading…</div>
              ) : items.length === 0 ? (
                <div className="text-white/60">No messages yet.</div>
              ) : (
                items.map((m) => {
                  const mine = String(m.sender?._id || m.sender) === String(meId);
                  const attachments = Array.isArray(m.attachments) ? m.attachments : [];
                  return (
                    <div key={m._id || `${m.createdAt}-${Math.random()}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={bubbleCls(mine)}>
                        {m.text && <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>}

                        {attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {attachments.map((a, i) => {
                              const t = guessType(a);
                              const url = pickUrl(a);
                              const name = pickName(a);
                              if (!url) return null;

                              if (t === "image") {
                                return (
                                  <a key={i} href={url} target="_blank" rel="noreferrer">
                                    <img
                                      src={url}
                                      alt={name}
                                      className="max-h-64 rounded-lg border border-white/20"
                                    />
                                  </a>
                                );
                              }
                              if (t === "video") {
                                return (
                                  <video
                                    key={i}
                                    controls
                                    src={url}
                                    className="max-h-64 rounded-lg border border-white/20"
                                  />
                                );
                              }
                              return (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block break-all rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs underline text-white/90"
                                >
                                  {name}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <div className="mt-1 text-[10px] text-white/40">
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/10 p-3 space-y-2">
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <AttachmentPreview key={`${f.name}-${i}`} f={f} i={i} onRemove={() => onRemoveFile(i)} />
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <label
                  className={`inline-flex items-center gap-2 text-white/80 ${isLocked ? "opacity-40 cursor-not-allowed" : "hover:text-white cursor-pointer"
                    } bg-white/10 border border-white/20 rounded-lg px-3 py-2`}
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={onPickFiles}
                    disabled={isLocked}
                    // keep broad list; backend decides allowed types
                    accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt"
                  />
                </label>

                <div className="flex-1">
                  <textarea
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isLocked}
                    placeholder={isLocked ? "Chat is locked after finalization." : "Write a message…"}
                    className="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40"
                    onKeyDown={(e) => {
                      if (isLocked) return;
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                  />
                </div>

                <button
                  onClick={onSend}
                  disabled={sending || isLocked}
                  className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2 text-white hover:bg-fuchsia-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="text-sm">Send</span>
                </button>
              </div>
            </div>
          </div>

          {bothFinalised && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/80">
                You have finalized the task. Click proceed to go to the next step.
              </div>
              <button
                onClick={() => navigate(`/workroom/${workroomId}/complete`)}
                className="mt-2 rounded-xl bg-fuchsia-600 px-4 py-2 text-sm hover:bg-fuchsia-700"
              >
                Proceed
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ====== Attachment Preview ====== */
function AttachmentPreview({ f, i, onRemove }) {
  const type = f.type || "";
  const url = URL.createObjectURL(f);
  const isImage = type.startsWith("image/");
  const isVideo = type.startsWith("video/");

  return (
    <div className="group relative flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs">
      <div className="flex items-center gap-2">
        {isImage ? (
          <ImageIcon className="h-4 w-4 opacity-80" />
        ) : isVideo ? (
          <VideoIcon className="h-4 w-4 opacity-80" />
        ) : (
          <FileIcon className="h-4 w-4 opacity-80" />
        )}
        <span className="truncate max-w-[180px]">{f.name}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {isImage && (
          <a href={url} target="_blank" rel="noreferrer" className="rounded-md border border-white/15" title="Preview">
            <img src={url} alt={f.name} className="h-10 w-10 rounded-md object-cover" />
          </a>
        )}
        {isVideo && <video src={url} className="h-10 w-14 rounded-md" muted playsInline />}
        <button
          onClick={onRemove}
          className="rounded-md p-1 text-white/70 hover:text-white hover:bg-white/10"
          title="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
