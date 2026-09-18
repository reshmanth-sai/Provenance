"use client";

import React from "react";
import CustomCursor from "../components/landing/CustomCursor";
import HeroTerminal from "../components/landing/HeroTerminal";
import KineticRibbon from "../components/landing/KineticRibbon";
import ExplodedCredential from "../components/landing/ExplodedCredential";
import TamperEngine from "../components/landing/TamperEngine";
import ProtocolInspector from "../components/landing/ProtocolInspector";
import TelemetryGrid from "../components/landing/TelemetryGrid";
import CtaPortal from "../components/landing/CtaPortal";

export default function HomePage() {
  return (
    <div className="relative bg-slate-50 dark:bg-obsidian text-slate-900 dark:text-slate-100 min-h-screen selection:bg-phosphor selection:text-obsidian transition-colors duration-300">
      {/* Precision Reticle & Cursor Follower */}
      <CustomCursor />

      {/* 1. Hero Section & Live In-Browser WebCrypto Lab */}
      <HeroTerminal />

      {/* 2. Kinetic Marquee Ledger Stream */}
      <KineticRibbon />

      {/* 3. Numa-Inspired 3D Isometric Credential Deconstruction */}
      <ExplodedCredential />

      {/* 4. Live Interactive Tamper Engine & Chain Stress Test */}
      <TamperEngine />

      {/* 5. Protocol Specification Inspector & cURL Terminal */}
      <ProtocolInspector />

      {/* 6. Brutalist Telemetry & Metric Assurances */}
      <TelemetryGrid />

      {/* 7. Architectural Gateway to Candidate & Issuer Portals */}
      <CtaPortal />
    </div>
  );
}
