"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ShieldAlert, RotateCcw, Link2, Unlink } from "lucide-react";

export default function TamperEngine() {
  const [isTampered, setIsTampered] = useState(false);

  // Original clean cryptographic hashes
  const BLOCK_412_CLEAN = "0xa4f89d81e3a6c2f901b74c5d8e9f2a3b";
  const BLOCK_413_CLEAN = "0x7c3b1a99f0e2d4c6b8a0e2d4c6b8a0e2";
  const BLOCK_414_CLEAN = "0x11e490fa2b3c4d5e6f7a8b9c0d1e2f3a";

  // Altered hash when 1 bit is flipped
  const BLOCK_412_TAMPERED = "0x9e1a007bc4f28811d0a53b2c1f8e9d4a";

  return (
    <section id="tamper-engine" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-obsidian-surface/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>LIVE CONSENSUS STRESS TEST</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              Break the Chain.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              In traditional databases, an admin can quietly alter grades or degree statuses with a single SQL query. 
              On Provenance, altering 1 single bit cascades through all subsequent block hashes, immediately disqualifying 
              the entire chain.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTampered(!isTampered)}
              data-cursor={isTampered ? "RESTORE" : "ATTACK"}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
                isTampered
                  ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-obsidian dark:hover:bg-slate-200"
                  : "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/30"
              }`}
            >
              {isTampered ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Consensus</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Simulate 1-Bit Alteration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* The 3-Block Interactive Append-Only Chain */}
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400">
            <span>PER-ISSUER APPEND-ONLY HASH CHAIN (MIT DEPT OF EECS)</span>
            <span className={isTampered ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-phosphor font-bold"}>
              {isTampered ? "🚨 CHAIN CONSENSUS FAILED" : "✓ CONSENSUS VALIDATED"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* BLOCK #412 */}
            <div
              className={`p-6 rounded-2xl border backdrop-blur-xl space-y-4 relative transition-all duration-300 shadow-sm ${
                isTampered
                  ? "bg-rose-50/90 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/30"
                  : "bg-white dark:bg-obsidian-card/80 border-slate-200 dark:border-white/12"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">BLOCK #412</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isTampered
                      ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/40 dark:border-rose-500/40 font-bold"
                      : "bg-emerald-500/10 dark:bg-phosphor/10 text-emerald-600 dark:text-phosphor border-emerald-500/20 dark:border-phosphor/20 font-semibold"
                  }`}
                >
                  {isTampered ? "FORGED PAYLOAD" : "SEALED"}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Record: Master of Science</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {isTampered ? (
                    <span className="text-rose-600 dark:text-rose-400 line-through">GPA: 3.82 (Honors)</span>
                  ) : (
                    "GPA: 3.82 (Honors)"
                  )}
                  {isTampered && <span className="text-rose-700 dark:text-rose-300 ml-2 font-bold">GPA: 4.00 (Tampered)</span>}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 font-mono text-[11px]">
                <div className="text-slate-500 flex justify-between">
                  <span>Parent Hash:</span>
                  <span className="text-slate-700 dark:text-slate-400">0x0000...GENESIS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Block Hash:</span>
                  <span className={isTampered ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-phosphor font-medium"}>
                    {isTampered ? BLOCK_412_TAMPERED.slice(0, 16) + "..." : BLOCK_412_CLEAN.slice(0, 16) + "..."}
                  </span>
                </div>
              </div>
            </div>

            {/* BLOCK #413 */}
            <div
              className={`p-6 rounded-2xl border backdrop-blur-xl space-y-4 relative transition-all duration-300 shadow-sm ${
                isTampered
                  ? "bg-rose-50/90 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/30"
                  : "bg-white dark:bg-obsidian-card/80 border-slate-200 dark:border-white/12"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">BLOCK #413</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isTampered
                      ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/40 dark:border-rose-500/40 font-bold"
                      : "bg-emerald-500/10 dark:bg-phosphor/10 text-emerald-600 dark:text-phosphor border-emerald-500/20 dark:border-phosphor/20 font-semibold"
                  }`}
                >
                  {isTampered ? "PARENT HASH MISMATCH" : "SEALED"}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Record: Ph.D. Candidacy</p>
                <p className="text-slate-900 dark:text-white font-medium">Dissertation: High-Velocity ZK Proofs</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Prev:</span>
                  <span className={isTampered ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-700 dark:text-slate-400"}>
                    {BLOCK_412_CLEAN.slice(0, 14)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Prev:</span>
                  <span className={isTampered ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-phosphor font-medium"}>
                    {isTampered ? BLOCK_412_TAMPERED.slice(0, 14) + "..." : BLOCK_412_CLEAN.slice(0, 14) + "..."}
                  </span>
                </div>
              </div>
            </div>

            {/* BLOCK #414 */}
            <div
              className={`p-6 rounded-2xl border backdrop-blur-xl space-y-4 relative transition-all duration-300 shadow-sm ${
                isTampered
                  ? "bg-rose-50/90 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500/80 ring-1 ring-rose-500/30"
                  : "bg-white dark:bg-obsidian-card/80 border-slate-200 dark:border-white/12"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">BLOCK #414</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isTampered
                      ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-400/40 dark:border-rose-500/40 font-bold"
                      : "bg-emerald-500/10 dark:bg-phosphor/10 text-emerald-600 dark:text-phosphor border-emerald-500/20 dark:border-phosphor/20 font-semibold"
                  }`}
                >
                  {isTampered ? "RUPTURE PROPAGATED" : "SEALED"}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Record: Postdoc Research Fellow</p>
                <p className="text-slate-900 dark:text-white font-medium">Appointment: Quantum Computing Lab</p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/10 font-mono text-[11px]">
                <div className="text-slate-500 flex justify-between">
                  <span>Parent Hash:</span>
                  <span className="text-slate-700 dark:text-slate-400">{BLOCK_413_CLEAN.slice(0, 14)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Block Hash:</span>
                  <span className={isTampered ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-600 dark:text-phosphor font-medium"}>
                    {BLOCK_414_CLEAN.slice(0, 14)}...
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Forensic Diagnostic Terminal */}
          <div
            className={`p-4 rounded-xl border font-mono text-xs transition-colors flex items-start gap-3 shadow-sm ${
              isTampered
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 text-rose-900 dark:text-rose-200"
                : "bg-white dark:bg-obsidian-surface border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-300"
            }`}
          >
            {isTampered ? (
              <Unlink className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Link2 className="w-5 h-5 text-emerald-600 dark:text-phosphor shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">
                {isTampered
                  ? "CRITICAL INTEGRITY FAILURE: Bit-Flip Detected at Block #412"
                  : "LEDGER HEALTH: 100% Cryptographic Consensus"}
              </p>
              <p className={`text-[11px] ${isTampered ? "text-rose-700 dark:text-rose-300" : "text-slate-600 dark:text-slate-400"}`}>
                {isTampered
                  ? "Calculated digest for Block #412 does not match the parent pointer stored in Block #413. Database rejected verification request. All subsequent certificates are invalid until ledger restored."
                  : "All child blocks hold mathematical signatures validating their parent's SHA-256 digest. Strict row-level advisory locks prevent concurrent ledger divergence."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
