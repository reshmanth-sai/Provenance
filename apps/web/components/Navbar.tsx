"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { Shield, Search, LogOut, User as UserIcon, PlusCircle, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchId, setSearchId] = useState("");
  const isLanding = pathname === "/";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify/${searchId.trim()}`);
      setSearchId("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/85 dark:bg-obsidian/85 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Telemetry Indicator */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-lg tracking-tight group">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/15 flex items-center justify-center group-hover:border-phosphor/50 transition-colors">
              <Shield className="w-4 h-4 text-phosphor" />
            </div>
            <span className="font-display tracking-tight font-semibold">Provenance</span>
          </Link>

          {/* Cryptographic Node Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-phosphor animate-pulse" />
            <span>MAINNET // SHA-256</span>
          </div>

          {/* Role Badges for logged-in users */}
          {user && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-phosphor/10 text-phosphor border border-phosphor/20 capitalize">
              {user.role.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Global Quick Verifier Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative flex-1 max-w-xs">
          <label htmlFor="globalSearchId" className="sr-only">Verify credential hash or ID</label>
          <input
            id="globalSearchId"
            name="globalSearchId"
            type="text"
            autoComplete="off"
            aria-label="Verify credential hash or ID"
            placeholder="Search credential hash / ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-slate-100 dark:bg-white/[0.04] text-slate-900 dark:text-slate-200 placeholder-slate-500 border border-slate-200 dark:border-white/10 rounded-lg focus:outline-none focus:border-phosphor focus:ring-1 focus:ring-phosphor transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
        </form>

        {/* Landing Page Quick Nav Anchor Links */}
        {isLanding && !user && (
          <div className="hidden xl:flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <a href="#architecture" className="hover:text-slate-900 dark:hover:text-white transition-colors">Architecture</a>
            <a href="#deconstruction" className="hover:text-slate-900 dark:hover:text-white transition-colors">3D Deconstruction</a>
            <a href="#tamper-engine" className="hover:text-slate-900 dark:hover:text-white transition-colors">Tamper Test</a>
            <a href="#protocol-lab" className="hover:text-slate-900 dark:hover:text-white transition-colors">Protocol Lab</a>
          </div>
        )}

        {/* Navigation Links, Theme Toggle & Action Gateway */}
        <nav className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {user ? (
            <>
              {user.role === "candidate" && (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/upload"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Upload</span>
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>
                </>
              )}

              {/* Issuer Staff Navigation */}
              {user.role === "issuer_staff" && (
                <>
                  <Link
                    href="/issuer/queue"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Queue
                  </Link>
                  <Link
                    href="/issuer/issue"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Issue
                  </Link>
                  <Link
                    href="/issuer/credentials"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Roster
                  </Link>
                  <Link
                    href="/issuer/chain"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Chain
                  </Link>
                </>
              )}

              {/* Platform Admin Navigation */}
              {user.role === "platform_admin" && (
                <>
                  <Link
                    href="/admin"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Overview
                  </Link>
                  <Link
                    href="/admin/institutions"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Institutions
                  </Link>
                  <Link
                    href="/admin/users"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Users
                  </Link>
                  <Link
                    href="/admin/audit-log"
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Audit Log
                  </Link>
                </>
              )}

              <button
                onClick={() => logout().then(() => router.push("/"))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg font-mono transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-obsidian hover:bg-slate-800 dark:hover:bg-slate-200 font-semibold rounded-lg shadow-sm font-mono tracking-tight transition-all"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
