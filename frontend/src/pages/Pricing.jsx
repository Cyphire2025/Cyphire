import React, { useEffect, useState } from "react";
import {  } from "framer-motion";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function Pricing() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const planRank = { free: 1, plus: 2, ultra: 3 };

    const plans = [
        {
            name: "Free",
            price: "₹0",
            desc: "For starters and casual freelancers.",
            limits: ["Up to 2 tasks per month", "1 active task at a time"],
        },
        {
            name: "Plus",
            price: "₹499 /mo",
            desc: "For growing freelancers with steady work.",
            limits: ["Up to 20 tasks per month", "5 active tasks at a time"],
        },
        {
            name: "Ultra",
            price: "₹1,499 /mo",
            desc: "For professionals handling big volumes.",
            limits: ["Up to 50 tasks per month", "20 active tasks at a time"],
        },
    ];

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/auth/me`, {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (e) {
                console.error("Failed to fetch user", e);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="relative min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-white overflow-hidden">
            {/* Header */}
            <div className="text-center py-16">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent"
                >
                    Choose Your Plan
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    className="mt-4 text-white/70 text-lg"
                >
                    Flexible plans to match your freelance journey.
                </motion.p>
            </div>

            {/* Pricing Cards */}
            <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3 px-6 pb-20">
                {plans.map((plan, i) => {
                    const userPlan = user?.plan?.toLowerCase() || "free";
                    const isCurrent = userPlan === plan.name.toLowerCase();
                    const isUnlocked = planRank[userPlan] > planRank[plan.name.toLowerCase()];

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15, duration: 0.6 }}
                            whileHover={{ scale: 1.05 }}
                            className={`relative rounded-2xl border backdrop-blur-xl shadow-xl overflow-hidden transition
        ${isCurrent
                                    ? "border-green-400/50 bg-green-600/10"
                                    : isUnlocked
                                        ? "border-blue-400/40 bg-blue-600/10"
                                        : "border-fuchsia-400/30 bg-gradient-to-b from-fuchsia-600/20 via-purple-700/10 to-transparent"}`}
                        >
                            <div className="p-6 flex flex-col h-full">
                                <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
                                <div className="text-3xl font-bold mb-4">{plan.price}</div>
                                <p className="text-sm text-white/70 mb-6">{plan.desc}</p>
                                <ul className="flex-1 space-y-2 mb-6">
                                    {plan.limits.map((limit, j) => (
                                        <li key={j} className="text-white/80 flex items-center gap-2">
                                            <span className="text-fuchsia-400">✔</span> {limit}
                                        </li>
                                    ))}
                                </ul>

                                {isCurrent ? (
                                    <span className="mt-auto text-center text-green-400 font-semibold">
                                        ✓ Current Plan
                                    </span>
                                ) : isUnlocked ? (
                                    <span className="mt-auto text-center text-blue-400 font-medium">
                                        ✓ Unlocked
                                    </span>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => navigate(`/checkout?plan=${plan.name.toLowerCase()}`)}
                                        className="mt-auto w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 py-2 font-semibold hover:from-pink-600 hover:to-purple-600 transition shadow-lg shadow-fuchsia-500/30"
                                    >
                                        Get Started
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
