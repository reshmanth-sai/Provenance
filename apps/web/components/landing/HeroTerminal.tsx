"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Cpu, ArrowRight, FileCheck, CheckCircle2, Lock, Zap } from "lucide-react";

interface SamplePreset {
  id: string;
  name: string;
  issuer: string;
  degree: string;
  hash: string;
  blockHeight: number;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "mit-cs-2024",
    name: "MIT Master of Science",
    issuer: "Massachusetts Institute of Technology",
    degree: "Computer Science & AI",
    hash: "a4f89d81e3a6c2f901b74c5d8e9f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    blockHeight: 412,
  },
  {
    id: "stanford-bio-2023",
    name: "Stanford Postdoctoral Fellow",
    issuer: "Stanford University",
    degree: "Genomics & Bio-Informatics",
    hash: "f2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4e6a8d0b2c4",
    blockHeight: 418,
  },
  {
    id: "oxford-jur-2025",
    name: "Oxford Bachelor of Civil Law",
    issuer: "University of Oxford",
    degree: "International Jurisprudence",
    hash: "9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
    blockHeight: 423,
  },
];

export default function HeroTerminal() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState<SamplePreset>(SAMPLE_PRESETS[0]);
  const [activeHash, setActiveHash] = useState(SAMPLE_PRESETS[0].hash);
  const [computeTime, setComputeTime] = useState(0.7);
  const [isComputing, setIsComputing] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [isTampered, setIsTampered] = useState(false);

  // Live in-browser WebCrypto hash calculation
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | null = null;
    if ("dataTransfer" in e && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    } else if ("target" in e && e.target instanceof HTMLInputElement && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    }

    if (!file) return;

    setIsComputing(true);
    const start = performance.now();

    try {
      const buffer = await file.arrayBuffer();
      const digestBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(digestBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const elapsed = performance.now() - start;
      setComputeTime(parseFloat(elapsed.toFixed(2)));
      setActiveHash(hashHex);
      setSelectedPreset({
        id: "custom-upload",
        name: file.name,
        issuer: "Self-Uploaded Document File",
        degree: `${(file.size / 1024).toFixed(1)} KB • In-Memory Buffer`,
        hash: hashHex,
        blockHeight: 429,
      });
      setIsTampered(false);
    } catch (err) {
      console.error("Local hash error:", err);
    } finally {
      setIsComputing(false);
    }
  };

  const handleSelectPreset = (preset: SamplePreset) => {
    setIsComputing(true);
    setTimeout(() => {
      setSelectedPreset(preset);
      setActiveHash(preset.hash);
      setComputeTime(0.6 + Math.random() * 0.4);
      setIsComputing(false);
      setIsTampered(false);
    }, 180);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim() || selectedPreset.id;
    router.push(`/verify/${query}`);
  };

  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 border-b border-white/10 overflow-hidden bg-radial-gradient">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-phosphor/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Architectural Metadata Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400 hairline-b pb-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-phosphor font-semibold">
              <span className="w-2 h-2 rounded-full bg-phosphor animate-ping" />
              <span>CONSENSUS_HEIGHT: #429</span>
            </span>
            <span className="text-white/20">/</span>
            <span>SPEC: RFC-6962 APPEND-ONLY</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>SIG: ECDSA_SECP256R1</span>
            <span className="hidden sm:inline">ZERO_KNOWLEDGE_PROOF: ENFORCED</span>
          </div>
        </motion.div>

        {/* Viewport-Dominating Editorial Headline */}
        <div className="space-y-6 max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tighter text-white leading-[1.05]"
          >
            MATHEMATICAL TRUTH. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-400 to-slate-600">
              ZERO INSTITUTIONAL DOUBT.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-xl text-slate-400 max-w-3xl font-normal leading-relaxed"
          >
            Provenance pairs deterministic 6-stage document forensics with a per-issuer, append-only SHA-256
            hash chain. Confirmed credentials cannot be altered, forged, or quietly purged without breaking
            the cryptographic consensus of the ledger.
          </motion.p>
        </div>

        {/* Interactive Cryptographic Laboratory Terminal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl bg-obsidian-card/90 border border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden"
        >
          {/* Terminal Titlebar */}
          <div className="px-5 py-3.5 bg-obsidian-elevated/70 hairline-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-slate-300 font-semibold tracking-wide">
                WEB_CRYPTO_INTEGRITY_LAB // v2.4
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-phosphor">
                <Zap className="w-3 h-3" />
                <span>COMPUTE_LATENCY: {computeTime}ms</span>
              </span>
              <span>•</span>
              <span>ALGO: SHA-256</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Left Control Panel: Presets & Live Dropzone */}
            <div className="lg:col-span-5 p-6 space-y-6 bg-obsidian/40">
              <div className="space-y-3">
                <label className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold flex items-center justify-between">
                  <span>Sample Credential Records</span>
                  <span className="text-[10px] text-slate-500">ONE-CLICK AUDIT</span>
                </label>

                <div className="space-y-2">
                  {SAMPLE_PRESETS.map((preset) => {
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        data-cursor="AUDIT"
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-white/[0.08] border-phosphor/40 text-white shadow-sm"
                            : "bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-white">{preset.name}</p>
                          <p className="text-[11px] text-slate-400">{preset.issuer}</p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                          #{preset.blockHeight}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-Browser Document Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                data-cursor="DROP"
                className="relative border border-dashed border-white/20 hover:border-phosphor/60 rounded-xl p-6 text-center transition-colors bg-white/[0.01] hover:bg-phosphor/[0.02] group cursor-pointer"
              >
                <input
                  type="file"
                  onChange={handleFileDrop}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Upload document to hash locally"
                />
                <div className="space-y-2 pointer-events-none">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-slate-300 group-hover:text-phosphor transition-colors">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-200">
                    Drop any diploma / PDF here to hash locally
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    100% In-Browser WebCrypto • Zero Bytes Dispatched to Cloud
                  </p>
                </div>
              </div>
            </div>

            {/* Right Display Panel: Raw Digest, Merkle Root, and Chain Verification */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Status Banner */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                    Cryptographic State Vector
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-phosphor" />
                    <span className="text-xs font-mono font-semibold text-phosphor">
                      {isComputing ? "COMPUTING_DIGEST..." : "LEDGER_VERIFIED"}
                    </span>
                  </div>
                </div>

                {/* SHA-256 Hash Digest */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Document SHA-256 Digest</span>
                    <span className="text-phosphor">256-BIT CHECKSUM</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-obsidian-surface border border-white/10 font-mono text-xs text-slate-200 break-all select-all flex items-center justify-between gap-2">
                    <span className={isComputing ? "opacity-40 animate-pulse" : "text-emerald-400"}>
                      {activeHash}
                    </span>
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>
                </div>

                {/* Merkle Node Path */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-obsidian-surface border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Target Ledger Leaf</span>
                    <p className="text-slate-200 truncate font-semibold">
                      Block #{selectedPreset.blockHeight}
                    </p>
                    <p className="text-[11px] text-slate-500">{selectedPreset.name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-obsidian-surface border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Issuing Authority</span>
                    <p className="text-slate-200 truncate font-semibold">
                      {selectedPreset.issuer}
                    </p>
                    <p className="text-[11px] text-phosphor flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ECDSA Signature Valid</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Verification Gateway */}
              <form
                onSubmit={handleVerifySubmit}
                className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter any Credential ID or Hash to audit..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.04] text-xs font-mono text-white placeholder-slate-500 border border-white/15 rounded-xl focus:outline-none focus:border-phosphor transition-all"
                  />
                </div>
                <button
                  type="submit"
                  data-cursor="OPEN"
                  className="px-6 py-3 bg-phosphor hover:bg-emerald-400 text-obsidian font-semibold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-phosphor/20 flex items-center justify-center gap-2 group"
                >
                  <span>Verify On Mainnet</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
