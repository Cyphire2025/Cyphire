// src/pages/dashboard.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  FolderOpenDot,
  BadgeCheck,
  Sparkles,
  Users,
  Timer,
  Target,
  Plus,
  Rocket,
  Filter,
  Search,
} from "lucide-react";

/**
 * Backend + Razorpay
 * Ensure:
 *  - VITE_API_BASE (or falls back to localhost)
 *  - VITE_RAZORPAY_KEY_ID
 *  - index.html includes Razorpay:
 *    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
 */
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
const RAZORPAY_KEY = import.meta.env?.VITE_RAZORPAY_KEY_ID;

/* =========================================================
   Design tokens (keeps brand, adds restraint & consistency)
   ========================================================= */
const Tokens = () => (
  <style>{`
    :root {
      --brand-fg: #e879f9;            /* pink-400/500-ish for accents */
      --brand-fg-2: #8b5cf6;          /* violet-500 */
      --text-1: rgba(255,255,255,0.92);
      --text-2: rgba(255,255,255,0.70);
      --text-3: rgba(255,255,255,0.50);
      --card-bg: rgba(255,255,255,0.05);
      --card-bd: rgba(255,255,255,0.10);
      --surface-0: #0a0a0f;
      --surface-1: #0c0c14;
      --radius-xl: 1rem;              /* 16px */
      --blur: 12px;
      --ring: rgba(232,121,249,0.35);
    }

    /* Reduced motion: tone down all non-essential transitions */
    @media (prefers-reduced-motion: reduce) {
      .anim, .anim * {
        animation: none !important;
        transition: none !important;
      }
    }
  `}</style>
);

/* =========================
   Reusable, semantic surfaces
   ========================= */
function Glass({ className = "", as: As = "div", elevation = 1, children, ...rest }) {
  // elevation: 0 (flat), 1 (card), 2 (overlay prominence)
  const variations = {
    0: "border-white/5 bg-white/0 backdrop-blur-none",
    1: "border-white/10 bg-white/5 backdrop-blur-xl",
    2: "border-white/15 bg-white/10 backdrop-blur-2xl",
  };
  return (
    <As
      className={`rounded-2xl border ${variations[elevation]} ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

const Skel = ({ w = "w-full", h = "h-4", className = "" }) => (
  <div className={`animate-pulse bg-white/10 rounded ${w} ${h} ${className}`} />
);

/* ======================
   Dashboard main
   ====================== */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // data
  const [me, setMe] = useState(null);
  const [tasks, setTasks] = useState([]);

  // tab (URL-shareable via ?tab=)
  const initialTab = useMemo(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return ["myTasks", "myApplications", "mySponsorships"].includes(t) ? t : "myTasks";
  }, []);
  const [activeTab, setActiveTab] = useState(initialTab);

  // quick tools
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent"); // recent | priceAsc | priceDesc | deadlineAsc | deadlineDesc
  const [onlyOpen, setOnlyOpen] = useState(false);

  // overlay (payment)
  const [paymentTask, setPaymentTask] = useState(null);
  const [paymentApplicant, setPaymentApplicant] = useState(null);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // incremental rendering
  const PAGE_SIZE = 6;
  const [openShown, setOpenShown] = useState(PAGE_SIZE);
  const [progressShown, setProgressShown] = useState(PAGE_SIZE);
  const [doneShown, setDoneShown] = useState(PAGE_SIZE);

  // utils
  const inr = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }), []);
  const toId = useCallback((v) => (typeof v === "string" ? v : v?._id || String(v || "")), []);
  const sameId = useCallback((a, b) => toId(a) === toId(b), [toId]);

  // accessibility: keep focus in overlay
  const overlayRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(""); setLoading(true);
      try {
        const [meRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }),
          fetch(`${API_BASE}/api/tasks`, { credentials: "include" }),
        ]);
        if (!meRes.ok) throw new Error("We couldn’t load your profile. Please try again.");
        if (!tasksRes.ok) throw new Error("We couldn’t load your tasks. Please try again.");
        const meJson = await meRes.json();
        const tasksJson = await tasksRes.json();
        if (!alive) return;
        setMe(meJson?.user || null);
        setTasks(Array.isArray(tasksJson) ? tasksJson : []);
      } catch (e) {
        if (alive) setErr(e.message || "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  // derived lists
  const myTasks = useMemo(() => {
    if (!me) return [];
    return tasks.filter(
      (t) => sameId(t.createdBy, me._id) && !(t.category || []).some((c) => String(c || "").toLowerCase() === "sponsorship")
    );
  }, [me, tasks, sameId]);

  const mySponsorships = useMemo(() => {
    if (!me) return [];
    return tasks.filter(
      (t) => sameId(t.createdBy, me._id) && (t.category || []).some((c) => String(c || "").toLowerCase() === "sponsorship")
    );
  }, [me, tasks, sameId]);

  const myApplications = useMemo(() => {
    if (!me) return [];
    return tasks.filter((t) => (Array.isArray(t.applicants) ? t.applicants : []).some((a) => sameId(a, me._id)));
  }, [me, tasks, sameId]);

  const sourceList = useMemo(() => {
    if (activeTab === "myTasks") return myTasks;
    if (activeTab === "myApplications") return myApplications;
    return mySponsorships;
  }, [activeTab, myTasks, myApplications, mySponsorships]);

  const filteredList = useMemo(() => {
    let l = sourceList;

    // search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      l = l.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          (t.category || []).some((c) => String(c || "").toLowerCase().includes(q))
      );
    }

    // only open
    if (onlyOpen) l = l.filter((t) => !t.paymentRequested && !t.selectedApplicant);

    // sort
    const byPrice = (a, b) => Number(a.price || 0) - Number(b.price || 0);
    const byDeadline = (a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0);
    const byRecent = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    const arr = [...l];
    switch (sort) {
      case "priceAsc": arr.sort(byPrice); break;
      case "priceDesc": arr.sort((a, b) => -byPrice(a, b)); break;
      case "deadlineAsc": arr.sort(byDeadline); break;
      case "deadlineDesc": arr.sort((a, b) => -byDeadline(a, b)); break;
      default: arr.sort(byRecent);
    }
    return arr;
  }, [sourceList, query, onlyOpen, sort]);

  // computed KPIs / insights
  const kpi = useMemo(() => {
    const posted = myTasks.length + mySponsorships.length;
    const applied = myApplications.length;
    const completed = tasks.filter((t) => t.paymentRequested).length;
    const totalBudget = tasks.reduce((s, t) => s + Number(t.price || 0), 0);
    const allApplicants = tasks.reduce((s, t) => s + (t.applicants?.length || 0), 0);
    const selectedCount = tasks.filter((t) => t.selectedApplicant).length;
    const rate = allApplicants ? Math.round((selectedCount / allApplicants) * 100) : 0;
    return { posted, applied, completed, totalBudget, rate };
  }, [tasks, myTasks, mySponsorships, myApplications]);

  // tab setter (shareable)
  const setTab = useCallback((tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);
    // reset incremental render when switching categories
    setOpenShown(PAGE_SIZE);
    setProgressShown(PAGE_SIZE);
    setDoneShown(PAGE_SIZE);
  }, []);

  // payment
  const handlePayment = useCallback(async () => {
    try {
      if (!paymentTask || !paymentApplicant) return;
      if (!window.Razorpay || !RAZORPAY_KEY) {
        alert("Payment service not available. Please try again later.");
        return;
      }
      const orderRes = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: Number(paymentTask.price) }),
      });
      const order = await orderRes.json();

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Cyphire",
        description: `Payment for task: ${paymentTask.title}`,
        order_id: order.id,
        theme: { color: "#8B5CF6" },
        handler: async (resp) => {
          try {
            setVerifyingPayment(true);
            const vr = await fetch(`${API_BASE}/api/payment/verify-and-select`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                taskId: paymentTask._id,
                applicantId: paymentApplicant._id,
              }),
            });
            const vj = await vr.json();
            if (vj.success) {
              setTasks((prev) =>
                prev.map((t) =>
                  toId(t._id) === toId(paymentTask._id)
                    ? {
                      ...t,
                      selectedApplicant: paymentApplicant._id,
                      workroomId: vj.task?.workroomId ?? t.workroomId,
                    }
                    : t
                )
              );
              setShowPaymentOverlay(false);
            } else {
              alert(vj.error || "Payment verified but selection failed.");
            }
          } catch (e) {
            console.error(e);
            alert("Payment verification failed.");
          } finally {
            setVerifyingPayment(false);
          }
        },
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Failed to start payment.");
    }
  }, [paymentTask, paymentApplicant, toId]);

  // grouping for “board”
  const grouped = useMemo(() => {
  const open = filteredList.filter(
    (t) => !t.paymentRequested && !t.selectedApplicant
  );
  return { open };
}, [filteredList]);


  // count active filters
  const activeFilters = useMemo(() => {
    let n = 0;
    if (query.trim()) n++;
    if (onlyOpen) n++;
    if (sort !== "recent") n++;
    return n;
  }, [query, onlyOpen, sort]);

  /* ======================
     Subcomponents
     ====================== */

  const Header = () => (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10"
      aria-label="Dashboard header"
    >
      {/* restrained animated gradient field */}
      <div className="absolute inset-0 anim" aria-hidden="true">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-3xl animate-pulse" />
        <div className="absolute -bottom-16 -right-8 h-72 w-72 rounded-full bg-purple-600/25 blur-3xl animate-pulse [animation-delay:400ms]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      </div>

      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-fuchsia-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs tracking-wider uppercase">Welcome back</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1 text-white">Dashboard</h1>
            <p className="text-white/70 mt-1">Act on what matters next: open items, in-progress work, and payouts.</p>
          </div>

          {/* quick actions */}
          <div className="flex gap-2">
            <Link
              to="/choose-category"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold shadow-lg hover:from-pink-600 hover:to-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label="Post a new task"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Post Task
            </Link>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label="Explore tasks"
            >
              <Rocket className="h-4 w-4" aria-hidden="true" /> Explore
            </Link>
          </div>
        </div>

        {/* KPI ribbon (true hierarchy: one row, low-chatter) */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Posted"
            value={kpi.posted}
            icon={<FolderOpenDot className="h-4 w-4" aria-hidden="true" />}
          />
          <StatCard
            label="Applications"
            value={kpi.applied}
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
          />
          <StatCard
            label="Completed"
            value={kpi.completed}
            icon={<BadgeCheck className="h-4 w-4" aria-hidden="true" />}
            ring={true}
            percent={Math.min(100, Math.round((kpi.completed / Math.max(1, kpi.posted)) * 100))}
          />
          <StatCard
            label="Selection rate"
            value={`${kpi.rate}%`}
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
      </div>
    </div>
  );

  const Toolbox = () => (
    <Glass className="p-4" elevation={1} aria-label="Filters and search">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, or category"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
            aria-label="Search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/50" aria-hidden="true" />
          <label className="text-sm text-white/80 flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
              className="accent-fuchsia-500"
              aria-checked={onlyOpen}
              aria-label="Only show open items"
            />
            Only open
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
            aria-label="Sort by"
          >
            <option value="recent">Sort: Recent</option>
            <option value="priceAsc">Sort: Price (Low → High)</option>
            <option value="priceDesc">Sort: Price (High → Low)</option>
            <option value="deadlineAsc">Sort: Deadline (Sooner)</option>
            <option value="deadlineDesc">Sort: Deadline (Later)</option>
          </select>
        </div>
      </div>
      <div className="mt-2 text-xs text-white/60">
        {activeFilters > 0 ? `${activeFilters} filter${activeFilters > 1 ? "s" : ""} active` : "No filters active"}
      </div>
    </Glass>
  );

  const Sidebar = () => (
    <div className="space-y-3 sticky top-24" aria-label="Sidebar">
      <Glass className="p-2" elevation={1} role="tablist" aria-label="Dashboard sections">
        <SidebarTab id="myTasks" active={activeTab} setTab={setTab} label="My Tasks" />
        <SidebarTab id="myApplications" active={activeTab} setTab={setTab} label="My Applications" />
        <SidebarTab id="mySponsorships" active={activeTab} setTab={setTab} label="My Sponsorships" />
      </Glass>

      {/* Smart insights */}
      <Glass className="p-4" elevation={1} aria-label="Smart insights">
        <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
          <Target className="h-4 w-4" aria-hidden="true" /> Smart Insights
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Selection rate</span>
            <strong className="text-white/90">{kpi.rate}%</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Avg. budget</span>
            <strong className="text-white/90">
              {inr.format(kpi.posted ? Math.round(kpi.totalBudget / kpi.posted) : 0)}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Nearest deadline</span>
            <span className="text-white/80">{nextDeadlineText(sourceList)}</span>
          </div>
        </div>
      </Glass>

      {/* Activity */}
      <Glass className="p-4" elevation={1} aria-label="Recent activity">
        <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
          <Timer className="h-4 w-4" aria-hidden="true" /> Activity
        </div>
        <div className="space-y-3 text-sm">
          {recentActivity(tasks, me).map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-fuchsia-400" aria-hidden="true" />
              <span className="text-white/80">{a.text}</span>
              <span className="ml-auto text-white/40">{a.when}</span>
            </div>
          ))}
          {recentActivity(tasks, me).length === 0 && (
            <div className="text-white/60">
              No recent changes. <Link className="text-fuchsia-300 hover:underline" to="/tasks">Explore tasks</Link>.
            </div>
          )}
        </div>
      </Glass>
    </div>
  );

  const TaskCard = ({ task }) => {
    const selectedId = toId(task.selectedApplicant);
    const iAmSelected = me && sameId(selectedId, me._id);
    const isOwner = me && sameId(task.createdBy, me._id);
    const canWorkroom = !!selectedId && (isOwner || iAmSelected);
    const workroomHref = `https://cyphire-workroom.vercel.app/workroom/${task.workroomId || toId(task._id)}`;
    const appliedCount = task.applicants?.length || 0;

    const StatusChip = () => {
      if (task.paymentRequested) {
        return (
          <span className="inline-flex items-center gap-1 text-emerald-300 text-[11px] px-2 py-0.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Payment disbursed
          </span>
        );
      }
      if (selectedId) {
        return (
          <span className="inline-flex items-center gap-1 text-amber-300 text-[11px] px-2 py-0.5 rounded-lg border border-amber-400/40 bg-amber-400/10">
            <Users className="h-3 w-3" aria-hidden="true" />
            In progress
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 text-fuchsia-300 text-[11px] px-2 py-0.5 rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10">
          <Rocket className="h-3 w-3" aria-hidden="true" />
          Awaiting applications
        </span>
      );
    };

    return (
      <Glass className="p-6" elevation={1} role="article" aria-label={`Task ${task.title}`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* left */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold truncate text-white">{task.title}</h2>
              <StatusChip />
            </div>
            <p className="text-white/70 text-sm mt-1 line-clamp-3">{task.description}</p>
            <div className="text-xs text-white/60 mt-2 flex flex-wrap items-center gap-3">
              <span>{task.deadline ? `Deadline: ${new Date(task.deadline).toLocaleDateString()}` : "No deadline"}</span>
              <span className="opacity-50">•</span>
              <span>Budget: {inr.format(task.price ?? 0)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(task.category || []).map((c) => (
                <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">
                  {c}
                </span>
              ))}
            </div>

            {task.attachments?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {task.attachments.map((a, i) => (
                  <div key={`${toId(task._id)}-att-${i}`} className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                    {a.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={a.url} className="w-full h-full object-cover" controls aria-label="Attachment video" />
                    ) : (
                      <img src={a.url} className="w-full h-full object-cover" alt="Attachment" loading="lazy" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* right: contextual actions */}
          <div className="flex-shrink-0 flex items-center gap-3">
            {canWorkroom ? (
              <button
                onClick={() => window.open(workroomHref, "_blank", "noopener")}
                className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Open Workroom <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </button>
            ) : isOwner ? (
              <span className="text-xs text-white/70">Applicants: {appliedCount}</span>
            ) : iAmSelected ? (
              task.paymentRequested ? (
                <span className="text-emerald-300 text-xs px-2 py-0.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10">
                  Task Completed
                </span>
              ) : (
                <button
                  onClick={() => (window.location.href = workroomHref)}
                  className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  Go to Workroom <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </button>
              )
            ) : (
              <span className="text-xs text-white/60">{selectedId ? "Not selected this time" : "Under review"}</span>
            )}
          </div>
        </div>

        {/* creator-only: applicants list (progressive disclosure) */}
        {isOwner && !task.selectedApplicant && (task.applicants?.length || 0) > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4 space-y-3" aria-label="Applicants">
            {task.applicants.map((appl, j) => {
              const a = typeof appl === "object" ? appl : { _id: appl };
              const name = a.name || "User";
              const avatar = a.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
              const profile = a.slug || a._id;
              return (
                <div key={`${toId(a._id)}-${j}`} className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt={`${name} avatar`} loading="lazy" />
                    <div className="truncate">
                      <div className="text-sm font-medium truncate">{name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/u/${profile}`} className="text-sm text-fuchsia-300 hover:underline">
                      View Profile
                    </Link>
                    <button
                      onClick={() => {
                        setPaymentTask(task);
                        setPaymentApplicant(a);
                        setShowPaymentOverlay(true);
                        setTimeout(() => overlayRef.current?.focus(), 0);
                      }}
                      className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200 hover:bg-fuchsia-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      aria-label={`Select ${name}`}
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* creator-only: empty applicants */}
        {isOwner && !task.selectedApplicant && (task.applicants?.length || 0) === 0 && (
          <div className="mt-4 border-t border-white/10 pt-4 text-sm text-white/70 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            No applicants yet. <Link to="/tasks" className="text-fuchsia-300 hover:underline">Boost visibility</Link>.
          </div>
        )}
      </Glass>
    );
  };

  /* ======================
     Render
     ====================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-gray-100">
      <Tokens />
      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 pt-24 pb-16">
        <Header />

        {err && (
          <Glass className="p-4 text-red-300 my-6 flex items-start gap-3" elevation={1} role="alert">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              {err}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs rounded-lg border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  Retry
                </button>
                <Link
                  to="/tasks"
                  className="text-xs rounded-lg border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  Go to Tasks
                </Link>
              </div>
            </div>
          </Glass>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
            <aside className="md:col-span-3">
              <Glass className="p-4 space-y-3 sticky top-24" elevation={1}>
                <Skel w="w-40" h="h-9" />
                <Skel w="w-44" h="h-9" />
                <Skel w="w-48" h="h-9" />
              </Glass>
              <Glass className="p-4 space-y-2 mt-3" elevation={1}>
                <Skel w="w-28" />
                <Skel w="w-36" />
                <Skel w="w-24" />
              </Glass>
            </aside>
            <section className="md:col-span-9 space-y-6">
              <Toolbox />
              {[0, 1, 2].map((k) => (
                <Glass key={k} className="p-6 space-y-3" elevation={1}>
                  <Skel w="w-1/2" />
                  <Skel />
                  <Skel w="w-3/4" />
                </Glass>
              ))}
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
            <aside className="md:col-span-3"><Sidebar /></aside>
            <section className="md:col-span-9 space-y-6" aria-live="polite" aria-busy={loading ? "true" : "false"}>
              <Toolbox />

              {/* Simplified single-list layout: Only Open tasks */}
              <div className="space-y-4">
                {grouped.open.length === 0 ? (
                  <Glass className="p-8 text-center" elevation={1}>
                    <div className="text-2xl mb-2">No open items</div>
                    <p className="text-white/70">
                      Try posting a new task or{" "}
                      <Link className="text-fuchsia-300 hover:underline" to="/tasks">
                        explore opportunities
                      </Link>.
                    </p>
                  </Glass>
                ) : (
                  grouped.open.slice(0, openShown).map((t) => (
                    <TaskCard key={toId(t._id)} task={t} />
                  ))
                )}

                {openShown < grouped.open.length && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() =>
                        setOpenShown((n) => Math.min(grouped.open.length, n + PAGE_SIZE))
                      }
                      className="text-sm rounded-lg border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>


              {/* Empty state for the whole tab */}
              {filteredList.length === 0 && (
                <Glass className="p-8 text-center" elevation={1}>
                  <div className="text-2xl mb-2">Nothing here yet</div>
                  <p className="text-white/70">
                    Try adjusting filters or{" "}
                    <Link className="text-fuchsia-300 hover:underline" to="/tasks">explore tasks</Link>.
                  </p>
                </Glass>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Payment overlay (focus trapped) */}
      {showPaymentOverlay && paymentTask && paymentApplicant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm selection"
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowPaymentOverlay(false);
          }}
        >
          <Glass className="relative max-w-md w-full p-8 shadow-2xl text-center" elevation={2}>
            <button
              onClick={() => setShowPaymentOverlay(false)}
              className="absolute top-3 right-3 p-1 rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              aria-label="Close"
              ref={overlayRef}
            >
              <X className="h-5 w-5 text-white/70" aria-hidden="true" />
            </button>

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center shadow-lg" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657-1.343-3-3-3S6 9.343 6 11s1.343 3 3 3 3-1.343 3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" />
              </svg>
            </div>

            <h2 className="mt-12 text-2xl font-bold mb-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Confirm Selection
            </h2>
            <p className="text-white/80 mb-6">
              Make an upfront payment of{" "}
              <span className="font-semibold text-white">{inr.format(paymentTask.price)}</span>. Funds are held in escrow
              until completion.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowPaymentOverlay(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg transition inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Continue to Payment
              </button>
            </div>
          </Glass>
        </div>
      )}

      {/* verifying overlay */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg" role="alert" aria-live="assertive">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" aria-hidden="true" />
            <p className="text-white/90 text-lg font-medium">Verifying your payment…</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/* ======================
   Small building blocks
   ====================== */
function SidebarTab({ id, active, setTab, label }) {
  const selected = active === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`w-full text-left rounded-xl px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${selected ? "bg-white/15 text-white" : "bg-white/0 text-white/80 hover:bg-white/10"
        }`}
      role="tab"
      aria-selected={selected}
      aria-controls={`${id}-panel`}
      id={`${id}-tab`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, icon, ring = false, percent = 0 }) {
  return (
    <Glass className="p-4" elevation={1} aria-label={`${label} stat`}>
      <div className="text-white/65 text-xs flex items-center gap-2">
        {icon} <span className="sr-only"></span>
        <span>{label}</span>
      </div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-2xl font-bold text-white">{value}</div>
        {ring ? <Ring value={percent} /> : <TinySparkline />}
      </div>
    </Glass>
  );
}

function Column({ title, count, items, onLoadMore, hasMore, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm uppercase tracking-wider text-white/60">{title}</h3>
        <span className="text-xs text-white/40">{count}</span>
      </div>
      {count === 0 ? (
        <Glass className="p-6 text-white/70" elevation={1}>
          {title === "Open" ? "No open items." : title === "In Progress" ? "Nothing in progress." : "No completed items yet."}
        </Glass>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((t) => children(t))}
          </div>
          {hasMore && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={onLoadMore}
                className="text-sm rounded-lg border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- tiny visual helpers ---------- */
function TinySparkline({ flip = false }) {
  const d = flip ? "M0,14 L6,9 L12,11 L18,5 L24,8 L30,3" : "M0,6 L6,8 L12,3 L18,9 L24,5 L30,12";
  return (
    <svg width="60" height="20" viewBox="0 0 30 15" className="opacity-70" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" className="text-fuchsia-300" strokeWidth="1.5" />
    </svg>
  );
}

function Ring({ value = 0 }) {
  const r = 16, c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const dash = (clamped / 100) * c;
  return (
    <svg width="48" height="48" className="text-white/20" role="img" aria-label={`Completion ${clamped}%`}>
      <circle cx="24" cy="24" r={r} stroke="currentColor" strokeWidth="5" fill="none" />
      <circle
        cx="24"
        cy="24"
        r={r}
        stroke="url(#g)"
        strokeWidth="5"
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        className="drop-shadow"
      />
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ---------- utilities ---------- */
function recentActivity(tasks, me) {
  const out = [];
  const now = Date.now();
  for (const t of tasks.slice(0, 10)) {
    if (t.paymentRequested) out.push({ text: `Marked completed · ${t.title}`, when: timeAgo(t.updatedAt || t.createdAt || now) });
    else if (t.selectedApplicant) out.push({ text: `Applicant selected · ${t.title}`, when: timeAgo(t.updatedAt || t.createdAt || now) });
    else if (me && t.createdBy && (t.createdBy._id ? t.createdBy._id === me._id : t.createdBy === me._id)) {
      out.push({ text: `Posted a task · ${t.title}`, when: timeAgo(t.createdAt || now) });
    }
  }
  return out.slice(0, 6);
}

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function nextDeadlineText(list) {
  const upcoming = list
    .map((t) => (t.deadline ? new Date(t.deadline).getTime() : Infinity))
    .filter((n) => Number.isFinite(n) && n > Date.now())
    .sort((a, b) => a - b)[0];
  if (!upcoming) return "—";
  const days = Math.ceil((upcoming - Date.now()) / (1000 * 60 * 60 * 24));
  return days <= 0 ? "today" : `${days} day${days > 1 ? "s" : ""}`;
}
