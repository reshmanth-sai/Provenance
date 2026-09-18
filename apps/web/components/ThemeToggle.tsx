"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a neutral placeholder with matching geometry during SSR to prevent hydration shifts
    return (
      <div className="w-8 h-8 rounded-lg border border-transparent" aria-hidden="true" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      data-cursor="THEME"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 dark:hover:bg-white/10 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 transition-colors border border-white/10 dark:border-white/10 light:border-slate-200"
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
