"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { FileText, ArrowLeft, ChevronLeft, ChevronRight, Activity, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  actorId?: string | null;
  targetType: string;
  targetId?: string | null;
  severity?: string;
  ipAddress?: string | null;
  metadata: any;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminAuditLogPage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async (p: number, filter: string) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(p),
        limit: "10",
      });
      if (filter) {
        queryParams.set("severity", filter);
      }

      const res = await apiFetch(`/admin/audit-log?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.auditLogs || []);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
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
      loadAuditLogs(page, severityFilter);
    }
  }, [user, isLoading, router, page, severityFilter, loadAuditLogs]);

  const handleFilterChange = (filter: string) => {
    setSeverityFilter(filter);
    setPage(1);
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "security_alert":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3" />
            <span>Alert</span>
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            <span>Warning</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-light text-accent border border-accent/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Info</span>
          </span>
        );
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
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            <span>Platform Audit Log & Security Events</span>
          </h1>
          <p className="text-xs text-gray-500">
            Immutable administrative oversight and active threat monitoring audit trail.
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            severityFilter === ""
              ? "bg-accent text-white shadow-sm"
              : "bg-surface-card border border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          All Events
        </button>
        <button
          onClick={() => handleFilterChange("security_alert")}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            severityFilter === "security_alert"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-surface-card border border-gray-200 text-rose-700 hover:bg-rose-50"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Security Alerts</span>
        </button>
        <button
          onClick={() => handleFilterChange("warning")}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            severityFilter === "warning"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-surface-card border border-gray-200 text-amber-700 hover:bg-amber-50"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Warnings & Throttles</span>
        </button>
        <button
          onClick={() => handleFilterChange("info")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            severityFilter === "info"
              ? "bg-accent text-white shadow-sm"
              : "bg-surface-card border border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          Governance
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
            <span>Loading security logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No audit logs match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-5 space-y-2 hover:bg-surface/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(log.severity)}
                    <span className="text-xs font-mono font-bold text-primary">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-500">
                      Target: <span className="font-semibold text-gray-700">{log.targetType}</span>
                      {log.targetId && (
                        <span className="font-mono text-[11px] ml-1">
                          ({log.targetId.substring(0, 8)}...)
                        </span>
                      )}
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                  <p>
                    Actor:{" "}
                    <span className="font-semibold text-gray-800">
                      {log.actor?.email ||
                        (log.ipAddress ? `Anonymous / Attacker (${log.ipAddress})` : "System Service")}
                    </span>
                  </p>

                  {log.metadata && (
                    <pre className="font-mono text-[11px] bg-surface p-1.5 rounded border border-gray-200 overflow-x-auto max-w-xl">
                      {JSON.stringify(log.metadata)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 bg-surface">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-surface-card hover:bg-gray-100 border border-gray-300 rounded-lg font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 bg-surface-card hover:bg-gray-100 border border-gray-300 rounded-lg font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
