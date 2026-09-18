"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Provenance application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 shadow-sm border border-amber-100">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Unexpected Error</span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-3">
        Something Went Wrong
      </h1>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
        An unexpected error occurred while loading this view. The issue has been recorded and integrity checks remain active.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-card hover:bg-gray-100 text-primary border border-gray-300 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <Home className="w-4 h-4 text-gray-500" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
