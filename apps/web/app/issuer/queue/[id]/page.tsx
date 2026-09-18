"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Info,
  ArrowLeft,
  Download,
  User,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { API_BASE } from "../../../../lib/config";

interface VerificationRequestDetail {
  id: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  resolvedAt: string | null;
  credential: {
    id: string;
    credentialType: string;
    credentialTitle: string;
    issueDate: string | null;
    certificateNumber: string | null;
    document?: {
      id: string;
      storageKey: string;
      originalMimeType: string;
      rawFileHash: string;
      analyses: Array<{
        id: string;
        signalType: string;
        signalValue: {
          fact?: string;
          disclaimer?: string;
          [key: string]: any;
        };
        severity: "low_concern" | "review_recommended" | "inconclusive" | string;
      }>;
    };
  };
  candidate: {
    id: string;
    email: string;
    profile?: {
      name: string;
      publicUsername: string;
      headline?: string;
    };
  };
}

export default function VerificationDetailView() {
  const params = useParams();
  const requestId = params.id as string;
  const router = useRouter();
  const { user, isLoading, apiFetch, accessToken } = useAuth();

  const [request, setRequest] = useState<VerificationRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    try {
      const res = await apiFetch(`/issuer/verification-requests/${requestId}`);
      if (res.ok) {
        const json = await res.json();
        setRequest(json.verificationRequest);
      }
    } catch (err) {
      console.error("Detail load error:", err);
    } finally {
      setLoading(false);
    }
  }, [requestId, apiFetch]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "issuer_staff")) {
      router.push("/login");
      return;
    }

    if (user?.role === "issuer_staff") {
      loadDetail();
    }
  }, [user, isLoading, router, loadDetail]);

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to formally approve this credential and append an immutable event to your institution's hash chain?")) {
      return;
    }

    setSubmittingAction(true);
    setActionError(null);

    try {
      const res = await apiFetch(`/issuer/verification-requests/${requestId}/approve`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Failed to approve credential");
      } else {
        await loadDetail();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter a formal reason for rejecting this verification request:");
    if (!reason || !reason.trim()) {
      return;
    }

    setSubmittingAction(true);
    setActionError(null);

    try {
      const res = await apiFetch(`/issuer/verification-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: reason.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Failed to reject credential");
      } else {
        await loadDetail();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-surface-card rounded-2xl border border-gray-200 text-center space-y-3">
        <h2 className="text-lg font-bold text-primary">Verification Request Not Found</h2>
        <p className="text-xs text-gray-500">This request does not exist or does not belong to your institution.</p>
        <Link href="/issuer/queue" className="inline-block text-xs font-semibold text-accent hover:underline">
          Return to Queue
        </Link>
      </div>
    );
  }

  const { credential, candidate, status } = request;
  const analyses = credential.document?.analyses || [];
  const hasWarnings = analyses.some((a) => a.severity === "review_recommended");
  const documentUrl = accessToken
    ? `${API_BASE}/issuer/verification-requests/${requestId}/document?token=${encodeURIComponent(accessToken)}`
    : `${API_BASE}/issuer/verification-requests/${requestId}/document`;

  return (
    <div className="space-y-6 py-4">
      {/* Top Bar Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/issuer/queue"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Queue</span>
        </Link>

        <div>
          {status === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <span>Pending Review</span>
            </span>
          )}
          {status === "approved" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Approved & Anchored to Chain</span>
            </span>
          )}
          {status === "rejected" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Declined</span>
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Side-by-Side Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidate Document Stream */}
        <div className="lg:col-span-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <FileText className="w-4 h-4 text-accent" />
              <span>Candidate Uploaded Document</span>
            </div>

            <a
              href={documentUrl}
              target="_blank"
              download
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </a>
          </div>

          <div className="flex-1 min-h-[500px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative flex items-center justify-center">
            <iframe
              src={documentUrl}
              title="Candidate Uploaded Document"
              className="w-full h-full min-h-[500px] border-none rounded-xl"
            />
          </div>
        </div>

        {/* Right Column: Metadata & Deterministic Signals */}
        <div className="lg:col-span-6 space-y-6">
          {/* Candidate & Claimed Credential Details */}
          <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="space-y-1 border-b border-gray-100 pb-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-light text-accent">
                {credential.credentialType}
              </span>
              <h2 className="text-xl font-extrabold text-primary pt-1">{credential.credentialTitle}</h2>
              <p className="text-xs text-gray-400 font-mono">Credential ID: {credential.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Candidate</span>
                </span>
                <p className="font-bold text-gray-800">
                  {candidate.profile?.name || candidate.email.split("@")[0]}
                </p>
                <p className="text-gray-400 text-[11px]">{candidate.email}</p>
                {candidate.profile?.publicUsername && (
                  <Link
                    href={`/u/${candidate.profile.publicUsername}`}
                    target="_blank"
                    className="text-accent hover:underline text-[11px]"
                  >
                    @{candidate.profile.publicUsername}
                  </Link>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Conferral Date</span>
                </span>
                <p className="font-bold text-gray-800">
                  {credential.issueDate ? new Date(credential.issueDate).toLocaleDateString() : "Not specified"}
                </p>
                {credential.certificateNumber && (
                  <p className="text-gray-500 font-mono text-[11px]">#{credential.certificateNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Deterministic Signal Inspection Card */}
          <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  <span>Deterministic Analysis Signals</span>
                </h3>
                <p className="text-[11px] text-gray-400">Extracted structural properties from document bytes</p>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                hasWarnings ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}>
                {hasWarnings ? "Review Recommended" : "Low Concern"}
              </span>
            </div>

            {analyses.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No automated signals generated for this document.</p>
            ) : (
              <div className="space-y-3">
                {analyses.map((sig) => {
                  const isWarning = sig.severity === "review_recommended";
                  const isInconclusive = sig.severity === "inconclusive";

                  return (
                    <div
                      key={sig.id}
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        isWarning
                          ? "bg-amber-50/50 border-amber-200"
                          : isInconclusive
                          ? "bg-blue-50/50 border-blue-200"
                          : "bg-surface border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold font-mono uppercase text-gray-700">
                          {sig.signalType.replace(/_/g, " ")}
                        </span>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isWarning
                            ? "bg-amber-100 text-amber-800"
                            : isInconclusive
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {sig.severity.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="text-xs text-gray-800">
                        <span className="font-semibold">Extracted Fact: </span>
                        {sig.signalValue.fact || JSON.stringify(sig.signalValue)}
                      </p>

                      {sig.signalValue.disclaimer && (
                        <p className="text-[11px] text-gray-500 italic flex items-start gap-1 pt-1 border-t border-gray-100">
                          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                          <span>{sig.signalValue.disclaimer}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Decision Action Box */}
          {status === "pending" && (
            <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-primary">Verification Attestation Decision</h3>
              <p className="text-xs text-gray-500">
                Approving will compute SHA-256 canonical data and record an immutable event to your institution&apos;s hash chain.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleApprove}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Append to Chain</span>
                </button>

                <button
                  onClick={handleReject}
                  disabled={submittingAction}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>
          )}

          {status === "approved" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Recorded to Cryptographic Ledger</span>
              </div>
              <p className="text-emerald-700">
                This credential is now cryptographically attested. Anyone can verify its mathematical integrity on the public verifier page.
              </p>
              <Link
                href={`/verify/${credential.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 font-bold text-accent underline pt-1"
              >
                <span>View Public Verifier</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
