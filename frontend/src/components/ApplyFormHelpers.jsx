
import React, { useRef } from "react";
import { motion } from "framer-motion";

const inputCls = "w-full rounded-xl bg-black/30 px-3 py-2.5 leading-6 outline-none placeholder:text-white/40 focus:ring-2 focus:ring-emerald-300/35 transition border";
const labelCls = "mb-1 text-[13px] tracking-wide text-white/75";
const errorCls = "border-rose-500 focus:ring-rose-400/60";
const chipBase = "rounded-full px-3 py-1.5 text-sm transition select-none border border-white/10 bg-white/5 hover:bg-white/10";
const chipOn = "border-emerald-400/40 bg-emerald-400/10 text-emerald-100";
const chipOff = "text-white/80";
const subtle = "text-white/70";
const helpText = "mt-1 text-xs text-white/55";
const sectionTitleCls = "text-xl font-semibold tracking-tight";

/* --- Helper Components --- */
function Field({ label, name, value, onChange, required, error, placeholder, textarea, rows, counter }) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className={labelCls}>
        {label} {required && <span className="text-emerald-300">*</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          id={name}
          rows={rows || 3}
          className={`${inputCls} ${error ? errorCls : "border-white/10"}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      ) : (
        <input
          name={name}
          id={name}
          className={`${inputCls} ${error ? errorCls : "border-white/10"}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
        />
      )}
      {counter && <div className="text-xs text-white/50 text-right">{counter}</div>}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
function FieldSet({ label, required, error, children }) {
  return (
    <div className="mb-3">
      <div className={labelCls}>{label} {required && <span className="text-emerald-300">*</span>}</div>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
function FieldError({ children }) {
  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-rose-300"><AlertTriangle className="h-3 w-3" />{children}</div>
  );
}
function CenteredAvatar({ url, onPick, error }) {
  const ref = useRef(null);
  return (
    <div className="flex flex-col items-center mb-4">
      <button type="button" onClick={() => ref.current?.click()}
        className={`relative h-28 w-28 overflow-hidden rounded-full bg-white/10 ring-2 ring-emerald-400/20 hover:ring-emerald-400/40 transition`}
        title="Upload profile photo (required)"
        aria-label="Upload profile photo"
      >
        {url ? (
          <img src={url} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-white/60">Upload</div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.25)]" />
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          const preview = URL.createObjectURL(f);
          onPick(f, preview);
        }} />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
const ProofUploader = React.forwardRef(function ProofUploader({ files, onAdd, onRemove }, ref) {
  const inputRef = useRef(null);
  const onPick = (e) => {
    const list = Array.from(e.target.files || []);
    if (list.length) onAdd(list.slice(0, 10 - files.length));
    e.target.value = "";
  };
  return (
    <div ref={ref} tabIndex={0} className="mt-1 transition border-2 border-dashed border-white/15 rounded-xl bg-white/5 p-3 focus:ring-emerald-400 focus:outline-none">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-white/8 px-4 py-2 text-sm hover:bg-white/12"
          aria-label="Add proof documents"
        >Add files</button>
        <input ref={inputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={onPick} />
        <span className="text-xs text-white/40">or drag files here</span>
      </div>
      {files?.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-sm gap-3">
              <div className="flex items-center gap-2">
                {f.type?.startsWith("image/") ?
                  <img src={URL.createObjectURL(f)} className="h-8 w-8 object-cover rounded" alt="proof" />
                  : <FileText className="h-8 w-8 text-white/30" />}
                <span className="truncate">{f.name}</span>
              </div>
              <button type="button" onClick={() => onRemove(i)} className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15" aria-label={`Remove ${f.name}`}><X className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className={sectionTitleCls}>{title}</h2>
          {desc && <p className={subtle}>{desc}</p>}
        </div>
      </div>
    </div>
  );
}
function AvailabilityEditor({ value, onChange }) {
  const set = (i, k, v) => onChange(prev => prev.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  return (
    <div className="grid gap-3">
      {value.map((r, i) => (
        <div key={r.day} className="rounded-xl bg-white/5 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={r.checked} onChange={e => set(i, "checked", e.target.checked)} aria-label={`Available on ${r.day}`} />
              <span className="min-w-[3ch]">{r.day}</span>
            </label>
            <input type="time" disabled={!r.checked} value={r.start} onChange={e => set(i, "start", e.target.value)} className={`${inputCls} max-w-[160px] disabled:opacity-60`} aria-label={`${r.day} start time`} />
            <span className="text-white/50">to</span>
            <input type="time" disabled={!r.checked} value={r.end} onChange={e => set(i, "end", e.target.value)} className={`${inputCls} max-w-[160px] disabled:opacity-60`} aria-label={`${r.day} end time`} />
          </div>
        </div>
      ))}
    </div>
  );
}
function Toast({ kind = "success", title, message, onClose }) {
  return (
    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.25 }}
      className={`pointer-events-auto w-full max-w-sm rounded-xl p-3 shadow-xl ring-1 ${kind === "success" ? "bg-emerald-500/15 ring-emerald-500/30" : "bg-rose-500/15 ring-rose-500/30"}`}
      role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
          {kind === "success" ? <Check className="h-4 w-4" aria-hidden /> : <AlertTriangle className="h-4 w-4" aria-hidden />}
        </div>
        <div className="flex-1">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {message && <div className="text-xs text-white/80">{message}</div>}
        </div>
        <button onClick={onClose} className="rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15" aria-label="Close notification">Close</button>
      </div>
    </motion.div>
  );
}

export {
  Field,
  FieldSet,
  FieldError,
  CenteredAvatar,
  ProofUploader,
  SectionHeader,
  AvailabilityEditor,
  Toast,
};
