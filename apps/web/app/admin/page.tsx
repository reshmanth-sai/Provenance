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
      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <span>Platform Administration Console</span>
          </h1>
          <p className="text-xs text-gray-500">
            Network oversight, institution approval vetting, identity directory, and system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/institutions"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Review Institutions</span>
            {pendingIssuers > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-[10px]">
                {pendingIssuers}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Category 1: Users */}
        <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-primary">Users by Role</h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">Total: {stats?.users.total || 0}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-gray-100">
              <span className="text-gray-600">Candidates:</span>
              <span className="font-bold text-primary">{stats?.users.candidate || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-gray-100">
              <span className="text-gray-600">Issuer Staff:</span>
              <span className="font-bold text-primary">{stats?.users.issuer_staff || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-gray-100">
              <span className="text-gray-600">Platform Admins:</span>
              <span className="font-bold text-primary">{stats?.users.platform_admin || 0}</span>
            </div>
          </div>

          <Link
            href="/admin/users"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 pt-1"
          >
            <span>Browse User Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category 2: Issuers */}
        <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-primary">Institutions</h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">Total: {stats?.issuers.total || 0}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-amber-900 font-semibold">Pending Approval:</span>
              <span className="font-extrabold text-amber-800">{stats?.issuers.pending || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-gray-100">
              <span className="text-gray-600">Approved Issuers:</span>
              <span className="font-bold text-emerald-600">{stats?.issuers.approved || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-gray-100">
              <span className="text-gray-600">Rejected Applications:</span>
              <span className="font-bold text-rose-600">{stats?.issuers.rejected || 0}</span>
            </div>
          </div>

          <Link
            href="/admin/institutions"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 pt-1"
          >
            <span>Manage Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category 3: Credentials */}
        <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-primary">Credentials</h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">Total: {stats?.credentials.total || 0}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-emerald-100">
              <span className="text-emerald-700 font-semibold">Verified on Ledger:</span>
              <span className="font-bold text-emerald-600">{stats?.credentials.verified || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-rose-100">
              <span className="text-rose-700 font-semibold">Revoked / Superseded:</span>
              <span className="font-bold text-rose-600">{stats?.credentials.revoked || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-gray-100">
              <span className="text-gray-600">Self-Submitted:</span>
              <span className="font-bold text-gray-700">{stats?.credentials.unverified || 0}</span>
            </div>
          </div>

          <Link
            href="/admin/audit-log"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 pt-1"
          >
            <span>View Platform Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category 4: Security Threat Intelligence */}
        <div className="p-6 bg-surface-card rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${(stats?.security?.alerts || 0) > 0 ? "text-rose-600" : "text-emerald-600"}`} />
              <h2 className="text-base font-bold text-primary">Threat Monitoring</h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">Total: {stats?.security?.total || 0}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-rose-900 font-semibold">Security Alerts:</span>
              <span className="font-extrabold text-rose-700">{stats?.security?.alerts || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-amber-900 font-semibold">Warnings / Rate Limits:</span>
              <span className="font-extrabold text-amber-700">{stats?.security?.warnings || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface border border-gray-100">
              <span className="text-gray-600">Active Defense:</span>
              <span className="font-bold text-emerald-600">Enforcing</span>
            </div>
          </div>

          <Link
            href="/admin/audit-log"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 pt-1"
          >
            <span>Review Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
