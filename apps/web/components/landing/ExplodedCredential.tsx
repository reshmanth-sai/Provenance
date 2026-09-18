"use client";

import React, { useState, useRef } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  Layers,
  ShieldCheck,
  FileText,
  Binary,
  Fingerprint,
  CheckCircle2,
  Lock,
  Compass,
  Sparkles,
  Award,
  ChevronDown,
} from "lucide-react";

interface LayerData {
  id: string;
  step: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  details: { label: string; value: string }[];
  highlight: string;
}

const LAYERS: LayerData[] = [
  {
    id: "visual",
    step: "01",
    title: "Layer 01 // Visual Presentation Document",
    category: "SURFACE RENDERING",
    badge: "CANVAS_PARCHMENT",
    description:
      "The human-readable degree document, transcript, or certificate parchment rendered with anti-aliased SVG seals, institutional heraldry, and micro-typography.",
    highlight: "Authentic physical diploma rendering with vector seals and calligraphy.",
    details: [
      { label: "Document Type", value: "Master of Science in Computer Science" },
      { label: "Issuing Entity", value: "Massachusetts Institute of Technology" },
      { label: "Conferral Date", value: "June 05, 2024" },
      { label: "Latin Honors", value: "Summa Cum Laude (Top 1%)" },
      { label: "Seal Format", value: "High-Fidelity Vector Stamp + Ribbon" },
      { label: "Signatures", value: "President & Provost Dual Key Signoff" },
    ],
  },
  {
    id: "metadata",
    step: "02",
    title: "Layer 02 // Sanitized Structured Claims",
    category: "IDENTITY METADATA",
    badge: "W3C_VC_JSONLD",
    description:
      "Zero-leakage W3C Verifiable Credential claims. Excludes student email, telephone, and private national IDs while preserving mathematical verification.",
    highlight: "FERPA/GDPR compliant W3C claims without personal identifiable leakage.",
    details: [
      { label: "Candidate DID", value: "did:provenance:cand_88a91c0e" },
      { label: "Issuer DID", value: "did:provenance:inst_mit_4419" },
      { label: "Schema Spec", value: "https://provenance.network/schemas/v2.4" },
      { label: "Revocation Path", value: "registry.provenance.network/mit/rev#412" },
      { label: "Claim Scope", value: "Academic Degree & Cryptographic Provenance" },
      { label: "Privacy Mode", value: "Zero-Knowledge Selective Disclosure Ready" },
    ],
  },
  {
    id: "forensics",
    step: "03",
    title: "Layer 03 // Deterministic Forensic Signals",
    category: "TAMPER FORENSICS",
    badge: "6_STAGE_SCAN",
    description:
      "Automated 6-stage forensics cross-examining font anomalies, editing software artifacts, perceptual hash (pHash) layouts, and OCR character coordinate matching.",
    highlight: "Sub-pixel font kernel matching and zero editing tool artifacts detected.",
    details: [
      { label: "pHash Distance", value: "0.00 (Exact Institutional Template Match)" },
      { label: "EXIF Scrubber", value: "Clean Binary Stream (0 Manipulation Headers)" },
      { label: "OCR Concordance", value: "99.8% Lexical and Coordinate Match" },
      { label: "Font Anomaly Check", value: "Monotype Garamond (100% Vector Parity)" },
      { label: "Software Artifacts", value: "Zero Photoshop / GIMP / Canva Metadata" },
      { label: "Color Space", value: "sRGB Profile Verified • Clean Gamma Curve" },
    ],
  },
  {
    id: "cryptography",
    step: "04",
    title: "Layer 04 // Immutable Ledger Anchor",
    category: "CRYPTOGRAPHIC CONSENSUS",
    badge: "SHA256_CHAIN",
    description:
      "The root mathematical anchor committed directly into the per-issuer append-only ledger protected by row-level database advisory locks.",
    highlight: "Permanent SHA-256 hash locked into append-only cryptographic sequence.",
    details: [
      { label: "Content Digest", value: "0xa4f89d81e3a6c2f901b74c5d8e9f2a3b" },
      { label: "Parent Block Hash", value: "0xf2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2" },
      { label: "Ledger Height", value: "Block #412 (Append-Only Sequence Root)" },
      { label: "Signature Algorithm", value: "ECDSA_SECP256R1 (Hardware HSM)" },
      { label: "Consensus Lock", value: "Row-Level Advisory Lock Sealed" },
      { label: "Merkle Root", value: "0x77b0f1a923ec5418d99c4e019b88a91c" },
    ],
  },
];

export default function ExplodedCredential() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"deck" | "exploded">("deck");
  const [navStage, setNavStage] = useState<"elevating" | "flat" | null>(null);
  const jumpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll Progress tracking for the 380vh runway
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 64px", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrollPercent(latest);
    if (navStage !== null) return;

    // 4 phases: [0 - 0.25), [0.25 - 0.50), [0.50 - 0.75), [0.75 - 1.00]
    const rawStage = latest * 4;
    const layerIdx = Math.min(3, Math.floor(rawStage));

    if (layerIdx !== activeLayer) {
      setActiveLayer(layerIdx);
    }
  });

  // Mouse Parallax for subtle 3D stage tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springTiltX = useSpring(mouseY, { stiffness: 100, damping: 20 });
  const springTiltY = useSpring(mouseX, { stiffness: 100, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 12);
    mouseY.set(-y * 12);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Jump to specific layer with True Physical 2-Beat choreography:
  // Beat 1: Immediately elevates vertically in 3D stack (+115px Z)
  // Beat 2: Smoothly levels out into flat 2D viewport plane after 280ms
  const jumpToLayer = (index: number) => {
    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
    setActiveLayer(index);
    setNavStage("elevating");

    jumpTimerRef.current = setTimeout(() => {
      setNavStage("flat");
      setTimeout(() => {
        setNavStage(null);
      }, 400);
    }, 280);

    if (!containerRef.current) return;
    const containerTop =
      containerRef.current.getBoundingClientRect().top + window.scrollY;
    const totalScrollableHeight =
      containerRef.current.scrollHeight - window.innerHeight;
    // Map layer index to plateau checkpoint (~0.75 of layer's runway)
    const targetProgress = (index + 0.75) / 4;
    setScrollPercent(targetProgress);
    const targetY = containerTop - 64 + targetProgress * totalScrollableHeight;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  // True Physical Continuous & Keyframed Card Transform Engine
  const getCardTransform = (index: number) => {
    const deckBaseZ = index * 8;
    const deckBaseY = -index * 4;
    const explodedBaseZ = (index - 1.5) * 45;
    const explodedBaseY = (index - 1.5) * -25;
    const baseZ = viewMode === "deck" ? deckBaseZ : explodedBaseZ;
    const baseY = viewMode === "deck" ? deckBaseY : explodedBaseY;

    // Programmed Navigation Jump (Chip clicks)
    if (navStage !== null) {
      if (index === activeLayer) {
        if (navStage === "elevating") {
          return {
            z: baseZ + 115,
            y: baseY + 30,
            scale: 1.02,
            rotateZ: 0,
            rotateX: -8,
            opacity: 1,
            zIndex: 40,
            badgeMode: "elevating" as const,
          };
        } else {
          return {
            z: 140,
            y: 110,
            scale: 1.05,
            rotateZ: 36,
            rotateX: -52,
            opacity: 1,
            zIndex: 40,
            badgeMode: "flat" as const,
          };
        }
      }
      return {
        z: baseZ,
        y: baseY,
        scale: viewMode === "deck" ? 0.98 : 0.96,
        rotateZ: 0,
        rotateX: 0,
        opacity: viewMode === "deck" ? 0.70 : 0.40,
        zIndex: 10 + index,
        badgeMode: "deck" as const,
      };
    }

    // Continuous Scroll-Scrubbing Mode
    const sector = Math.max(0, Math.min(3.999, scrollPercent * 4));
    const currentActive = Math.min(3, Math.floor(sector));
    const isCurrent = index === currentActive;

    if (isCurrent) {
      const t = sector - currentActive; // 0.0 to 1.0 within this layer's zone

      if (t < 0.35) {
        // Beat 1: Pure 3D Vertical Lift out of the deck
        const p = t / 0.35; // 0 to 1
        const easeP = p * (2 - p); // Quad ease-out
        return {
          z: baseZ + easeP * 115,
          y: baseY + easeP * 30,
          scale: 0.98 + easeP * 0.04,
          rotateZ: 0, // Coplanar with 3D deck!
          rotateX: -easeP * 8, // gentle dynamic elevation tilt
          opacity: 1,
          zIndex: 40,
          badgeMode: "elevating" as const,
        };
      } else if (t < 0.70) {
        // Beat 2: Continuous Unfold / Counter-Rotation into Flat 2D Viewport
        const p = (t - 0.35) / 0.35; // 0 to 1
        const easeP = 0.5 - 0.5 * Math.cos(p * Math.PI); // Cosine S-curve
        return {
          z: (baseZ + 115) + easeP * (140 - (baseZ + 115)),
          y: (baseY + 30) + easeP * (110 - (baseY + 30)),
          scale: 1.02 + easeP * 0.03,
          rotateZ: easeP * 36,
          rotateX: -8 + easeP * (-52 - (-8)),
          opacity: 1,
          zIndex: 40,
          badgeMode: easeP > 0.6 ? ("flat" as const) : ("elevating" as const),
        };
      } else {
        // Beat 3: Flat 2D Plateau (Stable Inspection Focus)
        return {
          z: 140,
          y: 110,
          scale: 1.05,
          rotateZ: 36,
          rotateX: -52,
          opacity: 1,
          zIndex: 40,
          badgeMode: "flat" as const,
        };
      }
    }

    // Inactive cards resting in the deck
    return {
      z: baseZ,
      y: baseY,
      scale: viewMode === "deck" ? 0.98 : 0.96,
      rotateZ: 0,
      rotateX: 0,
      opacity: viewMode === "deck" ? 0.70 : 0.40,
      zIndex: 10 + index,
      badgeMode: "deck" as const,
    };
  };

  const activeTransform = getCardTransform(activeLayer);
  const isCardFlat = activeTransform.badgeMode === "flat";

  return (
    <div
      ref={containerRef}
      id="deconstruction"
      className="relative h-[380vh] bg-white dark:bg-obsidian border-b border-slate-200 dark:border-white/10 transition-colors duration-300"
    >
      {/* Sticky Fullscreen Viewport Stage (Pinned neatly below 64px global navbar) */}
      <div className="sticky top-16 h-[calc(100vh-4rem)] w-full flex flex-col justify-between py-3 sm:py-4 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-emerald-500/5 dark:bg-phosphor/5 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-between">
          {/* Section Header with Live Scroll Progress Indicator */}
          <div className="relative z-30 shrink-0 border-b border-slate-200 dark:border-white/10 pb-3 sm:pb-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-phosphor font-semibold flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>NUMA-INSPIRED 3D ARCHITECTURE</span>
                  </span>
                  <span className="text-slate-300 dark:text-white/20">/</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    CONTINUOUS PHYSICAL ENGINE // 3D LIFT → 2D INSPECT
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Anatomy of an Unforgeable Record.
                </h2>
              </div>

              {/* Controls: Mode Toggle + Step Navigation Chips */}
              <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 sm:pb-0">
                {/* Mode Toggle: Collapsed Deck vs Exploded Strata */}
                <button
                  onClick={() =>
                    setViewMode(viewMode === "deck" ? "exploded" : "deck")
                  }
                  data-cursor="SELECT"
                  className="px-3 py-1.5 rounded-lg font-mono text-xs transition-all flex items-center gap-1.5 border bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border-slate-300/80 dark:border-white/15 text-slate-700 dark:text-slate-300 shrink-0 shadow-2xs"
                  title="Toggle between Collapsed Deck Mode and Exploded Strata View"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-phosphor" />
                  <span className="hidden sm:inline">Stack:</span>
                  <span className="font-semibold text-emerald-700 dark:text-phosphor">
                    {viewMode === "deck" ? "Deck Mode" : "Exploded All"}
                  </span>
                </button>

                <div className="h-4 w-px bg-slate-300 dark:bg-white/10 hidden sm:block" />

                {/* Step Chips */}
                {LAYERS.map((layer, idx) => {
                  const isCurrent = activeLayer === idx;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => jumpToLayer(idx)}
                      data-cursor="SELECT"
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all flex items-center gap-2 border ${
                        isCurrent
                          ? "bg-emerald-500/10 dark:bg-phosphor/15 border-emerald-500/40 dark:border-phosphor/40 text-emerald-700 dark:text-phosphor font-semibold shadow-xs"
                          : "bg-slate-100/80 hover:bg-slate-200/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span className="text-[10px] opacity-75">{layer.step}</span>
                      <span className="hidden sm:inline">
                        {idx === 0
                          ? "Visual"
                          : idx === 1
                          ? "Claims"
                          : idx === 2
                          ? "Forensics"
                          : "Ledger"}
                      </span>
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-phosphor animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Continuous Scrubbing Progress Bar */}
            <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full mt-3 overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-phosphor dark:to-emerald-400"
                style={{ width: `${Math.max(5, scrollPercent * 100)}%` }}
              />
            </div>
          </div>

          {/* Interactive 3D Perspective Stage & Inspector */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-1 sm:py-2 relative z-10"
          >
            {/* Left 3D Isometric Viewport */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[350px] sm:min-h-[410px] perspective-stage pt-1 sm:pt-2">
              {/* Floor Deck Shadow & Base Plate */}
              <div
                className="absolute inset-x-8 -bottom-4 h-12 bg-black/10 dark:bg-black/60 blur-2xl rounded-full pointer-events-none"
                style={{ transform: "translateZ(-30px)" }}
              />

              <motion.div
                className="relative w-full max-w-[420px] h-[330px] preserve-3d"
                style={{
                  rotateX: 52,
                  rotateY: 0,
                  rotateZ: -36,
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  rotateX: 52,
                  rotateZ: -36,
                }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
              >
                {/* Collapsed Deck Foundation Outline */}
                <div
                  className="absolute inset-0 rounded-2xl border border-dashed border-slate-300/70 dark:border-white/15 pointer-events-none transition-opacity duration-300"
                  style={{
                    transform: "translateZ(-8px)",
                    opacity: viewMode === "deck" ? 0.9 : 0.2,
                  }}
                >
                  <div className="absolute -bottom-6 left-3 text-[9px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-phosphor animate-pulse" />
                    <span>COLLAPSED CREDENTIAL DECK // 4 STRATA</span>
                  </div>
                </div>

                {LAYERS.map((layer, index) => {
                  const isSelected = activeLayer === index;
                  const transform = getCardTransform(index);
                  const isElevating = transform.badgeMode === "elevating";
                  const isFlat = transform.badgeMode === "flat";

                  return (
                    <motion.div
                      key={layer.id}
                      onClick={() => jumpToLayer(index)}
                      data-cursor="SELECT"
                      transformTemplate={({ y, z, scale, rotateZ, rotateX }: any) =>
                        `translateY(${y || "0px"}) translateZ(${z || "0px"}) scale(${scale || 1}) rotateZ(${rotateZ || "0deg"}) rotateX(${rotateX || "0deg"})`
                      }
                      animate={{
                        z: transform.z,
                        y: transform.y,
                        scale: transform.scale,
                        opacity: transform.opacity,
                        rotateZ: transform.rotateZ,
                        rotateX: transform.rotateX,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 240,
                        damping: 25,
                        mass: 0.85,
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: transform.zIndex,
                        transformStyle: "preserve-3d",
                      }}
                      className={`rounded-2xl border p-5 cursor-pointer select-none transition-shadow duration-300 ${
                        isFlat
                          ? "border-emerald-500 dark:border-phosphor bg-white dark:bg-obsidian-card shadow-[0_25px_65px_-12px_rgba(0,0,0,0.4),0_0_35px_rgba(16,185,129,0.25)] dark:shadow-[0_25px_65px_-12px_rgba(0,0,0,0.8),0_0_45px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/40 dark:ring-phosphor/40"
                          : isElevating
                          ? "border-amber-500/80 dark:border-amber-400/80 bg-white/95 dark:bg-obsidian-card/95 shadow-[0_45px_75px_-15px_rgba(0,0,0,0.45),0_0_35px_rgba(245,158,11,0.2)] dark:shadow-[0_45px_80px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/30"
                          : "border-slate-300/80 dark:border-white/15 bg-white/95 dark:bg-obsidian-surface/85 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:border-slate-400 dark:hover:border-white/30"
                      } ${
                        index === 0 && !isSelected
                          ? "bg-[#FCFBF7] dark:bg-obsidian-surface/80 border-[#E8E2D2] dark:border-white/15"
                          : ""
                      }`}
                    >
                      {/* Top Header Strip */}
                      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                          {index === 1 && (
                            <Fingerprint className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          )}
                          {index === 2 && (
                            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          )}
                          {index === 3 && (
                            <Binary className="w-4 h-4 text-emerald-600 dark:text-phosphor" />
                          )}
                          <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {layer.badge}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isFlat ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500 text-white dark:bg-phosphor dark:text-obsidian font-bold flex items-center gap-1.5 shadow-xs transition-colors duration-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-obsidian animate-pulse" />
                              2D VIEWPORT
                            </span>
                          ) : isElevating ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/95 text-white dark:bg-amber-400 dark:text-obsidian font-bold flex items-center gap-1.5 shadow-xs transition-colors duration-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-obsidian animate-ping" />
                              3D HOVER // +165PX
                            </span>
                          ) : (
                            viewMode === "deck" && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                                STRATA #{index + 1}
                              </span>
                            )
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
                            Z: #{index + 1}
                          </span>
                        </div>
                      </div>

                      {/* HIGH-FIDELITY LAYER CARD BODY */}
                      <div className="mt-3.5 space-y-2.5">
                        {/* Layer 01: Authentic MIT Diploma Parchment */}
                        {index === 0 && (
                          <div className="p-3 rounded-xl bg-[#FAF8F2] dark:bg-black/30 border border-[#E8E2D2] dark:border-white/10 space-y-2 text-center">
                            <div className="flex justify-center items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-300 font-bold">
                              <Award className="w-3 h-3 text-amber-600" />
                              <span>MASSACHUSETTS INSTITUTE OF TECHNOLOGY</span>
                            </div>
                            <div className="text-[13px] font-display font-black text-slate-900 dark:text-white leading-tight">
                              ALEXANDER CHEN
                            </div>
                            <div className="text-[10px] font-serif italic text-slate-600 dark:text-slate-300">
                              Master of Science in Computer Science & AI
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-1 border-t border-[#E8E2D2]/70 dark:border-white/10 text-[9px] font-mono text-emerald-700 dark:text-phosphor">
                              <span>SUMMA CUM LAUDE</span>
                              <span>•</span>
                              <span>MENS ET MANUS</span>
                            </div>
                          </div>
                        )}

                        {/* Layer 02: W3C Verifiable Credential Structured Claims */}
                        {index === 1 && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-1.5 font-mono text-[10px]">
                            <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-slate-200 dark:border-white/10">
                              <span>@context: W3C_VC_v2.0</span>
                              <span className="text-emerald-600 dark:text-phosphor">
                                SIG_VALID
                              </span>
                            </div>
                            <div className="text-slate-800 dark:text-slate-200 truncate">
                              <span className="text-slate-400">subject: </span>
                              did:provenance:cand_88a91c0e
                            </div>
                            <div className="text-slate-800 dark:text-slate-200 truncate">
                              <span className="text-slate-400">issuer: </span>
                              did:provenance:inst_mit_4419
                            </div>
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[9px]">
                              <Lock className="w-2.5 h-2.5" />
                              <span>FERPA PRIVACY SHIELD: ACTIVE</span>
                            </div>
                          </div>
                        )}

                        {/* Layer 03: Deterministic Forensic Signals HUD */}
                        {index === 2 && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 space-y-1.5 font-mono text-[10px]">
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                              <span>pHash Concordance:</span>
                              <span className="text-emerald-600 dark:text-phosphor font-bold">
                                0.00 HAMMING
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                              <span>EXIF Header Scan:</span>
                              <span className="text-emerald-600 dark:text-phosphor font-bold">
                                CLEAN STREAM
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                              <span>OCR Alignment:</span>
                              <span className="text-emerald-600 dark:text-phosphor font-bold">
                                99.8% PARITY
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[99.8%]" />
                            </div>
                          </div>
                        )}

                        {/* Layer 04: Immutable Ledger Anchor */}
                        {index === 3 && (
                          <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-black/50 border border-emerald-500/30 text-slate-200 space-y-1.5 font-mono text-[10px]">
                            <div className="flex items-center justify-between text-emerald-400">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                BLOCK #412 ANCHOR
                              </span>
                              <span>APPEND-ONLY</span>
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              HASH: 0xa4f89d81e3a6c2f901b74c5d8e9f2a3b...
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              PREV: 0xf2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2...
                            </div>
                            <div className="text-[9px] text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>ECDSA_SECP256R1 CONSENSUS LOCKED</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Status */}
                      <div className="absolute bottom-3.5 left-5 right-5 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-200/60 dark:border-white/10 pt-2">
                        <span>INTEGRITY: 100%</span>
                        <span className="text-emerald-600 dark:text-phosphor font-medium">
                          CRYPTOGRAPHIC SEAL
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Right Inspector: Details of Active Layer */}
            <div className="lg:col-span-6 space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeLayer}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Category & Step Header */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-phosphor/15 text-emerald-700 dark:text-phosphor border border-emerald-500/30 dark:border-phosphor/30 font-bold tracking-wide">
                      {LAYERS[activeLayer].category}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
                      <span>STRATA 0{activeLayer + 1} // 04</span>
                      <span className="text-slate-300 dark:text-white/20">•</span>
                      <span
                        className={`font-bold transition-colors duration-200 ${
                          isCardFlat
                            ? "text-emerald-600 dark:text-phosphor"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {isCardFlat ? "STATE: 2D INSPECT" : "STATE: 3D HOVER"}
                      </span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white leading-snug">
                      {LAYERS[activeLayer].title}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                      {LAYERS[activeLayer].description}
                    </p>
                  </div>

                  {/* Highlight Banner */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-phosphor/5 border border-emerald-200 dark:border-phosphor/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-phosphor shrink-0" />
                    <span>{LAYERS[activeLayer].highlight}</span>
                  </div>

                  {/* Granular Parameter Matrix */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-obsidian-card border border-slate-200 dark:border-white/10 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">
                        Cryptographic Properties Matrix
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-phosphor">
                        STATE: LIVE_VALIDATED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {LAYERS[activeLayer].details.map((detail, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/5 space-y-0.5 shadow-2xs"
                        >
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block uppercase">
                            {detail.label}
                          </span>
                          <span className="text-xs font-mono text-slate-800 dark:text-slate-200 font-medium break-all">
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Bottom Quick Scrub Navigation & Instruction */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-2">
                  {LAYERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => jumpToLayer(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeLayer === i
                          ? "w-8 bg-emerald-600 dark:bg-phosphor"
                          : "w-2 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/40"
                      }`}
                      aria-label={`Jump to layer ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span>SCROLL DOWN TO ADVANCE</span>
                  <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
