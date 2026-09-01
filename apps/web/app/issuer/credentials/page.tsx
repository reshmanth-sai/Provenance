"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  PlusCircle,
  Clock,
  RotateCcw,
} from "lucide-react";

interface CredentialRow {
  id: string;
  source: string;
  status: "verified" | "revoked" | "pending" | "unverified";
  credentialType: string;
  credentialTitle: string;
  issueDate: string | null;
  certificateNumber: string | null;
  createdAt: string;
  candidate?: {
    email: string;
    profile?: {
      name: string;
      publicUsername: string;
    };
  };
}

export default function CredentialRosterPage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCredentials = useCallback(async () => {
    try {
      const res = await apiFetch("/issuer/credentials");
      if (res.ok) {
        const json = await res.json();
        setCredentials(json.credentials || []);
      }
    } catch (err) {
      console.error("Error loading roster:", err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "issuer_staff")) {
      router.push("/login");
      return;
    }

    if (user?.role === "issuer_staff") {
      loadCredentials();
    }
  }, [user, isLoading, router, loadCredentials]);

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingId) return;

    setRevoking(true);
    setError(null);

    try {
      const res = await apiFetch(`/issuer/credentials/${revokingId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revokeReason.trim() || "Revoked by issuer authority" }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to revoke credential");
      } else {
        setRevokingId(null);
        setRevokeReason("");
        await loadCredentials();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revocation failed");
    } finally {
      setRevoking(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Award className="w-6 h-6 text-accent" />
            <span>Institutional Credential Roster</span>
          </h1>
          <p className="text-xs text-gray-500">
            Audit all credentials issued or verified by your institution, or issue formal revocations.
          </p>
        </div>

        <Link
          href="/issuer/issue"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Issue New Credential</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Revocation Modal */}
      {revokingId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-card rounded-2xl border border-gray-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Revoke Credential on Hash Chain</span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Revoking will record a permanent, immutable <span className="font-mono font-bold text-rose-700">revoked</span> block to your institution&apos;s ledger.
              The credential will be marked as revoked on all public audit pages.
            </p>

            <form onSubmit={handleRevokeSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Reason for Revocation *</label>
                <input
                  type="text"
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Credential superseded / Issued in error"
                  className="w-full px-3 py-2 bg-surface border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRevokingId(null);
                    setRevokeReason("");
                  }}
                  className="px-4 py-2 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revoking}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {revoking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirm Revocation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Table Card */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {credentials.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <Award className="w-8 h-8 mx-auto text-gray-300" />
            <p>No credentials issued or verified yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {credentials.map((cred) => {
              const isVerified = cred.status === "verified";
              const isRevoked = cred.status === "revoked";

              return (
                <div
                  key={cred.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                        {cred.credentialType}
                      </span>

                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      )}
                      {isRevoked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Revoked</span>
                        </span>
                      )}
                      {cred.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-primary">{cred.credentialTitle}</h3>
                    <p className="text-xs text-gray-500">
                      Recipient: <span className="font-semibold text-gray-800">{cred.candidate?.profile?.name || cred.candidate?.email || "Candidate"}</span>
                      {cred.issueDate && (
                        <span> • Conferred {new Date(cred.issueDate).toLocaleDateString()}</span>
                      )}
                      {cred.certificateNumber && (
                        <span className="font-mono text-gray-400"> • #{cred.certificateNumber}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/verify/${cred.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <span>Public Verifier</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {isVerified && (
                      <button
                        onClick={() => {
                          setRevokingId(cred.id);
                          setRevokeReason("");
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
