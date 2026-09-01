"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Users, ShieldCheck, User as UserIcon, Building2, ArrowLeft } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  role: "candidate" | "issuer_staff" | "platform_admin";
  createdAt: string;
  candidateProfile?: {
    name: string;
    publicUsername: string;
  } | null;
  issuer?: {
    id: string;
    name: string;
    domain: string;
  } | null;
}

export default function AdminUsersPage() {
  const { user, isLoading, apiFetch } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "platform_admin")) {
      router.push("/login");
      return;
    }

    if (user?.role === "platform_admin") {
      apiFetch("/admin/users")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.users) {
            setUsers(data.users);
          }
        })
        .catch((err) => console.error("Failed to load users:", err))
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

  const filtered = users.filter((u) => {
    if (filterRole === "all") return true;
    return u.role === filterRole;
  });

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            <span>User & Identity Directory</span>
          </h1>
          <p className="text-xs text-gray-500">
            Platform user directory across candidates, verified institutional staff, and system administrators.
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

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilterRole("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterRole === "all" ? "bg-accent text-white" : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setFilterRole("candidate")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterRole === "candidate" ? "bg-accent text-white" : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          Candidates
        </button>
        <button
          onClick={() => setFilterRole("issuer_staff")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterRole === "issuer_staff" ? "bg-accent text-white" : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          Issuer Staff
        </button>
        <button
          onClick={() => setFilterRole("platform_admin")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterRole === "platform_admin" ? "bg-accent text-white" : "bg-surface text-gray-600 hover:bg-gray-100"
          }`}
        >
          Platform Admins
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-surface-card rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filtered.map((u) => {
            const isCandidate = u.role === "candidate";
            const isIssuer = u.role === "issuer_staff";
            const isAdmin = u.role === "platform_admin";

            return (
              <div
                key={u.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{u.email}</span>

                    {isCandidate && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                        Candidate
                      </span>
                    )}
                    {isIssuer && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        Issuer Staff
                      </span>
                    )}
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                        Platform Admin
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 font-mono">ID: {u.id}</p>

                  {u.candidateProfile && (
                    <p className="text-xs text-gray-700">
                      Profile: <span className="font-semibold">{u.candidateProfile.name}</span> (
                      <Link href={`/u/${u.candidateProfile.publicUsername}`} target="_blank" className="text-accent hover:underline">
                        @{u.candidateProfile.publicUsername}
                      </Link>
                      )
                    </p>
                  )}

                  {u.issuer && (
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-accent" />
                      <span>Affiliated Institution: <span className="font-semibold">{u.issuer.name}</span> ({u.issuer.domain})</span>
                    </p>
                  )}
                </div>

                <div className="text-right text-xs text-gray-400">
                  <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
