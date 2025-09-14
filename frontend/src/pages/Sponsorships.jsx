import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { motion } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    Layers,
    Wallet,
    Gift,
    Star,
} from "lucide-react";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

/* ======================================================
   Background Effects (Aurora + Particles)
   ====================================================== */
const Aurora = ({ className = "" }) => (
    <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
        <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
        <div
            className="pointer-events-none absolute inset-0 
      bg-[conic-gradient(from_180deg_at_50%_50%,rgba(168,85,247,0.06),rgba(14,165,233,0.06),rgba(236,72,153,0.06),rgba(168,85,247,0.06))]"
        />
    </div>
);

const Particles = () => (
    <div className="pointer-events-none absolute inset-0 -z-10">
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

/* ======================================================
   Sponsor Spotlight Carousel
   ====================================================== */
const SpotlightCarousel = ({ sponsors }) => {
    const [index, setIndex] = useState(0);

    if (sponsors.length === 0) return null;

    const next = () => setIndex((i) => (i + 1) % sponsors.length);
    const prev = () => setIndex((i) => (i - 1 + sponsors.length) % sponsors.length);

    const sponsor = sponsors[index];
    const { title, metadata = {}, attachments = [] } = sponsor;
    const { budgetRange, eventTypes = [] } = metadata;

    return (
        <div className="relative mb-16">
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 text-center shadow-xl"
            >
                <div className="h-32 flex items-center justify-center mb-6">
                    {attachments.length > 0 ? (
                        <img src={attachments[0].url} alt="sponsor" className="h-full object-contain" />
                    ) : (
                        <span className="text-white/50 italic">No Logo</span>
                    )}
                </div>
                <h3 className="text-2xl font-bold text-white">{title}</h3>
                <p className="mt-2 text-fuchsia-300">{budgetRange}</p>
                {eventTypes.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {eventTypes.map((et, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/70 border border-white/20"
                            >
                                {et}
                            </span>
                        ))}
                    </div>
                )}
            </motion.div>

            <button
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3"
            >
                <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3"
            >
                <ChevronRight className="h-5 w-5 text-white" />
            </button>
        </div>
    );
};

/* ======================================================
   Sponsor Card
   ====================================================== */
const SponsorCard = ({ sponsor }) => {
    const { _id, title, description, metadata = {}, attachments = [] } = sponsor;
    const { budgetRange, eventTypes = [], tier } = metadata;

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -6 }}
            transition={{ type: "spring", stiffness: 200 }}
            className={`relative rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl
        ${tier === "premium"
                    ? "border-1 border-fuchsia-500/60 bg-gradient-to-br from-fuchsia-900/30 via-purple-900/20 to-sky-900/20 shadow-[0_0_25px_rgba(236,72,153,0.4)]"
                    : "border border-white/10 bg-white/[0.06] shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                }`}
        >
            {/* Premium Highlight */}
            {tier === "premium" && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold 
            bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white shadow-lg
            border border-white/20">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-yellow-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2l2.39 6.96H22l-5.45 3.96L18.78 20 12 15.9 5.22 20l1.23-7.08L1 8.96h7.61z" />
                        </svg>
                        PREMIUM
                    </span>
                </div>
            )}

            {/* Banner / Logo */}
            <div className="h-40 bg-gradient-to-r from-fuchsia-600/30 via-purple-600/30 to-sky-600/30 
                flex items-center justify-center overflow-hidden">
                {sponsor.logo?.url ? (
                    <img
                        src={sponsor.logo.url}
                        alt="sponsor-logo"
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-white/50 italic">No Logo</span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col">
                <h3 className="text-xl font-bold text-white/90">{title}</h3>
                <p className="mt-2 text-base text-gray-300 truncate">{description}</p>

                <div className="mt-4 space-y-3 text-base">
                    <p>
                        <span className="text-white/60">Budget: </span>
                        <span className="font-semibold text-fuchsia-300">{budgetRange || "—"}</span>
                    </p>

                    {eventTypes.length > 0 && (
                        <div>
                            <p className="text-white/60 mb-2 font-medium">Event Types:</p>
                            <div className="flex flex-wrap gap-2">
                                {eventTypes.map((et, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/90 border border-white/20"
                                    >
                                        {et}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    <button
                        onClick={() => (window.location.href = `/task/${_id}`)}
                        className="w-full mt-6 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 
                         hover:opacity-90 transition rounded-xl py-2 px-4 text-sm font-semibold text-white shadow-md"
                    >
                        View Sponsorship
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

/* ======================================================
   Empty State
   ====================================================== */
const EmptyState = () => (
    <div className="text-center py-24">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-6 h-32 w-32 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-sky-500/20 flex items-center justify-center"
        >
            <span className="text-5xl">✨</span>
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">No Sponsors Yet</h3>
        <p className="text-white/60 mb-6">
            Be the first to list your brand as a sponsor and gain visibility.
        </p>
        <a
            href="/List-Sponsorship"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 
                 text-white font-semibold hover:opacity-90 transition"
        >
            List Yourself as Sponsor
        </a>
    </div>
);

/* ======================================================
   Page Component
   ====================================================== */
export default function Sponsorships() {
    const [sponsorships, setSponsorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [minBudget, setMinBudget] = useState("");
    const [maxBudget, setMaxBudget] = useState("");
    const [selectedTier, setSelectedTier] = useState("");
    const [search, setSearch] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [selectedReturn, setSelectedReturn] = useState("");

    const eventOptions = [
        "College Fest",
        "Tech Seminar",
        "Hackathon",
        "Cultural Event",
        "Corporate Conference",
        "Community Meetup",
        "Concert / Festival",
    ];
    const returnOptions = [
        "Logo on Posters / Flyers",
        "Stall / Booth at Venue",
        "Social Media Mentions",
        "Mentions in Brochure / Announcements",
        "Free Passes / VIP Invites",
        "Banner Display at Venue",
        "Branding on Merchandise",
    ];

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/tasks`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed fetch");
                const data = await res.json();
                if (alive) {
                    const onlySponsors = data.filter(
                        (t) =>
                            (Array.isArray(t.category) &&
                                t.category.some((c) => c.toLowerCase() === "sponsorship")) ||
                            t.category === "Sponsorship"
                    );
                    setSponsorships(onlySponsors);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const filtered = useMemo(() => {
        return sponsorships.filter((s) => {
            const inSearch =
                !search ||
                s.title.toLowerCase().includes(search.toLowerCase()) ||
                (s.description || "").toLowerCase().includes(search.toLowerCase());

            const eventsOk =
                !selectedEvent || (s.metadata?.eventTypes || []).includes(selectedEvent);

            const returnsOk =
                !selectedReturn || (s.metadata?.expectedReturns || []).includes(selectedReturn);


            const budgetValue =
                parseInt((s.metadata?.budgetRange || "0").replace(/\D/g, "")) || 0;
            const budgetOk =
                (!minBudget || budgetValue >= parseInt(minBudget)) &&
                (!maxBudget || budgetValue <= parseInt(maxBudget));

            const tierOk = !selectedTier || s.metadata?.tier === selectedTier;

            return inSearch && eventsOk && returnsOk && budgetOk && tierOk;
        });
    }, [sponsorships, search, selectedEvent, selectedReturn, minBudget, maxBudget, selectedTier]);

    const toggle = (arr, setter, v) => {
        setter((prev) =>
            prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-black text-gray-100 relative overflow-hidden">
            <Navbar />
            <Aurora />
            <Particles />

            <main className="relative pt-28 pb-20 max-w-7xl mx-auto px-6">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                        <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">
                            Find Sponsors
                        </span>
                    </h1>
                    <p className="mt-4 text-white/70 max-w-2xl mx-auto">
                        Browse brands and organizations ready to back your events.
                        Filter by type, budget, and expected returns to find the perfect sponsor.
                    </p>
                </motion.div>

                {/* Search */}
                <div className="mb-16 max-w-2xl mx-auto relative">
                    <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search sponsors..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 
                       text-white placeholder-gray-400 focus:ring-2 focus:ring-fuchsia-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Filters Sidebar */}
                    <aside className="w-72 hidden md:block space-y-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 h-fit sticky top-24 relative overflow-hidden shadow-[0_0_25px_rgba(236,72,153,0.5)]">
                        <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
                            <Filter className="h-5 w-5 text-fuchsia-400" />
                            Filters
                        </h2>

                        {/* Event Types */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-white/70">
                                <Layers className="h-4 w-4 text-violet-400" /> Event Types
                            </label>

                            <select
                                value={selectedEvent}
                                onChange={(e) => setSelectedEvent(e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 transition"
                            >
                                <option value="">All</option>
                                {eventOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Expected Returns */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-white/70">
                                <Gift className="h-4 w-4 text-pink-400" /> Expected Returns
                            </label>

                            <select
                                value={selectedReturn}
                                onChange={(e) => setSelectedReturn(e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 transition"
                            >
                                <option value="">Any</option>
                                {returnOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Budget Range */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-white/70">
                                <Wallet className="h-4 w-4 text-sky-400" /> Budget (₹)
                            </label>

                            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                                <span className="px-2 py-0.5 rounded-lg bg-white/10">{minBudget || "Min"}</span>
                                <span className="px-2 py-0.5 rounded-lg bg-white/10">{maxBudget || "Max"}</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="200000"
                                    step="1000"
                                    value={minBudget}
                                    onChange={(e) => setMinBudget(e.target.value)}
                                    className="w-full accent-fuchsia-500"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="200000"
                                    step="1000"
                                    value={maxBudget}
                                    onChange={(e) => setMaxBudget(e.target.value)}
                                    className="w-full accent-sky-500"
                                />
                            </div>
                        </div>

                        {/* Tier */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm text-white/70">
                                <Star className="h-4 w-4 text-emerald-400" /> Tier
                            </label>

                            <select
                                value={selectedTier}
                                onChange={(e) => setSelectedTier(e.target.value)}
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 transition"
                            >
                                <option value="">Any</option>
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>
                    </aside>

                    {/* Sponsorship Grid */}
                    <div className="md:col-span-3">
                        {loading ? (
                            <p className="text-center text-gray-400">Loading sponsors...</p>
                        ) : filtered.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {filtered.map((s) => (
                                    <SponsorCard key={s._id} sponsor={s} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState />
                        )}
                    </div>
                </div>

            </main>

            <Footer />
        </div>
    );
}
