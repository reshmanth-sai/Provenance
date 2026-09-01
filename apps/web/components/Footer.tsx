import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface-card border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>Provenance Trust Network</span>
        </div>
        <p>Tamper-evident, cryptographically verifiable institutional credentials.</p>
        <p>© {new Date().getFullYear()} Provenance. All rights reserved.</p>
      </div>
    </footer>
  );
}
