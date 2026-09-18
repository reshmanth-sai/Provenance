"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Building2, ShieldCheck, Terminal } from "lucide-react";

export default function CtaPortal() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-obsidian relative overflow-hidden transition-colors duration-300">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-emerald-500/5 dark:bg-phosphor/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-phosphor font-semibold">
            DEPLOY TO THE NETWORK
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
            Step Into Cryptographic Truth.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Join institutions and professionals publishing tamper-evident credentials with mathematically proven integrity.
          </p>
        </div>

        {/* Dual Architectural Gateway Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Candidate Card */}
          <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-obsidian-card border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-6 flex flex-col justify-between shadow-lg shadow-slate-900/5 dark:shadow-none">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Candidates & Alumni</span>
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                  Build a Verifiable Portfolio
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Self-upload your transcripts and degrees. Provenance runs deterministic forensic checks and notifies
                issuing universities for direct cryptographic confirmation. Share tamper-evident links with recruiters.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <Link
                href="/register"
                data-cursor="START"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-obsidian dark:hover:bg-slate-200 font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-lg"
              >
                <span>Create Candidate Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Institutional Issuer Card */}
          <div className="p-8 sm:p-10 rounded-2xl bg-emerald-50/40 dark:bg-obsidian-card border border-emerald-200/80 dark:border-white/10 hover:border-emerald-300 dark:hover:border-phosphor/40 transition-all space-y-6 flex flex-col justify-between relative overflow-hidden group shadow-lg shadow-emerald-500/5 dark:shadow-none">
            <div className="space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-phosphor/10 border border-emerald-500/20 dark:border-phosphor/20 flex items-center justify-center text-emerald-600 dark:text-phosphor">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-phosphor font-semibold">Registrars & Issuers</span>
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                  Institutional Ledger Gateway
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Issue tamper-evident degrees directly into an append-only hash chain. Review self-submitted student requests
                in your verification queue and eliminate costly manual background-check correspondence forever.
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-200/60 dark:border-white/10 relative z-10 flex flex-wrap items-center gap-3">
              <Link
                href="/register/institution"
                data-cursor="APPLY"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-phosphor dark:hover:bg-emerald-400 text-white dark:text-obsidian font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 dark:shadow-phosphor/20"
              >
                <span>Register Institution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/login"
                data-cursor="LOGIN"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-300 font-mono text-xs border border-slate-200 dark:border-white/10 transition-colors shadow-xs"
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
