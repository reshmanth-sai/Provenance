"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Layers, ShieldCheck, FileText, Binary, Fingerprint, Eye } from "lucide-react";

interface LayerData {
  id: string;
  title: string;
  category: string;
  badge: string;
  description: string;
  details: { label: string; value: string }[];
}

const LAYERS: LayerData[] = [
  {
    id: "visual",
    title: "Layer 01 // Visual Presentation Document",
    category: "SURFACE RENDERING",
    badge: "CANVAS",
    description:
      "The human-readable degree document, transcript, or certificate parchment rendered with anti-aliased SVG seals and typography.",
    details: [
      { label: "Document Type", value: "Master of Science in Computer Science" },
      { label: "Institution", value: "Massachusetts Institute of Technology" },
      { label: "Conferral Date", value: "June 05, 2024" },
      { label: "Honors", value: "Summa Cum Laude" },
    ],
  },
  {
    id: "metadata",
    title: "Layer 02 // Sanitized Structured Claims",
    category: "IDENTITY METADATA",
    badge: "W3C_VC",
    description:
      "Zero-leakage W3C Verifiable Credential claims. Excludes student email, telephone, and private IDs while preserving mathematical validity.",
    details: [
      { label: "Candidate DID", value: "did:provenance:cand_88a91c0e" },
      { label: "Issuer DID", value: "did:provenance:inst_mit_4419" },
      { label: "Revocation Registry", value: "registry.provenance.network/mit/rev" },
      { label: "Validity Status", value: "Active / Non-Revoked" },
    ],
  },
  {
    id: "forensics",
    title: "Layer 03 // Deterministic Forensic Signals",
    category: "TAMPER FORENSICS",
    badge: "6_STAGE_SCAN",
    description:
      "6-stage automated analysis cross-examining font anomalies, editing software artifacts, perceptual hash (pHash) layouts, and OCR text matching.",
    details: [
      { label: "pHash Distance", value: "0.00 (Identical to Institutional Template)" },
      { label: "EXIF Discrepancy", value: "0 anomalies detected (Clean Binary Stream)" },
      { label: "OCR Cross-Match", value: "99.8% lexical agreement" },
      { label: "Software Artifacts", value: "Zero Adobe/Photoshop manipulation tags" },
    ],
  },
  {
    id: "cryptography",
    title: "Layer 04 // Immutable Ledger Anchor",
    category: "CRYPTOGRAPHIC CONSENSUS",
    badge: "SHA256_CHAIN",
    description:
      "The root mathematical anchor committed directly into the per-issuer append-only ledger protected by row-level database advisory locks.",
    details: [
      { label: "Content Digest", value: "0xa4f89d81e3a6c2f901b74c5d8e9f2a3b" },
      { label: "Parent Block Hash", value: "0xf2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2" },
      { label: "Ledger Height", value: "Block #412 (Permanent Root)" },
      { label: "Signature", value: "ECDSA_SECP256R1 (0x87ba42...)" },
    ],
  },
];

export default function ExplodedCredential() {
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [isExploded, setIsExploded] = useState<boolean>(true);

  return (
    <section id="deconstruction" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-obsidian">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 hairline-b pb-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-phosphor font-semibold flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>NUMA-INSPIRED 3D ARCHITECTURE</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
              Anatomy of an Unforgeable Record.
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              A physical diploma can be forged on parchment. A Provenance credential deconstructs into 4
              cryptographic strata that are mathematically bound to the issuer's ledger.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={() => setIsExploded(!isExploded)}
              data-cursor="TOGGLE"
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 transition-colors"
            >
              {isExploded ? "Compress Stack" : "Explode 3D Stack"}
            </button>
          </div>
        </div>

        {/* Interactive 3D Perspective Stage & Information Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* 3D Isometric Viewport */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] perspective-stage">
            <div
              className="relative w-full max-w-md h-[340px] preserve-3d transition-transform duration-700 ease-out"
              style={{
                transform: isExploded
                  ? "rotateX(54deg) rotateY(0deg) rotateZ(-38deg)"
                  : "rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
              }}
            >
              {LAYERS.map((layer, index) => {
                const isSelected = activeLayer === index;
                // Layer stacking offsets in 3D space
                const zOffset = isExploded ? (index - 1.5) * 80 : index * 4;
                const yOffset = isExploded ? (index - 1.5) * -35 : 0;

                return (
                  <motion.div
                    key={layer.id}
                    onClick={() => setActiveLayer(index)}
                    data-cursor="SELECT"
                    className={`absolute inset-0 rounded-2xl border backdrop-blur-xl p-6 cursor-pointer transition-all duration-300 select-none shadow-2xl ${
                      isSelected
                        ? "border-phosphor bg-obsidian-card/95 shadow-phosphor/20 ring-2 ring-phosphor/30"
                        : "border-white/15 bg-obsidian-surface/75 hover:border-white/30"
                    }`}
                    style={{
                      transform: `translate3d(0px, ${yOffset}px, ${zOffset}px)`,
                      zIndex: 10 - index,
                    }}
                  >
                    {/* Layer Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && <FileText className="w-4 h-4 text-slate-300" />}
                        {index === 1 && <Fingerprint className="w-4 h-4 text-slate-300" />}
                        {index === 2 && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                        {index === 3 && <Binary className="w-4 h-4 text-phosphor" />}
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          {layer.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                        Z-INDEX: {index + 1}
                      </span>
                    </div>

                    {/* Layer Content Silhouette */}
                    <div className="mt-4 space-y-2.5">
                      <p className="text-xs font-semibold text-slate-200">{layer.title}</p>
                      <div className="space-y-1.5 pt-2">
                        <div className="h-2 rounded bg-white/10 w-3/4" />
                        <div className="h-2 rounded bg-white/5 w-1/2" />
                        <div className="h-2 rounded bg-white/5 w-2/3" />
                      </div>
                    </div>

                    {/* Bottom Indicator */}
                    <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>STATUS: SEALED</span>
                      <span className="text-phosphor">INTEGRITY 100%</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Inspector: Details of Active Layer */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-phosphor/10 text-phosphor border border-phosphor/20">
                  {LAYERS[activeLayer].category}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  LAYER {activeLayer + 1} OF 4
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                {LAYERS[activeLayer].title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {LAYERS[activeLayer].description}
              </p>
            </div>

            {/* Parameter Specification Matrix */}
            <div className="p-6 rounded-2xl bg-obsidian-card border border-white/10 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold block">
                Cryptographic Properties Matrix
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LAYERS[activeLayer].details.map((detail, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">
                      {detail.label}
                    </span>
                    <span className="text-xs font-mono text-slate-200 font-medium break-all">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Layer Switcher Navigation */}
            <div className="flex items-center gap-2">
              {LAYERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveLayer(i)}
                  className={`h-2 rounded-full transition-all ${
                    activeLayer === i ? "w-8 bg-phosphor" : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Switch to layer ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
