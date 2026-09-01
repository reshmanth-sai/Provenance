"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  Inbox,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface VerificationRequestItem {
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
      originalMimeType: string;
      analyses?: Array<{
        severity: string;
        signalType: string;
      }>;
    };
  };
  candidate: {
    id: string;
    email: string;
    profile?: {
      name: string;
      publicUsername: string;
    };
  };
}

export default function VerificationQueuePage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<VerificationRequestItem[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "issuer_staff")) {
      router.push("/login");
      return;
    }

    if (user?.role === "issuer_staff") {
      apiFetch("/issuer/verification-requests")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.verificationRequests) {
            setRequests(data.verificationRequests);
          }
        })
        .catch((err) => console.error("Queue load error:", err))
        .finally(() => setLoading(false));
    }
  }, [user, isLoading, router, apiFetch]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Inbox className="w-6 h-6 text-accent" />
            <span>Verification Request Queue</span>
          </h1>
          <p className="text-xs text-gray-500">
            Review self-uploaded credentials and commit cryptographic attestations to your institution&apos;s hash chain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/issuer/issue"
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            + Direct Issue
          </Link>
          <Link
            href="/issuer/chain"
            className="px-4 py-2 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Chain Explorer
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === "pending"
              ? "bg-accent text-white"
              : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          Pending Review ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === "approved"
              ? "bg-accent text-white"
              : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === "rejected"
              ? "bg-accent text-white"
              : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === "all"
              ? "bg-accent text-white"
              : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          All Requests ({requests.length})
        </button>
      </div>

      {/* Queue List Table */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-gray-300" />
            <p>No verification requests matching filter &quot;{filter}&quot;.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((req) => {
              const candidateName = req.candidate.profile?.name || req.candidate.email.split("@")[0];
              const analyses = req.credential.document?.analyses || [];
              const hasWarnings = analyses.some((a) => a.severity === "review_recommended");

              return (
                <div
                  key={req.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                        {req.credential.credentialType}
                      </span>

                      {req.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {req.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved & Recorded</span>
                        </span>
                      )}
                      {req.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      )}

                      {hasWarnings && req.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Signal Flags</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-primary">{req.credential.credentialTitle}</h3>
                    <p className="text-xs text-gray-500">
                      Candidate: <span className="font-semibold text-gray-800">{candidateName}</span> ({req.candidate.email}) • Requested on {new Date(req.requestedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Link
                    href={`/issuer/queue/${req.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
                  >
                    <span>Review Request</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
