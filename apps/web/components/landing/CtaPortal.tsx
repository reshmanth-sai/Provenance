"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Building2, ShieldCheck, Terminal } from "lucide-react";

export default function CtaPortal() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-obsidian relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-phosphor/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-phosphor font-semibold">
            DEPLOY TO THE NETWORK
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            Step Into Cryptographic Truth.
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Join institutions and professionals publishing tamper-evident credentials with mathematically proven integrity.
          </p>
        </div>

        {/* Dual Architectural Gateway Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Candidate Card */}
          <div className="p-8 sm:p-10 rounded-2xl bg-obsidian-card border border-white/10 hover:border-white/20 transition-all space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Candidates & Alumni</span>
                <h3 className="text-2xl font-display font-bold text-white">
                  Build a Verifiable Portfolio
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Self-upload your transcripts and degrees. Provenance runs deterministic forensic checks and notifies
                issuing universities for direct cryptographic confirmation. Share tamper-evident links with recruiters.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Link
                href="/register"
                data-cursor="START"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-obsidian font-semibold text-xs font-mono uppercase tracking-wider hover:bg-slate-200 transition-all shadow-lg"
              >
                <span>Create Candidate Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Institutional Issuer Card */}
          <div className="p-8 sm:p-10 rounded-2xl bg-obsidian-card border border-white/10 hover:border-phosphor/40 transition-all space-y-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-phosphor/10 border border-phosphor/20 flex items-center justify-center text-phosphor">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-phosphor">Registrars & Issuers</span>
                <h3 className="text-2xl font-display font-bold text-white">
                  Institutional Ledger Gateway
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Issue tamper-evident degrees directly into an append-only hash chain. Review self-submitted student requests
                in your verification queue and eliminate costly manual background-check correspondence forever.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 relative z-10 flex flex-wrap items-center gap-3">
              <Link
                href="/register/institution"
                data-cursor="APPLY"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-phosphor hover:bg-emerald-400 text-obsidian font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-phosphor/20"
              >
                <span>Register Institution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/login"
                data-cursor="LOGIN"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-mono text-xs border border-white/10 transition-colors"
              >
                <span>Staff Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
