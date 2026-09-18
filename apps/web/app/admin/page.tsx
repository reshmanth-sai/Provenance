"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldAlert,
  Building2,
  Users,
  Award,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity,
} from "lucide-react";

interface AdminStats {
  users: {
    total: number;
    candidate: number;
    issuer_staff: number;
    platform_admin: number;
  };
  issuers: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  credentials: {
    total: number;
    verified: number;
    revoked: number;
    unverified: number;
    pending?: number;
    rejected?: number;
  };
  security?: {
    total: number;
    alerts: number;
    warnings: number;
  };
}

export default function AdminDashboardPage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "platform_admin")) {
      router.push("/login");
      return;
    }

    if (user?.role === "platform_admin") {
      apiFetch("/admin/stats")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.stats) {
            setStats(data.stats);
          }
        })
        .catch((err) => console.error("Admin stats load error:", err))
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

  const pendingIssuers = stats?.issuers.pending || 0;

  return (
    <div className="space-y-8 py-4">
      {/* Top Command Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start sm:items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-white/5 border border-emerald-500/20 dark:border-white/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-phosphor" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Platform Administration Console
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ACTIVE DEFENSE // NODE_SYNCED</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Network oversight, institution approval vetting, identity directory, and system audit logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Link
            href="/admin/institutions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <span>Review Institutions</span>
            {pendingIssuers > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                {pendingIssuers}
              </span>
            ) : (
              <ArrowRight className="w-3.5 h-3.5 opacity-60" />
            )}
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Category 1: Users */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Users by Role</h2>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                Total: {stats?.users.total || 0}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Candidates</span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{stats?.users.candidate || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:text-sky-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Issuer Staff</span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{stats?.users.issuer_staff || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-phosphor" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Platform Admins</span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{stats?.users.platform_admin || 0}</span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/users"
            className="inline-flex items-center justify-between w-full pt-3 border-t border-slate-200 dark:border-white/[0.06] text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
          >
            <span>Browse User Directory</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category 2: Institutions */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Institutions</h2>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                Total: {stats?.issuers.total || 0}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {(stats?.issuers.pending || 0) > 0 ? (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Pending Approval</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300 px-1.5 rounded bg-amber-500/20">
                    {stats?.issuers.pending}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Pending Approval</span>
                  </div>
                  <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-500">0</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Approved Issuers</span>
                </div>
                <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{stats?.issuers.approved || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Rejected Applications</span>
                </div>
                <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">{stats?.issuers.rejected || 0}</span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/institutions"
            className="inline-flex items-center justify-between w-full pt-3 border-t border-slate-200 dark:border-white/[0.06] text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
          >
            <span>Manage Approvals</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category 3: Credentials */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Credentials</h2>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                Total: {stats?.credentials.total || 0}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Verified on Ledger</span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats?.credentials.verified || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Revoked / Superseded</span>
                </div>
                <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">{stats?.credentials.revoked || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Self-Submitted</span>
                </div>
                <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-400">{stats?.credentials.unverified || 0}</span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/audit-log"
            className="inline-flex items-center justify-between w-full pt-3 border-t border-slate-200 dark:border-white/[0.06] text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
          >
            <span>View Platform Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Category 4: Threat Intelligence */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  (stats?.security?.alerts || 0) > 0 
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400" 
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Threat Monitoring</h2>
              </div>
              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                Total: {stats?.security?.total || 0}
              </span>
            </div>

            <div className="space-y-1 pt-1">
              {(stats?.security?.alerts || 0) > 0 ? (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Security Alerts</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-900 dark:text-rose-300 px-1.5 rounded bg-rose-500/20">
                    {stats?.security?.alerts}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Security Alerts</span>
                  </div>
                  <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-500">0</span>
                </div>
              )}

              {(stats?.security?.warnings || 0) > 0 ? (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 dark:border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">Warnings / Limits</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300 px-1.5 rounded bg-amber-500/20">
                    {stats?.security?.warnings}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Warnings / Limits</span>
                  </div>
                  <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-500">0</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-phosphor shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">Active Defense</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-phosphor">ENFORCING</span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/audit-log"
            className="inline-flex items-center justify-between w-full pt-3 border-t border-slate-200 dark:border-white/[0.06] text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
          >
            <span>Review Incidents</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
