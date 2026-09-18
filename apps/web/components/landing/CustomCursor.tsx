"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [cursorText, setCursorText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable custom cursor on non-touch desktop devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = (e.target as HTMLElement)?.closest("[data-cursor]") as HTMLElement;
      if (target) {
        setCursorText(target.getAttribute("data-cursor") || "");
        setIsHovered(true);
      } else {
        setIsHovered(false);
        setCursorText("");
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Outer Follower Ring */}
      <motion.div
        className="absolute top-0 left-0 -ml-4 -mt-4 flex items-center justify-center rounded-full border border-phosphor/60 transition-colors"
        animate={{
          x: mousePos.x,
          y: mousePos.y,
          scale: isHovered ? 1.8 : 1,
          backgroundColor: isHovered ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.03)",
        }}
        transition={{ type: "spring", damping: 28, stiffness: 350, mass: 0.1 }}
        style={{ width: 32, height: 32 }}
      >
        {cursorText && (
          <span className="text-[8px] font-mono uppercase tracking-widest text-phosphor font-bold">
            {cursorText}
          </span>
        )}
      </motion.div>

      {/* Central Precision Reticle Dot */}
      <motion.div
        className="absolute top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-phosphor"
        animate={{
          x: mousePos.x,
          y: mousePos.y,
        }}
        transition={{ type: "spring", damping: 50, stiffness: 800 }}
      />
    </div>
  );
}
