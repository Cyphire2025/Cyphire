import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = new URLSearchParams(location.search).get("plan") || "free";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/me/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        setSuccess(true);
        // reload page so Navbar refetches updated plan
        setTimeout(() => window.location.href = "/home", 2000);
      }
      else {
        alert("Failed to update plan");
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0f] via-[#0c0c14] to-[#000] text-white">
      {!success ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Checkout</h1>
          <p className="mb-6">You selected the <b>{plan}</b> plan.</p>
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 font-semibold hover:from-pink-600 hover:to-purple-600 transition"
          >
            {loading ? "Processing..." : "Fake Pay & Activate"}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-green-400 mb-2">✅ Payment Successful</h2>
          <p>Your {plan} plan is now active.</p>
        </div>
      )}
    </div>
  );
}
