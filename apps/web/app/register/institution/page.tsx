"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RegisterInstitutionPage() {
  const router = useRouter();

  const [institutionName, setInstitutionName] = useState("");
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register-institution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: institutionName.trim(),
          domain: domain.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to register institution");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 sm:p-10 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Candidate Registration</span>
        </Link>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-light text-accent">
          Issuer Onboarding
        </span>
      </div>

      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-primary">Register Issuing Institution</h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Onboard your university, certifying body, or licensing board to issue cryptographically signed credentials and review candidate verification requests.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-900">Institution Application Submitted</h3>
            <p className="text-xs text-emerald-700 max-w-sm mx-auto leading-relaxed">
              Your application for <strong>{institutionName}</strong> ({domain}) has been recorded with status <strong>Pending Verification</strong>. A platform administrator will review your institution domain.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="instName" className="text-xs font-semibold text-gray-700">Institution Name *</label>
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
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="staffEmail" className="text-xs font-semibold text-gray-700">Staff Administrator Email *</label>
            <input
              id="staffEmail"
              name="staffEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. registrar@stanford.edu"
              className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="staffPass" className="text-xs font-semibold text-gray-700">Password *</label>
              <input
                id="staffPass"
                name="staffPass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="staffConfirmPass" className="text-xs font-semibold text-gray-700">Confirm Password *</label>
              <input
                id="staffConfirmPass"
                name="staffConfirmPass"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 leading-relaxed space-y-1">
            <p className="font-semibold text-gray-800">Institutional Attestation Protocol:</p>
            <p>
              Registered institutions can review candidate-submitted documents, issue digital credentials, and cryptographically commit immutable block events to their institution&apos;s SHA-256 hash chain.
            </p>
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
                <Building2 className="w-5 h-5" />
                <span>Submit Institution Application</span>
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
