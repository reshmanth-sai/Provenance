"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, FileCheck2, Link2, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [credentialId, setCredentialId] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialId.trim()) {
      router.push(`/verify/${credentialId.trim()}`);
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-accent-light text-accent border border-accent/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cryptographically Proven Trust</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary tracking-tight leading-tight">
          Verifiable Academic Credentials with <span className="text-accent">Zero Doubt</span>.
        </h1>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Provenance pairs deterministic self-upload document analysis with an immutable,
          per-issuer tamper-evident hash chain. Trust credentials that cannot be forged, altered, or silently deleted.
        </p>

        {/* Quick Verifier Form */}
        <div className="pt-4 max-w-xl mx-auto">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Credential ID to audit integrity..."
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-card border border-gray-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Verify</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-accent">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-primary">Signals, Not Verdicts</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Every candidate upload undergoes 6-stage deterministic inspection (metadata gap, editing software, pHash layout comparison, OCR cross-match) producing factual evidence.
          </p>
        </div>

        <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-accent">
            <Link2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-primary">Per-Issuer Hash Chain</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Issuing institutions commit credentials into an append-only cryptographic ledger guarded by SHA-256 content hashes and strict advisory concurrency locks.
          </p>
        </div>

        <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center text-accent">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-primary">Zero Data Leakage</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Public profiles and verifiers surface verified and revoked trust signals honestly while strictly omitting private emails, storage keys, and declined submissions.
          </p>
        </div>
      </section>

      {/* Role Action Cards */}
      <section className="bg-surface-card rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">For Candidates & Professionals</span>
            <h2 className="text-2xl font-bold text-primary">Build Your Cryptographically Verifiable Portfolio</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Upload diplomas and certificates for instant analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Request formal attestation directly from your university</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Share clean public profile links with recruiters</span>
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <span>Create Candidate Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-4 bg-surface p-6 rounded-xl border border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">For Universities & Issuers</span>
            <h3 className="text-xl font-bold text-primary">Direct Issuance & Batch Verification</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Eliminate credential fraud and streamline background checks. Review self-submitted student requests or issue tamper-evident diplomas committed directly to your institutional ledger.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-card hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-semibold rounded-lg transition-colors"
              >
                <span>Institutional Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
