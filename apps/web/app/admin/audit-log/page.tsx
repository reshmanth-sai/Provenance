"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { FileText, ArrowLeft, ChevronLeft, ChevronRight, Activity, ShieldCheck } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  actorUserId: string;
  targetType: string;
  targetId: string;
  metadata: any;
  createdAt: string;
  actor?: {
    email: string;
    role: string;
  } | null;
}

export default function AdminAuditLogPage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async (p: number) => {
    try {
      const res = await apiFetch(`/admin/audit-log?page=${p}&limit=10`);
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
      loadAuditLogs(page);
    }
  }, [user, isLoading, router, page, loadAuditLogs]);

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
            <Activity className="w-6 h-6 text-accent" />
            <span>Platform Audit Log</span>
          </h1>
          <p className="text-xs text-gray-500">
            Immutable administrative oversight trail tracking platform governance actions.
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

      {/* Audit Log Table */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No administrative audit logs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-5 space-y-2 hover:bg-surface/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-light text-accent">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-700 font-semibold">
                      Target: {log.targetType} ({log.targetId.substring(0, 8)}...)
                    </span>
                  </div>

                  <span className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                  <p>
                    Actor Admin: <span className="font-semibold text-gray-800">{log.actor?.email || log.actorUserId}</span>
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
