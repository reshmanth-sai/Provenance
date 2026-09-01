"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Search, LogOut, User as UserIcon, FileText, PlusCircle, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchId, setSearchId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify/${searchId.trim()}`);
      setSearchId("");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-accent font-bold text-xl tracking-tight">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <span>Provenance</span>
          </Link>

          {/* Role Badges for logged in users */}
          {user && (
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-light text-accent capitalize">
              {user.role.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Global Quick Verifier Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Verify credential ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
        </form>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          {user ? (
            <>
              {user.role === "candidate" && (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-accent rounded-md transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden md:inline">Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/upload"
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-accent rounded-md transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Upload</span>
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-1.5 px-3 py-2 text-gray-700 hover:text-accent rounded-md transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden md:inline">Profile</span>
                  </Link>
                </>
              )}

              {/* Placeholder links for Phase 6B */}
              {user.role === "issuer_staff" && (
                <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded">
                  Issuer Console (Phase 6B)
                </span>
              )}
              {user.role === "platform_admin" && (
                <span className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded">
                  Admin Console (Phase 6B)
                </span>
              )}

              <button
                onClick={() => logout().then(() => router.push("/"))}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-gray-700 hover:text-accent font-medium rounded-md transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg shadow-sm transition-colors text-xs"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
