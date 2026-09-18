import React from "react";
import Link from "next/link";
import { Shield, Terminal, ArrowUpRight, Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-obsidian border-t border-white/10 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 hairline-b">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-phosphor" />
              </div>
              <span className="font-display font-bold text-white text-base tracking-tight">Provenance</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Cryptographic credential verification protocol. Deterministic 6-stage document analysis, 
              per-issuer append-only hash chains, and zero-leakage public mathematical proofs.
            </p>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-phosphor" />
                <span>ECDSA-P256</span>
              </span>
              <span>•</span>
              <span>SHA-256 LEDGER</span>
              <span>•</span>
              <span className="text-phosphor">ZERO VENDOR TRUST</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">Protocol</h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li>
                <a href="#architecture" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Architecture</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="#deconstruction" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>3D Deconstruction</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="#tamper-engine" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Tamper Engine</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              </li>
              <li>
                <a href="#protocol-lab" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Specification Lab</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Network & Access */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">Portals</h4>
            <ul className="space-y-2 text-xs font-mono text-slate-400">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Platform Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Candidate Profile
                </Link>
              </li>
              <li>
                <Link href="/register/institution" className="hover:text-white transition-colors">
                  Institution Application
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Platform Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© {new Date().getFullYear()} Provenance Protocol Foundation. Immutable & Open-Source.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>NODE_LATENCY: 0.8ms</span>
            <span>CONSENSUS: SOLID</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
