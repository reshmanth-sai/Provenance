"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Users,
  Calendar,
} from "lucide-react";

interface InstitutionItem {
  id: string;
  name: string;
  domain: string;
  status: "pending" | "approved" | "rejected";
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  members?: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      email: string;
    };
  }>;
}

export default function AdminInstitutionsPage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInstitutions = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/institutions");
      if (res.ok) {
        const json = await res.json();
        setInstitutions(json.institutions || []);
      }
    } catch (err) {
      console.error("Failed to load institutions:", err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "platform_admin")) {
      router.push("/login");
      return;
    }

    if (user?.role === "platform_admin") {
      loadInstitutions();
    }
  }, [user, isLoading, router, loadInstitutions]);

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Approve institutional status for ${name}? Staff will be authorized to issue credentials.`)) {
      return;
    }

    setProcessingId(id);
    setError(null);

    try {
      const res = await apiFetch(`/admin/institutions/${id}/approve`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to approve institution");
      } else {
        await loadInstitutions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Reject institutional registration for ${name}?`)) {
      return;
    }

    setProcessingId(id);
    setError(null);

    try {
      const res = await apiFetch(`/admin/institutions/${id}/reject`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to reject institution");
      } else {
        await loadInstitutions();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  const filtered = institutions.filter((inst) => {
    if (filter === "all") return true;
    return inst.status === filter;
  });

  const pendingCount = institutions.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-accent" />
            <span>Institution Directory & Approvals</span>
          </h1>
          <p className="text-xs text-gray-500">
            Review institution registration applications, verify domain ownership, and manage authorized issuers.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Console</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

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
          Pending Approvals ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === "approved"
              ? "bg-accent text-white"
              : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          Approved Issuers
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
          All ({institutions.length})
        </button>
      </div>

      {/* Institutions List Table */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-gray-300" />
            <p>No institutions matching &quot;{filter}&quot;.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((inst) => {
              const isPending = inst.status === "pending";
              const isApproved = inst.status === "approved";
              const isRejected = inst.status === "rejected";

              return (
                <div
                  key={inst.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-primary">{inst.name}</h3>

                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Vetting</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Authorized Issuer</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 font-mono">
                      Domain: <span className="text-accent font-semibold">{inst.domain}</span> • ID: {inst.id}
                    </p>

                    {inst.members && inst.members.length > 0 && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 pt-0.5">
                        <Users className="w-3 h-3" />
                        <span>Registered Staff: {inst.members.map((m) => m.user.email).join(", ")}</span>
                      </p>
                    )}

                    {isApproved && inst.approvedAt && (
                      <p className="text-[11px] text-emerald-700">
                        Approved on {new Date(inst.approvedAt).toLocaleDateString()} by Admin ID {inst.approvedBy?.substring(0, 8)}...
                      </p>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(inst.id, inst.name)}
                        disabled={processingId === inst.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleReject(inst.id, inst.name)}
                        disabled={processingId === inst.id}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
