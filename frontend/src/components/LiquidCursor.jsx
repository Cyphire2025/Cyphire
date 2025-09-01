// src/components/LiquidCursor.jsx
import React, { useEffect, useState } from "react";

export default function LiquidCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const moveHandler = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", moveHandler);
    return () => {
      window.removeEventListener("mousemove", moveHandler);
    };
  }, []);

  return (
    <div
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: "translate(-70%, -70%)"
      }}
      className="fixed pointer-events-none w-6 h-6 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-150 ease-out z-[9999]"
    />
  );
}
