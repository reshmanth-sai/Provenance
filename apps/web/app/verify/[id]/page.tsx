"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  QrCode,
  Download,
  Link2,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Layers,
  ArrowDown,
} from "lucide-react";

interface VerificationResponse {
  credential: {
    type: string;
    title: string;
    institution: string | null;
    year: number | null;
  };
  verification: {
    status: string;
    issuerVerified: boolean;
    revoked?: boolean;
  };
  integrity: {
    algorithm: string;
    chainValid: boolean;
    events: Array<{
      eventType: "issued" | "verified" | "revoked" | string;
      position: number;
      result: "valid" | "modified" | "depends_on_invalid" | string;
    }>;
  } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function PublicVerifyPage() {
  const params = useParams();
  const credentialId = params.id as string;

  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!credentialId) return;

    fetch(`${API_BASE}/verify/${credentialId}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load verification");
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch((err) => {
        console.error("Verification error:", err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [credentialId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-primary">Credential Not Found</h2>
        <p className="text-xs text-gray-500">
          No record exists for credential ID <span className="font-mono font-semibold">{credentialId}</span>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors"
        >
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const { credential, verification, integrity } = data;
  const isVerified = verification.status === "verified";
  const isRevoked = verification.status === "revoked";
  const isPending = verification.status === "pending";

  const qrImageUrl = `${API_BASE}/verify/${credentialId}/qr`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Banner Status */}
      {isVerified && integrity?.chainValid && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-3 text-emerald-900 shadow-sm">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold">Cryptographically Verified Credential</h4>
            <p className="text-xs text-emerald-700">
              This credential has been formally attested by {credential.institution || "an authorized issuer"} and is secured on a tamper-evident SHA-256 hash chain.
            </p>
          </div>
        </div>
      )}

      {isRevoked && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-amber-900 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold">Credential Revoked by Issuer</h4>
            <p className="text-xs text-amber-700">
              This credential was previously issued but has since been revoked. The full audit trail and revocation event are preserved below.
            </p>
          </div>
        </div>
      )}

      {integrity && !integrity.chainValid && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-3 text-rose-900 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold">Tamper Detected in Hash Chain</h4>
            <p className="text-xs text-rose-700">
              The cryptographic integrity check failed. One or more blocks in the issuer's sequential chain have been modified or broken.
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 shadow-sm">
          <Clock className="w-6 h-6 text-blue-600 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold">Verification Pending</h4>
            <p className="text-xs text-blue-700">
              This is a self-submitted credential awaiting formal attestation from {credential.institution || "the claimed institution"}.
            </p>
          </div>
        </div>
      )}

      {/* Credential Details Card */}
      <section className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-accent-light text-accent">
                {credential.type}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                ID: {credentialId}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-primary pt-1">{credential.title}</h1>
          </div>

          <div>
            {isVerified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified</span>
              </span>
            )}
            {isRevoked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Revoked</span>
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Pending Review</span>
              </span>
            )}
            {verification.status === "unverified" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                <span>Self-Submitted</span>
              </span>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Building2 className="w-4 h-4" />
              <span>Issuing Institution</span>
            </div>
            <p className="font-semibold text-primary">{credential.institution || "Self-Reported"}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="w-4 h-4" />
              <span>Conferral Year</span>
            </div>
            <p className="font-semibold text-primary">{credential.year || "Not specified"}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Layers className="w-4 h-4" />
              <span>Attestation Standard</span>
            </div>
            <p className="font-semibold text-primary">
              {integrity ? `${integrity.algorithm} Per-Issuer Ledger` : "Self-Submission"}
            </p>
          </div>
        </div>
      </section>

      {/* Visual Hash Chain Event Breakdown */}
      {integrity ? (
        <section className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <Link2 className="w-5 h-5 text-accent" />
                <span>Cryptographic Ledger Trail</span>
              </h2>
              <p className="text-xs text-gray-500">
                Audited sequence of immutable events recorded for this credential in the institution&apos;s hash chain.
              </p>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              integrity.chainValid
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {integrity.chainValid ? "Chain Intact" : "Chain Broken"}
            </span>
          </div>

          {/* Sequential Event Timeline */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {integrity.events.map((evt, idx) => {
              const isValid = evt.result === "valid";
              const isModified = evt.result === "modified";
              const isBrokenDep = evt.result === "depends_on_invalid";

              return (
                <div key={idx} className="relative space-y-2">
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-surface-card ${
                    isValid ? "border-emerald-500 text-emerald-600" : "border-rose-500 text-rose-600"
                  }`}>
                    {isValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Event Card */}
                  <div className={`p-4 rounded-xl border shadow-sm ${
                    isValid
                      ? "bg-surface border-gray-200"
                      : "bg-rose-50/50 border-rose-300"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent font-mono">
                          Position #{evt.position}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-accent-light text-accent">
                          {evt.eventType}
                        </span>
                      </div>

                      <div>
                        {isValid && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Hash Verified (SHA-256)</span>
                          </span>
                        )}
                        {isModified && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Content Hash Modified</span>
                          </span>
                        )}
                        {isBrokenDep && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Broken Dependency</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
          <FileText className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">No Ledger Entries Found</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            This credential has not been committed to an institutional hash chain. It remains a self-submitted document.
          </p>
        </section>
      )}

      {/* QR Code Section */}
      <section className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start text-primary font-bold">
            <QrCode className="w-5 h-5 text-accent" />
            <span>Direct Public Verification Link</span>
          </div>
          <p className="text-xs text-gray-500 max-w-md">
            Scan with any camera or verifier app to open this cryptographic audit page directly on Provenance.
          </p>
          <div className="pt-2">
            <a
              href={qrImageUrl}
              download={`provenance-qr-${credentialId}.png`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR PNG</span>
            </a>
          </div>
        </div>

        <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm shrink-0">
          <img
            src={qrImageUrl}
            alt={`Verification QR for ${credentialId}`}
            className="w-36 h-36 object-contain"
          />
        </div>
      </section>
    </div>
  );
}
