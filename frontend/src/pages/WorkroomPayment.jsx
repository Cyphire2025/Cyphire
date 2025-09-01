import React, { useState } from "react";
import { useParams } from "react-router-dom";

export default function WorkroomPayment() {
  const { workroomId } = useParams();
  const [form, setForm] = useState({ name: "", upi: "", account: "", ifsc: "" });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b12] to-black text-white">
      <div className="max-w-xl mx-auto px-4 pt-24">
        <h1 className="text-2xl font-semibold mb-2">Payment details</h1>
        <p className="text-white/70">Workroom: {workroomId}</p>

        <div className="mt-6 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Payee name"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
          />
          <input
            value={form.upi}
            onChange={(e) => setForm((s) => ({ ...s, upi: e.target.value }))}
            placeholder="UPI ID (optional)"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
          />
          <input
            value={form.account}
            onChange={(e) => setForm((s) => ({ ...s, account: e.target.value }))}
            placeholder="Account number"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
          />
          <input
            value={form.ifsc}
            onChange={(e) => setForm((s) => ({ ...s, ifsc: e.target.value }))}
            placeholder="IFSC"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
          />
        </div>

        <button
          onClick={() => alert("We’ll integrate Razorpay here next.")}
          className="mt-6 text-sm rounded-xl px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700"
        >
          Continue to payment
        </button>
      </div>
    </div>
  );
}
