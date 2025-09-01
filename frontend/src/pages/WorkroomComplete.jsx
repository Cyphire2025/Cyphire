import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function WorkroomComplete() {
  const { workroomId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b12] to-black text-white">
      <div className="max-w-xl mx-auto px-4 pt-24">
        <h1 className="text-2xl font-semibold mb-2">Task finalised</h1>
        <p className="text-white/70">
          Both parties have finalized this workroom. The chat has been locked and will be retained for 7 days.
        </p>
        <button
          onClick={() => navigate(`/workroom/${workroomId}/payment`)}
          className="mt-6 text-sm rounded-xl px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700"
        >
          Proceed for receiving payment
        </button>
      </div>
    </div>
  );
}
