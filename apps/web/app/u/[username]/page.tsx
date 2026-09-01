"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
  Award,
  GraduationCap,
  FileCheck,
  User as UserIcon,
  Search,
} from "lucide-react";

interface CandidateProfileData {
  candidate: {
    publicUsername: string;
    name: string;
    headline: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
  credentials: {
    verified: Array<{
      id: string;
      type: string;
      title: string;
      institution: string | null;
      issueDate: string | null;
      certificateNumber: string | null;
      status: string;
    }>;
    revoked: Array<{
      id: string;
      type: string;
      title: string;
      institution: string | null;
      issueDate: string | null;
      certificateNumber: string | null;
      status: string;
    }>;
    unconfirmed: Array<{
      id: string;
      type: string;
      title: string;
      claimedInstitution: string | null;
      issueDate: string | null;
      status: string;
    }>;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [data, setData] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    fetch(`${API_BASE}/u/${username}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <UserIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-primary">Candidate Profile Not Found</h2>
        <p className="text-xs text-gray-500">
          The requested profile <span className="font-semibold">@{username}</span> does not exist or may have been updated.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors"
        >
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const { candidate, credentials } = data;
  const totalVerified = credentials.verified.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Candidate Header Card */}
      <section className="p-6 sm:p-8 bg-surface-card rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {candidate.avatarUrl ? (
            <img
              src={candidate.avatarUrl}
              alt={candidate.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-accent/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent-light text-accent flex items-center justify-center font-bold text-2xl border-2 border-accent/20">
              {candidate.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-primary">{candidate.name}</h1>
              {totalVerified > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{totalVerified} Cryptographically Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-accent">@{candidate.publicUsername}</p>

            {candidate.headline && (
              <p className="text-sm font-medium text-gray-700">{candidate.headline}</p>
            )}

            {candidate.bio && (
              <p className="text-xs text-gray-500 leading-relaxed max-w-2xl pt-1">{candidate.bio}</p>
            )}
          </div>
        </div>
      </section>

      {/* Group 1: Verified Credentials */}
      {credentials.verified.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Issuer-Verified Credentials</span>
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {credentials.verified.length} verified
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {credentials.verified.map((cred) => (
              <div
                key={cred.id}
                className="p-5 bg-surface-card rounded-xl border border-emerald-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {cred.type}
                    </span>
                    {cred.certificateNumber && (
                      <span className="text-xs text-gray-400 font-mono">
                        #{cred.certificateNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-primary">{cred.title}</h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Issued by: <span className="text-primary font-semibold">{cred.institution || "Institutional Partner"}</span>
                    {cred.issueDate && (
                      <span className="text-gray-400"> • {new Date(cred.issueDate).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</span>
                    )}
                  </p>
                </div>

                <Link
                  href={`/verify/${cred.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Hash Chain</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Group 2: Revoked Credentials (Explicitly shown & clearly marked) */}
      {credentials.revoked.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Revoked Credentials (Historical Record)</span>
            </h2>
            <span className="text-xs text-amber-700 font-medium">
              {credentials.revoked.length} revoked
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {credentials.revoked.map((cred) => (
              <div
                key={cred.id}
                className="p-5 bg-amber-50/50 rounded-xl border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                      Revoked by Issuer
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-gray-100 text-gray-600">
                      {cred.type}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-800 line-through opacity-80">{cred.title}</h3>
                  <p className="text-xs text-gray-600">
                    Originally issued by: <span className="font-medium">{cred.institution || "Institutional Partner"}</span>
                    {cred.issueDate && (
                      <span className="text-gray-400"> • {new Date(cred.issueDate).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</span>
                    )}
                  </p>
                </div>

                <Link
                  href={`/verify/${cred.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-card hover:bg-gray-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Audit Revocation Chain</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Group 3: Unconfirmed / Self-Submitted */}
      {credentials.unconfirmed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span>Self-Submitted / Unconfirmed Credentials</span>
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {credentials.unconfirmed.length} unconfirmed
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {credentials.unconfirmed.map((cred) => (
              <div
                key={cred.id}
                className="p-5 bg-surface-card rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                      {cred.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {cred.status === "verification_requested" ? "Verification Requested" : "Self-Submitted"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-primary">{cred.title}</h3>
                  <p className="text-xs text-gray-500">
                    Claimed Issuer: <span className="font-medium text-gray-700">{cred.claimedInstitution || "Not specified"}</span>
                    {cred.issueDate && (
                      <span> • {new Date(cred.issueDate).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-400 italic">
                    This reflects automated file checks only. It is not a verification — only {cred.claimedInstitution || "the issuing institution"} confirming this credential makes it verified.
                  </p>
                </div>

                <Link
                  href={`/verify/${cred.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state if candidate has 0 credentials */}
      {credentials.verified.length === 0 && credentials.revoked.length === 0 && credentials.unconfirmed.length === 0 && (
        <div className="p-8 bg-surface-card rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
          No credentials have been published to this profile yet.
        </div>
      )}
    </div>
  );
}
