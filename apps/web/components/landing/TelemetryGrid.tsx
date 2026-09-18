"use client";

import React from "react";
import { Cpu, ShieldCheck, Zap, Lock } from "lucide-react";

const METRICS = [
  {
    num: "0.82ms",
    label: "Deterministic Latency",
    subtext: "Instant cryptographic verification without slow blockchain gas fees or human delays.",
    icon: Zap,
  },
  {
    num: "256-Bit",
    label: "Elliptic Security",
    subtext: "ECDSA-P256 hardware security module compatibility matching modern national e-passports.",
    icon: Lock,
  },
  {
    num: "100%",
    label: "Tamper Detection",
    subtext: "A single altered pixel or byte instantly invalidates the SHA-256 parent hash pointer.",
    icon: ShieldCheck,
  },
  {
    num: "Zero",
    label: "Third-Party Trust",
    subtext: "Verification requires no central vendor database to be online; all mathematical proofs are self-contained.",
    icon: Cpu,
  },
];

export default function TelemetryGrid() {
  return (
    <section id="architecture" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/10 bg-obsidian-surface/40">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 hairline-b pb-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono uppercase tracking-widest text-phosphor font-semibold">
              TELEMETRY & CRYPTOGRAPHIC ASSURANCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
              Engineered for Absolute Trust.
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Not a vague promise. Provenance replaces reputational assumptions with mathematical guarantees.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            METRICS_REFRESH: REALTIME // SLA: 99.99%
          </div>
        </div>

        {/* 4 Brutalist Metric Cells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border border-white/10 rounded-2xl bg-obsidian-card/60 backdrop-blur-xl overflow-hidden">
          {METRICS.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className="p-8 space-y-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">0{i + 1} // PROTOCOL</span>
                  <Icon className="w-4 h-4 text-phosphor" />
                </div>
                <div className="space-y-2">
                  <p className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
                    {metric.num}
                  </p>
                  <p className="text-sm font-mono font-semibold text-slate-200">{metric.label}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{metric.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
