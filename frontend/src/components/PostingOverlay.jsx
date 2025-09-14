import React from "react";
import { motion } from "framer-motion";

export default function PostingOverlay({ posting, posted, error, redirectTo = "Tasks" }) {
  if (!posting && !posted && !error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        {/* ❌ Failure */}
        {error && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.6)]"
            >
              <span className="text-5xl">❌</span>
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-red-400 mb-2">
              Failed to Post
            </h2>
            <p className="text-gray-300 mb-6">Something went wrong. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              Retry
            </button>
          </>
        )}

        {/* ✅ Success */}
        {posted && !error && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-400 shadow-[0_0_40px_rgba(34,197,94,0.6)]"
            >
              <span className="text-5xl">✅</span>
            </motion.div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-green-400 mb-2">
              Task Posted Successfully!
            </h2>
            <p className="text-gray-300 mb-6">
              Redirecting you to {redirectTo}...
            </p>

            {/* Subtle confetti effect */}
            <motion.div
              className="flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i % 2 === 0 ? "#22c55e" : "#4ade80",
                  }}
                  initial={{ y: 0 }}
                  animate={{ y: [0, -20, 0] }}
                  transition={{
                    duration: 1 + i * 0.05,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          </>
        )}

        {/* ⏳ Loading */}
        {posting && !posted && !error && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="h-20 w-20 rounded-full border-4 border-fuchsia-500 border-t-transparent mb-8 shadow-lg"
            />
            <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-gradient-to-r from-fuchsia-400 via-purple-400 to-sky-400 bg-clip-text">
              Posting your task...
            </h2>
            <p className="mt-3 text-gray-300 text-sm md:text-base">
              Please wait while we upload your task
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
