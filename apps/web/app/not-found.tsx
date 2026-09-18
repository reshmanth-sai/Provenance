"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Search, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [searchId, setSearchId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify/${searchId.trim()}`);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 shadow-sm border border-red-100">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-accent mb-2">404 Error</span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-3">
        Page or Record Not Found
      </h1>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
        The page, profile, or credential record you requested could not be located. It may have been moved, renamed, or never issued.
      </p>

      {/* Direct Verifier Form */}
      <div className="w-full max-w-md mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Audit credential ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent shadow-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Verify</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-card hover:bg-gray-100 text-primary border border-gray-300 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Home className="w-4 h-4 text-gray-500" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
