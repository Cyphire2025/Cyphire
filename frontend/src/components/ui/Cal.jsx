// src/components/ui/Calendar.jsx
// Cyphire Neon Glass Calendar
// Tailwind + Framer Motion + date-fns
// ~450 lines for glassmorphic, futuristic UI

import React, { useState } from "react"
import { AnimatePresence } from "framer-motion"
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  format,
  addDays,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
} from "lucide-react"

export default function Calendar({
  selected,
  onSelect,
  className = "",
}) {
  const [currentMonth, setCurrentMonth] = useState(
    selected ? startOfMonth(selected) : new Date()
  )

  // Helpers
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-lg font-semibold bg-gradient-to-r from-pink-400 via-purple-300 to-purple-100 bg-clip-text text-transparent"
        >
          {format(currentMonth, "MMMM yyyy")}
        </motion.h2>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevMonth}
            className="rounded-full bg-white/10 p-2 hover:bg-purple-500/30 transition border border-white/10"
          >
            <ChevronLeft className="h-5 w-5 text-purple-200" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextMonth}
            className="rounded-full bg-white/10 p-2 hover:bg-purple-500/30 transition border border-white/10"
          >
            <ChevronRight className="h-5 w-5 text-purple-200" />
          </motion.button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const date = new Date()
    const weekStart = startOfWeek(date)

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="text-xs font-medium text-gray-400 uppercase tracking-wide flex justify-center"
        >
          {format(addDays(weekStart, i), "EEE")}
        </div>
      )
    }

    return <div className="grid grid-cols-7 gap-2 px-6 pt-3">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d")
        const cloneDay = day

        const isSelected = selected && isSameDay(day, selected)
        const isCurrentMonth = isSameMonth(day, monthStart)

        days.push(
          <motion.div
            key={day}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cloneDay)}
            className={[
              "flex items-center justify-center rounded-2xl cursor-pointer py-2 text-sm font-medium transition-all relative",
              isCurrentMonth
                ? "text-gray-200"
                : "text-gray-500/50",
              isSelected
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/40"
                : "hover:bg-purple-500/20 hover:text-white",
            ].join(" ")}
          >
            <span>{formattedDate}</span>
            {isSelected && (
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-pink-300 animate-pulse" />
            )}
          </motion.div>
        )

        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2 px-6" key={day}>
          {days}
        </div>
      )
      days = []
    }

    return <div className="mt-3 space-y-2">{rows}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={[
        "rounded-3xl border border-white/10 bg-[#141414]/70 backdrop-blur-2xl shadow-[0_25px_80px_rgba(129,17,188,0.35)]",
        "overflow-hidden w-[350px] sm:w-[420px]",
        className,
      ].join(" ")}
    >
      {/* Neon Glow Accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl" />
      </div>

      {/* Calendar Content */}
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      {/* Footer */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-white/10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(new Date())}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-purple-100 bg-purple-500/20 hover:bg-purple-500/40 transition"
        >
          Today
        </motion.button>
        {selected && (
          <p className="text-xs text-gray-400">
            Selected: {format(selected, "PPPP")}
          </p>
        )}
      </div>
    </motion.div>
  )
}
// ---- Continuation from Part 1 ----

/* Utility: Neon Divider */
const NeonDivider = () => (
  <div className="relative w-full h-[1px] bg-white/10 overflow-hidden my-2">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-[pulse_4s_ease-in-out_infinite]" />
  </div>
)

/* Utility: Neon Glow Orb */
const GlowOrb = ({ className }) => (
  <div
    className={[
      "absolute rounded-full blur-3xl opacity-30",
      className,
    ].join(" ")}
  />
)

/* Utility: Neon Grid Overlay */
const NeonGrid = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="grid grid-cols-7 grid-rows-6 h-full w-full opacity-[0.06]">
      {Array.from({ length: 42 }).map((_, i) => (
        <div
          key={i}
          className="border border-purple-500/40"
        />
      ))}
    </div>
  </div>
)

/* Extended Calendar with animations */
export function AnimatedCalendar({
  selected,
  onSelect,
  className = "",
}) {
  const [currentMonth, setCurrentMonth] = useState(
    selected ? startOfMonth(selected) : new Date()
  )
  const [direction, setDirection] = useState(0)

  const handleMonthChange = (dir) => {
    setDirection(dir)
    setCurrentMonth((prev) =>
      dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1)
    )
  }

  // Render header with year selector
  const renderHeader = () => {
    const year = format(currentMonth, "yyyy")
    return (
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <span className="text-lg font-semibold bg-gradient-to-r from-pink-400 via-purple-300 to-purple-100 bg-clip-text text-transparent">
            {format(currentMonth, "MMMM")}
          </span>
          <select
            value={year}
            onChange={(e) =>
              setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))
            }
            className="bg-white/10 backdrop-blur-md text-white text-sm rounded-xl px-2 py-1 border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const yr = new Date().getFullYear() - 6 + i
              return (
                <option key={yr} value={yr} className="bg-[#141414] text-white">
                  {yr}
                </option>
              )
            })}
          </select>
        </motion.div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMonthChange(-1)}
            className="rounded-full bg-white/10 p-2 hover:bg-purple-500/30 transition border border-white/10"
          >
            <ChevronLeft className="h-5 w-5 text-purple-200" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMonthChange(1)}
            className="rounded-full bg-white/10 p-2 hover:bg-purple-500/30 transition border border-white/10"
          >
            <ChevronRight className="h-5 w-5 text-purple-200" />
          </motion.button>
        </div>
      </div>
    )
  }

  // Animated month body
  const renderMonthBody = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const isSelected = selected && isSameDay(day, selected)
        const isCurrentMonth = isSameMonth(day, monthStart)

        days.push(
          <motion.div
            key={day}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(cloneDay)}
            className={[
              "flex items-center justify-center rounded-2xl cursor-pointer py-2 text-sm font-medium transition-all relative",
              isCurrentMonth
                ? "text-gray-200"
                : "text-gray-500/50",
              isSelected
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/40"
                : "hover:bg-purple-500/20 hover:text-white",
            ].join(" ")}
          >
            <span>{format(day, "d")}</span>
            {isSelected && (
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-pink-300 animate-pulse" />
            )}
          </motion.div>
        )

        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2 px-6" key={day}>
          {days}
        </div>
      )
      days = []
    }

    return (
      <motion.div
        key={currentMonth}
        custom={direction}
        initial={{ x: direction === 1 ? 100 : -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction === 1 ? -100 : 100, opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="mt-3 space-y-2"
      >
        {rows}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={[
        "relative rounded-3xl border border-white/10 bg-[#141414]/70 backdrop-blur-2xl shadow-[0_25px_80px_rgba(129,17,188,0.35)]",
        "overflow-hidden w-[350px] sm:w-[420px]",
        className,
      ].join(" ")}
    >
      {/* Neon layers */}
      <GlowOrb className="top-0 left-0 h-64 w-64 bg-purple-500" />
      <GlowOrb className="-bottom-20 right-10 h-56 w-56 bg-pink-500" />
      <NeonGrid />

      {/* Content */}
      {renderHeader()}
      {renderMonthBody()}

      <NeonDivider />

      <div className="px-6 py-4 flex items-center justify-between border-t border-white/10 relative z-10">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(new Date())}
          className="px-3 py-1.5 rounded-full text-xs font-medium text-purple-100 bg-purple-500/20 hover:bg-purple-500/40 transition"
        >
          Today
        </motion.button>
        {selected && (
          <p className="text-xs text-gray-400">
            {format(selected, "PPPP")}
          </p>
        )}
      </div>
    </motion.div>
  )
}
