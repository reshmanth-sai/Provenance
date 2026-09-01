"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { PlusCircle, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";

export default function DirectIssuePage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [candidateEmail, setCandidateEmail] = useState("");
  const [credentialType, setCredentialType] = useState("degree");
  const [credentialTitle, setCredentialTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedResult, setIssuedResult] = useState<any | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "issuer_staff")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch("/issuer/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateEmail: candidateEmail.trim(),
          credentialType,
          credentialTitle: credentialTitle.trim(),
          issueDate: issueDate || undefined,
          certificateNumber: certificateNumber.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to issue credential");
      } else {
        setIssuedResult(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-accent" />
          <span>Direct Credential Issuance</span>
        </h1>
        <p className="text-xs text-gray-500">
          Issue a verified diploma or certificate directly into your institution&apos;s append-only hash chain.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {issuedResult ? (
        <div className="p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-primary">Credential Issued & Committed to Ledger</h2>
            <p className="text-xs text-gray-500">
              An immutable <span className="font-semibold text-accent font-mono">issued</span> block was added to your hash chain.
            </p>
          </div>

          <div className="p-4 bg-surface rounded-xl border border-gray-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Credential Title:</span>
              <span className="font-bold text-primary">{issuedResult.credential.credentialTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Recipient Email:</span>
              <span className="font-semibold text-primary">{candidateEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Credential ID:</span>
              <span className="font-mono text-gray-700">{issuedResult.credential.id}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/verify/${issuedResult.credential.id}`}
              target="_blank"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Public Verifier Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => {
                setIssuedResult(null);
                setCandidateEmail("");
                setCredentialTitle("");
                setCertificateNumber("");
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Issue Another Credential
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="space-y-1">
            <label htmlFor="candidateEmail" className="text-xs font-semibold text-gray-700">Recipient / Candidate Email *</label>
            <input
              id="candidateEmail"
              name="candidateEmail"
              type="email"
              required
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              placeholder="student@example.com"
              className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="issueCredentialType" className="text-xs font-semibold text-gray-700">Credential Type *</label>
              <select
                id="issueCredentialType"
                name="issueCredentialType"
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="degree">Degree / Diploma</option>
                <option value="certificate">Certificate</option>
                <option value="transcript">Transcript</option>
                <option value="license">Professional License</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="issueConferralDate" className="text-xs font-semibold text-gray-700">Conferral / Issue Date</label>
              <input
                id="issueConferralDate"
                name="issueConferralDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="issueCredentialTitle" className="text-xs font-semibold text-gray-700">Credential Title *</label>
            <input
              id="issueCredentialTitle"
              name="issueCredentialTitle"
              type="text"
              required
              value={credentialTitle}
              onChange={(e) => setCredentialTitle(e.target.value)}
              placeholder="e.g. Bachelor of Science in Computer Science"
              className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="issueCertNumber" className="text-xs font-semibold text-gray-700">Certificate / Document ID</label>
            <input
              id="issueCertNumber"
              name="issueCertNumber"
              type="text"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              placeholder="e.g. STAN-2023-CS-099"
              className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <div className="pt-2">
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
                  <span>Issue & Sign to Hash Chain</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
