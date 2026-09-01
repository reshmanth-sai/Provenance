"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Clock } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function IssuerRegisterPage() {
  const [institutionName, setInstitutionName] = useState("");
  const [domain, setDomain] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredIssuer, setRegisteredIssuer] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanDomain = domain.toLowerCase().trim();
    const cleanEmail = contactEmail.toLowerCase().trim();

    if (!cleanEmail.endsWith(`@${cleanDomain}`)) {
      setError(`Contact email must match the claimed domain (${cleanDomain})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/issuer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: institutionName.trim(),
          domain: cleanDomain,
          contactEmail: cleanEmail,
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to register institution");
      } else {
        setRegisteredIssuer(json.issuer);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 space-y-6 py-4">
      {registeredIssuer ? (
        <div className="p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-primary">Registration Received</h2>
            <p className="text-sm font-semibold text-accent">{registeredIssuer.name} ({registeredIssuer.domain})</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Your institutional account has been created with status <span className="font-bold text-amber-700 uppercase">PENDING APPROVAL</span>.
              Platform administrators must verify domain ownership and approve your institution before staff can issue credentials or review student requests.
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-800 space-y-1">
            <p className="font-bold">Next Steps for Institutional Access:</p>
            <p>1. A platform admin will review your registration.</p>
            <p>2. Once approved, log in with <span className="font-mono font-semibold">{contactEmail}</span> to access your verification queue and ledger.</p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <span>Return to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-primary">Register Institution</h1>
            <p className="text-xs text-gray-500">
              Onboard your university or credential authority to the Provenance Trust Ledger
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="instName" className="text-xs font-semibold text-gray-700">Institution Legal Name *</label>
              <input
                id="instName"
                name="instName"
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. Stanford University"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="instDomain" className="text-xs font-semibold text-gray-700">Official Domain *</label>
              <input
                id="instDomain"
                name="instDomain"
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. stanford.edu"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <p className="text-[11px] text-gray-400">Must match institutional domain exactly.</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="instContactEmail" className="text-xs font-semibold text-gray-700">Staff Registrar Email *</label>
              <input
                id="instContactEmail"
                name="instContactEmail"
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="registrar@stanford.edu"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <p className="text-[11px] text-gray-400">Must end in @{domain || "yourdomain.edu"}</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="instPassword" className="text-xs font-semibold text-gray-700">Staff Password *</label>
              <input
                id="instPassword"
                name="instPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Submit Institutional Registration</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
            Already registered?{" "}
            <Link href="/login" className="text-accent font-semibold hover:underline">
              Sign in to staff portal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
