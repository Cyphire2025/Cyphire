import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX } from "react-icons/fi";
import { Filter, Layers, Wallet, Gift, Star } from "lucide-react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

// Custom hook to debounce input
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

/* ======================================================
   Background Effects (Memoized for Performance)
   ====================================================== */
const Aurora = React.memo(() => (
    <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -inset-x-40 -top-40 h-[50rem] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute -inset-x-20 -top-20 h-[50rem] bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.12),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[40rem] bg-[radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.12),transparent_60%)]" />
        <div
            className="pointer-events-none absolute inset-0 
      bg-[conic-gradient(from_180deg_at_50%_50%,rgba(168,85,247,0.06),rgba(14,165,233,0.06),rgba(236,72,153,0.06),rgba(168,85,247,0.06))]"
        />
    </div>
));

const Particles = React.memo(() => (
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
                    willChange: 'transform', // GPU acceleration hint
                }}
            />
        ))}
        <style>{`
      @keyframes float0 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-10px)} }
      @keyframes float1 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-16px)} }
      @keyframes float2 { 0%,100%{ transform: translateY(0)} 50%{ transform: translateY(-22px)} }
    `}</style>
    </div>
));

/* ======================================================
   Sponsor Card (Memoized for Performance)
   ====================================================== */
const SponsorCard = React.memo(({ sponsor }) => {
    const { _id, title, description, metadata = {} } = sponsor;
    const { budgetRange, eventTypes = [], tier } = metadata;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className={`relative rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl
        ${tier === "premium"
                    ? "border-1 border-fuchsia-500/60 bg-gradient-to-br from-fuchsia-900/30 via-purple-900/20 to-sky-900/20 shadow-[0_0_25px_rgba(236,72,153,0.4)]"
                    : "border border-white/10 bg-white/[0.06] shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                }`}
        >
            {tier === "premium" && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 text-white shadow-lg border border-white/20">
                        <Star className="h-3.5 w-3.5 text-yellow-300" fill="currentColor" />
                        PREMIUM
                    </span>
                </div>
            )}

            <div className="h-40 bg-gradient-to-r from-fuchsia-600/30 via-purple-600/30 to-sky-600/30 flex items-center justify-center overflow-hidden">
                {sponsor.logo?.url ? (
                    <img src={sponsor.logo.url} alt={`${title} logo`} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                    <span className="text-white/50 italic">No Logo</span>
                )}
            </div>

            <div className="flex-1 p-6 flex flex-col">
                <h3 className="text-xl font-bold text-white/90">{title}</h3>
                <p className="mt-2 text-sm text-gray-300 line-clamp-2">{description}</p>

                <div className="mt-4 space-y-3 text-sm">
                    <p>
                        <span className="text-white/60">Budget: </span>
                        <span className="font-semibold text-fuchsia-300">{budgetRange || "—"}</span>
                    </p>

                    {eventTypes.length > 0 && (
                        <div>
                            <p className="text-white/60 mb-2 font-medium">Event Types:</p>
                            <div className="flex flex-wrap gap-2">
                                {eventTypes.slice(0, 3).map((et) => (
                                    <span key={et} className="px-3 py-1 rounded-full text-xs bg-white/10 text-white/90 border border-white/20">
                                        {et}
                                    </span>
                                ))}
                                {eventTypes.length > 3 && (
                                    <span className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/60 border border-white/10">
                                        +{eventTypes.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-6">
                    {/* For security and performance, use a routing library's Link component instead of window.location */}
                    <a href={`/task/${_id}`} className="block w-full text-center bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 hover:opacity-90 transition rounded-xl py-2 px-4 text-sm font-semibold text-white shadow-md">
                        View Sponsorship
                    </a>
                </div>
            </div>
        </motion.div>
    );
});


/* ======================================================
   Empty State
   ====================================================== */
const EmptyState = ({ isFiltered }) => (
    <div className="text-center py-24 md:col-span-3">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-6 h-32 w-32 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-sky-500/20 flex items-center justify-center"
        >
            <span className="text-5xl">{isFiltered ? '🧐' : '✨'}</span>
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">
            {isFiltered ? 'No Matching Sponsors Found' : 'No Sponsors Yet'}
        </h3>
        <p className="text-white/60 mb-6 max-w-sm mx-auto">
            {isFiltered ? 'Try adjusting your filters to find the perfect match.' : 'Be the first to list your brand as a sponsor and gain visibility.'}
        </p>
        {!isFiltered && (
            <a href="/List-Sponsorship" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-sky-600 text-white font-semibold hover:opacity-90 transition">
                List Yourself as Sponsor
            </a>
        )}
    </div>
);


/* ======================================================
   Filter Sidebar Component
   ====================================================== */
const FilterControls = ({
    eventOptions,
    returnOptions,
    filters,
    setters,
}) => {
    return (
        <aside className="space-y-8 rounded-2xl border border-fuchsia-500/40 bg-white/5 backdrop-blur-2xl p-6 h-fit sticky top-24 shadow-[0_0_25px_rgba(236,72,153,0.5)]">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Filter className="h-5 w-5 text-fuchsia-400" />
                Filters
            </h2>

            {/* Event Types */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-white/70">
                    <Layers className="h-4 w-4 text-violet-400" /> Event Types
                </label>
                <select value={filters.selectedEvent} onChange={(e) => setters.setSelectedEvent(e.target.value)} className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 transition">
                    <option value="">All</option>
                    {eventOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
            </div>

            {/* Expected Returns */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-white/70">
                    <Gift className="h-4 w-4 text-pink-400" /> Expected Returns
                </label>
                <select value={filters.selectedReturn} onChange={(e) => setters.setSelectedReturn(e.target.value)} className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 transition">
                    <option value="">Any</option>
                    {returnOptions.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-white/70">
                    <Wallet className="h-4 w-4 text-sky-400" /> Budget (₹)
                </label>
                <div className="flex flex-col gap-3">
                    <label className="text-xs text-white/60">Min: ₹{Number(filters.minBudget).toLocaleString()}</label>
                    <input type="range" min="0" max="500000" step="10000" value={filters.minBudget} onChange={(e) => setters.setMinBudget(e.target.value)} className="w-full accent-fuchsia-500" />
                    <label className="text-xs text-white/60">Max: ₹{Number(filters.maxBudget).toLocaleString()}</label>
                    <input type="range" min="0" max="500000" step="10000" value={filters.maxBudget} onChange={(e) => setters.setMaxBudget(e.target.value)} className="w-full accent-sky-500" />
                </div>
            </div>

            {/* Tier */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-white/70">
                    <Star className="h-4 w-4 text-emerald-400" /> Tier
                </label>
                <select value={filters.selectedTier} onChange={(e) => setters.setSelectedTier(e.target.value)} className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-fuchsia-500 transition">
                    <option value="">Any</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                </select>
            </div>
        </aside>
    );
};


/* ======================================================
   Main Page Component
   ====================================================== */
export default function Sponsorships() {
    const [sponsorships, setSponsorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterOpen, setFilterOpen] = useState(false);

    // Filter states
    const [minBudget, setMinBudget] = useState("0");
    const [maxBudget, setMaxBudget] = useState("500000");
    const [selectedTier, setSelectedTier] = useState("");
    const [search, setSearch] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [selectedReturn, setSelectedReturn] = useState("");

    const debouncedSearch = useDebounce(search, 300); // 300ms delay

    const eventOptions = useMemo(() => [
        "College Fest", "Tech Seminar", "Hackathon", "Cultural Event",
        "Corporate Conference", "Community Meetup", "Concert / Festival",
    ], []);
    const returnOptions = useMemo(() => [
        "Logo on Posters / Flyers", "Stall / Booth at Venue", "Social Media Mentions",
        "Mentions in Brochure / Announcements", "Free Passes / VIP Invites",
        "Banner Display at Venue", "Branding on Merchandise",
    ], []);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        (async () => {
            setLoading(true);
            try {
                // OPTIMIZATION: Fetch only sponsorships from the API
                const res = await fetch(`${API_BASE}/api/tasks?category=sponsorship`, { cache: "no-store", signal });
                if (!res.ok) throw new Error("Failed to fetch sponsorships");
                const data = await res.json();
                
                // OPTIMIZATION: Pre-process data once on fetch
                const processedData = data.map(s => ({
                    ...s,
                    // Parse budget into a number for efficient filtering
                    budgetValue: parseInt((s.metadata?.budgetRange || "0").replace(/[^0-9]/g, "")) || 0,
                }));
                setSponsorships(processedData);

            } catch (e) {
                if (e.name !== 'AbortError') console.error(e);
            } finally {
                setLoading(false);
            }
        })();
        return () => controller.abort(); // Cleanup on unmount
    }, []);

    const filteredSponsors = useMemo(() => {
        return sponsorships.filter((s) => {
            const searchLower = debouncedSearch.toLowerCase();
            const inSearch = !debouncedSearch ||
                s.title.toLowerCase().includes(searchLower) ||
                (s.description || "").toLowerCase().includes(searchLower);

            const eventsOk = !selectedEvent || (s.metadata?.eventTypes || []).includes(selectedEvent);
            const returnsOk = !selectedReturn || (s.metadata?.expectedReturns || []).includes(selectedReturn);

            const budgetOk = s.budgetValue >= parseInt(minBudget) && s.budgetValue <= parseInt(maxBudget);
            const tierOk = !selectedTier || s.metadata?.tier === selectedTier;

            return inSearch && eventsOk && returnsOk && budgetOk && tierOk;
        });
    }, [sponsorships, debouncedSearch, selectedEvent, selectedReturn, minBudget, maxBudget, selectedTier]);

    const filterProps = {
        eventOptions,
        returnOptions,
        filters: { minBudget, maxBudget, selectedTier, selectedEvent, selectedReturn },
        setters: { setMinBudget, setMaxBudget, setSelectedTier, setSelectedEvent, setSelectedReturn }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-black text-gray-100 relative overflow-hidden">
            <Navbar />
            <Aurora />
            <Particles />

            <main className="relative pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                        <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-sky-400 bg-clip-text text-transparent">
                            Find Sponsors
                        </span>
                    </h1>
                    <p className="mt-4 text-white/70 max-w-2xl mx-auto">
                        Browse brands and organizations ready to back your events.
                        Filter by type, budget, and expected returns to find the perfect sponsor.
                    </p>
                </motion.div>

                <div className="mb-12 max-w-2xl mx-auto relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search sponsors by name or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-fuchsia-500 transition-all"
                    />
                </div>

                {/* Mobile Filter Button */}
                <div className="md:hidden mb-6 text-center">
                    <button
                        onClick={() => setFilterOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-semibold"
                    >
                        <Filter className="h-4 w-4" />
                        Show Filters
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Desktop Filters Sidebar */}
                    <div className="hidden md:block">
                        <FilterControls {...filterProps} />
                    </div>

                    {/* Sponsorship Grid */}
                    <div className="md:col-span-3">
                        {loading ? (
                            <p className="text-center text-lg text-gray-400">Loading sponsors...</p>
                        ) : filteredSponsors.length > 0 ? (
                            <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <AnimatePresence>
                                    {filteredSponsors.map((s) => (
                                        <SponsorCard key={s._id} sponsor={s} />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <EmptyState isFiltered={sponsorships.length > 0} />
                        )}
                    </div>
                </div>
            </main>
            
            {/* Mobile Filter Drawer */}
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setFilterOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    >
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-0 left-0 h-full w-full max-w-xs bg-[#0c0c14] border-r border-fuchsia-500/30 p-6 overflow-y-auto"
                        >
                           <button onClick={() => setFilterOpen(false)} className="absolute top-4 right-4 text-white/70">
                                <FiX size={24} />
                           </button>
                           <FilterControls {...filterProps} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}