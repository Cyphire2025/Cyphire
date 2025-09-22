// src/components/ui/NeonTooltip.jsx
import React from "react"
import { motion } from "framer-motion"

export default function NeonTooltip({ children, text }) {
  return (
    <div className="relative group w-full">
      {children}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-50 
                   pointer-events-none whitespace-nowrap px-4 py-2 
                   rounded-xl text-sm font-medium text-purple-100 
                   bg-[#141414]/90 backdrop-blur-md border border-purple-400/30
                   shadow-[0_0_15px_rgba(168,85,247,0.45)]"
      >
        {text}
      </motion.div>
    </div>
  )
}
