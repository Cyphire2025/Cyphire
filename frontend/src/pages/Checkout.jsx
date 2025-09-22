import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = new URLSearchParams(location.search).get("plan") || "free";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Map plans to INR prices
  const planPrices = {
    free: 0,
    plus: 499,
    ultra: 1499,
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (plan === "free") {
        // directly activate free plan
        await axios.patch(
          `${API_BASE}/api/users/me/plan`,
          { plan },
          { withCredentials: true }
        );
        setSuccess(true);
        setTimeout(() => navigate("/home"), 2000);
        return;
      }

      // 1) Create Razorpay order
      const { data: order } = await axios.post(
        `${API_BASE}/api/payment/create-order`,
        { amount: planPrices[plan] },
        { withCredentials: true }
      );

      // 2) Open Razorpay popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Cyphire",
        description: `${plan} plan subscription`,
        order_id: order.id,
        handler: async function () {
          try {
            // 3) On success → activate plan
            await axios.patch(
              `${API_BASE}/api/users/me/plan`,
              { plan },
              { withCredentials: true }
            );
            setSuccess(true);
            setTimeout(() => navigate("/home"), 2000);
          } catch (err) {
            console.error("Plan activation error:", err);
            alert("Payment successful but plan activation failed.");
          }
        },
        theme: { color: "#5A67D8" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Checkout error:", err);
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
            {loading ? "Processing..." : `Pay ₹${planPrices[plan]} & Activate`}
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
