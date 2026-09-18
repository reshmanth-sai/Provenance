import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#FAFAFA",
        "surface-card": "#FFFFFF",
        primary: "#1A1A1A",
        accent: {
          DEFAULT: "#1E5F74",
          hover: "#154756",
          light: "#EAF3F6",
        },
        obsidian: {
          DEFAULT: "#08090C",
          surface: "#0C0E14",
          card: "#12151E",
          elevated: "#181C28",
          border: "rgba(255, 255, 255, 0.08)",
          "border-hover": "rgba(255, 255, 255, 0.16)",
          muted: "#64748B",
          dim: "#334155",
        },
        phosphor: {
          DEFAULT: "#10B981",
          glow: "rgba(16, 185, 129, 0.18)",
          dim: "#059669",
        },
        crimson: {
          DEFAULT: "#F43F5E",
          glow: "rgba(244, 63, 94, 0.22)",
        },
        amber: {
          DEFAULT: "#F59E0B",
          glow: "rgba(245, 158, 11, 0.2)",
        },
      },
      fontFamily: {
        display: ["var(--font-space)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tighter: "-0.05em",
        tight: "-0.03em",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "marquee": "marquee 25s linear infinite",
        "marquee-reverse": "marquee-reverse 25s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
