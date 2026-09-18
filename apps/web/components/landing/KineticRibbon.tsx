"use client";

import React from "react";
import { Shield, Zap, Lock, Database } from "lucide-react";

const RIBBON_ITEMS_A = [
  { label: "BLOCK #429", desc: "MIT // DEGREE_CONFIRMED", hash: "0xa4f89d81", ok: true },
  { label: "MERKLE_LEAF", desc: "SHA256: 0xe3b0c442", hash: "0x89ab12cd", ok: true },
  { label: "SIG_AUDIT", desc: "ECDSA_P256 // VERIFIED", hash: "0x15f4e902", ok: true },
  { label: "BLOCK #428", desc: "STANFORD // POSTDOC_SEAL", hash: "0xf2c4e6a8", ok: true },
  { label: "FORENSIC_GAP", desc: "EXIF_SCRUBBED // CLEAN", hash: "0x77b899cc", ok: true },
  { label: "BLOCK #427", desc: "OXFORD // JURIS_COMMITTED", hash: "0x9b8a7c6d", ok: true },
  { label: "CONSENSUS", desc: "APPEND_ONLY_LOCKED", hash: "0x442200fe", ok: true },
];

const RIBBON_ITEMS_B = [
  { label: "ZERO_KNOWLEDGE", desc: "PII_STRIPPED // SAFE", tag: "PRIVACY" },
  { label: "PHASH_MATCH", desc: "HAMMING_DIST: 0 // 100%", tag: "FORENSICS" },
  { label: "TAMPER_DEFENSE", desc: "1-BIT_CASCADE_DETECTION", tag: "CRYPTOGRAPHY" },
  { label: "LATENCY", desc: "VERIFY_TIME: 0.82MS", tag: "PERFORMANCE" },
  { label: "SECURITY_MESH", desc: "ADVISORY_ROW_LOCKS // ACTIVE", tag: "LEDGER" },
  { label: "QR_PAYLOAD", desc: "RFC-7519_COMPACT_TOKEN", tag: "STANDARDS" },
];

export default function KineticRibbon() {
  return (
    <div className="py-6 border-b border-white/10 bg-obsidian-surface/60 overflow-hidden space-y-3">
      {/* Top Track: Forward Velocity */}
      <div className="flex select-none overflow-hidden whitespace-nowrap mask-gradient">
        <div className="flex animate-marquee shrink-0 items-center gap-6">
          {RIBBON_ITEMS_A.map((item, idx) => (
            <div
              key={`a-${idx}`}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-phosphor" />
              <span className="font-bold text-white tracking-wider">{item.label}</span>
              <span className="text-slate-400 font-normal">{item.desc}</span>
              <span className="text-[10px] text-slate-500 font-mono">{item.hash}</span>
            </div>
          ))}
        </div>
        <div className="flex animate-marquee shrink-0 items-center gap-6" aria-hidden="true">
          {RIBBON_ITEMS_A.map((item, idx) => (
            <div
              key={`a-dup-${idx}`}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-phosphor" />
              <span className="font-bold text-white tracking-wider">{item.label}</span>
              <span className="text-slate-400 font-normal">{item.desc}</span>
              <span className="text-[10px] text-slate-500 font-mono">{item.hash}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Track: Reverse Velocity */}
      <div className="flex select-none overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee-reverse shrink-0 items-center gap-6">
          {RIBBON_ITEMS_B.map((item, idx) => (
            <div
              key={`b-${idx}`}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-mono text-slate-400"
            >
              <span className="text-phosphor/80 font-bold">{item.tag} //</span>
              <span className="text-slate-300">{item.label}:</span>
              <span className="text-slate-500">{item.desc}</span>
            </div>
          ))}
        </div>
        <div className="flex animate-marquee-reverse shrink-0 items-center gap-6" aria-hidden="true">
          {RIBBON_ITEMS_B.map((item, idx) => (
            <div
              key={`b-dup-${idx}`}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-mono text-slate-400"
            >
              <span className="text-phosphor/80 font-bold">{item.tag} //</span>
              <span className="text-slate-300">{item.label}:</span>
              <span className="text-slate-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
