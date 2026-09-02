"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface CredentialItem {
  id: string;
  source?: string;
  status: string;
  credentialType?: string;
  credentialTitle?: string;
  type?: string;
  title?: string;
  institution?: string | null;
  issueDate: string | null;
  certificateNumber?: string | null;
  createdAt?: string;
  documentId?: string | null;
}

interface ProfileData {
  publicUsername: string;
  name: string;
  headline: string | null;
  avatarUrl: string | null;
}

export default function CandidateDashboard() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // 1. Fetch Profile
      const profRes = await apiFetch("/candidate/profile");
      let currentProfile: ProfileData | null = null;
      if (profRes.ok) {
        const pData = await profRes.json();
        currentProfile = pData.profile;
        setProfile(pData.profile);
      }

      // 2. Fetch Public Profile by username if available
      if (currentProfile?.publicUsername) {
        const pubRes = await fetch(`http://localhost:4000/u/${currentProfile.publicUsername}`);
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          const all = [
            ...(pubData.credentials?.verified || []).map((c: any) => ({ ...c, status: "verified" })),
            ...(pubData.credentials?.revoked || []).map((c: any) => ({ ...c, status: "revoked" })),
            ...(pubData.credentials?.unconfirmed || []).map((c: any) => ({ ...c, status: c.status === "verification_requested" ? "pending" : "unverified" })),
          ];
          setCredentials(all);
        }
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, isLoading, router, loadData]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  const verifiedCount = credentials.filter((c) => c.status === "verified").length;
  const pendingCount = credentials.filter((c) => c.status === "pending").length;
  const revokedCount = credentials.filter((c) => c.status === "revoked").length;

  return (
    <div className="space-y-8 py-4">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-primary">
            Welcome, {profile?.name || user?.email.split("@")[0]}
          </h1>
          <p className="text-xs text-gray-500">
            Manage your academic credentials and monitor institutional verification on the ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile?.publicUsername ? (
            <Link
              href={`/u/${profile.publicUsername}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>View Public Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold"
            >
              <User className="w-3.5 h-3.5" />
              <span>Create Profile Handle</span>
            </Link>
          )}

          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-surface-card rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-xs text-gray-500 font-medium">Total Credentials</span>
          <p className="text-2xl font-extrabold text-primary">{credentials.length}</p>
        </div>
        <div className="p-5 bg-surface-card rounded-xl border border-emerald-200 shadow-sm space-y-1">
          <span className="text-xs text-emerald-700 font-medium">Verified by Issuer</span>
          <p className="text-2xl font-extrabold text-emerald-600">{verifiedCount}</p>
        </div>
        <div className="p-5 bg-surface-card rounded-xl border border-blue-200 shadow-sm space-y-1">
          <span className="text-xs text-blue-700 font-medium">Verification Pending</span>
          <p className="text-2xl font-extrabold text-blue-600">{pendingCount}</p>
        </div>
        <div className="p-5 bg-surface-card rounded-xl border border-amber-200 shadow-sm space-y-1">
          <span className="text-xs text-amber-700 font-medium">Revoked / Superseded</span>
          <p className="text-2xl font-extrabold text-amber-600">{revokedCount}</p>
        </div>
      </div>

      {/* Credentials Table Card */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Your Credentials</h2>
          <span className="text-xs text-gray-400">{credentials.length} entries</span>
        </div>

        {credentials.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-gray-700">No credentials yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Upload your diploma or certificate to run deterministic signal inspection and request institutional attestation.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload First Credential</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                      {cred.credentialType || cred.type}
                    </span>
                    {cred.status === "verified" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    )}
                    {cred.status === "revoked" && (
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
                    {cred.status === "unverified" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                        <span>Self-Submitted</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-primary">{cred.credentialTitle || cred.title}</h3>
                  <p className="text-xs text-gray-500">
                    {cred.institution || "Self-Submitted"}
                    {cred.issueDate && (
                      <span> • {new Date(cred.issueDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })}</span>
                    )}
                  </p>
                  {cred.status === "unverified" && (
                    <p className="text-[11px] text-gray-500 italic">
                      This reflects automated file checks only. It is not a verification — only {cred.institution || "the issuing institution"} confirming this credential makes it verified.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/verify/${cred.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>Audit Verifier</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
