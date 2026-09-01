"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  Link2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Layers,
  Building2,
  RefreshCw,
} from "lucide-react";

interface ChainAuditResponse {
  issuerId: string;
  institutionName: string;
  algorithm: string;
  chainValid: boolean;
  totalEvents: number;
  events: Array<{
    id: string;
    position: number;
    eventType: "issued" | "verified" | "revoked" | string;
    credentialId: string;
    contentHash: string;
    prevHash: string | null;
    createdAt: string;
    createdBy: string;
    result: "valid" | "modified" | "depends_on_invalid" | string;
    canonicalData: any;
  }>;
}

export default function IssuerChainExplorer() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [chainData, setChainData] = useState<ChainAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);

  const loadChain = async () => {
    setAuditing(true);
    try {
      const res = await apiFetch("/issuer/chain-audit");
      if (res.ok) {
        const json = await res.json();
        setChainData(json);
      }
    } catch (err) {
      console.error("Chain audit error:", err);
    } finally {
      setLoading(false);
      setAuditing(false);
    }
  };

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "issuer_staff")) {
      router.push("/login");
      return;
    }

    if (user?.role === "issuer_staff") {
      loadChain();
    }
  }, [user, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  const isChainValid = chainData?.chainValid ?? false;

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Link2 className="w-6 h-6 text-accent" />
            <span>Institutional Hash Chain Explorer</span>
          </h1>
          <p className="text-xs text-gray-500">
            Immutable, append-only cryptographic ledger for <span className="font-semibold text-gray-700">{chainData?.institutionName || "Institution"}</span>.
          </p>
        </div>

        <button
          onClick={loadChain}
          disabled={auditing}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${auditing ? "animate-spin" : ""}`} />
          <span>Re-verify Chain</span>
        </button>
      </div>

      {/* Overall Chain Integrity Banner */}
      {isChainValid ? (
        <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-4 text-emerald-900 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold">Chain Intact</h3>
              <p className="text-xs text-emerald-700">
                All {chainData?.totalEvents || 0} sequential blocks are cryptographically verified with SHA-256 digests and unbroken previous-hash pointers.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
            Cryptographically Valid
          </span>
        </div>
      ) : (
        <div className="p-5 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between gap-4 text-rose-900 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-rose-600 shrink-0" />
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold">Tamper Detected in Hash Chain</h3>
              <p className="text-xs text-rose-700">
                Integrity audit failed. One or more blocks in the institutional sequence have had their canonical data or hash modified.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 whitespace-nowrap">
            Chain Broken
          </span>
        </div>
      )}

      {/* Sequential Event Stream */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <span>Sequential Ledger Blocks</span>
          </h2>
          <span className="text-xs text-gray-500 font-mono">Algorithm: {chainData?.algorithm || "SHA-256"}</span>
        </div>

        {chainData?.events.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No events have been committed to this institution&apos;s ledger yet.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {chainData?.events.map((evt) => {
              const isValid = evt.result === "valid";
              const isModified = evt.result === "modified";
              const isBrokenDep = evt.result === "depends_on_invalid";

              return (
                <div key={evt.id} className="relative space-y-2">
                  {/* Timeline node */}
                  <div className={`absolute -left-6 sm:-left-8 top-2 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-surface-card ${
                    isValid ? "border-emerald-500 text-emerald-600" : "border-rose-500 text-rose-600"
                  }`}>
                    {isValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Block Card */}
                  <div className={`p-4 sm:p-5 rounded-xl border shadow-sm space-y-3 ${
                    isValid
                      ? "bg-surface border-gray-200"
                      : "bg-rose-50/50 border-rose-300"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent font-mono">
                          Position #{evt.position}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-light text-accent">
                          {evt.eventType}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          ID: {evt.credentialId}
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
                            <span>Depends on Broken Block</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-gray-400 font-mono text-[10px]">CURRENT CONTENT HASH (SHA-256)</span>
                        <p className="font-mono text-gray-700 break-all text-[11px] bg-surface-card p-1.5 rounded border border-gray-200">
                          {evt.contentHash}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-gray-400 font-mono text-[10px]">PREVIOUS BLOCK HASH POINTER</span>
                        <p className="font-mono text-gray-700 break-all text-[11px] bg-surface-card p-1.5 rounded border border-gray-200">
                          {evt.prevHash || "(GENESIS BLOCK - FIRST ENTRY)"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>Committed on {new Date(evt.createdAt).toLocaleString()}</span>
                      <Link
                        href={`/verify/${evt.credentialId}`}
                        target="_blank"
                        className="text-accent hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Audit Public Verifier</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
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
